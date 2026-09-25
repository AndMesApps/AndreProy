'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { guardarMisionReal, revisarMisionReal } from '@/app/cincos/actions';
import { AUDITORIA, ESCALA, HALLAZGOS, RESULTADOS_REALES, TIPOS_AREA, evidencias, porcentaje5S, type MisionRealMinima } from '@/lib/cincos';
import { leerNumero } from '@/lib/proyectos';
import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

export type MisionRealVista = MisionRealMinima & { comentario: string | null };

const VACIA: MisionRealVista = {
  tipo_area: null,
  area: null,
  problema: null,
  foto_antes: null,
  foto_despues: null,
  hallazgos: {},
  acciones: {},
  resultados: {},
  auditoria_antes: {},
  auditoria_despues: {},
  estado: 'borrador',
  puntos_bono: 0,
  comentario: null,
};

const ESTADO: Record<MisionRealMinima['estado'], { nombre: string; clase: string }> = {
  borrador: { nombre: 'Borrador', clase: 'bg-marmol-100 text-marmol-600' },
  enviada: { nombre: 'Enviada: la facilitadora la revisará', clase: 'bg-blue-100 text-deber' },
  validada: { nombre: '✅ Validada', clase: 'bg-green-100 text-alto' },
  corregir: { nombre: '✏️ Por corregir', clase: 'bg-amber-100 text-medio' },
};

