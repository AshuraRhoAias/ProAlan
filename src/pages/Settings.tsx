import { useState } from 'react';
import FindOrder from '../components/modals/FindOrder';
import MgmtDetails from '../components/modals/MgmtDetails';
import TablesZ from '../components/modals/TablesZ';
import KitchenClosure from '../components/modals/KitchenClosure';
import ShoppingList from '../components/modals/ShoppingList';
import MenuManager from '../components/modals/MenuManager';
import RestaurantSettings from '../components/modals/RestaurantSettings';
import UserManager from '../components/modals/UserManager';

type ActiveModal = 'findorder' | 'mgmt' | 'tablesz' | 'kitchen' | 'shopping' | 'menu' | 'restaurant' | 'users' | null;

const SETTINGS_ITEMS = [
  { id: 'findorder' as const, icon: '🔍', title: 'FIND ORDER', desc: 'Search orders by code, table or item — last 24 hours' },
  { id: 'mgmt' as const, icon: '📊', title: 'MGMT DETAILS', desc: 'Full management reports with charts & PDF export' },
  { id: 'tablesz' as const, icon: '📋', title: "TABLE'S Z", desc: 'Divides the day into shifts, auto-sends closures to MGMT DETAILS' },
  { id: 'kitchen' as const, icon: '🧑‍🍳', title: 'KITCHEN CLOSURE', desc: 'Avg cooking times and items prepared this shift' },
  { id: 'shopping' as const, icon: '🛒', title: 'SHOPPING LIST', desc: 'Shared purchase list visible to all staff positions' },
  { id: 'menu' as const, icon: '📖', title: 'MENU MANAGER', desc: 'Create and edit menu items and categories' },
  { id: 'restaurant' as const, icon: '🏠', title: 'RESTAURANT SETTINGS', desc: 'Manage restaurant data, tables, customer types and users' },
  { id: 'users' as const, icon: '👥', title: 'USER MANAGER', desc: 'Manage users and permissions' },
];

export default function Settings() {
  const [active, setActive] = useState<ActiveModal>(null);

  return (
    <div className="page settings-page">
      <div className="settings-header">
        <span className="settings-gear">⚙</span>
        <div>
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">Restaurant management tools</p>
        </div>
      </div>

      <div className="settings-list">
        {SETTINGS_ITEMS.map(item => (
          <button key={item.id} className="settings-row" onClick={() => setActive(item.id)}>
            <span className="settings-icon">{item.icon}</span>
            <div className="settings-text">
              <div className="settings-item-title">{item.title}</div>
              <div className="settings-item-desc">{item.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {active === 'findorder' && <FindOrder onClose={() => setActive(null)} />}
      {active === 'mgmt' && <MgmtDetails onClose={() => setActive(null)} />}
      {active === 'tablesz' && <TablesZ onClose={() => setActive(null)} />}
      {active === 'kitchen' && <KitchenClosure onClose={() => setActive(null)} />}
      {active === 'shopping' && <ShoppingList onClose={() => setActive(null)} />}
      {active === 'menu' && <MenuManager onClose={() => setActive(null)} />}
      {active === 'restaurant' && <RestaurantSettings onClose={() => setActive(null)} />}
      {active === 'users' && <UserManager onClose={() => setActive(null)} />}
    </div>
  );
}
