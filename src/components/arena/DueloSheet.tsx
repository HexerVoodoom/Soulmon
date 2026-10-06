import type { CSSProperties } from 'react';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { ARENA_ROUNDS } from '../../utils/arena';
import { soulCombatant } from '../../utils/soulXP';
import { useGameStateOptional } from '../../contexts/GameStateContext';
import { elementIcon } from '../../utils/elementIconArt';
import { Icon } from '../ui/Icon';
import { ModalInfo } from '../ui/InfoTip';
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
 * I9 (02/10/2026): o dono não entendia "Sua ficha / Neutro · elemento · golpe
 * básico · habilidade". Agora só o essencial — o elemento do Soulmon (com ícone),
 * o poder e os dois golpes, numa linha — e o que cada coisa significa mora atrás
 * de um "?" (`InfoTip`).
 *
 * A folha só MOSTRA a ficha e abre o jogo; a luta, o balanceamento e o que ela
 * rende continuam inteiros na `ArenaGame` (que não cobra coração nem tem porta
 * paga — CLAUDE.md, "encoraja, nunca um cobrador"). O mock prometia Emblemas
 * ("Honra") por vitória; a `ArenaGame` rende **Bits** e isso não mudou aqui —
 * mudar a moeda de um jogo é regra de economia, não fatia de UI.
 */
const box: CSSProperties = {
  flex: 1, minWidth: 0, padding: '10px 12px', boxSizing: 'border-box', minHeight: 56,
  border: '1px solid var(--sm2-line)', borderRadius: 'var(--sm2-radius-md)',
  backgroundColor: 'var(--sm2-bg)',
  display: 'flex', alignItems: 'center', gap: 8,
};
const boxValue: CSSProperties = {
  ...sm2Text, fontFamily: 'var(--sm2-font-display)', fontWeight: 600,
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
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
  const stage = fichaStageOf(evolutionStage);
  const par = skills?.[stage];
  const t = (x: { pt: string; en: string } | undefined) => (x ? (isPt ? x.pt : x.en) : null);
  const elementoId = par?.especial?.elementoId ?? par?.basica?.elementoId ?? 'neutro';
  const elemento = t(par?.especial?.elementoNome) ?? t(par?.basica?.elementoNome) ?? (isPt ? 'Neutro' : 'Neutral');
  const arte = elementIcon(elementoId) ?? elementIcon('neutro');
  // O mesmo poder que a luta usa (`ArenaGame`, Combate v3): o ATK do `soulCombatant` do save; sem save (demo, testes), o do estágio.
  const gs = useGameStateOptional()?.gameState;
  const poder = soulCombatant(gs
    ? { evolutionStage: gs.evolutionStage, perfectDays: gs.perfectDays, powerPoints: gs.powerPoints, harmonyPoints: gs.harmonyPoints, benevolencePoints: gs.benevolencePoints, degeneratedByHP: gs.degeneratedByHP }
    : { evolutionStage }).atk;
  const golpes = [t(par?.basica?.nome), t(par?.especial?.nome)].filter(Boolean) as string[];
  const golpesTxt = golpes.length ? golpes.join(' · ') : (isPt ? 'Golpe básico' : 'Basic strike');

  return (
    <div data-duelo style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={box} data-duelo-elemento>
          {arte && <img src={arte} alt="" width={32} height={32} style={{ width: 32, height: 32, imageRendering: 'pixelated', flexShrink: 0 }} />}
          <span style={boxValue}>{elemento}</span>
        </div>
        <div style={{ ...box, flex: '0 0 auto' }} data-duelo-poder title={isPt ? 'Poder' : 'Power'} aria-label={`${isPt ? 'Poder' : 'Power'}: ${poder}`}>
          <Icon name="bolt" size={24} tone="gold" fill={1} />
          <span className="sm2-num" style={boxValue}>{poder}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <p data-duelo-golpes style={{ ...sm2Text, margin: 0, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {golpesTxt}
        </p>
        <ModalInfo language={language} label={isPt ? 'O que são elemento, poder e golpes' : 'What element, power and strikes are'} align="right">
          <span data-duelo-ajuda>
            <span style={{ display: 'block' }}>
              {isPt
                ? 'Elemento: a natureza do seu Soulmon. Alguns elementos ganham de outros na luta.'
                : "Element: your Soulmon's nature. Some elements beat others in a fight."}
            </span>
            <span style={{ display: 'block', marginTop: 6 }}>
              {isPt
                ? 'Poder: a força dos seus golpes. Cresce quando o Soulmon evolui.'
                : 'Power: how hard your strikes hit. It grows as your Soulmon evolves.'}
            </span>
            <span style={{ display: 'block', marginTop: 6 }}>
              {isPt
                ? 'Golpes: o primeiro é o básico; o segundo é o especial, que sai quando a barra de energia enche.'
                : 'Strikes: the first is the basic one; the second is the special, which fires when the energy bar is full.'}
            </span>
            <span data-duelo-como-lutar style={{ display: 'block', marginTop: 6 }}>
              {isPt
                ? 'Na luta, seu Soulmon ataca e se defende sozinho. Toque na tela (ou no mascote) para torcer: a barra de cheer enche devagar e despeja energia nele. Com a energia cheia, ele solta o especial — toque no anel na hora certa para render mais. Quando o inimigo soltar o dele, deslize o dedo para o lado para esquivar.'
                : 'In the fight, your Soulmon attacks and defends on its own. Tap the screen (or the mascot) to cheer: the cheer bar fills slowly and pours energy into it. With full energy it unleashes its special — tap the ring at the right moment to hit harder. When the enemy unleashes its own, swipe sideways to dodge.'}
            </span>
            {!par && (
              <span style={{ display: 'block', marginTop: 6 }}>
                {isPt ? 'Sem ficha neste aparelho: você luta com o par de golpes padrão.' : 'No sheet on this device: you fight with the default pair of moves.'}
              </span>
            )}
            <span style={{ display: 'block', marginTop: 6 }}>
              {isPt
                ? `${ARENA_ROUNDS} rodadas contra criaturas do bestiário · vencer rende Bits · perder não custa nada`
                : `${ARENA_ROUNDS} rounds against bestiary creatures · winning earns Bits · losing costs nothing`}
            </span>
          </span>
        </ModalInfo>
      </div>
      <button type="button" data-duelo-start onClick={onStart} style={{ ...sm2Button('primary'), width: '100%' }}>
        {isPt ? 'Começar duelo' : 'Start duel'}
      </button>
    </div>
  );
}
