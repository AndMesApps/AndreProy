import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/supabase/server';
import { getFacilitador, puedeAdministrarReto } from '@/lib/auth';
import { getJugador } from '@/lib/jugador';
import { nombreFacilitador } from '@/lib/usuarios';
import { registrarJugador } from '@/app/mudalab/actions';
import { RegistroJugador, type EquipoRegistro } from '@/components/juego/registro-jugador';

export const metadata = { title: 'Unirme a MudaLab' };

export default async function UnirseMudaLab({ params }: { params: Promise<{ codigo: string }> }) {
  const codigo = (await params).codigo.toUpperCase();
  const sb = db();
  const { data: s } = await sb.from('ml_sesiones').select('id, codigo, titulo, descripcion, estado, registro_abierto, creado_por').eq('codigo', codigo).maybeSingle();
  if (!s) return <Aviso emoji="🔍" titulo="No encontramos ese caso">Revisa el código {codigo} con la facilitadora.</Aviso>;
  if ((await getJugador(s.id, 'mudalab')) || puedeAdministrarReto(await getFacilitador(), s)) redirect(`/mudalab/${s.id}`);
  if (!s.registro_abierto || s.estado === 'cerrado') return <Aviso emoji="🔒" titulo="La inscripción está cerrada">El caso «{s.titulo}» ya no recibe jugadores nuevos.</Aviso>;

  const facilita = await nombreFacilitador(s.creado_por);
  const [{ data: equipos }, { data: jugadores }] = await Promise.all([
    sb.from('ml_equipos').select('id, nombre, emoji').eq('sesion_id', s.id).order('created_at'),
    sb.from('ml_jugadores').select('equipo_id, es_lider').eq('sesion_id', s.id),
  ]);
  const lista: EquipoRegistro[] = ((equipos ?? []) as { id: string; nombre: string; emoji: string }[]).map((e) => {
    const m = ((jugadores ?? []) as { equipo_id: string; es_lider: boolean }[]).filter((j) => j.equipo_id === e.id);
    return { ...e, miembros: m.length, tieneLider: m.some((j) => j.es_lider) };
  });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="rounded-2xl bg-degradado px-6 py-6 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-widest text-acento">🕵️ MudaLab · Código {s.codigo}</p>
        <h1 className="mt-1 font-display text-2xl font-bold">{s.titulo}</h1>
        <p className="mt-1 text-sm text-white/85">{s.descripcion || 'La misión de recuperar el flujo: una agencia de detectives que caza las 8 Mudas.'}</p>
        {facilita && <p className="mt-2 text-xs text-white/80">🧑‍🏫 Facilita: <strong className="text-white">{facilita}</strong></p>}
      </div>
      <RegistroJugador codigo={s.codigo} equipos={lista} registrar={registrarJugador} rutaJuego="/mudalab" textoEntrar="🕵️ Entrar a la agencia" ejemploEquipo="Ej. Los Cazamudas" />
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
        <Link href="/mudalab" className="boton-secundario mt-5">
          Volver
        </Link>
      </div>
    </div>
  );
}
