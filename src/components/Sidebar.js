// src/components/Sidebar.js
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Icons } from './UI';

const NAV = {
  Admin: [
    { to: '/admin',              label: 'Dashboard',   Icon: Icons.Dashboard },
    { to: '/admin/lots',         label: 'Parking Lots', Icon: Icons.Lot },
    { to: '/admin/tickets',      label: 'Tickets',     Icon: Icons.Ticket },
    { to: '/admin/tariffs',      label: 'Tariffs',     Icon: Icons.Tariff },
    { to: '/admin/revenue',      label: 'Revenue',     Icon: Icons.Revenue },
    { to: '/admin/users',        label: 'Users',       Icon: Icons.Users },
    { to: '/admin/predictions',  label: 'Predictions', Icon: Icons.Predict },
  ],
  Attendant: [
    { to: '/attendant',         label: 'Dashboard', Icon: Icons.Dashboard },
    { to: '/attendant/tickets', label: 'Tickets',   Icon: Icons.Ticket },
    { to: '/attendant/spots',   label: 'Spot Map',  Icon: Icons.Spot },
  ],
  Viewer: [
    { to: '/viewer',       label: 'Overview', Icon: Icons.Dashboard },
    { to: '/viewer/spots', label: 'Spot Map', Icon: Icons.Spot },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = NAV[user?.role] || NAV.Viewer;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = user?.username?.slice(0, 2).toUpperCase() || 'SP';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <div className="logo-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="1.5" y="1.5" width="13" height="13" rx="2"/>
              <path d="M5 4v8M5 8h4a2 2 0 000-4H5"/>
            </svg>
          </div>
          <span>Smart Parking</span>
        </div>
        <div className="sidebar-logo-sub">Management System</div>
      </div>

      {/* Nav links */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {links.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={label === 'Dashboard' || label === 'Overview'}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="user-pill">
          <div className="user-avatar">{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div className="user-name">{user?.username}</div>
            <div className="user-role">{user?.role}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Sign out">
            <Icons.Logout />
          </button>
        </div>
      </div>
    </aside>
  );
}