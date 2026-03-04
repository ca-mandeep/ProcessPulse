import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  GitBranch, 
  FileText, 
  Activity, 
  AlertTriangle,
  Workflow,
  Upload,
  LogOut,
  User
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import ProcessFlow from './pages/ProcessFlow';
import Cases from './pages/Cases';
import Variants from './pages/Variants';
import Analytics from './pages/Analytics';
import Bottlenecks from './pages/Bottlenecks';
import Login from './pages/Login';
import Register from './pages/Register';
import Import from './pages/Import';

// Protected Route component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/process-flow', icon: Workflow, label: 'Process Flow' },
    { path: '/cases', icon: FileText, label: 'Cases' },
    { path: '/variants', icon: GitBranch, label: 'Variants' },
    { path: '/analytics', icon: Activity, label: 'Analytics' },
    { path: '/bottlenecks', icon: AlertTriangle, label: 'Bottlenecks' },
    { path: '/import', icon: Upload, label: 'Import Data' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">
            <Workflow size={24} color="white" />
          </div>
          <span>ProcessPulse</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* User section */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', marginTop: 'auto' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User size={16} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {user.email}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                color: 'var(--text-muted)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.color = '#ef4444'}
              onMouseOut={(e) => e.target.style.color = 'var(--text-muted)'}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Process Mining v1.0
        </div>
      </div>
    </aside>
  );
}

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  // Auth pages (no sidebar)
  if (location.pathname === '/login' || location.pathname === '/register') {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    );
  }
  
  // Protected pages (with sidebar)
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/process-flow" element={<ProtectedRoute><ProcessFlow /></ProtectedRoute>} />
          <Route path="/cases" element={<ProtectedRoute><Cases /></ProtectedRoute>} />
          <Route path="/variants" element={<ProtectedRoute><Variants /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/bottlenecks" element={<ProtectedRoute><Bottlenecks /></ProtectedRoute>} />
          <Route path="/import" element={<ProtectedRoute><Import /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
