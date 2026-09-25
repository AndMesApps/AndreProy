import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/supabase/server';
import { getFacilitador, puedeAdministrarReto } from '@/lib/auth';
import { getJugador } from '@/lib/jugador';
import { enlaceYQr } from '@/lib/compartir';
import { nombreFacilitador } from '@/lib/usuarios';
import { CASO, type OportunidadMinima } from '@/lib/mudalab';
import { cambiarRegistroAbierto, crearEquipo, eliminarEquipo, eliminarJugador, moverJugador, renombrarEquipo } from '@/app/mudalab/actions';
import { PanelEquipos, type JugadorPanel } from '@/components/juego/panel-equipos';
import { FormularioCaso } from '@/components/mudalab/formulario-caso';
import { JuegoMudaLab, type EquipoMlVista, type IntentoMlVista } from '@/components/mudalab/juego-mudalab';
import { EnlaceAyuda } from '@/components/manual/enlace-ayuda';
import { ArrowLeft, FileText } from 'lucide-react';

export const metadata = { title: 'MudaLab' };

export default async function CasoMudaLab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const sb = db();
  const { data: s } = await sb.from('ml_sesiones').select('*').eq('id', id).maybeSingle();
  if (!s) notFound();

  const [facilitador, jugador, facilita] = await Promise.all([getFacilitador(), getJugador(s.id, 'mudalab'), nombreFacilitador(s.creado_por)]);
  const esFacilitador = puedeAdministrarReto(facilitador, s);
  if (!esFacilitador && !jugador) redirect(`/mudalab/unirse/${s.codigo}`);

  const [{ data: equipos }, { data: jugadores }, { data: intentos }, { data: oportunidades }] = await Promise.all([
    sb.from('ml_equipos').select('id, nombre, emoji').eq('sesion_id', s.id).order('created_at'),
    sb.from('ml_jugadores').select('id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, created_at').eq('sesion_id', s.id).order('created_at'),
    sb.from('ml_intentos').select('equipo_id, mision, jugador_id, inicio, fin, aciertos, errores, puntos, resumen, respuestas').eq('sesion_id', s.id),
    sb.from('ml_oportunidades').select('*').eq('sesion_id', s.id).order('created_at', { ascending: false }),
  ]);

  const listaJug = (jugadores ?? []) as (Omit<JugadorPanel, 'nombre'> & { nombres: string; apellidos: string })[];
  const vistaEquipos: EquipoMlVista[] = ((equipos ?? []) as { id: string; nombre: string; emoji: string }[]).map((e) => ({
    ...e,
    miembros: listaJug.filter((j) => j.equipo_id === e.id).map((j) => ({ id: j.id, nombre: `${j.nombres} ${j.apellidos}` })),
  }));
  // Las respuestas de otros equipos no se envían al navegador de un jugador.
  const vistaIntentos = ((intentos ?? []) as IntentoMlVista[]).map((i) => (esFacilitador || i.equipo_id === jugador?.equipo_id ? i : { ...i, respuestas: {} }));
  const compartir = esFacilitador ? await enlaceYQr(`/mudalab/unirse/${s.codigo}`) : { enlace: '', qrSvg: '' };
  const miEquipo = jugador ? vistaEquipos.find((e) => e.id === jugador.equipo_id) : undefined;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/mudalab" className="inline-flex items-center gap-1 text-xs text-marmol-500 hover:text-marca-600">
            <ArrowLeft size={12} /> MudaLab
          </Link>
          <EnlaceAyuda seccion="mudalab" />
        </div>
        <h1 className="mt-1 font-display text-2xl font-semibold text-secundario">{s.titulo}</h1>
        {s.descripcion && <p className="mt-1 max-w-3xl text-sm text-marmol-600">{s.descripcion}</p>}
        <p className="mt-1 text-xs text-marmol-500">
          {facilita && <>🧑‍🏫 Facilita: <strong className="text-marmol-700">{facilita}</strong> · </>}
          📁 Expediente {CASO.expediente}: {CASO.nombre}
        </p>
        {jugador && miEquipo && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-marca-50 px-3 py-1 text-xs text-marca-700 ring-1 ring-marca-200">
            Juegas como <strong>{jugador.nombres}</strong> en <strong>{miEquipo.emoji} {miEquipo.nombre}</strong>
          </p>
        )}
        {esFacilitador && (
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <FormularioCaso sesionId={s.id} inicial={{ titulo: s.titulo, descripcion: s.descripcion ?? '' }} />
            <Link href={`/mudalab/${s.id}/informe`} className="inline-flex items-center gap-1 text-xs text-marmol-500 hover:text-marca-600">
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
          jugadores={listaJug.map((j) => ({ ...j, nombre: `${j.nombres} ${j.apellidos}` }))}
          acciones={{ cambiarRegistroAbierto, crearEquipo, renombrarEquipo, eliminarEquipo, moverJugador, eliminarJugador }}
          rutaCsv={`/mudalab/${s.id}/jugadores.csv`}
          avisoEliminar="Eliminar jugador (las jugadas del equipo se conservan)"
          abiertoInicial={s.estado === 'preparacion'}
        />
      )}

      <JuegoMudaLab
        sesion={{ id: s.id, titulo: s.titulo, estado: s.estado, mision_actual: s.mision_actual }}
        equipos={vistaEquipos}
        intentos={vistaIntentos}
        oportunidades={(oportunidades ?? []) as OportunidadMinima[]}
        miEquipoId={esFacilitador ? null : (jugador?.equipo_id ?? null)}
        miJugadorId={esFacilitador ? null : (jugador?.id ?? null)}
        esFacilitador={esFacilitador}
      />
    </div>
  );
}
