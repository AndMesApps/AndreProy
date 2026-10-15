import Link from 'next/link';
import { getFacilitador } from '@/lib/auth';
import { db } from '@/lib/supabase/server';
import { UnirseCodigo } from '@/components/juego/unirse-codigo';
import { FormularioReto as FormularioMakigami } from '@/components/makigami/formulario-reto';
import { FormularioSesion as FormularioKaizen } from '@/components/kaizen/formulario-sesion';
import { FormularioReto5S } from '@/components/cincos/formulario-reto-5s';
import { FormularioCaso } from '@/components/mudalab/formulario-caso';
import { FormularioSesion as FormularioRiesgo } from '@/components/riesgo/formulario-sesion';
import { FormularioReto as FormularioMudaGami } from '@/components/mudagami/formulario-reto';
import { formatearFecha } from '@/lib/utils';

export const metadata = { title: 'Juegos' };

const JUEGOS = [
  {
    ruta: '/makigami',
    emoji: '🎯',
    nombre: 'Cacería Makigami',
    para: 'Diagnosticar un proceso',
    que: 'Se dibuja el proceso real paso a paso; los equipos cazan los desperdicios desde el celular, proponen y votan mejoras. Sale el antes y el después del proceso.',
    duracion: '1 a 2 horas',
  },
  {
    ruta: '/kaizen',
    emoji: '🔁',
    nombre: 'Carrera Kaizen',
    para: 'Entrenar la mejora continua',
    que: 'Los equipos producen algo sencillo en rondas cronometradas y mejoran con el ciclo PDCA: 5 porqués, una idea, predicción y estándar. Gana quien mejora con datos.',
    duracion: '1,5 a 2 horas',
  },
  {
    ruta: '/cincos',
    emoji: '🧹',
    nombre: 'Reto 5S — Del caos al flujo',
    para: 'Crear hábitos de orden y limpieza',
    que: 'Cinco misiones de decisiones (clasificar, ordenar, encontrar anomalías, crear el estándar y sostenerlo ante sorpresas) y una misión real con auditoría antes y después.',
    duracion: '2 horas + la misión real',
  },
  {
    ruta: '/mudalab',
    emoji: '🕵️',
    nombre: 'MudaLab — Recuperar el flujo',
    para: 'Resolver problemas con método (DMAIC)',
    que: 'Agencias de detectives resuelven un expediente: definen el caso, van al Gemba con fichas, cazan las 8 Mudas, llegan a la causa raíz, experimentan soluciones con presupuesto y evitan que la Muda regrese. Cierra con un Banco de oportunidades reales.',
    duracion: '2 horas + Mi proceso',
  },
  {
    ruta: '/riesgo',
    emoji: '🗺️',
    nombre: 'La Ruta del Riesgo — SAGRILAFT y SARLAFT',
    para: 'Prevenir riesgos de LA/FT',
    que: 'Ocho retos de decisiones sobre una empresa que crece: detectar señales de alerta, conocer a la contraparte, encontrar al beneficiario final, seguir el dinero, clasificar con semáforo, cartas de evento y escalar según el procedimiento. Certifica Guardianes del Riesgo.',
    duracion: '1,5 a 2 horas (o individual a su ritmo)',
  },
  {
    ruta: '/mudagami',
    emoji: '🚚',
    nombre: 'MudaGami · Kayou — la ruta del transporte',
    para: 'Sentir en carne propia la muda de transporte',
    que: 'Cada equipo produce un lote de piezas en una planta con 6 estaciones fijas y mide cuántas veces tiene que transportar con montacargas o carretilla. Rediseñan su propia planta en 4 minutos y vuelven a producir para ver cuánto mejoraron.',
    duracion: '30 a 45 minutos',
  },
];

/** Tabla donde vive cada juego (todas tienen id, codigo, titulo, estado, created_at). */
const TABLAS: Record<string, string> = {
  '/makigami': 'mk_retos',
  '/kaizen': 'kz_sesiones',
  '/cincos': 's5_sesiones',
  '/mudalab': 'ml_sesiones',
  '/riesgo': 'rr_sesiones',
  '/mudagami': 'mg_retos',
};

