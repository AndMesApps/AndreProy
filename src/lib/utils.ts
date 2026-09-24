import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SOLO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Formatea fechas en español de Colombia, ej. "16 de julio de 2026". */
export function formatearFecha(fecha: string | Date): string {
  if (typeof fecha === 'string' && SOLO_FECHA.test(fecha)) {
    // Una columna DATE ("YYYY-MM-DD") se lee como medianoche local, no UTC,
    // para que en Colombia (UTC-5) no se muestre un día antes.
    const [anio, mes, dia] = fecha.split('-').map(Number);
    return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(anio!, mes! - 1, dia!));
  }
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Bogota' }).format(d);
}
