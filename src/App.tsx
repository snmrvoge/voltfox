// src/App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DeviceProvider } from './context/DeviceContext';
import { Toaster } from 'react-hot-toast';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import AddDevice from './pages/AddDevice';
import EditDevice from './pages/EditDevice';
import Settings from './pages/Settings';
import NotificationSettings from './pages/NotificationSettings';
import InsuranceReport from './pages/InsuranceReport';
import AdminDashboard from './pages/AdminDashboard';

// Components
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';
import { FirebaseStatus } from './components/FirebaseStatus';

// Styles
import './styles/App.css';
import './styles/voltfox-theme.css';

function App() {
  useEffect(() => {
    // Console Easter Egg
    console.log(
      '%c🦊 VoltFox is watching your batteries!',
      'color: #FF6B35; font-size: 20px; font-weight: bold;'
    );
    console.log(
      '%c💡 Created by Mr. Vision',
      'color: #FFD23F; font-size: 14px;'
    );
    console.log(
      '%cNever let them die again! Join us at voltfox.app',
      'color: #FF6B35; font-size: 12px;'
    );
  }, []);

  return (
    <Router>
      <AuthProvider>
        <DeviceProvider>
          <div className="voltfox-app">
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'linear-gradient(135deg, #FF6B35 0%, #FFD23F 100%)',
                  color: '#fff',
                  fontWeight: 600
                },
                success: {
                  iconTheme: {
                    primary: '#fff',
                    secondary: '#10B981'
                  }
                }
              }}
            />
            
            <Navigation />

            <main className="voltfox-content">
              <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />

                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />

                  <Route path="/devices" element={
                    <ProtectedRoute>
                      <Devices />
                    </ProtectedRoute>
                  } />

                  <Route path="/add-device" element={
                    <ProtectedRoute>
                      <AddDevice />
                    </ProtectedRoute>
                  } />

                  <Route path="/edit-device/:id" element={
                    <ProtectedRoute>
                      <EditDevice />
                    </ProtectedRoute>
                  } />

                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } />

                  <Route path="/notifications" element={
                    <ProtectedRoute>
                      <NotificationSettings />
                    </ProtectedRoute>
                  } />

                  <Route path="/insurance" element={
                    <ProtectedRoute>
                      <InsuranceReport />
                    </ProtectedRoute>
                  } />

                  <Route path="/admin" element={
                    <ProtectedRoute adminOnly>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />

                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>

            <Footer />
            
            {/* Mr. Vision Credit Badge */}
            <a
              href="https://mr-vision.ch"
              target="_blank"
              rel="noopener noreferrer"
              className="creator-badge"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <span className="creator-text">Created by</span>
              <span className="creator-name">Mr. Vision</span>
              <span className="creator-emoji">✨</span>
            </a>
          </div>
        </DeviceProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
