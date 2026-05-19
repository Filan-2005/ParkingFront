// src/components/Layout.js
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

function usePageTitle() {
  const { pathname } = useLocation();
  const map = {
    '/admin':             'Dashboard',
    '/admin/lots':        'Parking Lots',
    '/admin/spotmap':     'Spot Map',
    '/admin/tickets':     'Tickets',
    '/admin/tariffs':     'Tariffs',
    '/admin/revenue':     'Revenue',
    '/admin/users':       'User Management',
    '/attendant':         'Dashboard',
    '/attendant/tickets': 'Tickets',
    '/attendant/spots':   'Spot Map',
    '/viewer':            'Overview',
    '/viewer/tickets':    'Tickets',
    '/viewer/spots':      'Spot Map',
  };
  return map[pathname] || 'Smart Parking';
}

export default function Layout() {
  const title = usePageTitle();
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <header className="topbar">
          <span className="topbar-title">{title}</span>
          <div className="topbar-right">
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}