// src/pages/AdminDashboard.tsx
import React from 'react';
import { Users, Battery, TrendingUp, Activity } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const stats = [
    { icon: <Users size={32} />, label: 'Total Users', value: '1,234' },
    { icon: <Battery size={32} />, label: 'Devices Monitored', value: '5,678' },
    { icon: <TrendingUp size={32} />, label: 'Active Sessions', value: '892' },
    { icon: <Activity size={32} />, label: 'Alerts Sent', value: '12,456' }
  ];

  return (
    <div className="admin-dashboard">
      <div className="page-header">
        <h1>🦊 Admin Dashboard</h1>
        <p>System Overview</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <p className="stat-label">{stat.label}</p>
              <h3 className="stat-value">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-sections">
        <section className="admin-section">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            <p>No recent activity</p>
          </div>
        </section>

        <section className="admin-section">
          <h2>System Health</h2>
          <div className="health-indicators">
            <div className="health-item">
              <span className="health-label">Database</span>
              <span className="health-status status-good">Healthy</span>
            </div>
            <div className="health-item">
              <span className="health-label">API</span>
              <span className="health-status status-good">Healthy</span>
            </div>
            <div className="health-item">
              <span className="health-label">Storage</span>
              <span className="health-status status-good">Healthy</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
