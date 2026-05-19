// src/pages/attendant/Dashboard.js
import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { StatCard, Loading, TicketBadge, fmtDate } from '../../components/UI';

export default function AttendantDashboard() {
  const [lots,    setLots]    = useState([]);
  const [tickets, setTickets] = useState([]);
  const [stats,   setStats]   = useState({ open: 0, free: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const lotsData = await api.getLots();
      setLots(lotsData);
      let open = 0, free = 0;
      const allOpen = [];
      await Promise.all(lotsData.map(async lot => {
        try {
          const [openT, count] = await Promise.all([
            api.getOpenTickets(lot.lotId).catch(() => []),
            api.getLotCount(lot.lotId).catch(() => null),
          ]);
          if (Array.isArray(openT)) { open += openT.length; openT.forEach(t => allOpen.push({ ...t, lotName: lot.name })); }
          // FIX: was reading count.freeCount which doesn't exist.
          // Backend CountLotAvilability DTO uses "available".
          if (count) free += count.available ?? count.Available ?? 0;
        } catch {}
      }));
      setStats({ open, free });
      setTickets(allOpen.slice(0, 8));
    } catch {}
    finally { setLoading(false); }
  }

  if (loading) return <Loading />;

  return (
    <div>
      <div className="stat-grid">
        <StatCard label="Open Tickets" value={stats.open} sub="vehicles inside" />
        <StatCard label="Free Spots"   value={stats.free} sub="available now" />
        <StatCard label="Lots"         value={lots.length} sub="facilities" />
      </div>

      <div className="section-hdr" style={{ marginBottom: 14 }}><h3>Active Tickets</h3></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Plate</th><th>Spot</th><th>Lot</th><th>Entry</th><th>Status</th></tr></thead>
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