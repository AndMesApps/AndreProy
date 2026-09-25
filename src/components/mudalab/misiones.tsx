'use client';

import { useMemo, useState } from 'react';
import {
  CASO,
  CATEGORIAS_ISHIKAWA,
  CAUSA_RAIZ,
  CAUSAS_ISHIKAWA,
  DEFINIR,
  EFECTO_ISHIKAWA,
  FICHAS_GEMBA,
  MAX_EXPERIMENTOS,
  MAX_MECANISMOS,
  MECANISMOS,
  MUDAS,
  OPCIONES_EFICIENCIA,
  PASOS,
  PORQUES,
  RESTRICCIONES,
  SOLUCIONES,
  CLAVES_MUDA,
  derivaSemanas,
  diasTexto,
  pesosMl,
  simular,
  sostenibilidad,
  tiemposCaso,
  type CategoriaIshikawa,
  type ClaveMuda,
  type ResumenMl,
} from '@/lib/mudalab';
import { mezclar } from '@/components/cincos/misiones';
import { cn } from '@/lib/utils';

type Entregar = (respuestas: unknown) => void;
interface PropsMision {
  semilla: string;
  onEntregar: Entregar;
  pendiente: boolean;
}

function BotonEntregar({ onClick, listo, pendiente, texto = 'Entregar misión', aviso }: { onClick: () => void; listo: boolean; pendiente: boolean; texto?: string; aviso?: string }) {
  return (
    <div className="sticky bottom-2 z-10 flex flex-col items-center gap-1 pt-2">
      {aviso && !listo && <p className="rounded-full bg-white/95 px-3 py-0.5 text-[11px] text-marmol-500 shadow">{aviso}</p>}
      <button type="button" disabled={pendiente || !listo} onClick={onClick} className={cn('boton px-6 py-3 text-base shadow-lg', !listo && 'bg-marmol-400 hover:bg-marmol-400')}>
        {pendiente ? 'Entregando…' : texto}
      </button>
    </div>
  );
}

const horas = (h: number) => (h >= 24 ? `${(h / 24).toLocaleString('es-CO', { maximumFractionDigits: 1 })} d` : `${h} h`);

// ----------------------------------------------------------------------------
// Misión 1 — Definir
// ----------------------------------------------------------------------------

export function M1Definir({ semilla, onEntregar, pendiente }: PropsMision) {
  const [r, setR] = useState<Record<string, string>>({});
  const preguntas = useMemo(() => DEFINIR.map((p) => ({ ...p, opciones: mezclar(p.opciones, semilla + p.id) })), [semilla]);
  const listas = Object.keys(r).length;
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm">
        <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700">📁 Expediente {CASO.expediente} · {CASO.empresa}</p>
        <p className="mt-1 italic text-marmol-700">{CASO.queja}</p>
      </div>
      {preguntas.map((p, n) => (
        <div key={p.id} className="space-y-1.5">
          <p className="text-sm font-semibold text-marmol-800">
            {n + 1}. {p.pregunta}
          </p>
          <div className="grid gap-1.5">
            {p.opciones.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setR((v) => ({ ...v, [p.id]: o.id }))}
                className={cn('rounded-lg border-2 px-3 py-2 text-left text-sm transition', r[p.id] === o.id ? 'border-secundario bg-secundario/5 font-medium text-secundario' : 'border-marmol-200 bg-white hover:border-marca-300')}
              >
                {o.texto}
              </button>
            ))}
          </div>
        </div>
      ))}
      <BotonEntregar onClick={() => onEntregar(r)} listo={listas === DEFINIR.length} pendiente={pendiente} texto="📁 Abrir el expediente" aviso={`Respondidas ${listas} de ${DEFINIR.length}`} />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Misión 2 — Medir en el Gemba
// ----------------------------------------------------------------------------

