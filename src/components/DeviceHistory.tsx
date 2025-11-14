// src/components/DeviceHistory.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { HistoryService, HistoryEntry } from '../services/HistoryService';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Calendar, TrendingDown, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface DeviceHistoryProps {
  deviceId: string;
  deviceName: string;
  device?: any; // Full device object for multi-battery support
}

export const DeviceHistory: React.FC<DeviceHistoryProps> = ({ deviceId, deviceName, device }) => {
  const { currentUser, userProfile } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysBack, setDaysBack] = useState(7);

  useEffect(() => {
    loadHistory();
  }, [deviceId, daysBack]);

  const loadHistory = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      // Get retention days based on subscription
      const plan = userProfile?.plan || 'free';
      const maxDays = plan === 'free' ? 7 : daysBack;

      const data = await HistoryService.getHistory(
        currentUser.uid,
        deviceId,
        maxDays
      );

      setHistory(data.reverse()); // Reverse to show chronological order
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };


  // Calculate trends
  const calculateTrend = (key: 'currentCharge' | 'health') => {
    if (history.length < 2) return 0;

    const firstValue = history[0][key];
    const lastValue = history[history.length - 1][key];

    return lastValue - firstValue;
  };

  const chargeTrend = calculateTrend('currentCharge');
  const healthTrend = calculateTrend('health');

  // Check if device has multiple batteries
  const hasBatteries = device?.batteries && device.batteries.length > 0;
  const batteryColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  // Prepare chart data
  const chartData = history.map(entry => {
    const dataPoint: any = {
      time: new Date(entry.timestamp).toLocaleDateString('de-DE', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit'
      })
    };

    // If device has multiple batteries, show each battery's charge
    if (hasBatteries) {
      device.batteries.forEach((battery: any, index: number) => {
        dataPoint[`${battery.name} %`] = entry.currentCharge || 100;
      });
    } else {
      // Single battery device
      dataPoint['Ladung %'] = entry.currentCharge;
      dataPoint['Gesundheit %'] = entry.health;
    }

    return dataPoint;
  });

  const plan = userProfile?.plan || 'free';
  const isPro = plan === 'pro' || plan === 'business';

  return (
    <div style={{
      background: 'white',
      padding: '2rem',
      borderRadius: '15px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      marginTop: '2rem'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h2 style={{ color: '#2E3A4B', margin: '0 0 0.5rem 0' }}>
            📊 Verlauf: {deviceName}
          </h2>
          <p style={{ color: '#666', margin: 0 }}>
            {plan === 'free' && '7-Tage-Verlauf (Free Plan)'}
            {isPro && `${daysBack}-Tage-Verlauf (${plan.toUpperCase()} Plan)`}
          </p>
        </div>

        {/* Time Range Selector (Pro only) */}
        {isPro && (
          <select
            value={daysBack}
            onChange={(e) => setDaysBack(Number(e.target.value))}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '2px solid #e5e5e5',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            <option value={7}>7 Tage</option>
            <option value={14}>14 Tage</option>
            <option value={30}>30 Tage</option>
            <option value={90}>90 Tage</option>
            <option value={180}>6 Monate</option>
            <option value={365}>1 Jahr</option>
          </select>
        )}
      </div>

      {/* Upgrade Notice for Free Users */}
      {plan === 'free' && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 210, 63, 0.1) 100%)',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          border: '2px solid rgba(255, 107, 53, 0.3)'
        }}>
          <p style={{ margin: 0, color: '#FF6B35', fontWeight: 600 }}>
            🔒 Upgrade zu Pro für unbegrenzten Verlauf und erweiterte Analysen!
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          padding: '1rem',
          background: chargeTrend >= 0 ? '#D1FAE5' : '#FEE2E2',
          borderRadius: '8px',
          border: `2px solid ${chargeTrend >= 0 ? '#10B981' : '#EF4444'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {chargeTrend >= 0 ? <TrendingUp color="#10B981" /> : <TrendingDown color="#EF4444" />}
            <span style={{ fontWeight: 600, color: chargeTrend >= 0 ? '#065F46' : '#991B1B' }}>
              Ladungs-Trend
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: chargeTrend >= 0 ? '#065F46' : '#991B1B' }}>
            {chargeTrend > 0 ? '+' : ''}{chargeTrend.toFixed(1)}%
          </p>
        </div>

        <div style={{
          padding: '1rem',
          background: healthTrend >= 0 ? '#D1FAE5' : '#FEE2E2',
          borderRadius: '8px',
          border: `2px solid ${healthTrend >= 0 ? '#10B981' : '#EF4444'}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {healthTrend >= 0 ? <TrendingUp color="#10B981" /> : <TrendingDown color="#EF4444" />}
            <span style={{ fontWeight: 600, color: healthTrend >= 0 ? '#065F46' : '#991B1B' }}>
              Gesundheits-Trend
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: healthTrend >= 0 ? '#065F46' : '#991B1B' }}>
            {healthTrend > 0 ? '+' : ''}{healthTrend.toFixed(1)}%
          </p>
        </div>

        <div style={{
          padding: '1rem',
          background: '#DBEAFE',
          borderRadius: '8px',
          border: '2px solid #3B82F6'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Calendar color="#1E40AF" />
            <span style={{ fontWeight: 600, color: '#1E40AF' }}>
              Datenpunkte
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#1E40AF' }}>
            {history.length}
          </p>
        </div>
      </div>

      {/* Multi-Battery Info Note */}
      {hasBatteries && (
        <div style={{
          padding: '1rem',
          background: '#FFF8F3',
          borderRadius: '8px',
          border: '2px solid #FFD23F',
          marginBottom: '1.5rem'
        }}>
          <p style={{ margin: 0, color: '#92400E', fontSize: '0.9rem' }}>
            💡 <strong>Mehrere Akkus erkannt:</strong> Aktuell wird der Gesamtladestand angezeigt.
            Die individuelle Verfolgung jedes Akkus kommt in einem zukünftigen Update!
          </p>
        </div>
      )}

      {/* Chart */}
      {loading ? (
        <div style={{
          padding: '4rem',
          textAlign: 'center',
          color: '#666'
        }}>
          <p>Lade Verlaufsdaten...</p>
        </div>
      ) : history.length === 0 ? (
        <div style={{
          padding: '4rem',
          textAlign: 'center',
          color: '#666',
          background: '#F9FAFB',
          borderRadius: '8px'
        }}>
          <Calendar size={48} color="#ccc" style={{ margin: '0 auto 1rem' }} />
          <p>Noch keine Verlaufsdaten vorhanden.</p>
          <p style={{ fontSize: '0.9rem', color: '#999' }}>
            Daten werden automatisch aufgezeichnet, wenn du deine Geräte aktualisierst.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              style={{ fontSize: '0.85rem' }}
            />
            <YAxis
              domain={[0, 100]}
              style={{ fontSize: '0.85rem' }}
            />
            <Tooltip
              contentStyle={{
                background: 'white',
                border: '2px solid #e5e5e5',
                borderRadius: '8px'
              }}
            />
            <Legend />
            {hasBatteries ? (
              // Show separate line for each battery
              device.batteries.map((battery: any, index: number) => (
                <Line
                  key={battery.id}
                  type="monotone"
                  dataKey={`${battery.name} %`}
                  stroke={batteryColors[index % batteryColors.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))
            ) : (
              // Single battery device - show charge and health
              <>
                <Line
                  type="monotone"
                  dataKey="Ladung %"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="Gesundheit %"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
