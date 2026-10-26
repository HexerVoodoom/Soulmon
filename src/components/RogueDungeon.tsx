/**
 * CALABOUÇO ROGUELIKE (beta3 M7 + N7) — a tela do prédio `jogos.dungeon`. Regras e sorteios em `utils/rogueDungeon.ts`.
 * N7 (26/10/2026): a LISTA virou um MAPA em TELA CHEIA — um cenário existente (`DUNGEON_SCENES`) como fundo, 3 nós (os 3 andares) numa
 * trilha em SVG, o Soulmon parado no nó atual; as escolhas do passo (caminhos, bônus) sobem numa folha de baixo. O combate é uma LUTA
 * VISÍVEL (`RogueFight`, a `BattleStage` da Masmorra); os desafios que não são combate seguem sendo os jogos reais em modo desafio.
 * A masmorra/Endless Rift (`DungeonGame.tsx`) é outra coisa e não é tocada. A superfície NASCE MUDA (nenhum som novo).
 */
import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { entrarNaSuperficie } from '../utils/musica';
import { Icon } from './ui/Icon';
import type { GameChallenge } from '../utils/gameChallenge';
import { loadDinoGame, loadEcoGame, loadMatch3Game, loadPatchesGame, loadRPSGame, loadZipGame } from './nav/playPrefetch';
import type { Language } from '../utils/i18n';
import type { Combatant } from '../utils/combate/curve';
import { DUNGEON_SCENES } from '../utils/dungeonScenes';
import { getSpriteForStage } from '../utils/sprites';
import { useBackLayer } from '../utils/backStack';
import type { FichaSkills } from '../utils/soulProfile/ficha/stageSkillsFor';
import { RankingPanel } from './RankingPanel';
import floorDoor from '../assets/soulmon/icones-ui/masmorra-porta.png';
import floorStairs from '../assets/soulmon/icones-ui/masmorra-escada.png';
import floorChest from '../assets/soulmon/icones-ui/masmorra-bau-fechado.png';
import {
  ROGUE_FLOORS, ROGUE_MAX_STEPS, ROGUE_PER_FLOOR, VIGOR_STEP, applyBonus, hpOf, bonusChoices, cancelChallenge, challengeFor, consumePending, floorOf, isFinished, markPaid, pathsFor,
  resolveStep, startChallenge, rogueBits, rogueScore, runForDay, stepInFloor,
  type BonusKind, type ChallengeGame, type LightKind, type PathKind, type RogueRun,
} from '../utils/rogueDungeon';

// Jogos reais em modo desafio: lazy (mesmos `import()` do `playPrefetch`, o Vite deduplica).
const Match3Game = lazy(() => loadMatch3Game().then(m => ({ default: m.Match3Game })));
const DinoGame = lazy(() => loadDinoGame().then(m => ({ default: m.DinoGame })));
const RPSGame = lazy(() => loadRPSGame().then(m => ({ default: m.RPSGame })));
const EcoGame = lazy(() => loadEcoGame().then(m => ({ default: m.EcoGame })));
const ZipGame = lazy(() => loadZipGame().then(m => ({ default: m.ZipGame })));
const PatchesGame = lazy(() => loadPatchesGame().then(m => ({ default: m.PatchesGame })));
const RogueFight = lazy(() => import('./RogueFight').then(m => ({ default: m.RogueFight })));
const SoulBarrage = lazy(() => import('./SoulBarrage').then(m => ({ default: m.SoulBarrage })));

