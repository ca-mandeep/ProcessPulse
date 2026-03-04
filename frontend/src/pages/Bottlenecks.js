import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Clock, TrendingDown, Zap } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { processAPI } from '../utils/api';
import { formatNumber, formatDuration } from '../utils/helpers';

function Bottlenecks() {
  const [bottleneckData, setBottleneckData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBottlenecks();
  }, []);

  const fetchBottlenecks = async () => {
    try {
      setLoading(true);
      const response = await processAPI.getBottlenecks();
      setBottleneckData(response.data);
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
        <p style={{ marginTop: '16px' }}>Analyzing bottlenecks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-container">
        <AlertCircle size={48} color="var(--error)" />
        <p style={{ marginTop: '16px', color: 'var(--error)' }}>Error: {error}</p>
        <button className="btn btn-primary" onClick={fetchBottlenecks} style={{ marginTop: '16px' }}>
          Retry
        </button>
      </div>
    );
  }

  const { slowestTransitions, activityWaitTimes } = bottleneckData;

  // Find the maximum wait time for color scaling
  const maxWaitTime = Math.max(...activityWaitTimes.map(a => a.avgWaitTimeMinutes));

  // Get color based on severity
  const getSeverityColor = (value, max) => {
    const ratio = value / max;
    if (ratio > 0.7) return '#ef4444'; // Red - critical
    if (ratio > 0.4) return '#f59e0b'; // Orange - warning
    return '#10b981'; // Green - ok
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bottleneck Analysis</h1>
          <p className="page-subtitle">Identify process inefficiencies and improvement opportunities</p>
        </div>
        <button className="btn btn-primary" onClick={fetchBottlenecks}>
          <Zap size={18} />
          Re-analyze
        </button>
      </div>

      {/* Top Bottlenecks Summary */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={24} color="var(--warning)" />
            <div>
              <h3 className="card-title">Critical Bottlenecks Identified</h3>
              <p className="card-subtitle">Transitions with highest average duration</p>
            </div>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginTop: '16px'
        }}>
          {slowestTransitions.slice(0, 4).map((transition, index) => (
            <div 
              key={`${transition.fromActivity}-${transition.toActivity}`}
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                padding: '20px',
                border: `2px solid ${index === 0 ? 'var(--error)' : index === 1 ? 'var(--warning)' : 'var(--border-color)'}`,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {index < 2 && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: index === 0 ? 'var(--error)' : 'var(--warning)',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'white'
                }}>
                  {index === 0 ? 'CRITICAL' : 'HIGH'}
                </div>
              )}
              
              <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                #{index + 1}
              </div>
              
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {transition.fromActivity}
                </div>
                <div style={{ fontSize: '20px', color: 'var(--text-primary)', margin: '4px 0' }}>
                  →
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {transition.toActivity}
                </div>
              </div>

              <div style={{ 
                marginTop: '16px', 
                padding: '12px', 
                background: 'var(--bg-card)', 
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--error)' }}>
                    {formatDuration(transition.avgDurationMinutes)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Avg Duration
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {formatNumber(transition.count)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Occurrences
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid-2" style={{ marginBottom: '24px' }}>
        {/* Slowest Transitions Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Slowest Transitions</h3>
              <p className="card-subtitle">Average duration between activities</p>
            </div>
          </div>
          <div style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={slowestTransitions.slice(0, 8)} 
                layout="vertical"
                margin={{ left: 20, right: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4a" horizontal={false} />
                <XAxis 
                  type="number" 
                  stroke="#6b6b82" 
                  fontSize={12}
                  tickFormatter={(v) => formatDuration(v)}
                />
                <YAxis 
                  dataKey={(d) => `${d.fromActivity.slice(0,12)}...→${d.toActivity.slice(0,12)}...`}
                  type="category" 
                  stroke="#6b6b82" 
                  fontSize={10}
                  width={180}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: '#1e1e35', 
                    border: '1px solid #2d2d4a',
                    borderRadius: '8px'
                  }}
                  formatter={(value, name, props) => [
                    formatDuration(value), 
                    'Avg Duration'
                  ]}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      const data = payload[0].payload;
                      return `${data.fromActivity} → ${data.toActivity}`;
                    }
                    return label;
                  }}
                />
                <Bar 
                  dataKey="avgDurationMinutes" 
                  radius={[0, 4, 4, 0]}
                >
                  {slowestTransitions.slice(0, 8).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getSeverityColor(entry.avgDurationMinutes, slowestTransitions[0]?.avgDurationMinutes || 1)} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Wait Times */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Activity Wait Times</h3>
              <p className="card-subtitle">Average time waiting before each activity</p>
            </div>
          </div>
          <div style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={activityWaitTimes.slice(0, 10)} 
                layout="vertical"
                margin={{ left: 130, right: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4a" horizontal={false} />
                <XAxis 
                  type="number" 
                  stroke="#6b6b82" 
                  fontSize={12}
                  tickFormatter={(v) => formatDuration(v)}
                />
                <YAxis 
                  dataKey="activity" 
                  type="category" 
                  stroke="#6b6b82" 
                  fontSize={11}
                  width={120}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: '#1e1e35', 
                    border: '1px solid #2d2d4a',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => [formatDuration(value), 'Avg Wait Time']}
                />
                <Bar 
                  dataKey="avgWaitTimeMinutes" 
                  radius={[0, 4, 4, 0]}
                >
                  {activityWaitTimes.slice(0, 10).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getSeverityColor(entry.avgWaitTimeMinutes, maxWaitTime)} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="dashboard-grid dashboard-grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">All Slow Transitions</h3>
          </div>
          <div style={{ maxHeight: '400px', overflow: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th>Avg Duration</th>
                  <th>Max Duration</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {slowestTransitions.map((t, index) => (
                  <tr key={index}>
                    <td style={{ fontSize: '13px' }}>{t.fromActivity}</td>
                    <td style={{ fontSize: '13px' }}>{t.toActivity}</td>
                    <td>
                      <span style={{ 
                        color: getSeverityColor(t.avgDurationMinutes, slowestTransitions[0]?.avgDurationMinutes || 1),
                        fontWeight: 500
                      }}>
                        {formatDuration(t.avgDurationMinutes)}
                      </span>
                    </td>
                    <td>{formatDuration(t.maxDurationMinutes)}</td>
                    <td>{formatNumber(t.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Activity Queue Analysis</h3>
          </div>
          <div style={{ maxHeight: '400px', overflow: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>Avg Wait Time</th>
                  <th>Incoming Transitions</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {activityWaitTimes.map((a, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                      {a.activity}
                    </td>
                    <td>
                      <span style={{ 
                        color: getSeverityColor(a.avgWaitTimeMinutes, maxWaitTime),
                        fontWeight: 500
                      }}>
                        {formatDuration(a.avgWaitTimeMinutes)}
                      </span>
                    </td>
                    <td>{formatNumber(a.totalIncoming)}</td>
                    <td>
                      <span className={`badge ${
                        a.avgWaitTimeMinutes / maxWaitTime > 0.7 ? 'error' :
                        a.avgWaitTimeMinutes / maxWaitTime > 0.4 ? 'warning' : 'success'
                      }`}>
                        {a.avgWaitTimeMinutes / maxWaitTime > 0.7 ? 'Critical' :
                         a.avgWaitTimeMinutes / maxWaitTime > 0.4 ? 'Medium' : 'Low'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Zap size={24} color="var(--accent-primary)" />
            <h3 className="card-title">Optimization Recommendations</h3>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {slowestTransitions.slice(0, 3).map((t, index) => (
            <div 
              key={index}
              style={{
                padding: '20px',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                borderLeft: `4px solid ${index === 0 ? 'var(--error)' : index === 1 ? 'var(--warning)' : 'var(--accent-primary)'}`
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Optimize: {t.fromActivity} → {t.toActivity}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                This transition has an average duration of <strong style={{ color: 'var(--error)' }}>{formatDuration(t.avgDurationMinutes)}</strong>.
                Consider automating handoffs, adding resources, or parallelizing activities to reduce wait times.
              </div>
              <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                Impact: {formatNumber(t.count)} transitions affected
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Bottlenecks;
