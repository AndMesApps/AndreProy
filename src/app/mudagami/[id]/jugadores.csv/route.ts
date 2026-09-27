import { NextResponse } from 'next/server';
import { aCsv } from '@/lib/juego';
import { db } from '@/lib/supabase/server';
import { getFacilitador, puedeAdministrarReto } from '@/lib/auth';
import { SEXOS, calcularPuntosEquipo, calcularTabla1, minimoTraslados, LAYOUT_INICIAL, type EstadisticasEquipo, type Layout, type Sexo } from '@/lib/mudagami';

/** Exporta los jugadores del reto (con su equipo y puntos) en CSV para abrir en Excel. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const facilitador = await getFacilitador();
  if (!facilitador) return new NextResponse('No autorizado', { status: 401 });

  const sb = db();
  const { data: reto } = await sb.from('mg_retos').select('id, codigo, creado_por').eq('id', id).maybeSingle();
  if (!reto) return new NextResponse('Reto no encontrado', { status: 404 });
  if (!puedeAdministrarReto(facilitador, reto)) return new NextResponse('No autorizado', { status: 403 });

  const [{ data: equipos }, { data: jugadores }, { data: layouts }, { data: traslados }] = await Promise.all([
    sb.from('mg_equipos').select('id, nombre').eq('reto_id', id),
    sb
      .from('mg_jugadores')
      .select('id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, rango_edad, organizacion, area, antiguedad, email, celular, created_at')
      .eq('reto_id', id)
      .order('created_at'),
    sb.from('mg_layouts').select('equipo_id, corrida, posiciones').eq('reto_id', id),
    sb.from('mg_traslados').select('equipo_id, corrida, medio, articulos, jugador_id').eq('reto_id', id),
  ]);

  const equipoDe = new Map(((equipos ?? []) as { id: string; nombre: string }[]).map((e) => [e.id, e.nombre]));
  const layoutDe = new Map(((layouts ?? []) as any[]).filter((l) => l.corrida === 2).map((l) => [l.equipo_id, l.posiciones as Layout]));
  const traslList = (traslados ?? []) as { equipo_id: string; corrida: number; medio: 'montacargas' | 'carretilla'; articulos: number; jugador_id: string | null }[];

  const statsPorEquipo = new Map<string, EstadisticasEquipo>();
  for (const e of (equipos ?? []) as { id: string }[]) {
    const t1 = traslList.filter((t) => t.equipo_id === e.id && t.corrida === 1);
    const t2 = traslList.filter((t) => t.equipo_id === e.id && t.corrida === 2);
    statsPorEquipo.set(e.id, {
      corrida1: calcularTabla1(t1),
      corrida2: t2.length ? calcularTabla1(t2) : null,
      minimoTeorico2: minimoTraslados(layoutDe.get(e.id) ?? LAYOUT_INICIAL),
      jugadoresConCorrida1: new Set(t1.filter((t) => t.jugador_id).map((t) => t.jugador_id!)),
      jugadoresConCorrida2: new Set(t2.filter((t) => t.jugador_id).map((t) => t.jugador_id!)),
    });
  }

  const encabezado = ['Equipo', 'Nombres', 'Apellidos', 'Cargo', 'Líder', 'Sexo', 'Rango de edad', 'Organización', 'Área', 'Tiempo en el cargo', 'Correo', 'Celular', 'Puntos', 'Registrado'];
  const filas = ((jugadores ?? []) as any[]).map((j) => {
    const stats = statsPorEquipo.get(j.equipo_id);
    return [
      equipoDe.get(j.equipo_id) ?? '',
      j.nombres,
      j.apellidos,
      j.cargo,
      j.es_lider ? 'Sí' : 'No',
      SEXOS[j.sexo as Sexo] ?? j.sexo,
      j.rango_edad ?? '',
      j.organizacion ?? '',
      j.area ?? '',
      j.antiguedad ?? '',
      j.email ?? '',
      j.celular ?? '',
      stats ? calcularPuntosEquipo(stats, j.id) : 0,
      new Date(j.created_at).toLocaleString('es-CO', { timeZone: 'America/Bogota' }),
    ];
  });

  const csv = aCsv([encabezado, ...filas]);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="mudagami-${reto.codigo}-jugadores.csv"`,
    },
  });
}