const GAME_GOAL_COPY: Record<ChallengeGame, (goal: number) => { en: string; pt: string }> = {
  match3: () => ({ en: 'Match 3: defeat the enemy team.', pt: 'Combina 3: vença o time inimigo.' }),
  dino: g => ({ en: `Obstacle Run: reach ${g} points.`, pt: `Corrida com obstáculos: chegue a ${g} pontos.` }),
  rps: g => ({ en: `Rock Paper Scissors: win ${g} rounds first.`, pt: `Pedra, Papel, Tesoura: vença ${g} rodadas primeiro.` }),
  zip: () => ({ en: 'Pet Trail: solve the puzzle.', pt: 'Trilha do Pet: resolva o puzzle.' }),
  patches: () => ({ en: 'Patchwork: solve the puzzle.', pt: 'Colcha: resolva o puzzle.' }),
  eco: g => ({ en: `Pet Echo: repeat an echo of ${g} stones.`, pt: `Eco do Pet: repita um eco de ${g} pedras.` }),
  barrage: g => ({ en: `Soul Barrage: survive ${g} seconds.`, pt: `Soul Barrage: sobreviva ${g} segundos.` }),
};

/** `descEn`/`descPt` = a linha curta do tipo de desafio mostrada no card. */
const PATH_COPY: Record<PathKind, { en: string; pt: string; icon: string; descEn: string; descPt: string }> = {
  combat: { en: 'Combat', pt: 'Combate', icon: 'swords', descEn: 'Fight the floor guardian.', descPt: 'Lute contra o guardião do andar.' },
  puzzle: { en: 'Puzzle', pt: 'Quebra-cabeça', icon: 'grid_view', descEn: 'Solve a logic puzzle.', descPt: 'Resolva um quebra-cabeça de lógica.' },
  minigame: { en: 'Minigame', pt: 'Minigame', icon: 'casino', descEn: 'Beat a quick arcade game.', descPt: 'Vença um jogo rápido de arcade.' },
  explore: { en: 'Mind trial', pt: 'Prova de mente', icon: 'psychology', descEn: 'Test your memory.', descPt: 'Teste sua memória.' },
};
const BONUS_COPY: Record<BonusKind, { en: string; pt: string; icon: string; descEn: string; descPt: string }> = {
  power: { en: '+6% attack', pt: '+6% de ataque', icon: 'bolt', descEn: 'Hit harder this run.', descPt: 'Bata mais forte nesta incursão.' },
  vigor: { en: '+10% health', pt: '+10% de vida', icon: 'favorite', descEn: 'More max health this run.', descPt: 'Mais vida máxima nesta incursão.' },
  heal: { en: 'Healing ward', pt: 'Proteção de cura', icon: 'auto_awesome', descEn: '15% shield in the next combat.', descPt: 'Escudo de 15% no próximo combate.' },
};
/** A arte provisória de cada andar no nó do mapa. A definitiva entra depois trocando só estes imports (por nome de arquivo). */
export const FLOOR_ICON_ART: Record<number, string> = { 1: floorDoor, 2: floorStairs, 3: floorChest };

const text = { margin: 0, color: 'var(--sm2-ink)', fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm, 14px)' } as const;
const btn = {
  display: 'flex', alignItems: 'center', gap: 8, width: '100%', minHeight: 44, textAlign: 'left', padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
  border: '1px solid var(--sm2-line, currentColor)', background: 'transparent', color: 'var(--sm2-ink)', fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm, 14px)',
} as const;

/** Erro ao carregar/renderizar o jogo do desafio (chunk offline, falha de render): mostra o erro e um botão para voltar — nunca derruba a tela. */
class ChallengeBoundary extends Component<{ isPt: boolean; onBack: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { /* o erro já aparece para o jogador; nada a reportar daqui */ }
  render() {
    if (!this.state.failed) return this.props.children;
    const { isPt, onBack } = this.props;
    return (
      <div data-rogue-challenge-error role="alert" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={text}>{isPt ? 'Não deu para abrir este desafio (talvez sem conexão). O passo não foi gasto.' : "This challenge couldn't open (maybe you're offline). The step wasn't spent."}</p>
        <button type="button" data-rogue-challenge-back onClick={onBack} style={btn}>{isPt ? 'Voltar' : 'Back'}</button>
      </div>
    );
  }
}

