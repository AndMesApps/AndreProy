'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChevronDown, LogOut, Menu, X } from 'lucide-react';

export interface UsuarioMenu {
  nombre: string;
  email: string;
  rol: string;
  esAdmin: boolean;
}

interface Opcion {
  href: string;
  emoji: string;
  nombre: string;
  ayuda?: string;
}

interface Grupo {
  id: string;
  emoji: string;
  nombre: string;
  opciones: Opcion[];
}

const JUEGOS: Opcion[] = [
  { href: '/juegos', emoji: '🎲', nombre: 'Todos los juegos', ayuda: 'Elegir juego o entrar con un código' },
  { href: '/makigami', emoji: '🎯', nombre: 'Cacería Makigami', ayuda: 'Diagnosticar un proceso' },
  { href: '/kaizen', emoji: '🔁', nombre: 'Carrera Kaizen', ayuda: 'Entrenar la mejora continua' },
  { href: '/cincos', emoji: '🧹', nombre: 'Reto 5S', ayuda: 'Crear hábitos de orden' },
  { href: '/mudalab', emoji: '🕵️', nombre: 'MudaLab', ayuda: 'Resolver problemas con DMAIC' },
  { href: '/riesgo', emoji: '🗺️', nombre: 'La Ruta del Riesgo', ayuda: 'Prevenir riesgos de LA/FT' },
];

function gruposDe(usuario: UsuarioMenu | null): Grupo[] {
  if (!usuario) return [{ id: 'juegos', emoji: '🎲', nombre: 'Juegos', opciones: JUEGOS }];
  return [
    {
      id: 'consultoria',
      emoji: '💼',
      nombre: 'Consultoría',
      opciones: [
        { href: '/proyectos', emoji: '🗂️', nombre: 'Proyectos', ayuda: 'Cronograma, objetivos, bitácora y cobros' },
        { href: '/procesos', emoji: '📊', nombre: 'Control de procesos', ayuda: 'Indicadores, metas y plan de acción' },
        { href: '/finanzas', emoji: '💰', nombre: 'Mis finanzas', ayuda: 'Rentabilidad, impuestos y seguridad social' },
      ],
    },
    { id: 'juegos', emoji: '🎲', nombre: 'Juegos', opciones: JUEGOS },
  ];
}

const activa = (ruta: string, href: string) => ruta === href || ruta.startsWith(`${href}/`);

/**
 * Menú principal agrupado. En computador: menús desplegables. En tablet y
 * celular: botón ☰ que abre todas las opciones por grupos.
 */
