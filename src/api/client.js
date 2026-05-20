// src/api/client.js
// Central API client – all calls go through here.
// The base URL is set once in src/config.js.

import API_BASE_URL from '../config';

let TOKEN = localStorage.getItem('sp_token') || '';

export function setToken(t) {
  TOKEN = t;
  localStorage.setItem('sp_token', t);
}

export function clearAuth() {
  TOKEN = '';
  localStorage.removeItem('sp_token');
  localStorage.removeItem('sp_user');
}

async function request(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
  const res = await fetch(API_BASE_URL + path, {
    ...opts,
    headers: { ...headers, ...(opts.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(body || `HTTP ${res.status}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  // ── Auth ──────────────────────────────────────
  login: (username, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  // ── Parking Lots ─────────────────────────────
  getLots:            ()         => request('/api/parkinglot'),
  getLot:             (id)       => request(`/api/parkinglot/${id}`),
  createLot:          (body)     => request('/api/parkinglot', { method: 'POST', body: JSON.stringify(body) }),
  updateLot:          (id, body) => request(`/api/parkinglot/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteLot:          (id)       => request(`/api/parkinglot/${id}`, { method: 'DELETE' }),
  // Returns { availableSpots:[...], occupiedSpots:[...], unavailableSpots:[...] }
  getLotAvailability: (id)       => request(`/api/parkinglot/${id}/availability`),
  getLotCount:        (id)       => request(`/api/parkinglot/${id}/availability/count`),
  getOpenTickets:     (id)       => request(`/api/parkinglot/${id}/tickets/open`),
  getTodayRevenue:    (id)       => request(`/api/parkinglot/${id}/revenue/today`),
  getRevenueForDates: (id, f, t) => request(`/api/parkinglot/${id}/revenue/for/dates?FirstDate=${f}&LastDate=${t}`),

  // ── Parking Spots ────────────────────────────
  createSpot: (body)     => request('/api/parkingspot', { method: 'POST', body: JSON.stringify(body) }),
  updateSpot: (id, body) => request(`/api/parkingspot/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteSpot: (id)       => request(`/api/parkingspot/${id}`, { method: 'DELETE' }),

  // ── Tickets ──────────────────────────────────
  createTicket:  (body, vType)      => request(`/api/tickets?VecType=${vType}`, { method: 'POST', body: JSON.stringify(body) }),
  previewTicket: (id)               => request(`/api/tickets/${id}/preview`),
  closeTicket:   (id, paid, method) => request(`/api/tickets/${id}/close?PaidAmount=${paid}&Method=${method}`, { method: 'POST' }),
  searchTickets: (body)             => request('/api/tickets/search', { method: 'POST', body: JSON.stringify(body) }),

  // ── Tariffs ──────────────────────────────────
  getTariffsForLot: (lotId) => request(`/api/tariff/lot/${lotId}`),
  getCurrentTariff: (lotId) => request(`/api/tariff/lot/${lotId}/current`),
  createTariff:     (body)  => request('/api/tariff', { method: 'POST', body: JSON.stringify(body) }),
  updateTariff:     (id, b) => request(`/api/tariff/${id}`, { method: 'PUT', body: JSON.stringify(b) }),

  // ── Payments ─────────────────────────────────
  getPayment: (ticketId) => request(`/api/payment/${ticketId}`),

  // ── Users (admin) — correct paths per ManageUserController ──
  getUsers:       ()     => request('/api/manageuser/all'),
  createUser:     (body) => request('/api/manageuser/create', { method: 'POST', body: JSON.stringify(body) }),
  deactivateUser: (id)   => request(`/api/manageuser/deactivate/${id}`, { method: 'POST' }),
  reactivateUser: (id)   => request(`/api/manageuser/reactivate/${id}`, { method: 'POST' }),

  // ── Predictions (admin only) ──────────────────
  predictNow:    (lotId)           => request(`/api/prediction/${lotId}/now`),
  predictNext24: (lotId)           => request(`/api/prediction/${lotId}/next24hours`),
  predictAt:     (lotId, datetime) => request(`/api/prediction/${lotId}/at?datetime=${encodeURIComponent(datetime)}`),
};