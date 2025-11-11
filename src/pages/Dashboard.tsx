import React from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFF8F3',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{ color: '#2E3A4B', marginBottom: '2rem' }}>
          🦊 VoltFox Dashboard
        </h1>
        
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '15px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#2E3A4B', marginBottom: '1rem' }}>
            Welcome to VoltFox!
          </h2>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Start by adding your first device
          </p>
          <Link to="/add-device" style={{
            display: 'inline-block',
            padding: '1rem 2rem',
            background: 'linear-gradient(135deg, #FF6B35 0%, #FFD23F 100%)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '50px',
            fontWeight: 'bold'
          }}>
            + Add First Device
          </Link>
          
          <p style={{
            marginTop: '3rem',
            fontSize: '0.9rem',
            color: '#9CA3AF'
          }}>
            Created by Mr. Vision ✨
          </p>
        </div>
      </div>
    </div>
  );
}
