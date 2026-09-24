'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { actualizarUsuario, cambiarClave, crearUsuario } from '@/app/usuarios/actions';
import type { UsuarioVista } from '@/lib/usuarios';
import type { Rol } from '@/lib/auth';
import { cn, formatearFecha } from '@/lib/utils';
import { KeyRound, Pencil, Plus, X } from 'lucide-react';

const ETIQUETA_ROL: Record<Rol, string> = { admin: '👑 Administrador', lider: '🧭 Líder' };
const TONO_ROL: Record<Rol, string> = { admin: 'bg-secundario/10 text-secundario', lider: 'bg-marca-100 text-marca-700' };

type Respuesta = { ok: boolean; error?: string; aviso?: string };

/** Lista de cuentas con alta, cambio de rol/estado y cambio de clave (solo Administrador). */
export function PanelUsuarios({ usuarios, miId }: { usuarios: UsuarioVista[]; miId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [nuevo, setNuevo] = useState({ email: '', nombre: '', rol: 'lider' as Rol, clave: '' });
  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [editando, setEditando] = useState<{ id: string; nombre: string; rol: Rol; activo: boolean } | null>(null);
  const [clave, setClave] = useState<{ id: string; valor: string } | null>(null);

  const ejecutar = (fn: () => Promise<Respuesta>, despues?: () => void) => {
    setError(null);
    setAviso(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) return setError(res.error ?? 'Error');
      if (res.aviso) setAviso(res.aviso);
      despues?.();
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-bajo">{error}</p>}
      {aviso && <p className="rounded-lg bg-marca-50 px-3 py-2 text-sm text-marca-700">{aviso}</p>}

      {mostrarNuevo ? (
        <form
          className="card space-y-3 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            ejecutar(
              () => crearUsuario({ ...nuevo, clave: nuevo.clave || undefined }),
              () => {
                setNuevo({ email: '', nombre: '', rol: 'lider', clave: '' });
                setMostrarNuevo(false);
              },
            );
          }}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-secundario">Nueva cuenta</h2>
            <button type="button" onClick={() => setMostrarNuevo(false)} className="text-marmol-400 hover:text-marmol-700" aria-label="Cerrar">
              <X size={18} />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="campo" placeholder="Nombre completo" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} required />
            <input className="campo" type="email" placeholder="Correo" value={nuevo.email} onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} required />
            <select className="campo" value={nuevo.rol} onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value as Rol })}>
              <option value="lider">Líder</option>
              <option value="admin">Administrador</option>
            </select>
            <input
              className="campo"
              type="text"
              autoComplete="new-password"
              placeholder="Clave inicial (mínimo 8)"
              value={nuevo.clave}
              onChange={(e) => setNuevo({ ...nuevo, clave: e.target.value })}
            />
          </div>
          <p className="text-xs text-marmol-400">
            Entrégale a la persona su correo y esta clave; entra por “Soy facilitador”. Si la cuenta ya existe en Supabase, deja la clave vacía: solo se le
            asigna el rol.
          </p>
          <button type="submit" disabled={pending} className="boton">
            {pending ? 'Guardando…' : 'Crear cuenta'}
          </button>
        </form>
      ) : (
        <button onClick={() => setMostrarNuevo(true)} className="boton">
          <Plus size={16} /> Nueva cuenta
        </button>
      )}

      <div className="card divide-y divide-marmol-100">
        {usuarios.map((u) => {
          const enEdicion = editando?.id === u.id;
          const enClave = clave?.id === u.id;
          return (
            <div key={u.id} className="space-y-3 p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <div className="min-w-0 flex-1">
                  <p className={cn('truncate font-medium', u.activo ? 'text-marmol-900' : 'text-marmol-400 line-through')}>{u.nombre || u.email}</p>
                  <p className="truncate text-xs text-marmol-400">
                    {u.email}
                    {u.ultimoIngreso ? ` · último ingreso ${formatearFecha(u.ultimoIngreso)}` : ' · nunca ha ingresado'}
                  </p>
                </div>
                {u.rol ? (
                  <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', TONO_ROL[u.rol])}>{ETIQUETA_ROL[u.rol]}</span>
                ) : (
                  <span className="rounded-full bg-marmol-100 px-2 py-0.5 text-[11px] font-semibold text-marmol-500">Sin acceso</span>
                )}
                {u.principal && <span className="text-[11px] text-marmol-400">principal</span>}
                {!u.activo && u.rol && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-bajo">Desactivado</span>}
                {!u.principal && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setClave(null);
                        setEditando(enEdicion ? null : { id: u.id, nombre: u.nombre || u.email.split('@')[0]!, rol: u.rol ?? 'lider', activo: u.rol ? u.activo : true });
                      }}
                      className="rounded-md p-1.5 text-marmol-400 hover:bg-marmol-100 hover:text-secundario"
                      aria-label="Editar"
                      title={u.rol ? 'Editar rol' : 'Dar acceso'}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => {
                        setEditando(null);
                        setClave(enClave ? null : { id: u.id, valor: '' });
                      }}
                      className="rounded-md p-1.5 text-marmol-400 hover:bg-marmol-100 hover:text-secundario"
                      aria-label="Cambiar clave"
                      title="Cambiar clave"
                    >
                      <KeyRound size={15} />
                    </button>
                  </div>
                )}
              </div>

              {enEdicion && editando && (
                <form
                  className="grid gap-2 rounded-lg bg-marmol-50 p-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"
                  onSubmit={(e) => {
                    e.preventDefault();
                    ejecutar(() => actualizarUsuario(u.id, { nombre: editando.nombre, rol: editando.rol, activo: editando.activo }), () => setEditando(null));
                  }}
                >
                  <input className="campo" value={editando.nombre} onChange={(e) => setEditando({ ...editando, nombre: e.target.value })} placeholder="Nombre" required />
                  <select className="campo" value={editando.rol} onChange={(e) => setEditando({ ...editando, rol: e.target.value as Rol })}>
                    <option value="lider">Líder</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <label className="flex items-center gap-2 text-sm text-marmol-600">
                    <input
                      type="checkbox"
                      checked={editando.activo}
                      disabled={u.id === miId}
                      onChange={(e) => setEditando({ ...editando, activo: e.target.checked })}
                    />
                    Activo
                  </label>
                  <button type="submit" disabled={pending} className="boton">
                    Guardar
                  </button>
                </form>
              )}

              {enClave && clave && (
                <form
                  className="flex flex-col gap-2 rounded-lg bg-marmol-50 p-3 sm:flex-row"
                  onSubmit={(e) => {
                    e.preventDefault();
                    ejecutar(
                      async () => {
                        const res = await cambiarClave(u.id, clave.valor);
                        return res.ok ? { ok: true, aviso: `Clave cambiada. Entrégasela a ${u.nombre || u.email}.` } : res;
                      },
                      () => setClave(null),
                    );
                  }}
                >
                  <input
                    className="campo"
                    type="text"
                    autoComplete="new-password"
                    placeholder="Nueva clave (mínimo 8)"
                    value={clave.valor}
                    onChange={(e) => setClave({ ...clave, valor: e.target.value })}
                    required
                  />
                  <button type="submit" disabled={pending} className="boton shrink-0">
                    Cambiar clave
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-marmol-400">
        “Principal” son los correos de la variable ADMIN_EMAILS en Vercel: siempre son administradores y no se editan aquí. Al desactivar una cuenta, la persona ya
        no puede iniciar sesión y sus retos quedan a cargo de los administradores.
      </p>
    </div>
  );
}
