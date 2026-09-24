import Link from 'next/link';

export default function Inicio() {
  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-degradado px-6 py-10 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-widest text-acento">Formación en mejora continua</p>
        <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">AndMesApps</h1>
        <p className="mt-2 max-w-xl text-sm text-white/85">Juegos para aprender Lean haciendo: en equipo, con procesos reales y resultados que se ven al instante.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/makigami" className="card group p-5 transition hover:-translate-y-0.5 hover:border-marca-300 hover:shadow-md">
          <p className="text-4xl">🎯</p>
          <h2 className="mt-2 font-display text-xl font-semibold text-secundario group-hover:text-marca-600">Cacería Makigami</h2>
          <p className="mt-1 text-sm text-marmol-500">
            Los equipos recorren un proceso dibujado paso a paso, cazan los desperdicios escondidos y proponen cómo rediseñarlo. Gana el equipo con mejor ojo.
          </p>
          <p className="mt-3 text-sm font-semibold text-marca-600">Entrar al juego →</p>
        </Link>
      </div>
    </div>
  );
}
