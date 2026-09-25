import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Inter, Sora } from 'next/font/google';
import { getFacilitador, ROLES } from '@/lib/auth';
import { MenuPrincipal } from '@/components/menu-principal';
import './globals.css';

const sora = Sora({ subsets: ['latin'], variable: '--font-display' });
const inter = Inter({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: { default: 'AndMesApps', template: '%s · AndMesApps' },
  description: 'Juegos y herramientas de formación en mejora continua.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const facilitador = await getFacilitador();
  return (
    <html lang="es" className={`${sora.variable} ${inter.variable}`}>
      <body className="min-h-screen">
        <header className="no-imprimir sticky top-0 z-40 border-b border-marmol-200 bg-white">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:gap-4">
            <Link href="/" className="shrink-0 font-display text-lg font-bold text-secundario">
              AndMes<span className="text-marca-500">Apps</span>
            </Link>
            <MenuPrincipal usuario={facilitador ? { nombre: facilitador.nombre || facilitador.email, email: facilitador.email, rol: ROLES[facilitador.rol], esAdmin: facilitador.rol === 'admin' } : null} />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