export interface RogueDungeonProps {
  language: Language;
  /** Dia do jogador em ISO (reset diário). */
  todayKey: string;
  /** Incursão guardada no save (de qualquer dia: outro dia vira incursão nova). */
  saved?: RogueRun;
  onChange: (run: RogueRun) => void;
  /** `soulCombatant(estado)` do pet. */
  combatant: Combatant;
  saveId?: string;
  /** Bits pelo funil/teto diário existente dos minigames. */
  onEarnPoints?: (points: number) => void;
  /** Dados do Soulmon para os jogos em modo desafio e para a luta (arte/sprite/golpes). */
  evolutionStage?: string;
  demoCharacterId?: string;
  petName?: string;
  petElement?: string;
  playerLevel?: number;
  /** As skills da ficha (a identidade de golpe da luta). */
  skills?: FichaSkills;
  /** Fecha a tela cheia (volta à área). Ausente (testes) = sem botão de fechar. */
  onClose?: () => void;
}

/** Onde os 3 nós (os andares) ficam no mapa, em % da área do mapa (esquerda/topo), de baixo para cima. */
const NODE_POS: ReadonlyArray<{ x: number; y: number }> = [{ x: 24, y: 80 }, { x: 72, y: 50 }, { x: 30, y: 20 }];
/** A trilha que liga os nós, em coordenadas 0..100 da mesma área. */
const TRAIL_D = 'M24 80 C 58 86, 88 68, 72 50 S 8 36, 30 20';

/** Um card de escolha (caminho ou bônus): ícone grande SEM caixa, título e uma linha. Alvo de toque bem acima de 44 px; o foco usa o anel padrão do navegador. */
const cardStyle = {
  flex: '1 1 96px', minWidth: 96, maxWidth: 150, minHeight: 132, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 6,
  padding: '12px 8px', textAlign: 'center', cursor: 'pointer', borderRadius: 'var(--sm2-radius-md, 8px)', border: '1px solid var(--sm2-line, currentColor)',
  background: 'var(--sm2-surface)', color: 'var(--sm2-ink)', fontFamily: 'var(--sm2-font-text)',
} as const;
const sheetStyle = {
  position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '58%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8,
  padding: '14px 16px calc(14px + env(safe-area-inset-bottom, 0px))', borderRadius: 'var(--sm2-radius-lg, 16px) var(--sm2-radius-lg, 16px) 0 0',
  background: 'var(--sm2-surface)', color: 'var(--sm2-ink)', borderTop: '1px solid var(--sm2-line, currentColor)', zIndex: 3,
} as const;
const hudText = { margin: 0, color: 'var(--sm2-viewport-ink)', fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm, 14px)', textShadow: '0 1px 2px rgba(0,0,0,.9)' } as const;

