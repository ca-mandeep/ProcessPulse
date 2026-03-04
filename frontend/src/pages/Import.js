import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { importAPI } from '../utils/api';
import { 
  Upload, 
  FileSpreadsheet, 
  Check, 
  AlertCircle, 
  ArrowRight,
  Trash2,
  Clock,
  FileText,
  RefreshCw,
  ChevronDown,
  Database,
  FileUp,
  Table,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Layers,
  Zap
} from 'lucide-react';

const Import = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [columnMapping, setColumnMapping] = useState({
    caseIdColumn: '',
    activityColumn: '',
    timestampColumn: '',
    resourceColumn: ''
  });
  const [processing, setProcessing] = useState(false);
  const [importHistory, setImportHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await importAPI.getHistory();
      setImportHistory(data.imports || []);
    } catch (err) {
      console.error('Failed to fetch import history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchHistory();
  }, [isAuthenticated, navigate, fetchHistory]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    const extension = selectedFile.name.split('.').pop().toLowerCase();
    const validExtensions = ['csv', 'xlsx', 'xls', 'json'];
    
    if (!validExtensions.includes(extension)) {
      setError('Please upload a CSV, Excel, or JSON file');
      return;
    }
    
    setFile(selectedFile);
    setError('');
    setUploadResult(null);
    setStep(1);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const result = await importAPI.uploadFile(file);
      setUploadResult(result);
      
      const columns = result.columns || [];
      const mapping = { caseIdColumn: '', activityColumn: '', timestampColumn: '', resourceColumn: '' };

      columns.forEach(col => {
        const colLower = col.toLowerCase();
        if (!mapping.caseIdColumn && (colLower.includes('case') || colLower.includes('order') || colLower.includes('id'))) {
          mapping.caseIdColumn = col;
        } else if (!mapping.activityColumn && (colLower.includes('activity') || colLower.includes('event') || colLower.includes('step') || colLower.includes('action'))) {
          mapping.activityColumn = col;
        } else if (!mapping.timestampColumn && (colLower.includes('timestamp') || colLower.includes('time') || colLower.includes('date'))) {
          mapping.timestampColumn = col;
        } else if (!mapping.resourceColumn && (colLower.includes('resource') || colLower.includes('user') || colLower.includes('agent') || colLower.includes('person'))) {
          mapping.resourceColumn = col;
        }
      });

      setColumnMapping(mapping);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleProcess = async () => {
    if (!uploadResult || !columnMapping.caseIdColumn || !columnMapping.activityColumn || !columnMapping.timestampColumn) {
      setError('Please map all required columns');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');
    setStep(3);

    try {
      const result = await importAPI.processImport(uploadResult.importId, columnMapping);
      setSuccess(`Successfully imported ${result.casesCreated} cases and ${result.eventsCreated} events!`);
      setFile(null);
      setUploadResult(null);
      setColumnMapping({ caseIdColumn: '', activityColumn: '', timestampColumn: '', resourceColumn: '' });
      setStep(1);
      fetchHistory();
    } catch (err) {
      setError(err.message || 'Failed to process import');
      setStep(2);
    } finally {
      setProcessing(false);
    }
  };

  const handleClearData = async () => {
    if (!window.confirm('Are you sure you want to clear ALL process data? This cannot be undone.')) {
      return;
    }

    try {
      await importAPI.clearAllData();
      setSuccess('All process data has been cleared');
      fetchHistory();
    } catch (err) {
      setError(err.message || 'Failed to clear data');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    if (ext === 'csv') return '📄';
    if (ext === 'xlsx' || ext === 'xls') return '📊';
    if (ext === 'json') return '📋';
    return '📁';
  };

  const StepIndicator = ({ number, title, active, completed }) => (
    <div className={`flex items-center gap-3 ${active ? 'text-blue-400' : completed ? 'text-green-400' : 'text-slate-500'}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm border-2 transition-all ${
        active ? 'bg-blue-600 border-blue-400 text-white' : 
        completed ? 'bg-green-600 border-green-400 text-white' : 
        'bg-slate-800 border-slate-600 text-slate-400'
      }`}>
        {completed ? <Check className="w-5 h-5" /> : number}
      </div>
      <span className={`font-medium ${active ? 'text-white' : ''}`}>{title}</span>
    </div>
  );

  const ColumnSelect = ({ label, required, value, onChange, columns, icon: Icon, description }) => (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-blue-400" />
        <label className="text-sm font-medium text-white">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      </div>
      <p className="text-xs text-slate-500 mb-3">{description}</p>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full py-2.5 px-4 bg-slate-900/50 border rounded-lg appearance-none cursor-pointer text-sm transition-all ${
            value ? 'border-green-500/50 text-white' : 'border-slate-600 text-slate-400'
          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
        >
          <option value="">Select column...</option>
          {columns?.map(col => (
            <option key={col} value={col}>{col}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        {value && <CheckCircle2 className="absolute right-8 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />}
      </div>
    </div>
  );

  return (
    <div className="fade-in p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
              </div>
              Data Import
            </h1>
            <p className="text-slate-400 mt-2">Import your process event data for analysis</p>
          </div>
          <button
            onClick={handleClearData}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-600/20 transition-all hover:border-red-500/50"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Data
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <span className="text-red-300">{error}</span>
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
            <span className="text-green-300">{success}</span>
            <button onClick={() => setSuccess('')} className="ml-auto text-green-400 hover:text-green-300">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-8 mb-8 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <StepIndicator number={1} title="Upload File" active={step === 1 && !uploadResult} completed={!!uploadResult} />
          <div className={`w-16 h-0.5 ${uploadResult ? 'bg-green-500' : 'bg-slate-700'}`} />
          <StepIndicator number={2} title="Map Columns" active={step === 2} completed={step === 3} />
          <div className={`w-16 h-0.5 ${step === 3 ? 'bg-green-500' : 'bg-slate-700'}`} />
          <StepIndicator number={3} title="Import" active={step === 3} completed={false} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileUp className="w-5 h-5 text-blue-400" />
                {uploadResult ? 'File Uploaded' : 'Upload Data File'}
              </h2>

              {!uploadResult ? (
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                    dragActive ? 'border-blue-400 bg-blue-500/10' : file ? 'border-green-500/50 bg-green-500/5' : 'border-slate-600 hover:border-slate-500'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('fileInput').click()}
                >
                  <input id="fileInput" type="file" accept=".csv,.xlsx,.xls,.json" onChange={handleFileChange} className="hidden" />
                  
                  {file ? (
                    <div className="py-4">
                      <div className="text-5xl mb-4">{getFileIcon(file.name)}</div>
                      <p className="text-white font-medium text-lg">{file.name}</p>
                      <p className="text-slate-400 text-sm mt-1">{formatFileSize(file.size)}</p>
                      <p className="text-green-400 text-sm mt-2 flex items-center justify-center gap-1">
                        <Check className="w-4 h-4" /> Ready to upload
                      </p>
                    </div>
                  ) : (
                    <div className="py-4">
                      <FileSpreadsheet className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                      <p className="text-white font-medium text-lg">Drop your file here</p>
                      <p className="text-slate-400 text-sm mt-1">or click to browse</p>
                      <div className="flex items-center justify-center gap-4 mt-4">
                        <span className="px-3 py-1 bg-slate-700/50 rounded-full text-xs text-slate-300">CSV</span>
                        <span className="px-3 py-1 bg-slate-700/50 rounded-full text-xs text-slate-300">Excel</span>
                        <span className="px-3 py-1 bg-slate-700/50 rounded-full text-xs text-slate-300">JSON</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <div className="text-4xl">{getFileIcon(file?.name)}</div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{uploadResult.fileName}</p>
                    <p className="text-slate-400 text-sm">{uploadResult.rowCount} rows • {uploadResult.columns?.length} columns</p>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                </div>
              )}

              {file && !uploadResult && (
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  {uploading ? <><RefreshCw className="w-5 h-5 animate-spin" /> Analyzing file...</> : <><Zap className="w-5 h-5" /> Upload & Analyze</>}
                </button>
              )}
            </div>

            {uploadResult && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-400" />
                  Map Your Columns
                </h2>
                <p className="text-slate-400 text-sm mb-4">Match your file columns to the required data fields</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <ColumnSelect label="Case ID" required value={columnMapping.caseIdColumn} onChange={(v) => setColumnMapping({...columnMapping, caseIdColumn: v})} columns={uploadResult.columns} icon={Database} description="Unique identifier for each process instance" />
                  <ColumnSelect label="Activity" required value={columnMapping.activityColumn} onChange={(v) => setColumnMapping({...columnMapping, activityColumn: v})} columns={uploadResult.columns} icon={Zap} description="Name of the process step or event" />
                  <ColumnSelect label="Timestamp" required value={columnMapping.timestampColumn} onChange={(v) => setColumnMapping({...columnMapping, timestampColumn: v})} columns={uploadResult.columns} icon={Clock} description="When the activity occurred" />
                  <ColumnSelect label="Resource" required={false} value={columnMapping.resourceColumn} onChange={(v) => setColumnMapping({...columnMapping, resourceColumn: v})} columns={uploadResult.columns} icon={FileText} description="Who performed the activity (optional)" />
                </div>

                <button
                  onClick={handleProcess}
                  disabled={processing || !columnMapping.caseIdColumn || !columnMapping.activityColumn || !columnMapping.timestampColumn}
                  className="w-full py-3.5 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  {processing ? <><RefreshCw className="w-5 h-5 animate-spin" /> Importing data...</> : <><ArrowRight className="w-5 h-5" /> Start Import</>}
                </button>

                {uploadResult.preview?.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                      <Table className="w-4 h-4" /> Data Preview
                    </h4>
                    <div className="overflow-x-auto rounded-lg border border-slate-700">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-700/50">
                            {uploadResult.columns?.slice(0, 5).map(col => (
                              <th key={col} className="px-4 py-2.5 text-left text-slate-300 font-medium whitespace-nowrap">
                                {col}
                                {col === columnMapping.caseIdColumn && <span className="ml-1 text-blue-400">●</span>}
                                {col === columnMapping.activityColumn && <span className="ml-1 text-purple-400">●</span>}
                                {col === columnMapping.timestampColumn && <span className="ml-1 text-green-400">●</span>}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {uploadResult.preview.slice(0, 4).map((row, idx) => (
                            <tr key={idx} className="border-t border-slate-700/50 hover:bg-slate-700/30">
                              {uploadResult.columns?.slice(0, 5).map(col => (
                                <td key={col} className="px-4 py-2 text-slate-400 truncate max-w-40">{String(row[col] || '-')}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="card p-5" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))' }}>
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <HelpCircle className="w-4 h-4" /> Quick Guide
              </h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">1.</span> Upload a CSV, Excel, or JSON file</li>
                <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">2.</span> Map columns to required fields</li>
                <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">3.</span> Click Import to start analysis</li>
              </ul>
            </div>

            <div className="card p-5">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" /> Import History
              </h3>

              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                </div>
              ) : importHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No imports yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {importHistory.map((imp) => (
                    <div key={imp._id} className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{imp.originalFilename}</p>
                          <p className="text-slate-500 text-xs mt-1">{formatDate(imp.createdAt)}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${imp.status === 'completed' ? 'bg-green-500/20 text-green-400' : imp.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {imp.status}
                        </span>
                      </div>
                      {imp.casesCreated && <p className="text-slate-400 text-xs mt-2">{imp.casesCreated} cases • {imp.eventsCreated} events</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-5">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-slate-400" /> Expected Format
              </h3>
              <div className="text-sm text-slate-400 space-y-2">
                <div className="flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full"></span><span><strong className="text-slate-300">Case ID</strong> - Unique per process</span></div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 bg-purple-500 rounded-full"></span><span><strong className="text-slate-300">Activity</strong> - Step/event name</span></div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span><span><strong className="text-slate-300">Timestamp</strong> - When it occurred</span></div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 bg-slate-500 rounded-full"></span><span><strong className="text-slate-300">Resource</strong> - Who did it (optional)</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Import;
