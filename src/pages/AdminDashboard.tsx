// src/pages/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, query, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ArrowLeft, Users, Battery, TrendingUp, Activity } from 'lucide-react';

interface UserStats {
  uid: string;
  email: string;
  deviceCount: number;
  devices: any[];
  isBlocked?: boolean;
  blockedAt?: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [totalDevices, setTotalDevices] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is admin via Firestore
    const checkAdminStatus = async () => {
      if (!currentUser) {
        navigate('/');
        return;
      }

      try {
        // Check user document for admin role
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          console.log('User document does not exist');
          navigate('/dashboard');
          return;
        }

        const userData = userDocSnap.data();

        // Check if user has admin role or isAdmin flag
        const userIsAdmin = userData?.isAdmin === true || userData?.role === 'admin';

        console.log('Admin check:', {
          uid: currentUser.uid,
          email: currentUser.email,
          isAdmin: userIsAdmin,
          userData
        });

        setIsAdmin(userIsAdmin);

        if (!userIsAdmin) {
          console.log('User is not admin, redirecting to dashboard');
          navigate('/dashboard');
          return;
        }

        loadAdminData();
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/dashboard');
      }
    };

    checkAdminStatus();
  }, [currentUser, navigate]);

  const loadAdminData = async () => {
    try {
      setLoading(true);

      // Load all users and their devices
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);

      console.log(`Found ${usersSnapshot.docs.length} users in database`);

      const stats: UserStats[] = [];
      let deviceTotal = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;

        console.log(`Loading devices for user: ${userId} (${userData.email})`);

        try {
          // Load devices for this user - try without orderBy first
          const devicesCollection = collection(db, 'users', userId, 'devices');
          const devicesSnapshot = await getDocs(devicesCollection);

          console.log(`  Found ${devicesSnapshot.docs.length} devices for ${userData.email}`);

          const devices = devicesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          deviceTotal += devices.length;

          stats.push({
            uid: userId,
            email: userData.email || 'Unknown',
            deviceCount: devices.length,
            devices,
            isBlocked: userData.isBlocked || false,
            blockedAt: userData.blockedAt
          });
        } catch (deviceError) {
          console.error(`Error loading devices for user ${userId}:`, deviceError);
          // Still add the user but with 0 devices
          stats.push({
            uid: userId,
            email: userData.email || 'Unknown',
            deviceCount: 0,
            devices: []
          });
        }
      }

      console.log(`Total devices found: ${deviceTotal}`);

      // Sort by device count
      stats.sort((a, b) => b.deviceCount - a.deviceCount);

      setUserStats(stats);
      setTotalDevices(deviceTotal);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBlockUser = async (userId: string, currentlyBlocked: boolean) => {
    if (!currentUser) return;

    // Prevent blocking yourself
    if (userId === currentUser.uid) {
      alert('⚠️ Du kannst dich nicht selbst sperren!');
      return;
    }

    const action = currentlyBlocked ? 'entsperren' : 'sperren';
    const confirmed = window.confirm(
      `Möchtest du diesen User wirklich ${action}?\n\n` +
      `${currentlyBlocked ? 'Der User kann sich danach wieder anmelden.' : 'Der User wird gesperrt und kann sich nicht mehr anmelden.'}`
    );

    if (!confirmed) return;

    try {
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        alert('User nicht gefunden!');
        return;
      }

      await setDoc(userDocRef, {
        ...userDocSnap.data(),
        isBlocked: !currentlyBlocked,
        blockedAt: !currentlyBlocked ? new Date().toISOString() : null,
        blockedBy: !currentlyBlocked ? currentUser.uid : null
      }, { merge: true });

      console.log(`User ${currentlyBlocked ? 'unblocked' : 'blocked'} successfully`);

      // Reload data to reflect changes
      loadAdminData();

      alert(`✅ User erfolgreich ${currentlyBlocked ? 'entsperrt' : 'gesperrt'}!`);
    } catch (error) {
      console.error('Error toggling user block:', error);
      alert('❌ Fehler beim Sperren/Entsperren des Users.');
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#FFF8F3',
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
          <Activity size={48} className="animate-pulse" style={{ margin: '0 auto', display: 'block' }} />
          <p style={{ marginTop: '1rem', color: '#666' }}>Lade Admin-Daten...</p>
        </div>
      </div>
    );
  }

  const avgDevicesPerUser = userStats.length > 0
    ? (totalDevices / userStats.length).toFixed(1)
    : '0';

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFF8F3',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'transparent',
            border: 'none',
            color: '#FF6B35',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: '1rem',
            transition: 'all 0.3s'
          }}
        >
          <ArrowLeft size={20} />
          Zurück zum Dashboard
        </button>

        {/* Header */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '15px',
          marginBottom: '2rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <h1 style={{ color: '#2E3A4B', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            🛡️ Admin Dashboard
          </h1>
          <p style={{ color: '#666' }}>Übersicht über alle VoltFox Nutzer und Geräte</p>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {/* Total Users */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '15px',
            borderLeft: '4px solid #667eea',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
              <Users size={24} color="#667eea" />
              <h3 style={{ color: '#2E3A4B', margin: 0 }}>Nutzer</h3>
            </div>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#667eea', margin: '0.5rem 0' }}>
              {userStats.length}
            </p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Registrierte Accounts</p>
          </div>

          {/* Total Devices */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '15px',
            borderLeft: '4px solid #10B981',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
              <Battery size={24} color="#10B981" />
              <h3 style={{ color: '#2E3A4B', margin: 0 }}>Geräte</h3>
            </div>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10B981', margin: '0.5rem 0' }}>
              {totalDevices}
            </p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Gesamt registriert</p>
          </div>

          {/* Avg Devices per User */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '15px',
            borderLeft: '4px solid #F59E0B',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
              <TrendingUp size={24} color="#F59E0B" />
              <h3 style={{ color: '#2E3A4B', margin: 0 }}>Durchschnitt</h3>
            </div>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#F59E0B', margin: '0.5rem 0' }}>
              {avgDevicesPerUser}
            </p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Geräte pro Nutzer</p>
          </div>
        </div>

        {/* User List */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '15px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ color: '#2E3A4B', marginBottom: '1.5rem' }}>Nutzer-Übersicht</h2>

          {userStats.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
              Noch keine Nutzer registriert.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{
                    borderBottom: '2px solid #E5E7EB',
                    textAlign: 'left'
                  }}>
                    <th style={{ padding: '1rem', color: '#666', fontWeight: 600 }}>Email</th>
                    <th style={{ padding: '1rem', color: '#666', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '1rem', color: '#666', fontWeight: 600 }}>Geräte</th>
                    <th style={{ padding: '1rem', color: '#666', fontWeight: 600 }}>Geräte-Liste</th>
                    <th style={{ padding: '1rem', color: '#666', fontWeight: 600 }}>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {userStats.map((user, index) => (
                    <tr
                      key={user.uid}
                      style={{
                        borderBottom: '1px solid #E5E7EB',
                        background: index % 2 === 0 ? 'white' : '#F9FAFB'
                      }}
                    >
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div style={{
                            fontWeight: 600,
                            color: user.isBlocked ? '#991B1B' : '#2E3A4B',
                            textDecoration: user.isBlocked ? 'line-through' : 'none'
                          }}>
                            {user.email}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#999' }}>
                            UID: {user.uid.substring(0, 8)}...
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          background: user.isBlocked ? '#FEE2E2' : '#D1FAE5',
                          color: user.isBlocked ? '#991B1B' : '#065F46',
                          borderRadius: '12px',
                          fontWeight: 600,
                          fontSize: '0.9rem'
                        }}>
                          {user.isBlocked ? '🚫 Gesperrt' : '✅ Aktiv'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          background: user.deviceCount > 0 ? '#DBEAFE' : '#FEE2E2',
                          color: user.deviceCount > 0 ? '#1E40AF' : '#991B1B',
                          borderRadius: '12px',
                          fontWeight: 600,
                          fontSize: '0.9rem'
                        }}>
                          {user.deviceCount}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {user.devices.length > 0 ? (
                          <div style={{ fontSize: '0.9rem', color: '#666' }}>
                            {user.devices.slice(0, 3).map((device: any) => device.name).join(', ')}
                            {user.devices.length > 3 && ` (+${user.devices.length - 3} mehr)`}
                          </div>
                        ) : (
                          <span style={{ color: '#999', fontSize: '0.9rem' }}>Keine Geräte</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <button
                          onClick={() => toggleBlockUser(user.uid, user.isBlocked || false)}
                          disabled={user.uid === currentUser?.uid}
                          style={{
                            padding: '0.5rem 1rem',
                            background: user.isBlocked ? '#10B981' : '#EF4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: user.uid === currentUser?.uid ? 'not-allowed' : 'pointer',
                            opacity: user.uid === currentUser?.uid ? 0.5 : 1,
                            transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => {
                            if (user.uid !== currentUser?.uid) {
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          {user.isBlocked ? '✓ Entsperren' : '✕ Sperren'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <p style={{
          marginTop: '2rem',
          fontSize: '0.9rem',
          color: '#9CA3AF',
          textAlign: 'center'
        }}>
          🛡️ Admin Access Only
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