export function M2Gemba({ onEntregar, pendiente }: PropsMision) {
  const [enGemba, setEnGemba] = useState(false);
  const [datos, setDatos] = useState(false);
  const [observados, setObservados] = useState<string[]>([]);
  const [marcas, setMarcas] = useState<Record<string, ClaveMuda>>({});
  const [cuello, setCuello] = useState('');
  const [eficiencia, setEficiencia] = useState('');
  const fichas = FICHAS_GEMBA - (datos ? 1 : 0) - observados.length;
  const t = tiemposCaso();
  const documentados = PASOS.filter((p) => p.documentado);
  const maxEspera = Math.max(...PASOS.map((p) => p.esperaH));

  const usar = (fn: () => void) => fichas > 0 && fn();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-secundario p-3 text-white">
        <p className="text-sm font-semibold">🎟️ Fichas de investigación:</p>
        <div className="flex gap-1">
          {Array.from({ length: FICHAS_GEMBA }, (_, i) => (
            <span key={i} className={cn('inline-block h-4 w-4 rounded-full border-2 border-white', i < fichas ? 'bg-acento' : 'bg-transparent opacity-40')} />
          ))}
        </div>
        <p className="text-xs text-white/80">
          {fichas} de {FICHAS_GEMBA}
        </p>
      </div>

      {!enGemba ? (
        <div className="space-y-3">
          <div className="rounded-xl border-2 border-dashed border-marmol-300 bg-white p-4">
            <p className="text-sm font-semibold text-marmol-800">📄 Lente «procedimiento» (gratis): lo que dice el manual</p>
            <ol className="mt-2 space-y-1">
              {documentados.map((p, i) => (
                <li key={p.id} className="flex items-center gap-2 text-sm text-marmol-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-marmol-100 text-xs font-bold">{i + 1}</span>
                  {p.nombre}
                </li>
              ))}
            </ol>
            <p className="mt-2 text-xs text-marmol-500">Según el manual, el proceso es sencillo: 5 pasos. ¿Será verdad?</p>
          </div>
          <div className="text-center">
            <button type="button" onClick={() => setEnGemba(true)} className="boton px-6 py-3 text-base">
              🚶 Ir al Gemba (donde pasan las cosas)
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-xl border-2 border-acento bg-amber-50 p-3 text-center">
            <p className="font-display text-lg font-bold text-secundario">😱 El papel decía 5 pasos… ¡en la realidad hay {PASOS.length}!</p>
            <p className="text-xs text-marmol-600">Los pasos con 🆕 no aparecen en el manual. Usen sus fichas para investigar y marquen la Muda que ven en cada paso.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={datos || fichas <= 0}
              onClick={() => usar(() => setDatos(true))}
              className={cn('rounded-lg border-2 px-3 py-2 text-sm font-semibold', datos ? 'border-marca-400 bg-marca-50 text-marca-700' : 'border-secundario text-secundario hover:bg-secundario/5')}
            >
              📊 {datos ? 'Datos a la vista' : 'Usar la lente «datos» (1 ficha)'}
            </button>
            <p className="text-[11px] text-marmol-500">Muestra el tiempo de trabajo y de espera de cada paso.</p>
          </div>

          <div className="space-y-2">
            {PASOS.map((p, i) => {
              const visto = observados.includes(p.id);
              return (
                <div key={p.id} className={cn('rounded-xl border p-3', marcas[p.id] ? 'border-red-300 bg-red-50/50' : 'border-marmol-200 bg-white')}>
                  <div className="flex flex-wrap items-start gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secundario text-xs font-bold text-white">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-marmol-800">
                        {p.nombre} {!p.documentado && <span className="ml-1 rounded bg-acento/20 px-1 text-[10px] font-bold text-amber-700">🆕 no está en el manual</span>}
                      </p>
                      <p className="text-[11px] text-marmol-500">{p.area}</p>
                    </div>
                    {!visto && (
                      <button type="button" disabled={fichas <= 0} onClick={() => usar(() => setObservados((o) => [...o, p.id]))} className="rounded-lg bg-marmol-100 px-2 py-1 text-xs font-medium text-marmol-700 hover:bg-marca-50 disabled:opacity-40">
                        👀 Observar (1 ficha)
                      </button>
                    )}
                  </div>
                  {datos && (
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-marmol-600">
                      <span className="w-24 shrink-0">🛠️ {p.trabajoMin} min trabajo</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-marmol-100">
                        <div className="h-full rounded-full bg-medio" style={{ width: `${(p.esperaH / maxEspera) * 100}%` }} />
                      </div>
                      <span className="w-20 shrink-0 text-right">⏳ {p.esperaH ? `${horas(p.esperaH)} espera` : 'sin espera'}</span>
                    </div>
                  )}
                  {visto && <p className="mt-2 rounded-lg bg-marca-50 px-2 py-1.5 text-xs text-marmol-700">👀 {p.pista}</p>}
                  <div className="mt-2 flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setMarcas((m) => {
                          const n = { ...m };
                          delete n[p.id];
                          return n;
                        })
                      }
                      className={cn('rounded-full px-2 py-0.5 text-[11px]', !marcas[p.id] ? 'bg-marca-600 font-semibold text-white' : 'bg-marmol-100 text-marmol-500')}
                    >
                      ✓ Sin Muda
                    </button>
                    {CLAVES_MUDA.map((k) => (
                      <button
                        key={k}
                        type="button"
                        title={MUDAS[k].que}
                        onClick={() => setMarcas((m) => ({ ...m, [p.id]: k }))}
                        className={cn('rounded-full px-2 py-0.5 text-[11px]', marcas[p.id] === k ? 'bg-bajo font-semibold text-white' : 'bg-marmol-100 text-marmol-600 hover:bg-red-100')}
                      >
                        {MUDAS[k].emoji} {MUDAS[k].nombre}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {datos && (
            <p className="rounded-lg bg-marmol-50 p-2 text-center text-xs text-marmol-600">
              📊 Total: {Math.round(t.trabajoMin / 60 * 10) / 10} horas de trabajo y {Math.round(t.esperaMin / 60)} horas de espera → {diasTexto(Math.round(t.dias * 10) / 10)} de principio a fin.
            </p>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-marmol-200 p-3">
              <p className="text-sm font-semibold text-marmol-800">🍾 ¿Cuál es el cuello de botella?</p>
              <p className="text-[11px] text-marmol-500">El paso donde el trabajo se represa más tiempo.</p>
              <select value={cuello} onChange={(e) => setCuello(e.target.value)} className="campo mt-2">
                <option value="">Elijan un paso…</option>
                {PASOS.map((p, i) => (
                  <option key={p.id} value={p.id}>
                    {i + 1}. {p.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-xl border border-marmol-200 p-3">
              <p className="text-sm font-semibold text-marmol-800">⚙️ ¿Qué parte del tiempo agrega valor?</p>
              <p className="text-[11px] text-marmol-500">Solo los pasos que el cliente pagaría: pedir, emitir la orden, recibir.</p>
              <div className="mt-2 grid gap-1">
                {OPCIONES_EFICIENCIA.map((o) => (
                  <button key={o.id} type="button" onClick={() => setEficiencia(o.id)} className={cn('rounded-lg border-2 px-2 py-1.5 text-left text-xs', eficiencia === o.id ? 'border-secundario bg-secundario/5 font-semibold' : 'border-marmol-200')}>
                    {o.texto}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <BotonEntregar
            onClick={() => onEntregar({ marcas, observados, datos, cuello, eficiencia })}
            listo={Boolean(cuello && eficiencia)}
            pendiente={pendiente}
            texto={`🕵️ Entregar el informe del Gemba (${Object.keys(marcas).length} Mudas marcadas)`}
            aviso="Respondan el cuello de botella y la eficiencia"
          />
        </>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Misión 3 — Analizar: 5 porqués + Ishikawa
// ----------------------------------------------------------------------------

export function M3Analizar({ semilla, onEntregar, pendiente }: PropsMision) {
  const [elecciones, setElecciones] = useState<string[][]>([[]]);
  const [aviso, setAviso] = useState<{ tipo: 'culpa' | 'superficial'; texto: string } | null>(null);
  const [ish, setIsh] = useState<Record<string, CategoriaIshikawa>>({});
  const [causaSel, setCausaSel] = useState<string | null>(null);
  const niveles = useMemo(() => PORQUES.map((n, i) => ({ ...n, opciones: mezclar(n.opciones, semilla + i) })), [semilla]);
  const causas = useMemo(() => mezclar(CAUSAS_ISHIKAWA, semilla), [semilla]);

  const nivelActual = elecciones.length - 1;
  const correctaDe = (i: number) => PORQUES[i]!.opciones.find((o) => o.tipo === 'correcta')!;
  const resueltos = elecciones.filter((e, i) => e.includes(correctaDe(i).id)).length;
  const raiz = resueltos === PORQUES.length;

  const elegir = (id: string) => {
    const o = PORQUES[nivelActual]!.opciones.find((x) => x.id === id)!;
    setElecciones((el) => {
      const n = el.map((x) => [...x]);
      n[nivelActual]!.push(id);
      if (o.tipo === 'correcta' && nivelActual < PORQUES.length - 1) n.push([]);
      return n;
    });
    if (o.tipo === 'culpa') setAviso({ tipo: 'culpa', texto: '🚫 Pista falsa: culpar a una persona detiene la investigación (−20). Pregunten por el proceso, no por la persona.' });
    else if (o.tipo === 'superficial') setAviso({ tipo: 'superficial', texto: '🤔 Eso es cierto a medias, pero no explica el problema. Busquen algo que se pueda cambiar en el proceso.' });
    else setAviso(null);
  };

  const ubicar = (cat: CategoriaIshikawa) => {
    if (!causaSel) return;
    setIsh((v) => ({ ...v, [causaSel]: cat }));
    setCausaSel(null);
  };

  const cats = Object.keys(CATEGORIAS_ISHIKAWA) as CategoriaIshikawa[];

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <h3 className="font-display font-semibold text-secundario">🔍 Parte 1 · Los 5 porqués</h3>
        <ol className="space-y-2">
          {niveles.slice(0, nivelActual + 1).map((n, i) => {
            const correcta = correctaDe(i);
            const resuelto = elecciones[i]?.includes(correcta.id);
            return (
              <li key={i} className={cn('rounded-xl border p-3', resuelto ? 'border-marca-300 bg-marca-50/60' : 'border-secundario/40 bg-white')}>
                <p className="text-sm font-semibold text-marmol-800">
                  <span className="mr-1 text-secundario">¿Por qué? {i + 1}</span> {n.pregunta}
                </p>
                {resuelto ? (
                  <p className="mt-1 text-sm text-marca-800">✓ {correcta.texto}</p>
                ) : (
                  <div className="mt-2 grid gap-1.5">
                    {n.opciones.map((o) => {
                      const tocada = elecciones[i]?.includes(o.id);
                      return (
                        <button key={o.id} type="button" disabled={tocada} onClick={() => elegir(o.id)} className={cn('rounded-lg border-2 px-3 py-2 text-left text-sm', tocada ? 'border-marmol-200 bg-marmol-100 text-marmol-400 line-through' : 'border-marmol-200 hover:border-secundario')}>
                          {o.texto}
                        </button>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        {aviso && <p className={cn('rounded-lg p-2 text-sm', aviso.tipo === 'culpa' ? 'bg-red-50 text-bajo' : 'bg-amber-50 text-amber-800')}>{aviso.texto}</p>}
        {raiz && (
          <div className="animate-[pulse_1s_ease-in-out_2] rounded-xl bg-degradado p-4 text-center text-white">
            <p className="font-display text-2xl font-bold">🔓 ¡CAUSA RAÍZ DESBLOQUEADA!</p>
            <p className="mt-1 text-sm">{CAUSA_RAIZ}</p>
          </div>
        )}
      </section>

      {raiz && (
        <section className="space-y-2">
          <h3 className="font-display font-semibold text-secundario">🐟 Parte 2 · Diagrama de Ishikawa</h3>
          <p className="text-xs text-marmol-600">
            Efecto: <strong>{EFECTO_ISHIKAWA}</strong>. Toquen una causa y luego la espina (categoría) donde va.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {causas
              .filter((c) => !ish[c.id])
              .map((c) => (
                <button key={c.id} type="button" onClick={() => setCausaSel(c.id === causaSel ? null : c.id)} className={cn('rounded-lg border-2 px-2 py-1 text-left text-xs', causaSel === c.id ? 'border-acento bg-amber-50 font-semibold' : 'border-marmol-200 bg-white')}>
                  {c.texto}
                </button>
              ))}
            {causas.every((c) => ish[c.id]) && <p className="text-xs text-marca-700">✓ Todas las causas están ubicadas. Pueden moverlas tocándolas.</p>}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {cats.map((k) => (
              <div
                key={k}
                role="button"
                tabIndex={0}
                onClick={() => ubicar(k)}
                onKeyDown={(e) => e.key === 'Enter' && ubicar(k)}
                className={cn('min-h-[5.5rem] rounded-xl border-2 p-2 text-xs', causaSel ? 'cursor-pointer border-acento bg-amber-50/60 hover:bg-amber-100' : 'border-marmol-200 bg-marmol-50')}
              >
                <p className="font-semibold text-marmol-800">
                  {CATEGORIAS_ISHIKAWA[k].emoji} {CATEGORIAS_ISHIKAWA[k].nombre}
                </p>
                <ul className="mt-1 space-y-1">
                  {causas
                    .filter((c) => ish[c.id] === k)
                    .map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCausaSel(c.id);
                          }}
                          className={cn('w-full rounded bg-white px-1.5 py-1 text-left shadow-sm', causaSel === c.id && 'ring-2 ring-acento')}
                        >
                          {c.texto}
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="h-0.5 flex-1 bg-secundario" />
            <span className="rounded-lg bg-secundario px-3 py-1 text-xs font-semibold text-white">🐟 {EFECTO_ISHIKAWA}</span>
          </div>
        </section>
      )}

      <BotonEntregar
        onClick={() => onEntregar({ elecciones, ishikawa: ish })}
        listo={raiz && Object.keys(ish).length === CAUSAS_ISHIKAWA.length}
        pendiente={pendiente}
        texto="🧩 Entregar el análisis"
        aviso={raiz ? `Ubiquen las ${CAUSAS_ISHIKAWA.length} causas en el Ishikawa` : 'Lleguen a la causa raíz'}
      />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Misión 4 — Mejorar: laboratorio
// ----------------------------------------------------------------------------

function Medidor({ etiqueta, valor, max, texto }: { etiqueta: string; valor: number; max: number; texto: string }) {
  const pasa = valor > max;
  return (
    <div className="min-w-0 flex-1">
      <p className="flex justify-between text-[11px] text-marmol-500">
        <span>{etiqueta}</span>
        <span className={cn('font-semibold', pasa ? 'text-bajo' : 'text-marmol-700')}>{texto}</span>
      </p>
      <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-marmol-100">
        <div className={cn('h-full rounded-full transition-all', pasa ? 'bg-bajo' : 'bg-marca-500')} style={{ width: `${Math.min(100, (valor / max) * 100)}%` }} />
      </div>
    </div>
  );
}

export function AntesDespues({ dias, defectos, valido }: { dias: number; defectos: number; valido: boolean }) {
  const barra = (v: number, max: number, meta: number, color: string) => (
    <div className="relative h-4 overflow-hidden rounded-full bg-marmol-100">
      <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${(v / max) * 100}%` }} />
      <div className="absolute inset-y-0 w-0.5 bg-acento" style={{ left: `${(meta / max) * 100}%` }} title="Meta" />
    </div>
  );
  return (
    <div className={cn('space-y-2 rounded-xl p-3', valido ? 'bg-marca-50' : 'bg-red-50')}>
      <div className="grid grid-cols-[5.5rem_1fr_4.5rem] items-center gap-2 text-xs">
        <span className="text-marmol-500">Días antes</span>
        {barra(CASO.diasBase, 6, CASO.metaDias, 'bg-marmol-400')}
        <span className="text-right text-marmol-600">{diasTexto(CASO.diasBase)}</span>
        <span className="font-semibold text-marmol-700">Días después</span>
        {barra(dias, 6, CASO.metaDias, dias <= CASO.metaDias ? 'bg-alto' : 'bg-marca-500')}
        <span className="text-right font-bold text-secundario">{diasTexto(dias)}</span>
        <span className="text-marmol-500">Devueltas antes</span>
        {barra(CASO.defectosBase, 20, CASO.metaDefectos, 'bg-marmol-400')}
        <span className="text-right text-marmol-600">{CASO.defectosBase} %</span>
        <span className="font-semibold text-marmol-700">Devueltas después</span>
        {barra(defectos, 20, CASO.metaDefectos, defectos <= CASO.metaDefectos ? 'bg-alto' : 'bg-marca-500')}
        <span className="text-right font-bold text-secundario">{defectos} %</span>
      </div>
      <p className="text-[10px] text-marmol-400">La rayita amarilla es la meta: {diasTexto(CASO.metaDias)} y {CASO.metaDefectos} % de devoluciones.</p>
    </div>
  );
}

export function M4Laboratorio({ semilla, onEntregar, pendiente }: PropsMision) {
  const [sel, setSel] = useState<string[]>([]);
  const [experimentos, setExperimentos] = useState<string[][]>([]);
  const [elegido, setElegido] = useState<number | null>(null);
  const cartas = useMemo(() => mezclar(SOLUCIONES, semilla), [semilla]);
  const actual = simular(sel);
  const quedan = MAX_EXPERIMENTOS - experimentos.length;

  const experimentar = () => {
    if (!sel.length || quedan <= 0) return;
    setExperimentos((e) => [...e, [...sel].sort()]);
    setElegido(experimentos.length);
  };

  return (
    <div className="space-y-4">
      <div className="sticky top-14 z-10 flex flex-wrap gap-3 rounded-xl border border-marmol-200 bg-white/95 p-3 shadow-sm backdrop-blur">
        <Medidor etiqueta="💰 Presupuesto" valor={actual.costo} max={RESTRICCIONES.presupuesto} texto={`${pesosMl(actual.costo)} de ${pesosMl(RESTRICCIONES.presupuesto)}`} />
        <Medidor etiqueta="👥 Personas" valor={actual.personas} max={RESTRICCIONES.personas} texto={`${actual.personas} de ${RESTRICCIONES.personas}`} />
        <Medidor etiqueta="📅 Tiempo" valor={actual.semanas} max={RESTRICCIONES.semanas} texto={`${actual.semanas} de ${RESTRICCIONES.semanas} semana`} />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {cartas.map((s) => {
          const on = sel.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSel((v) => (on ? v.filter((x) => x !== s.id) : [...v, s.id]))}
              className={cn('rounded-xl border-2 p-3 text-left transition', on ? 'border-secundario bg-secundario/5 shadow' : 'border-marmol-200 bg-white hover:border-marca-300')}
            >
              <p className="flex items-start gap-2 text-sm font-semibold text-marmol-800">
                <span className="text-2xl leading-none">{s.emoji}</span>
                <span className="flex-1">{s.nombre}</span>
                <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-xs', on ? 'border-secundario bg-secundario text-white' : 'border-marmol-300')}>{on ? '✓' : ''}</span>
              </p>
              <p className="mt-1 text-xs text-marmol-600">{s.detalle}</p>
              <p className="mt-1.5 flex flex-wrap gap-x-3 text-[11px] text-marmol-500">
                <span>💰 {s.costo ? pesosMl(s.costo) : 'Gratis'}</span>
                <span>👥 {s.personas}</span>
                <span>📅 {s.semanas} sem</span>
              </p>
              <p className="mt-1 text-[11px] text-amber-700">⚠️ {s.riesgo}</p>
            </button>
          );
        })}
      </div>

      {actual.violaciones.length > 0 && <p className="rounded-lg bg-red-50 p-2 text-xs text-bajo">🚫 El comité no aprobaría este plan: {actual.violaciones.join(' ')}</p>}

      <div className="text-center">
        <button type="button" disabled={!sel.length || quedan <= 0} onClick={experimentar} className="boton-secundario px-5 py-2.5">
          🧪 {quedan > 0 ? `Simular este plan (quedan ${quedan} de ${MAX_EXPERIMENTOS} experimentos)` : 'Ya usaron sus 3 experimentos'}
        </button>
      </div>

      {experimentos.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-marmol-800">🔬 Sus experimentos · elijan el que van a entregar</p>
          {experimentos.map((e, i) => {
            const s = simular(e);
            return (
              <button key={i} type="button" onClick={() => setElegido(i)} className={cn('block w-full rounded-xl border-2 p-3 text-left', elegido === i ? 'border-secundario' : 'border-marmol-200')}>
                <p className="mb-2 text-xs font-semibold text-marmol-700">
                  {elegido === i ? '◉' : '○'} Experimento {i + 1}: {e.map((id) => SOLUCIONES.find((x) => x.id === id)?.emoji).join(' ')} · {pesosMl(s.costo)}
                  {!s.valido && <span className="ml-1 text-bajo">· 🚫 rechazado</span>}
                  {s.valido && s.dias <= CASO.metaDias && s.defectos <= CASO.metaDefectos && <span className="ml-1 text-alto">· 🎯 ¡meta doble!</span>}
                </p>
                <AntesDespues dias={s.dias} defectos={s.defectos} valido={s.valido} />
              </button>
            );
          })}
        </div>
      )}

      <BotonEntregar
        onClick={() => elegido != null && onEntregar({ experimentos, plan: experimentos[elegido] })}
        listo={elegido != null}
        pendiente={pendiente}
        texto="✅ Entregar el plan elegido"
        aviso="Simulen al menos un plan y elíjanlo"
      />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Misión 5 — Controlar: la Muda regresa
// ----------------------------------------------------------------------------

/** Gráfica de 12 semanas: sin control vs. con el sistema del equipo, con la meta. */
export function GraficaDeriva({ sin, con }: { sin: number[]; con?: number[] }) {
  const W = 320;
  const H = 150;
  const pad = { l: 30, r: 44, t: 10, b: 22 };
  const max = 6;
  const x = (i: number) => pad.l + (i / 12) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const linea = (s: number[]) => s.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <figure className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Días que tarda una compra en las 12 semanas siguientes">
        {[0, 2, 4, 6].map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} className="stroke-marmol-200" strokeWidth={1} />
            <text x={pad.l - 4} y={y(v) + 3} textAnchor="end" className="fill-marmol-400 text-[9px]">
              {v}
            </text>
          </g>
        ))}
        <line x1={pad.l} x2={W - pad.r} y1={y(CASO.metaDias)} y2={y(CASO.metaDias)} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3" />
        <text x={W - pad.r + 3} y={y(CASO.metaDias) + 3} className="fill-amber-600 text-[9px] font-semibold">
          Meta
        </text>
        <path d={linea(sin)} fill="none" className="stroke-marmol-400" strokeWidth={2} strokeDasharray="5 3" />
        <text x={W - pad.r + 3} y={y(sin[12]!) + 3} className="fill-marmol-500 text-[9px]">
          Sin control
        </text>
        {con && (
          <>
            <path d={linea(con)} fill="none" className="stroke-marca-600" strokeWidth={2.5} />
            {con.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r={3} className="fill-marca-600 stroke-white" strokeWidth={1.5}>
                <title>{`Semana ${i}: ${diasTexto(v)}`}</title>
              </circle>
            ))}
            <text x={W - pad.r + 3} y={y(con[12]!) + (Math.abs(con[12]! - sin[12]!) < 0.6 ? 12 : 3)} className="fill-marca-700 text-[9px] font-semibold">
              Con su sistema
            </text>
          </>
        )}
        {[0, 4, 8, 12].map((w) => (
          <text key={w} x={x(w)} y={H - 6} textAnchor="middle" className="fill-marmol-400 text-[9px]">
            {w === 0 ? 'Hoy' : `Sem ${w}`}
          </text>
        ))}
      </svg>
      <figcaption className="text-center text-[10px] text-marmol-400">Días que tarda una compra, semana a semana</figcaption>
    </figure>
  );
}

export function M5Controlar({ onEntregar, pendiente, resumenM4 }: PropsMision & { resumenM4: ResumenMl | null }) {
  const [sel, setSel] = useState<string[]>([]);
  const dias = resumenM4?.valido ? (resumenM4.dias ?? CASO.diasBase) : CASO.diasBase;
  const sin = derivaSemanas(dias, 0);
  return (
    <div className="space-y-4">
      {resumenM4?.valido ? (
        <p className="rounded-lg bg-marca-50 p-2 text-sm text-marmol-700">
          Su plan dejó la compra en <strong>{diasTexto(dias)}</strong>. Pero miren qué pasa si nadie cuida la mejora:
        </p>
      ) : (
        <p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-800">Su plan de la misión 4 no fue aprobado, así que parten de {diasTexto(CASO.diasBase)}. Aun así, elijan cómo sostendrían una mejora.</p>
      )}
      <GraficaDeriva sin={sin} />
      <p className="text-sm font-semibold text-marmol-800">
        🛡️ Elijan hasta {MAX_MECANISMOS} mecanismos de control ({sel.length}/{MAX_MECANISMOS})
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {MECANISMOS.map((m) => {
          const on = sel.includes(m.id);
          const lleno = !on && sel.length >= MAX_MECANISMOS;
          return (
            <button
              key={m.id}
              type="button"
              disabled={lleno}
              onClick={() => setSel((v) => (on ? v.filter((x) => x !== m.id) : [...v, m.id]))}
              className={cn('rounded-xl border-2 p-3 text-left', on ? 'border-secundario bg-secundario/5' : lleno ? 'border-marmol-100 opacity-50' : 'border-marmol-200 hover:border-marca-300')}
            >
              <p className="text-sm font-semibold text-marmol-800">
                {m.emoji} {m.nombre}
              </p>
              <p className="text-xs text-marmol-600">{m.detalle}</p>
            </button>
          );
        })}
      </div>
      <BotonEntregar onClick={() => onEntregar({ mecanismos: sel })} listo={sel.length > 0} pendiente={pendiente} texto="🛡️ Activar el control y simular 12 semanas" aviso="Elijan al menos un mecanismo" />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Revisión después de entregar (qué era lo correcto)
// ----------------------------------------------------------------------------

export function RevisionMision({ numero, respuestas, resumen, resumenM4 }: { numero: number; respuestas: any; resumen: ResumenMl | null; resumenM4: ResumenMl | null }) {
  const r = respuestas ?? {};
  if (numero === 1) {
    return (
      <ul className="space-y-1.5 text-left text-xs">
        {DEFINIR.map((p) => {
          const elegida = p.opciones.find((o) => o.id === r[p.id]);
          const correcta = p.opciones.find((o) => o.correcta)!;
          return (
            <li key={p.id} className={cn('rounded-lg p-2', elegida?.correcta ? 'bg-marca-50' : 'bg-red-50')}>
              <p className="font-semibold text-marmol-800">
                {elegida?.correcta ? '✅' : '❌'} {p.pregunta}
              </p>
              {!elegida?.correcta && elegida && <p className="text-marmol-500">Eligieron: «{elegida.texto}» — {elegida.porque}</p>}
              <p className="text-marmol-700">
                Mejor respuesta: «{correcta.texto}» — {correcta.porque}
              </p>
            </li>
          );
        })}
      </ul>
    );
  }
  if (numero === 2) {
    const marcas = (r.marcas ?? {}) as Record<string, ClaveMuda>;
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[28rem] text-left text-xs">
          <thead className="text-marmol-400">
            <tr>
              <th className="py-1 font-medium">Paso real</th>
              <th className="font-medium">Muda escondida</th>
              <th className="font-medium">Ustedes</th>
            </tr>
          </thead>
          <tbody>
            {PASOS.map((p, i) => {
              const m = marcas[p.id];
              const bien = (m ?? null) === p.muda;
              return (
                <tr key={p.id} className="border-t border-marmol-100">
                  <td className="py-1 pr-2 text-marmol-700">
                    {i + 1}. {p.nombre}
                  </td>
                  <td className="pr-2">{p.muda ? `${MUDAS[p.muda].emoji} ${MUDAS[p.muda].nombre}` : <span className="text-marmol-400">— limpio</span>}</td>
                  <td className={bien ? 'text-alto' : 'text-bajo'}>
                    {bien ? '✓ ' : '✗ '}
                    {m ? MUDAS[m].nombre : 'sin marca'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-marmol-600">
          🍾 Cuello de botella: <strong>Esperar la firma del jefe</strong> (2 días de 5). ⚙️ Solo {tiemposCaso().valorMin} minutos de {Math.round(tiemposCaso().totalMin / 60)} horas agregan valor: menos del 1 %.
        </p>
      </div>
    );
  }
  if (numero === 3) {
    const ish = (r.ishikawa ?? {}) as Record<string, CategoriaIshikawa>;
    return (
      <div className="space-y-2 text-left text-xs">
        <p className="rounded-lg bg-marca-50 p-2 text-marmol-700">
          🔓 <strong>Causa raíz:</strong> {CAUSA_RAIZ}
        </p>
        <ul className="grid gap-1 sm:grid-cols-2">
          {CAUSAS_ISHIKAWA.map((c) => (
            <li key={c.id} className={ish[c.id] === c.categoria ? 'text-marmol-700' : 'text-bajo'}>
              {ish[c.id] === c.categoria ? '✓' : '✗'} {c.texto} → {CATEGORIAS_ISHIKAWA[c.categoria].emoji} {CATEGORIAS_ISHIKAWA[c.categoria].nombre}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (numero === 4 && resumen) {
    return (
      <div className="space-y-2 text-left">
        <p className="text-xs text-marmol-600">Plan: {(resumen.plan ?? []).map((id) => SOLUCIONES.find((s) => s.id === id)).filter(Boolean).map((s) => `${s!.emoji} ${s!.nombre}`).join(' · ') || '—'}</p>
        <AntesDespues dias={resumen.dias ?? CASO.diasBase} defectos={resumen.defectos ?? CASO.defectosBase} valido={Boolean(resumen.valido)} />
        <p className="text-[11px] text-marmol-500">💡 Pista para la próxima: la combinación «firma solo para montos altos» + «bandeja digital con datos obligatorios» ataca la causa raíz y cuesta menos de $300.000.</p>
      </div>
    );
  }
  if (numero === 5 && resumen) {
    const dias = resumenM4?.valido ? (resumenM4.dias ?? CASO.diasBase) : CASO.diasBase;
    const { notas } = sostenibilidad(resumen.mecanismos ?? [], resumenM4?.valido ? (resumenM4.plan ?? []) : []);
    return (
      <div className="space-y-2 text-left">
        <GraficaDeriva sin={derivaSemanas(dias, 0)} con={derivaSemanas(dias, resumen.sostenibilidad ?? 0)} />
        <ul className="space-y-0.5 text-xs text-marmol-600">
          {notas.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </div>
    );
  }
  return null;
}
