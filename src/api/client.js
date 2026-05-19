// src/api/client.js
import API_BASE_URL from '../config';

let TOKEN = '';

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
  if (!text) return null;
  const data = JSON.parse(text);
  return normalize(data);
}

function normalize(val) {
  if (Array.isArray(val)) return val.map(normalize);
  if (val !== null && typeof val === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(val)) {
      out[k] = normalize(v);
      const camel = k.charAt(0).toLowerCase() + k.slice(1);
      if (camel !== k && !(camel in val)) {
        out[camel] = normalize(v);
      }
    }
    return out;
  }
  return val;
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
  createTicket:          (body, vType)         => request(`/api/tickets?VecType=${vType}`, { method: 'POST', body: JSON.stringify(body) }),
  previewTicket:         (id)                  => request(`/api/tickets/${id}/preview`),
  closeTicket:           (id, paid, method)    => request(`/api/tickets/${id}/close?PaidAmount=${paid}&Method=${method}`, { method: 'POST' }),
  searchTickets:         (body)                => request('/api/tickets/search', { method: 'POST', body: JSON.stringify(body) }),
  // Plate-based — used by Viewer (no ticket ID required)
  previewTicketByPlate:  (plate)               => request('/api/tickets/preview/plate', { method: 'POST', body: JSON.stringify({ plate }) }),
  closeTicketByPlate:    (plate, paid, method) => request(`/api/tickets/close/plate?PaidAmount=${paid}&Method=${method}`, { method: 'POST', body: JSON.stringify({ plate }) }),

  // ── Tariffs ──────────────────────────────────
  getTariffsForLot: (lotId) => request(`/api/tariff/lot/${lotId}`),
  getCurrentTariff: (lotId) => request(`/api/tariff/lot/${lotId}/current`),
  createTariff:     (body)  => request('/api/tariff', { method: 'POST', body: JSON.stringify(body) }),
  updateTariff:     (id, b) => request(`/api/tariff/${id}`, { method: 'PUT', body: JSON.stringify(b) }),

  // ── Payments ─────────────────────────────────
  getPayment: (ticketId) => request(`/api/payment/${ticketId}`),

  // ── Users ─────────────────────────────────────
  getUsers:       ()     => request('/api/manageuser/all'),
  createUser:     (body) => request('/api/manageuser/create', { method: 'POST', body: JSON.stringify(body) }),
  deactivateUser: (id)   => request(`/api/manageuser/deactivate/${id}`, { method: 'POST' }),
  reactivateUser: (id)   => request(`/api/manageuser/reactivate/${id}`, { method: 'POST' }),
};