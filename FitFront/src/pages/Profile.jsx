import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Check, Loader2, User } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

const GENDERS = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
  { value: 'other', label: 'Otro' },
];

const TIMEZONES = [
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3)' },
  { value: 'America/New_York', label: 'New York (GMT-5)' },
  { value: 'Europe/Madrid', label: 'Madrid (GMT+1/+2)' },
];

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      name: user?.name || '',
      gender: user?.gender || '',
      weight_kg: user?.weight_kg || '',
      height_cm: user?.height_cm || '',
      age: user?.age || '',
      wake_hour: user?.wake_hour ?? 7,
      sleep_hour: user?.sleep_hour ?? 23,
      timezone: user?.timezone || 'America/Argentina/Buenos_Aires',
    },
  });

  async function onSubmit(data) {
    const clean = {
      ...data,
      weight_kg: data.weight_kg ? parseFloat(data.weight_kg) : null,
      height_cm: data.height_cm ? parseFloat(data.height_cm) : null,
      age: data.age ? parseInt(data.age) : null,
      wake_hour: parseInt(data.wake_hour),
      sleep_hour: parseInt(data.sleep_hour),
    };
    await updateProfile(clean);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={20} color="var(--accent)" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, color: 'var(--text)' }}>Mi perfil</h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Estos datos se usan para calcular tu BMR y los macros</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Datos personales</h3>

          <div className="field">
            <label>Nombre</label>
            <input className="input" {...register('name')} />
          </div>

          <div className="field">
            <label>Género</label>
            <select className="input" {...register('gender')}>
              <option value="">— Seleccionar —</option>
              {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Peso (kg)</label>
              <input className="input" type="number" step="0.1" min="0" {...register('weight_kg')} placeholder="Ej: 75" />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Altura (cm)</label>
              <input className="input" type="number" min="0" {...register('height_cm')} placeholder="Ej: 175" />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Edad</label>
              <input className="input" type="number" min="0" {...register('age')} placeholder="Ej: 25" />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Horarios</h3>
          <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--text-muted)' }}>
            Se usan para pro-ratear el BMR según las horas transcurridas del día
          </p>

          <div style={{ display: 'flex', gap: 12 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Me despierto a las</label>
              <input className="input" type="number" min="0" max="23" {...register('wake_hour')} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Me duermo a las</label>
              <input className="input" type="number" min="0" max="23" {...register('sleep_hour')} />
            </div>
          </div>

          <div className="field">
            <label>Zona horaria</label>
            <select className="input" {...register('timezone')}>
              {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
            </select>
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 size={16} className="spin" /> Guardando...</> : saved ? <><Check size={16} /> Guardado</> : 'Guardar perfil'}
        </button>
      </form>
    </div>
  );
}
