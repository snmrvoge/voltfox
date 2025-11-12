// src/pages/InsuranceReport.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDevices } from '../context/DeviceContext';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const InsuranceReport: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { devices } = useDevices();
  const { currentUser } = useAuth();
  const [userCurrency, setUserCurrency] = useState<'CHF' | 'EUR' | 'USD' | 'GBP'>('EUR');
  const [userName, setUserName] = useState('');

  // Load user profile for currency and name
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserCurrency(data.currency || 'EUR');

          // Handle both old fullName and new firstName/lastName
          if (data.firstName && data.lastName) {
            setUserName(`${data.firstName} ${data.lastName}`);
          } else if (data.fullName) {
            setUserName(data.fullName);
          } else {
            setUserName('');
          }
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };

    loadUserProfile();
  }, [currentUser]);

  // Filter devices that have insurance information
  const devicesWithInsurance = devices.filter(
    device => device.purchaseDate || device.purchasePrice || device.currentValue || device.serialNumber
  );

  const handlePrint = () => {
    window.print();
  };

  const calculateTotalValue = () => {
    return devicesWithInsurance.reduce((total, device) => {
      return total + (device.currentValue || device.purchasePrice || 0);
    }, 0);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCurrencyInfo = () => {
    const currencies = {
      EUR: { symbol: '€', code: 'EUR' },
      CHF: { symbol: 'CHF', code: 'CHF' },
      USD: { symbol: '$', code: 'USD' },
      GBP: { symbol: '£', code: 'GBP' }
    };
    return currencies[userCurrency];
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '-';
    const currencyInfo = getCurrencyInfo();
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: currencyInfo.code
    }).format(value);
  };

  return (
    <div className="insurance-report-page">
      {/* Header - hide when printing */}
      <div className="no-print" style={{ marginBottom: '2rem' }}>
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
          {t('insurance.backToDashboard')}
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={32} />
              {t('insurance.title')}
            </h1>
            <p style={{ color: '#666' }}>
              {t('insurance.subtitle')}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.75rem 1.5rem',
                background: 'var(--vf-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.3s'
              }}
            >
              <Printer size={18} />
              {t('insurance.print')}
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="print-content" style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {/* Report Header */}
        <div style={{
          borderBottom: '3px solid var(--vf-primary)',
          paddingBottom: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h1 style={{
                fontSize: '2rem',
                margin: 0,
                marginBottom: '0.5rem',
                color: 'var(--vf-primary)'
              }}>
                🦊 VoltFox
              </h1>
              <h2 style={{
                fontSize: '1.5rem',
                margin: 0,
                fontWeight: 600
              }}>
                {t('insurance.title')}
              </h2>
            </div>
            <div style={{ textAlign: 'right', color: '#666' }}>
              <p style={{ margin: '0.25rem 0' }}>
                <strong>{t('insurance.fields.createdDate', { defaultValue: 'Erstellt am' })}:</strong> {formatDate(new Date().toISOString())}
              </p>
              <p style={{ margin: '0.25rem 0' }}>
                <strong>{t('insurance.fields.user', { defaultValue: 'Benutzer' })}:</strong> {userName || currentUser?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 210, 63, 0.1) 100%)',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          border: '2px solid rgba(255, 107, 53, 0.3)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>📊 {t('insurance.summary')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>{t('insurance.deviceCount')}</p>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--vf-primary)' }}>
                {devicesWithInsurance.length}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>{t('insurance.totalValue')}</p>
              <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--vf-primary)' }}>
                {formatCurrency(calculateTotalValue())}
              </p>
            </div>
          </div>
        </div>

        {/* Devices List */}
        {devicesWithInsurance.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            background: '#f5f5f5',
            borderRadius: '12px'
          }}>
            <FileText size={48} color="#ccc" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: '#666', fontSize: '1.1rem' }}>
              {t('insurance.noDevices')}
            </p>
            <p style={{ color: '#999' }}>
              {t('insurance.addInfo')}
            </p>
          </div>
        ) : (
          <div>
            <h3 style={{ marginBottom: '1.5rem' }}>📱 {t('insurance.deviceList')}</h3>
            {devicesWithInsurance.map((device, index) => (
              <div
                key={device.id}
                style={{
                  border: '2px solid #e5e5e5',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  pageBreakInside: 'avoid'
                }}
              >
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                  {/* Device Image */}
                  <div style={{ flexShrink: 0 }}>
                    {device.imageUrl ? (
                      <img
                        src={device.imageUrl}
                        alt={device.name}
                        style={{
                          width: '120px',
                          height: '120px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '2px solid #e5e5e5'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '120px',
                        height: '120px',
                        background: 'linear-gradient(135deg, var(--vf-primary) 0%, var(--vf-secondary) 100%)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '4rem'
                      }}>
                        {device.icon}
                      </div>
                    )}
                  </div>

                  {/* Device Info */}
                  <div style={{ flex: 1 }}>
                    <h4 style={{
                      margin: '0 0 0.5rem 0',
                      fontSize: '1.3rem',
                      color: 'var(--vf-primary)'
                    }}>
                      {index + 1}. {device.name}
                    </h4>
                    <p style={{ margin: '0.25rem 0', color: '#666' }}>
                      <strong>{t('insurance.fields.type', { defaultValue: 'Typ' })}:</strong> {device.type}
                    </p>
                    {device.brand && (
                      <p style={{ margin: '0.25rem 0', color: '#666' }}>
                        <strong>{t('insurance.fields.brand', { defaultValue: 'Marke' })}:</strong> {device.brand}
                      </p>
                    )}
                    {device.model && (
                      <p style={{ margin: '0.25rem 0', color: '#666' }}>
                        <strong>{t('insurance.fields.model', { defaultValue: 'Modell' })}:</strong> {device.model}
                      </p>
                    )}
                  </div>
                </div>

                {/* Insurance Details */}
                <div style={{
                  background: '#f9f9f9',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginTop: '1rem'
                }}>
                  <h5 style={{ margin: '0 0 0.75rem 0', color: 'var(--vf-primary)' }}>
                    🛡️ {t('insurance.form.title')}
                  </h5>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.75rem'
                  }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>{t('insurance.fields.purchaseDate')}</p>
                      <p style={{ margin: 0, fontWeight: 600 }}>{formatDate(device.purchaseDate)}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>{t('insurance.fields.purchasePrice')}</p>
                      <p style={{ margin: 0, fontWeight: 600 }}>{formatCurrency(device.purchasePrice)}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>{t('insurance.fields.currentValue')}</p>
                      <p style={{ margin: 0, fontWeight: 600 }}>{formatCurrency(device.currentValue)}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>{t('insurance.fields.serialNumber')}</p>
                      <p style={{ margin: 0, fontWeight: 600 }}>{device.serialNumber || '-'}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>{t('insurance.fields.warrantyUntil')}</p>
                      <p style={{ margin: 0, fontWeight: 600 }}>{formatDate(device.warrantyUntil)}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>{t('insurance.fields.batteryType')}</p>
                      <p style={{ margin: 0, fontWeight: 600 }}>{device.chemistry}</p>
                    </div>
                  </div>

                  {/* Battery Health */}
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e5e5' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#666' }}>
                      {t('insurance.fields.condition')}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <div>
                        <span style={{ fontSize: '0.85rem', color: '#666' }}>{t('insurance.fields.charge')}: </span>
                        <span style={{ fontWeight: 600 }}>{device.currentCharge}%</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.85rem', color: '#666' }}>{t('insurance.fields.health')}: </span>
                        <span style={{ fontWeight: 600 }}>{device.health}%</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.85rem', color: '#666' }}>{t('insurance.fields.status')}: </span>
                        <span style={{
                          fontWeight: 600,
                          color: device.status === 'healthy' ? '#10B981' :
                                 device.status === 'warning' ? '#F59E0B' :
                                 device.status === 'critical' ? '#EF4444' : '#DC2626'
                        }}>
                          {device.status === 'healthy' ? `✅ ${t('insurance.status.healthy')}` :
                           device.status === 'warning' ? `⚠️ ${t('insurance.status.warning')}` :
                           device.status === 'critical' ? `🚨 ${t('insurance.status.critical')}` : `💀 ${t('insurance.status.dead')}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: '3rem',
          paddingTop: '1.5rem',
          borderTop: '2px solid #e5e5e5',
          fontSize: '0.85rem',
          color: '#999',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0.25rem 0' }}>
            {t('insurance.footer.generated')}
          </p>
          <p style={{ margin: '0.25rem 0' }}>
            {t('insurance.footer.createdBy')}
          </p>
          <p style={{ margin: '0.25rem 0' }}>
            {t('insurance.footer.website')}
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          /* Hide navigation and buttons when printing */
          .no-print,
          .no-print * {
            display: none !important;
          }

          /* Reset page background and styling */
          body,
          #root,
          .insurance-report-page {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
          }

          /* Optimize print content */
          .print-content {
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }

          /* Ensure proper page breaks */
          .device-card {
            page-break-inside: avoid;
          }

          /* Set page margins */
          @page {
            margin: 2cm;
            size: A4;
          }

          /* Print in color if possible */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default InsuranceReport;
