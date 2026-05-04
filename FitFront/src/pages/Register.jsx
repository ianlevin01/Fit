import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, Loader2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useState } from 'react';

export default function Register() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { isSubmitting }, watch } = useForm();
  const password = watch('password');

  async function onSubmit({ name, email, password }) {
    setError('');
    try {
      await authRegister(name, email, password);
      navigate('/profile');
    } catch (e) {
      setError(e.response?.data?.error || 'Error al registrarse');
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Flame size={40} color="var(--accent)" style={{ marginBottom: 8 }} />
          <h1 style={{ margin: 0, fontSize: 28, color: 'var(--text)' }}>FitTracker</h1>
          <p style={{ margin: '8px 0 0', color: 'var(--text-muted)' }}>Creá tu cuenta gratis</p>
        </div>

        <div className="card">
          {error && (
            <div style={{ background: 'var(--red-subtle)', border: '1px solid var(--red)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 14, color: 'var(--red)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="field">
              <label>Nombre</label>
              <input className="input" {...register('name', { required: true })} placeholder="Tu nombre" />
            </div>
            <div className="field">
              <label>Email</label>
              <input className="input" type="email" {...register('email', { required: true })} />
            </div>
            <div className="field">
              <label>Contraseña</label>
              <input className="input" type="password" {...register('password', { required: true, minLength: 6 })} />
            </div>
            <div className="field">
              <label>Confirmar contraseña</label>
              <input
                className="input"
                type="password"
                {...register('confirm', {
                  required: true,
                  validate: v => v === password || 'Las contraseñas no coinciden',
                })}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 size={16} className="spin" /> Creando cuenta...</> : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-muted)' }}>
          ¿Ya tenés cuenta? <Link to="/login" style={{ color: 'var(--accent)' }}>Iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
