import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { formatearFecha } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { BotonImprimir } from './boton-imprimir';

/** Encabezado común de los informes: marca, título, datos clave y botones (que no se imprimen). */
export function EncabezadoInforme({
  volver,
  textoVolver,
  tipo,
  titulo,
  subtitulo,
  datos,
}: {
  volver: string;
  textoVolver: string;
  tipo: string;
  titulo: string;
  subtitulo?: string | null;
  datos: [string, string][];
}) {
  return (
    <div className="space-y-3">
      <div className="no-imprimir flex flex-wrap items-center justify-between gap-2">
        <Link href={volver} className="inline-flex items-center gap-1 text-xs text-marmol-500 hover:text-marca-600">
          <ArrowLeft size={12} /> {textoVolver}
        </Link>
        <BotonImprimir />
      </div>
      <div className="rounded-2xl bg-degradado px-6 py-6 text-white shadow-lg print:rounded-none print:shadow-none">
        <p className="text-xs font-semibold uppercase tracking-widest text-acento">
          AndMesApps · {tipo} · {formatearFecha(new Date())}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-sm text-white/85">{subtitulo}</p>}
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-white/85">
          {datos.map(([k, v]) => (
            <div key={k}>
              <dt className="inline">{k}: </dt>
              <dd className="inline font-semibold text-white">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

export function Kpi({ titulo, valor, nota, tono = 'text-secundario' }: { titulo: string; valor: string; nota?: string; tono?: string }) {
  return (
    <div className="card p-3">
      <p className="text-[11px] font-medium leading-tight text-marmol-500">{titulo}</p>
      <p className={cn('font-display text-2xl font-bold', tono)}>{valor}</p>
      {nota && <p className="text-[11px] text-marmol-400">{nota}</p>}
    </div>
  );
}

export function SeccionInforme({ titulo, descripcion, children }: { titulo: string; descripcion?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="font-display text-lg font-semibold text-secundario">{titulo}</h2>
      {descripcion && <p className="mt-0.5 text-sm text-marmol-500">{descripcion}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
