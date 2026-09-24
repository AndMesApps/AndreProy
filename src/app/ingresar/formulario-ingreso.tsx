'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ingresar as ingresarServidor } from './actions';

export function FormularioIngreso() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ingresar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    const res = await ingresarServidor(email, password);
    if (!res.ok) {
      setCargando(false);
      return setError(res.error);
    }
    router.push('/makigami');
    router.refresh();
  }

  return (
    <form onSubmit={ingresar} className="mt-4 space-y-3">
      <input type="email" required autoComplete="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} className="campo" />
      <input type="password" required autoComplete="current-password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="campo" />
      {error && <p className="text-sm text-bajo">{error}</p>}
      <button type="submit" disabled={cargando} className="boton w-full">
        {cargando ? 'Ingresando…' : 'Ingresar'}
      </button>
    </form>
  );
}
