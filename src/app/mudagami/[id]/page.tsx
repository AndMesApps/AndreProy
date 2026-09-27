import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { enlaceYQr } from '@/lib/compartir';
import { nombreFacilitador } from '@/lib/usuarios';
import { db } from '@/lib/supabase/server';
import { getFacilitador, puedeAdministrarReto } from '@/lib/auth';
import { getJugador } from '@/lib/jugador';
import { cambiarRegistroAbierto, crearEquipo, eliminarEquipo, eliminarJugador, moverJugador, renombrarEquipo } from '@/app/mudagami/actions';
import { FormularioReto } from '@/components/mudagami/formulario-reto';
import { PanelEquipos, type JugadorPanel } from '@/components/juego/panel-equipos';
import { TableroMudaGami } from '@/components/mudagami/tablero-mudagami';
import type { EquipoVista, JugadorVista, LayoutVista, RetoVista, TrasladoVista } from '@/components/mudagami/tipos';
import type { EstadoReto, Layout, MedioTransporte } from '@/lib/mudagami';
import { ArrowLeft, FileText } from 'lucide-react';

export default async function RetoMudaGamiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const sb = db();
  const { data: reto } = await sb
    .from('mg_retos')
    .select('id, codigo, titulo, descripcion, estado, fecha_limite, registro_abierto, duracion_corrida_seg, duracion_rediseno_seg, cronometro_inicio, creado_por')
    .eq('id', id)
    .maybeSingle();
  if (!reto) notFound();

  const [facilitador, jugador, facilita] = await Promise.all([getFacilitador(), getJugador(reto.id, 'mudagami'), nombreFacilitador(reto.creado_por)]);
  const esFacilitador = puedeAdministrarReto(facilitador, reto);
  if (!esFacilitador && !jugador) redirect(`/mudagami/unirse/${reto.codigo}`);

  const [{ data: equipos }, { data: jugadores }, { data: layouts }, { data: traslados }] = await Promise.all([
    sb.from('mg_equipos').select('id, nombre, emoji').eq('reto_id', reto.id).order('created_at'),
    sb.from('mg_jugadores').select('id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, created_at').eq('reto_id', reto.id).order('created_at'),
    sb.from('mg_layouts').select('equipo_id, corrida, posiciones').eq('reto_id', reto.id),
    sb.from('mg_traslados').select('id, equipo_id, corrida, medio, articulos, jugador_id').eq('reto_id', reto.id).order('created_at'),
  ]);

  const listaJugadores = (jugadores ?? []) as (Omit<JugadorPanel, 'nombre'> & { nombres: string; apellidos: string })[];
  const nombreDe = new Map(listaJugadores.map((j) => [j.id, `${j.nombres} ${j.apellidos}`]));

  const vistaReto: RetoVista = {
    id: reto.id,
    titulo: reto.titulo,
    descripcion: reto.descripcion,
    estado: reto.estado as EstadoReto,
    fechaLimite: reto.fecha_limite,
    duracionCorridaSeg: reto.duracion_corrida_seg,
    duracionRedisenoSeg: reto.duracion_rediseno_seg,
    cronometroInicio: reto.cronometro_inicio,
  };
  const vistaEquipos = (equipos ?? []) as EquipoVista[];
  const vistaJugadores: JugadorVista[] = listaJugadores.map((j) => ({ id: j.id, nombre: `${j.nombres} ${j.apellidos}`, equipo_id: j.equipo_id, cargo: j.cargo, es_lider: j.es_lider }));
  const vistaLayouts: LayoutVista[] = ((layouts ?? []) as any[]).map((l) => ({ equipo_id: l.equipo_id, corrida: l.corrida, posiciones: l.posiciones as Layout }));
  const vistaTraslados: TrasladoVista[] = ((traslados ?? []) as any[]).map((t) => ({
    id: t.id,
    equipo_id: t.equipo_id,
    corrida: t.corrida,
    medio: t.medio as MedioTransporte,
    articulos: t.articulos,
    jugador_id: t.jugador_id,
    jugador_nombre: t.jugador_id ? (nombreDe.get(t.jugador_id) ?? '—') : '—',
  }));
  const miEquipo = jugador ? vistaEquipos.find((e) => e.id === jugador.equipo_id) : undefined;

  const { enlace: enlaceUnirse, qrSvg } = esFacilitador ? await enlaceYQr(`/mudagami/unirse/${reto.codigo}`) : { enlace: '', qrSvg: '' };

  return (
    <div className="space-y-5">
      <div>
        <Link href="/mudagami" className="inline-flex items-center gap-1 text-xs text-marmol-500 hover:text-marca-600">
          <ArrowLeft size={12} /> MudaGami · Kayou
        </Link>
        <h1 className="mt-1 font-display text-2xl font-semibold text-secundario">{reto.titulo}</h1>
        {reto.descripcion && <p className="mt-1 max-w-3xl text-sm text-marmol-600">{reto.descripcion}</p>}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-marmol-500">{facilita && <span>🧑‍🏫 Facilita: {facilita}</span>}</div>
        {jugador && (
          <p className="mt-2 inline-flex flex-wrap items-center gap-1.5 rounded-full bg-marca-50 px-3 py-1 text-xs text-marca-700 ring-1 ring-marca-200">
            Juegas como <strong>{jugador.nombres}</strong>
            {miEquipo && (
              <>
                en <strong>{miEquipo.emoji} {miEquipo.nombre}</strong>
              </>
            )}
          </p>
        )}
        {esFacilitador && (
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <FormularioReto
              retoId={reto.id}
              datosIniciales={{
                titulo: reto.titulo,
                descripcion: reto.descripcion ?? '',
                fechaLimite: reto.fecha_limite ?? '',
                duracionCorridaMin: Math.round(reto.duracion_corrida_seg / 60),
                duracionRedisenoMin: Math.round(reto.duracion_rediseno_seg / 60),
              }}
            />
            <Link href={`/mudagami/${reto.id}/informe`} className="inline-flex items-center gap-1 text-xs text-marmol-500 hover:text-marca-600">
              <FileText size={12} /> Informe y opciones de mejora
            </Link>
          </div>
        )}
      </div>

      {esFacilitador && (
        <PanelEquipos
          retoId={reto.id}
          codigo={reto.codigo}
          enlace={enlaceUnirse}
          qrSvg={qrSvg}
          registroAbierto={reto.registro_abierto}
          equipos={vistaEquipos}
          jugadores={listaJugadores.map((j) => ({ ...j, nombre: `${j.nombres} ${j.apellidos}` }))}
          acciones={{ cambiarRegistroAbierto, crearEquipo, renombrarEquipo, eliminarEquipo, moverJugador, eliminarJugador }}
          rutaCsv={`/mudagami/${reto.id}/jugadores.csv`}
          avisoEliminar="Eliminar jugador (con sus traslados registrados)"
        />
      )}

      <TableroMudaGami
        reto={vistaReto}
        equipos={vistaEquipos}
        jugadores={vistaJugadores}
        layouts={vistaLayouts}
        traslados={vistaTraslados}
        miEquipoId={esFacilitador ? null : (jugador?.equipo_id ?? null)}
        esFacilitador={esFacilitador}
        ahoraServidor={Date.now()}
      />
    </div>
  );
}
