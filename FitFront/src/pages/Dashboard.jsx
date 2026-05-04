import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Utensils, Dumbbell, Flame, TrendingDown, TrendingUp, Minus, Trash2, AlertCircle } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../auth/AuthContext';

function StatCard({ label, value, unit, color, icon: Icon, sub }) {
  return (
    <div className="card" style={{ flex: 1, minWidth: 140 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
        <Icon size={16} color={color} />
      </div>
      <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700, color }}>
        {value ?? '—'}
        {value != null && <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function fatLabel(balanceKcal) {
  if (Math.abs(balanceKcal) < 50) return null;
  const grams = Math.abs(Math.round(balanceKcal / 7.7)); // 7700 kcal = 1000g
  const lost = balanceKcal > 0;
  return lost ? `≈ ${grams} g de grasa quemada` : `≈ ${grams} g de grasa acumulada`;
}

function BalanceBanner({ balance }) {
  if (balance == null) return null;
  const deficit = balance > 0;
  const neutral = Math.abs(balance) < 50;
  const color = neutral ? 'var(--text-muted)' : deficit ? 'var(--green)' : 'var(--red)';
  const Icon = neutral ? Minus : deficit ? TrendingDown : TrendingUp;
  const msg = neutral ? 'Estás casi en balance' : deficit ? 'Estás en déficit calórico' : 'Estás en superávit calórico';
  const fat = fatLabel(balance);

  return (
    <div className="card" style={{ background: neutral ? 'var(--surface)' : deficit ? 'var(--green-subtle)' : 'var(--red-subtle)', border: `1px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Icon size={28} color={color} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 18, color }}>{msg}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
            Balance de hoy: <strong style={{ color }}>{Math.abs(balance)} kcal {deficit ? 'de déficit' : 'de superávit'}</strong>
          </div>
          {fat && (
            <div style={{ fontSize: 12, color, marginTop: 4, fontWeight: 500 }}>
              {fat}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MacroBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{value}g</span>
      </div>
      <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['summary'],
    queryFn: () => client.get('/fit/logs/summary').then(r => r.data),
    refetchInterval: 60_000,
  });

  async function deleteFood(id) {
    await client.delete(`/fit/logs/food/${id}`);
    refetch();
  }

  async function deleteActivity(id) {
    await client.delete(`/fit/logs/activity/${id}`);
    refetch();
  }

  const profileComplete = data?.user?.profile_complete;
  const totalMacros = (data?.macros?.protein || 0) + (data?.macros?.carbs || 0) + (data?.macros?.fat || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, color: 'var(--text)' }}>Hola, {user?.name?.split(' ')[0]} 👋</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => navigate('/food')}>
            <Utensils size={16} /> Agregar comida
          </button>
          <button className="btn-primary" onClick={() => navigate('/activity')}>
            <Dumbbell size={16} /> Agregar actividad
          </button>
        </div>
      </div>

      {!profileComplete && (
        <div className="card" style={{ background: 'var(--yellow-subtle)', border: '1px solid var(--yellow)', display: 'flex', gap: 12, alignItems: 'center' }}>
          <AlertCircle size={20} color="var(--yellow)" />
          <span style={{ fontSize: 14, color: 'var(--text)' }}>
            Completá tu perfil (peso, altura, edad) para calcular el BMR automáticamente.{' '}
            <button onClick={() => navigate('/profile')} className="link-btn">Ir al perfil →</button>
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Cargando...</div>
      ) : (
        <>
          <BalanceBanner balance={data?.calories?.balance} />

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <StatCard
              label="Ingeridas"
              value={data?.calories?.consumed}
              unit="kcal"
              color="var(--red)"
              icon={Utensils}
              sub="lo que comiste hoy"
            />
            <StatCard
              label="Metabolismo basal"
              value={data?.calories?.burned_bmr_so_far}
              unit="kcal"
              color="var(--text-muted)"
              icon={Flame}
              sub={
                data?.user?.bmr_daily
                  ? `solo por estar vivo (${data.user.bmr_daily} kcal/día total)`
                  : 'completá el perfil para calcularlo'
              }
            />
            <StatCard
              label="Ejercicio"
              value={data?.calories?.burned_activity}
              unit="kcal"
              color="var(--accent)"
              icon={Dumbbell}
              sub="quemadas en actividad física"
            />
            <StatCard
              label="Total quemadas"
              value={data?.calories?.total_burned}
              unit="kcal"
              color="var(--green)"
              icon={TrendingDown}
              sub="metabolismo + ejercicio"
            />
          </div>

          {totalMacros > 0 && (
            <div className="card">
              <h3 style={{ margin: '0 0 16px', fontSize: 15, color: 'var(--text)' }}>Macronutrientes del día</h3>
              <MacroBar label="Proteínas" value={data.macros.protein} total={totalMacros} color="var(--blue)" />
              <MacroBar label="Carbohidratos" value={data.macros.carbs} total={totalMacros} color="var(--yellow)" />
              <MacroBar label="Grasas" value={data.macros.fat} total={totalMacros} color="var(--red)" />
            </div>
          )}

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div className="card" style={{ flex: 1, minWidth: 280 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 15, color: 'var(--text)' }}>Comidas</h3>
                <button className="btn-ghost" onClick={() => navigate('/food')} style={{ fontSize: 13 }}>+ Agregar</button>
              </div>
              {!data?.food_entries?.length ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>No cargaste comidas hoy.</p>
              ) : (
                data.food_entries.map(entry => (
                  <div key={entry.id} style={{ borderBottom: '1px solid var(--border)', padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{entry.raw_description}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {Math.round(entry.total_calories)} kcal · P:{entry.total_protein?.toFixed(1)}g · C:{entry.total_carbs?.toFixed(1)}g · G:{entry.total_fat?.toFixed(1)}g
                        {entry.has_estimates && <span style={{ color: 'var(--yellow)', marginLeft: 6 }}>~ estimado</span>}
                      </div>
                    </div>
                    <button onClick={() => deleteFood(entry.id)} className="btn-ghost icon-btn" style={{ color: 'var(--red)' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="card" style={{ flex: 1, minWidth: 280 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 15, color: 'var(--text)' }}>Actividad física</h3>
                <button className="btn-ghost" onClick={() => navigate('/activity')} style={{ fontSize: 13 }}>+ Agregar</button>
              </div>
              {!data?.activity_entries?.length ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>No cargaste actividad hoy.</p>
              ) : (
                data.activity_entries.map(entry => (
                  <div key={entry.id} style={{ borderBottom: '1px solid var(--border)', padding: '10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{entry.raw_description}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {Math.round(entry.total_calories_burned)} kcal quemadas
                      </div>
                    </div>
                    <button onClick={() => deleteActivity(entry.id)} className="btn-ghost icon-btn" style={{ color: 'var(--red)' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
