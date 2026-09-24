import 'server-only';
import { headers } from 'next/headers';
import QRCode from 'qrcode';

/** URL pública de este despliegue (sale del host de la petición). */
export async function urlBase() {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

/** Enlace completo para unirse a un juego y su código QR (SVG) para proyectarlo o compartirlo. */
export async function enlaceYQr(ruta: string) {
  const enlace = `${await urlBase()}${ruta}`;
  const qrSvg = await QRCode.toString(enlace, { type: 'svg', margin: 1, color: { dark: '#312E81', light: '#ffffff' } });
  return { enlace, qrSvg };
}
