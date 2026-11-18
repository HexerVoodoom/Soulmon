import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { ARENA_ROUNDS, elementLabel, loadBestiaryPool } from '../../utils/arena';
import { useGameStateOptional } from '../../contexts/GameStateContext';
import { SCENE_BG } from '../../utils/fxPackArt';
import { ARENA_CHOICES, ARENA_REROLL_FREE_PER_DAY, arenaCardElements, arenaCards, arenaRerollCost, arenaRerollsFreeLeft, arenaRerollsToday, type ArenaReroll } from '../../utils/arenaSorteio';
import { elementIcon } from '../../utils/elementIconArt';
import { Icon } from '../ui/Icon';
import { ModalInfo } from '../ui/InfoTip';
import type { Language } from '../../utils/i18n';
import { EnergyCost } from '../ui/EnergyCost';
import { BotaoEspecial } from '../ui/BotaoEspecial';
import { DUEL_INVITE_ENERGY_COST, podeComprarConvites } from '../../utils/duelInvites';
import { bitsCategoryCap, minigameBitsCategoryToday } from '../../utils/currencies';
import { playerDayKey } from '../../utils/playerDay';

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
 * ARENA = VOCÊ ESCOLHE (guilda-lancamento PR1, 11/10/2026). `ARENA_CHOICES` desafios (4 desde 14/11/2026, §370; eram 3) de poder PARECIDO com o seu
 * (os adversários da Arena são sempre relativos ao level — `arenaFoe`), e o jogador seleciona contra quais
 * vai lutar. A semente do card é a da run: a `ArenaGame` luta exatamente o que o card mostrou. O Torneio é
 * o oposto, de propósito: lá o servidor sorteia pela faixa (`functions/api/_rankedPick.js`).
 */
export interface ArenaRerollProps {
  /** Dia do jogador (ISO, `playerDayIso` com o fuso do save): a semente dos cards e a virada dos rerolls grátis. */
  dayIso: string;
  /** Id estável da conta (`saveId`): parte da semente dos cards. */
  accountKey: string;
  /** O contador do save (`arenaReroll`). */
  reroll?: ArenaReroll;
  /** Saldo de Bits. */
  bits: number;
  /** Pede o reroll (o chamador desconta e grava); `false` = recusado. */
  onReroll: () => boolean;
  /** Runs terminadas no dia (`arenaRuns`): cada uma re-sorteia os cards de graça. */
  runs?: ArenaReroll;
  /** §222: o valor da escada (`arenaLadder`): o card mostra o que a luta vai ter. */
  ladder?: number;
  /** ⚔️ §458: o estoque de convites de Duelo e a troca por energia. Ausente = sem gate (testes antigos). */
  invites?: { count: number; max: number; perEnergy: number; canExchange: boolean; onExchange: () => boolean; onBegin: () => boolean };
}

