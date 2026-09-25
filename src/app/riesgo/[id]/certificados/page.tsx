import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/supabase/server';
import { getFacilitador, puedeAdministrarReto } from '@/lib/auth';
import { nombreFacilitador } from '@/lib/usuarios';
import { CLAVES_COMPETENCIA, COMPETENCIAS, MARCOS, PERFILES, marcadorRr, type IntentoRr, type Marco } from '@/lib/riesgo';
import { formatearFecha } from '@/lib/utils';
import { BotonImprimir } from '@/components/informes/boton-imprimir';
import { ArrowLeft } from 'lucide-react';

export const metadata = { title: 'Certificados · La Ruta del Riesgo' };

/** Un certificado «Guardián del Riesgo» por página para cada persona de un equipo certificado. */
export default async function CertificadosRiesgo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const sb = db();
  const { data: s } = await sb.from('rr_sesiones').select('*').eq('id', id).maybeSingle();
  if (!s) notFound();
  const facilitador = await getFacilitador();
  if (!puedeAdministrarReto(facilitador, s)) redirect(`/riesgo/${s.id}`);

  const [{ data: equipos }, { data: jugadores }, { data: intentos }, facilita] = await Promise.all([
    sb.from('rr_equipos').select('id, nombre, emoji').eq('sesion_id', s.id),
    sb.from('rr_jugadores').select('id, equipo_id, nombres, apellidos, cargo, organizacion').eq('sesion_id', s.id).order('apellidos'),
    sb.from('rr_intentos').select('equipo_id, reto, jugador_id, inicio, fin, aciertos, errores, puntos, resumen').eq('sesion_id', s.id),
    nombreFacilitador(s.creado_por),
  ]);
  const ints = (intentos ?? []) as IntentoRr[];
  const eqs = (equipos ?? []) as { id: string; nombre: string; emoji: string }[];
  const marcadores = new Map(eqs.map((e) => [e.id, marcadorRr(e.id, ints, s.umbral)]));
  const personas = ((jugadores ?? []) as { id: string; equipo_id: string; nombres: string; apellidos: string; cargo: string; organizacion: string | null }[]).filter(
    (j) => marcadores.get(j.equipo_id)?.certificado,
  );
  const fecha = formatearFecha(s.cerrado_en ?? new Date());

  return (
    <div className="space-y-5">
      <div className="no-imprimir flex flex-wrap items-center justify-between gap-2">
        <Link href={`/riesgo/${s.id}`} className="inline-flex items-center gap-1 text-xs text-marmol-500 hover:text-marca-600">
          <ArrowLeft size={12} /> Volver a la sesión
        </Link>
        {personas.length > 0 && <BotonImprimir />}
      </div>
      <div className="no-imprimir card p-4 text-sm text-marmol-600">
        🛡️ La certificación se entrega por dominio de competencias: {s.umbral} % o más en las 5 competencias, el caso final completo y sin compartir información
        reservada. {personas.length ? `Hay ${personas.length} ${personas.length === 1 ? 'persona certificada' : 'personas certificadas'}. Cada certificado sale en una hoja.` : 'Todavía ningún equipo cumple los criterios.'}
      </div>

      {personas.map((j) => {
        const m = marcadores.get(j.equipo_id)!;
        const e = eqs.find((x) => x.id === j.equipo_id);
        return (
          <div key={j.id} className="card break-after-page p-2 print:border-0 print:shadow-none">
            <div className="rounded-xl border-4 border-double border-secundario p-8 text-center">
              <p className="text-5xl">🛡️</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.3em] text-marca-600">Certificación</p>
              <h1 className="font-display text-3xl font-bold text-secundario">Guardián del Riesgo</h1>
              <p className="mt-4 text-sm text-marmol-600">Se otorga a</p>
              <p className="font-display text-2xl font-semibold text-marmol-900">
                {j.nombres} {j.apellidos}
              </p>
              <p className="text-sm text-marmol-500">
                {j.cargo}
                {j.organizacion ? ` · ${j.organizacion}` : ''}
              </p>
              <p className="mx-auto mt-4 max-w-lg text-sm text-marmol-700">
                por demostrar, en «La Ruta del Riesgo» ({MARCOS[s.marco as Marco]?.nombre}), que sabe reconocer señales de alerta, conocer a la contraparte, seguir el
                dinero, clasificar el riesgo, proteger la información y activar la ruta definida por la organización.
              </p>
              <div className="mx-auto mt-4 grid max-w-lg grid-cols-5 gap-1">
                {CLAVES_COMPETENCIA.map((k) => (
                  <div key={k} className="rounded-lg bg-marca-50 p-1.5">
                    <p className="text-lg leading-none">{COMPETENCIAS[k].emoji}</p>
                    <p className="text-[9px] leading-tight text-marmol-600">{COMPETENCIAS[k].nombre}</p>
                    <p className="text-sm font-bold text-secundario">{m.competencias[k]} %</p>
                  </div>
                ))}
              </div>
              {m.perfiles.length > 0 && <p className="mt-3 text-xs text-marmol-600">{m.perfiles.map((k) => `${PERFILES[k].emoji} ${PERFILES[k].nombre}`).join(' · ')}</p>}
              <p className="mt-3 text-xs text-marmol-500">
                Equipo {e?.emoji} {e?.nombre} · {s.titulo} · {fecha}
              </p>
              <div className="mt-8 flex justify-center">
                <div className="w-56 border-t border-marmol-400 pt-1 text-xs text-marmol-600">{facilita ?? 'Facilitadora'}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
