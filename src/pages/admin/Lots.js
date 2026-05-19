// src/pages/admin/Lots.js
import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';
import { Loading, Modal, Field, PageHeader, Empty, Icons } from '../../components/UI';

function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  return { toast, show };
}

function flattenAvailability(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  const free = (data.availableSpots   || data.AvailableSpots   || []).map(s => ({ ...s, status: 0 }));
  const occ  = (data.occupiedSpots    || data.OccupiedSpots    || []).map(s => ({ ...s, status: 1 }));
  const una  = (data.unavailableSpots || data.UnavailableSpots || []).map(s => ({ ...s, status: 2 }));
  // Sort by spotId so spots always appear in physical order
  return [...free, ...occ, ...una].sort((a, b) => (a.spotId ?? 0) - (b.spotId ?? 0));
}

const STATUS_LABEL = { 0: 'Free', 1: 'Occupied', 2: 'Unavailable' };
const STATUS_COLOR  = { 0: '#1e6631', 1: '#8b1a1a', 2: 'var(--text-3)' };
const TYPE_LABEL    = { 0: 'Regular', 1: 'Electric (EV)' };

export default function AdminLots() {
  const [lots,         setLots]         = useState([]);
  const [selected,     setSelected]     = useState(null);
  const [spots,        setSpots]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [spotsLoading, setSpotsLoading] = useState(false);
  const [modal,        setModal]        = useState(null);
  // 'new-lot' | 'edit-lot' | 'new-spot' | 'edit-spot'
  const { toast, show } = useToast();

  const [lotForm,     setLotForm]     = useState({ name: '', address: '' });
  const [spotForm,    setSpotForm]    = useState({ hrCode: '', type: 0, status: 0 });
  const [editingSpot, setEditingSpot] = useState(null); // the spot being edited

  const load = useCallback(async () => {
    setLoading(true);
    try { setLots(await api.getLots()); } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function selectLot(lot) {
    setSelected(lot);
    setSpotsLoading(true);
    try {
      const raw = await api.getLotAvailability(lot.lotId);
      setSpots(flattenAvailability(raw));
    } catch { setSpots([]); }
    finally { setSpotsLoading(false); }
  }

  async function refreshSpots() {
    if (!selected) return;
    setSpotsLoading(true);
    try {
      const raw = await api.getLotAvailability(selected.lotId);
      setSpots(flattenAvailability(raw));
    } catch { setSpots([]); }
    finally { setSpotsLoading(false); }
  }

  // ── Lot actions ─────────────────────────────────────────────────────────────
  async function saveLot() {
    try {
      if (modal === 'new-lot') {
        await api.createLot(lotForm);
        show('Lot created');
      } else {
        await api.updateLot(selected.lotId, { ...selected, ...lotForm });
        show('Lot updated');
      }
      setModal(null); load();
    } catch (e) { show(e.message, 'error'); }
  }

  async function deleteLot(id) {
    if (!window.confirm('Delete this lot? This cannot be undone.')) return;
    try { await api.deleteLot(id); show('Lot deleted'); setSelected(null); setSpots([]); load(); }
    catch (e) { show(e.message, 'error'); }
  }

  function openEditLot() {
    setLotForm({ name: selected.name, address: selected.address });
    setModal('edit-lot');
  }

  // ── Spot actions ─────────────────────────────────────────────────────────────
  async function saveSpot() {
    try {
      await api.createSpot({
        hrCode: spotForm.hrCode.toUpperCase(),
        lotId:  selected.lotId,
        type:   +spotForm.type,
        status: +spotForm.status,
      });
      show('Spot added'); setModal(null); refreshSpots();
    } catch (e) { show(e.message, 'error'); }
  }

  async function updateSpot() {
    try {
      // UpdateSpotDTO accepts hrCode, type, status, lotId
      // Only send fields that changed — service checks for no-op
      await api.updateSpot(editingSpot.spotId, {
        hrCode: spotForm.hrCode.toUpperCase(),
        type:   +spotForm.type,
        status: +spotForm.status,
        lotId:  selected.lotId,
      });
      show('Spot updated'); setModal(null); setEditingSpot(null); refreshSpots();
    } catch (e) { show(e.message, 'error'); }
  }

  async function deleteSpot(spot) {
    if (!window.confirm(`Delete spot ${spot.hrCode ?? spot.HRCode}? This cannot be undone.`)) return;
    try {
      await api.deleteSpot(spot.spotId);
      show('Spot deleted'); refreshSpots();
    } catch (e) { show(e.message, 'error'); }
  }

  function openEditSpot(spot) {
    setEditingSpot(spot);
    setSpotForm({
      hrCode: spot.hrCode ?? spot.HRCode ?? '',
      type:   spot.type   ?? spot.Type   ?? 0,
      status: spot.status ?? spot.Status ?? 0,
    });
    setModal('edit-spot');
  }

  function openNewSpot() {
    setSpotForm({ hrCode: '', type: 0, status: 0 });
    setModal('new-spot');
  }

  const freeCount = spots.filter(s => s.status === 0).length;
  const occCount  = spots.filter(s => s.status === 1).length;
  const unaCount  = spots.filter(s => s.status === 2).length;

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Parking Lots"
        action={
          <button className="btn btn-primary btn-sm" onClick={() => { setLotForm({ name: '', address: '' }); setModal('new-lot'); }}>
            <Icons.Plus /> Add Lot
          </button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: 20, alignItems: 'start' }}>

        {/* ── Lots list ── */}
        <div>
          {lots.length === 0
            ? <Empty text="No lots yet. Add one to get started." />
            : lots.map(lot => (
                <div
                  key={lot.lotId}
                  className="card card-sm"
                  style={{ marginBottom: 10, cursor: 'pointer', borderColor: selected?.lotId === lot.lotId ? 'var(--gray-600)' : 'var(--border)', borderWidth: selected?.lotId === lot.lotId ? 2 : 1 }}
                  onClick={() => selectLot(lot)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{lot.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{lot.address}</div>
                    </div>
                    <span className="badge badge-gray mono">#{lot.lotId}</span>
                  </div>
                </div>
              ))
          }
        </div>

        {/* ── Spot panel ── */}
        <div className="card" style={{ minHeight: 200 }}>
          {!selected
            ? <Empty text="Select a lot to view its spots" />
            : <>
                {/* Panel header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 16 }}>{selected.name}</h3>
                    <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{selected.address}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={openEditLot}>Edit Lot</button>
                    <button className="btn btn-secondary btn-sm" onClick={openNewSpot}><Icons.Plus /> Spot</button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--gray-500)' }} onClick={() => deleteLot(selected.lotId)}>Delete Lot</button>
                  </div>
                </div>

                {/* Spot counts */}
                {!spotsLoading && spots.length > 0 && (
                  <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                    <div className="card card-sm" style={{ flex: 1, textAlign: 'center', padding: '8px 0' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6 }}>Free</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#1e6631' }}>{freeCount}</div>
                    </div>
                    <div className="card card-sm" style={{ flex: 1, textAlign: 'center', padding: '8px 0' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6 }}>Occupied</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#8b1a1a' }}>{occCount}</div>
                    </div>
                    <div className="card card-sm" style={{ flex: 1, textAlign: 'center', padding: '8px 0' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6 }}>N/A</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-3)' }}>{unaCount}</div>
                    </div>
                  </div>
                )}

                {spotsLoading
                  ? <Loading text="Loading spots…" />
                  : spots.length === 0
                    ? <Empty text="No spots yet. Add some spots to this lot." />
                    : (
                        <div className="table-wrap">
                          <table>
                            <thead>
                              <tr>
                                <th>Code</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {spots.map(s => (
                                <tr key={s.spotId}>
                                  <td className="mono" style={{ fontWeight: 600 }}>
                                    {s.hrCode ?? s.HRCode ?? '—'}
                                  </td>
                                  <td style={{ fontSize: 13 }}>
                                    {TYPE_LABEL[s.type ?? s.Type] ?? '—'}
                                  </td>
                                  <td>
                                    <span style={{ fontSize: 12, fontWeight: 500, color: STATUS_COLOR[s.status ?? s.Status] }}>
                                      {STATUS_LABEL[s.status ?? s.Status] ?? '—'}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                    {/* Only allow edit/delete when spot is free or unavailable — not occupied */}
                                    <button
                                      className="btn btn-ghost btn-sm"
                                      onClick={() => openEditSpot(s)}
                                      style={{ marginRight: 4 }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      className="btn btn-ghost btn-sm"
                                      style={{ color: (s.status === 1 || s.status === 'Occupied') ? 'var(--text-3)' : '#8b1a1a' }}
                                      disabled={s.status === 1}
                                      title={s.status === 1 ? 'Cannot delete an occupied spot' : ''}
                                      onClick={() => deleteSpot(s)}
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                }
              </>
          }
        </div>
      </div>

      {/* ── Lot modal (new + edit) ── */}
      {(modal === 'new-lot' || modal === 'edit-lot') && (
        <Modal
          title={modal === 'new-lot' ? 'New Parking Lot' : 'Edit Lot'}
          onClose={() => setModal(null)}
          actions={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={saveLot}>Save</button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Name">
              <input className="input" value={lotForm.name}
                onChange={e => setLotForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Central Parking A" autoFocus />
            </Field>
            <Field label="Address">
              <input className="input" value={lotForm.address}
                onChange={e => setLotForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Rruga Kavajës 1, Tiranë" />
            </Field>
          </div>
        </Modal>
      )}

      {/* ── New spot modal ── */}
      {modal === 'new-spot' && (
        <Modal
          title="Add Parking Spot"
          onClose={() => setModal(null)}
          actions={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={saveSpot}>Add Spot</button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Spot Code (e.g. A1)">
              <input className="input" value={spotForm.hrCode}
                onChange={e => setSpotForm(f => ({ ...f, hrCode: e.target.value }))}
                placeholder="A1" autoFocus />
            </Field>
            <Field label="Type">
              <select className="select" value={spotForm.type}
                onChange={e => setSpotForm(f => ({ ...f, type: +e.target.value }))}>
                <option value={0}>Regular</option>
                <option value={1}>Electric (EV)</option>
              </select>
            </Field>
            <Field label="Initial Status">
              <select className="select" value={spotForm.status}
                onChange={e => setSpotForm(f => ({ ...f, status: +e.target.value }))}>
                <option value={0}>Free</option>
                <option value={2}>Unavailable</option>
              </select>
            </Field>
          </div>
        </Modal>
      )}

      {/* ── Edit spot modal ── */}
      {modal === 'edit-spot' && editingSpot && (
        <Modal
          title={`Edit Spot ${editingSpot.hrCode ?? editingSpot.HRCode}`}
          onClose={() => { setModal(null); setEditingSpot(null); }}
          actions={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => { setModal(null); setEditingSpot(null); }}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={updateSpot}>Save Changes</button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Spot Code">
              <input className="input" value={spotForm.hrCode}
                onChange={e => setSpotForm(f => ({ ...f, hrCode: e.target.value }))}
                placeholder="A1" autoFocus />
            </Field>
            <Field label="Type">
              <select className="select" value={spotForm.type}
                onChange={e => setSpotForm(f => ({ ...f, type: +e.target.value }))}>
                <option value={0}>Regular</option>
                <option value={1}>Electric (EV)</option>
              </select>
            </Field>
            <Field label="Status">
              <select className="select" value={spotForm.status}
                onChange={e => setSpotForm(f => ({ ...f, status: +e.target.value }))}>
                <option value={0}>Free</option>
                <option value={1}>Occupied</option>
                <option value={2}>Unavailable</option>
              </select>
            </Field>
          </div>
        </Modal>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}