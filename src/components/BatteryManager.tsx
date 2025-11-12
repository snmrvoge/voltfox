// src/components/BatteryManager.tsx
import React, { useState } from 'react';
import { HistoryService } from '../services/HistoryService';

interface Battery {
  id: string;
  name: string;
  currentCharge: number;
  health: number;
  cycles?: number;
  serialNumber?: string;
  purchaseDate?: string;
  lastCharged?: string;
  status: 'healthy' | 'warning' | 'critical' | 'dead';
}

interface BatteryManagerProps {
  batteries: Battery[];
  onBatteriesChange: (batteries: Battery[]) => void;
  deviceName?: string;
  userId?: string;
  deviceId?: string;
}

export const BatteryManager: React.FC<BatteryManagerProps> = ({
  batteries,
  onBatteriesChange,
  deviceName = 'Gerät',
  userId,
  deviceId
}) => {
  const [isAddingBattery, setIsAddingBattery] = useState(false);
  const [editingBatteryId, setEditingBatteryId] = useState<string | null>(null);
  const [newBattery, setNewBattery] = useState<Partial<Battery>>({
    name: '',
    currentCharge: 100,
    health: 100,
    cycles: 0,
    serialNumber: '',
    purchaseDate: '',
    status: 'healthy'
  });

  const calculateStatus = (charge: number, health: number): 'healthy' | 'warning' | 'critical' | 'dead' => {
    if (charge === 0 || health === 0) return 'dead';
    if (charge < 20 || health < 40) return 'critical';
    if (charge < 50 || health < 70) return 'warning';
    return 'healthy';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'critical': return '#EF4444';
      case 'dead': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '🔴';
      case 'dead': return '💀';
      default: return '❓';
    }
  };

  const handleAddBattery = () => {
    if (!newBattery.name) {
      alert('Bitte gib einen Namen für den Zusatzakku ein (z.B. "Akku 2", "Akku 3")');
      return;
    }

    const battery: Battery = {
      id: Date.now().toString(),
      name: newBattery.name || '',
      currentCharge: newBattery.currentCharge || 100,
      health: newBattery.health || 100,
      cycles: newBattery.cycles || 0,
      serialNumber: newBattery.serialNumber || '',
      purchaseDate: newBattery.purchaseDate || '',
      lastCharged: new Date().toISOString(),
      status: calculateStatus(newBattery.currentCharge || 100, newBattery.health || 100)
    };

    onBatteriesChange([...batteries, battery]);
    setNewBattery({
      name: '',
      currentCharge: 100,
      health: 100,
      cycles: 0,
      serialNumber: '',
      purchaseDate: '',
      status: 'healthy'
    });
    setIsAddingBattery(false);
  };

  const handleUpdateBattery = async (id: string, updates: Partial<Battery>) => {
    const updatedBatteries = batteries.map(battery => {
      if (battery.id === id) {
        const updatedBattery = { ...battery, ...updates };
        updatedBattery.status = calculateStatus(updatedBattery.currentCharge, updatedBattery.health);
        return updatedBattery;
      }
      return battery;
    });
    onBatteriesChange(updatedBatteries);

    // Record history snapshot if userId and deviceId are provided
    if (userId && deviceId && (updates.currentCharge !== undefined || updates.health !== undefined)) {
      try {
        const battery = updatedBatteries.find(b => b.id === id);
        if (battery) {
          await HistoryService.recordBatterySnapshot(userId, deviceId, id, {
            currentCharge: battery.currentCharge,
            health: battery.health,
            status: battery.status
          });
          console.log(`History snapshot recorded for battery ${id}`);
        }
      } catch (error) {
        console.error('Error recording battery history:', error);
      }
    }
  };

  const handleDeleteBattery = (id: string) => {
    if (window.confirm('Möchtest du diesen Akku wirklich löschen?')) {
      onBatteriesChange(batteries.filter(b => b.id !== id));
    }
  };

  const handleQuickCharge = (id: string) => {
    handleUpdateBattery(id, {
      currentCharge: 100,
      lastCharged: new Date().toISOString()
    });
  };

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
            🔋 Zusatzakkus (optional)
          </h3>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#6B7280' }}>
            Verwalte weitere Akkus für dieses Gerät
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddingBattery(!isAddingBattery)}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: isAddingBattery ? '#6B7280' : '#FF6B35',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '500'
          }}
        >
          {isAddingBattery ? '✕ Abbrechen' : '+ Zusatzakku hinzufügen'}
        </button>
      </div>

      {/* Add Battery Form */}
      {isAddingBattery && (
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#F9FAFB',
          borderRadius: '12px',
          marginBottom: '1rem',
          border: '2px solid #E5E7EB'
        }}>
          <h4 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem' }}>
            Neuen Zusatzakku hinzufügen
          </h4>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Name *
              </label>
              <input
                type="text"
                value={newBattery.name || ''}
                onChange={(e) => setNewBattery({ ...newBattery, name: e.target.value })}
                placeholder="z.B. Akku 1, Hauptakku, etc."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Ladung (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newBattery.currentCharge || 100}
                  onChange={(e) => setNewBattery({ ...newBattery, currentCharge: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Gesundheit (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newBattery.health || 100}
                  onChange={(e) => setNewBattery({ ...newBattery, health: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Ladezyklen
                </label>
                <input
                  type="number"
                  min="0"
                  value={newBattery.cycles || 0}
                  onChange={(e) => setNewBattery({ ...newBattery, cycles: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Seriennummer
                </label>
                <input
                  type="text"
                  value={newBattery.serialNumber || ''}
                  onChange={(e) => setNewBattery({ ...newBattery, serialNumber: e.target.value })}
                  placeholder="Optional"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Kaufdatum
              </label>
              <input
                type="date"
                value={newBattery.purchaseDate || ''}
                onChange={(e) => setNewBattery({ ...newBattery, purchaseDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleAddBattery}
              style={{
                padding: '0.75rem',
                backgroundColor: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              ✓ Zusatzakku hinzufügen
            </button>
          </div>
        </div>
      )}

      {/* Battery List */}
      {batteries.length === 0 ? (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#F9FAFB',
          borderRadius: '12px',
          border: '2px dashed #E5E7EB'
        }}>
          <p style={{ margin: 0, color: '#6B7280' }}>
            Keine Zusatzakkus vorhanden. Der Hauptakku wird direkt beim Gerät verwaltet.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {batteries.map((battery) => (
            <div
              key={battery.id}
              style={{
                padding: '1.5rem',
                backgroundColor: 'white',
                borderRadius: '12px',
                border: `2px solid ${getStatusColor(battery.status)}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  {editingBatteryId === battery.id ? (
                    <input
                      type="text"
                      value={battery.name}
                      onChange={(e) => handleUpdateBattery(battery.id, { name: e.target.value })}
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        padding: '0.5rem',
                        border: '2px solid #E5E7EB',
                        borderRadius: '6px',
                        width: '100%'
                      }}
                    />
                  ) : (
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
                      {battery.name}
                    </h4>
                  )}
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.5rem' }}>
                      {getStatusEmoji(battery.status)}
                    </span>
                    <span style={{
                      fontSize: '0.9rem',
                      color: getStatusColor(battery.status),
                      fontWeight: '600'
                    }}>
                      {battery.status === 'healthy' ? 'Gesund' :
                       battery.status === 'warning' ? 'Warnung' :
                       battery.status === 'critical' ? 'Kritisch' : 'Tot'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setEditingBatteryId(editingBatteryId === battery.id ? null : battery.id)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: editingBatteryId === battery.id ? '#10B981' : '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    {editingBatteryId === battery.id ? '✓' : '✎'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBattery(battery.id)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#EF4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    🗑
                  </button>
                </div>
              </div>

              {/* Battery Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                    Ladung
                  </div>
                  {editingBatteryId === battery.id ? (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={battery.currentCharge}
                      onChange={(e) => handleUpdateBattery(battery.id, { currentCharge: parseInt(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '2px solid #E5E7EB',
                        borderRadius: '6px',
                        fontSize: '0.9rem'
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                      {battery.currentCharge}%
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                    Gesundheit
                  </div>
                  {editingBatteryId === battery.id ? (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={battery.health}
                      onChange={(e) => handleUpdateBattery(battery.id, { health: parseInt(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '2px solid #E5E7EB',
                        borderRadius: '6px',
                        fontSize: '0.9rem'
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                      {battery.health}%
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Info */}
              {editingBatteryId === battery.id ? (
                <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#6B7280', display: 'block', marginBottom: '0.25rem' }}>
                      Ladezyklen
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={battery.cycles || 0}
                      onChange={(e) => handleUpdateBattery(battery.id, { cycles: parseInt(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '2px solid #E5E7EB',
                        borderRadius: '6px',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#6B7280', display: 'block', marginBottom: '0.25rem' }}>
                      Seriennummer
                    </label>
                    <input
                      type="text"
                      value={battery.serialNumber || ''}
                      onChange={(e) => handleUpdateBattery(battery.id, { serialNumber: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '2px solid #E5E7EB',
                        borderRadius: '6px',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#6B7280', display: 'block', marginBottom: '0.25rem' }}>
                      Kaufdatum
                    </label>
                    <input
                      type="date"
                      value={battery.purchaseDate || ''}
                      onChange={(e) => handleUpdateBattery(battery.id, { purchaseDate: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '2px solid #E5E7EB',
                        borderRadius: '6px',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '1rem' }}>
                  {battery.cycles !== undefined && battery.cycles > 0 && (
                    <div>🔄 {battery.cycles} Ladezyklen</div>
                  )}
                  {battery.serialNumber && (
                    <div>🔢 S/N: {battery.serialNumber}</div>
                  )}
                  {battery.purchaseDate && (
                    <div>📅 Gekauft: {new Date(battery.purchaseDate).toLocaleDateString('de-DE')}</div>
                  )}
                  {battery.lastCharged && (
                    <div>⚡ Zuletzt geladen: {new Date(battery.lastCharged).toLocaleDateString('de-DE')}</div>
                  )}
                </div>
              )}

              {/* Quick Actions */}
              {editingBatteryId !== battery.id && (
                <button
                  type="button"
                  onClick={() => handleQuickCharge(battery.id)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#10B981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}
                >
                  ⚡ Voll geladen
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {batteries.length > 0 && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: '#F3F4F6',
          borderRadius: '8px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Zusatzakkus</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>{batteries.length} {batteries.length === 1 ? 'Akku' : 'Akkus'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Ø Ladung</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>
              {Math.round(batteries.reduce((sum, b) => sum + b.currentCharge, 0) / batteries.length)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>Ø Gesundheit</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>
              {Math.round(batteries.reduce((sum, b) => sum + b.health, 0) / batteries.length)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
