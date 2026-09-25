import { NextResponse } from 'next/server';
import { aCsv, SEXOS, type Sexo } from '@/lib/juego';
import { db } from '@/lib/supabase/server';
import { getFacilitador, puedeAdministrarReto } from '@/lib/auth';
import { marcador5S, type IntentoMinimo, type MisionRealMinima } from '@/lib/cincos';

/** Exporta los jugadores del Reto 5S (con su equipo y los puntos del equipo) en CSV para Excel. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const facilitador = await getFacilitador();
  if (!facilitador) return new NextResponse('No autorizado', { status: 401 });
  const sb = db();
  const { data: s } = await sb.from('s5_sesiones').select('id, codigo, creado_por').eq('id', id).maybeSingle();
  if (!s) return new NextResponse('Reto no encontrado', { status: 404 });
  if (!puedeAdministrarReto(facilitador, s)) return new NextResponse('No autorizado', { status: 403 });

  const [{ data: equipos }, { data: jugadores }, { data: intentos }, { data: reales }] = await Promise.all([
    sb.from('s5_equipos').select('id, nombre').eq('sesion_id', id),
    sb.from('s5_jugadores').select('*').eq('sesion_id', id).order('created_at'),
    sb.from('s5_intentos').select('equipo_id, mision, jugador_id, inicio, fin, aciertos, errores, puntos').eq('sesion_id', id),
    sb.from('s5_misiones_reales').select('*').eq('sesion_id', id),
  ]);
  const rs: Record<string, MisionRealMinima> = {};
  for (const r of (reales ?? []) as any[]) rs[r.equipo_id] = r;
  const nombre = new Map(((equipos ?? []) as { id: string; nombre: string }[]).map((e) => [e.id, e.nombre]));
  const cab = ['Equipo', 'Nombres', 'Apellidos', 'Cargo', 'Líder', 'Sexo', 'Rango de edad', 'Organización', 'Área', 'Correo', 'Celular', 'Puntos del equipo', 'Registrado'];
  const filas = ((jugadores ?? []) as any[]).map((j) => [
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
    marcador5S(j.equipo_id, (intentos ?? []) as IntentoMinimo[], rs[j.equipo_id]).total,
    new Date(j.created_at).toLocaleString('es-CO', { timeZone: 'America/Bogota' }),
  ]);
  return new NextResponse(aCsv([cab, ...filas]), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="reto5s-${s.codigo}-jugadores.csv"` },
  });
}
