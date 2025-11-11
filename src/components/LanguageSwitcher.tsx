// src/components/LanguageSwitcher.tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' }
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          background: 'transparent',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: '400',
          color: '#666',
          transition: 'all 0.2s',
          boxShadow: 'none'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.borderColor = '#FF6B35';
          e.currentTarget.style.color = '#FF6B35';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.borderColor = '#E5E7EB';
          e.currentTarget.style.color = '#666';
        }}
      >
        <Globe size={16} />
        <span style={{ fontSize: '1.2rem' }}>{currentLanguage.flag}</span>
        <span style={{
          fontSize: '10px',
          marginLeft: '2px',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s'
        }}>▼</span>
      </button>

      {isOpen && (
        <>
          {/* Overlay to close dropdown when clicking outside */}
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
          />

          {/* Dropdown Menu */}
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '10px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              minWidth: '160px',
              zIndex: 1000,
              overflow: 'hidden'
            }}
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  background: lang.code === i18n.language ? '#FFF8F3' : 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: lang.code === i18n.language ? '500' : '400',
                  color: lang.code === i18n.language ? '#FF6B35' : '#666',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#FFF8F3';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = lang.code === i18n.language ? '#FFF8F3' : 'white';
                }}
              >
                <span style={{ fontSize: '1.3rem' }}>{lang.flag}</span>
                <span>{lang.name}</span>
                {lang.code === i18n.language && (
                  <span style={{ marginLeft: 'auto', color: '#FF6B35' }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
