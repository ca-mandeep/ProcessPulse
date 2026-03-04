const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const DataImport = require('../models/DataImport');
const ProcessEvent = require('../models/ProcessEvent');
const Case = require('../models/Case');
const ProcessTransition = require('../models/ProcessTransition');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Use /tmp for cloud deployments (Render, Heroku) or local uploads folder
    const uploadDir = process.env.NODE_ENV === 'production' 
      ? '/tmp/uploads' 
      : path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.csv', '.xlsx', '.xls', '.json'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: CSV, XLSX, JSON'), false);
  }
};

exports.upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// @desc    Upload and preview file
// @route   POST /api/import/upload
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a file' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase().slice(1);
    let data = [];
    let columns = [];

    // Parse file to get preview
    if (ext === 'csv') {
      data = await parseCSV(req.file.path, 10);
    } else if (ext === 'xlsx' || ext === 'xls') {
      data = parseExcel(req.file.path, 10);
    } else if (ext === 'json') {
      const content = fs.readFileSync(req.file.path, 'utf8');
      const parsed = JSON.parse(content);
      data = Array.isArray(parsed) ? parsed.slice(0, 10) : [parsed];
    }

    if (data.length > 0) {
      columns = Object.keys(data[0]);
    }

    // Create import record
    const dataImport = await DataImport.create({
      user: req.user._id,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileType: ext,
      status: 'pending'
    });

    res.json({
      success: true,
      importId: dataImport._id,
      fileName: req.file.originalname,
      columns,
      preview: data,
      rowCount: data.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Process imported file with column mapping
// @route   POST /api/import/process/:importId
exports.processImport = async (req, res) => {
  try {
    const { importId } = req.params;
    const { columnMapping } = req.body;

    // Normalize column mapping names (frontend uses 'caseIdColumn', backend expects 'caseId')
    const normalizedMapping = {
      caseId: columnMapping.caseIdColumn || columnMapping.caseId,
      activity: columnMapping.activityColumn || columnMapping.activity,
      timestamp: columnMapping.timestampColumn || columnMapping.timestamp,
      resource: columnMapping.resourceColumn || columnMapping.resource
    };

    // Validate required mappings
    if (!normalizedMapping.caseId || !normalizedMapping.activity || !normalizedMapping.timestamp) {
      return res.status(400).json({ 
        error: 'Required mappings: caseId, activity, timestamp' 
      });
    }

    const dataImport = await DataImport.findById(importId);
    if (!dataImport) {
      return res.status(404).json({ error: 'Import not found' });
    }

    if (dataImport.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update status to processing
    dataImport.status = 'processing';
    dataImport.columnMapping = columnMapping;
    await dataImport.save();

    // Parse full file - use same directory logic as upload
    const uploadDir = process.env.NODE_ENV === 'production' 
      ? '/tmp/uploads' 
      : path.join(__dirname, '../uploads');
    const filePath = path.join(uploadDir, dataImport.fileName);
    let data = [];

    if (!fs.existsSync(filePath)) {
      throw new Error('Upload file not found. Please re-upload the file.');
    }

    if (dataImport.fileType === 'csv') {
      data = await parseCSV(filePath);
    } else if (dataImport.fileType === 'xlsx' || dataImport.fileType === 'xls') {
      data = parseExcel(filePath);
    } else if (dataImport.fileType === 'json') {
      const content = fs.readFileSync(filePath, 'utf8');
      data = JSON.parse(content);
    }

    // Process and import data
    const result = await importProcessData(data, normalizedMapping, req.user._id);

    // Update import record
    dataImport.status = 'completed';
    dataImport.recordsImported = result.eventsCreated;
    dataImport.casesCreated = result.casesCreated;
    dataImport.eventsCreated = result.eventsCreated;
    await dataImport.save();

    // Clean up file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'Import completed successfully',
      casesCreated: result.casesCreated,
      eventsCreated: result.eventsCreated,
      transitionsCreated: result.transitionsCreated
    });
  } catch (error) {
    const dataImport = await DataImport.findById(req.params.importId);
    if (dataImport) {
      dataImport.status = 'failed';
      dataImport.errorMessage = error.message;
      await dataImport.save();
    }
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get import history
// @route   GET /api/import/history
exports.getImportHistory = async (req, res) => {
  try {
    const imports = await DataImport.find({ user: req.user._id })
      .sort({ importedAt: -1 })
      .limit(20);

    res.json({ success: true, imports });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete all data
// @route   DELETE /api/import/clear
exports.clearAllData = async (req, res) => {
  try {
    await Promise.all([
      ProcessEvent.deleteMany({}),
      Case.deleteMany({}),
      ProcessTransition.deleteMany({})
    ]);

    res.json({ success: true, message: 'All process data cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper: Parse CSV file
function parseCSV(filePath, limit = null) {
  return new Promise((resolve, reject) => {
    const results = [];
    let count = 0;
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        if (limit && count >= limit) return;
        results.push(data);
        count++;
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// Helper: Parse Excel file
function parseExcel(filePath, limit = null) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  return limit ? data.slice(0, limit) : data;
}

// Helper: Parse timestamp with multiple format support
function parseTimestamp(value) {
  if (!value) return null;
  
  // If it's already a Date object
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  
  // If it's a number (Excel serial date)
  if (typeof value === 'number') {
    // Excel date serial number (days since 1900-01-01)
    const date = new Date((value - 25569) * 86400 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }
  
  // If it's a string, try multiple formats
  const str = String(value).trim();
  
  // Try standard Date parsing first
  let date = new Date(str);
  if (!isNaN(date.getTime())) return date;
  
  // Try common date formats
  const formats = [
    // DD/MM/YYYY HH:mm:ss
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):?(\d{2})?$/,
    // DD-MM-YYYY HH:mm:ss
    /^(\d{1,2})-(\d{1,2})-(\d{4})\s+(\d{1,2}):(\d{2}):?(\d{2})?$/,
    // DD.MM.YYYY HH:mm:ss
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2}):?(\d{2})?$/,
  ];
  
  for (const regex of formats) {
    const match = str.match(regex);
    if (match) {
      const [, day, month, year, hours, minutes, seconds = '0'] = match;
      date = new Date(year, month - 1, day, hours, minutes, seconds);
      if (!isNaN(date.getTime())) return date;
    }
  }
  
  // Try date only formats
  const dateOnlyFormats = [
    // DD/MM/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // DD-MM-YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    // DD.MM.YYYY
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
  ];
  
  for (const regex of dateOnlyFormats) {
    const match = str.match(regex);
    if (match) {
      const [, day, month, year] = match;
      date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) return date;
    }
  }
  
  // Try YYYY-MM-DD format (ISO-like)
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{2}):?(\d{2})?)?/);
  if (isoMatch) {
    const [, year, month, day, hours = '0', minutes = '0', seconds = '0'] = isoMatch;
    date = new Date(year, month - 1, day, hours, minutes, seconds);
    if (!isNaN(date.getTime())) return date;
  }
  
  // Unix timestamp (seconds or milliseconds)
  const numValue = Number(str);
  if (!isNaN(numValue)) {
    // If it looks like seconds (before year 2100)
    if (numValue < 4102444800) {
      date = new Date(numValue * 1000);
    } else {
      date = new Date(numValue);
    }
    if (!isNaN(date.getTime())) return date;
  }
  
  return null;
}

// Helper: Import process data
async function importProcessData(data, mapping, userId) {
  const casesMap = new Map();
  const eventsToInsert = [];
  const transitionMap = new Map();
  let skippedRows = 0;

  // Process each row
  for (const row of data) {
    const caseId = String(row[mapping.caseId] || '').trim();
    const activity = String(row[mapping.activity] || '').trim();
    const timestampRaw = row[mapping.timestamp];

    if (!caseId || !activity || !timestampRaw) {
      skippedRows++;
      continue;
    }

    // Parse timestamp with multiple format support
    let timestamp = parseTimestamp(timestampRaw);

    if (!timestamp || isNaN(timestamp.getTime())) {
      skippedRows++;
      continue;
    }

    // Create event
    const event = {
      caseId,
      activity,
      timestamp,
      resource: mapping.resource ? String(row[mapping.resource] || 'System') : 'System',
      department: mapping.department ? String(row[mapping.department] || '') : '',
      cost: mapping.cost ? parseFloat(row[mapping.cost]) || 0 : 0,
      attributes: { importedBy: userId }
    };

    eventsToInsert.push(event);

    // Track cases
    if (!casesMap.has(caseId)) {
      casesMap.set(caseId, {
        caseId,
        startTime: timestamp,
        endTime: timestamp,
        events: []
      });
    }

    const caseData = casesMap.get(caseId);
    caseData.events.push({ activity, timestamp });
    if (timestamp < caseData.startTime) caseData.startTime = timestamp;
    if (timestamp > caseData.endTime) caseData.endTime = timestamp;
  }

  // Insert events in batches
  const batchSize = 1000;
  for (let i = 0; i < eventsToInsert.length; i += batchSize) {
    await ProcessEvent.insertMany(eventsToInsert.slice(i, i + batchSize));
  }

  // Create cases
  const casesToInsert = [];
  for (const [caseId, caseData] of casesMap) {
    // Sort events by timestamp
    caseData.events.sort((a, b) => a.timestamp - b.timestamp);
    
    // Determine variant (path)
    const variant = caseData.events.map(e => e.activity).join(' → ');
    const shortVariant = caseData.events.length > 3 
      ? `${caseData.events[0].activity} → ... → ${caseData.events[caseData.events.length - 1].activity}`
      : variant;

    casesToInsert.push({
      caseId,
      startTime: caseData.startTime,
      endTime: caseData.endTime,
      status: 'Completed',
      variant: shortVariant,
      customer: 'Imported',
      orderValue: 0,
      priority: 'Medium',
      region: 'Unknown'
    });

    // Track transitions
    for (let i = 0; i < caseData.events.length - 1; i++) {
      const from = caseData.events[i];
      const to = caseData.events[i + 1];
      const key = `${from.activity}|${to.activity}`;
      const duration = to.timestamp - from.timestamp;

      if (!transitionMap.has(key)) {
        transitionMap.set(key, {
          fromActivity: from.activity,
          toActivity: to.activity,
          count: 0,
          totalDuration: 0,
          minDuration: Infinity,
          maxDuration: 0
        });
      }

      const trans = transitionMap.get(key);
      trans.count++;
      trans.totalDuration += duration;
      trans.minDuration = Math.min(trans.minDuration, duration);
      trans.maxDuration = Math.max(trans.maxDuration, duration);
    }
  }

  await Case.insertMany(casesToInsert);

  // Create transitions
  const transitions = Array.from(transitionMap.values()).map(t => ({
    fromActivity: t.fromActivity,
    toActivity: t.toActivity,
    count: t.count,
    avgDuration: Math.round(t.totalDuration / t.count),
    minDuration: t.minDuration === Infinity ? 0 : t.minDuration,
    maxDuration: t.maxDuration,
    totalDuration: t.totalDuration
  }));

  if (transitions.length > 0) {
    await ProcessTransition.insertMany(transitions);
  }

  return {
    casesCreated: casesToInsert.length,
    eventsCreated: eventsToInsert.length,
    transitionsCreated: transitions.length
  };
}