export function MenuPrincipal({ usuario }: { usuario: UsuarioMenu | null }) {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState<string | null>(null);
  const [movil, setMovil] = useState(false);
  const barra = useRef<HTMLDivElement>(null);
  const grupos = gruposDe(usuario);

  // Cerrar al cambiar de página, al tocar fuera o con Escape.
  useEffect(() => {
    setAbierto(null);
    setMovil(false);
  }, [ruta]);
  useEffect(() => {
    const fuera = (e: MouseEvent) => {
      if (barra.current && !barra.current.contains(e.target as Node)) setAbierto(null);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAbierto(null);
        setMovil(false);
      }
    };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', esc);
    };
  }, []);

  const enlace = (href: string, contenido: React.ReactNode, clase?: string) => (
    <Link href={href} aria-current={activa(ruta, href) ? 'page' : undefined} className={cn('rounded-lg px-3 py-2 transition', activa(ruta, href) ? 'bg-marca-50 font-semibold text-marca-700' : 'text-marmol-600 hover:bg-marmol-100 hover:text-secundario', clase)}>
      {contenido}
    </Link>
  );

  return (
    <div ref={barra} className="flex min-w-0 flex-1 items-center gap-1">
      {/* Computador */}
      <nav className="hidden items-center gap-1 text-sm lg:flex" aria-label="Menú principal">
        {usuario && enlace('/panel', '🧭 Mi panel')}
        {grupos.map((g) => {
          const dentro = g.opciones.some((o) => activa(ruta, o.href));
          return (
            <div key={g.id} className="relative">
              <button
                type="button"
                aria-expanded={abierto === g.id}
                onClick={() => setAbierto(abierto === g.id ? null : g.id)}
                className={cn('inline-flex items-center gap-1 rounded-lg px-3 py-2 transition', dentro ? 'bg-marca-50 font-semibold text-marca-700' : 'text-marmol-600 hover:bg-marmol-100 hover:text-secundario')}
              >
                {g.emoji} {g.nombre} <ChevronDown size={14} className={cn('transition', abierto === g.id && 'rotate-180')} />
              </button>
              {abierto === g.id && (
                <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border border-marmol-200 bg-white p-1.5 shadow-xl">
                  {g.opciones.map((o) => (
                    <Link
                      key={o.href}
                      href={o.href}
                      className={cn('flex items-start gap-2.5 rounded-lg px-2.5 py-2', activa(ruta, o.href) ? 'bg-marca-50' : 'hover:bg-marmol-50')}
                    >
                      <span className="text-lg leading-tight">{o.emoji}</span>
                      <span>
                        <span className={cn('block text-sm', activa(ruta, o.href) ? 'font-semibold text-marca-700' : 'font-medium text-marmol-800')}>{o.nombre}</span>
                        {o.ayuda && <span className="block text-[11px] text-marmol-500">{o.ayuda}</span>}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {enlace('/ayuda', '❓ Ayuda')}
      </nav>

      <div className="ml-auto flex items-center gap-2 text-sm">
        {usuario ? (
          <div className="relative hidden lg:block">
            <button
              type="button"
              aria-expanded={abierto === 'cuenta'}
              onClick={() => setAbierto(abierto === 'cuenta' ? null : 'cuenta')}
              className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-marmol-100"
              title={usuario.email}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secundario text-xs font-bold text-white">{usuario.nombre.trim().charAt(0).toUpperCase()}</span>
              <span className="max-w-[10rem] truncate text-xs text-marmol-700">{usuario.nombre}</span>
              <ChevronDown size={14} className="text-marmol-400" />
            </button>
            {abierto === 'cuenta' && (
              <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-xl border border-marmol-200 bg-white p-1.5 shadow-xl">
                <div className="px-2.5 py-2">
                  <p className="truncate text-sm font-semibold text-marmol-800">{usuario.nombre}</p>
                  <p className="truncate text-[11px] text-marmol-500">{usuario.email}</p>
                  <span className="mt-1 inline-block rounded-full bg-marca-100 px-2 py-0.5 text-[11px] font-semibold text-marca-700">{usuario.rol}</span>
                </div>
                {usuario.esAdmin && (
                  <Link href="/usuarios" className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-marmol-700 hover:bg-marmol-50">
                    👥 Usuarios y permisos
                  </Link>
                )}
                <form action="/salir" method="post">
                  <button className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-marmol-700 hover:bg-red-50 hover:text-bajo">
                    <LogOut size={15} /> Salir
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <Link href="/ingresar" className="hidden text-marmol-500 hover:text-marca-600 lg:inline">
            Soy facilitador
          </Link>
        )}

        {/* Tablet y celular */}
        <button
          type="button"
          onClick={() => setMovil(!movil)}
          aria-expanded={movil}
          aria-label={movil ? 'Cerrar menú' : 'Abrir menú'}
          className="inline-flex items-center gap-1.5 rounded-lg border border-marmol-200 px-3 py-1.5 text-sm font-medium text-secundario lg:hidden"
        >
          {movil ? <X size={18} /> : <Menu size={18} />} Menú
        </button>
      </div>

      {movil && (
        <div className="fixed inset-x-0 bottom-0 top-14 z-50 overflow-y-auto bg-white lg:hidden">
          <nav className="mx-auto max-w-3xl space-y-4 px-4 py-4" aria-label="Menú principal">
            {usuario && (
              <div className="flex items-center gap-3 rounded-xl bg-marmol-50 p-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secundario font-bold text-white">{usuario.nombre.trim().charAt(0).toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-marmol-800">{usuario.nombre}</p>
                  <p className="truncate text-xs text-marmol-500">
                    {usuario.rol} · {usuario.email}
                  </p>
                </div>
              </div>
            )}
            {usuario && (
              <Link href="/panel" className={cn('flex items-center gap-3 rounded-xl border p-3 text-base', activa(ruta, '/panel') ? 'border-marca-300 bg-marca-50 font-semibold text-marca-700' : 'border-marmol-200 font-medium text-secundario')}>
                <span className="text-2xl">🧭</span> Mi panel
              </Link>
            )}
            {grupos.map((g) => (
              <div key={g.id}>
                <p className="mb-1.5 px-1 text-[11px] font-bold uppercase tracking-widest text-marmol-400">
                  {g.emoji} {g.nombre}
                </p>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {g.opciones.map((o) => (
                    <Link
                      key={o.href}
                      href={o.href}
                      className={cn('flex items-start gap-3 rounded-xl border p-3', activa(ruta, o.href) ? 'border-marca-300 bg-marca-50' : 'border-marmol-200 hover:border-marca-300')}
                    >
                      <span className="text-2xl leading-none">{o.emoji}</span>
                      <span>
                        <span className={cn('block text-sm', activa(ruta, o.href) ? 'font-semibold text-marca-700' : 'font-medium text-marmol-800')}>{o.nombre}</span>
                        {o.ayuda && <span className="block text-xs text-marmol-500">{o.ayuda}</span>}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <div>
              <p className="mb-1.5 px-1 text-[11px] font-bold uppercase tracking-widest text-marmol-400">⚙️ Más</p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                <Link href="/ayuda" className={cn('flex items-center gap-3 rounded-xl border p-3 text-sm font-medium', activa(ruta, '/ayuda') ? 'border-marca-300 bg-marca-50 text-marca-700' : 'border-marmol-200 text-marmol-800')}>
                  <span className="text-2xl">❓</span> Ayuda: manual de usuario
                </Link>
                {usuario?.esAdmin && (
                  <Link href="/usuarios" className={cn('flex items-center gap-3 rounded-xl border p-3 text-sm font-medium', activa(ruta, '/usuarios') ? 'border-marca-300 bg-marca-50 text-marca-700' : 'border-marmol-200 text-marmol-800')}>
                    <span className="text-2xl">👥</span> Usuarios y permisos
                  </Link>
                )}
                {usuario ? (
                  <form action="/salir" method="post">
                    <button className="flex w-full items-center gap-3 rounded-xl border border-marmol-200 p-3 text-left text-sm font-medium text-bajo">
                      <LogOut size={22} /> Salir
                    </button>
                  </form>
                ) : (
                  <Link href="/ingresar" className="flex items-center gap-3 rounded-xl border border-marmol-200 p-3 text-sm font-medium text-marmol-800">
                    <span className="text-2xl">🔑</span> Soy facilitador
                  </Link>
                )}
              </div>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
