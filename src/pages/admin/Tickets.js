// src/pages/admin/Tickets.js
import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';
import { Loading, Modal, Field, TicketBadge, PageHeader, fmtDate, fmtMoney, Icons } from '../../components/UI';

const VEHICLE_OPTS  = [{ v: 0, l: 'Car' }, { v: 1, l: 'Motorcycle' }, { v: 2, l: 'Van' }];
const VEHICLE_LABEL = { 0: 'Car', 1: 'Motorcycle', 2: 'Van' };
const STATUS_OPTS   = [{ v: '', l: 'Any' }, { v: 0, l: 'Open' }, { v: 1, l: 'Closed' }, { v: 2, l: 'Lost' }];

function flattenAvailability(data) {
  if (!data || Array.isArray(data)) return data || [];
  const free = (data.availableSpots   || data.AvailableSpots   || []).map(s => ({ ...s, status: 0 }));
  const occ  = (data.occupiedSpots    || data.OccupiedSpots    || []).map(s => ({ ...s, status: 1 }));
  const una  = (data.unavailableSpots || data.UnavailableSpots || []).map(s => ({ ...s, status: 2 }));
  return [...free, ...occ, ...una];
}

function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  return { toast, show };
}

// Build a lotId → lotName lookup from the lots array
function buildLotMap(lots) {
  const m = {};
  lots.forEach(l => { m[l.lotId] = l.name; });
  return m;
}

