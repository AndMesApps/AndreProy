import Link from 'next/link';

/** Enlace pequeño al tema del manual que explica la pantalla actual. */
export function EnlaceAyuda({ seccion, claro = false }: { seccion: string; claro?: boolean }) {
  return (
    <Link
      href={`/ayuda#${seccion}`}
      className={
        claro
          ? 'no-imprimir inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold text-white hover:bg-white/25'
          : 'no-imprimir inline-flex items-center gap-1 text-xs font-semibold text-marca-600 hover:underline'
      }
    >
      ❓ ¿Cómo se usa?
    </Link>
  );
}
