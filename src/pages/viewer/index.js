// src/pages/viewer/index.js
import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Loading } from '../../components/UI';

// ── Viewer Overview ────────────────────────────────────────────────────────────
export function ViewerOverview() {
  const [lots,    setLots]    = useState([]);
  const [counts,  setCounts]  = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const lotsData = await api.getLots();
      setLots(lotsData);
      const c = {};
      await Promise.all(lotsData.map(async lot => {
        try { c[lot.lotId] = await api.getLotCount(lot.lotId); } catch {}
      }));
      setCounts(c);
    } catch {}
    finally { setLoading(false); }
  }

  if (loading) return <Loading />;

  function getFree(c) { return c?.available   ?? c?.Available   ?? 0; }
  function getOcc(c)  { return c?.occupied    ?? c?.Occupied    ?? 0; }
  function getUna(c)  { return c?.unavailable ?? c?.Unavailable ?? 0; }

  return (
    <div>
      <div className="section-hdr" style={{ marginBottom: 14 }}><h3>Lot Availability</h3></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {lots.map(lot => {
          const c     = counts[lot.lotId];
          const free  = getFree(c);
          const occ   = getOcc(c);
          const una   = getUna(c);
          const total = free + occ + una;
          const pct   = total > 0 ? Math.round((free / total) * 100) : 0;
          return (
            <div key={lot.lotId} className="card">
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{lot.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>{lot.address}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Availability</span>
                <span style={{ fontWeight: 700, fontSize: 20 }}>
                  {free} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-3)' }}>free</span>
                </span>
              </div>
              <div style={{ height: 6, background: 'var(--gray-100)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${pct}%`, borderRadius: 99, transition: 'width 0.4s',
                  background: pct > 30 ? '#2d6a4f' : pct > 10 ? '#7c5a00' : '#8b1a1a'
                }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 5, display: 'flex', justifyContent: 'space-between' }}>
                <span>{occ} occupied · {una} unavailable</span>
                <span>{pct}% free</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Viewer SpotMap ─────────────────────────────────────────────────────────────
export function ViewerSpotMap() {
  const AttendantSpotMap = require('../attendant/SpotMap').default;
  return <AttendantSpotMap />;
}

// ── Viewer Tickets ─────────────────────────────────────────────────────────────
// CreateTicketDTO: { lotId: int, hrCode: string (required), plate: string (required), entry?: DateTime }
// hrCode is the spot's human-readable code (e.g. "A1") — NOT the spotId integer.

const VEHICLE_TYPES = ['Car', 'Motorcycle', 'Van'];
const PAYMENT_METHODS = [
  { label: 'Cash',  value: 0 },
  { label: 'Card',  value: 1 },
  { label: 'Other', value: 2 },
];

function fmt(n) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString('sq-AL', { style: 'currency', currency: 'ALL' });
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function ViewerTickets() {
  const [tab, setTab] = useState('enter'); // 'enter' | 'exit'

  // ── Enter flow ──────────────────────────────────────────────────────────────
  const [lots,         setLots]         = useState([]);
  const [freeSpots,    setFreeSpots]    = useState([]);
  // hrCode is what we send — it's the spot's human-readable code string, not its integer id
  const [enterForm,    setEnterForm]    = useState({ plate: '', lotId: '', hrCode: '', vehicleType: 0 });
  const [enterResult,  setEnterResult]  = useState(null);
  const [enterError,   setEnterError]   = useState('');
  const [enterLoading, setEnterLoading] = useState(false);

  useEffect(() => { api.getLots().then(setLots).catch(() => {}); }, []);

  async function loadFreeSpots(lotId) {
    setFreeSpots([]);
    setEnterForm(f => ({ ...f, hrCode: '' }));
    if (!lotId) return;
    try {
      const raw  = await api.getLotAvailability(parseInt(lotId, 10));
      const free = raw?.availableSpots ?? raw?.AvailableSpots ?? [];
      setFreeSpots(free);
    } catch {}
  }

  async function doEnter() {
    if (!enterForm.plate)  { setEnterError('Plate is required.');   return; }
    if (!enterForm.lotId)  { setEnterError('Select a lot.');         return; }
    if (!enterForm.hrCode) { setEnterError('Select a spot.');        return; }
    setEnterError(''); setEnterResult(null); setEnterLoading(true);
    try {
      const body = {
        plate:  enterForm.plate.trim().toUpperCase(),
        lotId:  parseInt(enterForm.lotId, 10),
        // hrCode is required by CreateTicketDTO — send the spot's HR code string
        hrCode: enterForm.hrCode,
      };
      const result = await api.createTicket(body, +enterForm.vehicleType);
      setEnterResult(result);
      setEnterForm({ plate: '', lotId: '', hrCode: '', vehicleType: 0 });
      setFreeSpots([]);
    } catch (e) { setEnterError(e.message); }
    finally { setEnterLoading(false); }
  }

  // ── Exit flow ───────────────────────────────────────────────────────────────
  const [exitStep,    setExitStep]    = useState(1);
  const [ticketId,    setTicketId]    = useState('');
  const [previewAmt,  setPreviewAmt]  = useState(null);
  const [payMethod,   setPayMethod]   = useState(0);
  const [paidAmount,  setPaidAmount]  = useState('');
  const [exitResult,  setExitResult]  = useState(null);
  const [exitError,   setExitError]   = useState('');
  const [exitLoading, setExitLoading] = useState(false);

  async function doPreview() {
    const id = parseInt(ticketId, 10);
    if (!id) { setExitError('Enter a valid ticket ID.'); return; }
    setExitError(''); setExitLoading(true);
    try {
      const amount = await api.previewTicket(id);
      setPreviewAmt(amount);
      setPaidAmount(String(Math.ceil(amount)));
      setExitStep(2);
    } catch { setExitError('Ticket not found or already closed.'); }
    finally { setExitLoading(false); }
  }

  async function doClose() {
    const id   = parseInt(ticketId, 10);
    const paid = parseFloat(paidAmount);
    if (!paid || paid < previewAmt) {
      setExitError(`Paid amount must be at least ${fmt(previewAmt)}.`); return;
    }
    setExitError(''); setExitLoading(true);
    try {
      const result = await api.closeTicket(id, paid, payMethod);
      setExitResult(result);
      setExitStep(3);
    } catch (e) { setExitError(e.message); }
    finally { setExitLoading(false); }
  }

  function resetExit() {
    setExitStep(1); setTicketId(''); setPreviewAmt(null);
    setPaidAmount(''); setExitResult(null); setExitError('');
  }

  const tabBtn = (t) => ({
    padding: '6px 20px', borderRadius: 6, border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 500,
    background: tab === t ? 'var(--color-primary, #1a1a2e)' : 'var(--gray-100)',
    color: tab === t ? '#fff' : 'var(--text-2)',
  });

  const lbl = (text) => (
    <label style={{ fontSize: 12, color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>{text}</label>
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button style={tabBtn('enter')} onClick={() => setTab('enter')}>Enter Lot</button>
        <button style={tabBtn('exit')}  onClick={() => setTab('exit')}>Exit &amp; Pay</button>
      </div>

      {/* ── Enter Lot ── */}
      {tab === 'enter' && (
        <div className="card" style={{ maxWidth: 440 }}>
          {enterResult ? (
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: '#2d6a4f', marginBottom: 12 }}>
                ✓ Ticket created — welcome!
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.8 }}>
                <div>Ticket ID: <strong>#{enterResult.ticketId ?? enterResult.TicketId}</strong></div>
                <div>Plate: <strong>{enterResult.plate ?? enterResult.Plate}</strong></div>
                <div>Entry: <strong>{fmtDate(enterResult.entry ?? enterResult.Entry)}</strong></div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>
                Keep your ticket ID — you will need it to pay on exit.
              </div>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: 16 }}
                onClick={() => setEnterResult(null)}>New entry</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                {lbl('Plate number')}
                <input className="input" placeholder="e.g. AA 123 BB"
                  value={enterForm.plate}
                  onChange={e => setEnterForm(f => ({ ...f, plate: e.target.value }))} />
              </div>
              <div>
                {lbl('Vehicle type')}
                <select className="select" value={enterForm.vehicleType}
                  onChange={e => setEnterForm(f => ({ ...f, vehicleType: e.target.value }))}>
                  {VEHICLE_TYPES.map((v, i) => <option key={i} value={i}>{v}</option>)}
                </select>
              </div>
              <div>
                {lbl('Parking lot')}
                <select className="select" value={enterForm.lotId}
                  onChange={e => {
                    setEnterForm(f => ({ ...f, lotId: e.target.value, hrCode: '' }));
                    loadFreeSpots(e.target.value);
                  }}>
                  <option value="">Select lot…</option>
                  {lots.map(l => <option key={l.lotId} value={l.lotId}>{l.name}</option>)}
                </select>
              </div>
              <div>
                {lbl('Spot (free only)')}
                <select className="select" value={enterForm.hrCode}
                  onChange={e => setEnterForm(f => ({ ...f, hrCode: e.target.value }))}
                  disabled={!freeSpots.length}>
                  <option value="">{freeSpots.length ? 'Select spot…' : 'Select a lot first'}</option>
                  {freeSpots.map(s => {
                    // hrCode is what CreateTicketDTO requires — use it as both value and label
                    const code = s.hrCode ?? s.HrCode ?? s.hrcode ?? String(s.spotId);
                    return <option key={s.spotId ?? code} value={code}>{code}</option>;
                  })}
                </select>
              </div>
              {enterError && <div style={{ color: '#8b1a1a', fontSize: 13 }}>{enterError}</div>}
              <button className="btn btn-primary btn-sm" onClick={doEnter} disabled={enterLoading}>
                {enterLoading ? 'Creating…' : 'Create Entry Ticket'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Exit & Pay ── */}
      {tab === 'exit' && (
        <div className="card" style={{ maxWidth: 440 }}>

          {/* Step 1: enter ticket ID */}
          {exitStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
                Enter your ticket ID to see how much you owe.
              </div>
              <div>
                {lbl('Ticket ID')}
                <input className="input" type="number" placeholder="e.g. 42"
                  value={ticketId}
                  onChange={e => { setTicketId(e.target.value); setExitError(''); }}
                  onKeyDown={e => e.key === 'Enter' && doPreview()} />
              </div>
              {exitError && <div style={{ color: '#8b1a1a', fontSize: 13 }}>{exitError}</div>}
              <button className="btn btn-primary btn-sm" onClick={doPreview} disabled={exitLoading}>
                {exitLoading ? 'Checking…' : 'Check Price'}
              </button>
            </div>
          )}

          {/* Step 2: confirm payment */}
          {exitStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ paddingBottom: 14, borderBottom: '1px solid var(--gray-100)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 2 }}>
                  Amount due for ticket #{ticketId}
                </div>
                <div style={{ fontSize: 32, fontWeight: 700 }}>{fmt(previewAmt)}</div>
              </div>
              <div>
                {lbl('Payment method')}
                <select className="select" value={payMethod}
                  onChange={e => setPayMethod(+e.target.value)}>
                  {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                {lbl('Amount paid (L)')}
                <input className="input" type="number" step="0.01" min={previewAmt}
                  value={paidAmount}
                  onChange={e => { setPaidAmount(e.target.value); setExitError(''); }} />
              </div>
              {exitError && <div style={{ color: '#8b1a1a', fontSize: 13 }}>{exitError}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={resetExit}>Back</button>
                <button className="btn btn-primary btn-sm" onClick={doClose} disabled={exitLoading}>
                  {exitLoading ? 'Processing…' : 'Confirm Payment'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: receipt */}
          {exitStep === 3 && exitResult && (
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: '#2d6a4f', marginBottom: 12 }}>
                ✓ Payment confirmed — safe travels!
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.8 }}>
                <div>Ticket ID: <strong>#{ticketId}</strong></div>
                <div>Plate: <strong>{exitResult.plate ?? exitResult.Plate}</strong></div>
                <div>Entry: <strong>{fmtDate(exitResult.entry ?? exitResult.Entry)}</strong></div>
                <div>Exit: <strong>{fmtDate(exitResult.exit ?? exitResult.Exit)}</strong></div>
                <div>Change: <strong>{fmt(exitResult.change ?? exitResult.Change)}</strong></div>
              </div>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: 16 }}
                onClick={resetExit}>Done</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}