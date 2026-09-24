import { redirect } from 'next/navigation';
import { getFacilitador } from '@/lib/auth';
import { FormularioIngreso } from './formulario-ingreso';

export const metadata = { title: 'Ingreso de facilitador' };

export default async function IngresarPage() {
  if (await getFacilitador()) redirect('/makigami');
  return (
    <div className="mx-auto max-w-sm pt-8">
      <div className="card p-6">
        <h1 className="font-display text-xl font-semibold text-secundario">Ingreso de facilitador</h1>
        <p className="mt-1 text-sm text-marmol-500">
          Para administradores y líderes. Los jugadores no necesitan cuenta: entran con el código del reto.
        </p>
        <FormularioIngreso />
      </div>
    </div>
  );
}
