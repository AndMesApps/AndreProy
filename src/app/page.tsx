import Link from 'next/link';
import { getFacilitador } from '@/lib/auth';

const JUEGOS = [
  {
    ruta: '/makigami',
    emoji: '🎯',
    nombre: 'Cacería Makigami',
    uso: 'Diagnosticar',
    descripcion: 'Los equipos recorren un proceso dibujado paso a paso, cazan los desperdicios escondidos y proponen cómo rediseñarlo. Gana el equipo con mejor ojo.',
  },
  {
    ruta: '/kaizen',
    emoji: '🔁',
    nombre: 'Carrera Kaizen',
    uso: 'Mejorar',
    descripcion: 'Rondas cronometradas donde cada equipo busca la causa de sus problemas, prueba una mejora y predice el resultado. Gana quien mejora de verdad, con datos.',
  },
];

export default async function Inicio() {
  const facilitador = await getFacilitador();
  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-degradado px-6 py-10 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-widest text-acento">Formación y control en mejora continua</p>
        <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">AndMesApps</h1>
        <p className="mt-2 max-w-xl text-sm text-white/85">
          Juegos para aprender Lean haciendo, en equipo y con procesos reales, y un control de procesos para que las mejoras se sostengan en el tiempo.
        </p>
        {facilitador && (
          <Link href="/panel" className="mt-5 inline-flex rounded-lg bg-acento px-4 py-2 text-sm font-bold text-secundario shadow hover:brightness-105">
            🧭 Ir a mi panel
          </Link>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {JUEGOS.map((j) => (
          <Link key={j.ruta} href={j.ruta} className="card group p-5 transition hover:-translate-y-0.5 hover:border-marca-300 hover:shadow-md">
            <p className="text-4xl">{j.emoji}</p>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-marca-600">{j.uso}</p>
            <h2 className="font-display text-xl font-semibold text-secundario group-hover:text-marca-600">{j.nombre}</h2>
            <p className="mt-1 text-sm text-marmol-500">{j.descripcion}</p>
            <p className="mt-3 text-sm font-semibold text-marca-600">Entrar al juego →</p>
          </Link>
        ))}
      </div>

      <div className="card flex flex-wrap items-center gap-4 p-5">
        <p className="text-4xl">📊</p>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-marca-600">Sostener</p>
          <h2 className="font-display text-xl font-semibold text-secundario">Control de procesos</h2>
          <p className="mt-1 text-sm text-marmol-500">
            Cada proceso con su indicador, su meta y su plan de acción. Las mejoras que salen de los juegos llegan aquí para medirlas y no perderlas.
          </p>
        </div>
        {facilitador ? (
          <Link href="/procesos" className="boton">
            Abrir el control
          </Link>
        ) : (
          <Link href="/ingresar" className="boton-secundario">
            Soy facilitador
          </Link>
        )}
      </div>
    </div>
  );
}