export default function AdminTickets() {
  const [lots,      setLots]      = useState([]);
  const [lotMap,    setLotMap]    = useState({});
  const [freeSpots, setFreeSpots] = useState([]);
  const [tickets,   setTickets]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [modal,     setModal]     = useState(null); // 'issue' only — close removed for Admin
  const { toast, show } = useToast();

  const [search,    setSearch]    = useState({ plate: '', status: '' });
  const [issueForm, setIssueForm] = useState({ lotId: '', hrCode: '', plate: '', vehicleType: 0 });

  useEffect(() => {
    api.getLots().then(l => {
      setLots(l);
      setLotMap(buildLotMap(l));
    }).catch(() => {});
    loadOpenTickets();
  }, []); // eslint-disable-line

  async function loadOpenTickets() {
    setLoading(true);
    try {
      const lotsData = await api.getLots();
      const map = buildLotMap(lotsData);
      const all = [];
      await Promise.all(lotsData.map(async lot => {
        try {
          const open = await api.getOpenTickets(lot.lotId);
          if (Array.isArray(open)) open.forEach(t => all.push({ ...t, lotName: lot.name }));
        } catch {}
      }));
      setTickets(all);
      setLotMap(map);
    } catch { setTickets([]); }
    finally { setLoading(false); }
  }

  const loadSpots = useCallback(async (lotId) => {
    if (!lotId) { setFreeSpots([]); return; }
    try {
      const raw = await api.getLotAvailability(+lotId);
      const all = flattenAvailability(raw);
      setFreeSpots(all.filter(s => s.status === 0));
    } catch { setFreeSpots([]); }
  }, []);

  async function doSearch() {
    const plate = search.plate.trim();
    if (!plate && search.status === '') return loadOpenTickets();
    if (plate && plate.length !== 7) {
      show('Plate must be exactly 7 characters (e.g. AB123CD)', 'error'); return;
    }
    setLoading(true);
    try {
      const body = {};
      if (plate)               body.plate  = plate;
      if (search.status !== '') body.status = +search.status;
      const results = await api.searchTickets(body);
      // For search results, lot name comes from lotMap since ResponseTicketDTO has lotId
      setTickets(results.map(t => ({ ...t, lotName: lotMap[t.lotId] ?? '—' })));
    } catch (e) {
      setTickets([]);
      if (!e.message.includes('400') && !e.message.includes('404')) show(e.message, 'error');
    }
    finally { setLoading(false); }
  }

  async function issueTicket() {
    if (!issueForm.lotId || !issueForm.hrCode || !issueForm.plate) {
      show('Please fill in all fields', 'error'); return;
    }
    try {
      const t = await api.createTicket(
        { lotId: +issueForm.lotId, hrCode: issueForm.hrCode.toUpperCase(), plate: issueForm.plate.toUpperCase() },
        +issueForm.vehicleType
      );
      show(`Ticket #${t.ticketId} issued`);
      setModal(null);
      loadOpenTickets();
    } catch (e) { show(e.message, 'error'); }
  }

  // Resolve spot HR code — open tickets now return hrCode directly from expanded DTO.
  // Search results return hrCode from ResponseTicketDTO.
  function getHRCode(t) {
    return t.hrCode ?? t.HRCode ?? t.hrcode ?? t.spotHrCode ?? '—';
  }

  // Resolve vehicle type label from integer enum value
  function getVehicle(t) {
    const v = t.vehicleType ?? t.VehicleType;
    return VEHICLE_LABEL[v] ?? '—';
  }

  // Resolve lot name — open tickets have lotName injected above,
  // search results use lotMap via lotId
  function getLotName(t) {
    return t.lotName || lotMap[t.lotId] || '—';
  }

  return (
    <div>
      <PageHeader
        title="Tickets"
        action={
          <button className="btn btn-primary btn-sm" onClick={() => {
            setIssueForm({ lotId: '', hrCode: '', plate: '', vehicleType: 0 });
            setModal('issue');
          }}>
            <Icons.Plus /> Issue Ticket
          </button>
        }
      />

      {/* Search bar */}
      <div className="card card-sm" style={{ marginBottom: 20, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="field" style={{ flex: 1, minWidth: 160 }}>
          <label>Plate (7 chars, optional)</label>
          <input
            className="input"
            placeholder="AB123CD"
            value={search.plate}
            onChange={e => setSearch(s => ({ ...s, plate: e.target.value.toUpperCase() }))}
            maxLength={7}
          />
        </div>
        <div className="field" style={{ minWidth: 140 }}>
          <label>Status</label>
          <select className="select" value={search.status} onChange={e => setSearch(s => ({ ...s, status: e.target.value }))}>
            {STATUS_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        </div>
        <button className="btn btn-secondary" onClick={doSearch}><Icons.Search /> Search</button>
        <button className="btn btn-ghost" onClick={() => { setSearch({ plate: '', status: '' }); loadOpenTickets(); }}>Reset</button>
      </div>

      {/* Results table */}
      {loading
        ? <Loading />
        : <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Plate</th><th>Vehicle</th><th>Spot</th><th>Lot</th>
                  <th>Entry</th><th>Exit</th><th>Amount</th><th>Status</th>
                  {/* No action column — Admin cannot close tickets, that is Viewer only */}
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0
                  ? <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 32 }}>No tickets found</td></tr>
                  : tickets.map(t => (
                      <tr key={t.ticketId}>
                        <td className="mono">#{t.ticketId}</td>
                        <td className="mono">{t.plate}</td>
                        <td>{getVehicle(t)}</td>
                        <td>{getHRCode(t)}</td>
                        <td style={{ fontSize: 12 }}>{getLotName(t)}</td>
                        <td style={{ fontSize: 12 }}>{fmtDate(t.entry)}</td>
                        <td style={{ fontSize: 12 }}>{fmtDate(t.exit)}</td>
                        <td className="mono">{fmtMoney(t.totalAmount)}</td>
                        <td><TicketBadge status={t.status} /></td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>
      }

      {/* Issue ticket modal */}
      {modal === 'issue' && (
        <Modal
          title="Issue New Ticket"
          onClose={() => setModal(null)}
          actions={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={issueTicket}>Issue</button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Lot">
              <select className="select" value={issueForm.lotId}
                onChange={e => { setIssueForm(f => ({ ...f, lotId: e.target.value, hrCode: '' })); loadSpots(e.target.value); }}>
                <option value="">Select lot…</option>
                {lots.map(l => <option key={l.lotId} value={l.lotId}>{l.name}</option>)}
              </select>
            </Field>
            <Field label="Free Spot">
              <select className="select" value={issueForm.hrCode}
                onChange={e => setIssueForm(f => ({ ...f, hrCode: e.target.value }))}>
                <option value="">Select spot…</option>
                {freeSpots.map(s => <option key={s.spotId} value={s.hrCode}>{s.hrCode}</option>)}
              </select>
            </Field>
            <Field label="Plate Number">
              <input className="input" value={issueForm.plate}
                onChange={e => setIssueForm(f => ({ ...f, plate: e.target.value.toUpperCase() }))}
                placeholder="AB123CD" maxLength={10} />
            </Field>
            <Field label="Vehicle Type">
              <select className="select" value={issueForm.vehicleType}
                onChange={e => setIssueForm(f => ({ ...f, vehicleType: +e.target.value }))}>
                {VEHICLE_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </Field>
          </div>
        </Modal>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}