function EscolhaDeAdversarios({ isPt, semFicha, onStart, startBlocked, arena }: { isPt: boolean; semFicha: boolean; onStart: (seed: number) => void; startBlocked: boolean; arena: ArenaRerollProps }) {
  const done = arenaRerollsToday(arena.reroll, arena.dayIso);
  // `ARENA_CHOICES` desafios do DIA, determinísticos (mesmos ao reabrir), elementos distintos, no máximo 1 Desgarrado.
  // §370: uma coluna só (o padrão desta folha): 4 cards de largura cheia cabem em 360 px sem rolagem lateral e o nome do chefe não corta.
  const runsDone = arenaRerollsToday(arena.runs, arena.dayIso);
  const seeds = useMemo(() => arenaCards(arena.dayIso, arena.accountKey, done, ARENA_CHOICES, runsDone), [arena.dayIso, arena.accountKey, done, runsDone]);
  const cost = arenaRerollCost(done);
  const free = arenaRerollsFreeLeft(done);
  const canReroll = arena.bits >= cost;
  const [pool, setPool] = useState<Awaited<ReturnType<typeof loadBestiaryPool>> | null>(null);
  /** QA r4: a carga do bestiário falhou (rede, cache frio). Antes, `.catch` vazio + `return null` sumiam com os cards sem aviso. */
  const [falhou, setFalhou] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    let alive = true;
    setFalhou(false);
    loadBestiaryPool().then(p => { if (alive) setPool(p); }).catch(() => { if (alive) setFalhou(true); });
    return () => { alive = false; };
  }, [tentativa]);
  if (!pool && falhou) {
    return (
      <div data-arena-escolha-erro role="alert" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ ...sm2Hint, margin: 0 }}>
          {isPt ? 'Não deu para carregar os adversários agora.' : "Couldn't load the opponents right now."}
        </p>
        <button type="button" data-arena-escolha-retry onClick={() => setTentativa(t => t + 1)} style={{ ...sm2Button('outline'), width: '100%' }}>
          {isPt ? 'Tentar de novo' : 'Try again'}
        </button>
      </div>
    );
  }
  if (!pool) {
    return (
      <div data-arena-escolha-carregando aria-busy="true" aria-label={isPt ? 'Carregando os adversários' : 'Loading the opponents'} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: ARENA_CHOICES }, (_, i) => (
          <span key={i} aria-hidden="true" data-arena-card-placeholder style={{ ...box, flex: 'none', width: '100%', opacity: 0.5 }} />
        ))}
      </div>
    );
  }
  return (
    <div data-arena-escolha role="list" aria-label={isPt ? 'Escolha seus adversários' : 'Choose your opponents'} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Banner ÚNICO acima da lista (mesma imagem de cena do lobby do Torneio). */}
      <div aria-hidden="true" data-arena-banner style={{ height: 112, borderRadius: 12, border: '1px solid var(--sm2-line)', background: `url(${SCENE_BG.duelo}) center 30%/cover var(--sm2-surface-2)`, imageRendering: 'pixelated' }} />
      {seeds.map((seed, i) => {
        const els = arenaCardElements(seed); // §199: o elemento da RUN (o de todo inimigo, fundido nas combinadas)
        const label = els.map(e => elementLabel(e, isPt)).join(' · ');
        return (
          <div key={seed} data-arena-card={i} role="listitem" style={{ ...box, flex: 'none', width: '100%', gap: 8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
              {els.slice(0, 3).map(e => {
                const a = elementIcon(e);
                return a ? <img key={e} src={a} alt="" width={28} height={28} style={{ width: 28, height: 28, imageRendering: 'pixelated' }} /> : null;
              })}
              <span style={{ ...sm2Text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </span>
            <button
              type="button" data-arena-card-fight={i} disabled={startBlocked}
              aria-label={isPt ? `Lutar contra o desafio ${i + 1}: ${label}` : `Fight — challenge ${i + 1}: ${label}`}
              onClick={() => onStart(seed)}
              style={{ ...sm2Button('primary', startBlocked, 'sm'), flexShrink: 0, minWidth: 88 }}
            >
              {isPt ? 'Lutar' : 'Fight'}
            </button>
          </div>
        );
      })}
      <button
        type="button" data-arena-reroll disabled={!canReroll} onClick={() => { if (canReroll) arena.onReroll(); }}
        aria-label={free > 0 ? (isPt ? `Sortear outros ${ARENA_CHOICES} adversários, ${free} grátis` : `Draw ${ARENA_CHOICES} other opponents, ${free} free`) : (isPt ? `Sortear outros ${ARENA_CHOICES} adversários por ${cost} Bits` : `Draw ${ARENA_CHOICES} other opponents for ${cost} Bits`)}
        style={{ ...sm2Button('outline'), width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: canReroll ? 1 : 0.55 }}
      >
        <Icon name="refresh" size={24} tone="inherit" />
        <span data-arena-reroll-label>
          {free > 0
            ? (isPt ? `Sortear de novo · ${free} grátis` : `Draw again · ${free} free left`)
            : (isPt ? `Sortear de novo · ${cost} Bits` : `Draw again · ${cost} Bits`)}
        </span>
      </button>
      {semFicha && (
        <p data-arena-sem-ficha style={{ ...sm2Hint, margin: 0 }}>
          {isPt
            ? 'Sua ficha ainda não está neste aparelho: você luta com um par genérico. Abra a página do seu Soulmon uma vez.'
            : "Your sheet is not on this device yet: you fight with a generic pair. Open your Soulmon's page once."}
        </p>
      )}
      {!canReroll && (
        <p data-arena-reroll-faltam style={{ ...sm2Hint, margin: 0 }}>
          {isPt ? `Faltam ${cost - arena.bits} Bits para sortear de novo hoje.` : `${cost - arena.bits} more Bits needed to draw again today.`}
        </p>
      )}
    </div>
  );
}

/** ⚔️ §458: "Comprar convites" (1ª opção, no topo; pedido do dono, 16/11/2026): o custo à vista no botão (N convites por 1 energia); os convites aparecem em LEQUE no topo (`TicketFan`, montado pelo `AreaView`). Sem energia, o texto diz o caminho. */
function ComprarConvites({ isPt, inv }: { isPt: boolean; inv: NonNullable<ArenaRerollProps['invites']> }) {
  const [recusou, setRecusou] = useState(false);
  return (
    <div data-duelo-convites style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <BotaoEspecial data-duelo-comprar onClick={() => setRecusou(!inv.onExchange())}>
        {isPt ? 'Comprar convites' : 'Buy invites'}
        <EnergyCost amount={DUEL_INVITE_ENERGY_COST} />
      </BotaoEspecial>
      <p data-duelo-convites-count className="sm2-num" style={{ ...sm2Hint, margin: 0, textAlign: 'center' }}>
        {isPt
          ? `${DUEL_INVITE_ENERGY_COST} energia = ${inv.perEnergy} convites`
          : `${DUEL_INVITE_ENERGY_COST} energy = ${inv.perEnergy} invites`}
      </p>
      {(recusou || inv.count < 1) && !inv.canExchange && (
        <p style={{ ...sm2Hint, margin: 0, textAlign: 'center' }}>
          {isPt ? 'Sem energia agora. Ela volta com o tempo.' : 'No energy right now. It comes back with time.'}
        </p>
      )}
    </div>
  );
}

export function DueloSheet({ language, onStart, arena, semFicha }: {
  /** A ficha de habilidades ainda não está neste aparelho: o card avisa em uma linha. */
  semFicha?: boolean;
  language: Language;
  /** Sorteio dos cards e reroll (`utils/arenaSorteio.ts`): os cards mostram os MESMOS inimigos que a `ArenaGame` luta (`arenaFoesOfSeed`). */
  arena: ArenaRerollProps;
  /** Mantido por compat com o chamador; o número de Poder saiu da folha (D-59). */
  evolutionStage?: string;
  /** Chamado com a semente do desafio ESCOLHIDO (sem ela, a Arena sorteia). */
  onStart: (seed?: number) => void;
}) {
  const isPt = language === 'pt-BR';
  // §456: teto de Bits por categoria. Linha calma, sem cor de alerta; bater o teto não fecha a Arena, só para de somar Bits.
  const gs = useGameStateOptional()?.gameState;
  const catCap = bitsCategoryCap(0);
  const catN = gs ? Math.min(catCap, minigameBitsCategoryToday(gs, playerDayKey(new Date(), gs.playerDayTz), 'arena')) : undefined;

  return (
    <div data-duelo style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {arena.invites && podeComprarConvites(arena.invites.count) && <ComprarConvites isPt={isPt} inv={arena.invites} />}
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
            <span data-duelo-ajuda-rodadas style={{ display: 'block', marginTop: 6 }}>
              {isPt
                ? `${ARENA_ROUNDS} rodadas seguidas, cada uma mais dura. O elemento pesa no dano; perder custa a run, nunca os seus corações.`
                : `${ARENA_ROUNDS} rounds back to back, each harder. Element weighs on damage; losing costs the run, never your hearts.`}
            </span>
            <span style={{ display: 'block', marginTop: 6 }}>
              {isPt
                ? `Arena: ${ARENA_ROUNDS} rodadas PvE; você ESCOLHE os adversários (1 de ${ARENA_CHOICES} desafios), de poder parecido. Vencer rende Bits; perder não custa nada. Sortear de novo: ${ARENA_REROLL_FREE_PER_DAY} grátis por dia, depois Bits.`
                : `Arena: ${ARENA_ROUNDS} PvE rounds; you CHOOSE opponents of similar power (1 of ${ARENA_CHOICES} challenges). Wins earn Bits; losses cost nothing. Draw again: ${ARENA_REROLL_FREE_PER_DAY} free a day, then Bits.`}
            </span>
            <span style={{ display: 'block', marginTop: 6 }}>
              {isPt
                ? 'O Torneio é o modo ranqueado: o servidor sorteia os oponentes pela sua faixa.'
                : 'The Tournament is the ranked mode: the server draws opponents by your tier.'}
            </span>
          </span>
        </ModalInfo>
      </div>
      <EscolhaDeAdversarios isPt={isPt} semFicha={!!semFicha} onStart={onStart} startBlocked={!!arena.invites && arena.invites.count < 1} arena={arena} />
      {catN !== undefined && (
        <p data-bits-categoria style={{ ...sm2Hint, margin: 0, textAlign: 'center' }}>
          <span className="sm2-num">{isPt ? `hoje: ${catN} de ${catCap} neste tipo de atividade` : `today: ${catN} of ${catCap} for this kind of activity`}</span>
        </p>
      )}
    </div>
  );
}
