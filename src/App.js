// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/global.css';

// Pages
import Login from './pages/Login';
import Layout from './components/Layout';

// Admin
import AdminDashboard   from './pages/admin/Dashboard';
import AdminLots        from './pages/admin/Lots';
import AdminTickets     from './pages/admin/Tickets';
import AdminTariffs     from './pages/admin/Tariffs';
import AdminRevenue     from './pages/admin/Revenue';
import AdminUsers       from './pages/admin/Users';
import AdminPredictions from './pages/admin/Predictions';

// Attendant
import AttendantDashboard from './pages/attendant/Dashboard';
import AttendantTickets   from './pages/attendant/Tickets';
import AttendantSpotMap   from './pages/attendant/SpotMap';

// Viewer
import { ViewerOverview, ViewerSpotMap } from './pages/viewer/index';

/* ── Auth guard ── */
function RequireAuth({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role.toLowerCase()}`} replace />;
  return children;
}

/* ── Root redirect ── */
function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role.toLowerCase()}`} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Admin routes */}
          <Route path="/admin" element={<RequireAuth role="Admin"><Layout /></RequireAuth>}>
            <Route index           element={<AdminDashboard />} />
            <Route path="lots"        element={<AdminLots />} />
            <Route path="tickets"     element={<AdminTickets />} />
            <Route path="tariffs"     element={<AdminTariffs />} />
            <Route path="revenue"     element={<AdminRevenue />} />
            <Route path="users"       element={<AdminUsers />} />
            <Route path="predictions" element={<AdminPredictions />} />
          </Route>

          {/* Attendant routes */}
          <Route path="/attendant" element={<RequireAuth role="Attendant"><Layout /></RequireAuth>}>
            <Route index          element={<AttendantDashboard />} />
            <Route path="tickets" element={<AttendantTickets />} />
            <Route path="spots"   element={<AttendantSpotMap />} />
          </Route>

          {/* Viewer routes */}
          <Route path="/viewer" element={<RequireAuth role="Viewer"><Layout /></RequireAuth>}>
            <Route index        element={<ViewerOverview />} />
            <Route path="spots" element={<ViewerSpotMap />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}