export function RogueDungeon({ language, todayKey, saved, onChange, combatant, saveId, onEarnPoints, evolutionStage = 'rookie', demoCharacterId, petName, petElement, playerLevel, skills, onClose }: RogueDungeonProps) {
  // S18: o Calabouço toca o "Dungeon Theme" inteiro (mapa e escolhas; a luta troca para a música de combate).
  useEffect(() => entrarNaSuperficie('masmorra-mapa'), []);
  const isPt = language === 'pt-BR';
  const t = (c: { en: string; pt: string }) => (isPt ? c.pt : c.en);
  const run = runForDay(saved, todayKey);
  const [challenge, setChallenge] = useState<LightKind | null>(null);
  const [fighting, setFighting] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const finished = isFinished(run);
  useBackLayer(!!onClose && !challenge && !fighting, () => onClose?.());

  // Fim da incursão: paga os Bits UMA vez (o teto diário do app limita). `paidRef` trava remontagem/re-render antes de o save voltar com
  // `paid`; `onEarnPoints` (instável, vem inline do pai) fica fora das deps, lido pelo ref.
  const paidRef = useRef(false);
  const earnRef = useRef(onEarnPoints);
  earnRef.current = onEarnPoints;
  useEffect(() => {
    if (!finished || run.paid || paidRef.current) return;
    paidRef.current = true;
    if (run.won > 0) earnRef.current?.(rogueBits(run));
    onChange(markPaid(run));
  }, [finished, run, onChange]);

  // Voltou com um desafio em curso (saiu/desmontou/fechou o app sem terminar): o passo é CONSUMIDO — sem re-tentar de graça nem espiar.
  useEffect(() => {
    if (!run.pending) return;
    setNote(isPt ? 'Você saiu do desafio — o passo se foi, mas a incursão segue.' : 'You left the challenge — that step is spent, but the run goes on.');
    onChange(consumePending(run));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const paths = useMemo(() => (finished || run.bonusPending ? [] : pathsFor(run.day, run.step)), [finished, run.bonusPending, run.day, run.step]);
  const bonuses = useMemo(() => (run.bonusPending ? bonusChoices(run.day, run.step - 1) : []), [run.bonusPending, run.day, run.step]);
  const ch = useMemo(() => (challenge ? challengeFor(run.day, run.step, challenge) : null), [challenge, run.day, run.step]);

  const finish = (kind: PathKind, victory: boolean, msg: string, hpLeft?: number) => {
    setNote(msg);
    setChallenge(null);
    setFighting(false);
    onChange(resolveStep(run, kind, victory, hpLeft));
  };

  const choose = (kind: PathKind) => {
    if (kind !== 'combat') { settled.current = false; setChallenge(kind); onChange(startChallenge(run, kind)); return; }
    setNote(null);
    setFighting(true); // o combate é uma luta visível (`RogueFight`); o passo só resolve quando ela termina
  };
  const fightResult = (won: boolean, foeName: string, hpLeft: number) => finish('combat', won, won
    ? (isPt ? `Você venceu ${foeName}!` : `You defeated ${foeName}!`)
    : (isPt ? `${foeName} venceu. O dia na masmorra acabou — volte amanhã.` : `${foeName} won. The dungeon day is over — come back tomorrow.`), hpLeft);

  // Resultado do jogo real em modo desafio (vitória/derrota voltam ao mapa). Ignora chamada repetida.
  const settled = useRef(false);
  const gameResult = (won: boolean) => {
    if (!ch || settled.current) return;
    settled.current = true;
    finish(ch.kind, won, won ? (isPt ? 'Desafio vencido!' : 'Challenge won!') : (isPt ? 'Desafio perdido — o passo se foi, mas a incursão segue.' : 'Challenge lost — that step is spent, but the run goes on.'));
  };
  const challengeProp: GameChallenge | undefined = ch ? { goal: ch.goal, onResult: gameResult } : undefined;
  const gameProps = { language, evolutionStage, demoCharacterId, onEarnPoints: () => {}, onExit: () => gameResult(false), challenge: challengeProp } as const;
  const renderGame = (g: ChallengeGame) => {
    switch (g) {
      case 'match3': return <Match3Game {...gameProps} petName={petName} petElement={petElement} playerLevel={playerLevel} />;
      case 'dino': return <DinoGame {...gameProps} onScore={() => {}} petElement={petElement} />;
      case 'rps': return <RPSGame {...gameProps} />;
      case 'zip': return <ZipGame {...gameProps} />;
      case 'patches': return <PatchesGame {...gameProps} />;
      case 'eco': return <EcoGame {...gameProps} />;
      case 'barrage': return <SoulBarrage {...gameProps} petElement={petElement} playerLevel={playerLevel} />;
    }
  };

  const floor = floorOf(Math.min(run.step, ROGUE_MAX_STEPS - 1));
  const scene = DUNGEON_SCENES[(floor - 1) % DUNGEON_SCENES.length];
  const petSprite = getSpriteForStage(evolutionStage, demoCharacterId, 256);
  const doneInFloor = (n: number) => Math.max(0, Math.min(ROGUE_PER_FLOOR, run.step - (n - 1) * ROGUE_PER_FLOOR));
  const hpFrac = hpOf(run);
  const hpMax = Math.max(1, Math.round(combatant.hp * (1 + VIGOR_STEP * run.vigor)));
  const hpNow = Math.max(1, Math.round(hpFrac * hpMax));
  /** Fração da trilha já percorrida (passos resolvidos / total). */
  const walked = Math.min(1, run.step / ROGUE_MAX_STEPS);

  return (
    <div data-rogue-dungeon style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: scene.bg, color: 'var(--sm2-viewport-ink)' }}>
      {/* véu para o texto e a trilha lerem sobre qualquer cenário */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(6,18,22,.62), rgba(6,18,22,.38) 40%, rgba(6,18,22,.72))' }} />

      <header style={{ position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 4, display: 'flex', alignItems: 'flex-start', gap: 8, padding: 'calc(10px + env(safe-area-inset-top, 0px)) 8px 0 8px' }}>
        {onClose && (
          <button type="button" data-rogue-close onClick={onClose} aria-label={isPt ? 'Fechar o Calabouço' : 'Close the Dungeon'} style={{ background: 'none', border: 'none', boxShadow: 'none', padding: 0, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--sm2-viewport-ink)' }}>
            <Icon name="close" size={24} tone="inherit" />
          </button>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, paddingTop: 4 }}>
          <h2 style={{ ...hudText, fontFamily: 'var(--sm2-font-display)', fontSize: 'var(--sm2-text-lg, 20px)', fontWeight: 700 }}>{isPt ? 'Calabouço' : 'Dungeon'}</h2>
          <p data-rogue-progress style={hudText}>
            {isPt
              ? `Andar ${floor}/${ROGUE_FLOORS} · desafio ${Math.min(stepInFloor(run.step) + 1, ROGUE_PER_FLOOR)}/${ROGUE_PER_FLOOR} · vencidos ${run.won} · pontos ${rogueScore(run)}`
              : `Floor ${floor}/${ROGUE_FLOORS} · challenge ${Math.min(stepInFloor(run.step) + 1, ROGUE_PER_FLOOR)}/${ROGUE_PER_FLOOR} · won ${run.won} · score ${rogueScore(run)}`}
          </p>
          {(run.power > 0 || run.vigor > 0 || run.shield > 0) && (
            <p data-rogue-bonuses style={hudText}>
              <span style={{ display: 'inline-flex', gap: 12, alignItems: 'center' }}>
                <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><Icon name="bolt" size={20} tone="inherit" label={isPt ? 'ataque' : 'attack'} />{run.power}</span>
                <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><Icon name="favorite" size={20} tone="inherit" label={isPt ? 'vida' : 'health'} />{run.vigor}</span>
                <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><Icon name="auto_awesome" size={20} tone="inherit" label={isPt ? 'escudo' : 'shield'} />{run.shield}</span>
              </span>
            </p>
          )}
          <div data-rogue-hp role="img" aria-label={isPt ? `Vida ${hpNow} de ${hpMax}` : `Health ${hpNow} of ${hpMax}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="favorite" size={20} tone="inherit" />
            <span aria-hidden style={{ width: 72, height: 6, borderRadius: 3, background: 'var(--sm2-viewport-ring)', overflow: 'hidden', display: 'block' }}>
              <span data-rogue-hp-fill style={{ display: 'block', height: '100%', width: `${Math.round(hpFrac * 100)}%`, background: 'var(--sm2-gold-fill)' }} />
            </span>
            <span className="sm2-num" style={{ ...hudText, fontSize: 'var(--sm2-text-xs, 12px)' }}>{hpNow}/{hpMax}</span>
          </div>
        </div>
      </header>

      {/* O MAPA: a trilha em SVG (0..100 esticado à área) e os 3 nós posicionados em % por cima. */}
      <div data-rogue-map style={{ position: 'absolute', left: 0, right: 0, top: 'calc(88px + env(safe-area-inset-top, 0px))', bottom: '40%', zIndex: 2 }}>
        <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
          <path d={TRAIL_D} fill="none" stroke="var(--sm2-viewport-ring)" strokeOpacity={0.45} strokeWidth={3} strokeDasharray="1 2.4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <path data-rogue-trail-walked d={TRAIL_D} pathLength={1} fill="none" stroke="var(--sm2-gold-fill)" strokeWidth={4} strokeLinecap="round" strokeDasharray={`${walked} 1`} vectorEffect="non-scaling-stroke" style={{ filter: 'drop-shadow(0 0 4px var(--sm2-gold-fill))' }} />
        </svg>
        {NODE_POS.map((p, i) => {
          const n = i + 1;
          const state: 'done' | 'current' | 'locked' = run.step >= n * ROGUE_PER_FLOOR ? 'done' : n === floor && !finished ? 'current' : n < floor ? 'done' : 'locked';
          const sc = DUNGEON_SCENES[i % DUNGEON_SCENES.length];
          return (
            <div key={n} data-rogue-node={n} data-rogue-node-state={state} style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 120 }}>
              {state === 'current' && <img data-rogue-pet src={petSprite} alt="" draggable={false} style={{ width: 56, height: 56, objectFit: 'contain', imageRendering: 'pixelated', marginBottom: -6, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.7))' }} />}
              <span data-rogue-floor-art style={{ position: 'relative', width: 56, height: 56, display: 'block', filter: state === 'current' ? 'drop-shadow(0 0 8px var(--sm2-primary-fill))' : 'drop-shadow(0 2px 3px rgba(0,0,0,.7))' }}>
                <img src={FLOOR_ICON_ART[n]} alt="" draggable={false} style={{ width: 56, height: 56, objectFit: 'contain', imageRendering: 'pixelated', opacity: state === 'locked' ? 0.45 : 1, filter: state === 'locked' ? 'grayscale(1)' : 'none' }} />
                {state === 'locked' && <span style={{ position: 'absolute', right: -6, bottom: -4, color: 'var(--sm2-viewport-ink)', display: 'flex' }}><Icon name="lock" size={24} tone="inherit" label={isPt ? 'andar trancado' : 'floor locked'} /></span>}
                {state === 'done' && <span style={{ position: 'absolute', right: -6, bottom: -4, color: 'var(--sm2-gold-fill)', display: 'flex' }}><Icon name="check_circle" size={24} tone="inherit" label={isPt ? 'andar concluído' : 'floor cleared'} /></span>}
                {state === 'current' && <span style={{ position: 'absolute', right: -6, bottom: -4, color: 'var(--sm2-primary-fill)', display: 'flex' }}><Icon name="flag" size={24} tone="inherit" label={isPt ? 'andar atual' : 'current floor'} /></span>}
              </span>
              <span style={{ ...hudText, fontWeight: 700, textAlign: 'center' }}>{isPt ? `Andar ${n}` : `Floor ${n}`}</span>
              <span style={{ ...hudText, fontSize: 'var(--sm2-text-xs, 12px)', textAlign: 'center', opacity: state === 'locked' ? 0.75 : 1 }}>{isPt ? sc.namePt : sc.nameEn}</span>
              <span aria-hidden style={{ display: 'flex', gap: 3 }}>
                {Array.from({ length: ROGUE_PER_FLOOR }, (_, k) => (
                  <span key={k} style={{ width: 6, height: 6, borderRadius: '50%', background: k < doneInFloor(n) ? 'var(--sm2-gold-fill)' : 'var(--sm2-viewport-ring)', opacity: k < doneInFloor(n) ? 1 : 0.5 }} />
                ))}
              </span>
            </div>
          );
        })}
      </div>

      {/* Passo: as escolhas viram CARDS no meio da tela, sobre o mapa escurecido. */}
      {!ch && !fighting && !finished && (run.bonusPending || paths.length > 0) && (
        <div data-rogue-cards aria-live="polite" style={{ position: 'absolute', inset: 0, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '88px 16px 24px', boxSizing: 'border-box', background: 'rgba(6,18,22,.62)' }}>
          {note && <p data-rogue-note style={{ ...hudText, fontWeight: 700, textAlign: 'center' }}>{note}</p>}
          {run.bonusPending ? (
            <div data-rogue-bonus-pick style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
              <p style={{ ...hudText, textAlign: 'center', fontWeight: 700 }}>{isPt ? 'Escolha 1 bônus (vale só nesta incursão):' : 'Pick 1 bonus (this run only):'}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', width: '100%' }}>
                {bonuses.map(b => (
                  <button key={b} type="button" data-rogue-card data-rogue-bonus={b} style={cardStyle} onClick={() => { setNote(null); onChange(applyBonus(run, b)); }}>
                    <Icon name={BONUS_COPY[b].icon} size={40} tone="inherit" />
                    <span style={{ fontWeight: 700, fontSize: 'var(--sm2-text-sm, 14px)' }}>{t(BONUS_COPY[b])}</span>
                    <span style={{ fontSize: 'var(--sm2-text-xs, 12px)' }}>{isPt ? BONUS_COPY[b].descPt : BONUS_COPY[b].descEn}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div data-rogue-paths style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
              <p style={{ ...hudText, textAlign: 'center', fontWeight: 700 }}>
                {paths.length === 1
                  ? (isPt ? 'Um combate bloqueia o caminho.' : 'A combat blocks the way.')
                  : (isPt ? 'Escolha seu caminho:' : 'Choose your path:')}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', width: '100%' }}>
                {paths.map(p => (
                  <button key={p} type="button" data-rogue-card data-rogue-path={p} style={cardStyle} onClick={() => choose(p)}>
                    <Icon name={PATH_COPY[p].icon} size={40} tone="inherit" />
                    <span style={{ fontWeight: 700, fontSize: 'var(--sm2-text-sm, 14px)' }}>{t(PATH_COPY[p])}</span>
                    <span style={{ fontSize: 'var(--sm2-text-xs, 12px)' }}>{isPt ? PATH_COPY[p].descPt : PATH_COPY[p].descEn}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* A folha de baixo: só o fim do dia. */}
      {!ch && !fighting && finished && (
        <section data-rogue-sheet style={sheetStyle} aria-live="polite">
          {note && <p data-rogue-note style={{ ...text, fontWeight: 700 }}>{note}</p>}
          <div data-rogue-over style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={text}>
              {run.over
                ? (isPt ? 'A incursão de hoje terminou. Ela recomeça amanhã, sem os bônus.' : "Today's run is over. It starts again tomorrow, without the bonuses.")
                : (isPt ? 'Você concluiu os 3 andares de hoje! Volte amanhã.' : 'You cleared all 3 floors today! Come back tomorrow.')}
            </p>
            <RankingPanel game="rogue-dungeon" saveId={saveId} language={language} score={rogueScore(run)} period="weekly" />
          </div>
        </section>
      )}

      {fighting && !finished && (
        <Suspense fallback={<p style={{ ...hudText, position: 'absolute', left: 0, right: 0, bottom: 24, textAlign: 'center', zIndex: 4 }}>{isPt ? 'Carregando a luta…' : 'Loading the fight…'}</p>}>
          <ChallengeBoundary isPt={isPt} onBack={() => setFighting(false)}>
            <RogueFight language={language} run={run} step={run.step} combatant={combatant} skills={skills} petElement={petElement} evolutionStage={evolutionStage} demoCharacterId={demoCharacterId} floor={floor} onResult={fightResult} />
          </ChallengeBoundary>
        </Suspense>
      )}

      {ch && !finished && (
        <div data-rogue-challenge={ch.kind} data-rogue-game={ch.game} style={{ position: 'absolute', inset: 0, zIndex: 5, display: 'flex', flexDirection: 'column', background: 'var(--sm2-bg)' }}>
          <p style={{ ...text, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px' }}><Icon name={PATH_COPY[ch.kind].icon} size={20} tone="inherit" /> {t(GAME_GOAL_COPY[ch.game](ch.goal))}</p>
          <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
            <ChallengeBoundary isPt={isPt} onBack={() => { setChallenge(null); onChange(cancelChallenge(run)); }}>
              <Suspense fallback={<p style={text}>{isPt ? 'Carregando…' : 'Loading…'}</p>}>
                {renderGame(ch.game)}
              </Suspense>
            </ChallengeBoundary>
          </div>
        </div>
      )}
    </div>
  );
}