function Auditoria({ valores, onCambio, deshabilitado }: { valores: Record<string, number>; onCambio: (v: Record<string, number>) => void; deshabilitado: boolean }) {
  return (
    <div className="space-y-2">
      {AUDITORIA.map((a, i) => (
        <div key={a.s} className="rounded-lg border border-marmol-200 bg-white p-2">
          <p className="text-sm text-marmol-800">
            <strong>{a.s}:</strong> {a.pregunta}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {ESCALA.map((e, n) => (
              <button
                key={n}
                type="button"
                disabled={deshabilitado}
                onClick={() => onCambio({ ...valores, [String(i)]: n })}
                className={cn('rounded-md border px-2 py-0.5 text-[11px]', valores[String(i)] === n ? 'border-marca-500 bg-marca-50 font-semibold text-marca-700' : 'border-marmol-200 text-marmol-500')}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="text-right text-xs font-semibold text-secundario">% 5S: {porcentaje5S(valores) == null ? '—' : `${Math.round(porcentaje5S(valores)!)} %`}</p>
    </div>
  );
}

function Bloque({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 rounded-xl border border-marmol-200 bg-marmol-50/40 p-3">
      <p className="text-sm font-bold text-secundario">
        {n}. {titulo}
      </p>
      {children}
    </section>
  );
}

/** Lo que llena el equipo en la misión real. */
export function FormularioMisionReal({ sesionId, inicial }: { sesionId: string; inicial: MisionRealVista | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [m, setM] = useState<MisionRealVista>(inicial ?? VACIA);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const bloqueada = m.estado === 'validada';
  const set = <K extends keyof MisionRealVista>(k: K, v: MisionRealVista[K]) => setM((x) => ({ ...x, [k]: v }));

  const guardar = (enviar: boolean) => {
    setAviso(null);
    startTransition(async () => {
      const res = await guardarMisionReal(
        sesionId,
        {
          tipo_area: m.tipo_area ?? undefined,
          area: m.area ?? undefined,
          problema: m.problema ?? undefined,
          foto_antes: m.foto_antes ?? undefined,
          foto_despues: m.foto_despues ?? undefined,
          hallazgos: m.hallazgos,
          acciones: m.acciones,
          resultados: m.resultados,
          auditoria_antes: m.auditoria_antes,
          auditoria_despues: m.auditoria_despues,
        },
        enviar,
      );
      if (!res.ok) return setAviso({ ok: false, texto: res.error });
      setAviso({ ok: true, texto: enviar ? '🚀 ¡Misión real enviada! La facilitadora la revisará.' : 'Guardado.' });
      if (enviar) setM((x) => ({ ...x, estado: 'enviada' }));
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', ESTADO[m.estado].clase)}>{ESTADO[m.estado].nombre}</span>
        <span className="text-xs text-marmol-500">Evidencias: {evidencias(m)} de 10</span>
      </div>
      {m.comentario && <p className="rounded-lg bg-amber-50 p-2 text-sm text-marmol-700">💬 La facilitadora dice: {m.comentario}</p>}

      <Bloque n={1} titulo="¿Qué vamos a mejorar?">
        <div className="flex flex-wrap gap-1">
          {TIPOS_AREA.map((t) => (
            <button
              key={t}
              type="button"
              disabled={bloqueada}
              onClick={() => set('tipo_area', t)}
              className={cn('rounded-full border px-2.5 py-0.5 text-xs', m.tipo_area === t ? 'border-marca-500 bg-marca-50 font-semibold text-marca-700' : 'border-marmol-200 bg-white text-marmol-600')}
            >
              📍 {t}
            </button>
          ))}
        </div>
        <input disabled={bloqueada} value={m.area ?? ''} onChange={(e) => set('area', e.target.value)} placeholder="Ej. Archivo de compras, primer piso" className="campo" />
        <textarea disabled={bloqueada} value={m.problema ?? ''} onChange={(e) => set('problema', e.target.value)} rows={2} placeholder="¿Qué problema tiene hoy ese espacio?" className="campo" />
      </Bloque>

      <Bloque n={2} titulo="Auditoría ANTES (cómo está hoy)">
        <Auditoria valores={m.auditoria_antes} onCambio={(v) => set('auditoria_antes', v)} deshabilitado={bloqueada} />
      </Bloque>

      <Bloque n={3} titulo="Evidencia inicial">
        <input disabled={bloqueada} value={m.foto_antes ?? ''} onChange={(e) => set('foto_antes', e.target.value)} placeholder="Enlace a la foto o video (Drive, WhatsApp, OneDrive…)" className="campo" />
        <p className="text-[11px] text-marmol-400">Tomen la foto desde el mismo ángulo que usarán al final.</p>
      </Bloque>

      <Bloque n={4} titulo="¿Qué encontramos?">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {HALLAZGOS.map((h) => (
            <label key={h.clave} className="text-xs text-marmol-600">
              {h.nombre}
              <input
                disabled={bloqueada}
                inputMode="numeric"
                value={m.hallazgos[h.clave] ?? ''}
                onChange={(e) => set('hallazgos', { ...m.hallazgos, [h.clave]: Math.max(0, Math.round(leerNumero(e.target.value) ?? 0)) })}
                className="campo mt-1 py-1"
              />
            </label>
          ))}
        </div>
      </Bloque>

      <Bloque n={5} titulo="Aplicamos las 5S (una acción por cada S)">
        {AUDITORIA.map((a) => (
          <label key={a.s} className="block text-xs font-medium text-marmol-600">
            {a.s}
            <input
              disabled={bloqueada}
              value={m.acciones[a.s] ?? ''}
              onChange={(e) => set('acciones', { ...m.acciones, [a.s]: e.target.value })}
              placeholder={
                { Clasificar: 'Ej. Sacamos 3 cajas de formatos viejos', Ordenar: 'Ej. Etiquetamos los estantes por proveedor', Limpiar: 'Ej. Arreglamos la gotera y limpiamos', Estandarizar: 'Ej. Foto del estándar pegada en la puerta', Sostener: 'Ej. Revisión de 5 minutos cada viernes' }[a.s]
              }
              className="campo mt-1"
            />
          </label>
        ))}
      </Bloque>

      <Bloque n={6} titulo="Evidencia final">
        <input disabled={bloqueada} value={m.foto_despues ?? ''} onChange={(e) => set('foto_despues', e.target.value)} placeholder="Enlace a la foto o video del después" className="campo" />
      </Bloque>

      <Bloque n={7} titulo="Resultado: ¿qué mejoró?">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {RESULTADOS_REALES.map((r) => (
            <label key={r.clave} className="text-xs text-marmol-600">
              {r.nombre} ({r.unidad})
              <input
                disabled={bloqueada}
                inputMode="decimal"
                value={m.resultados[r.clave] ?? ''}
                onChange={(e) => set('resultados', { ...m.resultados, [r.clave]: Math.max(0, leerNumero(e.target.value) ?? 0) })}
                className="campo mt-1 py-1"
              />
            </label>
          ))}
        </div>
      </Bloque>

      <Bloque n={8} titulo="Auditoría DESPUÉS">
        <Auditoria valores={m.auditoria_despues} onCambio={(v) => set('auditoria_despues', v)} deshabilitado={bloqueada} />
      </Bloque>

      {aviso && <p className={cn('text-sm', aviso.ok ? 'text-alto' : 'text-bajo')}>{aviso.texto}</p>}
      {!bloqueada && (
        <div className="sticky bottom-2 flex flex-wrap justify-center gap-2">
          <button type="button" disabled={pending} onClick={() => guardar(false)} className="boton-secundario shadow">
            Guardar borrador
          </button>
          <button type="button" disabled={pending} onClick={() => guardar(true)} className="boton shadow-lg">
            🚀 Enviar a la facilitadora
          </button>
        </div>
      )}
    </div>
  );
}

/** Revisión de la facilitadora: ver la misión real de un equipo y validarla o devolverla. */
export function RevisionMisionReal({ sesionId, equipoId, mision }: { sesionId: string; equipoId: string; mision: MisionRealVista }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [comentario, setComentario] = useState(mision.comentario ?? '');
  const [bono, setBono] = useState(String(mision.puntos_bono || 50));
  const antes = porcentaje5S(mision.auditoria_antes);
  const despues = porcentaje5S(mision.auditoria_despues);
  const enlace = (u: string | null) =>
    u && /^https?:\/\//.test(u) ? (
      <a href={u} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-marca-700 underline">
        abrir <ExternalLink size={11} />
      </a>
    ) : (
      u ?? '—'
    );
  const revisar = (estado: 'validada' | 'corregir') =>
    startTransition(async () => {
      await revisarMisionReal(sesionId, equipoId, estado, comentario, Number(bono) || 0);
      router.refresh();
    });

  return (
    <div className="space-y-2 text-sm">
      <p>
        📍 <strong>{mision.area ?? 'Sin espacio definido'}</strong>
        {mision.tipo_area && <span className="text-marmol-500"> · {mision.tipo_area}</span>}
      </p>
      {mision.problema && <p className="text-marmol-600">{mision.problema}</p>}
      <p className="text-xs">
        % 5S: <strong>{antes == null ? '—' : `${Math.round(antes)} %`}</strong> → <strong className="text-alto">{despues == null ? '—' : `${Math.round(despues)} %`}</strong> ·
        evidencias {evidencias(mision)}/10 · foto antes: {enlace(mision.foto_antes)} · foto después: {enlace(mision.foto_despues)}
      </p>
      <ul className="ml-4 list-disc text-xs text-marmol-600">
        {AUDITORIA.filter((a) => mision.acciones[a.s]).map((a) => (
          <li key={a.s}>
            <strong>{a.s}:</strong> {mision.acciones[a.s]}
          </li>
        ))}
      </ul>
      <p className="text-xs text-marmol-500">
        {RESULTADOS_REALES.filter((r) => Number(mision.resultados[r.clave]) > 0)
          .map((r) => `${r.nombre}: ${mision.resultados[r.clave]} ${r.unidad}`)
          .join(' · ') || 'Sin resultados medidos'}
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={2} placeholder="Retroalimentación para el equipo" className="campo min-w-[12rem] flex-1" />
        <label className="text-xs text-marmol-500">
          Puntos extra (0–100)
          <input inputMode="numeric" value={bono} onChange={(e) => setBono(e.target.value)} className="campo mt-1 w-20 py-1" />
        </label>
        <button type="button" disabled={pending} onClick={() => revisar('validada')} className="boton py-1.5">
          ✅ Validar
        </button>
        <button type="button" disabled={pending} onClick={() => revisar('corregir')} className="boton-secundario py-1.5">
          ✏️ Devolver para corregir
        </button>
      </div>
    </div>
  );
}
