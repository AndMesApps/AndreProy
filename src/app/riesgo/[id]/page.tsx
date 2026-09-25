import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/supabase/server';
import { getFacilitador, puedeAdministrarReto } from '@/lib/auth';
import { getJugador } from '@/lib/jugador';
import { enlaceYQr } from '@/lib/compartir';
import { nombreFacilitador } from '@/lib/usuarios';
import { MARCOS, type ConfigRuta, type Marco } from '@/lib/riesgo';
import { cambiarRegistroAbierto, crearEquipo, eliminarEquipo, eliminarJugador, moverJugador, renombrarEquipo } from '@/app/riesgo/actions';
import { PanelEquipos, type JugadorPanel } from '@/components/juego/panel-equipos';
import { FormularioSesion } from '@/components/riesgo/formulario-sesion';
import { JuegoRiesgo, type EquipoRrVista, type IntentoRrVista } from '@/components/riesgo/juego-riesgo';
import { EnlaceAyuda } from '@/components/manual/enlace-ayuda';
import { ArrowLeft, Award, FileText } from 'lucide-react';

export const metadata = { title: 'La Ruta del Riesgo' };

export default async function SesionRiesgo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const sb = db();
  const { data: s } = await sb.from('rr_sesiones').select('*').eq('id', id).maybeSingle();
  if (!s) notFound();

  const [facilitador, jugador, facilita] = await Promise.all([getFacilitador(), getJugador(s.id, 'riesgo'), nombreFacilitador(s.creado_por)]);
  const esFacilitador = puedeAdministrarReto(facilitador, s);
  if (!esFacilitador && !jugador) redirect(`/riesgo/unirse/${s.codigo}`);

  const [{ data: equipos }, { data: jugadores }, { data: intentos }] = await Promise.all([
    sb.from('rr_equipos').select('id, nombre, emoji').eq('sesion_id', s.id).order('created_at'),
    sb.from('rr_jugadores').select('id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, created_at').eq('sesion_id', s.id).order('created_at'),
    sb.from('rr_intentos').select('equipo_id, reto, jugador_id, inicio, fin, aciertos, errores, puntos, resumen, respuestas').eq('sesion_id', s.id),
  ]);

  const listaJug = (jugadores ?? []) as (Omit<JugadorPanel, 'nombre'> & { nombres: string; apellidos: string })[];
  const vistaEquipos: EquipoRrVista[] = ((equipos ?? []) as { id: string; nombre: string; emoji: string }[]).map((e) => ({
    ...e,
    miembros: listaJug.filter((j) => j.equipo_id === e.id).map((j) => ({ id: j.id, nombre: `${j.nombres} ${j.apellidos}` })),
  }));
  // Las respuestas de otros equipos no se envían al navegador de un jugador.
  const vistaIntentos = ((intentos ?? []) as IntentoRrVista[]).map((i) => (esFacilitador || i.equipo_id === jugador?.equipo_id ? i : { ...i, respuestas: {} }));
  const compartir = esFacilitador ? await enlaceYQr(`/riesgo/unirse/${s.codigo}`) : { enlace: '', qrSvg: '' };
  const miEquipo = jugador ? vistaEquipos.find((e) => e.id === jugador.equipo_id) : undefined;
  const config: ConfigRuta = { marco: s.marco as Marco, responsable: s.responsable, canal: s.canal, umbral: s.umbral };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/riesgo" className="inline-flex items-center gap-1 text-xs text-marmol-500 hover:text-marca-600">
            <ArrowLeft size={12} /> La Ruta del Riesgo
          </Link>
          <EnlaceAyuda seccion="riesgo" />
        </div>
        <h1 className="mt-1 font-display text-2xl font-semibold text-secundario">{s.titulo}</h1>
        {s.descripcion && <p className="mt-1 max-w-3xl text-sm text-marmol-600">{s.descripcion}</p>}
        <p className="mt-1 text-xs text-marmol-500">
          {facilita && <>🧑‍🏫 Facilita: <strong className="text-marmol-700">{facilita}</strong> · </>}
          🛡️ {MARCOS[config.marco]?.nombre}
        </p>
        {jugador && miEquipo && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-marca-50 px-3 py-1 text-xs text-marca-700 ring-1 ring-marca-200">
            Juegas como <strong>{jugador.nombres}</strong> en <strong>{miEquipo.emoji} {miEquipo.nombre}</strong>
          </p>
        )}
        {esFacilitador && (
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <FormularioSesion
              sesionId={s.id}
              inicial={{ titulo: s.titulo, descripcion: s.descripcion ?? '', marco: config.marco, responsable: config.responsable, canal: config.canal, umbral: config.umbral }}
            />
            <Link href={`/riesgo/${s.id}/informe`} className="inline-flex items-center gap-1 text-xs text-marmol-500 hover:text-marca-600">
              <FileText size={12} /> Cierre y evaluación
            </Link>
            <Link href={`/riesgo/${s.id}/certificados`} className="inline-flex items-center gap-1 text-xs text-marmol-500 hover:text-marca-600">
              <Award size={12} /> Certificados
            </Link>
          </div>
        )}
      </div>

      {esFacilitador && (
        <PanelEquipos
          retoId={s.id}
          codigo={s.codigo}
          enlace={compartir.enlace}
          qrSvg={compartir.qrSvg}
          registroAbierto={s.registro_abierto}
          equipos={vistaEquipos}
          jugadores={listaJug.map((j) => ({ ...j, nombre: `${j.nombres} ${j.apellidos}` }))}
          acciones={{ cambiarRegistroAbierto, crearEquipo, renombrarEquipo, eliminarEquipo, moverJugador, eliminarJugador }}
          rutaCsv={`/riesgo/${s.id}/jugadores.csv`}
          avisoEliminar="Eliminar jugador (las jugadas del equipo se conservan)"
          abiertoInicial={s.estado === 'preparacion'}
        />
      )}

      <JuegoRiesgo
        sesion={{ id: s.id, titulo: s.titulo, estado: s.estado, reto_actual: s.reto_actual }}
        equipos={vistaEquipos}
        intentos={vistaIntentos}
        config={config}
        miEquipoId={esFacilitador ? null : (jugador?.equipo_id ?? null)}
        esFacilitador={esFacilitador}
      />
    </div>
  );
}
