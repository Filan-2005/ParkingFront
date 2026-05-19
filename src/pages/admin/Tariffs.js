// src/pages/admin/Tariffs.js
import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Loading, Modal, Field, PageHeader, fmtDate, fmtMoney, Icons } from '../../components/UI';

// CreateTariffDTO fields (backend):
//   LotId         int      ← must be integer, not string
//   RatePerH      int      ← whole number, NOT ratePerHour decimal
//   GracePeriod   int      ← minutes, was missing from old form
//   BillingPeriod int      ← minutes, was missing from old form
//   EffectiveFrom DateTime ← must be future, NOT validFrom date string
//   LostTicketFee decimal

function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };
  return { toast, show };
}

const emptyForm = {
  lotId:         '',
  ratePerH:      '',
  gracePeriod:   '0',
  billingPeriod: '60',
  effectiveFrom: '',
  lostTicketFee: '0',
};

export default function AdminTariffs() {
  const [lots,    setLots]    = useState([]);
  const [tariffs, setTariffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const { toast, show } = useToast();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const lotsData = await api.getLots();
      setLots(lotsData);
      const rows = [];
      await Promise.all(lotsData.map(async lot => {
        try {
          const all = await api.getTariffsForLot(lot.lotId);
          if (Array.isArray(all)) all.forEach(t => rows.push({ ...t, lotName: lot.name }));
        } catch {}
      }));
      setTariffs(rows);
    } catch {}
    finally { setLoading(false); }
  }

  async function saveTariff() {
    if (!form.lotId)         { show('Please select a lot', 'error');             return; }
    if (!form.ratePerH)      { show('Rate per period is required', 'error');     return; }
    if (!form.billingPeriod) { show('Billing period is required', 'error');      return; }
    if (!form.effectiveFrom) { show('Effective from date is required', 'error'); return; }

    try {
      const body = {
        // parseInt ensures we send 1, not "1" — backend int can't deserialize a JSON string
        lotId:         parseInt(form.lotId,         10),
        ratePerH:      parseInt(form.ratePerH,      10),
        gracePeriod:   parseInt(form.gracePeriod,   10),
        billingPeriod: parseInt(form.billingPeriod, 10),
        lostTicketFee: parseFloat(form.lostTicketFee || '0'),
        // EffectiveFrom must be a future ISO DateTime, not just a date string.
        // T00:01 ensures it's at least 1 minute into that day so it passes
        // the backend's "must be in the future" validation.
        effectiveFrom: new Date(form.effectiveFrom + 'T00:01').toISOString(),
      };
      await api.createTariff(body);
      show('Tariff created');
      setModal(false);
      load();
    } catch (e) { show(e.message, 'error'); }
  }

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Tariffs"
        action={
          <button className="btn btn-primary btn-sm" onClick={() => { setForm(emptyForm); setModal(true); }}>
            <Icons.Plus /> New Tariff
          </button>
        }
      />

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Lot</th>
              <th>Rate / period</th>
              <th>Billing period</th>
              <th>Grace period</th>
              <th>Lost fee</th>
              <th>Effective from</th>
            </tr>
          </thead>
          <tbody>
            {tariffs.length === 0
              ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 32 }}>No tariffs configured</td></tr>
              : tariffs.map((t, i) => (
                  <tr key={t.tariffId ?? i}>
                    <td>{t.lotName}</td>
                    <td className="mono">{fmtMoney(t.ratePerH)}</td>
                    <td>{t.billingPeriod} min</td>
                    <td>{t.gracePeriod} min</td>
                    <td className="mono">{fmtMoney(t.lostTicketFee)}</td>
                    <td style={{ fontSize: 12 }}>{fmtDate(t.effectiveFrom)}</td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal
          title="Create Tariff"
          onClose={() => setModal(false)}
          actions={
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={saveTariff}>Save Tariff</button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <Field label="Parking Lot">
              <select
                className="select"
                value={form.lotId}
                onChange={e => setForm(f => ({ ...f, lotId: e.target.value }))}
              >
                <option value="">Select lot…</option>
                {lots.map(l => <option key={l.lotId} value={l.lotId}>{l.name}</option>)}
              </select>
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Rate per billing period (L)">
                <input
                  className="input" type="number" min="1" step="1"
                  value={form.ratePerH}
                  onChange={e => setForm(f => ({ ...f, ratePerH: e.target.value }))}
                  placeholder="e.g. 2"
                />
              </Field>
              <Field label="Lost ticket fee (L)">
                <input
                  className="input" type="number" min="0" step="0.01"
                  value={form.lostTicketFee}
                  onChange={e => setForm(f => ({ ...f, lostTicketFee: e.target.value }))}
                  placeholder="e.g. 20"
                />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Billing period (minutes)">
                <input
                  className="input" type="number" min="1" step="1"
                  value={form.billingPeriod}
                  onChange={e => setForm(f => ({ ...f, billingPeriod: e.target.value }))}
                  placeholder="e.g. 60"
                />
              </Field>
              <Field label="Grace period (minutes)">
                <input
                  className="input" type="number" min="0" step="1"
                  value={form.gracePeriod}
                  onChange={e => setForm(f => ({ ...f, gracePeriod: e.target.value }))}
                  placeholder="e.g. 0"
                />
              </Field>
            </div>

            <Field label="Effective from (must be a future date)">
              <input
                className="input" type="date"
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                value={form.effectiveFrom}
                onChange={e => setForm(f => ({ ...f, effectiveFrom: e.target.value }))}
              />
            </Field>

          </div>
        </Modal>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}