import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/supabase/server';
import { getFacilitador, puedeAdministrarReto } from '@/lib/auth';
import { getJugador } from '@/lib/jugador';
import { registrarJugador } from '@/app/kaizen/actions';
import { RegistroJugador, type EquipoRegistro } from '@/components/juego/registro-jugador';

export const metadata = { title: 'Unirme a la Carrera Kaizen' };

export default async function UnirseKaizenPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo: crudo } = await params;
  const codigo = crudo.toUpperCase();
  const sb = db();
  const { data: sesion } = await sb
    .from('kz_sesiones')
    .select('id, codigo, titulo, descripcion, producto, estado, registro_abierto, creado_por')
    .eq('codigo', codigo)
    .maybeSingle();

  if (!sesion) {
    return (
      <Aviso emoji="🔍" titulo="No encontramos esa carrera">
        Revisa el código <strong className="font-mono tracking-widest">{codigo}</strong> con el facilitador y vuelve a intentarlo.
      </Aviso>
    );
  }

  // Quien ya juega en la carrera, o la administra, pasa directo al tablero.
  if ((await getJugador(sesion.id, 'kaizen')) || puedeAdministrarReto(await getFacilitador(), sesion)) redirect(`/kaizen/${sesion.id}`);

  if (!sesion.registro_abierto || sesion.estado === 'cerrado') {
    return (
      <Aviso emoji="🔒" titulo="La inscripción está cerrada">
        La carrera <strong>{sesion.titulo}</strong> ya no recibe jugadores nuevos. Si crees que es un error, pídele al facilitador que abra la inscripción.
      </Aviso>
    );
  }

  const [{ data: equipos }, { data: jugadores }] = await Promise.all([
    sb.from('kz_equipos').select('id, nombre, emoji').eq('sesion_id', sesion.id).order('created_at'),
    sb.from('kz_jugadores').select('equipo_id, es_lider').eq('sesion_id', sesion.id),
  ]);
  const listaEquipos: EquipoRegistro[] = ((equipos ?? []) as { id: string; nombre: string; emoji: string }[]).map((e) => {
    const miembros = ((jugadores ?? []) as { equipo_id: string; es_lider: boolean }[]).filter((j) => j.equipo_id === e.id);
    return { ...e, miembros: miembros.length, tieneLider: miembros.some((j) => j.es_lider) };
  });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="rounded-2xl bg-degradado px-6 py-6 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-widest text-acento">Carrera Kaizen · Código {sesion.codigo}</p>
        <h1 className="mt-1 font-display text-2xl font-bold">{sesion.titulo}</h1>
        <p className="mt-1 text-sm text-white/85">{sesion.descripcion || `Hoy producimos: ${sesion.producto}.`}</p>
      </div>
      <RegistroJugador
        codigo={sesion.codigo}
        equipos={listaEquipos}
        registrar={registrarJugador}
        rutaJuego="/kaizen"
        textoEntrar="🏁 Entrar a la carrera"
        ejemploEquipo="Ej. Los Mejoradores"
      />
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
        <Link href="/kaizen" className="boton-secundario mt-5">
          Volver
        </Link>
      </div>
    </div>
  );
}
