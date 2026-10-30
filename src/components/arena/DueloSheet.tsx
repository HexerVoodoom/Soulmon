import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { ARENA_ROUNDS, ARENA_ROUND_COMP, elementLabel, loadBestiaryPool } from '../../utils/arena';
import { isStraySeed } from '../../utils/strayFoes';
import { arenaCardElements, arenaCards, arenaFoesOfSeed, arenaRerollCost, arenaRerollsFreeLeft, arenaRerollsToday, type ArenaReroll } from '../../utils/arenaSorteio';
import { elementIcon } from '../../utils/elementIconArt';
import { Icon } from '../ui/Icon';
import { ModalInfo } from '../ui/InfoTip';
import type { Language } from '../../utils/i18n';

/**
 * DUELO (minimal-ui F5, Arena) — a porta de entrada da `ArenaGame`, a luta de
 * rodadas contra criaturas do bestiário com o elemento e a habilidade da
 * ficha. Mock aprovado: `propostas/arena/mock.html` (`#modalArena`: "sua
 * ficha" + CTA).
 *
 * BETA-2 (9.3 + 11.3, 13/10/2026): a Arena livre ganhou o seu PRÓPRIO bloco no mapa (o Torneio ficou no outro) e o elemento e os
 * golpes do Soulmon SAÍRAM desta folha — moram no Perfil do Soulmon (Laboratório, `components/perfil/SoulmonPerfil.tsx`). Sobrou o poder, a
 * escolha dos adversários e o botão.
 *
 * I9 (02/10/2026, histórico): o dono não entendia "Sua ficha / Neutro · elemento · golpe
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

/**
 * ARENA = VOCÊ ESCOLHE (guilda-lancamento PR1, 11/10/2026). Três desafios de poder PARECIDO com o seu
 * (os adversários da Arena são sempre relativos ao level — `arenaFoe`), e o jogador seleciona contra quais
 * vai lutar. A semente do card é a da run: a `ArenaGame` luta exatamente o que o card mostrou. O Torneio é
 * o oposto, de propósito: lá o servidor sorteia pela faixa (`functions/api/_rankedPick.js`).
 */
export interface ArenaRerollProps {
  /** Dia do jogador (ISO, `playerDayIso` com o fuso do save): a semente dos cards e a virada dos 3 grátis. */
  dayIso: string;
  /** Id estável da conta (`saveId`): parte da semente dos cards. */
  accountKey: string;
  /** O contador do save (`arenaReroll`). */
  reroll?: ArenaReroll;
  /** Saldo de Bits. */
  bits: number;
  /** Pede o reroll (o chamador desconta e grava); `false` = recusado. */
  onReroll: () => boolean;
}

function EscolhaDeAdversarios({ isPt, onPick, arena }: { isPt: boolean; onPick: (seed: number) => void; arena: ArenaRerollProps }) {
  const done = arenaRerollsToday(arena.reroll, arena.dayIso);
  // 3 desafios do DIA, determinísticos (mesmos ao reabrir), elementos distintos, no máximo 1 Desgarrado.
  const seeds = useMemo(() => arenaCards(arena.dayIso, arena.accountKey, done), [arena.dayIso, arena.accountKey, done]);
  const cost = arenaRerollCost(done);
  const free = arenaRerollsFreeLeft(done);
  const canReroll = arena.bits >= cost;
  const [pool, setPool] = useState<Awaited<ReturnType<typeof loadBestiaryPool>> | null>(null);
  const [chosen, setChosen] = useState(0);
  useEffect(() => {
    let alive = true;
    loadBestiaryPool().then(p => { if (alive) setPool(p); }).catch(() => { /* sem pool: o botão ainda abre uma luta sorteada */ });
    return () => { alive = false; };
  }, []);
  useEffect(() => { setChosen(0); }, [seeds]); // novo sorteio: volta ao 1º card
  useEffect(() => { onPick(seeds[Math.min(chosen, seeds.length - 1)]); }, [chosen, seeds, onPick]);
  if (!pool) return null;
  return (
    <div data-arena-escolha role="radiogroup" aria-label={isPt ? 'Escolha seus adversários' : 'Choose your opponents'} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ ...sm2Hint, margin: 0 }}>
        {isPt ? 'Você escolhe contra quem lutar — elementos variados, todos de poder parecido com o seu.' : 'You choose who to fight — mixed elements, all of power similar to yours.'}
      </p>
      {seeds.map((seed, i) => {
        const bossIdx = ARENA_ROUND_COMP[ARENA_ROUNDS - 1].indexOf('boss');
        const boss = arenaFoesOfSeed(seed, ARENA_ROUNDS)[Math.max(0, bossIdx)];
        const els = arenaCardElements(seed); // §199: o elemento da RUN (o de todo inimigo, fundido nas combinadas)
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
                {isStraySeed(seed) && <span data-arena-stray>{isPt ? 'Desgarrado · ' : 'Stray · '}</span>}
                {isPt ? 'Chefe: ' : 'Boss: '}{boss ? (isPt ? boss.namePt : boss.nameEn) : '—'}
              </span>
            </span>
            {on && <Icon name="check" size={24} tone="primary" />}
          </button>
        );
      })}
      <button
        type="button" data-arena-reroll disabled={!canReroll} onClick={() => { if (canReroll) arena.onReroll(); }}
        aria-label={free > 0 ? (isPt ? `Sortear outros três adversários, ${free} grátis` : `Draw three other opponents, ${free} free`) : (isPt ? `Sortear outros três adversários por ${cost} Bits` : `Draw three other opponents for ${cost} Bits`)}
        style={{ ...sm2Button('outline'), width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: canReroll ? 1 : 0.55 }}
      >
        <Icon name="refresh" size={24} tone="inherit" />
        <span data-arena-reroll-label>
          {free > 0
            ? (isPt ? `Sortear de novo · ${free} grátis` : `Draw again · ${free} free left`)
            : (isPt ? `Sortear de novo · ${cost} Bits` : `Draw again · ${cost} Bits`)}
        </span>
      </button>
      {!canReroll && (
        <p data-arena-reroll-faltam style={{ ...sm2Hint, margin: 0 }}>
          {isPt ? `Faltam ${cost - arena.bits} Bits para sortear de novo hoje.` : `${cost - arena.bits} more Bits needed to draw again today.`}
        </p>
      )}
    </div>
  );
}

