// src/pages/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, query, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ArrowLeft, Users, Battery, TrendingUp, Activity, Shield } from 'lucide-react';

interface UserStats {
  uid: string;
  email: string;
  deviceCount: number;
  devices: any[];
  isBlocked?: boolean;
  blockedAt?: string;
  insuranceValue: number;
  currency: string;
  plan: 'free' | 'pro' | 'business';
  createdAt?: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [totalDevices, setTotalDevices] = useState(0);
  const [totalInsuranceValue, setTotalInsuranceValue] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'email' | 'createdAt' | 'plan' | 'devices' | 'insuranceValue'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const usersPerPage = 10;

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
      let insuranceTotal = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;
        const userCurrency = userData.currency || 'EUR';

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

          // Calculate insurance value for this user
          const userInsuranceValue = devices.reduce((total: number, device: any) => {
            const value = device.currentValue || device.purchasePrice || 0;
            return total + value;
          }, 0);

          insuranceTotal += userInsuranceValue;

          stats.push({
            uid: userId,
            email: userData.email || 'Unknown',
            deviceCount: devices.length,
            devices,
            isBlocked: userData.isBlocked || false,
            blockedAt: userData.blockedAt,
            insuranceValue: userInsuranceValue,
            currency: userCurrency,
            plan: userData.plan || 'free',
            createdAt: userData.createdAt
          });
        } catch (deviceError) {
          console.error(`Error loading devices for user ${userId}:`, deviceError);
          // Still add the user but with 0 devices
          stats.push({
            uid: userId,
            email: userData.email || 'Unknown',
            deviceCount: 0,
            devices: [],
            insuranceValue: 0,
            currency: userCurrency,
            plan: userData.plan || 'free',
            createdAt: userData.createdAt
          });
        }
      }

      console.log(`Total devices found: ${deviceTotal}`);
      console.log(`Total insurance value: ${insuranceTotal}`);

      setUserStats(stats);
      setTotalDevices(deviceTotal);
      setTotalInsuranceValue(insuranceTotal);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sorting function
  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
    setCurrentPage(1); // Reset to first page on sort
  };

  // Sort users based on current sort settings
  const sortedUsers = [...userStats].sort((a, b) => {
    let aVal: any;
    let bVal: any;

    switch (sortBy) {
      case 'email':
        aVal = a.email.toLowerCase();
        bVal = b.email.toLowerCase();
        break;
      case 'createdAt':
        aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        break;
      case 'plan':
        const planOrder = { business: 3, pro: 2, free: 1 };
        aVal = planOrder[a.plan];
        bVal = planOrder[b.plan];
        break;
      case 'devices':
        aVal = a.deviceCount;
        bVal = b.deviceCount;
        break;
      case 'insuranceValue':
        aVal = a.insuranceValue;
        bVal = b.insuranceValue;
        break;
      default:
        aVal = a.email;
        bVal = b.email;
    }

    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = sortedUsers.slice(startIndex, endIndex);

  const toggleBlockUser = async (userId: string, currentlyBlocked: boolean) => {
    if (!currentUser) return;

    // Prevent blocking yourself
    if (userId === currentUser.uid) {
      alert(t('admin.blockUser.cannotBlockSelf'));
      return;
    }

    const confirmed = window.confirm(
      currentlyBlocked ? t('admin.blockUser.confirmUnblock') : t('admin.blockUser.confirmBlock')
    );

    if (!confirmed) return;

    try {
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        alert(t('admin.blockUser.userNotFound'));
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

      alert(currentlyBlocked ? t('admin.blockUser.successUnblock') : t('admin.blockUser.successBlock'));
    } catch (error) {
      console.error('Error toggling user block:', error);
      alert(t('admin.blockUser.error'));
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

  // Helper function to format currency
  const formatCurrency = (value: number, currencyCode: string = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Helper function to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
          {t('admin.backToDashboard')}
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
            🛡️ {t('admin.title')}
          </h1>
          <p style={{ color: '#666' }}>{t('admin.subtitle')}</p>
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
              <h3 style={{ color: '#2E3A4B', margin: 0 }}>{t('admin.stats.users')}</h3>
            </div>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#667eea', margin: '0.5rem 0' }}>
              {userStats.length}
            </p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>{t('admin.stats.registeredAccounts')}</p>
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
              <h3 style={{ color: '#2E3A4B', margin: 0 }}>{t('admin.stats.devices')}</h3>
            </div>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10B981', margin: '0.5rem 0' }}>
              {totalDevices}
            </p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>{t('admin.stats.totalRegistered')}</p>
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
              <h3 style={{ color: '#2E3A4B', margin: 0 }}>{t('admin.stats.average')}</h3>
            </div>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#F59E0B', margin: '0.5rem 0' }}>
              {avgDevicesPerUser}
            </p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>{t('admin.stats.devicesPerUser')}</p>
          </div>

          {/* Total Insurance Value */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '15px',
            borderLeft: '4px solid #8B5CF6',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
              <Shield size={24} color="#8B5CF6" />
              <h3 style={{ color: '#2E3A4B', margin: 0 }}>{t('admin.stats.insuranceValue')}</h3>
            </div>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#8B5CF6', margin: '0.5rem 0' }}>
              {formatCurrency(totalInsuranceValue)}
            </p>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>{t('admin.stats.totalInsured')}</p>
          </div>
        </div>

        {/* User List */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '15px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ color: '#2E3A4B', marginBottom: '1.5rem' }}>{t('admin.userOverview')}</h2>

          {userStats.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
              {t('admin.noUsers')}
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
                    <th
                      onClick={() => handleSort('email')}
                      style={{ padding: '1rem', color: '#666', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}
                    >
                      {t('admin.table.email')} {sortBy === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      onClick={() => handleSort('createdAt')}
                      style={{ padding: '1rem', color: '#666', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}
                    >
                      Registriert {sortBy === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      onClick={() => handleSort('plan')}
                      style={{ padding: '1rem', color: '#666', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}
                    >
                      Plan {sortBy === 'plan' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th style={{ padding: '1rem', color: '#666', fontWeight: 600 }}>{t('admin.table.status')}</th>
                    <th
                      onClick={() => handleSort('devices')}
                      style={{ padding: '1rem', color: '#666', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}
                    >
                      {t('admin.table.devices')} {sortBy === 'devices' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                      onClick={() => handleSort('insuranceValue')}
                      style={{ padding: '1rem', color: '#666', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}
                    >
                      {t('admin.table.insuranceValue')} {sortBy === 'insuranceValue' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th style={{ padding: '1rem', color: '#666', fontWeight: 600 }}>{t('admin.table.deviceList')}</th>
                    <th style={{ padding: '1rem', color: '#666', fontWeight: 600 }}>{t('admin.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map((user, index) => (
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
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>
                          {formatDate(user.createdAt)}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          background: user.plan === 'business' ? '#FEF3C7' : user.plan === 'pro' ? '#DBEAFE' : '#F3F4F6',
                          color: user.plan === 'business' ? '#92400E' : user.plan === 'pro' ? '#1E40AF' : '#6B7280',
                          borderRadius: '12px',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          textTransform: 'uppercase'
                        }}>
                          {user.plan === 'business' ? '💼 Business' : user.plan === 'pro' ? '⭐ Pro' : '🆓 Free'}
                        </span>
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
                          {user.isBlocked ? `🚫 ${t('admin.table.blocked')}` : `✅ ${t('admin.table.active')}`}
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
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          background: user.insuranceValue > 0 ? '#EDE9FE' : '#F3F4F6',
                          color: user.insuranceValue > 0 ? '#5B21B6' : '#6B7280',
                          borderRadius: '12px',
                          fontWeight: 600,
                          fontSize: '0.9rem'
                        }}>
                          {user.insuranceValue > 0 ? formatCurrency(user.insuranceValue, user.currency) : '-'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {user.devices.length > 0 ? (
                          <div style={{ fontSize: '0.9rem', color: '#666' }}>
                            {user.devices.slice(0, 3).map((device: any) => device.name).join(', ')}
                            {user.devices.length > 3 && ` (+${user.devices.length - 3} mehr)`}
                          </div>
                        ) : (
                          <span style={{ color: '#999', fontSize: '0.9rem' }}>{t('admin.table.noDevices')}</span>
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
                          {user.isBlocked ? `✓ ${t('admin.table.unblock')}` : `✕ ${t('admin.table.block')}`}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '2rem',
                  padding: '1rem',
                  background: '#F9FAFB',
                  borderRadius: '8px'
                }}>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>
                    Zeige {startIndex + 1}-{Math.min(endIndex, sortedUsers.length)} von {sortedUsers.length} Benutzern
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      style={{
                        padding: '0.5rem 1rem',
                        background: currentPage === 1 ? '#E5E7EB' : '#FF6B35',
                        color: currentPage === 1 ? '#9CA3AF' : 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 600,
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      ← Zurück
                    </button>

                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            background: page === currentPage ? '#FF6B35' : 'white',
                            color: page === currentPage ? 'white' : '#666',
                            border: '1px solid #E5E7EB',
                            borderRadius: '6px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            minWidth: '40px'
                          }}
                          onMouseOver={(e) => {
                            if (page !== currentPage) {
                              e.currentTarget.style.background = '#F3F4F6';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (page !== currentPage) {
                              e.currentTarget.style.background = 'white';
                            }
                          }}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      style={{
                        padding: '0.5rem 1rem',
                        background: currentPage === totalPages ? '#E5E7EB' : '#FF6B35',
                        color: currentPage === totalPages ? '#9CA3AF' : 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 600,
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Weiter →
                    </button>
                  </div>
                </div>
              )}
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
          🛡️ {t('admin.footer')}
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
