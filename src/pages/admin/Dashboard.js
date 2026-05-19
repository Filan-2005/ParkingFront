// src/pages/admin/Dashboard.js
import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { StatCard, Loading, TicketBadge, fmtDate, fmtMoney } from '../../components/UI';

export default function AdminDashboard() {
  const [lots,     setLots]     = useState([]);
  const [tickets,  setTickets]  = useState([]);
  const [stats,    setStats]    = useState({ open: 0, free: 0, revenue: 0 });
  const [lotStats, setLotStats] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const lotsData = await api.getLots();
      setLots(lotsData);

      let open = 0, free = 0, revenue = 0;
      const allOpen = [];
      const perLot  = [];

      await Promise.all(lotsData.map(async lot => {
        try {
          const [openT, count, rev] = await Promise.all([
            api.getOpenTickets(lot.lotId).catch(() => []),
            api.getLotCount(lot.lotId).catch(() => null),
            api.getTodayRevenue(lot.lotId).catch(() => 0),
          ]);

          const lotOpen = Array.isArray(openT) ? openT.length : 0;
          const lotFree = count?.available ?? count?.Available ?? 0;
          // FIX: getTodayRevenue returns a plain decimal, not an object.
          // Reading .totalRevenue off a number gives undefined → 0.
          // Cast directly to a number instead.
          const lotRev  = Number(rev) || 0;

          open    += lotOpen;
          free    += lotFree;
          revenue += lotRev;

          if (Array.isArray(openT)) {
            openT.forEach(t => allOpen.push({ ...t, lotName: lot.name }));
          }

          perLot.push({ lotId: lot.lotId, name: lot.name, open: lotOpen, free: lotFree, revenue: lotRev });
        } catch {}
      }));

      setStats({ open, free, revenue });
      setTickets(allOpen.slice(0, 8));
      setLotStats(perLot);
    } catch {}
    finally { setLoading(false); }
  }

  if (loading) return <Loading />;

  return (
    <div>
      <div className="stat-grid">
        <StatCard label="Today's Revenue" value={fmtMoney(stats.revenue)} sub="all lots combined" />
        <StatCard label="Open Tickets"    value={stats.open}              sub="vehicles inside" />
        <StatCard label="Free Spots"      value={stats.free}              sub="available now" />
        <StatCard label="Lots"            value={lots.length}             sub="facilities" />
      </div>

      <div className="section-hdr" style={{ marginBottom: 14, marginTop: 8 }}><h3>Lot Summary</h3></div>
      <div className="table-wrap" style={{ marginBottom: 28 }}>
        <table>
          <thead>
            <tr><th>Lot</th><th>Open Tickets</th><th>Free Spots</th><th style={{ textAlign: 'right' }}>Revenue Today</th></tr>
          </thead>
          <tbody>
            {lotStats.length === 0
              ? <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 28 }}>No data</td></tr>
              : lotStats.map(l => (
                  <tr key={l.lotId}>
                    <td style={{ fontWeight: 500 }}>{l.name}</td>
                    <td>{l.open}</td>
                    <td>{l.free}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{fmtMoney(l.revenue)}</td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      <div className="section-hdr" style={{ marginBottom: 14 }}><h3>Active Tickets</h3></div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>ID</th><th>Plate</th><th>Spot</th><th>Lot</th><th>Entry</th><th>Status</th></tr>
          </thead>
          <tbody>
            {tickets.length === 0
              ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 28 }}>No open tickets</td></tr>
              : tickets.map(t => (
                  <tr key={t.ticketId}>
                    <td className="mono">#{t.ticketId}</td>
                    <td className="mono">{t.plate}</td>
                    <td>{t.spotHrCode || t.hrCode || '—'}</td>
                    <td>{t.lotName}</td>
                    <td style={{ fontSize: 12 }}>{fmtDate(t.entry)}</td>
                    <td><TicketBadge status={t.status} /></td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}