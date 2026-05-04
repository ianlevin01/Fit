import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TrendingDown, TrendingUp, Minus, Calendar, ChevronDown, ChevronUp, ImagePlus, Trash2, Loader2 } from 'lucide-react';
import client from '../api/client';

function isoToday() {
  return new Date().toLocaleDateString('en-CA');
}

function iso30DaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 29);
  return d.toLocaleDateString('en-CA');
}

function fmt(n) {
  return n >= 0 ? `+${n}` : `${n}`;
}

function BalanceChip({ value }) {
  const deficit = value > 0;
  const neutral = Math.abs(value) < 50;
  const color = neutral ? 'var(--text-muted)' : deficit ? 'var(--green)' : 'var(--red)';
  const Icon = neutral ? Minus : deficit ? TrendingDown : TrendingUp;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color, fontWeight: 600, fontSize: 13 }}>
      <Icon size={13} /> {fmt(value)} kcal
    </span>
  );
}

function SummaryCard({ label, value, unit, color, sub }) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 130 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>
        {value != null ? value : '—'}
        {value != null && <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function DayImage({ date }) {
  const qc = useQueryClient();
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const { data } = useQuery({
    queryKey: ['day-image', date],
    queryFn: () => client.get(`/fit/images/check/${date}`).then(r => r.data),
  });

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('image', file);
    try {
      await client.post(`/fit/images/${date}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      qc.invalidateQueries({ queryKey: ['day-image', date] });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleDelete() {
    await client.delete(`/fit/images/${date}`);
    qc.invalidateQueries({ queryKey: ['day-image', date] });
  }

  return (
    <div style={{ marginTop: 12 }}>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />

      {data?.exists ? (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <img
            src={data.url}
            alt="foto del día"
            onClick={() => setLightbox(true)}
            style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8, cursor: 'zoom-in', border: '1px solid var(--border)' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => fileRef.current.click()} disabled={uploading}>
              {uploading ? <Loader2 size={12} className="spin" /> : <ImagePlus size={12} />} Cambiar
            </button>
            <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 8px', color: 'var(--red)' }} onClick={handleDelete}>
              <Trash2 size={12} /> Borrar
            </button>
          </div>
        </div>
      ) : (
        <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => fileRef.current.click()} disabled={uploading}>
          {uploading ? <><Loader2 size={12} className="spin" /> Subiendo...</> : <><ImagePlus size={12} /> Adjuntar foto</>}
        </button>
      )}

      {lightbox && (
        <div
          onClick={() => setLightbox(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out',
          }}
        >
          <img src={data.url} alt="foto del día" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8 }} />
        </div>
      )}
    </div>
  );
}

function DayRow({ day }) {
  const [open, setOpen] = useState(false);
  const deficit = day.balance > 0;
  const neutral = Math.abs(day.balance) < 50;
  const rowColor = neutral ? 'transparent' : deficit ? 'rgba(34,197,94,0.04)' : 'rgba(239,68,68,0.04)';

  return (
    <>
      <tr onClick={() => setOpen(o => !o)} style={{ background: rowColor, cursor: 'pointer' }}>
        <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
          {new Date(day.date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
        </td>
        <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--red)', textAlign: 'right' }}>{day.consumed}</td>
        <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--green)', textAlign: 'right' }}>{day.total_burned}</td>
        <td style={{ padding: '10px 12px', textAlign: 'right' }}><BalanceChip value={day.balance} /></td>
        <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </td>
      </tr>
      {open && (
        <tr style={{ background: 'var(--surface-alt)' }}>
          <td colSpan={5} style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
              <span>BMR: <strong style={{ color: 'var(--text)' }}>{day.bmr} kcal</strong></span>
              <span>Ejercicio: <strong style={{ color: 'var(--accent)' }}>{day.burned_activity} kcal</strong></span>
              <span>Proteínas: <strong style={{ color: 'var(--blue)' }}>{day.protein}g</strong></span>
              <span>Carbos: <strong style={{ color: 'var(--yellow)' }}>{day.carbs}g</strong></span>
              <span>Grasas: <strong style={{ color: 'var(--red)' }}>{day.fat}g</strong></span>
            </div>
            <DayImage date={day.date} />
          </td>
        </tr>
      )}
    </>
  );
}

export default function History() {
  const [from, setFrom] = useState(iso30DaysAgo());
  const [to, setTo] = useState(isoToday());
  const [applied, setApplied] = useState({ from: iso30DaysAgo(), to: isoToday() });

  const { data, isLoading, error } = useQuery({
    queryKey: ['history', applied.from, applied.to],
    queryFn: () => client.get(`/fit/logs/history?from=${applied.from}&to=${applied.to}`).then(r => r.data),
  });

  const t = data?.totals;
  const balanceColor = !t ? 'var(--text)' : t.total_balance > 0 ? 'var(--green)' : t.total_balance < 0 ? 'var(--red)' : 'var(--text-muted)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 20, color: 'var(--text)' }}>Historial</h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Evolución calórica por período</p>
      </div>

      <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="field" style={{ margin: 0, flex: 1, minWidth: 140 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={13} /> Desde</label>
          <input className="input" type="date" value={from} max={to} onChange={e => setFrom(e.target.value)} />
        </div>
        <div className="field" style={{ margin: 0, flex: 1, minWidth: 140 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={13} /> Hasta</label>
          <input className="input" type="date" value={to} min={from} max={isoToday()} onChange={e => setTo(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={() => setApplied({ from, to })}>Filtrar</button>
      </div>

      {isLoading && <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Cargando...</div>}
      {error && <div className="card" style={{ color: 'var(--red)' }}>{error.message}</div>}

      {data && (
        <>
          {t.days_with_data === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
              No hay datos en ese período.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <SummaryCard
                  label="Balance total del período"
                  value={fmt(t.total_balance)}
                  unit="kcal"
                  color={balanceColor}
                  sub={t.total_balance > 0 ? 'déficit acumulado' : t.total_balance < 0 ? 'superávit acumulado' : 'en equilibrio'}
                />
                <SummaryCard label="Promedio diario ingerido" value={t.avg_consumed} unit="kcal" color="var(--red)" sub={`total: ${t.total_consumed} kcal`} />
                <SummaryCard label="Promedio diario quemado" value={t.avg_burned} unit="kcal" color="var(--green)" sub={`total: ${t.total_burned} kcal`} />
                <SummaryCard label="Días con datos" value={t.days_with_data} unit="días" color="var(--text-muted)" />
              </div>

              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Detalle por día</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>click en una fila para ver macros y adjuntar foto</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-alt)' }}>
                      <th style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-muted)', textAlign: 'left', fontWeight: 500 }}>Fecha</th>
                      <th style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', fontWeight: 500 }}>Ingeridas</th>
                      <th style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', fontWeight: 500 }}>Quemadas</th>
                      <th style={{ padding: '8px 12px', fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', fontWeight: 500 }}>Balance</th>
                      <th style={{ width: 32 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {data.days.map(day => <DayRow key={day.date} day={day} />)}
                  </tbody>
                </table>

                <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', background: 'var(--surface-alt)', display: 'flex', gap: 24, fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>Prom. proteínas: <strong style={{ color: 'var(--blue)' }}>{t.avg_protein}g</strong></span>
                  <span>Prom. carbos: <strong style={{ color: 'var(--yellow)' }}>{t.avg_carbs}g</strong></span>
                  <span>Prom. grasas: <strong style={{ color: 'var(--red)' }}>{t.avg_fat}g</strong></span>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
