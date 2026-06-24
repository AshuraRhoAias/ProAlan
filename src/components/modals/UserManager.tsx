import { useState } from 'react';

interface AppUser {
  id: string;
  name: string;
  role: 'Manager' | 'Kitchen' | 'Waiter' | 'Admin';
  pin: string;
  active: boolean;
}

const INIT_USERS: AppUser[] = [
  { id: '1', name: 'Antonio (Berna)', role: 'Manager', pin: '1234', active: true },
  { id: '2', name: 'Chef Demo', role: 'Kitchen', pin: '5678', active: true },
  { id: '3', name: 'Waiter Demo', role: 'Waiter', pin: '9012', active: false },
];

const ROLE_CLASSES: Record<string, string> = {
  Manager: 'role-manager', Kitchen: 'role-kitchen', Waiter: 'role-waiter', Admin: 'role-admin',
};

interface Props { onClose: () => void }

export default function UserManager({ onClose }: Props) {
  const [users, setUsers] = useState<AppUser[]>(INIT_USERS);
  const [editing, setEditing] = useState<AppUser | null>(null);

  const saveUser = (u: AppUser) => {
    setUsers(prev => prev.some(x => x.id === u.id) ? prev.map(x => x.id === u.id ? u : x) : [...prev, u]);
    setEditing(null);
  };

  const newUser = (): AppUser => ({ id: `u${Date.now()}`, name: '', role: 'Waiter', pin: '', active: true });

  if (editing) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-panel" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>👥 {editing.id.startsWith('u') && !INIT_USERS.find(u => u.id === editing.id) ? 'New User' : 'Edit User'}</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <button className="back-btn" onClick={() => setEditing(null)}>← Back</button>
          <UserForm user={editing} onSave={saveUser} onCancel={() => setEditing(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>👥 User Manager</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 20px 0' }}>
          <button className="btn-primary" onClick={() => setEditing(newUser())}>+ Add User</button>
        </div>

        <div className="form-body" style={{ paddingTop: 12 }}>
          {users.map(u => (
            <div key={u.id} className="user-row">
              <div className="user-row-info">
                <span className="user-row-name">{u.name || '(unnamed)'}</span>
                <span className={`user-role-badge ${ROLE_CLASSES[u.role]}`}>{u.role}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  className={`toggle-btn ${u.active ? 'toggle-on' : ''}`}
                  onClick={() => setUsers(prev => prev.map(x => x.id === u.id ? { ...x, active: !x.active } : x))}
                />
                <button className="icon-btn-sm" onClick={() => setEditing({ ...u })}>✎ Edit</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UserForm({ user, onSave, onCancel }: { user: AppUser; onSave: (u: AppUser) => void; onCancel: () => void }) {
  const [form, setForm] = useState<AppUser>({ ...user });
  const [showPin, setShowPin] = useState(false);

  return (
    <div className="form-body">
      <div className="field-group">
        <label className="field-label">Name</label>
        <input className="field-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
      </div>
      <div className="field-group">
        <label className="field-label">Role</label>
        <select className="field-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as AppUser['role'] }))}>
          {(['Manager', 'Kitchen', 'Waiter', 'Admin'] as const).map(r => <option key={r}>{r}</option>)}
        </select>
      </div>
      <div className="field-group">
        <label className="field-label">PIN (4 digits)</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            className="field-input"
            type={showPin ? 'text' : 'password'}
            value={form.pin}
            onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
            placeholder="••••"
            maxLength={4}
          />
          <button className="icon-btn-sm" onClick={() => setShowPin(v => !v)}>{showPin ? '🙈' : '👁'}</button>
        </div>
      </div>
      <div className="field-group field-toggle">
        <label className="field-label">Active</label>
        <button className={`toggle-btn ${form.active ? 'toggle-on' : ''}`} onClick={() => setForm(f => ({ ...f, active: !f.active }))} />
      </div>
      <div className="modal-footer" style={{ padding: '12px 0 0', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" style={{ flex: 1 }} onClick={() => onSave(form)}>Save</button>
      </div>
    </div>
  );
}
