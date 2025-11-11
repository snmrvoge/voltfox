// @ts-nocheck
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { auth, db, googleProvider } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function Signup() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Creating user with Firebase Auth...');
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      console.log('User created:', userCredential.user.uid);

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: formData.name,
        email: formData.email,
        createdAt: serverTimestamp(),
        plan: 'free',
        devices: []
      });

      console.log('User profile created in Firestore');
      navigate('/dashboard');
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Starting Google Sign In...');
      const result = await signInWithPopup(auth, googleProvider);
      
      await setDoc(doc(db, 'users', result.user.uid), {
        name: result.user.displayName || 'User',
        email: result.user.email,
        photoURL: result.user.photoURL || '',
        createdAt: serverTimestamp(),
        plan: 'free',
        devices: []
      }, { merge: true });
      
      navigate('/dashboard');
    } catch (err) {
      console.error('Google Sign In error:', err);
      setError('Google Sign In failed: ' + err.message);
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
            {t('auth.signup.title')}
          </p>
        </div>

        {error && (
          <div style={{
            background: '#FEE2E2',
            color: '#DC2626',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.9rem'
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
              {t('auth.signup.name')}
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #E5E7EB',
                borderRadius: '10px',
                fontSize: '1rem',
                outline: 'none'
              }}
              placeholder={t('auth.signup.namePlaceholder')}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#2E3A4B',
              fontWeight: '500'
            }}>
              {t('auth.signup.email')}
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #E5E7EB',
                borderRadius: '10px',
                fontSize: '1rem',
                outline: 'none'
              }}
              placeholder={t('auth.signup.emailPlaceholder')}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#2E3A4B',
              fontWeight: '500'
            }}>
              {t('auth.signup.password')}
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #E5E7EB',
                borderRadius: '10px',
                fontSize: '1rem',
                outline: 'none'
              }}
              placeholder={t('auth.signup.passwordPlaceholder')}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#2E3A4B',
              fontWeight: '500'
            }}>
              {t('auth.signup.confirmPassword')}
            </label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #E5E7EB',
                borderRadius: '10px',
                fontSize: '1rem',
                outline: 'none'
              }}
              placeholder={t('auth.signup.confirmPlaceholder')}
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
            {loading ? t('auth.signup.submitting') : t('auth.signup.submit')}
          </button>
        </form>

        <div style={{
          margin: '2rem 0',
          textAlign: 'center',
          color: '#9CA3AF'
        }}>
          {t('auth.signup.or')}
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
          {t('auth.signup.google')}
        </button>

        <p style={{
          textAlign: 'center',
          marginTop: '2rem',
          color: '#666'
        }}>
          {t('auth.signup.hasAccount')}{' '}
          <Link to="/login" style={{
            color: '#FF6B35',
            fontWeight: 'bold',
            textDecoration: 'none'
          }}>
            {t('auth.signup.signIn')}
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