/** Todos los juegos de la plataforma en un solo lugar. Pública: no pide contraseña. */
export default async function JuegosPage() {
  const facilitador = await getFacilitador();
  const sb = db();

  // Retos abiertos de los seis juegos, para entrar con un clic.
  const listas = await Promise.all(
    JUEGOS.map(async (j) => {
      const { data } = await sb.from(TABLAS[j.ruta]!).select('id, codigo, titulo, estado, created_at').neq('estado', 'cerrado').order('created_at', { ascending: false }).limit(20);
      return ((data ?? []) as any[]).map((r) => ({ juego: j, codigo: r.codigo as string, titulo: r.titulo as string, fecha: r.created_at as string }));
    }),
  );
  const abiertos = listas.flat().sort((a, b) => b.fecha.localeCompare(a.fecha));

  const FORMULARIOS: Record<string, React.ReactNode> = {
    '/makigami': <FormularioMakigami />,
    '/kaizen': <FormularioKaizen />,
    '/cincos': <FormularioReto5S />,
    '/mudalab': <FormularioCaso />,
    '/riesgo': <FormularioRiesgo />,
    '/mudagami': <FormularioMudaGami />,
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-degradado px-6 py-7 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-widest text-acento">Aprender haciendo</p>
        <h1 className="mt-1 font-display text-3xl font-bold">Juegos</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/85">
          Experiencias por equipos para que las personas descubran la mejora continua tomando decisiones, no respondiendo cuestionarios. Todos se juegan desde el celular con
          un código de 6 letras.
        </p>
        <div className="mt-5">
          <p className="mb-1.5 text-xs font-semibold text-white/80">¿Te dieron un código? Elige el juego y escríbelo:</p>
          <div className="flex flex-wrap gap-4">
            {JUEGOS.map((j) => (
              <div key={j.ruta}>
                <p className="mb-1 text-[11px] text-white/80">
                  {j.emoji} {j.nombre.split(' —')[0]}
                </p>
                <UnirseCodigo rutaJuego={j.ruta} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <section className="card p-5">
        <h2 className="font-display text-xl font-semibold text-secundario">🎟️ Retos abiertos: entra con un clic</h2>
        {abiertos.length === 0 ? (
          <p className="mt-2 text-sm text-marmol-500">Ahora no hay retos abiertos. Si te dieron un código, escríbelo arriba.</p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {abiertos.map((a) => (
              <li key={a.juego.ruta + a.codigo}>
                <Link
                  href={`${a.juego.ruta}/unirse/${a.codigo}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-marmol-200 px-4 py-3 transition hover:border-marca-300 hover:bg-marca-50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-secundario">{a.titulo}</span>
                    <span className="block text-xs text-marmol-500">
                      {a.juego.emoji} {a.juego.nombre.split(' —')[0]} · {formatearFecha(a.fecha)}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-marca-600">Participar →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="card p-5">
        <h2 className="font-display text-xl font-semibold text-secundario">➕ Crear un reto nuevo</h2>
        {facilitador ? (
          <>
            <p className="mt-1 text-sm text-marmol-500">Elige el juego, ponle nombre y comparte el código o el QR desde tu panel.</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {JUEGOS.map((j) => (
                <div key={j.ruta} className="rounded-xl bg-degradado p-4 text-white">
                  <p className="mb-2 text-sm font-semibold">
                    {j.emoji} {j.nombre.split(' —')[0]}
                  </p>
                  {FORMULARIOS[j.ruta]}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-1 text-sm text-marmol-500">
            Para crear un reto necesitas ingresar con tu cuenta de facilitador.{' '}
            <Link href="/ingresar" className="font-semibold text-marca-600 hover:underline">
              Ingresar
            </Link>
          </p>
        )}
      </section>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {JUEGOS.map((j) => (
          <Link key={j.ruta} href={j.ruta} className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-marca-300 hover:shadow-md">
            <p className="text-4xl">{j.emoji}</p>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-marca-600">{j.para}</p>
            <h2 className="font-display text-xl font-semibold text-secundario group-hover:text-marca-600">{j.nombre}</h2>
            <p className="mt-1 flex-1 text-sm text-marmol-500">{j.que}</p>
            <p className="mt-3 text-xs text-marmol-400">⏱ {j.duracion}</p>
            <p className="mt-2 text-sm font-semibold text-marca-600">Entrar →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
