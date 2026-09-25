import Link from 'next/link';
import { UnirseCodigo } from '@/components/juego/unirse-codigo';

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
];

/** Todos los juegos de la plataforma en un solo lugar. */
export default function JuegosPage() {
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
      <div className="grid gap-4 md:grid-cols-3">
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
