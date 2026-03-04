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
  ChevronDown
} from 'lucide-react';

const Import = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [file, setFile] = useState(null);
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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/json'
      ];
      
      const extension = selectedFile.name.split('.').pop().toLowerCase();
      const validExtensions = ['csv', 'xlsx', 'xls', 'json'];
      
      if (!validTypes.includes(selectedFile.type) && !validExtensions.includes(extension)) {
        setError('Please upload a CSV, Excel, or JSON file');
        return;
      }
      
      setFile(selectedFile);
      setError('');
      setUploadResult(null);
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
      
      // Auto-map columns if possible
      const columns = result.columns || [];
      const mapping = {
        caseIdColumn: '',
        activityColumn: '',
        timestampColumn: '',
        resourceColumn: ''
      };

      columns.forEach(col => {
        const colLower = col.toLowerCase();
        if (colLower.includes('case') && colLower.includes('id')) {
          mapping.caseIdColumn = col;
        } else if (colLower.includes('activity') || colLower.includes('event')) {
          mapping.activityColumn = col;
        } else if (colLower.includes('timestamp') || colLower.includes('time') || colLower.includes('date')) {
          mapping.timestampColumn = col;
        } else if (colLower.includes('resource') || colLower.includes('user') || colLower.includes('agent')) {
          mapping.resourceColumn = col;
        }
      });

      setColumnMapping(mapping);
    } catch (err) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleProcess = async () => {
    if (!uploadResult || !columnMapping.caseIdColumn || !columnMapping.activityColumn || !columnMapping.timestampColumn) {
      setError('Please map all required columns (Case ID, Activity, Timestamp)');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const result = await importAPI.processImport(uploadResult.importId, columnMapping);
      setSuccess(`Successfully imported ${result.casesCreated} cases and ${result.eventsCreated} events!`);
      setFile(null);
      setUploadResult(null);
      setColumnMapping({
        caseIdColumn: '',
        activityColumn: '',
        timestampColumn: '',
        resourceColumn: ''
      });
      fetchHistory();
    } catch (err) {
      setError(err.message || 'Failed to process import');
    } finally {
      setProcessing(false);
    }
  };

  const handleClearData = async () => {
    if (!window.confirm('Are you sure you want to clear ALL process data? This action cannot be undone.')) {
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Data Import</h1>
          <p className="text-slate-400 mt-1">Import CSV, Excel, or JSON files with process event data</p>
        </div>
        <button
          onClick={handleClearData}
          className="flex items-center gap-2 px-4 py-2 bg-red-600/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Clear All Data
        </button>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span className="text-red-300">{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-3">
          <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
          <span className="text-green-300">{success}</span>
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-400" />
          Upload File
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* File Upload */}
          <div>
            <label className="block border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-blue-500/50 transition-colors cursor-pointer">
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.json"
                onChange={handleFileChange}
                className="hidden"
              />
              <FileSpreadsheet className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              {file ? (
                <div>
                  <p className="text-white font-medium">{file.name}</p>
                  <p className="text-slate-400 text-sm mt-1">{formatFileSize(file.size)}</p>
                </div>
              ) : (
                <div>
                  <p className="text-white font-medium">Drop file here or click to browse</p>
                  <p className="text-slate-400 text-sm mt-1">Supports CSV, Excel, JSON (max 50MB)</p>
                </div>
              )}
            </label>

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload & Preview
                </>
              )}
            </button>
          </div>

          {/* Column Mapping */}
          {uploadResult && (
            <div className="space-y-4">
              <h3 className="text-white font-medium">Map Columns</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Case ID Column *</label>
                  <div className="relative">
                    <select
                      value={columnMapping.caseIdColumn}
                      onChange={(e) => setColumnMapping({...columnMapping, caseIdColumn: e.target.value})}
                      className="w-full py-2 px-3 bg-slate-700 border border-slate-600 rounded-lg text-white appearance-none cursor-pointer"
                    >
                      <option value="">Select column...</option>
                      {uploadResult.columns?.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Activity Column *</label>
                  <div className="relative">
                    <select
                      value={columnMapping.activityColumn}
                      onChange={(e) => setColumnMapping({...columnMapping, activityColumn: e.target.value})}
                      className="w-full py-2 px-3 bg-slate-700 border border-slate-600 rounded-lg text-white appearance-none cursor-pointer"
                    >
                      <option value="">Select column...</option>
                      {uploadResult.columns?.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Timestamp Column *</label>
                  <div className="relative">
                    <select
                      value={columnMapping.timestampColumn}
                      onChange={(e) => setColumnMapping({...columnMapping, timestampColumn: e.target.value})}
                      className="w-full py-2 px-3 bg-slate-700 border border-slate-600 rounded-lg text-white appearance-none cursor-pointer"
                    >
                      <option value="">Select column...</option>
                      {uploadResult.columns?.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Resource Column (optional)</label>
                  <div className="relative">
                    <select
                      value={columnMapping.resourceColumn}
                      onChange={(e) => setColumnMapping({...columnMapping, resourceColumn: e.target.value})}
                      className="w-full py-2 px-3 bg-slate-700 border border-slate-600 rounded-lg text-white appearance-none cursor-pointer"
                    >
                      <option value="">Select column...</option>
                      {uploadResult.columns?.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <button
                onClick={handleProcess}
                disabled={processing || !columnMapping.caseIdColumn || !columnMapping.activityColumn || !columnMapping.timestampColumn}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-5 h-5" />
                    Import Data
                  </>
                )}
              </button>

              {/* Preview */}
              {uploadResult.preview && uploadResult.preview.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm text-slate-400 mb-2">Preview (first {uploadResult.preview.length} rows)</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-700">
                          {uploadResult.columns?.slice(0, 5).map(col => (
                            <th key={col} className="px-3 py-2 text-left text-slate-300 font-medium">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {uploadResult.preview.slice(0, 3).map((row, idx) => (
                          <tr key={idx} className="border-t border-slate-700">
                            {uploadResult.columns?.slice(0, 5).map(col => (
                              <td key={col} className="px-3 py-2 text-slate-400 truncate max-w-32">
                                {String(row[col] || '')}
                              </td>
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
      </div>

      {/* Import History */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          Import History
        </h2>

        {loadingHistory ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
        ) : importHistory.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No import history found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-700/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">File</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Records</th>
                </tr>
              </thead>
              <tbody>
                {importHistory.map((imp) => (
                  <tr key={imp._id} className="border-t border-slate-700/50">
                    <td className="px-4 py-3 text-white">{imp.originalFilename}</td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(imp.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        imp.status === 'completed' 
                          ? 'bg-green-500/20 text-green-400'
                          : imp.status === 'failed'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {imp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{imp.totalRecords || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* File Format Guide */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Expected File Format</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="text-slate-300 font-medium mb-2">Required Columns:</h3>
            <ul className="text-slate-400 space-y-1">
              <li>• <span className="text-blue-400">Case ID</span> - Unique identifier for each process instance</li>
              <li>• <span className="text-blue-400">Activity</span> - Name of the process step/event</li>
              <li>• <span className="text-blue-400">Timestamp</span> - When the activity occurred</li>
            </ul>
          </div>
          <div>
            <h3 className="text-slate-300 font-medium mb-2">Optional Columns:</h3>
            <ul className="text-slate-400 space-y-1">
              <li>• <span className="text-green-400">Resource</span> - Who performed the activity</li>
              <li>• Any additional attributes will be stored as event metadata</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Import;
