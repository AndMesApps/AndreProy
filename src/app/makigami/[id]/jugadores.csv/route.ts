import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase/server';
import { getFacilitador, puedeAdministrarReto } from '@/lib/auth';
import { SEXOS, calcularEstadisticas, calcularPuntos, type EstadisticasCazador, type Sexo } from '@/lib/makigami';

/** Exporta los jugadores del reto (con su equipo y puntos) en CSV para abrir en Excel. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const facilitador = await getFacilitador();
  if (!facilitador) return new NextResponse('No autorizado', { status: 401 });

  const sb = db();
  const { data: reto } = await sb.from('mk_retos').select('id, codigo, creado_por').eq('id', id).maybeSingle();
  if (!reto) return new NextResponse('Reto no encontrado', { status: 404 });
  if (!puedeAdministrarReto(facilitador, reto)) return new NextResponse('No autorizado', { status: 403 });

  const [{ data: equipos }, { data: jugadores }, { data: cazas }, { data: propuestas }] = await Promise.all([
    sb.from('mk_equipos').select('id, nombre').eq('reto_id', id),
    sb
      .from('mk_jugadores')
      .select('id, equipo_id, nombres, apellidos, cargo, es_lider, sexo, rango_edad, organizacion, area, antiguedad, email, celular, created_at')
      .eq('reto_id', id)
      .order('created_at'),
    sb.from('mk_cazas').select('paso_id, jugador_id, tipo_desperdicio, created_at').eq('reto_id', id),
    sb.from('mk_propuestas').select('jugador_id, estado, ahorro_estimado_min').eq('reto_id', id),
  ]);

  const stats = calcularEstadisticas((cazas ?? []) as any[], ((propuestas ?? []) as any[]).map((p) => ({ ...p, ahorro_estimado_min: Number(p.ahorro_estimado_min) || 0 })));
  const vigentes = new Map<string, number>();
  for (const p of (propuestas ?? []) as { jugador_id: string; estado: string }[]) if (p.estado !== 'descartada') vigentes.set(p.jugador_id, (vigentes.get(p.jugador_id) ?? 0) + 1);
  const equipoDe = new Map(((equipos ?? []) as { id: string; nombre: string }[]).map((e) => [e.id, e.nombre]));
  const vacio: EstadisticasCazador = { cazas: 0, pionerosValidados: 0, propuestasAprobadas: 0, ahorroAprobadoMin: 0 };

  const encabezado = ['Equipo', 'Nombres', 'Apellidos', 'Cargo', 'Líder', 'Sexo', 'Rango de edad', 'Organización', 'Área', 'Tiempo en el cargo', 'Correo', 'Celular', 'Cazas', 'Propuestas', 'Puntos', 'Registrado'];
  const filas = ((jugadores ?? []) as any[]).map((j) => {
    const s = stats.get(j.id) ?? vacio;
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
      s.cazas,
      vigentes.get(j.id) ?? 0,
      calcularPuntos(s, vigentes.get(j.id) ?? 0),
      new Date(j.created_at).toLocaleString('es-CO', { timeZone: 'America/Bogota' }),
    ];
  });

  // Excel en español usa ";" como separador; el BOM hace que respete las tildes.
  const celda = (v: unknown) => {
    const t = String(v ?? '');
    const segura = /^[=+\-@]/.test(t) ? `'${t}` : t; // evita que Excel lo interprete como fórmula
    return /[";\n\r]/.test(segura) ? `"${segura.replace(/"/g, '""')}"` : segura;
  };
  const csv = '﻿' + [encabezado, ...filas].map((f) => f.map(celda).join(';')).join('\r\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="makigami-${reto.codigo}-jugadores.csv"`,
    },
  });
}
