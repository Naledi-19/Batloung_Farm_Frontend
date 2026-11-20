import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Sprout,
  LayoutDashboard,
  Truck,
  Apple,
  Users,
  ShoppingBasket,
  BadgeDollarSign,
  Warehouse,
  ChartColumnIncreasing,
  Bell,
  ChevronDown,
  House,
  Boxes,
  Settings
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../services/api';

const destinations = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, railIcon: House },
  { path: '/suppliers', label: 'Suppliers', icon: Truck, railIcon: Truck },
  { path: '/fruits', label: 'Produce', icon: Apple, railIcon: Apple },
  { path: '/vendors', label: 'Vendors', icon: Users, railIcon: Users },
  { path: '/purchases', label: 'Receiving', icon: ShoppingBasket, railIcon: ShoppingBasket },
  { path: '/sales', label: 'Sales', icon: BadgeDollarSign, railIcon: BadgeDollarSign },
  { path: '/inventory', label: 'Inventory', icon: Warehouse, railIcon: Boxes },
  { path: '/reports', label: 'Reports', icon: ChartColumnIncreasing, railIcon: ChartColumnIncreasing }
];

export default function Layout() {
  const location = useLocation();
  const [connected, setConnected] = useState(null);

  useEffect(() => {
    let alive = true;
    api
      .get('/health')
      .then(() => alive && setConnected(true))
      .catch(() => alive && setConnected(false));

    return () => {
      alive = false;
    };
  }, [location.pathname]);

  return (
    <div className="ops-shell">
      <aside className="ops-rail">
        <div className="ops-rail-brand" aria-label="Batloung Farm">
          <span className="ops-rail-brand-box">
            <Sprout size={22} strokeWidth={2.2} />
          </span>
        </div>

        <nav className="ops-rail-nav" aria-label="Quick navigation">
          {destinations.map(({ path, label, railIcon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) => `ops-rail-link ${isActive ? 'active' : ''}`}
              title={label}
            >
              <Icon size={20} />
            </NavLink>
          ))}
        </nav>

        <div className="ops-rail-bottom">
          <button className="ops-rail-link static" type="button" title="Settings">
            <Settings size={20} />
          </button>
        </div>
      </aside>

      <div className="ops-content">
        <header className="ops-header">
          <div className="ops-header-top">
            <div className="ops-brand-block">
              <div className="ops-brand-mark">
                <Sprout size={22} strokeWidth={2.2} />
              </div>
              <div>
                <h1>Batloung Farm Distribution</h1>
                <small>Distribution operations workspace</small>
              </div>
            </div>

            <div className="ops-header-actions">
              <span className={`ops-system-chip ${connected ? 'online' : ''}`}>
                <span className="ops-system-dot" />
                {connected === null ? 'Checking system' : connected ? 'System online' : 'System offline'}
              </span>
              <button type="button" className="ops-icon-btn" aria-label="Notifications">
                <Bell size={18} />
              </button>
              <div className="ops-user-chip">
                <span className="ops-user-avatar">BF</span>
                <span className="ops-user-name">Admin</span>
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          <nav className="ops-top-nav" aria-label="Main navigation">
            {destinations.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                className={({ isActive }) => `ops-top-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={17} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="ops-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
