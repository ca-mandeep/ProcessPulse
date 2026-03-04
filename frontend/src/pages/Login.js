import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Mail, Lock, LogIn, AlertCircle, Sparkles, Shield, Zap } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)',
      position: 'relative',
      overflow: 'hidden'
    },
    backgroundOrbs: {
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      pointerEvents: 'none'
    },
    orb1: {
      position: 'absolute',
      width: '600px',
      height: '600px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
      top: '-200px',
      right: '-200px',
      animation: 'pulse 8s ease-in-out infinite'
    },
    orb2: {
      position: 'absolute',
      width: '500px',
      height: '500px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
      bottom: '-150px',
      left: '-150px',
      animation: 'pulse 10s ease-in-out infinite reverse'
    },
    orb3: {
      position: 'absolute',
      width: '300px',
      height: '300px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 70%)',
      top: '50%',
      left: '30%',
      animation: 'float 15s ease-in-out infinite'
    },
    leftPanel: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '60px',
      position: 'relative',
      zIndex: 1
    },
    rightPanel: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      position: 'relative',
      zIndex: 1
    },
    brandSection: {
      maxWidth: '480px'
    },
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      marginBottom: '48px'
    },
    logoIcon: {
      width: '56px',
      height: '56px',
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 10px 40px rgba(99, 102, 241, 0.3)'
    },
    logoText: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#ffffff',
      letterSpacing: '-0.5px'
    },
    headline: {
      fontSize: '48px',
      fontWeight: '700',
      color: '#ffffff',
      lineHeight: '1.2',
      marginBottom: '24px',
      letterSpacing: '-1px'
    },
    headlineGradient: {
      background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    },
    subheadline: {
      fontSize: '18px',
      color: '#a0a0b8',
      lineHeight: '1.7',
      marginBottom: '48px'
    },
    featureList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    },
    featureItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    featureIcon: {
      width: '44px',
      height: '44px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    },
    featureText: {
      fontSize: '15px',
      color: '#ffffff',
      fontWeight: '500'
    },
    featureSubtext: {
      fontSize: '13px',
      color: '#6b6b82',
      marginTop: '2px'
    },
    loginCard: {
      width: '100%',
      maxWidth: '420px',
      background: 'rgba(30, 30, 53, 0.8)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      padding: '48px',
      border: '1px solid rgba(99, 102, 241, 0.2)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
    },
    cardHeader: {
      textAlign: 'center',
      marginBottom: '36px'
    },
    cardTitle: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: '8px'
    },
    cardSubtitle: {
      fontSize: '15px',
      color: '#a0a0b8'
    },
    errorBox: {
      marginBottom: '24px',
      padding: '14px 16px',
      background: 'rgba(239, 68, 68, 0.15)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    errorText: {
      color: '#fca5a5',
      fontSize: '14px'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    label: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#a0a0b8'
    },
    inputWrapper: {
      position: 'relative'
    },
    inputIcon: {
      position: 'absolute',
      left: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#6b6b82',
      transition: 'color 0.2s ease'
    },
    input: {
      width: '100%',
      padding: '14px 16px 14px 48px',
      background: 'rgba(37, 37, 66, 0.6)',
      border: '2px solid rgba(45, 45, 74, 0.8)',
      borderRadius: '12px',
      color: '#ffffff',
      fontSize: '15px',
      outline: 'none',
      transition: 'all 0.2s ease'
    },
    inputFocused: {
      borderColor: '#6366f1',
      background: 'rgba(37, 37, 66, 0.9)',
      boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.15)'
    },
    submitButton: {
      width: '100%',
      padding: '16px',
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
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
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
      marginTop: '8px'
    },
    submitButtonHover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(99, 102, 241, 0.5)'
    },
    submitButtonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
      transform: 'none'
    },
    spinner: {
      width: '20px',
      height: '20px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderTopColor: '#ffffff',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    },
    footer: {
      textAlign: 'center',
      marginTop: '32px',
      paddingTop: '24px',
      borderTop: '1px solid rgba(45, 45, 74, 0.5)'
    },
    footerText: {
      color: '#6b6b82',
      fontSize: '14px'
    },
    footerLink: {
      color: '#6366f1',
      fontWeight: '600',
      textDecoration: 'none',
      transition: 'color 0.2s ease'
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-30px) translateX(20px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input::placeholder {
          color: #6b6b82;
        }
        @media (max-width: 1024px) {
          .login-left-panel { display: none !important; }
          .login-right-panel { flex: 1 !important; padding: 24px !important; }
        }
      `}</style>

      {/* Background Effects */}
      <div style={styles.backgroundOrbs}>
        <div style={styles.orb1}></div>
        <div style={styles.orb2}></div>
        <div style={styles.orb3}></div>
      </div>

      {/* Left Panel - Branding */}
      <div className="login-left-panel" style={styles.leftPanel}>
        <div style={styles.brandSection}>
          <div style={styles.logoContainer}>
            <div style={styles.logoIcon}>
              <Activity size={28} color="#ffffff" />
            </div>
            <span style={styles.logoText}>ProcessPulse</span>
          </div>

          <h1 style={styles.headline}>
            Unlock Your <br />
            <span style={styles.headlineGradient}>Process Intelligence</span>
          </h1>

          <p style={styles.subheadline}>
            Discover hidden patterns, eliminate bottlenecks, and optimize your business processes with powerful analytics and real-time insights.
          </p>

          <div style={styles.featureList}>
            <div style={styles.featureItem}>
              <div style={{ ...styles.featureIcon, background: 'rgba(99, 102, 241, 0.15)' }}>
                <Sparkles size={22} color="#6366f1" />
              </div>
              <div>
                <div style={styles.featureText}>AI-Powered Insights</div>
                <div style={styles.featureSubtext}>Automatic pattern detection and recommendations</div>
              </div>
            </div>
            <div style={styles.featureItem}>
              <div style={{ ...styles.featureIcon, background: 'rgba(16, 185, 129, 0.15)' }}>
                <Zap size={22} color="#10b981" />
              </div>
              <div>
                <div style={styles.featureText}>Real-Time Analytics</div>
                <div style={styles.featureSubtext}>Live process monitoring and alerts</div>
              </div>
            </div>
            <div style={styles.featureItem}>
              <div style={{ ...styles.featureIcon, background: 'rgba(236, 72, 153, 0.15)' }}>
                <Shield size={22} color="#ec4899" />
              </div>
              <div>
                <div style={styles.featureText}>Enterprise Security</div>
                <div style={styles.featureSubtext}>SOC 2 compliant with role-based access</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="login-right-panel" style={styles.rightPanel}>
        <div style={styles.loginCard}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Welcome Back</h2>
            <p style={styles.cardSubtitle}>Sign in to continue to your dashboard</p>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={20} color="#fca5a5" />
              <span style={styles.errorText}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrapper}>
                <Mail 
                  size={20} 
                  style={{ 
                    ...styles.inputIcon, 
                    color: focusedField === 'email' ? '#6366f1' : '#6b6b82' 
                  }} 
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    ...styles.input,
                    ...(focusedField === 'email' ? styles.inputFocused : {})
                  }}
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <Lock 
                  size={20} 
                  style={{ 
                    ...styles.inputIcon, 
                    color: focusedField === 'password' ? '#6366f1' : '#6b6b82' 
                  }} 
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    ...styles.input,
                    ...(focusedField === 'password' ? styles.inputFocused : {})
                  }}
                  placeholder="Enter your password"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitButton,
                ...(loading ? styles.submitButtonDisabled : {})
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.5)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(99, 102, 241, 0.4)';
              }}
            >
              {loading ? (
                <div style={styles.spinner}></div>
              ) : (
                <>
                  <LogIn size={20} />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div style={styles.footer}>
            <p style={styles.footerText}>
              Don't have an account?{' '}
              <Link 
                to="/register" 
                style={styles.footerLink}
                onMouseOver={(e) => e.currentTarget.style.color = '#818cf8'}
                onMouseOut={(e) => e.currentTarget.style.color = '#6366f1'}
              >
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
