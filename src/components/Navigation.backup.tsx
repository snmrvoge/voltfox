import React from 'react';
import { Link } from 'react-router-dom';

export default function Navigation() {
  return (
    <nav style={{
      background: 'linear-gradient(135deg, #FF6B35 0%, #FFD23F 100%)',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <Link to="/" style={{ 
        fontSize: '1.5rem', 
        fontWeight: 'bold', 
        color: 'white',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        🦊 VoltFox
      </Link>
      
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link to="/login" style={{
          color: 'white',
          textDecoration: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '25px',
          background: 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(10px)'
        }}>
          Login
        </Link>
        <Link to="/signup" style={{
          color: '#FF6B35',
          background: 'white',
          textDecoration: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '25px',
          fontWeight: 'bold'
        }}>
          Sign Up
        </Link>
      </div>
    </nav>
  );
}
