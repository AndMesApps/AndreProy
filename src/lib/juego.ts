/**
 * Motor común de los juegos por equipos (Cacería Makigami, Carrera Kaizen…):
 * datos de equipos y jugadores y la validación de la inscripción. Todos los
 * juegos se juegan igual por fuera: el facilitador crea una sesión con un
 * código de 6 caracteres y los jugadores se inscriben solos en su equipo.
 */
import { z } from 'zod';

/** Emojis para identificar equipos (se asignan en orden al crearlos). */
export const EMOJIS_EQUIPO = ['🦊', '🦉', '🐺', '🦅', '🐬', '🦁', '🐝', '🐢', '🦄', '🐙', '🐯', '🐧'] as const;

export const SEXOS = {
  femenino: 'Femenino',
  masculino: 'Masculino',
  otro: 'Otro',
  prefiero_no_decir: 'Prefiero no decirlo',
} as const;
export type Sexo = keyof typeof SEXOS;

export const RANGOS_EDAD = ['18 a 24', '25 a 34', '35 a 44', '45 a 54', '55 o más'] as const;
export const ANTIGUEDADES = ['Menos de 1 año', '1 a 3 años', '3 a 5 años', '5 a 10 años', 'Más de 10 años'] as const;

export const NombreEquipo = z.string().trim().min(2, 'El nombre del equipo es muy corto').max(40, 'El nombre del equipo es muy largo');

const opcional = z
  .string()
  .trim()
  .max(120)
  .optional()
  .transform((v) => v || null);

export const RegistroSchema = z
  .object({
    codigo: z.string().trim().toUpperCase().length(6, 'El código tiene 6 caracteres'),
    equipoId: z.string().uuid().optional(),
    nuevoEquipo: z.string().trim().optional(),
    nombres: z.string().trim().min(1, 'Escribe tus nombres').max(80),
    apellidos: z.string().trim().min(1, 'Escribe tus apellidos').max(80),
    cargo: z.string().trim().min(1, 'Escribe tu cargo').max(100),
    esLider: z.boolean(),
    sexo: z.enum(Object.keys(SEXOS) as [string, ...string[]], { errorMap: () => ({ message: 'Elige una opción de sexo' }) }),
    rangoEdad: opcional,
    organizacion: opcional,
    area: opcional,
    antiguedad: opcional,
    email: z
      .string()
      .trim()
      .max(120)
      .optional()
      .transform((v) => v || null)
      .refine((v) => !v || z.string().email().safeParse(v).success, 'El correo no es válido'),
    celular: opcional,
    aceptaDatos: z.literal(true, { errorMap: () => ({ message: 'Debes autorizar el tratamiento de tus datos para jugar' }) }),
  })
  .refine((d) => d.equipoId || d.nuevoEquipo, { message: 'Elige tu equipo o crea uno nuevo' });

export type DatosRegistro = z.input<typeof RegistroSchema>;

/** Columnas de la fila del jugador a partir de la inscripción ya validada. */
export function filaJugador(d: z.output<typeof RegistroSchema>) {
  return {
    nombres: d.nombres,
    apellidos: d.apellidos,
    cargo: d.cargo,
    es_lider: d.esLider,
    sexo: d.sexo,
    rango_edad: d.rangoEdad,
    organizacion: d.organizacion,
    area: d.area,
    antiguedad: d.antiguedad,
    email: d.email,
    celular: d.celular,
    acepta_datos: true,
  };
}

export type ResultadoRegistro = { ok: true; retoId: string } | { ok: false; error: string };

/** Acciones del facilitador sobre equipos y jugadores; cada juego pasa las suyas al panel. */
export interface AccionesEquipos {
  cambiarRegistroAbierto: (id: string, abierto: boolean) => Promise<{ ok: boolean; error?: string }>;
  crearEquipo: (id: string, nombre: string) => Promise<{ ok: boolean; error?: string }>;
  renombrarEquipo: (id: string, equipoId: string, nombre: string) => Promise<{ ok: boolean; error?: string }>;
  eliminarEquipo: (id: string, equipoId: string) => Promise<{ ok: boolean; error?: string }>;
  moverJugador: (id: string, jugadorId: string, equipoId: string) => Promise<{ ok: boolean; error?: string }>;
  eliminarJugador: (id: string, jugadorId: string) => Promise<{ ok: boolean; error?: string }>;
}

/** Excel en español usa ";" como separador; el BOM hace que respete las tildes. */
export function aCsv(filas: unknown[][]) {
  const celda = (v: unknown) => {
    const t = String(v ?? '');
    const segura = /^[=+\-@]/.test(t) ? `'${t}` : t; // evita que Excel lo interprete como fórmula
    return /[";\n\r]/.test(segura) ? `"${segura.replace(/"/g, '""')}"` : segura;
  };
  return '﻿' + filas.map((f) => f.map(celda).join(';')).join('\r\n');
}
