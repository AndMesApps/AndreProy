import { BotonImprimir } from '@/components/informes/boton-imprimir';
import { SeccionInicio } from '@/components/manual/seccion-inicio';
import { SeccionProyectos } from '@/components/manual/seccion-proyectos';
import { SeccionProcesos } from '@/components/manual/seccion-procesos';
import { SeccionJuegos } from '@/components/manual/seccion-juegos';
import { SeccionGlosario } from '@/components/manual/seccion-glosario';

export const metadata = { title: 'Manual de usuario' };

const INDICE: [string, string, string, [string, string][]?][] = [
  ['inicio', '👋', 'Primeros pasos'],
  ['panel', '🧭', 'Mi panel'],
  [
    'proyectos',
    '🗂️',
    'Proyectos',
    [
      ['proyectos-crear', 'Crear un proyecto'],
      ['proyectos-resumen', 'Resumen y salud'],
      ['proyectos-cronograma', 'Cronograma'],
      ['proyectos-objetivos', 'Objetivos y KPIs'],
      ['proyectos-bitacora', 'Bitácora'],
      ['proyectos-finanzas', 'Horas y pagos'],
      ['proyectos-riesgos', 'Riesgos'],
      ['proyectos-informe', 'Informe de avance'],
    ],
  ],
  ['procesos', '📊', 'Control de procesos'],
  ['informes', '📄', 'Informes y opciones de mejora'],
  ['makigami', '🎯', 'Cacería Makigami'],
  ['kaizen', '🔁', 'Carrera Kaizen'],
  ['jugadores', '📱', 'Para los jugadores'],
  ['usuarios', '👥', 'Usuarios'],
  ['preguntas', '🙋', 'Preguntas frecuentes'],
  ['glosario', '📖', 'Glosario'],
];

/** Manual de usuario: explicado paso a paso, con ejemplos, para cualquier persona. */
export default function ManualPage() {
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-degradado px-6 py-7 text-white shadow-lg print:rounded-none">
        <div className="pointer-events-none absolute -right-4 -top-8 select-none text-[9rem] leading-none opacity-15" aria-hidden>
          📘
        </div>
        <div className="relative max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-acento">Ayuda</p>
          <h1 className="mt-1 font-display text-3xl font-bold">Manual de usuario</h1>
          <p className="mt-2 text-sm text-white/85">
            Todo lo que puedes hacer en AndMesApps, explicado paso a paso, con ejemplos y sin palabras raras. Busca tu tema en el índice o lee de corrido: está pensado
            para aprender desde cero.
          </p>
          <div className="mt-4">
            <BotonImprimir />
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <nav id="indice" className="card no-imprimir scroll-mt-20 p-4 lg:sticky lg:top-20">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-marmol-400">Índice</p>
          <ol className="space-y-1 text-sm">
            {INDICE.map(([id, emoji, nombre, subs]) => (
              <li key={id}>
                <a href={`#${id}`} className="flex gap-2 rounded-md px-2 py-1 text-marmol-700 hover:bg-marca-50 hover:text-secundario">
                  <span>{emoji}</span>
                  {nombre}
                </a>
                {subs && (
                  <ol className="ml-8 space-y-0.5 border-l border-marmol-200 pl-2 text-xs">
                    {subs.map(([sid, snombre]) => (
                      <li key={sid}>
                        <a href={`#${sid}`} className="block py-0.5 text-marmol-500 hover:text-secundario">
                          {snombre}
                        </a>
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className="min-w-0 space-y-6">
          <SeccionInicio />
          <SeccionProyectos />
          <SeccionProcesos />
          <SeccionJuegos />
          <SeccionGlosario />
        </div>
      </div>
    </div>
  );
}
