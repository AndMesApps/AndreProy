import { NextResponse } from 'next/server';
import { aCsv, SEXOS, type Sexo } from '@/lib/juego';
import { db } from '@/lib/supabase/server';
import { getFacilitador, puedeAdministrarReto } from '@/lib/auth';
import { marcadorMl, type IntentoMl, type OportunidadMinima } from '@/lib/mudalab';

/** Exporta los jugadores de MudaLab (con su equipo, los puntos y la madurez del equipo) en CSV para Excel. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const facilitador = await getFacilitador();
  if (!facilitador) return new NextResponse('No autorizado', { status: 401 });
  const sb = db();
  const { data: s } = await sb.from('ml_sesiones').select('id, codigo, creado_por').eq('id', id).maybeSingle();
  if (!s) return new NextResponse('Caso no encontrado', { status: 404 });
  if (!puedeAdministrarReto(facilitador, s)) return new NextResponse('No autorizado', { status: 403 });

  const [{ data: equipos }, { data: jugadores }, { data: intentos }, { data: oportunidades }] = await Promise.all([
    sb.from('ml_equipos').select('id, nombre').eq('sesion_id', id),
    sb.from('ml_jugadores').select('*').eq('sesion_id', id).order('created_at'),
    sb.from('ml_intentos').select('equipo_id, mision, jugador_id, inicio, fin, aciertos, errores, puntos, resumen').eq('sesion_id', id),
    sb.from('ml_oportunidades').select('*').eq('sesion_id', id),
  ]);
  const ints = (intentos ?? []) as IntentoMl[];
  const ops = (oportunidades ?? []) as OportunidadMinima[];
  const nombre = new Map(((equipos ?? []) as { id: string; nombre: string }[]).map((e) => [e.id, e.nombre]));
  const cab = ['Equipo', 'Nombres', 'Apellidos', 'Cargo', 'Líder', 'Sexo', 'Rango de edad', 'Organización', 'Área', 'Correo', 'Celular', 'Oportunidades registradas', 'Madurez del equipo (de 8)', 'Puntos del equipo', 'Registrado'];
  const filas = ((jugadores ?? []) as any[]).map((j) => {
    const m = marcadorMl(j.equipo_id, ints, ops);
    return [
      nombre.get(j.equipo_id) ?? '',
      j.nombres,
      j.apellidos,
      j.cargo,
      j.es_lider ? 'Sí' : 'No',
      SEXOS[j.sexo as Sexo] ?? j.sexo,
      j.rango_edad ?? '',
      j.organizacion ?? '',
      j.area ?? '',
      j.email ?? '',
      j.celular ?? '',
      ops.filter((o) => o.jugador_id === j.id).length,
      m.nivel,
      m.total,
      new Date(j.created_at).toLocaleString('es-CO', { timeZone: 'America/Bogota' }),
    ];
  });
  return new NextResponse(aCsv([cab, ...filas]), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="mudalab-${s.codigo}-jugadores.csv"` },
  });
}
