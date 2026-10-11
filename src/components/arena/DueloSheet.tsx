import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { ARENA_ROUNDS, ARENA_ROUND_COMP, buildArenaRound, elementLabel, loadBestiaryPool, type ArenaEnemy } from '../../utils/arena';
import { mulberry32 } from '../../utils/combate/rng';
import { newDefenseSeed } from '../../utils/autoDefesa';
import { soulCombatant } from '../../utils/soulXP';
import { useGameStateOptional } from '../../contexts/GameStateContext';
import { elementIcon } from '../../utils/elementIconArt';
import { Icon } from '../ui/Icon';
import { ModalInfo } from '../ui/InfoTip';
import { getStageLevel } from '../../types/progression';
import { fighterIdentity } from '../../utils/fighterIdentity';
import { elementoNomeDe } from '../../utils/soulProfile/ficha/elementoNome';
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

const SEED_MIX = 0x9e3779b1;
const roundFoes = (seed: number, n: number, pool: Parameters<typeof buildArenaRound>[3]): ArenaEnemy[] =>
  buildArenaRound(n, 1, mulberry32((seed ^ Math.imul(n, SEED_MIX)) | 0), pool);

/**
 * ARENA = VOCÊ ESCOLHE (guilda-lancamento PR1, 11/10/2026). Três desafios de poder PARECIDO com o seu
 * (os adversários da Arena são sempre relativos ao level — `arenaFoe`), e o jogador seleciona contra quais
 * vai lutar. A semente do card é a da run: a `ArenaGame` luta exatamente o que o card mostrou. O Torneio é
 * o oposto, de propósito: lá o servidor sorteia pela faixa (`functions/api/_rankedPick.js`).
 */
function EscolhaDeAdversarios({ isPt, onPick }: { isPt: boolean; onPick: (seed: number) => void }) {
  const seeds = useMemo(() => [newDefenseSeed(), newDefenseSeed(), newDefenseSeed()], []);
  const [pool, setPool] = useState<Awaited<ReturnType<typeof loadBestiaryPool>> | null>(null);
  const [chosen, setChosen] = useState(0);
  useEffect(() => {
    let alive = true;
    loadBestiaryPool().then(p => { if (alive) setPool(p); }).catch(() => { /* sem pool: o botão ainda abre uma luta sorteada */ });
    return () => { alive = false; };
  }, []);
  useEffect(() => { onPick(seeds[chosen]); }, [chosen, seeds, onPick]);
  if (!pool) return null;
  return (
    <div data-arena-escolha role="radiogroup" aria-label={isPt ? 'Escolha seus adversários' : 'Choose your opponents'} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ ...sm2Hint, margin: 0 }}>
        {isPt ? 'Você escolhe contra quem lutar — todos de poder parecido com o seu.' : 'You choose who to fight — all of power similar to yours.'}
      </p>
      {seeds.map((seed, i) => {
        const first = roundFoes(seed, 1, pool);
        const bossIdx = ARENA_ROUND_COMP[ARENA_ROUNDS - 1].indexOf('boss');
        const boss = roundFoes(seed, ARENA_ROUNDS, pool)[Math.max(0, bossIdx)];
        const els = [...new Set(first.map(f => f.elements[0]))];
        const on = chosen === i;
        return (
          <button
            key={seed} type="button" role="radio" aria-checked={on} data-arena-card={i}
            onClick={() => setChosen(i)}
            style={{ ...box, flex: 'none', textAlign: 'left', cursor: 'pointer', borderColor: on ? 'var(--sm2-primary)' : 'var(--sm2-line)', borderWidth: on ? 2 : 1, borderStyle: 'solid', width: '100%' }}
          >
            <span style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              {els.slice(0, 3).map(e => {
                const a = elementIcon(e);
                return a ? <img key={e} src={a} alt="" width={28} height={28} style={{ width: 28, height: 28, imageRendering: 'pixelated' }} /> : null;
              })}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ ...sm2Text, display: 'block', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {els.map(e => elementLabel(e, isPt)).join(' · ')}
              </span>
              <span style={{ ...sm2Hint, display: 'block' }}>
                {isPt ? 'Chefe: ' : 'Boss: '}{boss ? (isPt ? boss.namePt : boss.nameEn) : '—'}
              </span>
            </span>
            {on && <Icon name="check" size={24} tone="primary" />}
          </button>
        );
      })}
    </div>
  );
}

function fichaStageOf(evolutionStage: string): FichaStage {
  const nivel = getStageLevel(evolutionStage);
  return (['rookie', 'champion', 'ultimate', 'mega', 'ultra'].includes(nivel) ? nivel : 'rookie') as FichaStage;
}

export function DueloSheet({ language, evolutionStage, skills, petElement, onStart }: {
  language: Language;
  evolutionStage: string;
  skills?: Partial<Record<FichaStage, StageSkills>>;
  /** Fallback da identidade sem ficha (o dominante do oráculo), igual nas telas de luta. */
  petElement?: string;
  /** Chamado com a semente do desafio ESCOLHIDO (sem ela, a Arena sorteia). */
  onStart: (seed?: number) => void;
}) {
  const isPt = language === 'pt-BR';
  const stage = fichaStageOf(evolutionStage);
  const par = skills?.[stage];
  const t = (x: { pt: string; en: string } | undefined) => (x ? (isPt ? x.pt : x.en) : null);
  // O elemento do Soulmon = o do golpe BÁSICO, da identidade de combate (dono único): o mesmo que a luta usa.
  const elementoId = fighterIdentity(par, petElement).basico.elemento;
  const elemento = par ? t(elementoNomeDe(elementoId)) : (petElement ? t(elementoNomeDe(elementoId)) : (isPt ? 'Neutro' : 'Neutral'));
  const arte = elementIcon(elementoId) ?? elementIcon('neutro');
  // O mesmo poder que a luta usa (`ArenaGame`, Combate v3): o ATK do `soulCombatant` do save; sem save (demo, testes), o do estágio.
  const gs = useGameStateOptional()?.gameState;
  const poder = soulCombatant(gs
    ? { evolutionStage: gs.evolutionStage, perfectDays: gs.perfectDays, powerPoints: gs.powerPoints, harmonyPoints: gs.harmonyPoints, benevolencePoints: gs.benevolencePoints, degeneratedByHP: gs.degeneratedByHP }
    : { evolutionStage }).atk;
  const golpes = [t(par?.basica?.nome), t(par?.especial?.nome)].filter(Boolean) as string[];
  const [pickedSeed, setPickedSeed] = useState<number | undefined>(undefined);
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
                ? `Arena: ${ARENA_ROUNDS} rodadas PvE; você ESCOLHE os adversários, sempre de poder parecido com o seu (acompanham o nível do seu Soulmon). Vencer rende Bits; perder não custa nada. O Torneio é o modo ranqueado: lá o servidor sorteia os oponentes pela sua faixa.`
                : `Arena: ${ARENA_ROUNDS} PvE rounds; you CHOOSE your opponents, always of power similar to yours (they scale to your Soulmon's level). Wins earn Bits; losses cost nothing. The Tournament is the ranked mode: there the server draws opponents for you by your tier.`}
            </span>
          </span>
        </ModalInfo>
      </div>
      <EscolhaDeAdversarios isPt={isPt} onPick={setPickedSeed} />
      <button type="button" data-duelo-start onClick={() => onStart(pickedSeed)} style={{ ...sm2Button('primary'), width: '100%' }}>
        {isPt ? 'Lutar' : 'Fight'}
      </button>
    </div>
  );
}
