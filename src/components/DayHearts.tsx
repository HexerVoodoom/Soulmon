import { useEffect, useState } from 'react';
import { PixelIcon } from './ui/PixelIcon';
import { usePrefersReducedMotion } from './ui/Viewport';
import type { HeartStrip } from '../utils/dayHearts';

/** O tremor (`sm2-heart-shake`) e a quebra (`sm2-heart-snap`) somam ~1 s; depois o coração fica preto. */
export const HEART_SHAKE_MS = 650;
export const HEART_SNAP_MS = 350;

type Phase = 'whole' | 'shake' | 'snap' | 'black';

/**
 * A fileira de corações do resumo do dia (beta-2, 4.2). Os inteiros ficam como estão; cada coração
 * cobrado treme, quebra e vira um coração PRETO (o mesmo ícone do HUD, escurecido por filtro — nenhuma arte
 * nova). A animação só roda quando `play` é verdadeiro: quem chama decide (uma vez por relatório, persistido)
 * e a tela NÃO repete ao reabrir — sem `play` os cobrados já nascem pretos. Movimento reduzido pula direto
 * para o preto.
 */
export function DayHearts({ strip, play, onPlayed, isPt }: {
  strip: HeartStrip;
  /** Roda tremor + quebra. Capturado na montagem: reabrir o resumo já vem `false`. */
  play: boolean;
  /** Chamado UMA vez, quando a animação começa — é o momento de gravar "já vista". */
  onPlayed?: () => void;
  isPt: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  // `play` é lido UMA vez, na montagem: reabrir o resumo já chega com `play` falso e o coração nasce preto.
  const [phase, setPhase] = useState<Phase>(strip.lost === 0 ? 'whole' : play ? 'shake' : 'black');

  useEffect(() => {
    if (play) onPlayed?.();
    // só na montagem: `play` é lido uma vez, de propósito
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Movimento reduzido (o hook só sabe depois da montagem): pula o tremor e a quebra, direto para o preto.
    if (reduced && (phase === 'shake' || phase === 'snap')) { setPhase('black'); return undefined; }
    if (phase === 'shake') {
      const t = setTimeout(() => setPhase('snap'), HEART_SHAKE_MS);
      return () => clearTimeout(t);
    }
    if (phase === 'snap') {
      const t = setTimeout(() => setPhase('black'), HEART_SNAP_MS);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [phase, reduced]);

  const label = isPt
    ? `Corações: ${strip.kept} de ${strip.total}`
    : `Hearts: ${strip.kept} of ${strip.total}`;

  return (
    <div
      role="img"
      aria-label={label}
      data-day-hearts
      data-hearts-kept={strip.kept}
      data-hearts-lost={strip.lost}
      data-hearts-phase={phase}
      style={{ display: 'flex', justifyContent: 'center', gap: 12, padding: '8px 0' }}
    >
      {Array.from({ length: strip.total }, (_, i) => {
        const broken = i >= strip.kept;
        const cls = broken ? (phase === 'shake' ? 'sm2-heart-shake' : phase === 'snap' ? 'sm2-heart-snap' : undefined) : undefined;
        const black = broken && phase === 'black';
        return (
          <span
            key={i}
            data-heart={broken ? (black ? 'black' : 'breaking') : 'whole'}
            className={cls}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, lineHeight: 0 }}
          >
            <PixelIcon
              name="hp"
              size={32}
              style={black ? { filter: 'grayscale(1) brightness(.2)' } : undefined}
            />
          </span>
        );
      })}
    </div>
  );
}