export function DueloSheet({ language, onStart, arena }: {
  language: Language;
  /** Sorteio dos cards e reroll (`utils/arenaSorteio.ts`): os cards mostram os MESMOS inimigos que a `ArenaGame` luta (`arenaFoesOfSeed`). */
  arena: ArenaRerollProps;
  /** Mantido por compat com o chamador; o número de Poder saiu da folha (D-59). */
  evolutionStage?: string;
  /** Chamado com a semente do desafio ESCOLHIDO (sem ela, a Arena sorteia). */
  onStart: (seed?: number) => void;
}) {
  const isPt = language === 'pt-BR';
  const [pickedSeed, setPickedSeed] = useState<number | undefined>(undefined);

  return (
    <div data-duelo style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 11.3 (beta-2): elemento e golpes saíram da Arena livre e moram no PERFIL do Soulmon (Laboratório) — fonte única em `utils/soulmonPerfil.ts`. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ flex: 1 }} />
        <ModalInfo language={language} label={isPt ? 'Como funciona a Arena' : 'How the Arena works'} align="right">
          <span data-duelo-ajuda>
            <span style={{ display: 'block' }}>
              {isPt
                ? 'Elemento e golpes do seu Soulmon: veja no Perfil, no Laboratório.'
                : "Your Soulmon's element and strikes: see them in the Profile, in the Laboratory."}
            </span>
            <span data-duelo-como-lutar style={{ display: 'block', marginTop: 6 }}>
              <span style={{ display: 'block' }}>
                {isPt
                  ? 'Na luta, seu Soulmon ataca e se defende sozinho. Toque na tela (ou no mascote) para torcer.'
                  : 'In the fight, your Soulmon attacks and defends on its own. Tap the screen (or the mascot) to cheer.'}
              </span>
              <span style={{ display: 'block' }}>
                {isPt
                  ? 'No especial, toque no anel na hora certa; para esquivar do inimigo, deslize para o lado.'
                  : 'On its special, tap the ring at the right moment; to dodge the enemy’s, swipe sideways.'}
              </span>
            </span>
            <span style={{ display: 'block', marginTop: 6 }}>
              {isPt
                ? `Arena: ${ARENA_ROUNDS} rodadas PvE; você ESCOLHE os adversários, de poder parecido. Vencer rende Bits; perder não custa nada. Sortear de novo: 3 grátis por dia, depois Bits.`
                : `Arena: ${ARENA_ROUNDS} PvE rounds; you CHOOSE opponents of similar power. Wins earn Bits; losses cost nothing. Draw again: 3 free a day, then Bits.`}
            </span>
            <span style={{ display: 'block', marginTop: 6 }}>
              {isPt
                ? 'O Torneio é o modo ranqueado: o servidor sorteia os oponentes pela sua faixa.'
                : 'The Tournament is the ranked mode: the server draws opponents by your tier.'}
            </span>
          </span>
        </ModalInfo>
      </div>
      <EscolhaDeAdversarios isPt={isPt} onPick={setPickedSeed} arena={arena} />
      <button type="button" data-duelo-start onClick={() => onStart(pickedSeed)} style={{ ...sm2Button('primary'), width: '100%' }}>
        {isPt ? 'Lutar' : 'Fight'}
      </button>
    </div>
  );
}
