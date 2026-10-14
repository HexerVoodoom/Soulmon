import type { CSSProperties } from 'react';
import { hungerLevelOf, type HungerTier } from '../../utils/hunger';
import type { Language } from '../../utils/i18n';
import { fomeCheio, fomeMedio, fomeFaminto } from '../../assets/soulmon/icones-ui';

/**
 * O INDICADOR DE FOME da Home (beta-2 3.5, REGISTRO §40). Componente PEQUENO e DESACOPLADO: só props simples, nenhum acesso ao save —
 * quem encaixa (a faixa de status do cenário, frente A) passa o que `energyStatus(state, now)` (`utils/hunger.ts`) já calculou:
 *
 *   <HungerIndicator tier={status.tier} value={status.hunger} language={language} />
 *
 * Três estados legíveis SEM depender de cor: carne no osso inteira / pela metade / só o osso (arte escolhida pelo dono, 14/10/2026; o faminto vem em dourado). O nome acessível diz o estado em
 * palavras. Sem texto na tela (minimalismo): o detalhe vive na dica da energia (`home/statTips.ts`). Sem animação, sem som, sem cobrança.
 * Cor só por tokens (`currentColor` + `--sm2-*`): herda a tinta do contêiner (na cena escura, os tons `viewport*` do `sm3-stat`).
 */
const STATE_COPY: Record<HungerTier, { pt: string; en: string }> = {
  fed: { pt: 'bem alimentado', en: 'well fed' },
  fair: { pt: 'com um pouco de fome', en: 'a little hungry' },
  starving: { pt: 'faminto', en: 'starving' },
};
const ART: Record<HungerTier, string> = { fed: fomeCheio, fair: fomeMedio, starving: fomeFaminto };

const wrap: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, lineHeight: 0 };

export function HungerIndicator({ tier, value, language, size = 20, style, onTap, expanded }: {
  tier: HungerTier;
  /** Fome 0..100 (só para o nome acessível e `data-hunger`; a tela não mostra número). */
  value?: number;
  language: Language;
  size?: number;
  style?: CSSProperties;
  /** Com `onTap` o indicador vira botão (abre a dica da energia, que já explica a fome); sem ele segue como imagem. */
  onTap?: () => void;
  expanded?: boolean;
}) {
  const isPt = language === 'pt-BR';
  const copy = isPt ? STATE_COPY[tier].pt : STATE_COPY[tier].en;
  const nivel = hungerLevelOf(tier);
  const nome = isPt ? `Fome: ${copy}, nível ${nivel} de 3` : `Hunger: ${copy}, level ${nivel} of 3`;
  const corpo = (
    <>
      <img src={ART[tier]} alt="" width={size} height={size} draggable={false} aria-hidden="true" style={{ imageRendering: 'pixelated' }} />
      {/* nível N de 3 (REGISTRO §43): três marcas, cheias × só contorno — a forma diz o nível, não a cor */}
      <svg data-hunger-level={nivel} width="14" height="6" viewBox="0 0 14 6" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
        {[0, 1, 2].map(i => (i < nivel
          ? <rect key={i} x={i * 5} y="0" width="4" height="6" fill="currentColor" />
          : <rect key={i} x={i * 5 + 0.5} y="0.5" width="3" height="5" fill="none" stroke="currentColor" strokeWidth="1" />))}
      </svg>
    </>
  );
  const dados = {
    'data-hunger-indicator': true,
    'data-hunger-tier': tier,
    'data-hunger': value === undefined ? undefined : Math.round(value),
  };
  if (onTap) {
    return (
      <button
        type="button"
        {...dados}
        className="sm3-hunger"
        aria-label={nome}
        aria-expanded={expanded ?? false}
        aria-controls="sm3-stat-tip"
        onClick={onTap}
        style={{ ...wrap, ...style }}
      >
        {corpo}
      </button>
    );
  }
  return (
    <span role="img" {...dados} aria-label={nome} style={{ ...wrap, ...style }}>
      {corpo}
    </span>
  );
}
