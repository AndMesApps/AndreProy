import { EnlaceAyuda } from '@/components/manual/enlace-ayuda';
import { redirect } from 'next/navigation';
import { getFacilitador } from '@/lib/auth';
import { listarUsuarios } from '@/lib/usuarios';
import { PanelUsuarios } from '@/components/usuarios/panel-usuarios';

export const metadata = { title: 'Usuarios' };

/** Solo el Administrador: crea cuentas de administradores y líderes y les cambia el rol. */
export default async function UsuariosPage() {
  const facilitador = await getFacilitador();
  if (facilitador?.rol !== 'admin') redirect('/makigami');
  const usuarios = await listarUsuarios();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-secundario">Usuarios</h1>
          <EnlaceAyuda seccion="usuarios" />
        </div>
        <p className="mt-1 text-sm text-marmol-500">
          Aquí creas las cuentas de quienes dirigen los retos. Los jugadores no necesitan cuenta: entran con el código de cada reto.
        </p>
      </div>

      <div className="grid gap-3 text-sm sm:grid-cols-3">
        <div className="card p-4">
          <p className="font-semibold text-secundario">👑 Administrador</p>
          <p className="mt-1 text-xs text-marmol-500">Ve y administra todos los retos y crea las cuentas de esta pantalla.</p>
        </div>
        <div className="card p-4">
          <p className="font-semibold text-secundario">🧭 Líder</p>
          <p className="mt-1 text-xs text-marmol-500">Crea retos y administra solo los suyos: su mapa, sus equipos y sus jugadores.</p>
        </div>
        <div className="card p-4">
          <p className="font-semibold text-secundario">🎯 Jugador</p>
          <p className="mt-1 text-xs text-marmol-500">Sin cuenta. Entra con el código del reto y solo juega.</p>
        </div>
      </div>

      <PanelUsuarios usuarios={usuarios} miId={facilitador.id} />
    </div>
  );
}
