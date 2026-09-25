import { NextResponse } from 'next/server';
import { aCsv, SEXOS, type Sexo } from '@/lib/juego';
import { db } from '@/lib/supabase/server';
import { getFacilitador, puedeAdministrarReto } from '@/lib/auth';
import { CLAVES_COMPETENCIA, COMPETENCIAS, marcadorRr, nivelComprension, type IntentoRr } from '@/lib/riesgo';

/** Exporta los jugadores de La Ruta del Riesgo (con los resultados de su equipo y la certificación) en CSV para Excel. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const facilitador = await getFacilitador();
  if (!facilitador) return new NextResponse('No autorizado', { status: 401 });
  const sb = db();
  const { data: s } = await sb.from('rr_sesiones').select('id, codigo, umbral, creado_por').eq('id', id).maybeSingle();
  if (!s) return new NextResponse('Sesión no encontrada', { status: 404 });
  if (!puedeAdministrarReto(facilitador, s)) return new NextResponse('No autorizado', { status: 403 });

  const [{ data: equipos }, { data: jugadores }, { data: intentos }] = await Promise.all([
    sb.from('rr_equipos').select('id, nombre').eq('sesion_id', id),
    sb.from('rr_jugadores').select('*').eq('sesion_id', id).order('created_at'),
    sb.from('rr_intentos').select('equipo_id, reto, jugador_id, inicio, fin, aciertos, errores, puntos, resumen').eq('sesion_id', id),
  ]);
  const ints = (intentos ?? []) as IntentoRr[];
  const nombre = new Map(((equipos ?? []) as { id: string; nombre: string }[]).map((e) => [e.id, e.nombre]));
  const cab = [
    'Equipo',
    'Nombres',
    'Apellidos',
    'Cargo',
    'Líder',
    'Sexo',
    'Rango de edad',
    'Organización',
    'Área',
    'Correo',
    'Celular',
    'Retos que entregó',
    'Retos del equipo (de 8)',
    ...CLAVES_COMPETENCIA.map((k) => `${COMPETENCIAS[k].nombre} (%)`),
    'Comprensión (%)',
    'Nivel',
    'Guardián del Riesgo',
    'Puntos del equipo',
    'Registrado',
  ];
  const filas = ((jugadores ?? []) as any[]).map((j) => {
    const m = marcadorRr(j.equipo_id, ints, s.umbral);
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
      ints.filter((i) => i.jugador_id === j.id && i.fin).length,
      m.retos,
      ...CLAVES_COMPETENCIA.map((k) => m.competencias[k] ?? ''),
      m.comprension ?? '',
      m.comprension == null ? '' : nivelComprension(m.comprension).nombre,
      m.certificado ? 'Sí' : 'No',
      m.total,
      new Date(j.created_at).toLocaleString('es-CO', { timeZone: 'America/Bogota' }),
    ];
  });
  return new NextResponse(aCsv([cab, ...filas]), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="ruta-riesgo-${s.codigo}-jugadores.csv"` },
  });
}
