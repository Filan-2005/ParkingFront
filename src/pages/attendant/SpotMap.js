// src/pages/attendant/SpotMap.js
import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Loading, SpotGrid, PageHeader, Icons } from '../../components/UI';

function flattenAvailability(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  const free = (data.availableSpots   || data.AvailableSpots   || []).map(s => ({ ...s, status: 0 }));
  const occ  = (data.occupiedSpots    || data.OccupiedSpots    || []).map(s => ({ ...s, status: 1 }));
  const una  = (data.unavailableSpots || data.UnavailableSpots || []).map(s => ({ ...s, status: 2 }));
  const all  = [...free, ...occ, ...una];
  // FIX: sort by spotId ascending so spots appear in their physical order,
  // not grouped by availability status.
  return all.sort((a, b) => (a.spotId ?? a.SpotId ?? 0) - (b.spotId ?? b.SpotId ?? 0));
}

export default function AttendantSpotMap() {
  const [lots,         setLots]         = useState([]);
  const [selected,     setSelected]     = useState(null);
  const [spots,        setSpots]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [spotsLoading, setSpotsLoading] = useState(false);

  useEffect(() => {
    api.getLots()
      .then(l => {
        setLots(l);
        setLoading(false);
        if (l.length) selectLot(l[0]);
      })
      .catch(() => setLoading(false));
  }, []); // eslint-disable-line

  async function selectLot(lot) {
    setSelected(lot);
    setSpotsLoading(true);
    try {
      const raw = await api.getLotAvailability(lot.lotId);
      setSpots(flattenAvailability(raw));
    } catch { setSpots([]); }
    finally { setSpotsLoading(false); }
  }

  if (loading) return <Loading />;

  const free  = spots.filter(s => s.status === 0).length;
  const occ   = spots.filter(s => s.status === 1).length;
  const total = spots.length;

  return (
    <div>
      <PageHeader title="Spot Map" action={
        selected && (
          <button className="btn btn-secondary btn-sm" onClick={() => selectLot(selected)}>
            <Icons.Refresh /> Refresh
          </button>
        )
      } />

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {lots.map(lot => (
          <button
            key={lot.lotId}
            className={`btn ${selected?.lotId === lot.lotId ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => selectLot(lot)}
          >{lot.name}</button>
        ))}
      </div>

      {selected && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div className="card card-sm" style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Free</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1e6631' }}>{free}</div>
            </div>
            <div className="card card-sm" style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Occupied</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#8b1a1a' }}>{occ}</div>
            </div>
            <div className="card card-sm" style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Total</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{total}</div>
            </div>
          </div>

          <div className="card">
            {spotsLoading
              ? <Loading text="Updating map…" />
              : spots.length === 0
                ? <p style={{ textAlign: 'center', color: 'var(--text-3)', padding: 32 }}>No spots in this lot yet.</p>
                : <SpotGrid spots={spots} />
            }
          </div>
        </>
      )}
    </div>
  );
}