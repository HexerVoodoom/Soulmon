/**
 * CALABOUÇO ROGUELIKE (beta3 M7) — a tela do prédio `jogos.dungeon`. Regras e sorteios em `utils/rogueDungeon.ts`;
 * aqui só a apresentação: escolher 1 de 3 caminhos, resolver o desafio, escolher 1 de 3 bônus. Arte provisória
 * (sem asset novo). A masmorra/Endless Rift (`DungeonGame.tsx`) é outra coisa e não é tocada.
 */
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import type { GameChallenge } from '../utils/gameChallenge';
import { loadDinoGame, loadEcoGame, loadMatch3Game, loadPatchesGame, loadRPSGame, loadZipGame } from './nav/playPrefetch';
import type { Language } from '../utils/i18n';
import type { Combatant } from '../utils/combate/curve';
import { mulberry32 } from '../utils/combate/rng';
import { pickEnemy } from '../utils/enemyRoster';
import { RankingPanel } from './RankingPanel';
import {
  ROGUE_FLOORS, ROGUE_MAX_STEPS, ROGUE_PER_FLOOR, applyBonus, bonusChoices, challengeFor, floorOf, isFinished, markPaid, pathsFor,
  resolveStep, rogueBits, rogueScore, runForDay, simulateRogueCombat, stepInFloor,
  type BonusKind, type ChallengeGame, type LightKind, type PathKind, type RogueRun,
} from '../utils/rogueDungeon';

// Jogos reais em modo desafio: lazy (mesmos `import()` do `playPrefetch`, o Vite deduplica).
const Match3Game = lazy(() => loadMatch3Game().then(m => ({ default: m.Match3Game })));
const DinoGame = lazy(() => loadDinoGame().then(m => ({ default: m.DinoGame })));
const RPSGame = lazy(() => loadRPSGame().then(m => ({ default: m.RPSGame })));
const EcoGame = lazy(() => loadEcoGame().then(m => ({ default: m.EcoGame })));
const ZipGame = lazy(() => loadZipGame().then(m => ({ default: m.ZipGame })));
const PatchesGame = lazy(() => loadPatchesGame().then(m => ({ default: m.PatchesGame })));
const SoulBarrage = lazy(() => import('./SoulBarrage').then(m => ({ default: m.SoulBarrage })));

const GAME_GOAL_COPY: Record<ChallengeGame, (goal: number) => { en: string; pt: string }> = {
  match3: () => ({ en: 'Match 3: defeat the enemy team.', pt: 'Combina 3: vença o time inimigo.' }),
  dino: g => ({ en: `Obstacle Run: reach ${g} points.`, pt: `Corrida com obstáculos: chegue a ${g} pontos.` }),
  rps: g => ({ en: `Rock Paper Scissors: win ${g} rounds first.`, pt: `Pedra, Papel, Tesoura: vença ${g} rodadas primeiro.` }),
  zip: () => ({ en: 'Pet Trail: solve the puzzle.', pt: 'Trilha do Pet: resolva o puzzle.' }),
  patches: () => ({ en: 'Patches: solve the puzzle.', pt: 'Patches: resolva o puzzle.' }),
  eco: g => ({ en: `Pet Echo: repeat an echo of ${g} stones.`, pt: `Eco do Pet: repita um eco de ${g} pedras.` }),
  barrage: g => ({ en: `Soul Barrage: survive ${g} seconds.`, pt: `Soul Barrage: sobreviva ${g} segundos.` }),
};

const PATH_COPY: Record<PathKind, { en: string; pt: string; icon: string }> = {
  combat: { en: 'Combat', pt: 'Combate', icon: '⚔️' },
  puzzle: { en: 'Puzzle', pt: 'Quebra-cabeça', icon: '🧩' },
  minigame: { en: 'Minigame', pt: 'Minigame', icon: '🎯' },
  explore: { en: 'Mind trial', pt: 'Prova de mente', icon: '🧭' },
};
const BONUS_COPY: Record<BonusKind, { en: string; pt: string; icon: string }> = {
  power: { en: '+6% attack', pt: '+6% de ataque', icon: '💪' },
  vigor: { en: '+10% health', pt: '+10% de vida', icon: '❤️' },
  heal: { en: 'Healing ward (15% shield next combat)', pt: 'Proteção de cura (escudo de 15% no próximo combate)', icon: '✨' },
};

const text = { margin: 0, color: 'var(--sm2-ink)', fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm, 14px)' } as const;
const btn = {
  display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
  border: '1px solid var(--sm2-line, currentColor)', background: 'transparent', color: 'var(--sm2-ink)', fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm, 14px)',
} as const;

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
  /** Dados do Soulmon para os jogos em modo desafio (arte/sprite). */
  evolutionStage?: string;
  demoCharacterId?: string;
  petName?: string;
  petElement?: string;
  playerLevel?: number;
}

