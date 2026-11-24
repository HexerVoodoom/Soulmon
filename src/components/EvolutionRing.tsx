/**
 * Anel circular de um ramo de evolução (Bond, tarefa 23): preenchimento = pontos do ramo / pontos do ramo líder.
 * Só visualiza dado existente (`pontosDe`); não cria regra. O número fica no centro; a leitura de tela
 * ganha o texto completo (o anel é decorativo, `aria-hidden`).
 */
export function EvolutionRing({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const R = 15;
  const C = 2 * Math.PI * R;
  const frac = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <span className="sm2-evo-ring" role="img" aria-label={label} data-testid="sm-anel" data-frac={frac.toFixed(2)} style={{ ['--sm2-ring-color' as string]: color }}>
      <svg viewBox="0 0 36 36" width={36} height={36} aria-hidden="true" focusable="false">
        <circle className="sm2-evo-ring-trilho" cx={18} cy={18} r={R} fill="none" strokeWidth={3} />
        <circle
          className="sm2-evo-ring-arco" cx={18} cy={18} r={R} fill="none" strokeWidth={3} strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - frac)} transform="rotate(-90 18 18)"
        />
      </svg>
      <span className="sm2-evo-ring-num sm2-num" aria-hidden="true">{value}</span>
    </span>
  );
}
