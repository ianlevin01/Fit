import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ChevronRight, Check, HelpCircle, ArrowLeft } from 'lucide-react';
import client from '../api/client';

const STEPS = { INPUT: 'input', FORM: 'form', SAVING: 'saving', DONE: 'done' };

function NutritionField({ field, itemId, values, onChange }) {
  const key = `${itemId}_${field.field}`;
  const unknown = values[`${key}_unknown`] || false;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <label style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
          {field.label} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>cada {field.per_amount}{field.per_unit}</span>
        </label>
        <button
          type="button"
          onClick={() => onChange(`${key}_unknown`, !unknown)}
          style={{ fontSize: 12, color: unknown ? 'var(--accent)' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <HelpCircle size={13} /> {unknown ? 'Lo sé' : 'No sé'}
        </button>
      </div>
      {unknown ? (
        <div style={{ fontSize: 12, color: 'var(--accent)', background: 'var(--accent-subtle)', padding: '6px 10px', borderRadius: 6 }}>
          La IA estimará: <strong>{field.ai_default} {field.unit}</strong> {field.per_unit ? `cada ${field.per_amount}${field.per_unit}` : ''}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="number"
            className="input"
            style={{ flex: 1 }}
            placeholder={`Ej: ${field.ai_default}`}
            value={values[key] ?? ''}
            onChange={e => onChange(key, e.target.value)}
          />
          <span style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{field.unit}</span>
        </div>
      )}
    </div>
  );
}

function FoodItemForm({ item, values, onChange }) {
  const qKey = `${item.id}_qty`;
  const qUnknown = values[`${qKey}_unknown`] || false;

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h3 style={{ margin: '0 0 4px', fontSize: 16, color: 'var(--text)' }}>{item.name}</h3>
      {item.parsed_info && (
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-muted)' }}>{item.parsed_info}</p>
      )}

      <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            {item.quantity_field.label}
          </label>
          <button
            type="button"
            onClick={() => onChange(`${qKey}_unknown`, !qUnknown)}
            style={{ fontSize: 12, color: qUnknown ? 'var(--accent)' : 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <HelpCircle size={13} /> {qUnknown ? 'Lo sé' : 'No sé'}
          </button>
        </div>
        {qUnknown ? (
          <div style={{ fontSize: 12, color: 'var(--accent)', background: 'var(--accent-subtle)', padding: '6px 10px', borderRadius: 6 }}>
            La IA estimará: <strong>{item.quantity_field.ai_default} {item.quantity_field.unit}</strong>
            {item.quantity_field.hint && <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>({item.quantity_field.hint})</span>}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="number"
              className="input"
              style={{ flex: 1 }}
              placeholder={String(item.quantity_field.ai_default)}
              value={values[qKey] ?? (item.quantity_field.value ?? '')}
              onChange={e => onChange(qKey, e.target.value)}
            />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.quantity_field.unit}</span>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 4 }}>
        <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Datos nutricionales (podés dejar los que no sabés)</p>
        {item.nutrition_fields.map(field => (
          <NutritionField key={field.field} field={field} itemId={item.id} values={values} onChange={onChange} />
        ))}
      </div>
    </div>
  );
}

export default function LogFood() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.INPUT);
  const [description, setDescription] = useState('');
  const [foodItems, setFoodItems] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function setField(key, value) {
    setFormValues(prev => ({ ...prev, [key]: value }));
  }

  async function handleAnalyze() {
    if (!description.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await client.post('/fit/logs/food/analyze', { description });
      setFoodItems(data.food_items);
      setStep(STEPS.FORM);
    } catch (e) {
      setError(e.response?.data?.error || 'Error al analizar la comida');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setLoading(true);
    setError('');
    try {
      const enrichedItems = foodItems.map(item => {
        const qKey = `${item.id}_qty`;
        const qUnknown = formValues[`${qKey}_unknown`];
        const quantityValue = qUnknown ? null : (formValues[qKey] !== undefined ? parseFloat(formValues[qKey]) : null);

        const nutrition_fields = item.nutrition_fields.map(field => {
          const key = `${item.id}_${field.field}`;
          const unknown = formValues[`${key}_unknown`];
          const rawVal = formValues[key];
          return {
            ...field,
            value: unknown ? null : (rawVal !== undefined && rawVal !== '' ? parseFloat(rawVal) : null),
          };
        });

        return {
          ...item,
          quantity_field: {
            ...item.quantity_field,
            value: quantityValue,
          },
          nutrition_fields,
        };
      });

      await client.post('/fit/logs/food/save', { raw_description: description, food_items: enrichedItems });
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
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--green-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={32} color="var(--green)" />
        </div>
        <h2 style={{ margin: 0, color: 'var(--text)' }}>¡Comida registrada!</h2>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Los macros fueron calculados y guardados.</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-secondary" onClick={() => { setStep(STEPS.INPUT); setDescription(''); setFoodItems([]); setFormValues({}); }}>
            Cargar otra comida
          </button>
          <button className="btn-primary" onClick={() => navigate('/')}>Ver dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        {step === STEPS.FORM && (
          <button className="btn-ghost icon-btn" onClick={() => setStep(STEPS.INPUT)}>
            <ArrowLeft size={18} />
          </button>
        )}
        <div>
          <h1 style={{ margin: 0, fontSize: 20, color: 'var(--text)' }}>Registrar comida</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            {step === STEPS.INPUT ? 'Describí lo que comiste con tus palabras' : 'Completá los datos (o marcá "No sé" para estimar)'}
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
            placeholder="Ej: Comí dos tostadas con queso crema, una milanesa de pollo y una factura"
            value={description}
            onChange={e => setDescription(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAnalyze(); }}
          />
          <button
            className="btn-primary"
            style={{ width: '100%', marginTop: 12 }}
            onClick={handleAnalyze}
            disabled={loading || !description.trim()}
          >
            {loading ? <><Loader2 size={16} className="spin" /> Analizando...</> : <>Analizar con IA <ChevronRight size={16} /></>}
          </button>
        </div>
      )}

      {step === STEPS.FORM && (
        <>
          {foodItems.map(item => (
            <FoodItemForm key={item.id} item={item} values={formValues} onChange={setField} />
          ))}
          <button
            className="btn-primary"
            style={{ width: '100%', marginTop: 4 }}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? <><Loader2 size={16} className="spin" /> Calculando y guardando...</> : <>Guardar y calcular macros</>}
          </button>
        </>
      )}
    </div>
  );
}
