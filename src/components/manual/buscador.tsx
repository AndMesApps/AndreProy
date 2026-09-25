'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';

/** Temas rápidos: tocar uno busca esa palabra. */
const TEMAS = [
  'crear proyecto',
  'cronograma',
  'tablero',
  'KPI',
  'bitácora',
  'por horas',
  'seguridad social',
  'retención',
  'viáticos',
  'plan de acción',
  'informe',
  'PDF',
  'código',
  'Makigami',
  'Kaizen',
  '5S',
  'misión real',
  'MudaLab',
  'Muda',
  'causa raíz',
  'Banco de oportunidades',
  'menú',
  'usuarios',
  'clave',
];

const normalizar = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/**
 * Buscador del manual: esconde los temas que no tienen la palabra, abre las
 * preguntas que sí la tienen y la resalta (sin tildes ni mayúsculas).
 */
export function BuscadorManual({ contenedorId }: { contenedorId: string }) {
  const [q, setQ] = useState('');
  const [resultados, setResultados] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const raiz = document.getElementById(contenedorId);
    if (!raiz) return;
    const consulta = normalizar(q.trim());
    const secciones = [...raiz.querySelectorAll<HTMLElement>('[data-seccion]')];
    const resaltados: Range[] = [];
    let total = 0;

    for (const sec of secciones) {
      const subs = [...sec.querySelectorAll<HTMLElement>('[data-sub]')].filter((s) => !s.parentElement?.closest('[data-sub]'));
      if (!consulta) {
        sec.hidden = false;
        subs.forEach((s) => (s.hidden = false));
        continue;
      }
      const cabeza = sec.querySelector<HTMLElement>('[data-cabeza]');
      const cabezaCoincide = normalizar(cabeza?.textContent ?? '').includes(consulta);
      let alguno = false;
      for (const s of subs) {
        const coincide = normalizar(s.textContent ?? '').includes(consulta);
        s.hidden = !coincide && !cabezaCoincide;
        if (coincide) {
          alguno = true;
          total++;
          if (s instanceof HTMLDetailsElement) s.open = true;
          s.querySelectorAll('details').forEach((d) => {
            if (normalizar(d.textContent ?? '').includes(consulta)) d.open = true;
          });
        }
      }
      sec.hidden = !alguno && !cabezaCoincide;
      if (cabezaCoincide && !alguno) total++;
    }

    // Resaltar las coincidencias (navegadores que soportan CSS Highlights).
    const css = (globalThis as { CSS?: { highlights?: Map<string, unknown> } }).CSS;
    const Highlight = (globalThis as { Highlight?: new (...r: Range[]) => unknown }).Highlight;
    if (css?.highlights && Highlight) {
      css.highlights.delete('manual');
      if (consulta.length >= 2) {
        const walker = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
        let nodo: Node | null;
        while ((nodo = walker.nextNode())) {
          const el = nodo.parentElement;
          if (!el || el.closest('[hidden]')) continue;
          const texto = normalizar(nodo.textContent ?? '');
          let i = texto.indexOf(consulta);
          while (i >= 0) {
            const r = new Range();
            r.setStart(nodo, i);
            r.setEnd(nodo, i + consulta.length);
            resaltados.push(r);
            i = texto.indexOf(consulta, i + consulta.length);
          }
        }
        css.highlights.set('manual', new Highlight(...resaltados));
      }
    }
    setResultados(consulta ? total : null);
  }, [q, contenedorId]);

  return (
    <div className="card no-imprimir sticky top-16 z-20 space-y-2 p-3 shadow-md">
      <label className="relative block">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-marmol-400" />
        <input
          ref={input}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar en el manual: tema o palabra (ej. seguridad social, tablero, código)"
          className="campo pl-9 pr-9 text-base sm:text-sm"
          aria-label="Buscar en el manual"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ('');
              input.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-marmol-400 hover:text-marmol-700"
            aria-label="Borrar búsqueda"
          >
            <X size={16} />
          </button>
        )}
      </label>
      <div className="flex flex-wrap gap-1">
        {TEMAS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setQ(t)}
            className={cn('rounded-full border px-2 py-0.5 text-[11px]', normalizar(q) === normalizar(t) ? 'border-marca-500 bg-marca-50 font-semibold text-marca-700' : 'border-marmol-200 text-marmol-600 hover:border-marca-300')}
          >
            {t}
          </button>
        ))}
      </div>
      {resultados != null && (
        <p className={cn('text-xs', resultados ? 'text-marmol-600' : 'text-bajo')}>
          {resultados ? `${resultados} ${resultados === 1 ? 'tema encontrado' : 'temas encontrados'} con «${q.trim()}».` : `No encontramos «${q.trim()}». Prueba con otra palabra o con uno de los temas.`}
        </p>
      )}
    </div>
  );
}
