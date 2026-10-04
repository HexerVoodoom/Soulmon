import { useEffect, useState, type CSSProperties } from 'react';

/**
 * A CELEBRAÇÃO (rodada 7, M5, 04/10/2026): um estouro curto de faíscas quando
 * uma missão, uma Travessia ou a meta do dia se cumpre. Leve de propósito:
 * 12 pontos, ~1,2 s, UMA vez, sem som, sem número, sem sequência — é um "boa",
 * não um placar. Decorativa (`aria-hidden`): quem usa leitor de tela recebe o
 * mesmo aviso no texto de estado ao lado.
 *
 * Em `prefers-reduced-motion` o CSS (`.sm2-celebrate`, bloco canônico) a esconde
 * por inteiro — a cor do card e o texto seguem dizendo que deu certo.
 *
 * `fixed` solta a celebração sobre a tela (meta do dia na Home); sem ele, ela
 * nasce do centro do pai (que precisa ser `position: relative`).
 */
const SPARKS = 12;

export function Celebration({ fixed = false, onDone }: { fixed?: boolean; onDone?: () => void }) {
  const [alive, setAlive] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => { setAlive(false); onDone?.(); }, 1300);
    return () => window.clearTimeout(t);
  }, [onDone]);
  if (!alive) return null;
  return (
    <span
      aria-hidden="true"
      data-celebration
      className="sm2-celebrate"
      style={{
        position: fixed ? 'fixed' : 'absolute',
        left: '50%', top: fixed ? '38%' : '50%', width: 0, height: 0,
        pointerEvents: 'none', zIndex: fixed ? 80 : 2,
      }}
    >
      {Array.from({ length: SPARKS }, (_, i) => {
        const ang = (360 / SPARKS) * i;
        const style = {
          '--sm2-spark-a': `${ang}deg`,
          '--sm2-spark-d': `${i % 2 === 0 ? 74 : 52}px`,
          animationDelay: `${(i % 3) * 40}ms`,
          backgroundColor: i % 3 === 0 ? 'var(--sm2-primary-ink)' : 'var(--sm2-gold-ink)',
        } as CSSProperties;
        return <i key={i} className="sm2-celebrate-spark" style={style} />;
      })}
    </span>
  );
}
