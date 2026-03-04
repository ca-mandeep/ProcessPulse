import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  X,
  AlertCircle,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { processAPI } from '../utils/api';
import { 
  formatDate, 
  formatCurrency, 
  formatDuration,
  getStatusClass, 
  getPriorityClass 
} from '../utils/helpers';

function Cases() {
  const [cases, setCases] = useState([]);
  const [allCases, setAllCases] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseEvents, setCaseEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchCases();
  }, [filters, pagination.page]);

  const fetchFilterOptions = async () => {
    try {
      const response = await processAPI.getFilterOptions();
      setFilterOptions(response.data);
    } catch (err) {
      console.error('Failed to fetch filter options:', err);
    }
  };

  const fetchCases = async () => {
    try {
      setLoading(true);
      const response = await processAPI.getCases({
        ...filters,
        page: pagination.page,
        limit: 15
      });
      setCases(response.data.cases);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCaseDetails = async (caseId) => {
    try {
      setLoadingEvents(true);
      const response = await processAPI.getCaseDetails(caseId);
      setSelectedCase(response.data.case);
      setCaseEvents(response.data.events);
    } catch (err) {
      console.error('Failed to fetch case details:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({});
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const exportToCSV = async () => {
    setExporting(true);
    try {
      // Fetch all cases for export
      const response = await processAPI.getCases({ ...filters, limit: 10000 });
      const exportData = response.data.cases;
      
      if (exportData.length === 0) {
        alert('No cases to export');
        setExporting(false);
        return;
      }

      // Create CSV content
      const headers = ['Case ID', 'Customer', 'Variant', 'Status', 'Priority', 'Region', 'Order Value', 'Start Time', 'End Time'];
      const csvRows = [headers.join(',')];
      
      exportData.forEach(c => {
        const row = [
          `"${c.caseId}"`,
          `"${c.customer || ''}"`,
          `"${c.variant || ''}"`,
          `"${c.status || ''}"`,
          `"${c.priority || ''}"`,
          `"${c.region || ''}"`,
          c.orderValue || 0,
          `"${c.startTime ? new Date(c.startTime).toISOString() : ''}"`,
          `"${c.endTime ? new Date(c.endTime).toISOString() : ''}"`
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `process_cases_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const exportToJSON = async () => {
    setExporting(true);
    try {
      const response = await processAPI.getCases({ ...filters, limit: 10000 });
      const exportData = response.data.cases;
      
      if (exportData.length === 0) {
        alert('No cases to export');
        setExporting(false);
        return;
      }

      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `process_cases_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (error) {
    return (
      <div className="loading-container">
        <AlertCircle size={48} color="var(--error)" />
        <p style={{ marginTop: '16px', color: 'var(--error)' }}>Error: {error}</p>
        <button className="btn btn-primary" onClick={fetchCases} style={{ marginTop: '16px' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Process Cases</h1>
          <p className="page-subtitle">Browse and analyze individual order processing cases</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {pagination.total} cases found
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={exportToCSV}
              disabled={exporting}
              className="btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '8px 14px',
                borderRadius: '8px',
                cursor: exporting ? 'not-allowed' : 'pointer',
                opacity: exporting ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              <FileSpreadsheet size={16} />
              {exporting ? 'Exporting...' : 'CSV'}
            </button>
            <button
              onClick={exportToJSON}
              disabled={exporting}
              className="btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '8px 14px',
                borderRadius: '8px',
                cursor: exporting ? 'not-allowed' : 'pointer',
                opacity: exporting ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              <Download size={16} />
              {exporting ? 'Exporting...' : 'JSON'}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <select 
          className="filter-select"
          value={filters.status || ''}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">All Statuses</option>
          {filterOptions.statuses?.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>

        <select 
          className="filter-select"
          value={filters.variant || ''}
          onChange={(e) => handleFilterChange('variant', e.target.value)}
        >
          <option value="">All Variants</option>
          {filterOptions.variants?.map(variant => (
            <option key={variant} value={variant}>{variant}</option>
          ))}
        </select>

        <select 
          className="filter-select"
          value={filters.region || ''}
          onChange={(e) => handleFilterChange('region', e.target.value)}
        >
          <option value="">All Regions</option>
          {filterOptions.regions?.map(region => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>

        <select 
          className="filter-select"
          value={filters.priority || ''}
          onChange={(e) => handleFilterChange('priority', e.target.value)}
        >
          <option value="">All Priorities</option>
          {filterOptions.priorities?.map(priority => (
            <option key={priority} value={priority}>{priority}</option>
          ))}
        </select>

        {Object.keys(filters).length > 0 && (
          <button className="btn btn-secondary" onClick={clearFilters}>
            <X size={16} />
            Clear Filters
          </button>
        )}
      </div>

      {/* Cases Table */}
      <div className="card">
        {loading ? (
          <div className="loading-container" style={{ padding: '40px' }}>
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Customer</th>
                  <th>Variant</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Region</th>
                  <th>Order Value</th>
                  <th>Start Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases.map(caseItem => (
                  <tr key={caseItem.caseId}>
                    <td style={{ fontWeight: 500, color: 'var(--accent-primary)' }}>
                      {caseItem.caseId}
                    </td>
                    <td>{caseItem.customer}</td>
                    <td>
                      <span className="badge purple">{caseItem.variant}</span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusClass(caseItem.status)}`}>
                        {caseItem.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getPriorityClass(caseItem.priority)}`}>
                        {caseItem.priority}
                      </span>
                    </td>
                    <td>{caseItem.region}</td>
                    <td style={{ fontWeight: 500 }}>{formatCurrency(caseItem.orderValue)}</td>
                    <td style={{ fontSize: '13px' }}>{formatDate(caseItem.startTime)}</td>
                    <td>
                      <button 
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px' }}
                        onClick={() => fetchCaseDetails(caseItem.caseId)}
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginTop: '20px',
              padding: '0 16px'
            }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                Page {pagination.page} of {pagination.pages}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn btn-secondary"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  <ChevronLeft size={18} />
                  Previous
                </button>
                <button 
                  className="btn btn-secondary"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Case Details Modal */}
      {selectedCase && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setSelectedCase(null)}
        >
          <div 
            className="card" 
            style={{ 
              width: '800px', 
              maxHeight: '80vh', 
              overflow: 'auto',
              margin: '20px'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="card-header">
              <div>
                <h3 className="card-title">Case: {selectedCase.caseId}</h3>
                <p className="card-subtitle">{selectedCase.customer} - {selectedCase.variant}</p>
              </div>
              <button 
                className="btn btn-secondary"
                onClick={() => setSelectedCase(null)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Case Info */}
            <div className="metrics-grid" style={{ marginBottom: '24px' }}>
              <div className="metric-item">
                <span className={`badge ${getStatusClass(selectedCase.status)}`}>
                  {selectedCase.status}
                </span>
                <div className="metric-label" style={{ marginTop: '8px' }}>Status</div>
              </div>
              <div className="metric-item">
                <span className={`badge ${getPriorityClass(selectedCase.priority)}`}>
                  {selectedCase.priority}
                </span>
                <div className="metric-label" style={{ marginTop: '8px' }}>Priority</div>
              </div>
              <div className="metric-item">
                <div className="metric-value" style={{ fontSize: '18px' }}>
                  {formatCurrency(selectedCase.orderValue)}
                </div>
                <div className="metric-label">Order Value</div>
              </div>
              <div className="metric-item">
                <div className="metric-value" style={{ fontSize: '18px' }}>
                  {selectedCase.region}
                </div>
                <div className="metric-label">Region</div>
              </div>
            </div>

            {/* Event Timeline */}
            <h4 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>
              Process Timeline ({caseEvents.length} events)
            </h4>
            
            {loadingEvents ? (
              <div className="loading-container" style={{ padding: '40px' }}>
                <div className="loading-spinner"></div>
              </div>
            ) : (
              <div className="timeline">
                {caseEvents.map((event, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-content">
                      <div className="timeline-title">{event.activity}</div>
                      <div className="timeline-time">
                        {formatDate(event.timestamp)} • {event.resource} • {event.department}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Cases;
