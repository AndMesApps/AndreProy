'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cambiarEstadoProyecto } from '@/app/proyectos/actions';
import { ESTADOS_PROYECTO, SALUD, pct, type EstadoProyecto, type Salud } from '@/lib/proyectos';
import { Kanban } from '@/components/kanban';
import { BarraAvance } from './registro';

export interface TarjetaProyecto {
  id: string;
  nombre: string;
  cliente: string;
  estado: EstadoProyecto;
  salud: Salud;
  avance: number | null;
  tiempo: number | null;
  vencidos: number;
  diasFin: number | null;
}

/** Portafolio en tablero: una columna por estado; arrastrar cambia el estado del proyecto. */
export function TableroProyectos({ proyectos }: { proyectos: TarjetaProyecto[] }) {
  const router = useRouter();
  return (
    <Kanban
      columnas={(Object.keys(ESTADOS_PROYECTO) as EstadoProyecto[]).map((e) => ({ id: e, titulo: ESTADOS_PROYECTO[e].nombre, clase: ESTADOS_PROYECTO[e].clase }))}
      items={proyectos}
      columnaDe={(p) => p.estado}
      onMover={async (p, estado) => {
        await cambiarEstadoProyecto(p.id, estado as EstadoProyecto);
        router.refresh();
      }}
      vacio="Sin proyectos"
      tarjeta={(p) => (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-marca-600">
            {SALUD[p.salud].emoji} {p.cliente}
          </p>
          <Link href={`/proyectos/${p.id}`} className="font-medium leading-snug text-marmol-800 hover:text-secundario">
            {p.nombre}
          </Link>
          <div className="mt-1.5 flex items-center gap-2">
            <BarraAvance valor={p.avance} esperado={p.tiempo} alto="h-1.5" tono={p.salud === 'atrasado' ? 'bg-bajo' : p.salud === 'en_riesgo' ? 'bg-acento' : 'bg-marca-500'} />
            <span className="w-10 shrink-0 text-right text-[11px] font-semibold text-marmol-600">{pct(p.avance)}</span>
          </div>
          <p className="mt-1 text-[11px] text-marmol-500">
            {p.diasFin != null && (p.diasFin >= 0 ? `faltan ${p.diasFin} d` : 'fecha pasada')}
            {p.vencidos > 0 && <span className="font-semibold text-bajo"> · {p.vencidos} {p.vencidos === 1 ? 'vencido' : 'vencidos'}</span>}
          </p>
        </div>
      )}
    />
  );
}
