import type { CSSProperties } from 'react';
import { formatEnergyEta, type EnergyMode } from '../../utils/hunger';
import type { Language } from '../../utils/i18n';

/**
 * O TIMER DA ENERGIA da Home (beta-2 3.4, REGISTRO §40). Componente PEQUENO e DESACOPLADO: só props simples. NÃO conta nada por conta
 * própria — o valor é SEMPRE o que `energyStatus(state, now)` (`utils/hunger.ts`) projeta sobre o relógio do save e a fome de agora, então
 * muda sozinho quando a fome muda de faixa e continua certo depois de fechar o app, navegar ou voltar:
 *
 *   const status = useEnergyStatus(gameState);                    // src/hooks/useEnergyStatus.ts (recalcula a cada 15 s)
 *   <EnergyTimer msToNext={status.msToNext} mode={status.mode} language={language} />
 *
 *  · `regen` / `slow`: o tempo até a PRÓXIMA unidade, discreto ("1h05", "42 min"); `slow` ganha a marca ‹ (mais devagar) no nome acessível.
 *  · `paused` (faminto): um traço "–" — a regeneração parou; o nome acessível explica.
 *  · `full`: não renderiza nada (energia cheia não tem próximo).
 */
const base: CSSProperties = { fontVariantNumeric: 'tabular-nums', fontSize: 'var(--sm2-text-xs, 11px)', lineHeight: 1, opacity: 0.85, whiteSpace: 'nowrap' };

export function EnergyTimer({ msToNext, mode, language, style }: {
  /** Ms até a próxima unidade; `null` quando cheia ou pausada. */
  msToNext: number | null;
  mode: EnergyMode;
  language: Language;
  style?: CSSProperties;
}) {
  if (mode === 'full') return null;
  const isPt = language === 'pt-BR';
  if (mode === 'paused' || msToNext === null) {
    return (
      <span data-energy-timer data-mode="paused" role="img" aria-label={isPt ? 'Energia pausada: ele está faminto' : 'Energy paused: he is starving'} style={{ ...base, ...style }}>–</span>
    );
  }
  const text = formatEnergyEta(msToNext, isPt);
  return (
    <span
      data-energy-timer
      data-mode={mode}
      role="img"
      aria-label={isPt
        ? `Próxima energia em ${text}${mode === 'slow' ? ' (regenerando devagar)' : ''}`
        : `Next energy in ${text}${mode === 'slow' ? ' (regenerating slowly)' : ''}`}
      style={{ ...base, ...style }}
    >
      <span aria-hidden="true">{text}</span>
    </span>
  );
}
