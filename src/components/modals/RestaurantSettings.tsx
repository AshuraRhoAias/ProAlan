import { useState } from 'react';

export interface RestaurantConfig {
  name: string;
  tables: number;
  currency: string;
  taxRate: number;
  customerTypes: string[];
  useSystemTime: boolean;
}

const DEFAULTS: RestaurantConfig = {
  name: 'My Restaurant',
  tables: 6,
  currency: '$',
  taxRate: 0,
  customerTypes: ['DIRECT', 'DIDI', 'UBER', 'RAPPI', 'MOB+'],
  useSystemTime: true,
};

const STORAGE_KEY = 'mastrflow_restaurant_settings';

export function useRestaurantSettings(): [RestaurantConfig, (c: RestaurantConfig) => void] {
  const [config, setConfig] = useState<RestaurantConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
    } catch { return DEFAULTS; }
  });

  const save = (c: RestaurantConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    setConfig(c);
  };

  return [config, save];
}

interface Props { onClose: () => void }

export default function RestaurantSettings({ onClose }: Props) {
  const [cfg, setCfg] = useState<RestaurantConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : { ...DEFAULTS };
    } catch { return { ...DEFAULTS }; }
  });
  const [newType, setNewType] = useState('');

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    onClose();
  };

  const addType = () => {
    const t = newType.trim().toUpperCase();
    if (t && !cfg.customerTypes.includes(t)) {
      setCfg(c => ({ ...c, customerTypes: [...c.customerTypes, t] }));
    }
    setNewType('');
  };

  const removeType = (t: string) => setCfg(c => ({ ...c, customerTypes: c.customerTypes.filter(x => x !== t) }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🏠 Restaurant Settings</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="form-body">
          <div className="field-group">
            <label className="field-label">Restaurant Name</label>
            <input className="field-input" value={cfg.name} onChange={e => setCfg(c => ({ ...c, name: e.target.value }))} />
          </div>

          <div className="field-group">
            <label className="field-label">Number of Tables</label>
            <input className="field-input" type="number" min={1} max={50} value={cfg.tables} onChange={e => setCfg(c => ({ ...c, tables: +e.target.value }))} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field-group">
              <label className="field-label">Currency Symbol</label>
              <input className="field-input" value={cfg.currency} onChange={e => setCfg(c => ({ ...c, currency: e.target.value }))} maxLength={3} />
            </div>
            <div className="field-group">
              <label className="field-label">Tax Rate (%)</label>
              <input className="field-input" type="number" min={0} max={100} step={0.5} value={cfg.taxRate} onChange={e => setCfg(c => ({ ...c, taxRate: +e.target.value }))} />
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Customer Types</label>
            <div className="ctype-list">
              {cfg.customerTypes.map(t => (
                <div key={t} className="ctype-row">
                  <span className="ctype-dot" />
                  <span className="ctype-name">{t}</span>
                  <button className="icon-btn-sm text-red" onClick={() => removeType(t)}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <input
                className="field-input"
                value={newType}
                onChange={e => setNewType(e.target.value)}
                placeholder="Add custom type..."
                onKeyDown={e => e.key === 'Enter' && addType()}
              />
              <button className="icon-btn" onClick={addType}>+</button>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Clock Settings</label>
            <button
              className={`btn-ghost w-full ${cfg.useSystemTime ? 'toggle-active-btn' : ''}`}
              onClick={() => setCfg(c => ({ ...c, useSystemTime: !c.useSystemTime }))}
              style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <span className={`toggle-btn ${cfg.useSystemTime ? 'toggle-on' : ''}`} style={{ pointerEvents: 'none', flexShrink: 0 }} />
              Use system time automatically
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={save}>Save Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
}
