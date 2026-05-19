// src/pages/admin/Revenue.js
import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Loading, StatCard, PageHeader, fmtMoney } from '../../components/UI';

export default function AdminRevenue() {
  const [lots,       setLots]       = useState([]);
  const [today,      setToday]      = useState([]);
  const [range,      setRange]      = useState([]);
  const [dateRange,  setDateRange]  = useState({ from: '', to: '' });
  const [loading,    setLoading]    = useState(true);
  const [searching,  setSearching]  = useState(false);
  const [totalToday, setTotalToday] = useState(0);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const lotsData = await api.getLots();
      setLots(lotsData);

      const rows = [];
      let total = 0;

      await Promise.all(lotsData.map(async lot => {
        try {
          const rev = await api.getTodayRevenue(lot.lotId);
          // FIX: getTodayRevenue returns a plain decimal, not { totalRevenue: x }.
          // Number(rev) correctly handles both a raw number and a JSON number.
          const amt = Number(rev) || 0;
          total += amt;
          rows.push({ lotName: lot.name, lotId: lot.lotId, revenue: amt });
        } catch {}
      }));

      setToday(rows);
      setTotalToday(total);
    } catch {}
    finally { setLoading(false); }
  }

  async function searchRange() {
    if (!dateRange.from || !dateRange.to) return;
    setSearching(true);
    try {
      const rows = [];
      await Promise.all(lots.map(async lot => {
        try {
          // getRevenueForDates returns List<TotalRevenueByDayDTO> → [{ day, totalRevenue }]
          // Sum all days in the range for this lot.
          const days = await api.getRevenueForDates(lot.lotId, dateRange.from, dateRange.to);
          const amt  = Array.isArray(days)
            ? days.reduce((a, d) => a + (Number(d.totalRevenue ?? d.TotalRevenue) || 0), 0)
            : 0;
          rows.push({ lotName: lot.name, lotId: lot.lotId, revenue: amt, days: Array.isArray(days) ? days : [] });
        } catch {}
      }));
      setRange(rows);
    } catch {}
    finally { setSearching(false); }
  }

  if (loading) return <Loading />;

  const rangeTotal = range.reduce((a, r) => a + r.revenue, 0);

  // Flatten per-day breakdown for the range report
  const dayBreakdown = range
    .flatMap(r => (r.days || []).map(d => ({ lotName: r.lotName, day: d.day ?? d.Day, revenue: Number(d.totalRevenue ?? d.TotalRevenue) || 0 })))
    .sort((a, b) => (a.day > b.day ? 1 : -1));

  return (
    <div>
      <PageHeader title="Revenue" />

      {/* Today summary */}
      <div className="stat-grid" style={{ marginBottom: 28 }}>
        <StatCard label="Total Today" value={fmtMoney(totalToday)} sub="all lots combined" />
        {today.map(r => (
          <StatCard key={r.lotId} label={r.lotName} value={fmtMoney(r.revenue)} sub="today" />
        ))}
      </div>

      {/* Today's breakdown table */}
      <div className="section-hdr" style={{ marginBottom: 14 }}><h3>Today's Breakdown</h3></div>
      <div className="table-wrap" style={{ marginBottom: 32 }}>
        <table>
          <thead>
            <tr><th>Lot</th><th style={{ textAlign: 'right' }}>Revenue</th></tr>
          </thead>
          <tbody>
            {today.length === 0
              ? <tr><td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 24 }}>No revenue today yet</td></tr>
              : today.map(r => (
                  <tr key={r.lotId}>
                    <td>{r.lotName}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{fmtMoney(r.revenue)}</td>
                  </tr>
                ))
            }
            {today.length > 0 && (
              <tr style={{ borderTop: '2px solid var(--border2)', fontWeight: 600 }}>
                <td>Total</td>
                <td className="mono" style={{ textAlign: 'right' }}>{fmtMoney(totalToday)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Date range report */}
      <div className="section-hdr" style={{ marginBottom: 14 }}><h3>Revenue by Date Range</h3></div>
      <div className="card card-sm" style={{ marginBottom: 20, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, color: 'var(--text-3)' }}>From</label>
          <input className="input" type="date" value={dateRange.from}
            onChange={e => setDateRange(d => ({ ...d, from: e.target.value }))} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, color: 'var(--text-3)' }}>To</label>
          <input className="input" type="date" value={dateRange.to}
            onChange={e => setDateRange(d => ({ ...d, to: e.target.value }))} />
        </div>
        <button className="btn btn-secondary" onClick={searchRange} disabled={searching || !dateRange.from || !dateRange.to}>
          {searching ? 'Searching…' : 'Generate Report'}
        </button>
      </div>

      {range.length > 0 && (
        <>
          {/* Per-lot totals */}
          <div className="table-wrap" style={{ marginBottom: 20 }}>
            <table>
              <thead>
                <tr><th>Lot</th><th style={{ textAlign: 'right' }}>Total Revenue</th></tr>
              </thead>
              <tbody>
                {range.map(r => (
                  <tr key={r.lotId}>
                    <td>{r.lotName}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{fmtMoney(r.revenue)}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '2px solid var(--border2)', fontWeight: 600 }}>
                  <td>Total ({dateRange.from} → {dateRange.to})</td>
                  <td className="mono" style={{ textAlign: 'right' }}>{fmtMoney(rangeTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Per-day breakdown */}
          {dayBreakdown.length > 0 && (
            <>
              <div className="section-hdr" style={{ marginBottom: 14 }}><h3>Daily Breakdown</h3></div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Date</th><th>Lot</th><th style={{ textAlign: 'right' }}>Revenue</th></tr>
                  </thead>
                  <tbody>
                    {dayBreakdown.map((d, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: 12 }}>{d.day}</td>
                        <td>{d.lotName}</td>
                        <td className="mono" style={{ textAlign: 'right' }}>{fmtMoney(d.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}