import type { CSSProperties } from 'react';
import type { HungerTier } from '../../utils/hunger';
import type { Language } from '../../utils/i18n';

/**
 * O INDICADOR DE FOME da Home (beta-2 3.5, REGISTRO §40). Componente PEQUENO e DESACOPLADO: só props simples, nenhum acesso ao save —
 * quem encaixa (a faixa de status do cenário, frente A) passa o que `energyStatus(state, now)` (`utils/hunger.ts`) já calculou:
 *
 *   <HungerIndicator tier={status.tier} value={status.hunger} language={language} />
 *
 * Três estados legíveis SEM depender de cor: uma tigela e três pontos (cheio / meio / só o contorno). O nome acessível diz o estado em
 * palavras. Sem texto na tela (minimalismo): o detalhe vive na dica da energia (`home/statTips.ts`). Sem animação, sem som, sem cobrança.
 * Cor só por tokens (`currentColor` + `--sm2-*`): herda a tinta do contêiner (na cena escura, os tons `viewport*` do `sm3-stat`).
 */
const STATE_COPY: Record<HungerTier, { pt: string; en: string }> = {
  fed: { pt: 'bem alimentado', en: 'well fed' },
  fair: { pt: 'com um pouco de fome', en: 'a little hungry' },
  starving: { pt: 'faminto', en: 'starving' },
};
const PIPS: Record<HungerTier, number> = { fed: 3, fair: 2, starving: 0 };

const wrap: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 3, lineHeight: 0 };

export function HungerIndicator({ tier, value, language, size = 20, style }: {
  tier: HungerTier;
  /** Fome 0..100 (só para o nome acessível e `data-hunger`; a tela não mostra número). */
  value?: number;
  language: Language;
  size?: number;
  style?: CSSProperties;
}) {
  const isPt = language === 'pt-BR';
  const copy = isPt ? STATE_COPY[tier].pt : STATE_COPY[tier].en;
  const filled = PIPS[tier];
  return (
    <span
      role="img"
      data-hunger-indicator
      data-hunger-tier={tier}
      data-hunger={value === undefined ? undefined : Math.round(value)}
      aria-label={isPt ? `Fome: ${copy}` : `Hunger: ${copy}`}
      style={{ ...wrap, ...style }}
    >
      <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
        {/* tigela em pixel: borda e base; o vapor aparece só com a fome atendida */}
        <path d="M2 7h12v1h-1v2h-1v2h-1v1H5v-1H4v-2H3V8H2z" fill="currentColor" />
        {tier !== 'starving' && <path d="M5 3h1v2H5zM8 2h1v3H8zM11 3h1v2h-1z" fill="currentColor" opacity={tier === 'fed' ? 1 : 0.55} />}
      </svg>
      <span aria-hidden="true" style={{ display: 'inline-flex', flexDirection: 'column', gap: 2 }}>
        {[2, 1, 0].map(i => (
          <i
            key={i}
            style={{
              display: 'block', width: 4, height: 4, boxSizing: 'border-box',
              background: i < filled ? 'currentColor' : 'transparent',
              border: '1px solid currentColor',
            }}
          />
        ))}
      </span>
    </span>
  );
}
