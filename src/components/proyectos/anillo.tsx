import { cn } from '@/lib/utils';

/**
 * Anillo de avance (0 a 1) con el porcentaje en el centro. `esperado` marca
 * con una muesca dónde debería ir (ej. el tiempo transcurrido).
 */
export function Anillo({
  valor,
  titulo,
  nota,
  color = '#0d9488',
  esperado,
}: {
  valor: number | null;
  titulo: string;
  nota?: string;
  color?: string;
  esperado?: number | null;
}) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const v = valor == null ? 0 : Math.max(0, Math.min(1, valor));
  const ang = esperado != null ? Math.max(0, Math.min(1, esperado)) * 2 * Math.PI - Math.PI / 2 : null;
  return (
    <div className="flex flex-col items-center text-center">
      <svg viewBox="0 0 100 100" className="h-24 w-24 sm:h-28 sm:w-28" role="img" aria-label={`${titulo}: ${valor == null ? 'sin datos' : `${Math.round(v * 100)} %`}`}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f2f0ec" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${v * c} ${c}`}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
        />
        {ang != null && <line x1={50 + (r - 8) * Math.cos(ang)} y1={50 + (r - 8) * Math.sin(ang)} x2={50 + (r + 8) * Math.cos(ang)} y2={50 + (r + 8) * Math.sin(ang)} stroke="#312E81" strokeWidth="2.5" strokeLinecap="round" />}
        <text x="50" y="54" textAnchor="middle" className={cn('font-display text-[20px] font-bold', valor == null ? 'fill-marmol-300' : 'fill-secundario')}>
          {valor == null ? '—' : `${Math.round(v * 100)}%`}
        </text>
      </svg>
      <p className="mt-1 text-xs font-semibold text-marmol-700">{titulo}</p>
      {nota && <p className="text-[10px] leading-tight text-marmol-400">{nota}</p>}
    </div>
  );
}
