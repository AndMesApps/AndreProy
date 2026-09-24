'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { registrarJugador } from '@/app/makigami/actions';
import { ANTIGUEDADES, RANGOS_EDAD, SEXOS, type Sexo } from '@/lib/makigami';
import { cn } from '@/lib/utils';
import { ChevronLeft, Crown, Plus } from 'lucide-react';

export interface EquipoRegistro {
  id: string;
  nombre: string;
  emoji: string;
  miembros: number;
  tieneLider: boolean;
}

const VACIO = {
  nombres: '',
  apellidos: '',
  cargo: '',
  esLider: false,
  sexo: '' as Sexo | '',
  rangoEdad: '',
  organizacion: '',
  area: '',
  antiguedad: '',
  email: '',
  celular: '',
  aceptaDatos: false,
};

/**
 * Inscripción en dos pasos: 1) elegir (o crear) el equipo, 2) los datos del
 * jugador. El juego se hace por equipos, por eso el equipo va primero.
 */
export function RegistroJugador({ codigo, equipos }: { codigo: string; equipos: EquipoRegistro[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [paso, setPaso] = useState<1 | 2>(1);
  const [equipoId, setEquipoId] = useState<string | null>(null);
  const [creando, setCreando] = useState(equipos.length === 0);
  const [nuevoEquipo, setNuevoEquipo] = useState('');
  const [datos, setDatos] = useState(VACIO);

  const equipo = equipos.find((e) => e.id === equipoId);
  const liderOcupado = Boolean(equipo?.tieneLider);
  const set =
    <K extends keyof typeof VACIO>(campo: K) =>
    (valor: (typeof VACIO)[K]) =>
      setDatos((d) => ({ ...d, [campo]: valor }));

  const equipoListo = creando ? nuevoEquipo.trim().length >= 2 : Boolean(equipoId);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!datos.sexo) return setError('Elige una opción de sexo.');
    startTransition(async () => {
      const res = await registrarJugador({
        codigo,
        equipoId: creando ? undefined : (equipoId ?? undefined),
        nuevoEquipo: creando ? nuevoEquipo : undefined,
        nombres: datos.nombres,
        apellidos: datos.apellidos,
        cargo: datos.cargo,
        esLider: datos.esLider,
        sexo: datos.sexo,
        rangoEdad: datos.rangoEdad,
        organizacion: datos.organizacion,
        area: datos.area,
        antiguedad: datos.antiguedad,
        email: datos.email,
        celular: datos.celular,
        aceptaDatos: datos.aceptaDatos as true,
      });
      if (!res.ok) return setError(res.error);
      router.push(`/makigami/${res.retoId}`);
      router.refresh();
    });
  }

  if (paso === 1) {
    return (
      <div className="card space-y-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-marca-600">Paso 1 de 2</p>
          <h2 className="font-display text-lg font-semibold text-secundario">¿En qué equipo juegas?</h2>
          <p className="text-sm text-marmol-500">Si tu equipo ya se registró, elígelo. Si eres el primero de tu equipo, créalo.</p>
        </div>

        {equipos.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {equipos.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => {
                  setEquipoId(e.id);
                  setCreando(false);
                }}
                className={cn(
                  'flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition',
                  !creando && equipoId === e.id ? 'border-marca-500 bg-marca-50' : 'border-marmol-200 hover:border-marca-300'
                )}
              >
                <span className="text-2xl">{e.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-marmol-800">{e.nombre}</span>
                  <span className="text-xs text-marmol-400">
                    {e.miembros} {e.miembros === 1 ? 'jugador' : 'jugadores'}
                    {e.tieneLider && ' · con líder'}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}

        {creando ? (
          <div className="rounded-xl border-2 border-dashed border-marca-300 bg-marca-50/50 p-3">
            <label className="text-sm font-medium text-marmol-700">
              Nombre del nuevo equipo
              <input
                autoFocus
                value={nuevoEquipo}
                onChange={(e) => setNuevoEquipo(e.target.value)}
                maxLength={40}
                placeholder="Ej. Los Cazadores de Esperas"
                className="campo mt-1"
              />
            </label>
            {equipos.length > 0 && (
              <button type="button" onClick={() => setCreando(false)} className="mt-2 text-xs text-marmol-500 hover:text-secundario">
                Mejor elijo un equipo de la lista
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setCreando(true);
              setEquipoId(null);
            }}
            className="inline-flex items-center gap-1 text-sm font-medium text-marca-600 hover:underline"
          >
            <Plus size={15} /> Mi equipo no está: crear uno nuevo
          </button>
        )}

        <div className="flex justify-end border-t border-marmol-100 pt-4">
          <button type="button" disabled={!equipoListo} onClick={() => setPaso(2)} className="boton">
            Continuar
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="card space-y-4 p-5">
      <div>
        <button type="button" onClick={() => setPaso(1)} className="mb-1 inline-flex items-center gap-0.5 text-xs text-marmol-500 hover:text-secundario">
          <ChevronLeft size={12} /> Cambiar equipo
        </button>
        <p className="text-xs font-semibold uppercase tracking-wide text-marca-600">Paso 2 de 2</p>
        <h2 className="font-display text-lg font-semibold text-secundario">Tus datos</h2>
        <p className="text-sm text-marmol-500">
          Equipo: <strong className="text-marmol-800">{creando ? `${nuevoEquipo.trim()} (nuevo)` : `${equipo?.emoji} ${equipo?.nombre}`}</strong>
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Campo etiqueta="Nombres *">
          <input required value={datos.nombres} onChange={(e) => set('nombres')(e.target.value)} autoComplete="given-name" maxLength={80} className="campo" />
        </Campo>
        <Campo etiqueta="Apellidos *">
          <input required value={datos.apellidos} onChange={(e) => set('apellidos')(e.target.value)} autoComplete="family-name" maxLength={80} className="campo" />
        </Campo>
        <Campo etiqueta="Cargo *">
          <input required value={datos.cargo} onChange={(e) => set('cargo')(e.target.value)} autoComplete="organization-title" maxLength={100} placeholder="Ej. Analista de compras" className="campo" />
        </Campo>
        <Campo etiqueta="Rango de edad">
          <select value={datos.rangoEdad} onChange={(e) => set('rangoEdad')(e.target.value)} className="campo">
            <option value="">Prefiero no decirlo</option>
            {RANGOS_EDAD.map((r) => (
              <option key={r} value={r}>
                {r} años
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-marmol-700">Sexo *</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {(Object.keys(SEXOS) as Sexo[]).map((s) => (
            <label
              key={s}
              className={cn(
                'cursor-pointer rounded-lg border px-3 py-1.5 text-sm transition',
                datos.sexo === s ? 'border-marca-500 bg-marca-50 font-semibold text-marca-700' : 'border-marmol-200 text-marmol-600 hover:border-marca-300'
              )}
            >
              <input type="radio" name="sexo" value={s} checked={datos.sexo === s} onChange={() => set('sexo')(s)} className="sr-only" />
              {SEXOS[s]}
            </label>
          ))}
        </div>
      </fieldset>

      <label
        className={cn(
          'flex items-start gap-3 rounded-xl border p-3 transition',
          liderOcupado ? 'border-marmol-200 opacity-60' : 'cursor-pointer border-amber-200 bg-amber-50/60 hover:border-amber-300'
        )}
      >
        <input type="checkbox" disabled={liderOcupado} checked={datos.esLider} onChange={(e) => set('esLider')(e.target.checked)} className="mt-1" />
        <span>
          <span className="flex items-center gap-1 text-sm font-semibold text-marmol-800">
            <Crown size={14} className="text-acento" /> Soy el líder de mi equipo
          </span>
          <span className="block text-xs text-marmol-500">
            {liderOcupado ? 'Tu equipo ya tiene líder.' : 'El líder coordina a su equipo durante el juego. Solo puede haber uno por equipo.'}
          </span>
        </span>
      </label>

      <details className="rounded-xl border border-marmol-200 p-3">
        <summary className="cursor-pointer text-sm font-medium text-marmol-700">Más datos (opcionales)</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Campo etiqueta="Empresa u organización">
            <input value={datos.organizacion} onChange={(e) => set('organizacion')(e.target.value)} autoComplete="organization" maxLength={120} className="campo" />
          </Campo>
          <Campo etiqueta="Área o dependencia">
            <input value={datos.area} onChange={(e) => set('area')(e.target.value)} maxLength={120} placeholder="Ej. Talento Humano" className="campo" />
          </Campo>
          <Campo etiqueta="Tiempo en el cargo">
            <select value={datos.antiguedad} onChange={(e) => set('antiguedad')(e.target.value)} className="campo">
              <option value="">—</option>
              {ANTIGUEDADES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Celular">
            <input type="tel" value={datos.celular} onChange={(e) => set('celular')(e.target.value)} autoComplete="tel" maxLength={30} className="campo" />
          </Campo>
          <Campo etiqueta="Correo electrónico" className="sm:col-span-2">
            <input type="email" value={datos.email} onChange={(e) => set('email')(e.target.value)} autoComplete="email" maxLength={120} className="campo" />
          </Campo>
        </div>
      </details>

      <label className="flex cursor-pointer items-start gap-3 text-xs text-marmol-600">
        <input type="checkbox" required checked={datos.aceptaDatos} onChange={(e) => set('aceptaDatos')(e.target.checked)} className="mt-0.5" />
        <span>
          Autorizo el tratamiento de mis datos personales para participar en esta actividad de formación y para generar sus resultados y estadísticas, de
          acuerdo con la Ley 1581 de 2012. *
        </span>
      </label>

      {error && <p className="text-sm text-bajo">{error}</p>}
      <div className="flex justify-end border-t border-marmol-100 pt-4">
        <button type="submit" disabled={pending || !datos.aceptaDatos} className="boton">
          {pending ? 'Registrando…' : '🎯 Entrar al juego'}
        </button>
      </div>
    </form>
  );
}

function Campo({ etiqueta, className, children }: { etiqueta: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn('block text-sm font-medium text-marmol-700', className)}>
      {etiqueta}
      <div className="mt-1 font-normal">{children}</div>
    </label>
  );
}
