import Link from 'next/link';
import { cn } from '@/lib/utils';

/** Piezas del manual de usuario: secciones, pasos, ejemplos, consejos y preguntas. */

export function Seccion({ id, emoji, titulo, resumen, children }: { id: string; emoji: string; titulo: string; resumen: string; children: React.ReactNode }) {
  return (
    <section id={id} className="card scroll-mt-20 space-y-4 p-5 sm:p-6 print:break-before-page">
      <header className="border-b border-marmol-100 pb-3">
        <h2 className="font-display text-2xl font-bold text-secundario">
          <span className="mr-2">{emoji}</span>
          {titulo}
        </h2>
        <p className="mt-1 text-sm text-marmol-600">{resumen}</p>
      </header>
      {children}
      <p className="no-imprimir text-right text-xs">
        <a href="#indice" className="text-marca-600 hover:underline">
          ↑ Volver al índice
        </a>
      </p>
    </section>
  );
}

export function Sub({ id, titulo, children }: { id?: string; titulo: string; children: React.ReactNode }) {
  return (
    <div id={id} className="scroll-mt-20 space-y-2">
      <h3 className="font-display text-lg font-semibold text-marmol-900">{titulo}</h3>
      <div className="space-y-2 text-sm leading-relaxed text-marmol-700">{children}</div>
    </div>
  );
}

/** Pasos numerados: cada hijo es un paso. */
export function Pasos({ children }: { children: React.ReactNode }) {
  return <ol className="space-y-2 [counter-reset:paso]">{children}</ol>;
}

export function Paso({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 [counter-increment:paso] before:flex before:h-6 before:w-6 before:shrink-0 before:items-center before:justify-center before:rounded-full before:bg-marca-500 before:text-xs before:font-bold before:text-white before:content-[counter(paso)]">
      <div className="min-w-0 flex-1 pt-0.5 text-sm leading-relaxed text-marmol-700">{children}</div>
    </li>
  );
}

const TONOS = {
  ejemplo: { emoji: '📌', titulo: 'Ejemplo', clase: 'border-blue-200 bg-blue-50/70' },
  consejo: { emoji: '💡', titulo: 'Consejo', clase: 'border-marca-200 bg-marca-50/70' },
  ojo: { emoji: '⚠️', titulo: 'Ojo', clase: 'border-amber-200 bg-amber-50/80' },
  idea: { emoji: '🧠', titulo: 'Para entenderlo', clase: 'border-violet-200 bg-violet-50/70' },
} as const;

export function Recuadro({ tipo, titulo, children }: { tipo: keyof typeof TONOS; titulo?: string; children: React.ReactNode }) {
  const t = TONOS[tipo];
  return (
    <div className={cn('rounded-xl border p-3 text-sm leading-relaxed text-marmol-700', t.clase)}>
      <p className="mb-1 font-semibold text-marmol-900">
        {t.emoji} {titulo ?? t.titulo}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

/** Así se ve un botón o una etiqueta de la app, para que la persona lo reconozca. */
export function Boton({ children, tono = 'marca' }: { children: React.ReactNode; tono?: 'marca' | 'blanco' | 'acento' }) {
  return (
    <span
      className={cn(
        'mx-0.5 inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-[12px] font-semibold',
        tono === 'marca' && 'bg-marca-500 text-white',
        tono === 'blanco' && 'border border-marmol-300 bg-white text-secundario',
        tono === 'acento' && 'bg-acento text-secundario',
      )}
    >
      {children}
    </span>
  );
}

export function Pregunta({ p, children }: { p: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-xl border border-marmol-200 p-3 open:bg-marmol-50/60">
      <summary className="cursor-pointer text-sm font-semibold text-marmol-800 marker:text-marca-500">{p}</summary>
      <div className="mt-2 space-y-1.5 text-sm leading-relaxed text-marmol-700">{children}</div>
    </details>
  );
}

export function Ir({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-marca-700 underline decoration-marca-300 underline-offset-2 hover:text-secundario">
      {children}
    </Link>
  );
}

/** Tabla sencilla de dos columnas: término → explicación. */
export function Tabla({ filas, cabeza }: { filas: [React.ReactNode, React.ReactNode][]; cabeza?: [string, string] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        {cabeza && (
          <thead className="text-left text-xs text-marmol-400">
            <tr>
              <th className="py-1.5 pr-3 font-medium">{cabeza[0]}</th>
              <th className="font-medium">{cabeza[1]}</th>
            </tr>
          </thead>
        )}
        <tbody>
          {filas.map(([a, b], i) => (
            <tr key={i} className="border-t border-marmol-100 align-top">
              <td className="whitespace-nowrap py-1.5 pr-3 font-semibold text-marmol-800">{a}</td>
              <td className="py-1.5 text-marmol-700">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
