// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../config/firebase';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

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
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h1 style={{ color: '#2E3A4B' }}>
            🦊 VoltFox Dashboard
          </h1>
          <button
            onClick={handleSignOut}
            style={{
              padding: '0.5rem 1rem',
              background: '#FF6B35',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Sign Out
          </button>
        </div>
        
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '15px',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <h2 style={{ color: '#2E3A4B', marginBottom: '1rem' }}>
            Welcome to VoltFox! 
          </h2>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            {user?.email ? `Logged in as: ${user.email}` : 'Start by adding your first device'}
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
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '15px',
            borderLeft: '4px solid #10B981'
          }}>
            <h3 style={{ color: '#2E3A4B', marginBottom: '0.5rem' }}>Active Devices</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10B981' }}>0</p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>All batteries healthy</p>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '15px',
            borderLeft: '4px solid #F59E0B'
          }}>
            <h3 style={{ color: '#2E3A4B', marginBottom: '0.5rem' }}>Warnings</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#F59E0B' }}>0</p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>No issues detected</p>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '15px',
            borderLeft: '4px solid #3B82F6'
          }}>
            <h3 style={{ color: '#2E3A4B', marginBottom: '0.5rem' }}>Days Monitored</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3B82F6' }}>0</p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Since today</p>
          </div>
        </div>
          
        <p style={{
          marginTop: '3rem',
          fontSize: '0.9rem',
          color: '#9CA3AF',
          textAlign: 'center'
        }}>
          Created by Mr. Vision ✨
        </p>
      </div>
    </div>
  );
}
