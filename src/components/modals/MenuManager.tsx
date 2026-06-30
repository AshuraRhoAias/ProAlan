import { useState } from 'react';
import { MOCK_MENU_ITEMS } from '../../data/mockData';
import type { MenuItem } from '../../types';

const CATEGORIES = ['All', 'Burgers', 'Sides', 'Mains', 'Drinks', 'Other'];

interface Props { onClose: () => void }

export default function MenuManager({ onClose }: Props) {
  const [items, setItems] = useState<MenuItem[]>(MOCK_MENU_ITEMS);
  const [catFilter, setCatFilter] = useState('All');
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [newItem, setNewItem] = useState<MenuItem | null>(null);

  const filtered = catFilter === 'All' ? items : items.filter(i => i.category === catFilter);

  const saveItem = (item: MenuItem) => {
    setItems(prev => prev.some(i => i.id === item.id)
      ? prev.map(i => i.id === item.id ? item : i)
      : [...prev, item]
    );
    setEditItem(null);
    setNewItem(null);
  };

  const deleteItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel modal-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Menu Manager</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="menu-toolbar">
          <div className="cat-filters">
            {CATEGORIES.map(c => (
              <button key={c} className={`cat-btn ${catFilter === c ? 'active' : ''}`} onClick={() => setCatFilter(c)}>
                {c} {c !== 'All' && <span className="cat-count">{items.filter(i => i.category === c).length}</span>}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="icon-btn-sm">⊞ Categories</button>
            <button
              className="btn-primary"
              onClick={() => setNewItem({
                id: `m${crypto.randomUUID()}`, name: '', category: 'Burgers',
                price: 0, description: '', allergens: [], available: true,
              })}
            >
              + Add Item
            </button>
          </div>
        </div>

        <div className="menu-grid">
          {filtered.map(item => (
            <div key={item.id} className="menu-item-row">
              <div className="menu-item-info">
                <div className="menu-item-name">{item.name}</div>
                <div className="menu-item-cat">{item.category}</div>
                <div className="menu-item-price">${item.price}</div>
              </div>
              <div className="menu-item-actions">
                <span className={`avail-dot ${item.available ? 'avail-on' : 'avail-off'}`} />
                <button className="icon-btn-sm" onClick={() => setEditItem(item)}>✎ Edit</button>
                <button className="icon-btn-sm text-red" onClick={() => deleteItem(item.id)}>🗑</button>
              </div>
            </div>
          ))}
        </div>

        {(editItem || newItem) && (
          <MenuItemForm
            item={editItem ?? newItem!}
            isNew={!!newItem}
            onSave={saveItem}
            onCancel={() => { setEditItem(null); setNewItem(null); }}
          />
        )}
      </div>
    </div>
  );
}

function MenuItemForm({ item, isNew, onSave, onCancel }: {
  item: MenuItem; isNew: boolean;
  onSave: (i: MenuItem) => void; onCancel: () => void;
}) {
  const [form, setForm] = useState<MenuItem>({ ...item });
  const [allergenInput, setAllergenInput] = useState('');

  const addAllergen = () => {
    if (allergenInput.trim()) {
      setForm(f => ({ ...f, allergens: [...f.allergens, allergenInput.trim()] }));
      setAllergenInput('');
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isNew ? 'New Menu Item' : 'Edit Item'}</h2>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>

        <div className="form-body">
          <div className="field-group">
            <label className="field-label">Name *</label>
            <input className="field-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. TBX" />
          </div>
          <div className="field-group">
            <label className="field-label">Category</label>
            <select className="field-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {['Burgers', 'Sides', 'Mains', 'Drinks', 'Other'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="field-group">
            <label className="field-label">Price *</label>
            <input className="field-input" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} />
          </div>
          <div className="field-group">
            <label className="field-label">Description</label>
            <textarea className="field-input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description (optional)" />
          </div>
          <div className="field-group">
            <label className="field-label">Special Ingredients / Allergens</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input className="field-input" value={allergenInput} onChange={e => setAllergenInput(e.target.value)} placeholder="e.g. Gluten, Dairy..." onKeyDown={e => e.key === 'Enter' && addAllergen()} />
              <button className="icon-btn" onClick={addAllergen}>+</button>
            </div>
            {form.allergens.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                {form.allergens.map(a => (
                  <span key={a} className="allergen-tag" onClick={() => setForm(f => ({ ...f, allergens: f.allergens.filter(x => x !== a) }))}>{a} ×</span>
                ))}
              </div>
            )}
          </div>
          <div className="field-group">
            <label className="field-label">Photo</label>
            <button className="upload-btn">📷 Upload Photo</button>
          </div>
          <div className="field-group field-toggle">
            <label className="field-label">Available</label>
            <button
              className={`toggle-btn ${form.available ? 'toggle-on' : ''}`}
              onClick={() => setForm(f => ({ ...f, available: !f.available }))}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave(form)}>{isNew ? 'Add Item' : 'Save Changes'}</button>
        </div>
      </div>
    </div>
  );
}
