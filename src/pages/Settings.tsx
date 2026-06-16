import { useState } from 'react';
import MenuManager from '../components/modals/MenuManager';
import ShoppingList from '../components/modals/ShoppingList';
import TablesZ from '../components/modals/TablesZ';
import KitchenClosure from '../components/modals/KitchenClosure';
import MgmtDetails from '../components/modals/MgmtDetails';
import FindOrder from '../components/modals/FindOrder';

type ActiveModal = 'menu' | 'shopping' | 'tablesz' | 'kitchen' | 'mgmt' | 'findorder' | null;

const SETTINGS_ITEMS = [
  { id: 'menu' as const, icon: '📖', title: 'MENU MANAGER', desc: 'Add, edit & manage menu items with photos and allergens' },
  { id: 'shopping' as const, icon: '🛒', title: 'SHOPPING LIST', desc: 'Items needed for service with totals & receipts' },
  { id: 'tablesz' as const, icon: '📋', title: "TABLE'S Z", desc: 'Waiter shift summary — items sold, revenue, tables' },
  { id: 'kitchen' as const, icon: '🧑‍🍳', title: 'KITCHEN CLOSURE', desc: 'Avg cooking times and items prepared this shift' },
  { id: 'mgmt' as const, icon: '📊', title: 'MGMT DETAILS', desc: 'Full management reports with charts & PDF export' },
  { id: 'findorder' as const, icon: '🔍', title: 'FIND ORDER', desc: 'Search orders by code, table or item — last 24 hours' },
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

      {active === 'menu' && <MenuManager onClose={() => setActive(null)} />}
      {active === 'shopping' && <ShoppingList onClose={() => setActive(null)} />}
      {active === 'tablesz' && <TablesZ onClose={() => setActive(null)} />}
      {active === 'kitchen' && <KitchenClosure onClose={() => setActive(null)} />}
      {active === 'mgmt' && <MgmtDetails onClose={() => setActive(null)} />}
      {active === 'findorder' && <FindOrder onClose={() => setActive(null)} />}
    </div>
  );
}
