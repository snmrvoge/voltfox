import React from 'react';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navigation() {
  return (
    <nav style={{
      position: 'absolute',
      top: '1rem',
      right: '1rem',
      zIndex: 100
    }}>
      <LanguageSwitcher />
    </nav>
  );
}
