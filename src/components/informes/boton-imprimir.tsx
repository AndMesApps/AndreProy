'use client';

import { Printer } from 'lucide-react';

/** Abre el diálogo de impresión del navegador: desde ahí se imprime o se guarda como PDF. */
export function BotonImprimir() {
  return (
    <button type="button" onClick={() => window.print()} className="boton no-imprimir">
      <Printer size={15} /> Imprimir o guardar PDF
    </button>
  );
}
