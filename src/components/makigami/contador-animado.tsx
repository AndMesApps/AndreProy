'use client';

import { useEffect, useRef, useState } from 'react';

/** Anima un número desde su valor anterior hasta `valor` (ease-out, ~700 ms). */
export function useValorAnimado(valor: number, duracionMs = 700) {
  const [mostrado, setMostrado] = useState(valor);
  const desde = useRef(valor);

  useEffect(() => {
    const inicio = performance.now();
    const origen = desde.current;
    let frame = 0;
    const paso = (t: number) => {
      const avance = Math.min(1, (t - inicio) / duracionMs);
      const suavizado = 1 - Math.pow(1 - avance, 3);
      const actual = origen + (valor - origen) * suavizado;
      setMostrado(actual);
      desde.current = actual;
      if (avance < 1) frame = requestAnimationFrame(paso);
    };
    frame = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(frame);
  }, [valor, duracionMs]);

  return mostrado;
}

export function ContadorAnimado({ valor, formato }: { valor: number; formato: (n: number) => string }) {
  const mostrado = useValorAnimado(valor);
  return <>{formato(mostrado)}</>;
}
