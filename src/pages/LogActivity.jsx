import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ChevronRight, Check, Flame, ArrowLeft, Clock } from 'lucide-react';
import client from '../api/client';

const STEPS = { INPUT: 'input', CONFIRM: 'confirm', DONE: 'done' };

export default function LogActivity() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.INPUT);
  const [description, setDescription] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAnalyze() {
    if (!description.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await client.post('/fit/logs/activity/analyze', { description });
      setResult(data);
      setStep(STEPS.CONFIRM);
    } catch (e) {
      setError(e.response?.data?.error || 'Error al analizar la actividad');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setLoading(true);
    setError('');
    try {
      await client.post('/fit/logs/activity/save', {
        raw_description: description,
        activities: result.activities,
        total_calories_burned: result.total_calories_burned,
        calculation_notes: result.calculation_notes,
      });
      setStep(STEPS.DONE);
    } catch (e) {
      setError(e.response?.data?.error || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  if (step === STEPS.DONE) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 48, gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={32} color="var(--accent)" />
        </div>
        <h2 style={{ margin: 0, color: 'var(--text)' }}>¡Actividad registrada!</h2>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Las calorías quemadas fueron calculadas y guardadas.</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-secondary" onClick={() => { setStep(STEPS.INPUT); setDescription(''); setResult(null); }}>
            Cargar otra actividad
          </button>
          <button className="btn-primary" onClick={() => navigate('/')}>Ver dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        {step === STEPS.CONFIRM && (
          <button className="btn-ghost icon-btn" onClick={() => setStep(STEPS.INPUT)}>
            <ArrowLeft size={18} />
          </button>
        )}
        <div>
          <h1 style={{ margin: 0, fontSize: 20, color: 'var(--text)' }}>Registrar actividad</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            {step === STEPS.INPUT ? 'Describí qué hiciste con tus palabras' : 'Revisá el cálculo de calorías'}
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--red-subtle)', border: '1px solid var(--red)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 14, color: 'var(--red)' }}>
          {error}
        </div>
      )}

      {step === STEPS.INPUT && (
        <div className="card">
          <textarea
            className="input"
            style={{ width: '100%', minHeight: 120, resize: 'vertical', fontFamily: 'inherit' }}
            placeholder="Ej: Caminé 20 cuadras, fui al gimnasio 1 hora e hice press banca, press inclinado y bicicleta (la máquina marcó 250 kcal)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAnalyze(); }}
          />
          <p style={{ margin: '8px 0 12px', fontSize: 12, color: 'var(--text-muted)' }}>
            Podés mencionar cuánto duró cada actividad, o si una máquina te marcó las calorías.
          </p>
          <button
            className="btn-primary"
            style={{ width: '100%' }}
            onClick={handleAnalyze}
            disabled={loading || !description.trim()}
          >
            {loading ? <><Loader2 size={16} className="spin" /> Calculando...</> : <>Calcular calorías <ChevronRight size={16} /></>}
          </button>
        </div>
      )}

      {step === STEPS.CONFIRM && result && (
        <>
          <div className="card" style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent)', marginBottom: 16, textAlign: 'center' }}>
            <Flame size={28} color="var(--accent)" style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--accent)' }}>{Math.round(result.total_calories_burned)}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>calorías quemadas</div>
          </div>

          {result.activities.map((act, i) => (
            <div key={i} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{act.name}</div>
                  {act.description && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{act.description}</div>}
                  {act.notes && <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4 }}>{act.notes}</div>}
                </div>
                <div style={{ textAlign: 'right', marginLeft: 16, flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>{Math.round(act.calories_burned)} kcal</div>
                  {act.duration_minutes && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 2 }}>
                      <Clock size={12} /> {act.duration_minutes} min
                    </div>
                  )}
                  {act.from_machine && (
                    <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 2 }}>desde máquina</div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {result.calculation_notes && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 12px', background: 'var(--surface-alt)', borderRadius: 8, marginBottom: 16 }}>
              {result.calculation_notes}
            </div>
          )}

          <button className="btn-primary" style={{ width: '100%' }} onClick={handleSave} disabled={loading}>
            {loading ? <><Loader2 size={16} className="spin" /> Guardando...</> : 'Confirmar y guardar'}
          </button>
        </>
      )}
    </div>
  );
}
