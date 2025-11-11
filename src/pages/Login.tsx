// @ts-nocheck
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { auth, googleProvider } from '../config/firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';

export default function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid email or password');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (err) {
      console.error('Google Sign In error:', err);
      setError('Google Sign In failed');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FF6B35 0%, #FFD23F 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '3rem 2rem',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', color: '#2E3A4B' }}>
            🦊 {t('common.appName')}
          </h1>
          <p style={{ color: '#666', marginTop: '0.5rem' }}>
            {t('auth.login.title')}
          </p>
        </div>

        {error && (
          <div style={{
            background: '#FEE2E2',
            color: '#DC2626',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#2E3A4B',
              fontWeight: '500'
            }}>
              {t('auth.login.email')}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #E5E7EB',
                borderRadius: '10px',
                fontSize: '1rem',
                outline: 'none'
              }}
              placeholder={t('auth.login.emailPlaceholder')}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#2E3A4B',
              fontWeight: '500'
            }}>
              {t('auth.login.password')}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #E5E7EB',
                borderRadius: '10px',
                fontSize: '1rem',
                outline: 'none'
              }}
              placeholder={t('auth.login.passwordPlaceholder')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              background: loading ? '#ccc' : 'linear-gradient(135deg, #FF6B35 0%, #FFD23F 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? t('auth.login.submitting') : t('auth.login.submit')}
          </button>
        </form>

        <div style={{
          margin: '2rem 0',
          textAlign: 'center',
          color: '#9CA3AF'
        }}>
          {t('auth.login.or')}
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'white',
            color: '#2E3A4B',
            border: '2px solid #E5E7EB',
            borderRadius: '10px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>🌐</span>
          {t('auth.login.google')}
        </button>

        <p style={{
          textAlign: 'center',
          marginTop: '2rem',
          color: '#666'
        }}>
          {t('auth.login.noAccount')}{' '}
          <Link to="/signup" style={{
            color: '#FF6B35',
            fontWeight: 'bold',
            textDecoration: 'none'
          }}>
            {t('auth.login.signUp')}
          </Link>
        </p>

        <p style={{
          textAlign: 'center',
          marginTop: '2rem',
          fontSize: '0.85rem',
          color: '#9CA3AF'
        }}>
          <a
            href="https://mr-vision.ch"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#9CA3AF',
              textDecoration: 'none',
              transition: 'color 0.2s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#FF6B35')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#9CA3AF')}
          >
            {t('common.createdBy')} ✨
          </a>
        </p>
      </div>
    </div>
  );
}
