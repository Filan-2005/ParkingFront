// src/pages/admin/Predictions.js
import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../api/client';
import { Loading, Empty, PageHeader, Field, StatCard } from '../../components/UI';

// ── Toast (local, same pattern as Lots.js) ────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };
  return { toast, show };
}

// ── Label → badge colour ───────────────────────────────────────────────────────
const LEVEL_CLASS = { Low: 'badge-green', Medium: 'badge-amber', High: 'badge-red' };
function OccupancyBadge({ label }) {
  return <span className={`badge ${LEVEL_CLASS[label] || 'badge-gray'}`}>{label ?? '—'}</span>;
}

// ── Single prediction card ─────────────────────────────────────────────────────
function PredCard({ label, pred, loading }) {
  if (loading) return (
    <div className="card" style={{ flex: 1 }}>
      <div className="stat-label" style={{ marginBottom: 12 }}>{label}</div>
      <Loading text="Predicting…" />
    </div>
  );
  if (!pred) return null;
  return (
    <div className="card" style={{ flex: 1 }}>
      <div className="stat-label" style={{ marginBottom: 12 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <OccupancyBadge label={pred.predictedLabel} />
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{pred.description}</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { l: 'Low',    v: pred.probabilityLow    ?? pred.probability_low },
          { l: 'Med',    v: pred.probabilityMedium ?? pred.probability_medium },
          { l: 'High',   v: pred.probabilityHigh   ?? pred.probability_high },
        ].map(({ l, v }) => (
          <div key={l} className="card card-sm" style={{ flex: 1, textAlign: 'center', padding: '8px 4px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{l}</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{v != null ? (v * 100).toFixed(0) + '%' : '—'}</div>
          </div>
        ))}
      </div>
      {pred.weather && (
        <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-3)', display: 'flex', gap: 12 }}>
          <span>🌡 {pred.weather.temperature_2m ?? pred.weather.Temperature}°C</span>
          <span>🌧 {pred.weather.precipitation ?? pred.weather.Precipitation} mm</span>
          <span>☁ {pred.weather.cloudcover ?? pred.weather.CloudCover}%</span>
        </div>
      )}
    </div>
  );
}

// ── 24-hour table ──────────────────────────────────────────────────────────────
function Next24Table({ data, loading }) {
  if (loading) return <Loading text="Loading 24-hour forecast…" />;
  if (!data) return null;
  const rows = data.predictions ?? data.Predictions ?? [];
  return (
    <div className="table-wrap" style={{ marginTop: 24 }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 15 }}>Next 24 Hours</h3>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
          Generated at {data.generatedAt ?? data.generated_at
            ? new Date(data.generatedAt ?? data.generated_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
            : '—'}
        </span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Occupancy</th>
            <th>Description</th>
            <th style={{ textAlign: 'right' }}>Low</th>
            <th style={{ textAlign: 'right' }}>Med</th>
            <th style={{ textAlign: 'right' }}>High</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0
            ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 28 }}>No data</td></tr>
            : rows.map((r, i) => {
                const dt = r.datetime ?? r.Datetime;
                const label = r.predictedLabel ?? r.predicted_label;
                const pLow  = r.probabilityLow    ?? r.probability_low;
                const pMed  = r.probabilityMedium ?? r.probability_medium;
                const pHigh = r.probabilityHigh   ?? r.probability_high;
                return (
                  <tr key={i}>
                    <td className="mono">
                      {dt ? new Date(dt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td><OccupancyBadge label={label} /></td>
                    <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{r.description ?? r.Description}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{pLow  != null ? (pLow  * 100).toFixed(0) + '%' : '—'}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{pMed  != null ? (pMed  * 100).toFixed(0) + '%' : '—'}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{pHigh != null ? (pHigh * 100).toFixed(0) + '%' : '—'}</td>
                  </tr>
                );
              })
          }
        </tbody>
      </table>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AdminPredictions() {
  const [lots,        setLots]        = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [lotsLoading, setLotsLoading] = useState(true);

  // Current prediction
  const [nowPred,    setNowPred]    = useState(null);
  const [nowLoading, setNowLoading] = useState(false);

  // 24-hour forecast
  const [next24,        setNext24]        = useState(null);
  const [next24Loading, setNext24Loading] = useState(false);

  // Predict-at
  const [atDatetime,  setAtDatetime]  = useState('');
  const [atPred,      setAtPred]      = useState(null);
  const [atLoading,   setAtLoading]   = useState(false);

  const { toast, show } = useToast();

  // Load lots list once
  useEffect(() => {
    (async () => {
      setLotsLoading(true);
      try { setLots(await api.getLots()); }
      catch { show('Failed to load lots', 'error'); }
      finally { setLotsLoading(false); }
    })();
  }, []);

  // When a lot is selected, immediately fetch current + 24h
  const handleSelectLot = useCallback(async (lot) => {
    setSelectedLot(lot);
    setNowPred(null);
    setNext24(null);
    setAtPred(null);
    setAtDatetime('');

    setNowLoading(true);
    setNext24Loading(true);

    const [nowRes, next24Res] = await Promise.allSettled([
      api.predictNow(lot.lotId),
      api.predictNext24(lot.lotId),
    ]);

    if (nowRes.status === 'fulfilled') setNowPred(nowRes.value);
    else show('Current prediction failed: ' + nowRes.reason?.message, 'error');
    setNowLoading(false);

    if (next24Res.status === 'fulfilled') setNext24(next24Res.value);
    else show('24h forecast failed: ' + next24Res.reason?.message, 'error');
    setNext24Loading(false);
  }, [show]);

  async function handlePredictAt() {
    if (!atDatetime) { show('Enter a date and time first', 'error'); return; }
    setAtLoading(true);
    setAtPred(null);
    try {
      const res = await api.predictAt(selectedLot.lotId, atDatetime);
      setAtPred(res);
    } catch (e) {
      show('Prediction failed: ' + e.message, 'error');
    } finally {
      setAtLoading(false);
    }
  }

  if (lotsLoading) return <Loading />;

  return (
    <div>
      <PageHeader title="Occupancy Predictions" />

      {/* Lot selector */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Field label="Select Lot" style={{ flex: 1, minWidth: 220 }}>
            <select
              className="select"
              value={selectedLot?.lotId ?? ''}
              onChange={e => {
                const lot = lots.find(l => l.lotId === +e.target.value);
                if (lot) handleSelectLot(lot);
              }}
            >
              <option value="">— choose a lot —</option>
              {lots.map(l => (
                <option key={l.lotId} value={l.lotId}>{l.name}</option>
              ))}
            </select>
          </Field>

          {selectedLot && (
            <div style={{ fontSize: 12, color: 'var(--text-3)', paddingTop: 18 }}>
              {selectedLot.address} &nbsp;·&nbsp; capacity: <strong>{selectedLot.totalSpots ?? selectedLot.TotalSpots ?? '?'}</strong>
            </div>
          )}
        </div>
      </div>

      {!selectedLot && (
        <Empty text="Select a lot above to view occupancy predictions." />
      )}

      {selectedLot && (
        <>
          {/* Current + at-time predictions side by side */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
            <PredCard label="Right Now" pred={nowPred} loading={nowLoading} />

            {/* Predict at specific datetime */}
            <div className="card" style={{ flex: 1 }}>
              <div className="stat-label" style={{ marginBottom: 12 }}>Predict at Specific Time</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <Field label="Date &amp; Time" style={{ flex: 1 }}>
                  <input
                    className="input"
                    type="datetime-local"
                    value={atDatetime}
                    onChange={e => { setAtDatetime(e.target.value); setAtPred(null); }}
                  />
                </Field>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ marginBottom: 1, whiteSpace: 'nowrap' }}
                  onClick={handlePredictAt}
                  disabled={atLoading || !atDatetime}
                >
                  {atLoading ? 'Predicting…' : 'Predict'}
                </button>
              </div>

              {atLoading && <Loading text="Predicting…" />}

              {atPred && !atLoading && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <OccupancyBadge label={atPred.predictedLabel ?? atPred.predicted_label} />
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{atPred.description}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { l: 'Low',  v: atPred.probabilityLow    ?? atPred.probability_low },
                      { l: 'Med',  v: atPred.probabilityMedium ?? atPred.probability_medium },
                      { l: 'High', v: atPred.probabilityHigh   ?? atPred.probability_high },
                    ].map(({ l, v }) => (
                      <div key={l} className="card card-sm" style={{ flex: 1, textAlign: 'center', padding: '8px 4px' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{l}</div>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>{v != null ? (v * 100).toFixed(0) + '%' : '—'}</div>
                      </div>
                    ))}
                  </div>
                  {atPred.weather && (
                    <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-3)', display: 'flex', gap: 12 }}>
                      <span>🌡 {atPred.weather.temperature_2m}°C</span>
                      <span>🌧 {atPred.weather.precipitation} mm</span>
                      <span>☁ {atPred.weather.cloudcover}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 24-hour table */}
          <Next24Table data={next24} loading={next24Loading} />
        </>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}