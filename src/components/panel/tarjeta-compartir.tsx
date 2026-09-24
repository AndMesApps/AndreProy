'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Copy, QrCode, Share2 } from 'lucide-react';

/**
 * Un juego abierto listo para compartir: código, enlace para copiar o
 * enviar por WhatsApp/correo, y el QR para proyectar en el salón.
 */
export function TarjetaCompartir({
  juego,
  titulo,
  estado,
  codigo,
  enlace,
  qrSvg,
  ruta,
}: {
  juego: string;
  titulo: string;
  estado: string;
  codigo: string;
  enlace: string;
  qrSvg: string;
  ruta: string;
}) {
  const [copiado, setCopiado] = useState(false);
  const [verQr, setVerQr] = useState(false);
  const mensaje = `¡Únete a «${titulo}»! Entra a ${enlace} (código ${codigo}).`;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(mensaje);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso de portapapeles: el enlace sigue visible.
    }
  };

  const compartir = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, text: mensaje, url: enlace });
      } catch {
        // La persona cerró el menú de compartir.
      }
    } else {
      void copiar();
    }
  };

  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-marmol-400">
            {juego} · {estado}
          </p>
          <Link href={ruta} className="block truncate font-medium text-marmol-900 hover:text-secundario">
            {titulo}
          </Link>
          <p className="mt-1 font-display text-2xl font-bold tracking-[0.25em] text-secundario">{codigo}</p>
          <p className="break-all text-[11px] text-marmol-400">{enlace}</p>
        </div>
        {verQr && <div className="w-28 shrink-0 rounded-lg border border-marmol-200 bg-white p-1" dangerouslySetInnerHTML={{ __html: qrSvg }} />}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <button type="button" onClick={copiar} className="boton-secundario px-2.5 py-1 text-xs">
          {copiado ? <Check size={13} /> : <Copy size={13} />} {copiado ? 'Copiado' : 'Copiar invitación'}
        </button>
        <button type="button" onClick={compartir} className="boton-secundario px-2.5 py-1 text-xs">
          <Share2 size={13} /> Compartir
        </button>
        <a href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`} target="_blank" rel="noreferrer" className="boton-secundario px-2.5 py-1 text-xs">
          💬 WhatsApp
        </a>
        <button type="button" onClick={() => setVerQr((v) => !v)} className="boton-secundario px-2.5 py-1 text-xs">
          <QrCode size={13} /> {verQr ? 'Ocultar QR' : 'QR'}
        </button>
      </div>
    </div>
  );
}
