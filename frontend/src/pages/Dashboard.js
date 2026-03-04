import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Activity,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';
import { processAPI } from '../utils/api';
import { formatNumber, formatDuration, formatPercentage, formatCurrency } from '../utils/helpers';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [timeData, setTimeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, timeRes] = await Promise.all([
        processAPI.getStats(),
        processAPI.getTimeAnalytics('month')
      ]);
      setStats(statsRes.data);
      setTimeData(timeRes.data);
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
        <p style={{ marginTop: '16px' }}>Loading dashboard...</p>
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

  const { overview, duration, activityStats } = stats;

  const statusData = [
    { name: 'Completed', value: overview.completedCases, color: '#10b981' },
    { name: 'In Progress', value: overview.inProgressCases, color: '#3b82f6' },
    { name: 'On Hold', value: overview.onHoldCases, color: '#f59e0b' },
    { name: 'Cancelled', value: overview.cancelledCases, color: '#ef4444' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Process Mining Dashboard</h1>
          <p className="page-subtitle">SoftwareONE Order Processing Analysis</p>
        </div>
        <button className="btn btn-primary" onClick={fetchData}>
          <Activity size={18} />
          Refresh Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-grid dashboard-grid-4" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon purple">
              <FileText size={24} />
            </div>
          </div>
          <div className="stat-value">{formatNumber(overview.totalCases)}</div>
          <div className="stat-label">Total Cases</div>
          <div className="stat-change positive">
            <TrendingUp size={14} />
            {formatNumber(overview.totalEvents)} events
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon green">
              <CheckCircle size={24} />
            </div>
          </div>
          <div className="stat-value">{formatPercentage(overview.completionRate)}</div>
          <div className="stat-label">Completion Rate</div>
          <div className="stat-change positive">
            <CheckCircle size={14} />
            {formatNumber(overview.completedCases)} completed
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon blue">
              <Clock size={24} />
            </div>
          </div>
          <div className="stat-value">{formatDuration(duration.average)}</div>
          <div className="stat-label">Avg. Process Time</div>
          <div className="stat-change">
            Min: {formatDuration(duration.min)} | Max: {formatDuration(duration.max)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-icon orange">
              <Activity size={24} />
            </div>
          </div>
          <div className="stat-value">{activityStats?.length || 0}</div>
          <div className="stat-label">Unique Activities</div>
          <div className="stat-change">
            {formatNumber(overview.inProgressCases)} in progress
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="dashboard-grid dashboard-grid-2" style={{ marginBottom: '24px' }}>
        {/* Cases Over Time */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Cases Over Time</h3>
              <p className="card-subtitle">Monthly case volume trends</p>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4a" />
                <XAxis dataKey="_id" stroke="#6b6b82" fontSize={12} />
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
                  fill="url(#colorCount)" 
                  name="Total Cases"
                />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={false}
                  name="Completed"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Case Status Distribution */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Case Status Distribution</h3>
              <p className="card-subtitle">Current status of all cases</p>
            </div>
          </div>
          <div className="chart-container" style={{ display: 'flex', alignItems: 'center' }}>
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: '#1e1e35', 
                    border: '1px solid #2d2d4a',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {statusData.map((item) => (
                <div key={item.name} className="legend-item" style={{ marginBottom: '12px' }}>
                  <div 
                    className="legend-color" 
                    style={{ 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '3px',
                      background: item.color 
                    }} 
                  />
                  <span style={{ flex: 1 }}>{item.name}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {formatNumber(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Activity Frequency</h3>
            <p className="card-subtitle">Number of occurrences per activity type</p>
          </div>
        </div>
        <div style={{ height: '350px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={activityStats?.slice(0, 10)} 
              layout="vertical"
              margin={{ left: 150, right: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d4a" horizontal={false} />
              <XAxis type="number" stroke="#6b6b82" fontSize={12} />
              <YAxis 
                dataKey="_id" 
                type="category" 
                stroke="#6b6b82" 
                fontSize={12}
                width={140}
              />
              <Tooltip 
                contentStyle={{ 
                  background: '#1e1e35', 
                  border: '1px solid #2d2d4a',
                  borderRadius: '8px'
                }}
                formatter={(value, name) => [formatNumber(value), 'Count']}
              />
              <Bar 
                dataKey="count" 
                fill="#6366f1" 
                radius={[0, 4, 4, 0]}
                name="Occurrences"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
