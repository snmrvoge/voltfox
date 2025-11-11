// src/pages/Settings.tsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Bell, Shield, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>⚙️ Settings</h1>
      </div>

      <div className="settings-sections">
        <section className="settings-section">
          <div className="section-header">
            <User size={24} />
            <h2>Account</h2>
          </div>
          <div className="setting-item">
            <label>Email</label>
            <p>{currentUser?.email}</p>
          </div>
          <div className="setting-item">
            <label>User ID</label>
            <p className="text-muted">{currentUser?.uid}</p>
          </div>
        </section>

        <section className="settings-section">
          <div className="section-header">
            <Bell size={24} />
            <h2>Notifications</h2>
          </div>
          <div className="setting-item">
            <label>Battery Alerts</label>
            <input type="checkbox" defaultChecked />
          </div>
          <div className="setting-item">
            <label>Email Notifications</label>
            <input type="checkbox" defaultChecked />
          </div>
          <div className="setting-item">
            <label>Weekly Reports</label>
            <input type="checkbox" />
          </div>
        </section>

        <section className="settings-section">
          <div className="section-header">
            <Shield size={24} />
            <h2>Privacy & Security</h2>
          </div>
          <div className="setting-item">
            <label>Two-Factor Authentication</label>
            <button className="btn-secondary">Enable</button>
          </div>
          <div className="setting-item">
            <label>Data Export</label>
            <button className="btn-secondary">Download My Data</button>
          </div>
        </section>

        <section className="settings-section danger-zone">
          <div className="section-header">
            <LogOut size={24} />
            <h2>Account Actions</h2>
          </div>
          <div className="setting-item">
            <button onClick={handleLogout} className="btn-danger">
              Logout
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
