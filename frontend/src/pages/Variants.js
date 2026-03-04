import React, { useState, useEffect } from 'react';
import { GitBranch, AlertCircle, ArrowRight, TrendingUp } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { processAPI } from '../utils/api';
import { formatNumber, formatCurrency, formatPercentage } from '../utils/helpers';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

function Variants() {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    fetchVariants();
  }, []);

  const fetchVariants = async () => {
    try {
      setLoading(true);
      const response = await processAPI.getVariants();
      setVariants(response.data);
      if (response.data.length > 0) {
        setSelectedVariant(response.data[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '16px' }}>Loading variant analysis...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-container">
        <AlertCircle size={48} color="var(--error)" />
        <p style={{ marginTop: '16px', color: 'var(--error)' }}>Error: {error}</p>
        <button className="btn btn-primary" onClick={fetchVariants} style={{ marginTop: '16px' }}>
          Retry
        </button>
      </div>
    );
  }

  const totalCases = variants.reduce((sum, v) => sum + v.count, 0);

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Process Variants</h1>
          <p className="page-subtitle">Analyze different process execution paths</p>
        </div>
        <span className="badge purple" style={{ fontSize: '14px', padding: '8px 16px' }}>
          {variants.length} variants discovered
        </span>
      </div>

      <div className="dashboard-grid dashboard-grid-2" style={{ marginBottom: '24px' }}>
        {/* Variant Distribution Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Variant Distribution</h3>
          </div>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center' }}>
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie
                  data={variants}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="_id"
                >
                  {variants.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedVariant(entry)}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: '#1e1e35', 
                    border: '1px solid #2d2d4a',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => [formatNumber(value), 'Cases']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, paddingLeft: '20px' }}>
              {variants.map((variant, index) => (
                <div 
                  key={variant._id} 
                  className="legend-item" 
                  style={{ 
                    marginBottom: '12px',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '6px',
                    background: selectedVariant?._id === variant._id ? 'var(--bg-tertiary)' : 'transparent'
                  }}
                  onClick={() => setSelectedVariant(variant)}
                >
                  <div 
                    style={{ 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '3px',
                      background: COLORS[index % COLORS.length]
                    }} 
                  />
                  <span style={{ flex: 1, fontSize: '13px' }}>{variant._id}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                    {formatPercentage((variant.count / totalCases) * 100)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Variant Completion Rates */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Completion Rate by Variant</h3>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={variants} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4a" horizontal={false} />
                <XAxis 
                  type="number" 
                  stroke="#6b6b82" 
                  fontSize={12}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis 
                  dataKey="_id" 
                  type="category" 
                  stroke="#6b6b82" 
                  fontSize={12}
                  width={90}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: '#1e1e35', 
                    border: '1px solid #2d2d4a',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => [`${value.toFixed(1)}%`, 'Completion Rate']}
                />
                <Bar 
                  dataKey="completionRate" 
                  fill="#10b981" 
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Variant Details */}
      {selectedVariant && (
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <GitBranch size={24} color="var(--accent-primary)" />
              <div>
                <h3 className="card-title">{selectedVariant._id}</h3>
                <p className="card-subtitle">Process variant path visualization</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '24px' }}>
              <div className="metric-item" style={{ background: 'transparent', padding: '0' }}>
                <div className="metric-value" style={{ fontSize: '20px' }}>
                  {formatNumber(selectedVariant.count)}
                </div>
                <div className="metric-label">Total Cases</div>
              </div>
              <div className="metric-item" style={{ background: 'transparent', padding: '0' }}>
                <div className="metric-value" style={{ fontSize: '20px' }}>
                  {formatCurrency(selectedVariant.avgOrderValue)}
                </div>
                <div className="metric-label">Avg Order Value</div>
              </div>
              <div className="metric-item" style={{ background: 'transparent', padding: '0' }}>
                <div className="metric-value" style={{ fontSize: '20px', color: 'var(--success)' }}>
                  {formatPercentage(selectedVariant.completionRate)}
                </div>
                <div className="metric-label">Completion Rate</div>
              </div>
            </div>
          </div>

          {/* Process Path Visualization */}
          {selectedVariant.path && (
            <div style={{ marginTop: '24px' }}>
              <h4 style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                PROCESS PATH ({selectedVariant.path.length} steps)
              </h4>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                alignItems: 'center', 
                gap: '8px',
                padding: '16px',
                background: 'var(--bg-secondary)',
                borderRadius: '8px'
              }}>
                {selectedVariant.path.map((step, index) => (
                  <React.Fragment key={index}>
                    <div style={{
                      padding: '10px 16px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'var(--gradient-1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 600
                      }}>
                        {index + 1}
                      </span>
                      {step}
                    </div>
                    {index < selectedVariant.path.length - 1 && (
                      <ArrowRight size={20} color="var(--text-muted)" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Variants Table */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">All Variants Summary</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Variant</th>
              <th>Cases</th>
              <th>Percentage</th>
              <th>Avg Order Value</th>
              <th>Completion Rate</th>
              <th>Steps</th>
            </tr>
          </thead>
          <tbody>
            {variants.map(variant => (
              <tr 
                key={variant._id}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedVariant(variant)}
              >
                <td style={{ fontWeight: 500, color: 'var(--accent-primary)' }}>
                  {variant._id}
                </td>
                <td>{formatNumber(variant.count)}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      width: '60px', 
                      height: '6px', 
                      background: 'var(--bg-secondary)',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(variant.count / totalCases) * 100}%`,
                        height: '100%',
                        background: 'var(--accent-primary)'
                      }} />
                    </div>
                    {formatPercentage((variant.count / totalCases) * 100)}
                  </div>
                </td>
                <td>{formatCurrency(variant.avgOrderValue)}</td>
                <td>
                  <span className={`badge ${variant.completionRate > 80 ? 'success' : variant.completionRate > 60 ? 'warning' : 'error'}`}>
                    {formatPercentage(variant.completionRate)}
                  </span>
                </td>
                <td>{variant.path?.length || '-'} steps</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Variants;
