import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Inter, Sora } from 'next/font/google';
import { getFacilitador, ROLES } from '@/lib/auth';
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
        <header className="no-imprimir sticky top-0 z-40 border-b border-marmol-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:gap-4">
            <Link href="/" className="font-display text-lg font-bold text-secundario">
              AndMes<span className="text-marca-500">Apps</span>
            </Link>
            <nav className="flex min-w-0 items-center gap-3 overflow-x-auto text-sm text-marmol-600 [scrollbar-width:none] sm:gap-4">
              {facilitador && (
                <Link href="/panel" className="font-semibold text-secundario hover:text-marca-600">
                  🧭<span className="hidden sm:inline"> Mi panel</span>
                </Link>
              )}
              {facilitador && (
                <Link href="/proyectos" className="hover:text-marca-600" title="Proyectos">
                  🗂️<span className="hidden lg:inline"> Proyectos</span>
                </Link>
              )}
              {facilitador && (
                <Link href="/finanzas" className="hover:text-marca-600" title="Mis finanzas">
                  💰<span className="hidden lg:inline"> Finanzas</span>
                </Link>
              )}
              <Link href="/juegos" className="hover:text-marca-600" title="Juegos: Makigami, Kaizen y 5S">
                🎲<span className="hidden lg:inline"> Juegos</span>
              </Link>
              {facilitador && (
                <Link href="/procesos" className="hover:text-marca-600" title="Control de procesos">
                  📊<span className="hidden lg:inline"> Procesos</span>
                </Link>
              )}
              {facilitador?.rol === 'admin' && (
                <Link href="/usuarios" className="hover:text-marca-600" title="Usuarios">
                  👥<span className="hidden lg:inline"> Usuarios</span>
                </Link>
              )}
              <Link href="/ayuda" className="hover:text-marca-600" title="Manual de usuario">
                ❓<span className="hidden lg:inline"> Ayuda</span>
              </Link>
            </nav>
            <div className="ml-auto text-sm">
              {facilitador ? (
                <form action="/salir" method="post" className="flex items-center gap-3">
                  <span className="hidden text-xs text-marmol-500 sm:inline" title={facilitador.email}>
                    {facilitador.nombre === facilitador.email ? facilitador.email : facilitador.nombre}
                  </span>
                  <span className="hidden rounded-full bg-marca-100 px-2 py-0.5 text-[11px] font-semibold text-marca-700 sm:inline">{ROLES[facilitador.rol]}</span>
                  <button className="text-marmol-500 hover:text-bajo">Salir</button>
                </form>
              ) : (
                <Link href="/ingresar" className="text-marmol-500 hover:text-marca-600">
                  Soy facilitador
                </Link>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
