// src/pages/Community.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, TrendingUp, Award, Battery, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDevices } from '../context/DeviceContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const Community: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { devices } = useDevices();
  const [hasOptedIn, setHasOptedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user's community settings
  useEffect(() => {
    const loadCommunitySettings = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setHasOptedIn(data?.communitySettings?.shareDataWithCommunity || false);
        }
      } catch (error) {
        console.error('Error loading community settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCommunitySettings();
  }, [currentUser]);

  // Calculate user stats
  const userStats = {
    totalDevices: devices.length,
    averageHealth: devices.length > 0
      ? Math.round(devices.reduce((sum, d) => sum + d.health, 0) / devices.length)
      : 0,
    healthyDevices: devices.filter(d => d.status === 'healthy').length,
    criticalDevices: devices.filter(d => d.status === 'critical').length
  };

  // Mock community data (will be replaced with real data from Firestore later)
  const communityStats = {
    totalUsers: 1247,
    totalDevices: 5892,
    averageHealth: 83,
    mostPopularBrands: [
      { name: 'DJI', count: 1523, percentage: 26 },
      { name: 'Apple', count: 1289, percentage: 22 },
      { name: 'Samsung', count: 987, percentage: 17 },
      { name: 'Bosch', count: 654, percentage: 11 },
      { name: 'Others', count: 1439, percentage: 24 }
    ],
    topDevices: [
      { type: 'Drone', brand: 'DJI', model: 'Mavic 3', avgHealth: 94, count: 342 },
      { type: 'Smartphone', brand: 'Apple', model: 'iPhone 15 Pro', avgHealth: 92, count: 287 },
      { type: 'Laptop', brand: 'Apple', model: 'MacBook Pro M3', avgHealth: 91, count: 234 },
      { type: 'E-Bike', brand: 'Bosch', model: 'PowerTube 625', avgHealth: 89, count: 198 },
      { type: 'Camera', brand: 'Sony', model: 'A7 IV', avgHealth: 88, count: 156 }
    ]
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Lädt Community-Daten...</p>
      </div>
    );
  }

  if (!hasOptedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#FFF8F3',
        padding: '2rem'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'transparent',
              border: 'none',
              color: 'var(--vf-primary)',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '2rem'
            }}
          >
            <ArrowLeft size={20} />
            Zurück zum Dashboard
          </button>

          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '3rem',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <Users size={64} color="var(--vf-primary)" style={{ margin: '0 auto 1.5rem' }} />
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#2E3A4B' }}>
              Willkommen in der VoltFox Community!
            </h1>
            <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '2rem', lineHeight: '1.6' }}>
              Um Community-Daten zu sehen und deine Geräte mit anderen zu vergleichen,
              musst du zuerst die anonyme Datenfreigabe aktivieren.
            </p>

            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 210, 63, 0.1) 100%)',
              padding: '1.5rem',
              borderRadius: '12px',
              marginBottom: '2rem',
              border: '2px solid rgba(255, 107, 53, 0.2)'
            }}>
              <h3 style={{ color: '#2E3A4B', marginBottom: '1rem' }}>
                🔒 Deine Privatsphäre ist geschützt
              </h3>
              <p style={{ color: '#666', margin: 0, lineHeight: '1.6' }}>
                Wir speichern nur anonymisierte Gerätedaten (Typ, Marke, Batteriestatus).
                Keine persönlichen Informationen, Namen oder Standorte werden geteilt.
              </p>
            </div>

            <button
              onClick={() => navigate('/settings')}
              style={{
                padding: '1rem 2rem',
                background: 'linear-gradient(135deg, #FF6B35 0%, #FFD23F 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              Zu den Einstellungen
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        {/* Header */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'transparent',
            border: 'none',
            color: 'var(--vf-primary)',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: '1rem'
          }}
        >
          <ArrowLeft size={20} />
          Zurück zum Dashboard
        </button>

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#2E3A4B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={40} color="var(--vf-primary)" />
            VoltFox Community
          </h1>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>
            Vergleiche deine Geräte mit der Community und entdecke Trends
          </p>
        </div>

        {/* Community Stats Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '15px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Users size={24} color="#667eea" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#2E3A4B' }}>Community-Mitglieder</h3>
            </div>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: 'var(--vf-primary)' }}>
              {communityStats.totalUsers.toLocaleString()}
            </p>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '15px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Battery size={24} color="#10B981" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#2E3A4B' }}>Überwachte Geräte</h3>
            </div>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: 'var(--vf-primary)' }}>
              {communityStats.totalDevices.toLocaleString()}
            </p>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '15px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <TrendingUp size={24} color="#F59E0B" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#2E3A4B' }}>Durchschn. Gesundheit</h3>
            </div>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: 'var(--vf-primary)' }}>
              {communityStats.averageHealth}%
            </p>
          </div>
        </div>

        {/* User vs Community Comparison */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '1.5rem', color: '#2E3A4B' }}>
            📊 Deine Geräte vs. Community
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
              borderRadius: '12px',
              border: '2px solid rgba(102, 126, 234, 0.2)'
            }}>
              <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>Deine Geräte</p>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>
                {userStats.totalDevices}
              </p>
            </div>

            <div style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)',
              borderRadius: '12px',
              border: '2px solid rgba(16, 185, 129, 0.2)'
            }}>
              <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
                Deine Durchschn. Gesundheit
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#10B981' }}>
                  {userStats.averageHealth}%
                </p>
                {userStats.averageHealth > communityStats.averageHealth ? (
                  <span style={{ color: '#10B981', fontSize: '1.2rem' }}>↑</span>
                ) : userStats.averageHealth < communityStats.averageHealth ? (
                  <span style={{ color: '#EF4444', fontSize: '1.2rem' }}>↓</span>
                ) : (
                  <span style={{ color: '#6B7280', fontSize: '1.2rem' }}>→</span>
                )}
              </div>
              <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.85rem' }}>
                Community: {communityStats.averageHealth}%
              </p>
            </div>

            <div style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
              borderRadius: '12px',
              border: '2px solid rgba(245, 158, 11, 0.2)'
            }}>
              <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>Gesunde Geräte</p>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#F59E0B' }}>
                {userStats.healthyDevices}/{userStats.totalDevices}
              </p>
            </div>

            {userStats.criticalDevices > 0 && (
              <div style={{
                padding: '1.5rem',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)',
                borderRadius: '12px',
                border: '2px solid rgba(239, 68, 68, 0.2)'
              }}>
                <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
                  <AlertCircle size={16} style={{ marginRight: '0.25rem' }} />
                  Kritische Geräte
                </p>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#EF4444' }}>
                  {userStats.criticalDevices}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Top Devices */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '1.5rem', color: '#2E3A4B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={28} color="var(--vf-primary)" />
            Top 5 Geräte der Community
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {communityStats.topDevices.map((device, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1rem',
                  background: index === 0
                    ? 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 210, 63, 0.1) 100%)'
                    : '#f9f9f9',
                  borderRadius: '12px',
                  border: index === 0 ? '2px solid var(--vf-primary)' : '1px solid #e5e5e5'
                }}
              >
                <div style={{
                  minWidth: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: index === 0
                    ? 'linear-gradient(135deg, #FF6B35 0%, #FFD23F 100%)'
                    : index === 1
                    ? 'linear-gradient(135deg, #C0C0C0 0%, #E8E8E8 100%)'
                    : index === 2
                    ? 'linear-gradient(135deg, #CD7F32 0%, #D4AF37 100%)'
                    : '#e5e5e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  color: index < 3 ? 'white' : '#666',
                  marginRight: '1rem'
                }}>
                  {index + 1}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, color: '#2E3A4B' }}>
                      {device.brand} {device.model}
                    </span>
                    {index === 0 && <span style={{ fontSize: '1.2rem' }}>🏆</span>}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    {device.type} • {device.count} Geräte überwacht
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--vf-primary)' }}>
                    {device.avgHealth}%
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>
                    Durchschn. Gesundheit
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Brands */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '2rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '1.5rem', color: '#2E3A4B' }}>
            📱 Beliebteste Marken
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {communityStats.mostPopularBrands.map((brand, index) => (
              <div key={index}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, color: '#2E3A4B' }}>{brand.name}</span>
                  <span style={{ color: '#666' }}>
                    {brand.count.toLocaleString()} Geräte ({brand.percentage}%)
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '12px',
                  background: '#e5e5e5',
                  borderRadius: '6px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${brand.percentage}%`,
                    height: '100%',
                    background: 'linear-gradient(135deg, #FF6B35 0%, #FFD23F 100%)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;
