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
  CheckCircle,
  XCircle,
  Layers,
  Zap,
  History,
  Sparkles
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

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)',
      padding: '32px',
      position: 'relative'
    },
    maxWidth: {
      maxWidth: '1400px',
      margin: '0 auto'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '32px'
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    headerIcon: {
      width: '56px',
      height: '56px',
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 10px 40px rgba(99, 102, 241, 0.3)'
    },
    headerTitle: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: '4px'
    },
    headerSubtitle: {
      fontSize: '14px',
      color: '#a0a0b8'
    },
    clearButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 20px',
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: '12px',
      color: '#f87171',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    alertBox: {
      padding: '16px 20px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '24px'
    },
    alertError: {
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)'
    },
    alertSuccess: {
      background: 'rgba(16, 185, 129, 0.1)',
      border: '1px solid rgba(16, 185, 129, 0.3)'
    },
    stepBar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '24px',
      padding: '24px',
      background: 'rgba(30, 30, 53, 0.6)',
      backdropFilter: 'blur(10px)',
      borderRadius: '16px',
      border: '1px solid rgba(99, 102, 241, 0.2)',
      marginBottom: '32px'
    },
    stepItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    stepCircle: {
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '600',
      fontSize: '16px',
      transition: 'all 0.3s ease'
    },
    stepLine: {
      width: '80px',
      height: '3px',
      borderRadius: '2px',
      transition: 'background 0.3s ease'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: '24px'
    },
    card: {
      background: 'rgba(30, 30, 53, 0.8)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      padding: '28px',
      border: '1px solid rgba(99, 102, 241, 0.15)',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '20px'
    },
    dropzone: {
      border: '2px dashed',
      borderRadius: '16px',
      padding: '48px 24px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    dropzoneDefault: {
      borderColor: '#3d3d5c',
      background: 'rgba(37, 37, 66, 0.3)'
    },
    dropzoneActive: {
      borderColor: '#6366f1',
      background: 'rgba(99, 102, 241, 0.1)'
    },
    dropzoneWithFile: {
      borderColor: 'rgba(16, 185, 129, 0.5)',
      background: 'rgba(16, 185, 129, 0.05)'
    },
    fileTypeBadge: {
      padding: '6px 14px',
      background: 'rgba(99, 102, 241, 0.15)',
      borderRadius: '20px',
      fontSize: '12px',
      color: '#a0a0b8',
      fontWeight: '500'
    },
    uploadButton: {
      width: '100%',
      padding: '16px',
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      border: 'none',
      borderRadius: '12px',
      color: '#ffffff',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      marginTop: '20px',
      boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
      transition: 'all 0.2s ease'
    },
    columnMapCard: {
      background: 'rgba(37, 37, 66, 0.5)',
      borderRadius: '14px',
      padding: '18px',
      border: '1px solid rgba(99, 102, 241, 0.1)',
      transition: 'all 0.2s ease'
    },
    columnLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '8px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#ffffff'
    },
    columnDesc: {
      fontSize: '12px',
      color: '#6b6b82',
      marginBottom: '12px'
    },
    selectWrapper: {
      position: 'relative'
    },
    select: {
      width: '100%',
      padding: '12px 40px 12px 14px',
      background: 'rgba(15, 15, 26, 0.6)',
      border: '2px solid rgba(45, 45, 74, 0.8)',
      borderRadius: '10px',
      color: '#ffffff',
      fontSize: '14px',
      appearance: 'none',
      cursor: 'pointer',
      outline: 'none',
      transition: 'all 0.2s ease'
    },
    selectFilled: {
      borderColor: 'rgba(16, 185, 129, 0.5)'
    },
    processButton: {
      width: '100%',
      padding: '18px',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      border: 'none',
      borderRadius: '12px',
      color: '#ffffff',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      marginTop: '24px',
      boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
      transition: 'all 0.2s ease'
    },
    disabledButton: {
      background: '#2d2d4a',
      boxShadow: 'none',
      cursor: 'not-allowed',
      opacity: 0.6
    },
    historyCard: {
      background: 'rgba(30, 30, 53, 0.8)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      padding: '24px',
      border: '1px solid rgba(139, 92, 246, 0.15)',
      height: 'fit-content'
    },
    historyItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '14px',
      background: 'rgba(37, 37, 66, 0.5)',
      borderRadius: '12px',
      marginBottom: '10px',
      border: '1px solid rgba(99, 102, 241, 0.1)'
    },
    historyIcon: {
      fontSize: '28px'
    },
    historyInfo: {
      flex: 1
    },
    historyFileName: {
      fontSize: '14px',
      color: '#ffffff',
      fontWeight: '500',
      marginBottom: '2px'
    },
    historyMeta: {
      fontSize: '12px',
      color: '#6b6b82'
    },
    historyBadge: {
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: '600'
    },
    spinner: {
      width: '20px',
      height: '20px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderTopColor: '#ffffff',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    },
    previewTable: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '20px',
      borderRadius: '12px',
      overflow: 'hidden'
    },
    previewTh: {
      padding: '12px 16px',
      background: 'rgba(99, 102, 241, 0.15)',
      color: '#a0a0b8',
      fontSize: '13px',
      fontWeight: '600',
      textAlign: 'left',
      borderBottom: '1px solid rgba(99, 102, 241, 0.2)'
    },
    previewTd: {
      padding: '10px 16px',
      color: '#d1d1e0',
      fontSize: '13px',
      borderBottom: '1px solid rgba(45, 45, 74, 0.5)'
    }
  };

  const StepIndicator = ({ number, title, active, completed }) => (
    <div style={styles.stepItem}>
      <div style={{
        ...styles.stepCircle,
        background: completed ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 
                   active ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 
                   'rgba(45, 45, 74, 0.8)',
        border: completed ? 'none' : active ? 'none' : '2px solid #3d3d5c',
        color: completed || active ? '#ffffff' : '#6b6b82',
        boxShadow: active ? '0 4px 20px rgba(99, 102, 241, 0.4)' : 
                   completed ? '0 4px 20px rgba(16, 185, 129, 0.4)' : 'none'
      }}>
        {completed ? <Check size={20} /> : number}
      </div>
      <span style={{
        fontSize: '14px',
        fontWeight: '500',
        color: active || completed ? '#ffffff' : '#6b6b82'
      }}>{title}</span>
    </div>
  );

  const ColumnSelect = ({ label, required, value, onChange, columns, icon: Icon, description }) => (
    <div style={styles.columnMapCard}>
      <div style={styles.columnLabel}>
        <Icon size={16} color="#6366f1" />
        {label} {required && <span style={{ color: '#f87171' }}>*</span>}
      </div>
      <div style={styles.columnDesc}>{description}</div>
      <div style={styles.selectWrapper}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            ...styles.select,
            ...(value ? styles.selectFilled : {})
          }}
        >
          <option value="">Select column...</option>
          {columns?.map(col => (
            <option key={col} value={col}>{col}</option>
          ))}
        </select>
        <ChevronDown size={18} color="#6b6b82" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        {value && <CheckCircle size={16} color="#10b981" style={{ position: 'absolute', right: '38px', top: '50%', transform: 'translateY(-50%)' }} />}
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        select option {
          background: #1e1e35;
          color: #ffffff;
        }
        @media (max-width: 1024px) {
          .import-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={styles.maxWidth}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.headerIcon}>
              <Database size={28} color="#ffffff" />
            </div>
            <div>
              <h1 style={styles.headerTitle}>Data Import</h1>
              <p style={styles.headerSubtitle}>Import your process event data for analysis</p>
            </div>
          </div>
          <button
            onClick={handleClearData}
            style={styles.clearButton}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            }}
          >
            <Trash2 size={18} />
            Clear All Data
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ ...styles.alertBox, ...styles.alertError }}>
            <AlertCircle size={20} color="#f87171" />
            <span style={{ color: '#fca5a5', flex: 1 }}>{error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <XCircle size={20} color="#f87171" />
            </button>
          </div>
        )}
        {success && (
          <div style={{ ...styles.alertBox, ...styles.alertSuccess }}>
            <CheckCircle size={20} color="#34d399" />
            <span style={{ color: '#6ee7b7', flex: 1 }}>{success}</span>
            <button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <XCircle size={20} color="#34d399" />
            </button>
          </div>
        )}

        {/* Step Indicator */}
        <div style={styles.stepBar}>
          <StepIndicator number={1} title="Upload File" active={step === 1 && !uploadResult} completed={!!uploadResult} />
          <div style={{ ...styles.stepLine, background: uploadResult ? 'linear-gradient(90deg, #10b981, #6366f1)' : '#2d2d4a' }} />
          <StepIndicator number={2} title="Map Columns" active={step === 2} completed={step === 3} />
          <div style={{ ...styles.stepLine, background: step === 3 ? 'linear-gradient(90deg, #10b981, #6366f1)' : '#2d2d4a' }} />
          <StepIndicator number={3} title="Import Data" active={step === 3} completed={false} />
        </div>

        {/* Main Grid */}
        <div className="import-grid" style={styles.grid}>
          {/* Left Column - Upload & Mapping */}
          <div>
            {/* Upload Card */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>
                <FileUp size={22} color="#6366f1" />
                {uploadResult ? 'File Uploaded' : 'Upload Data File'}
              </h2>

              {!uploadResult ? (
                <>
                  <div
                    style={{
                      ...styles.dropzone,
                      ...(dragActive ? styles.dropzoneActive : file ? styles.dropzoneWithFile : styles.dropzoneDefault)
                    }}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('fileInput').click()}
                  >
                    <input id="fileInput" type="file" accept=".csv,.xlsx,.xls,.json" onChange={handleFileChange} style={{ display: 'none' }} />
                    
                    {file ? (
                      <>
                        <div style={{ fontSize: '56px', marginBottom: '16px' }}>{getFileIcon(file.name)}</div>
                        <p style={{ color: '#ffffff', fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>{file.name}</p>
                        <p style={{ color: '#a0a0b8', fontSize: '14px', marginBottom: '12px' }}>{formatFileSize(file.size)}</p>
                        <p style={{ color: '#10b981', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <Check size={18} /> Ready to upload
                        </p>
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet size={64} color="#4a4a6a" style={{ marginBottom: '16px' }} />
                        <p style={{ color: '#ffffff', fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>Drop your file here</p>
                        <p style={{ color: '#6b6b82', fontSize: '14px', marginBottom: '20px' }}>or click to browse</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                          <span style={styles.fileTypeBadge}>CSV</span>
                          <span style={styles.fileTypeBadge}>Excel</span>
                          <span style={styles.fileTypeBadge}>JSON</span>
                        </div>
                      </>
                    )}
                  </div>

                  {file && (
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      style={{
                        ...styles.uploadButton,
                        ...(uploading ? styles.disabledButton : {})
                      }}
                    >
                      {uploading ? (
                        <>
                          <div style={styles.spinner}></div>
                          Analyzing file...
                        </>
                      ) : (
                        <>
                          <Sparkles size={20} />
                          Upload & Analyze
                        </>
                      )}
                    </button>
                  )}
                </>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '20px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '14px'
                }}>
                  <div style={{ fontSize: '48px' }}>{getFileIcon(file?.name)}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#ffffff', fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{uploadResult.fileName}</p>
                    <p style={{ color: '#a0a0b8', fontSize: '13px' }}>{uploadResult.rowCount} rows • {uploadResult.columns?.length} columns</p>
                  </div>
                  <CheckCircle size={28} color="#10b981" />
                </div>
              )}
            </div>

            {/* Column Mapping Card */}
            {uploadResult && (
              <div style={{ ...styles.card, marginTop: '24px' }}>
                <h2 style={styles.cardTitle}>
                  <Layers size={22} color="#8b5cf6" />
                  Map Your Columns
                </h2>
                <p style={{ color: '#6b6b82', fontSize: '14px', marginBottom: '20px' }}>Match your file columns to the required data fields</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <ColumnSelect label="Case ID" required value={columnMapping.caseIdColumn} onChange={(v) => setColumnMapping({...columnMapping, caseIdColumn: v})} columns={uploadResult.columns} icon={Database} description="Unique identifier for each process instance" />
                  <ColumnSelect label="Activity" required value={columnMapping.activityColumn} onChange={(v) => setColumnMapping({...columnMapping, activityColumn: v})} columns={uploadResult.columns} icon={Zap} description="Name of the process step or event" />
                  <ColumnSelect label="Timestamp" required value={columnMapping.timestampColumn} onChange={(v) => setColumnMapping({...columnMapping, timestampColumn: v})} columns={uploadResult.columns} icon={Clock} description="When the activity occurred" />
                  <ColumnSelect label="Resource" required={false} value={columnMapping.resourceColumn} onChange={(v) => setColumnMapping({...columnMapping, resourceColumn: v})} columns={uploadResult.columns} icon={FileText} description="Who performed the activity (optional)" />
                </div>

                <button
                  onClick={handleProcess}
                  disabled={processing || !columnMapping.caseIdColumn || !columnMapping.activityColumn || !columnMapping.timestampColumn}
                  style={{
                    ...styles.processButton,
                    ...((processing || !columnMapping.caseIdColumn || !columnMapping.activityColumn || !columnMapping.timestampColumn) ? styles.disabledButton : {})
                  }}
                >
                  {processing ? (
                    <>
                      <div style={styles.spinner}></div>
                      Importing data...
                    </>
                  ) : (
                    <>
                      <ArrowRight size={20} />
                      Start Import
                    </>
                  )}
                </button>

                {/* Data Preview */}
                {uploadResult.preview?.length > 0 && (
                  <div style={{ marginTop: '28px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#a0a0b8', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <Table size={16} /> Data Preview
                    </h4>
                    <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                      <table style={styles.previewTable}>
                        <thead>
                          <tr>
                            {uploadResult.columns?.slice(0, 5).map(col => (
                              <th key={col} style={styles.previewTh}>
                                {col}
                                {col === columnMapping.caseIdColumn && <span style={{ marginLeft: '6px', color: '#6366f1' }}>●</span>}
                                {col === columnMapping.activityColumn && <span style={{ marginLeft: '6px', color: '#8b5cf6' }}>●</span>}
                                {col === columnMapping.timestampColumn && <span style={{ marginLeft: '6px', color: '#10b981' }}>●</span>}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {uploadResult.preview.slice(0, 5).map((row, idx) => (
                            <tr key={idx}>
                              {uploadResult.columns?.slice(0, 5).map(col => (
                                <td key={col} style={styles.previewTd}>{row[col]}</td>
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

          {/* Right Column - History */}
          <div style={styles.historyCard}>
            <h2 style={{ ...styles.cardTitle, marginBottom: '16px' }}>
              <History size={22} color="#8b5cf6" />
              Import History
            </h2>

            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <div style={{ ...styles.spinner, margin: '0 auto' }}></div>
                <p style={{ color: '#6b6b82', marginTop: '12px', fontSize: '14px' }}>Loading history...</p>
              </div>
            ) : importHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <Upload size={48} color="#3d3d5c" style={{ marginBottom: '16px' }} />
                <p style={{ color: '#6b6b82', fontSize: '14px' }}>No imports yet</p>
                <p style={{ color: '#4a4a6a', fontSize: '12px', marginTop: '4px' }}>Upload your first file to get started</p>
              </div>
            ) : (
              <div>
                {importHistory.slice(0, 5).map((item, idx) => (
                  <div key={idx} style={styles.historyItem}>
                    <div style={styles.historyIcon}>{getFileIcon(item.fileName)}</div>
                    <div style={styles.historyInfo}>
                      <div style={styles.historyFileName}>{item.fileName}</div>
                      <div style={styles.historyMeta}>{formatDate(item.createdAt)}</div>
                    </div>
                    <span style={{
                      ...styles.historyBadge,
                      background: item.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : 
                                  item.status === 'failed' ? 'rgba(239, 68, 68, 0.15)' : 
                                  'rgba(99, 102, 241, 0.15)',
                      color: item.status === 'completed' ? '#10b981' : 
                             item.status === 'failed' ? '#f87171' : 
                             '#6366f1'
                    }}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Tips */}
            <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#a0a0b8', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} color="#6366f1" />
                Quick Tips
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ fontSize: '12px', color: '#6b6b82', marginBottom: '8px', paddingLeft: '16px', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, color: '#6366f1' }}>•</span>
                  Each row should be a single event
                </li>
                <li style={{ fontSize: '12px', color: '#6b6b82', marginBottom: '8px', paddingLeft: '16px', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, color: '#6366f1' }}>•</span>
                  Case ID groups events together
                </li>
                <li style={{ fontSize: '12px', color: '#6b6b82', paddingLeft: '16px', position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, color: '#6366f1' }}>•</span>
                  Timestamps need consistent format
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Import;
