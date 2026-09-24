import { NextResponse } from 'next/server';
import { aCsv, SEXOS, type Sexo } from '@/lib/juego';
import { db } from '@/lib/supabase/server';
import { getFacilitador, puedeAdministrarReto } from '@/lib/auth';
import { calcularMarcador, formatearPct } from '@/lib/kaizen';

/** Exporta los jugadores de la carrera (con su equipo y los puntos del equipo) en CSV para abrir en Excel. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const facilitador = await getFacilitador();
  if (!facilitador) return new NextResponse('No autorizado', { status: 401 });

  const sb = db();
  const { data: sesion } = await sb.from('kz_sesiones').select('id, codigo, total_rondas, creado_por').eq('id', id).maybeSingle();
  if (!sesion) return new NextResponse('Carrera no encontrada', { status: 404 });
  if (!puedeAdministrarReto(facilitador, sesion)) return new NextResponse('No autorizado', { status: 403 });

  const [{ data: equipos }, { data: jugadores }, { data: tarjetas }, { data: resultados }] = await Promise.all([
    sb.from('kz_equipos').select('id, nombre').eq('sesion_id', id),
    sb
      .from('kz_jugadores')
      .select('id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, rango_edad, organizacion, area, antiguedad, email, celular, created_at')
      .eq('sesion_id', id)
      .order('created_at'),
    sb.from('kz_tarjetas').select('equipo_id, ronda, problema, porques, idea, prediccion, decision').eq('sesion_id', id),
    sb.from('kz_resultados').select('equipo_id, ronda, unidades_buenas, defectos').eq('sesion_id', id),
  ]);

  const equipoDe = new Map(((equipos ?? []) as { id: string; nombre: string }[]).map((e) => [e.id, e.nombre]));
  const marcador = new Map(
    ((equipos ?? []) as { id: string }[]).map((e) => [
      e.id,
      calcularMarcador(e.id, sesion.total_rondas, ((tarjetas ?? []) as any[]).map((t) => ({ ...t, porques: t.porques ?? [] })), (resultados ?? []) as any[]),
    ]),
  );

  const encabezado = ['Equipo', 'Nombres', 'Apellidos', 'Cargo', 'Líder', 'Sexo', 'Rango de edad', 'Organización', 'Área', 'Tiempo en el cargo', 'Correo', 'Celular', 'Puntos del equipo', 'Mejora del equipo', 'Registrado'];
  const filas = ((jugadores ?? []) as any[]).map((j) => {
    const m = marcador.get(j.equipo_id);
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
      m?.total ?? 0,
      formatearPct(m?.mejoraTotalPct ?? null),
      new Date(j.created_at).toLocaleString('es-CO', { timeZone: 'America/Bogota' }),
    ];
  });

  return new NextResponse(aCsv([encabezado, ...filas]), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="kaizen-${sesion.codigo}-jugadores.csv"`,
    },
  });
}
