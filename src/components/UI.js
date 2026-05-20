// src/components/UI.js
// Reusable UI primitives used across all pages

import React, { useEffect, useRef } from 'react';

/* ── Toast notification ─────────────────────── */
export function Toast({ message, type = 'default', onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return <div className={`toast ${type}`}>{message}</div>;
}

/* ── Modal wrapper ──────────────────────────── */
export function Modal({ title, onClose, children, actions }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">
          {title}
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-3)', lineHeight: 1 }}
            onClick={onClose}
          >×</button>
        </div>
        {children}
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  );
}

/* ── Confirm dialog ─────────────────────────── */
export function Confirm({ message, onConfirm, onCancel }) {
  return (
    <Modal title="Confirm" onClose={onCancel} actions={
      <>
        <button className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
        <button className="btn btn-danger btn-sm" onClick={onConfirm}>Confirm</button>
      </>
    }>
      <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}

/* ── Loading state ──────────────────────────── */
export function Loading({ text = 'Loading…' }) {
  return (
    <div className="loading-page">
      <div className="spinner" />
      <span>{text}</span>
    </div>
  );
}

/* ── Empty state ────────────────────────────── */
export function Empty({ text = 'No data found.' }) {
  return (
    <div className="empty">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/>
      </svg>
      {text}
    </div>
  );
}

/* ── Status badge ───────────────────────────── */
const TICKET_STATUS = ['Open', 'Closed', 'Lost'];
const TICKET_CLASS  = ['badge-green', 'badge-gray', 'badge-red'];
export function TicketBadge({ status }) {
  return <span className={`badge ${TICKET_CLASS[status] || 'badge-gray'}`}>{TICKET_STATUS[status] || 'Unknown'}</span>;
}

/* ── Vehicle type label ─────────────────────── */
const VEHICLE_LABELS = ['Car', 'Motorcycle', 'Van'];
export function VehicleLabel({ type }) {
  return <span>{VEHICLE_LABELS[type] ?? type}</span>;
}

/* ── Spot status map ────────────────────────── */
export function SpotGrid({ spots }) {
  const statusCls = ['free', 'occupied', 'unavailable'];
  const typeLabel = ['Reg', 'EV'];
  return (
    <div>
      <div className="spot-legend">
        <span><span className="legend-dot" style={{ background: '#b6dfc0' }} />Free</span>
        <span><span className="legend-dot" style={{ background: '#f0bebe' }} />Occupied</span>
        <span><span className="legend-dot" style={{ background: 'var(--border)' }} />Unavailable</span>
      </div>
      <div className="spot-grid">
        {spots.map(s => (
          <div key={s.spotId} className={`spot ${statusCls[s.status] || 'unavailable'}`}>
            <span className="spot-code">{s.hrCode}</span>
            <span className="spot-type">{typeLabel[s.type] || 'Reg'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Stat card ──────────────────────────────── */
export function StatCard({ label, value, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

/* ── Page header ────────────────────────────── */
export function PageHeader({ title, action }) {
  return (
    <div className="section-hdr" style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 20 }}>{title}</h2>
      {action}
    </div>
  );
}

/* ── Form field ─────────────────────────────── */
export function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

/* ── Date formatter ─────────────────────────── */
export function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function fmtDateOnly(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtMoney(n) {
  if (n == null) return '—';
  return parseFloat(n).toFixed(2) + ' L';
}

/* ── Icons (inline SVG) ─────────────────────── */
export const Icons = {
  Dashboard: () => <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>,
  Ticket:    () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="14" height="10" rx="1.5"/><path d="M5 3V2M11 3V2M1 7h14"/></svg>,
  Lot:       () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1.5" y="1.5" width="13" height="13" rx="1.5"/><path d="M5 4v8M5 8h4a2 2 0 000-4H5"/></svg>,
  Tariff:    () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6.5"/><path d="M8 4.5v7M6 6.5h2.5a1.5 1.5 0 010 3H6"/></svg>,
  Users:     () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="5" r="3"/><path d="M1 14c0-3 2-5 5-5s5 2 5 5"/><circle cx="12" cy="5" r="2"/><path d="M15 14c0-2-1-3.5-3-4"/></svg>,
  Search:    () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="5"/><path d="M12 12l2.5 2.5"/></svg>,
  Logout:    () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l3-3-3-3M14 8H6"/></svg>,
  Plus:      () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v10M3 8h10"/></svg>,
  Refresh:   () => <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13.5 8A5.5 5.5 0 112.5 5M2 2v3h3"/></svg>,
  Revenue:   () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12l3-4 3 2 3-5 3 3"/></svg>,
  Spot:      () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="12" height="12" rx="2"/><path d="M6 5v6M6 8h3a1.5 1.5 0 000-3H6"/></svg>,
  Predict:   () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6.5"/><path d="M8 5v3l2 2"/></svg>,
};