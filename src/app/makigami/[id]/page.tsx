import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { enlaceYQr } from '@/lib/compartir';
import { db } from '@/lib/supabase/server';
import { getFacilitador, puedeAdministrarReto } from '@/lib/auth';
import { getJugador } from '@/lib/jugador';
import { cambiarRegistroAbierto, crearEquipo, eliminarEquipo, eliminarJugador, moverJugador, renombrarEquipo } from '@/app/makigami/actions';
import { FormularioReto } from '@/components/makigami/formulario-reto';
import { PanelEquipos, type JugadorPanel } from '@/components/juego/panel-equipos';
import { TableroMakigami } from '@/components/makigami/tablero-makigami';
import type { CarrilVista, CazaVista, EquipoVista, JugadorVista, PasoVista, PropuestaVista, RetoVista } from '@/components/makigami/tipos';
import type { EstadoReto } from '@/lib/makigami';
import { ArrowLeft, FileText } from 'lucide-react';

export default async function RetoMakigamiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const sb = db();
  const { data: reto } = await sb
    .from('mk_retos')
    .select('id, codigo, titulo, descripcion, inicio_proceso, fin_proceso, estado, fecha_limite, registro_abierto, creado_por')
    .eq('id', id)
    .maybeSingle();
  if (!reto) notFound();

  // Un Líder que abre el reto de otro líder entra como cualquier jugador (con el código).
  const [facilitador, jugador] = await Promise.all([getFacilitador(), getJugador(reto.id)]);
  const esFacilitador = puedeAdministrarReto(facilitador, reto);
  if (!esFacilitador && !jugador) redirect(`/makigami/unirse/${reto.codigo}`);

  const [{ data: carriles }, { data: pasos }, { data: cazas }, { data: propuestas }, { data: equipos }, { data: jugadores }] = await Promise.all([
    sb.from('mk_carriles').select('id, nombre, orden').eq('reto_id', reto.id).order('orden'),
    sb
      .from('mk_pasos')
      .select('id, carril_id, orden, descripcion, tiempo_trabajo_min, tiempo_espera_min, documento_sistema, clasificacion')
      .eq('reto_id', reto.id)
      .order('orden'),
    sb.from('mk_cazas').select('id, paso_id, jugador_id, tipo_desperdicio, comentario, created_at').eq('reto_id', reto.id).order('created_at'),
    sb
      .from('mk_propuestas')
      .select('id, paso_id, jugador_id, accion, descripcion, ahorro_estimado_min, estado, votos:mk_votos(jugador_id)')
      .eq('reto_id', reto.id)
      .order('created_at'),
    sb.from('mk_equipos').select('id, nombre, emoji').eq('reto_id', reto.id).order('created_at'),
    sb
      .from('mk_jugadores')
      .select('id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, created_at')
      .eq('reto_id', reto.id)
      .order('created_at'),
  ]);

  const listaJugadores = (jugadores ?? []) as (Omit<JugadorPanel, 'nombre'> & { nombres: string; apellidos: string })[];
  const nombreDe = new Map(listaJugadores.map((j) => [j.id, `${j.nombres} ${j.apellidos}`]));

  let diasRestantes: number | null = null;
  if (reto.fecha_limite) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    diasRestantes = Math.round((new Date(`${reto.fecha_limite}T00:00:00`).getTime() - hoy.getTime()) / 86400000);
  }

  const vistaReto: RetoVista = {
    id: reto.id,
    titulo: reto.titulo,
    descripcion: reto.descripcion,
    inicioProceso: reto.inicio_proceso,
    finProceso: reto.fin_proceso,
    estado: reto.estado as EstadoReto,
    fechaLimite: reto.fecha_limite,
  };
  const vistaPasos: PasoVista[] = (pasos ?? []).map((p: any) => ({
    ...p,
    tiempo_trabajo_min: Number(p.tiempo_trabajo_min) || 0,
    tiempo_espera_min: Number(p.tiempo_espera_min) || 0,
  }));
  const vistaCazas: CazaVista[] = (cazas ?? []).map((c: any) => ({ ...c, jugador_nombre: nombreDe.get(c.jugador_id) ?? '—' }));
  const vistaPropuestas: PropuestaVista[] = (propuestas ?? []).map((p: any) => ({
    id: p.id,
    paso_id: p.paso_id,
    jugador_id: p.jugador_id,
    jugador_nombre: nombreDe.get(p.jugador_id) ?? '—',
    accion: p.accion,
    descripcion: p.descripcion,
    ahorro_estimado_min: Number(p.ahorro_estimado_min) || 0,
    estado: p.estado,
    votos: (p.votos ?? []).map((v: any) => v.jugador_id),
  }));
  const vistaEquipos = (equipos ?? []) as EquipoVista[];
  const vistaJugadores: JugadorVista[] = listaJugadores.map((j) => ({
    id: j.id,
    nombre: `${j.nombres} ${j.apellidos}`,
    equipo_id: j.equipo_id,
    cargo: j.cargo,
    es_lider: j.es_lider,
  }));
  const miEquipo = jugador ? vistaEquipos.find((e) => e.id === jugador.equipo_id) : undefined;

  // Enlace + QR para que los jugadores se unan desde el celular.
  const { enlace: enlaceUnirse, qrSvg } = esFacilitador ? await enlaceYQr(`/makigami/unirse/${reto.codigo}`) : { enlace: '', qrSvg: '' };

  return (
    <div className="space-y-5">
      <div>
        <Link href="/makigami" className="inline-flex items-center gap-1 text-xs text-marmol-500 hover:text-marca-600">
          <ArrowLeft size={12} /> Cacería Makigami
        </Link>
        <h1 className="mt-1 font-display text-2xl font-semibold text-secundario">{reto.titulo}</h1>
        {reto.descripcion && <p className="mt-1 max-w-3xl text-sm text-marmol-600">{reto.descripcion}</p>}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-marmol-500">
          {reto.inicio_proceso && <span>▶ Empieza: {reto.inicio_proceso}</span>}
          {reto.fin_proceso && <span>⏹ Termina: {reto.fin_proceso}</span>}
        </div>
        {jugador && (
          <p className="mt-2 inline-flex flex-wrap items-center gap-1.5 rounded-full bg-marca-50 px-3 py-1 text-xs text-marca-700 ring-1 ring-marca-200">
            Juegas como <strong>{jugador.nombres}</strong>
            {miEquipo && (
              <>
                en <strong>
                  {miEquipo.emoji} {miEquipo.nombre}
                </strong>
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
                inicioProceso: reto.inicio_proceso ?? '',
                finProceso: reto.fin_proceso ?? '',
                fechaLimite: reto.fecha_limite ?? '',
              }}
            />
            <Link href={`/makigami/${reto.id}/informe`} className="inline-flex items-center gap-1 text-xs text-marmol-500 hover:text-marca-600">
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
          rutaCsv={`/makigami/${reto.id}/jugadores.csv`}
        />
      )}

      <TableroMakigami
        reto={vistaReto}
        carriles={(carriles ?? []) as CarrilVista[]}
        pasos={vistaPasos}
        cazas={vistaCazas}
        propuestas={vistaPropuestas}
        equipos={vistaEquipos}
        jugadores={vistaJugadores}
        miJugadorId={esFacilitador ? null : (jugador?.id ?? null)}
        esFacilitador={esFacilitador}
        puntosEntregados={reto.estado === 'cerrado'}
        diasRestantes={diasRestantes}
      />
    </div>
  );
}
