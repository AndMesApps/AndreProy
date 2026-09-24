import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/supabase/server';
import { getFacilitador, puedeAdministrarReto } from '@/lib/auth';
import { getJugador } from '@/lib/jugador';
import { enlaceYQr } from '@/lib/compartir';
import { cambiarRegistroAbierto, crearEquipo, eliminarEquipo, eliminarJugador, moverJugador, renombrarEquipo } from '@/app/kaizen/actions';
import { PanelEquipos, type JugadorPanel } from '@/components/juego/panel-equipos';
import { FormularioSesion } from '@/components/kaizen/formulario-sesion';
import { CarreraKaizen } from '@/components/kaizen/carrera-kaizen';
import { COLORES_EQUIPO, type EquipoVista, type ResultadoVista, type SesionVista, type TarjetaVista } from '@/components/kaizen/tipos';
import { ArrowLeft, FileText } from 'lucide-react';

export default async function CarreraKaizenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const sb = db();
  const { data: s } = await sb
    .from('kz_sesiones')
    .select('id, codigo, titulo, descripcion, producto, unidad, criterio_calidad, total_rondas, duracion_ronda_seg, estado, ronda_actual, fase, cronometro_inicio, registro_abierto, creado_por')
    .eq('id', id)
    .maybeSingle();
  if (!s) notFound();

  const [facilitador, jugador] = await Promise.all([getFacilitador(), getJugador(s.id, 'kaizen')]);
  const esFacilitador = puedeAdministrarReto(facilitador, s);
  if (!esFacilitador && !jugador) redirect(`/kaizen/unirse/${s.codigo}`);

  const [{ data: equipos }, { data: jugadores }, { data: tarjetas }, { data: resultados }] = await Promise.all([
    sb.from('kz_equipos').select('id, nombre, emoji').eq('sesion_id', s.id).order('created_at'),
    sb.from('kz_jugadores').select('id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, created_at').eq('sesion_id', s.id).order('created_at'),
    sb.from('kz_tarjetas').select('id, equipo_id, ronda, problema, porques, idea, prediccion, decision').eq('sesion_id', s.id),
    sb.from('kz_resultados').select('equipo_id, ronda, unidades_buenas, defectos').eq('sesion_id', s.id),
  ]);

  const listaJugadores = (jugadores ?? []) as (Omit<JugadorPanel, 'nombre'> & { nombres: string; apellidos: string })[];
  const vistaSesion: SesionVista = {
    id: s.id,
    codigo: s.codigo,
    titulo: s.titulo,
    descripcion: s.descripcion,
    producto: s.producto,
    unidad: s.unidad,
    criterioCalidad: s.criterio_calidad,
    totalRondas: s.total_rondas,
    duracionRondaSeg: s.duracion_ronda_seg,
    estado: s.estado,
    rondaActual: s.ronda_actual,
    fase: s.fase,
    cronometroInicio: s.cronometro_inicio,
  };
  const vistaEquipos: EquipoVista[] = ((equipos ?? []) as { id: string; nombre: string; emoji: string }[]).map((e, i) => ({
    ...e,
    color: COLORES_EQUIPO[i] ?? '#8a7f70',
    miembros: listaJugadores.filter((j) => j.equipo_id === e.id).length,
  }));
  const vistaTarjetas = ((tarjetas ?? []) as TarjetaVista[]).map((t) => ({ ...t, porques: t.porques ?? [] }));
  const vistaResultados = (resultados ?? []) as ResultadoVista[];
  const miEquipo = jugador ? vistaEquipos.find((e) => e.id === jugador.equipo_id) : undefined;

  const compartir = esFacilitador ? await enlaceYQr(`/kaizen/unirse/${s.codigo}`) : { enlace: '', qrSvg: '' };

  return (
    <div className="space-y-5">
      <div>
        <Link href="/kaizen" className="inline-flex items-center gap-1 text-xs text-marmol-500 hover:text-marca-600">
          <ArrowLeft size={12} /> Carrera Kaizen
        </Link>
        <h1 className="mt-1 font-display text-2xl font-semibold text-secundario">{s.titulo}</h1>
        {s.descripcion && <p className="mt-1 max-w-3xl text-sm text-marmol-600">{s.descripcion}</p>}
        <p className="mt-1 text-xs text-marmol-500">
          Producen: <strong className="text-marmol-700">{s.producto}</strong>
          {s.criterio_calidad && <> · Unidad buena: {s.criterio_calidad}</>}
        </p>
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
            <FormularioSesion
              sesionId={s.id}
              datosIniciales={{
                titulo: s.titulo,
                descripcion: s.descripcion ?? '',
                producto: s.producto,
                unidad: s.unidad,
                criterioCalidad: s.criterio_calidad ?? '',
                totalRondas: s.total_rondas,
                minutosRonda: s.duracion_ronda_seg / 60,
              }}
            />
            <Link href={`/kaizen/${s.id}/informe`} className="inline-flex items-center gap-1 text-xs text-marmol-500 hover:text-marca-600">
              <FileText size={12} /> Informe y opciones de mejora
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
          jugadores={listaJugadores.map((j) => ({ ...j, nombre: `${j.nombres} ${j.apellidos}` }))}
          acciones={{ cambiarRegistroAbierto, crearEquipo, renombrarEquipo, eliminarEquipo, moverJugador, eliminarJugador }}
          rutaCsv={`/kaizen/${s.id}/jugadores.csv`}
          avisoEliminar="Eliminar jugador (las tarjetas y resultados del equipo se conservan)"
          abiertoInicial={s.estado === 'preparacion'}
        />
      )}

      <CarreraKaizen
        sesion={vistaSesion}
        equipos={vistaEquipos}
        tarjetas={vistaTarjetas}
        resultados={vistaResultados}
        miEquipoId={esFacilitador ? null : (jugador?.equipo_id ?? null)}
        esFacilitador={esFacilitador}
        ahoraServidor={Date.now()}
      />
    </div>
  );
}
