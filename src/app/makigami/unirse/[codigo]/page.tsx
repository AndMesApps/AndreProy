import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/supabase/server';
import { getFacilitador, puedeAdministrarReto } from '@/lib/auth';
import { getJugador } from '@/lib/jugador';
import { nombreFacilitador } from '@/lib/usuarios';
import { registrarJugador } from '@/app/makigami/actions';
import { RegistroJugador, type EquipoRegistro } from '@/components/juego/registro-jugador';

export const metadata = { title: 'Unirme a la Cacería Makigami' };

export default async function UnirsePage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo: crudo } = await params;
  const codigo = crudo.toUpperCase();
  const sb = db();
  const { data: reto } = await sb
    .from('mk_retos')
    .select('id, codigo, titulo, descripcion, estado, registro_abierto, creado_por')
    .eq('codigo', codigo)
    .maybeSingle();

  if (!reto) {
    return (
      <Aviso emoji="🔍" titulo="No encontramos ese reto">
        Revisa el código <strong className="font-mono tracking-widest">{codigo}</strong> con el facilitador y vuelve a intentarlo.
      </Aviso>
    );
  }

  // Quien ya juega en el reto, o lo administra, pasa directo al tablero.
  if ((await getJugador(reto.id)) || puedeAdministrarReto(await getFacilitador(), reto)) redirect(`/makigami/${reto.id}`);

  if (!reto.registro_abierto || reto.estado === 'cerrado') {
    return (
      <Aviso emoji="🔒" titulo="La inscripción está cerrada">
        El reto <strong>{reto.titulo}</strong> ya no recibe jugadores nuevos. Si crees que es un error, pídele al facilitador que abra la inscripción.
      </Aviso>
    );
  }

  const facilita = await nombreFacilitador(reto.creado_por);
  const [{ data: equipos }, { data: jugadores }] = await Promise.all([
    sb.from('mk_equipos').select('id, nombre, emoji').eq('reto_id', reto.id).order('created_at'),
    sb.from('mk_jugadores').select('equipo_id, es_lider').eq('reto_id', reto.id),
  ]);
  const listaEquipos: EquipoRegistro[] = ((equipos ?? []) as { id: string; nombre: string; emoji: string }[]).map((e) => {
    const miembros = ((jugadores ?? []) as { equipo_id: string; es_lider: boolean }[]).filter((j) => j.equipo_id === e.id);
    return { ...e, miembros: miembros.length, tieneLider: miembros.some((j) => j.es_lider) };
  });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="rounded-2xl bg-degradado px-6 py-6 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-widest text-acento">Cacería Makigami · Código {reto.codigo}</p>
        <h1 className="mt-1 font-display text-2xl font-bold">{reto.titulo}</h1>
        {reto.descripcion && <p className="mt-1 text-sm text-white/85">{reto.descripcion}</p>}
        {facilita && <p className="mt-2 text-xs text-white/80">🧑‍🏫 Facilita: <strong className="text-white">{facilita}</strong></p>}
      </div>
      <RegistroJugador codigo={reto.codigo} equipos={listaEquipos} registrar={registrarJugador} rutaJuego="/makigami" />
    </div>
  );
}

function Aviso({ emoji, titulo, children }: { emoji: string; titulo: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md pt-8">
      <div className="card p-8 text-center">
        <p className="text-4xl">{emoji}</p>
        <h1 className="mt-2 font-display text-xl font-semibold text-secundario">{titulo}</h1>
        <p className="mt-2 text-sm text-marmol-600">{children}</p>
        <Link href="/makigami" className="boton-secundario mt-5">
          Volver
        </Link>
      </div>
    </div>
  );
}