export function RogueDungeon({ language, todayKey, saved, onChange, combatant, saveId, onEarnPoints, evolutionStage = 'rookie', demoCharacterId, petName, petElement, playerLevel }: RogueDungeonProps) {
  const isPt = language === 'pt-BR';
  const t = (c: { en: string; pt: string }) => (isPt ? c.pt : c.en);
  const run = runForDay(saved, todayKey);
  const [challenge, setChallenge] = useState<LightKind | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const finished = isFinished(run);

  // Fim da incursão: paga os Bits UMA vez (o teto diário do app limita).
  useEffect(() => {
    if (!finished || run.paid) return;
    if (run.won > 0) onEarnPoints?.(rogueBits(run));
    onChange(markPaid(run));
  }, [finished, run, onChange, onEarnPoints]);

  const paths = useMemo(() => (finished || run.bonusPending ? [] : pathsFor(run.day, run.step)), [finished, run.bonusPending, run.day, run.step]);
  const bonuses = useMemo(() => (run.bonusPending ? bonusChoices(run.day, run.step - 1) : []), [run.bonusPending, run.day, run.step]);
  const ch = useMemo(() => (challenge ? challengeFor(run.day, run.step, challenge) : null), [challenge, run.day, run.step]);

  const finish = (kind: PathKind, victory: boolean, msg: string) => {
    setNote(msg);
    setChallenge(null);
    onChange(resolveStep(run, kind, victory));
  };

  const choose = (kind: PathKind) => {
    if (kind !== 'combat') { settled.current = false; setChallenge(kind); return; }
    const foe = pickEnemy(combatant.level, mulberry32(run.step * 7919 + 13), { stage: floorOf(run.step) >= 3 ? 'ultimate' : floorOf(run.step) === 2 ? 'champion' : 'rookie' });
    const res = simulateRogueCombat(run, run.step, combatant);
    finish('combat', res.won, res.won
      ? (isPt ? `Você venceu ${foe.name}!` : `You defeated ${foe.name}!`)
      : (isPt ? `${foe.name} venceu. O dia na masmorra acabou — volte amanhã.` : `${foe.name} won. The dungeon day is over — come back tomorrow.`));
  };

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
      case 'match3': return <Match3Game {...gameProps} petName={petName} playerLevel={playerLevel} />;
      case 'dino': return <DinoGame {...gameProps} onScore={() => {}} petElement={petElement} />;
      case 'rps': return <RPSGame {...gameProps} />;
      case 'zip': return <ZipGame {...gameProps} />;
      case 'patches': return <PatchesGame {...gameProps} />;
      case 'eco': return <EcoGame {...gameProps} />;
      case 'barrage': return <SoulBarrage {...gameProps} petElement={petElement} playerLevel={playerLevel} />;
    }
  };

  const floor = floorOf(Math.min(run.step, ROGUE_MAX_STEPS - 1));
  return (
    <div data-rogue-dungeon style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p data-rogue-progress style={text}>
        {isPt
          ? `Andar ${floor}/${ROGUE_FLOORS} · desafio ${Math.min(stepInFloor(run.step) + 1, ROGUE_PER_FLOOR)}/${ROGUE_PER_FLOOR} · vencidos ${run.won} · pontos ${rogueScore(run)}`
          : `Floor ${floor}/${ROGUE_FLOORS} · challenge ${Math.min(stepInFloor(run.step) + 1, ROGUE_PER_FLOOR)}/${ROGUE_PER_FLOOR} · won ${run.won} · score ${rogueScore(run)}`}
      </p>
      {(run.power > 0 || run.vigor > 0 || run.shield > 0) && (
        <p data-rogue-bonuses style={text}>
          {`💪 ${run.power}  ❤️ ${run.vigor}  ✨ ${run.shield}`}
        </p>
      )}
      {note && <p data-rogue-note style={text}>{note}</p>}

      {finished && (
        <div data-rogue-over style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={text}>
            {run.over
              ? (isPt ? 'A incursão de hoje terminou. Ela recomeça amanhã, sem os bônus.' : 'Today\'s run is over. It starts again tomorrow, without the bonuses.')
              : (isPt ? 'Você concluiu os 3 andares de hoje! Volte amanhã.' : 'You cleared all 3 floors today! Come back tomorrow.')}
          </p>
          <RankingPanel game="rogue-dungeon" saveId={saveId} language={language} score={rogueScore(run)} period="weekly" />
        </div>
      )}

      {run.bonusPending && (
        <div data-rogue-bonus-pick style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={text}>{isPt ? 'Escolha 1 bônus (vale só nesta incursão):' : 'Pick 1 bonus (this run only):'}</p>
          {bonuses.map(b => (
            <button key={b} type="button" data-rogue-bonus={b} style={btn} onClick={() => { setNote(null); onChange(applyBonus(run, b)); }}>
              {BONUS_COPY[b].icon} {t(BONUS_COPY[b])}
            </button>
          ))}
        </div>
      )}

      {!finished && !run.bonusPending && !ch && (
        <div data-rogue-paths style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={text}>
            {paths.length === 1
              ? (isPt ? 'Um combate bloqueia o caminho.' : 'A combat blocks the way.')
              : (isPt ? 'Escolha seu caminho:' : 'Choose your path:')}
          </p>
          {paths.map(p => (
            <button key={p} type="button" data-rogue-path={p} style={btn} onClick={() => choose(p)}>
              {PATH_COPY[p].icon} {t(PATH_COPY[p])}
            </button>
          ))}
        </div>
      )}

      {ch && !finished && (
        <div data-rogue-challenge={ch.kind} data-rogue-game={ch.game} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={text}>{PATH_COPY[ch.kind].icon} {t(GAME_GOAL_COPY[ch.game](ch.goal))}</p>
          <Suspense fallback={<p style={text}>{isPt ? 'Carregando…' : 'Loading…'}</p>}>
            {renderGame(ch.game)}
          </Suspense>
        </div>
      )}
    </div>
  );
}
