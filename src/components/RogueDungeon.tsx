/**
 * CALABOUÇO ROGUELIKE (beta3 M7) — a tela do prédio `jogos.dungeon`. Regras e sorteios em `utils/rogueDungeon.ts`;
 * aqui só a apresentação: escolher 1 de 3 caminhos, resolver o desafio, escolher 1 de 3 bônus. Arte provisória
 * (sem asset novo). A masmorra/Endless Rift (`DungeonGame.tsx`) é outra coisa e não é tocada.
 */
import { useEffect, useMemo, useState } from 'react';
import type { Language } from '../utils/i18n';
import type { Combatant } from '../utils/combate/curve';
import { mulberry32 } from '../utils/combate/rng';
import { pickEnemy } from '../utils/enemyRoster';
import { RankingPanel } from './RankingPanel';
import {
  ROGUE_FLOORS, ROGUE_MAX_STEPS, ROGUE_PER_FLOOR, applyBonus, bonusChoices, challengeFor, floorOf, isFinished, markPaid, pathsFor,
  resolveStep, rogueBits, rogueScore, runForDay, simulateRogueCombat, stepInFloor,
  type BonusKind, type LightKind, type PathKind, type RogueRun,
} from '../utils/rogueDungeon';

const PATH_COPY: Record<PathKind, { en: string; pt: string; icon: string }> = {
  combat: { en: 'Combat', pt: 'Combate', icon: '⚔️' },
  puzzle: { en: 'Puzzle', pt: 'Quebra-cabeça', icon: '🧩' },
  minigame: { en: 'Minigame', pt: 'Minigame', icon: '🎯' },
  explore: { en: 'Exploration tool', pt: 'Ferramenta de Exploração', icon: '🧭' },
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
}

export function RogueDungeon({ language, todayKey, saved, onChange, combatant, saveId, onEarnPoints }: RogueDungeonProps) {
  const isPt = language === 'pt-BR';
  const t = (c: { en: string; pt: string }) => (isPt ? c.pt : c.en);
  const run = runForDay(saved, todayKey);
  const [challenge, setChallenge] = useState<LightKind | null>(null);
  const [taps, setTaps] = useState<string[]>([]);
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
    setTaps([]);
    onChange(resolveStep(run, kind, victory));
  };

  const choose = (kind: PathKind) => {
    if (kind !== 'combat') { setChallenge(kind); setTaps([]); return; }
    const foe = pickEnemy(combatant.level, mulberry32(run.step * 7919 + 13), { stage: floorOf(run.step) >= 3 ? 'ultimate' : floorOf(run.step) === 2 ? 'champion' : 'rookie' });
    const res = simulateRogueCombat(run, run.step, combatant);
    finish('combat', res.won, res.won
      ? (isPt ? `Você venceu ${foe.name}!` : `You defeated ${foe.name}!`)
      : (isPt ? `${foe.name} venceu. O dia na masmorra acabou — volte amanhã.` : `${foe.name} won. The dungeon day is over — come back tomorrow.`));
  };

  const answer = (i: number) => {
    if (!ch) return;
    const ok = ch.kind === 'minigame' ? false : i === ch.answer;
    finish(ch.kind, ok, ok ? (isPt ? 'Acertou!' : 'Correct!') : (isPt ? 'Errou — o passo se foi, mas a incursão segue.' : 'Missed — that step is spent, but the run goes on.'));
  };
  const tap = (opt: string) => {
    if (!ch) return;
    const next = [...taps, opt];
    setTaps(next);
    if (next.length < ch.options.length) return;
    const sorted = [...ch.options].sort((a, b) => Number(a) - Number(b));
    const ok = next.every((v, i) => v === sorted[i]);
    finish('minigame', ok, ok ? (isPt ? 'Na ordem certa!' : 'In the right order!') : (isPt ? 'Fora de ordem — o passo se foi.' : 'Out of order — that step is spent.'));
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
        <div data-rogue-challenge={ch.kind} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={text}>{PATH_COPY[ch.kind].icon} {t(ch.prompt)}</p>
          {ch.options.map(o => (
            <button
              key={o} type="button" data-rogue-option={o} style={btn}
              disabled={ch.kind === 'minigame' && taps.includes(o)}
              onClick={() => (ch.kind === 'minigame' ? tap(o) : answer(ch.options.indexOf(o)))}
            >
              {ch.kind === 'minigame' ? `🪨 ${o}` : ch.kind === 'explore' ? `🚪 ${isPt ? 'Porta' : 'Door'} ${o}` : o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
