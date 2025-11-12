// src/pages/Settings.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, MapPin, DollarSign, Save, ArrowLeft, Bell, Mail, Smartphone } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useLoadScript } from '@react-google-maps/api';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng
} from 'use-places-autocomplete';
import { NotificationService } from '../services/NotificationService';

const libraries: ("places")[] = ['places'];

interface UserProfile {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  currency: 'CHF' | 'EUR' | 'USD' | 'GBP';
}

interface NotificationPreferences {
  browserNotifications: boolean;
  emailNotifications: boolean;
  emailAddress?: string;
  notifyOnCritical: boolean;
  notifyOnWarning: boolean;
  notifyOnLowHealth: boolean;
  notifyOnWarrantyExpiration: boolean;
}

// Address Autocomplete Component
const AddressAutocomplete: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (place: any) => void;
  placeholder: string;
}> = ({ value, onChange, onPlaceSelected, placeholder }) => {
  const {
    ready,
    value: autocompleteValue,
    suggestions: { status, data },
    setValue,
    clearSuggestions
  } = usePlacesAutocomplete({
    requestOptions: {
      types: ['address']
    },
    debounce: 300
  });

  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onChange(newValue);
    setShowSuggestions(true);
  };

  const handleSelect = async (description: string) => {
    setValue(description, false);
    onChange(description);
    clearSuggestions();
    setShowSuggestions(false);

    try {
      const results = await getGeocode({ address: description });
      await getLatLng(results[0]); // Get coordinates (not used but validates the address)

      // Extract address components
      const addressComponents = results[0].address_components;
      const addressData: any = {};

      addressComponents.forEach((component: any) => {
        const types = component.types;

        if (types.includes('street_number')) {
          addressData.streetNumber = component.long_name;
        }
        if (types.includes('route')) {
          addressData.street = component.long_name;
        }
        if (types.includes('locality')) {
          addressData.city = component.long_name;
        }
        if (types.includes('postal_code')) {
          addressData.postalCode = component.long_name;
        }
        if (types.includes('country')) {
          addressData.country = component.long_name;
        }
      });

      onPlaceSelected(addressData);
    } catch (error) {
      console.error('Error getting place details:', error);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={autocompleteValue || value}
        onChange={handleInput}
        onFocus={() => setShowSuggestions(true)}
        disabled={!ready}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '0.75rem',
          border: '2px solid #e5e5e5',
          borderRadius: '8px',
          fontSize: '1rem',
          transition: 'border 0.2s'
        }}
      />
      {showSuggestions && status === 'OK' && (
        <ul
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '2px solid #e5e5e5',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1000,
            margin: 0,
            padding: 0,
            listStyle: 'none',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
        >
          {data.map((suggestion) => (
            <li
              key={suggestion.place_id}
              onClick={() => handleSelect(suggestion.description)}
              style={{
                padding: '0.75rem',
                cursor: 'pointer',
                borderBottom: '1px solid #f0f0f0',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f9f9f9')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
            >
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                {suggestion.structured_formatting.main_text}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>
                {suggestion.structured_formatting.secondary_text}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');

  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    street: '',
    city: '',
    postalCode: '',
    country: '',
    currency: 'EUR'
  });

  const [notifications, setNotifications] = useState<NotificationPreferences>({
    browserNotifications: false,
    emailNotifications: false,
    emailAddress: currentUser?.email || '',
    notifyOnCritical: true,
    notifyOnWarning: true,
    notifyOnLowHealth: true,
    notifyOnWarrantyExpiration: true
  });

  // Load Google Maps
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries
  });

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();

          // Handle migration from fullName to firstName/lastName
          if (data.fullName && !data.firstName && !data.lastName) {
            const nameParts = data.fullName.split(' ');
            setProfile({
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              street: data.street || '',
              city: data.city || '',
              postalCode: data.postalCode || '',
              country: data.country || '',
              currency: data.currency || 'EUR'
            });
          } else {
            setProfile({
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              street: data.street || '',
              city: data.city || '',
              postalCode: data.postalCode || '',
              country: data.country || '',
              currency: data.currency || 'EUR'
            });
          }

          // Load notification preferences
          if (data.notificationPreferences) {
            setNotifications({
              ...notifications,
              ...data.notificationPreferences
            });
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
    setBrowserPermission(Notification.permission);
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;

    setSaving(true);
    try {
      await setDoc(
        doc(db, 'users', currentUser.uid),
        {
          ...profile,
          notificationPreferences: notifications,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
      toast.success(t('common.saved') || 'Settings saved!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePlaceSelected = (addressData: any) => {
    setProfile({
      ...profile,
      street: `${addressData.street || ''} ${addressData.streetNumber || ''}`.trim(),
      city: addressData.city || profile.city,
      postalCode: addressData.postalCode || profile.postalCode,
      country: addressData.country || profile.country
    });
  };

  const requestBrowserPermission = async () => {
    const granted = await NotificationService.requestPermission();
    setBrowserPermission(Notification.permission);

    if (granted) {
      setNotifications({ ...notifications, browserNotifications: true });
      toast.success(t('notifications.settings.browserEnabled'));
      NotificationService.send(t('notifications.test.title'), {
        body: t('notifications.test.body')
      });
    } else {
      toast.error(t('notifications.settings.browserDenied'));
    }
  };

  const handleToggleBrowser = async () => {
    if (!notifications.browserNotifications && browserPermission !== 'granted') {
      await requestBrowserPermission();
    } else {
      setNotifications({ ...notifications, browserNotifications: !notifications.browserNotifications });
    }
  };

  const currencies = [
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'GBP', symbol: '£', name: 'British Pound' }
  ];

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  if (loadError) {
    console.error('Google Maps load error:', loadError);
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
            marginBottom: '1rem',
            transition: 'all 0.3s'
          }}
        >
          <ArrowLeft size={20} />
          {t('common.back')}
        </button>

        <h1 style={{
          fontSize: '2.5rem',
          marginBottom: '0.5rem',
          color: '#2E3A4B'
        }}>
          ⚙️ {t('nav.settings')}
        </h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          Verwalte deine persönlichen Informationen und Einstellungen
        </p>

        {/* Account Info (Read-only) */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <User size={24} color="var(--vf-primary)" />
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Account</h2>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              color: '#666',
              marginBottom: '0.25rem'
            }}>
              E-Mail
            </label>
            <p style={{
              margin: 0,
              padding: '0.75rem',
              background: '#f5f5f5',
              borderRadius: '8px',
              color: '#666'
            }}>
              {currentUser?.email}
            </p>
          </div>
        </div>

        {/* Personal Information */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <User size={24} color="var(--vf-primary)" />
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Persönliche Informationen</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
                color: '#2E3A4B'
              }}>
                Vorname
              </label>
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                placeholder="Max"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e5e5',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'border 0.2s'
                }}
              />
            </div>

            <div className="form-group">
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
                color: '#2E3A4B'
              }}>
                Nachname
              </label>
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                placeholder="Mustermann"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e5e5',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'border 0.2s'
                }}
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <MapPin size={24} color="var(--vf-primary)" />
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Adresse</h2>
          </div>

          {loadError && (
            <div style={{
              padding: '1rem',
              background: '#FEE2E2',
              borderRadius: '8px',
              marginBottom: '1rem',
              border: '2px solid #EF4444'
            }}>
              <p style={{ color: '#991B1B', fontSize: '0.9rem', margin: 0 }}>
                ⚠️ <strong>Google Maps konnte nicht geladen werden.</strong><br/>
                Bitte aktiviere die "Places API" in der Google Cloud Console und stelle sicher, dass Billing aktiviert ist.
              </p>
            </div>
          )}

          {!isLoaded && !loadError && (
            <p style={{ color: '#999', fontSize: '0.9rem', marginBottom: '1rem' }}>
              🔄 Google Maps wird geladen...
            </p>
          )}

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
              color: '#2E3A4B'
            }}>
              Straße & Hausnummer
            </label>
            {isLoaded ? (
              <AddressAutocomplete
                value={profile.street}
                onChange={(value) => setProfile({ ...profile, street: value })}
                onPlaceSelected={handlePlaceSelected}
                placeholder="Musterstraße 123"
              />
            ) : (
              <input
                type="text"
                value={profile.street}
                onChange={(e) => setProfile({ ...profile, street: e.target.value })}
                placeholder="Musterstraße 123"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e5e5',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
                color: '#2E3A4B'
              }}>
                PLZ
              </label>
              <input
                type="text"
                value={profile.postalCode}
                onChange={(e) => setProfile({ ...profile, postalCode: e.target.value })}
                placeholder="8000"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e5e5',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div className="form-group">
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
                color: '#2E3A4B'
              }}>
                Stadt
              </label>
              <input
                type="text"
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                placeholder="Zürich"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e5e5',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
              color: '#2E3A4B'
            }}>
              Land
            </label>
            <input
              type="text"
              value={profile.country}
              onChange={(e) => setProfile({ ...profile, country: e.target.value })}
              placeholder="Schweiz"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e5e5e5',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>
        </div>

        {/* Currency */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <DollarSign size={24} color="var(--vf-primary)" />
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Währung</h2>
          </div>

          <div className="form-group">
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
              color: '#2E3A4B'
            }}>
              Bevorzugte Währung für Preise
            </label>
            <select
              value={profile.currency}
              onChange={(e) => setProfile({ ...profile, currency: e.target.value as any })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e5e5e5',
                borderRadius: '8px',
                fontSize: '1rem',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              {currencies.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.symbol} - {curr.name}
                </option>
              ))}
            </select>
            <p style={{
              fontSize: '0.85rem',
              color: '#999',
              marginTop: '0.5rem'
            }}>
              Diese Währung wird für Versicherungsberichte und Gerätepreise verwendet
            </p>
          </div>
        </div>

        {/* Notification Settings */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <Bell size={24} color="var(--vf-primary)" />
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{t('notifications.settings.title')}</h2>
          </div>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>{t('notifications.settings.subtitle')}</p>

          {/* Browser Notifications */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            background: '#F3F4F6',
            borderRadius: '10px',
            marginBottom: '1rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Smartphone size={18} color="#667eea" />
                <strong style={{ color: '#2E3A4B' }}>{t('notifications.settings.browser.enable')}</strong>
              </div>
              <p style={{ color: '#666', fontSize: '0.85rem', margin: 0 }}>
                {browserPermission === 'granted'
                  ? t('notifications.settings.browser.permissionGranted')
                  : t('notifications.settings.browser.permissionNeeded')}
              </p>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
              <input
                type="checkbox"
                checked={notifications.browserNotifications}
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
                background: notifications.browserNotifications ? '#10B981' : '#ccc',
                transition: '0.4s',
                borderRadius: '34px'
              }}>
                <span style={{
                  position: 'absolute',
                  height: '26px',
                  width: '26px',
                  left: notifications.browserNotifications ? '30px' : '4px',
                  bottom: '4px',
                  background: 'white',
                  transition: '0.4s',
                  borderRadius: '50%'
                }} />
              </span>
            </label>
          </div>

          {/* Email Notifications */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            background: '#F3F4F6',
            borderRadius: '10px',
            marginBottom: '1.5rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Mail size={18} color="#FF6B35" />
                <strong style={{ color: '#2E3A4B' }}>{t('notifications.settings.email.enable')}</strong>
              </div>
              <p style={{ color: '#666', fontSize: '0.85rem', margin: 0 }}>
                {notifications.emailAddress || currentUser?.email}
              </p>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
              <input
                type="checkbox"
                checked={notifications.emailNotifications}
                onChange={(e) => setNotifications({ ...notifications, emailNotifications: e.target.checked })}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: notifications.emailNotifications ? '#10B981' : '#ccc',
                transition: '0.4s',
                borderRadius: '34px'
              }}>
                <span style={{
                  position: 'absolute',
                  height: '26px',
                  width: '26px',
                  left: notifications.emailNotifications ? '30px' : '4px',
                  bottom: '4px',
                  background: 'white',
                  transition: '0.4s',
                  borderRadius: '50%'
                }} />
              </span>
            </label>
          </div>

          {/* Notification Types */}
          <h3 style={{ color: '#2E3A4B', fontSize: '1.1rem', marginBottom: '1rem' }}>
            {t('notifications.settings.types.title')}
          </h3>

          {/* Critical */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            background: '#FEE2E2',
            borderRadius: '10px',
            marginBottom: '0.75rem'
          }}>
            <div>
              <strong style={{ color: '#991B1B' }}>🚨 {t('notifications.settings.types.critical')}</strong>
              <p style={{ color: '#991B1B', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                {t('notifications.settings.types.criticalDesc')}
              </p>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
              <input
                type="checkbox"
                checked={notifications.notifyOnCritical}
                onChange={(e) => setNotifications({ ...notifications, notifyOnCritical: e.target.checked })}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: notifications.notifyOnCritical ? '#EF4444' : '#ccc',
                transition: '0.4s',
                borderRadius: '34px'
              }}>
                <span style={{
                  position: 'absolute',
                  height: '26px',
                  width: '26px',
                  left: notifications.notifyOnCritical ? '30px' : '4px',
                  bottom: '4px',
                  background: 'white',
                  transition: '0.4s',
                  borderRadius: '50%'
                }} />
              </span>
            </label>
          </div>

          {/* Warning */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            background: '#FEF3C7',
            borderRadius: '10px',
            marginBottom: '0.75rem'
          }}>
            <div>
              <strong style={{ color: '#92400E' }}>⚠️ {t('notifications.settings.types.warning')}</strong>
              <p style={{ color: '#92400E', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                {t('notifications.settings.types.warningDesc')}
              </p>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
              <input
                type="checkbox"
                checked={notifications.notifyOnWarning}
                onChange={(e) => setNotifications({ ...notifications, notifyOnWarning: e.target.checked })}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: notifications.notifyOnWarning ? '#F59E0B' : '#ccc',
                transition: '0.4s',
                borderRadius: '34px'
              }}>
                <span style={{
                  position: 'absolute',
                  height: '26px',
                  width: '26px',
                  left: notifications.notifyOnWarning ? '30px' : '4px',
                  bottom: '4px',
                  background: 'white',
                  transition: '0.4s',
                  borderRadius: '50%'
                }} />
              </span>
            </label>
          </div>

          {/* Health */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            background: '#DBEAFE',
            borderRadius: '10px',
            marginBottom: '0.75rem'
          }}>
            <div>
              <strong style={{ color: '#1E40AF' }}>💊 {t('notifications.settings.types.health')}</strong>
              <p style={{ color: '#1E40AF', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                {t('notifications.settings.types.healthDesc')}
              </p>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
              <input
                type="checkbox"
                checked={notifications.notifyOnLowHealth}
                onChange={(e) => setNotifications({ ...notifications, notifyOnLowHealth: e.target.checked })}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: notifications.notifyOnLowHealth ? '#3B82F6' : '#ccc',
                transition: '0.4s',
                borderRadius: '34px'
              }}>
                <span style={{
                  position: 'absolute',
                  height: '26px',
                  width: '26px',
                  left: notifications.notifyOnLowHealth ? '30px' : '4px',
                  bottom: '4px',
                  background: 'white',
                  transition: '0.4s',
                  borderRadius: '50%'
                }} />
              </span>
            </label>
          </div>

          {/* Warranty */}
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
              <p style={{ color: '#5B21B6', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                {t('notifications.settings.types.warrantyDesc')}
              </p>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
              <input
                type="checkbox"
                checked={notifications.notifyOnWarrantyExpiration}
                onChange={(e) => setNotifications({ ...notifications, notifyOnWarrantyExpiration: e.target.checked })}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: notifications.notifyOnWarrantyExpiration ? '#8B5CF6' : '#ccc',
                transition: '0.4s',
                borderRadius: '34px'
              }}>
                <span style={{
                  position: 'absolute',
                  height: '26px',
                  width: '26px',
                  left: notifications.notifyOnWarrantyExpiration ? '30px' : '4px',
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
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            padding: '1rem',
            background: saving ? '#ccc' : 'linear-gradient(135deg, #FF6B35 0%, #FFD23F 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
            transition: 'all 0.3s'
          }}
        >
          <Save size={20} />
          {saving ? t('common.saving') : t('common.save')}
        </button>
      </div>
    </div>
  );
};

export default Settings;
