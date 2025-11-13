// src/pages/NotificationSettings.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { NotificationService } from '../services/NotificationService';
import { ArrowLeft, Bell, Mail, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

interface NotificationPreferences {
  browserNotifications: boolean;
  emailNotifications: boolean;
  emailAddress?: string;
  notifyOnCritical: boolean;
  notifyOnWarning: boolean;
  notifyOnLowHealth: boolean;
  notifyOnWarrantyExpiration: boolean;
}

export default function NotificationSettings() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    browserNotifications: false,
    emailNotifications: false,
    emailAddress: currentUser?.email || '',
    notifyOnCritical: true,
    notifyOnWarning: true,
    notifyOnLowHealth: true,
    notifyOnWarrantyExpiration: true
  });

  useEffect(() => {
    loadPreferences();
    setBrowserPermission(Notification.permission);
  }, [currentUser]);

  const loadPreferences = async () => {
    if (!currentUser) return;

    try {
      const docRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().notificationPreferences) {
        setPreferences({
          ...preferences,
          ...docSnap.data().notificationPreferences
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!currentUser) return;

    setSaving(true);
    try {
      const docRef = doc(db, 'users', currentUser.uid);
      await setDoc(
        docRef,
        {
          notificationPreferences: preferences,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );

      toast.success(t('notifications.settings.saved'));
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error(t('notifications.settings.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const requestBrowserPermission = async () => {
    if (!currentUser) {
      toast.error('User not authenticated');
      return;
    }

    const granted = await NotificationService.requestPermission(currentUser.uid);
    setBrowserPermission(Notification.permission);

    if (granted) {
      setPreferences({ ...preferences, browserNotifications: true });
      toast.success(t('notifications.settings.browserEnabled'));

      // Send test notification
      NotificationService.send(t('notifications.test.title'), {
        body: t('notifications.test.body')
      });
    } else {
      toast.error(t('notifications.settings.browserDenied'));
    }
  };

  const handleToggleBrowser = async () => {
    if (!preferences.browserNotifications && browserPermission !== 'granted') {
      await requestBrowserPermission();
    } else {
      setPreferences({ ...preferences, browserNotifications: !preferences.browserNotifications });
    }
  };

  const sendTestNotification = async (testType: 'push' | 'email' | 'both') => {
    if (!currentUser) return;

    const loadingToast = toast.loading(
      testType === 'push' ? 'Sende Test-Push...' :
      testType === 'email' ? 'Sende Test-E-Mail...' :
      'Sende Test-Benachrichtigungen...'
    );

    try {
      const sendTestNotifications = httpsCallable(functions, 'sendTestNotifications');
      const result = await sendTestNotifications({ testType }) as any;

      toast.dismiss(loadingToast);

      if (result.data.pushSent || result.data.emailSent) {
        const messages = [];
        if (result.data.pushSent) {
          messages.push(`📱 Push an ${result.data.pushCount} Gerät${result.data.pushCount !== 1 ? 'e' : ''}`);
        }
        if (result.data.emailSent) {
          messages.push('📧 E-Mail');
        }
        toast.success(`✅ Test erfolgreich!\n${messages.join(' & ')} gesendet`);
      } else {
        toast.error('❌ Keine Benachrichtigungen gesendet. Prüfe deine Einstellungen.');
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error('Error sending test notification:', error);
      toast.error(`❌ Fehler: ${error.message}`);
    }
  };

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
        <p>{t('common.loading')}</p>
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
        maxWidth: '800px',
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
            marginBottom: '1rem'
          }}
        >
          <ArrowLeft size={20} />
          {t('common.back')}
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
            <Bell size={32} /> {t('notifications.settings.title')}
          </h1>
          <p style={{ color: '#666' }}>{t('notifications.settings.subtitle')}</p>
        </div>

        {/* Browser Notifications */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '15px',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
            <Smartphone size={24} color="#667eea" />
            <h2 style={{ color: '#2E3A4B', margin: 0 }}>{t('notifications.settings.browser.title')}</h2>
          </div>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            {t('notifications.settings.browser.description')}
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            background: '#F9FAFB',
            borderRadius: '10px',
            marginBottom: '1rem'
          }}>
            <div>
              <strong style={{ color: '#2E3A4B' }}>{t('notifications.settings.browser.enable')}</strong>
              <p style={{ color: '#666', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
                {browserPermission === 'granted'
                  ? t('notifications.settings.browser.permissionGranted')
                  : t('notifications.settings.browser.permissionNeeded')}
              </p>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
              <input
                type="checkbox"
                checked={preferences.browserNotifications}
                onChange={handleToggleBrowser}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: preferences.browserNotifications ? '#10B981' : '#ccc',
                transition: '0.4s',
                borderRadius: '34px'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '',
                  height: '26px',
                  width: '26px',
                  left: preferences.browserNotifications ? '30px' : '4px',
                  bottom: '4px',
                  background: 'white',
                  transition: '0.4s',
                  borderRadius: '50%'
                }} />
              </span>
            </label>
          </div>
        </div>

        {/* Test Notification Buttons */}
        <div style={{
          background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
          padding: '1.5rem',
          borderRadius: '15px',
          marginBottom: '1.5rem',
          border: '2px solid #3B82F6',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
        }}>
          <h3 style={{
            color: '#1E40AF',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            margin: '0 0 0.5rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🧪 Test-Benachrichtigungen
          </h3>
          <p style={{ color: '#1E40AF', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Teste deine Benachrichtigungseinstellungen
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Push Test Button */}
            <button
              onClick={() => sendTestNotification('push')}
              disabled={browserPermission !== 'granted'}
              style={{
                flex: '1',
                minWidth: '150px',
                padding: '0.75rem 1.5rem',
                background: browserPermission === 'granted'
                  ? 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)'
                  : '#D1D5DB',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 'bold',
                fontSize: '0.95rem',
                cursor: browserPermission === 'granted' ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: browserPermission === 'granted' ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none'
              }}
              onMouseOver={(e) => {
                if (browserPermission === 'granted') {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                if (browserPermission === 'granted') {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                }
              }}
            >
              <Smartphone size={18} />
              Test Push
            </button>

            {/* Email Test Button */}
            <button
              onClick={() => sendTestNotification('email')}
              disabled={!preferences.emailNotifications}
              style={{
                flex: '1',
                minWidth: '150px',
                padding: '0.75rem 1.5rem',
                background: preferences.emailNotifications
                  ? 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)'
                  : '#D1D5DB',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 'bold',
                fontSize: '0.95rem',
                cursor: preferences.emailNotifications ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: preferences.emailNotifications ? '0 4px 12px rgba(255, 107, 53, 0.3)' : 'none'
              }}
              onMouseOver={(e) => {
                if (preferences.emailNotifications) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 107, 53, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                if (preferences.emailNotifications) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 107, 53, 0.3)';
                }
              }}
            >
              <Mail size={18} />
              Test E-Mail
            </button>

            {/* Both Test Button */}
            <button
              onClick={() => sendTestNotification('both')}
              disabled={browserPermission !== 'granted' && !preferences.emailNotifications}
              style={{
                flex: '1',
                minWidth: '150px',
                padding: '0.75rem 1.5rem',
                background: (browserPermission === 'granted' || preferences.emailNotifications)
                  ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                  : '#D1D5DB',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 'bold',
                fontSize: '0.95rem',
                cursor: (browserPermission === 'granted' || preferences.emailNotifications) ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: (browserPermission === 'granted' || preferences.emailNotifications) ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
              }}
              onMouseOver={(e) => {
                if (browserPermission === 'granted' || preferences.emailNotifications) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                }
              }}
              onMouseOut={(e) => {
                if (browserPermission === 'granted' || preferences.emailNotifications) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                }
              }}
            >
              <Bell size={18} />
              Test Beide
            </button>
          </div>
        </div>

        {/* Email Notifications */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '15px',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
            <Mail size={24} color="#FF6B35" />
            <h2 style={{ color: '#2E3A4B', margin: 0 }}>{t('notifications.settings.email.title')}</h2>
          </div>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            {t('notifications.settings.email.description')}
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            background: '#F9FAFB',
            borderRadius: '10px',
            marginBottom: '1rem'
          }}>
            <div>
              <strong style={{ color: '#2E3A4B' }}>{t('notifications.settings.email.enable')}</strong>
              <p style={{ color: '#666', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
                {preferences.emailAddress || currentUser?.email}
              </p>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
              <input
                type="checkbox"
                checked={preferences.emailNotifications}
                onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: preferences.emailNotifications ? '#10B981' : '#ccc',
                transition: '0.4s',
                borderRadius: '34px'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '',
                  height: '26px',
                  width: '26px',
                  left: preferences.emailNotifications ? '30px' : '4px',
                  bottom: '4px',
                  background: 'white',
                  transition: '0.4s',
                  borderRadius: '50%'
                }} />
              </span>
            </label>
          </div>
        </div>

        {/* Notification Types */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '15px',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ color: '#2E3A4B', marginBottom: '1rem' }}>{t('notifications.settings.types.title')}</h2>

          {/* Critical Alerts */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            background: '#FEE2E2',
            borderRadius: '10px',
            marginBottom: '1rem'
          }}>
            <div>
              <strong style={{ color: '#991B1B' }}>🚨 {t('notifications.settings.types.critical')}</strong>
              <p style={{ color: '#991B1B', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
                {t('notifications.settings.types.criticalDesc')}
              </p>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
              <input
                type="checkbox"
                checked={preferences.notifyOnCritical}
                onChange={(e) => setPreferences({ ...preferences, notifyOnCritical: e.target.checked })}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: preferences.notifyOnCritical ? '#EF4444' : '#ccc',
                transition: '0.4s',
                borderRadius: '34px'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '',
                  height: '26px',
                  width: '26px',
                  left: preferences.notifyOnCritical ? '30px' : '4px',
                  bottom: '4px',
                  background: 'white',
                  transition: '0.4s',
                  borderRadius: '50%'
                }} />
              </span>
            </label>
          </div>

          {/* Warning Alerts */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            background: '#FEF3C7',
            borderRadius: '10px',
            marginBottom: '1rem'
          }}>
            <div>
              <strong style={{ color: '#92400E' }}>⚠️ {t('notifications.settings.types.warning')}</strong>
              <p style={{ color: '#92400E', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
                {t('notifications.settings.types.warningDesc')}
              </p>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
              <input
                type="checkbox"
                checked={preferences.notifyOnWarning}
                onChange={(e) => setPreferences({ ...preferences, notifyOnWarning: e.target.checked })}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: preferences.notifyOnWarning ? '#F59E0B' : '#ccc',
                transition: '0.4s',
                borderRadius: '34px'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '',
                  height: '26px',
                  width: '26px',
                  left: preferences.notifyOnWarning ? '30px' : '4px',
                  bottom: '4px',
                  background: 'white',
                  transition: '0.4s',
                  borderRadius: '50%'
                }} />
              </span>
            </label>
          </div>

          {/* Low Health */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            background: '#DBEAFE',
            borderRadius: '10px',
            marginBottom: '1rem'
          }}>
            <div>
              <strong style={{ color: '#1E40AF' }}>💊 {t('notifications.settings.types.health')}</strong>
              <p style={{ color: '#1E40AF', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
                {t('notifications.settings.types.healthDesc')}
              </p>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
              <input
                type="checkbox"
                checked={preferences.notifyOnLowHealth}
                onChange={(e) => setPreferences({ ...preferences, notifyOnLowHealth: e.target.checked })}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: preferences.notifyOnLowHealth ? '#3B82F6' : '#ccc',
                transition: '0.4s',
                borderRadius: '34px'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '',
                  height: '26px',
                  width: '26px',
                  left: preferences.notifyOnLowHealth ? '30px' : '4px',
                  bottom: '4px',
                  background: 'white',
                  transition: '0.4s',
                  borderRadius: '50%'
                }} />
              </span>
            </label>
          </div>

          {/* Warranty Expiration */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            background: '#EDE9FE',
            borderRadius: '10px'
          }}>
            <div>
              <strong style={{ color: '#5B21B6' }}>🛡️ {t('notifications.settings.types.warranty')}</strong>
              <p style={{ color: '#5B21B6', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
                {t('notifications.settings.types.warrantyDesc')}
              </p>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
              <input
                type="checkbox"
                checked={preferences.notifyOnWarrantyExpiration}
                onChange={(e) => setPreferences({ ...preferences, notifyOnWarrantyExpiration: e.target.checked })}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: preferences.notifyOnWarrantyExpiration ? '#8B5CF6' : '#ccc',
                transition: '0.4s',
                borderRadius: '34px'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '',
                  height: '26px',
                  width: '26px',
                  left: preferences.notifyOnWarrantyExpiration ? '30px' : '4px',
                  bottom: '4px',
                  background: 'white',
                  transition: '0.4s',
                  borderRadius: '50%'
                }} />
              </span>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={savePreferences}
          disabled={saving}
          style={{
            width: '100%',
            padding: '1rem 2rem',
            background: 'linear-gradient(135deg, #FF6B35 0%, #FFD23F 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            transition: 'all 0.2s'
          }}
        >
          {saving ? t('common.saving') : t('common.save')}
        </button>
      </div>
    </div>
  );
}
