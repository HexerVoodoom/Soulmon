import type { CSSProperties } from 'react';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { ARENA_ROUNDS } from '../../utils/arena';
import { getStageLevel } from '../../types/progression';
import type { StageSkills } from '../../utils/soulProfile/ficha/skills';
import type { FichaStage } from '../../utils/soulProfile/ficha/types';
import type { Language } from '../../utils/i18n';

/**
 * DUELO (minimal-ui F5, Arena) — a porta de entrada da `ArenaGame`, a luta de
 * rodadas contra criaturas do bestiário com o elemento e a habilidade da
 * ficha. Mock aprovado: `propostas/arena/mock.html` (`#modalArena`: "sua
 * ficha" + CTA).
 *
 * A folha só MOSTRA a ficha e abre o jogo; a luta, o balanceamento e o que ela
 * rende continuam inteiros na `ArenaGame` (que não cobra coração nem tem porta
 * paga — CLAUDE.md, "encoraja, nunca um cobrador"). O mock prometia Emblemas
 * ("Honra") por vitória; a `ArenaGame` rende **Bits** e isso não mudou aqui —
 * mudar a moeda de um jogo é regra de economia, não fatia de UI.
 */
const box: CSSProperties = {
  flex: 1, minWidth: 0, padding: '10px 12px', boxSizing: 'border-box',
  border: '1px solid var(--sm2-line)', borderRadius: 'var(--sm2-radius-md)',
  backgroundColor: 'var(--sm2-bg)',
  display: 'flex', flexDirection: 'column', gap: 2,
};
const boxValue: CSSProperties = {
  ...sm2Text, fontFamily: 'var(--sm2-font-display)', fontWeight: 600,
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
};
const boxLabel: CSSProperties = {
  ...sm2Hint, fontSize: 'var(--sm2-text-xs)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0,
};

function fichaStageOf(evolutionStage: string): FichaStage {
  const nivel = getStageLevel(evolutionStage);
  return (['rookie', 'champion', 'ultimate', 'mega', 'ultra'].includes(nivel) ? nivel : 'rookie') as FichaStage;
}

export function DueloSheet({ language, evolutionStage, skills, onStart }: {
  language: Language;
  evolutionStage: string;
  skills?: Partial<Record<FichaStage, StageSkills>>;
  onStart: () => void;
}) {
  const isPt = language === 'pt-BR';
  const par = skills?.[fichaStageOf(evolutionStage)];
  const t = (x: { pt: string; en: string } | undefined) => (x ? (isPt ? x.pt : x.en) : null);
  const elemento = t(par?.especial?.elementoNome) ?? t(par?.basica?.elementoNome);
  const especial = t(par?.especial?.nome);

  return (
    <div data-duelo style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ ...sm2Hint, margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sm2-gold-ink)', fontWeight: 600 }}>
        {isPt ? 'Sua ficha' : 'Your sheet'}
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={box}>
          <span style={boxValue}>{elemento ?? (isPt ? 'Neutro' : 'Neutral')}</span>
          <p style={boxLabel}>{isPt ? 'elemento' : 'element'}</p>
        </div>
        <div style={box}>
          <span style={boxValue}>{especial ?? (isPt ? 'Golpe básico' : 'Basic strike')}</span>
          <p style={boxLabel}>{isPt ? 'habilidade' : 'skill'}</p>
        </div>
      </div>
      {!par && (
        <p style={{ ...sm2Hint, margin: 0 }}>
          {isPt
            ? 'Sem ficha neste aparelho: você luta com o par de golpes padrão.'
            : 'No sheet on this device: you fight with the default pair of moves.'}
        </p>
      )}
      <p style={{ ...sm2Hint, margin: 0, textAlign: 'center' }}>
        {isPt
          ? `${ARENA_ROUNDS} rodadas contra criaturas do bestiário · vencer rende Bits · perder não custa nada`
          : `${ARENA_ROUNDS} rounds against bestiary creatures · winning earns Bits · losing costs nothing`}
      </p>
      <button type="button" data-duelo-start onClick={onStart} style={{ ...sm2Button('primary'), width: '100%' }}>
        {isPt ? 'Começar duelo' : 'Start duel'}
      </button>
    </div>
  );
}
