import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, Activity } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { processAPI } from '../utils/api';
import { formatNumber, formatDuration, formatCurrency } from '../utils/helpers';

function Analytics() {
  const [timeData, setTimeData] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeGrouping, setTimeGrouping] = useState('month');

  useEffect(() => {
    fetchData();
  }, [timeGrouping]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [timeRes, activityRes] = await Promise.all([
        processAPI.getTimeAnalytics(timeGrouping),
        processAPI.getActivities()
      ]);
      setTimeData(timeRes.data);
      setActivityData(activityRes.data);
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
        <p style={{ marginTop: '16px' }}>Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-container">
        <AlertCircle size={48} color="var(--error)" />
        <p style={{ marginTop: '16px', color: 'var(--error)' }}>Error: {error}</p>
        <button className="btn btn-primary" onClick={fetchData} style={{ marginTop: '16px' }}>
          Retry
        </button>
      </div>
    );
  }

  // Calculate totals
  const totalEvents = activityData.reduce((sum, a) => sum + a.totalOccurrences, 0);
  const totalCost = activityData.reduce((sum, a) => sum + a.totalCost, 0);
  const avgProcessingTime = activityData.reduce((sum, a) => sum + a.avgProcessingTime, 0) / activityData.length;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Process Analytics</h1>
          <p className="page-subtitle">Deep dive into process performance metrics</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="dashboard-grid dashboard-grid-4" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon purple">
              <Activity size={24} />
            </div>
          </div>
          <div className="stat-value">{formatNumber(totalEvents)}</div>
          <div className="stat-label">Total Events</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon green">
              <Clock size={24} />
            </div>
          </div>
          <div className="stat-value">{formatDuration(avgProcessingTime)}</div>
          <div className="stat-label">Avg Processing Time</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon blue">
              <Activity size={24} />
            </div>
          </div>
          <div className="stat-value">{activityData.length}</div>
          <div className="stat-label">Activity Types</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon orange">
              <Activity size={24} />
            </div>
          </div>
          <div className="stat-value">{formatCurrency(totalCost)}</div>
          <div className="stat-label">Total Cost</div>
        </div>
      </div>

      {/* Time Series Analysis */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Cases Over Time</h3>
            <p className="card-subtitle">Trend analysis of case volumes and completion</p>
          </div>
          <div className="tab-nav" style={{ marginBottom: 0 }}>
            <button 
              className={`tab-btn ${timeGrouping === 'day' ? 'active' : ''}`}
              onClick={() => setTimeGrouping('day')}
            >
              Daily
            </button>
            <button 
              className={`tab-btn ${timeGrouping === 'week' ? 'active' : ''}`}
              onClick={() => setTimeGrouping('week')}
            >
              Weekly
            </button>
            <button 
              className={`tab-btn ${timeGrouping === 'month' ? 'active' : ''}`}
              onClick={() => setTimeGrouping('month')}
            >
              Monthly
            </button>
          </div>
        </div>
        <div style={{ height: '350px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4a" />
              <XAxis 
                dataKey="_id" 
                stroke="#6b6b82" 
                fontSize={12}
                interval="preserveStartEnd"
              />
              <YAxis stroke="#6b6b82" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  background: '#1e1e35', 
                  border: '1px solid #2d2d4a',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#6366f1" 
                fillOpacity={1}
                fill="url(#colorTotal)"
                name="Total Cases"
              />
              <Area 
                type="monotone" 
                dataKey="completed" 
                stroke="#10b981" 
                fillOpacity={1}
                fill="url(#colorCompleted)"
                name="Completed"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Order Value Analysis */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">Order Value Trends</h3>
          <p className="card-subtitle">Total order value over time</p>
        </div>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4a" />
              <XAxis 
                dataKey="_id" 
                stroke="#6b6b82" 
                fontSize={12}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="#6b6b82" 
                fontSize={12}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip 
                contentStyle={{ 
                  background: '#1e1e35', 
                  border: '1px solid #2d2d4a',
                  borderRadius: '8px'
                }}
                formatter={(value) => [formatCurrency(value), 'Total Value']}
              />
              <Line 
                type="monotone" 
                dataKey="totalValue" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', r: 4 }}
                name="Order Value"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity Performance */}
      <div className="dashboard-grid dashboard-grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Activity Frequency</h3>
          </div>
          <div style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={activityData.slice(0, 10)} 
                layout="vertical"
                margin={{ left: 130, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4a" horizontal={false} />
                <XAxis type="number" stroke="#6b6b82" fontSize={12} />
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
                  formatter={(value) => [formatNumber(value), 'Occurrences']}
                />
                <Bar 
                  dataKey="totalOccurrences" 
                  fill="#6366f1" 
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Average Processing Time</h3>
          </div>
          <div style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={activityData.filter(a => a.avgProcessingTime > 0).slice(0, 10)} 
                layout="vertical"
                margin={{ left: 130, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4a" horizontal={false} />
                <XAxis type="number" stroke="#6b6b82" fontSize={12} />
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
                  formatter={(value) => [formatDuration(value), 'Avg Duration']}
                />
                <Bar 
                  dataKey="avgProcessingTime" 
                  fill="#f59e0b" 
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activity Details Table */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">Activity Performance Details</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Activity</th>
              <th>Occurrences</th>
              <th>Avg Processing Time</th>
              <th>Avg Cost</th>
              <th>Total Cost</th>
              <th>Resources</th>
            </tr>
          </thead>
          <tbody>
            {activityData.map(activity => (
              <tr key={activity.activity}>
                <td style={{ fontWeight: 500, color: 'var(--accent-primary)' }}>
                  {activity.activity}
                </td>
                <td>{formatNumber(activity.totalOccurrences)}</td>
                <td>{formatDuration(activity.avgProcessingTime)}</td>
                <td>{formatCurrency(activity.avgCost)}</td>
                <td>{formatCurrency(activity.totalCost)}</td>
                <td>
                  <span className="badge info">{activity.resourceCount} resources</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Analytics;
