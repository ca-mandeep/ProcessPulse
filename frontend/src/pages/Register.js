import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Mail, Lock, User, UserPlus, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    if (!password) return { level: 0, text: '', color: '#6b6b82' };
    if (password.length < 6) return { level: 1, text: 'Weak', color: '#ef4444' };
    if (password.length < 10) return { level: 2, text: 'Medium', color: '#f59e0b' };
    return { level: 3, text: 'Strong', color: '#10b981' };
  };

  const strength = passwordStrength();

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
      background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
      top: '-200px',
      left: '-200px',
      animation: 'pulse 8s ease-in-out infinite'
    },
    orb2: {
      position: 'absolute',
      width: '500px',
      height: '500px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
      bottom: '-150px',
      right: '-150px',
      animation: 'pulse 10s ease-in-out infinite reverse'
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
      fontSize: '44px',
      fontWeight: '700',
      color: '#ffffff',
      lineHeight: '1.2',
      marginBottom: '24px',
      letterSpacing: '-1px'
    },
    headlineGradient: {
      background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
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
    benefitsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    benefitItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      color: '#a0a0b8',
      fontSize: '15px'
    },
    benefitIcon: {
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      background: 'rgba(16, 185, 129, 0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    },
    registerCard: {
      width: '100%',
      maxWidth: '440px',
      background: 'rgba(30, 30, 53, 0.8)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      padding: '40px',
      border: '1px solid rgba(139, 92, 246, 0.2)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
    },
    cardHeader: {
      textAlign: 'center',
      marginBottom: '32px'
    },
    cardTitle: {
      fontSize: '26px',
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: '8px'
    },
    cardSubtitle: {
      fontSize: '14px',
      color: '#a0a0b8'
    },
    errorBox: {
      marginBottom: '20px',
      padding: '12px 14px',
      background: 'rgba(239, 68, 68, 0.15)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    errorText: {
      color: '#fca5a5',
      fontSize: '13px'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '18px'
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    },
    label: {
      fontSize: '13px',
      fontWeight: '500',
      color: '#a0a0b8'
    },
    inputWrapper: {
      position: 'relative'
    },
    inputIcon: {
      position: 'absolute',
      left: '14px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#6b6b82',
      transition: 'color 0.2s ease'
    },
    input: {
      width: '100%',
      padding: '12px 14px 12px 44px',
      background: 'rgba(37, 37, 66, 0.6)',
      border: '2px solid rgba(45, 45, 74, 0.8)',
      borderRadius: '10px',
      color: '#ffffff',
      fontSize: '14px',
      outline: 'none',
      transition: 'all 0.2s ease'
    },
    inputFocused: {
      borderColor: '#8b5cf6',
      background: 'rgba(37, 37, 66, 0.9)',
      boxShadow: '0 0 0 4px rgba(139, 92, 246, 0.15)'
    },
    passwordStrength: {
      marginTop: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    strengthBars: {
      display: 'flex',
      gap: '4px',
      flex: 1
    },
    strengthBar: {
      height: '3px',
      borderRadius: '2px',
      flex: 1,
      background: '#2d2d4a',
      transition: 'background 0.3s ease'
    },
    strengthText: {
      fontSize: '11px',
      fontWeight: '500'
    },
    submitButton: {
      width: '100%',
      padding: '14px',
      background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
      border: 'none',
      borderRadius: '10px',
      color: '#ffffff',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
      marginTop: '8px'
    },
    submitButtonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed'
    },
    spinner: {
      width: '18px',
      height: '18px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderTopColor: '#ffffff',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    },
    footer: {
      textAlign: 'center',
      marginTop: '24px',
      paddingTop: '20px',
      borderTop: '1px solid rgba(45, 45, 74, 0.5)'
    },
    footerText: {
      color: '#6b6b82',
      fontSize: '13px'
    },
    footerLink: {
      color: '#8b5cf6',
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
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input::placeholder {
          color: #6b6b82;
        }
        @media (max-width: 1024px) {
          .register-left-panel { display: none !important; }
          .register-right-panel { flex: 1 !important; padding: 24px !important; }
        }
      `}</style>

      {/* Background Effects */}
      <div style={styles.backgroundOrbs}>
        <div style={styles.orb1}></div>
        <div style={styles.orb2}></div>
      </div>

      {/* Left Panel - Branding */}
      <div className="register-left-panel" style={styles.leftPanel}>
        <div style={styles.brandSection}>
          <div style={styles.logoContainer}>
            <div style={styles.logoIcon}>
              <Activity size={28} color="#ffffff" />
            </div>
            <span style={styles.logoText}>ProcessPulse</span>
          </div>

          <h1 style={styles.headline}>
            Start Your <br />
            <span style={styles.headlineGradient}>Analytics Journey</span>
          </h1>

          <p style={styles.subheadline}>
            Join thousands of companies already using ProcessPulse to optimize their operations and drive business success.
          </p>

          <div style={styles.benefitsList}>
            <div style={styles.benefitItem}>
              <div style={styles.benefitIcon}>
                <CheckCircle size={14} color="#10b981" />
              </div>
              <span>Free 14-day trial with full features</span>
            </div>
            <div style={styles.benefitItem}>
              <div style={styles.benefitIcon}>
                <CheckCircle size={14} color="#10b981" />
              </div>
              <span>No credit card required to start</span>
            </div>
            <div style={styles.benefitItem}>
              <div style={styles.benefitIcon}>
                <CheckCircle size={14} color="#10b981" />
              </div>
              <span>Import unlimited process data</span>
            </div>
            <div style={styles.benefitItem}>
              <div style={styles.benefitIcon}>
                <CheckCircle size={14} color="#10b981" />
              </div>
              <span>24/7 support and documentation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="register-right-panel" style={styles.rightPanel}>
        <div style={styles.registerCard}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Create Account</h2>
            <p style={styles.cardSubtitle}>Get started with ProcessPulse today</p>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={18} color="#fca5a5" />
              <span style={styles.errorText}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Full Name</label>
              <div style={styles.inputWrapper}>
                <User 
                  size={18} 
                  style={{ 
                    ...styles.inputIcon, 
                    color: focusedField === 'name' ? '#8b5cf6' : '#6b6b82' 
                  }} 
                />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    ...styles.input,
                    ...(focusedField === 'name' ? styles.inputFocused : {})
                  }}
                  placeholder="John Smith"
                  required
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrapper}>
                <Mail 
                  size={18} 
                  style={{ 
                    ...styles.inputIcon, 
                    color: focusedField === 'email' ? '#8b5cf6' : '#6b6b82' 
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
                  size={18} 
                  style={{ 
                    ...styles.inputIcon, 
                    color: focusedField === 'password' ? '#8b5cf6' : '#6b6b82' 
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
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                />
              </div>
              {password && (
                <div style={styles.passwordStrength}>
                  <div style={styles.strengthBars}>
                    {[1, 2, 3].map((level) => (
                      <div 
                        key={level}
                        style={{
                          ...styles.strengthBar,
                          background: strength.level >= level ? strength.color : '#2d2d4a'
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ ...styles.strengthText, color: strength.color }}>
                    {strength.text}
                  </span>
                </div>
              )}
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm Password</label>
              <div style={styles.inputWrapper}>
                <Lock 
                  size={18} 
                  style={{ 
                    ...styles.inputIcon, 
                    color: focusedField === 'confirm' ? '#8b5cf6' : '#6b6b82' 
                  }} 
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField('confirm')}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    ...styles.input,
                    ...(focusedField === 'confirm' ? styles.inputFocused : {}),
                    ...(confirmPassword && password !== confirmPassword ? { borderColor: '#ef4444' } : {}),
                    ...(confirmPassword && password === confirmPassword ? { borderColor: '#10b981' } : {})
                  }}
                  placeholder="Re-enter your password"
                  required
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
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.5)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.4)';
              }}
            >
              {loading ? (
                <div style={styles.spinner}></div>
              ) : (
                <>
                  <UserPlus size={18} />
                  Create Account
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div style={styles.footer}>
            <p style={styles.footerText}>
              Already have an account?{' '}
              <Link 
                to="/login" 
                style={styles.footerLink}
                onMouseOver={(e) => e.currentTarget.style.color = '#a78bfa'}
                onMouseOut={(e) => e.currentTarget.style.color = '#8b5cf6'}
              >
                Sign in instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
