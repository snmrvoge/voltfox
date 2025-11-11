// @ts-nocheck
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function Signup() {
  const navigate = useNavigate();
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
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: formData.name,
        email: formData.email,
        createdAt: serverTimestamp(),
        plan: 'free',
        devices: []
      });

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
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
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', color: '#2E3A4B' }}>
            🦊 VoltFox
          </h1>
          <p style={{ color: '#666', marginTop: '0.5rem' }}>
            Create your account
          </p>
        </div>

        {/* Error Message */}
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

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#2E3A4B',
              fontWeight: '500'
            }}>
              Your Name
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
              placeholder="Mr. Vision"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#2E3A4B',
              fontWeight: '500'
            }}>
              Email Address
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
              placeholder="hello@voltfox.app"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#2E3A4B',
              fontWeight: '500'
            }}>
              Password
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
              placeholder="Min. 6 characters"
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#2E3A4B',
              fontWeight: '500'
            }}>
              Confirm Password
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
              placeholder="Repeat password"
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
            {loading ? 'Creating Account...' : 'Create Account 🚀'}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          margin: '2rem 0',
          textAlign: 'center',
          color: '#9CA3AF'
        }}>
          or
        </div>

        {/* Google Sign In */}
        <button
          onClick={() => alert('Google Sign In - Coming Soon!')}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'white',
            color: '#2E3A4B',
            border: '2px solid #E5E7EB',
            borderRadius: '10px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>🌐</span>
          Continue with Google
        </button>

        {/* Login Link */}
        <p style={{
          textAlign: 'center',
          marginTop: '2rem',
          color: '#666'
        }}>
          Already have an account?{' '}
          <Link to="/login" style={{
            color: '#FF6B35',
            fontWeight: 'bold',
            textDecoration: 'none'
          }}>
            Sign In
          </Link>
        </p>

        {/* Mr. Vision Credit */}
        <p style={{
          textAlign: 'center',
          marginTop: '2rem',
          fontSize: '0.85rem',
          color: '#9CA3AF'
        }}>
          Created by Mr. Vision ✨
        </p>
      </div>
    </div>
  );
}
