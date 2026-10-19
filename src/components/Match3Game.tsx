import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import type { EarningGameProps } from './mente/types';
import { sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import { GameRoot, GameHeader, HpBars, StatTag, phaseTitle, phaseLine, gameExitConfirm } from './games/GameKit';
import { BitsAmount } from './ui/BitsAmount';
import { Icon } from './ui/Icon';
import { bitsStyle } from '../utils/currencies';
import { usePrefersReducedMotion } from './ui/Viewport';
import { elementIcon } from '../utils/elementIconArt';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { readNumber, writeLocal } from '../utils/safeStorage';
import {
  M3_COLS, M3_ROWS, M3_TILE_ELEMENTS, M3_TILE_NAMES, M3_POINTS_PER_BIT, M3_MAX_BITS,
  match3Bits, newRound, trySwap, type Board, type Pos, type Rng, type Step, type Tile,
} from '../utils/match3';
import {
  M3C_DEFEAT_BONUS, M3C_MAX_STREAK, M3_HINTS_PER_GAME, M3_HINT_PRICE_BITS, applyEnemySteps, applyPlayerSteps, chooseMove, combatScore, hintAction, newCombat, playTurn, type M3Combat, type M3Element,
} from '../utils/match3Combat';
import { mulberry32 } from '../utils/combate/rng';
import { powerShots, type PowerShot } from '../utils/match3Powers';
import { DUNGEON_LINE_NAMES, DUNGEON_LINE_SPRITES, getSpriteForStage } from '../utils/sprites';

/**
 * COMBINA 3 — o jogo de combinar peças do Salão de Jogos (pedido do dono, 11/10/2026, REGISTRO §36), agora um COMBATE (18/10/2026, D-03…D-07):
 * combinar peças de um elemento é um golpe daquele elemento no inimigo ATIVO; são 3 Soulmon inimigos em fila (um time só), e depois de
 * cada jogada VÁLIDA o inimigo ativo responde. Regras e conta em `utils/match3.ts` (tabuleiro) e `utils/match3Combat.ts` (combate) — puros,
 * com semente; aqui só a TELA: tocar/arrastar para trocar, a cascata animada passo a passo, a arena (você à esquerda, os 3 à direita), o teclado.
 *
 * Peças: os ícones de ELEMENTO que já existem no repo (`utils/elementIconArt`); sprites: os de `getSpriteForStage` e das linhas da masmorra —
 * nada de arte nova. Nasce MUDO (R-NOVA). A rodada acaba quando um lado cai (o limite de 20 movimentos saiu); perder não custa nada.
 * Os Bits saem UMA vez, no fim, do PLACAR do combate (`combatScore`) pelo funil único do `App` (`onEarnPoints` → teto diário de minijogo).
 * Tela quase cheia (D-02): `GameRoot full` tira a faixa vazia da nav; a arena cresce para ocupar tudo o que o tabuleiro não usa.
 *
 * Acessível: tabuleiro `role="grid"` com foco rotativo (setas movem, Enter/Espaço seleciona e troca), nome acessível por peça
 * ("Fogo, linha 2, coluna 3"), avisos em `aria-live`, alvos ≥ 44 px na largura de um celular comum, formas distintas (ícones de
 * elemento: a cor nunca é a única pista; o inimigo ativo leva borda E o marcador ▸). Movimento reduzido: sem deslize, tremida nem queda.
 */

const SWIPE_PX = 22;
const T_SWAP = 170;
const T_CLEAR = 280;
const T_FALL = 240;
const HINT_MS = 2600;
const CONFIRM_MS = 3000;
/** A arte do inimigo 1→3 sobe de estágio: o último do time é o mais imponente. */
const ENEMY_STAGES = ['rookie', 'champion', 'ultimate'] as const;
const ENEMY_SPRITE = 64;
/** D-100: a viagem do poder e a vida do número de dano (ms). */
const FX_TRAVEL = 300;
const FX_MS = 1200;
const CAN_ANIMATE = typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function';
const PLAYER_SPRITE = 88;

const key = (p: Pos) => p.r * M3_COLS + p.c;
const same = (a: Pos | null, b: Pos | null) => !!a && !!b && a.r === b.r && a.c === b.c;
const adjacent = (a: Pos, b: Pos) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
const elementName = (el: M3Element, isPt: boolean): string => {
  const n = M3_TILE_NAMES[M3_TILE_ELEMENTS.indexOf(el)];
  return isPt ? n.pt : n.en;
};
const LINES = Object.keys(DUNGEON_LINE_SPRITES);

export interface Match3Props extends EarningGameProps {
  /** Semente da rodada (testes). Sem ela, sorteada ao abrir/reabrir. */
  seed?: number;
  /** D-85: saldo de Bits e a via de gasto do app (`play.onSpendBits`, devolve `false` se não cobrou). Sem elas, não dá para comprar dica. */
  bits?: number;
  onSpendBits?: (n: number) => boolean;
}

function freshSeed(): number { return Math.floor(Math.random() * 2 ** 31); }

/** O combate de uma rodada a partir da semente (o rng do tabuleiro NÃO é tocado: os dois têm fluxo próprio). */
function combatFor(sd: number, playerLine: string | undefined): { combat: M3Combat; rng: Rng } {
  return { combat: newCombat(mulberry32(sd + 99), LINES, playerLine), rng: mulberry32(sd ^ 0x5eed) };
}

export function Match3Game({ language, evolutionStage, demoCharacterId, onEarnPoints, onExit, seed, bits = 0, onSpendBits }: Match3Props) {
  const isPt = language === 'pt-BR';
  const reduced = usePrefersReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  const first = useMemo(() => {
    const sd = seed ?? freshSeed();
    return { round: newRound(sd), battle: combatFor(sd, demoCharacterId) };
  }, [seed, demoCharacterId]);
  const [board, setBoard] = useState<Board>(first.round.board);
  const boardRef = useRef(first.round.board);
  const rngRef = useRef<Rng>(first.round.rng);
  const [combat, setCombat] = useState<M3Combat>(first.battle.combat);
  const combatRef = useRef<M3Combat>(first.battle.combat);
  const enemyRngRef = useRef<Rng>(first.battle.rng);
  const [sel, setSelState] = useState<Pos | null>(null);
  const selRef = useRef<Pos | null>(null);
  const setSel = useCallback((p: Pos | null) => { selRef.current = p; setSelState(p); }, []);
  const [cursor, setCursor] = useState<Pos>({ r: 0, c: 0 });
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [clearing, setClearing] = useState<ReadonlySet<number>>(new Set());
  const [fresh, setFresh] = useState<{ id: number; cells: ReadonlySet<number> }>({ id: 0, cells: new Set() });
  const [shake] = useState<{ id: number; cells: ReadonlySet<number> }>({ id: 0, cells: new Set() });
  const [chain, setChain] = useState(0);
  const [note, setNote] = useState('');
  const [over, setOver] = useState(false);
  const [earned, setEarned] = useState(0);
  const [best, setBest] = useState(() => readNumber(STORAGE_KEYS.MATCH3_BEST, 0));
  const [newBest, setNewBest] = useState(false);
  const [hint, setHint] = useState<{ a: Pos; b: Pos } | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hintsLeft, setHintsLeft] = useState(M3_HINTS_PER_GAME);
  const [confirmBuy, setConfirmBuy] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [extraFlash, setExtraFlash] = useState(0);
  const [fx, setFx] = useState<Fx[]>([]);
  const fxId = useRef(0);
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const streakRef = useRef(1);

  const alive = useRef(true);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const overRef = useRef(false);
  const btnRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const swipe = useRef<{ x: number; y: number; pos: Pos } | null>(null);
  const swiped = useRef(false);

  useEffect(() => {
    alive.current = true;
    const t = timers.current;
    return () => { alive.current = false; t.forEach(clearTimeout); t.clear(); if (hintTimer.current) clearTimeout(hintTimer.current); if (confirmTimer.current) clearTimeout(confirmTimer.current); };
  }, []);

  /** Espera `ms` (0 em movimento reduzido); some se a tela saiu. */
  const wait = useCallback((ms: number) => new Promise<void>(resolve => {
    const id = setTimeout(() => { timers.current.delete(id); resolve(); }, reducedRef.current ? 0 : ms);
    timers.current.add(id);
  }), []);

  // Fecha a rodada UMA vez e paga UMA vez (fora de updater — footgun 6). O pagamento sai SÓ do placar do combate.
  const finish = useCallback(() => {
    if (overRef.current) return;
    overRef.current = true;
    const final = combatScore(combatRef.current);
    const bits = match3Bits(final);
    setEarned(bits);
    const prevBest = readNumber(STORAGE_KEYS.MATCH3_BEST, 0);
    if (final > prevBest) { writeLocal(STORAGE_KEYS.MATCH3_BEST, String(final)); setBest(final); setNewBest(prevBest > 0); }
    setOver(true);
    if (bits > 0) onEarnPoints(bits);
  }, [onEarnPoints]);

  const say = useCallback((pt: string, en: string) => setNote(isPt ? pt : en), [isPt]);

  /** O que cai: as colunas dos que sumiram, de cima até a linha mais baixa que sumiu (peça nova ou que desceu). */
  const dropCells = (st: Step): Set<number> => {
    const out = new Set<number>();
    const low = new Map<number, number>();
    for (const p of st.cleared) low.set(p.c, Math.max(low.get(p.c) ?? -1, p.r));
    low.forEach((r, c) => { for (let i = 0; i <= r; i++) out.add(i * M3_COLS + c); });
    return out;
  };

  /** O aviso do turno: os golpes do jogador (por elemento) e a resposta do inimigo. Descreve; não julga. */
  const turnNote = useCallback((from: number, c: M3Combat): string => {
    const novos = c.log.slice(from);
    const golpes = novos.filter(e => e.by === 'player').map(e => `${elementName(e.element, isPt)} ${e.dmg}`);
    const resp = novos.filter(e => e.by === 'enemy');
    const a = golpes.length > 0 ? (isPt ? `Seu golpe: ${golpes.join(' · ')}.` : `Your strike: ${golpes.join(' · ')}.`) : (isPt ? 'Sem golpe desta vez.' : 'No strike this time.');
    const b = resp.length > 0 ? (isPt ? ` Resposta: ${resp.reduce((t, e) => t + e.dmg, 0)}.` : ` Reply: ${resp.reduce((t, e) => t + e.dmg, 0)}.`) : '';
    return a + b;
  }, [isPt]);

  const clearHint = useCallback(() => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
    setHint(null);
  }, []);

  /** D-100: solta os poderes de um passo — de cada combo (célula) até o alvo, com o dano que a conta já aplicou. Só mede e guarda; a animação é da `PowerFx`. */
  const launch = useCallback((shots: readonly PowerShot[]) => {
    const field = fieldRef.current;
    if (!field || shots.length === 0) return;
    const fr = field.getBoundingClientRect();
    const mid = (el: Element | null) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left - fr.left + r.width / 2, y: r.top - fr.top + r.height / 2 };
    };
    const made: Fx[] = [];
    shots.forEach((shot, i) => {
      const a = mid(btnRefs.current[key(shot.from)] ?? null);
      const b = mid(field.querySelector(shot.target === 'player' ? '[data-m3-player] img' : `[data-m3-enemy="${shot.target + 1}"] img`));
      if (a && b) made.push({ id: ++fxId.current, shot, x0: a.x, y0: a.y, x1: b.x, y1: b.y, delay: i * 90 });
    });
    if (made.length === 0) return;
    setFx(f => [...f, ...made]);
    const t = setTimeout(() => { timers.current.delete(t); setFx(f => f.filter(x => !made.some(m => m.id === x.id))); }, FX_MS + shots.length * 90);
    timers.current.add(t);
  }, []);

  /** Anima os passos de uma cascata (do jogador ou do inimigo) e aplica o dano parcial pela função certa. `closers` = as duas casas da troca (onde o combo fechou). */
  const runSteps = useCallback(async (steps: readonly Step[], from: M3Combat, apply: typeof applyPlayerSteps, closers: readonly Pos[]): Promise<M3Combat | null> => {
    let preview = from;
    for (const st of steps) {
      if (!alive.current) return null;
      const next = apply(preview, [st]);
      launch(powerShots(st, next.log.slice(preview.log.length), st.chain === 1 ? closers : []));
      setClearing(new Set(st.cleared.map(key)));
      setChain(st.chain);
      await wait(T_CLEAR);
      if (!alive.current) return null;
      setClearing(new Set());
      boardRef.current = st.after;
      setBoard(st.after);
      preview = next;
      setCombat(preview);
      setFresh(f => ({ id: f.id + 1, cells: dropCells(st) }));
      await wait(T_FALL);
    }
    return preview;
  }, [launch, wait]);

  const flashExtra = useCallback(() => setExtraFlash(n => n + 1), []);

  const play = useCallback(async (a: Pos, d: Pos) => {
    if (busyRef.current || overRef.current || combatRef.current.outcome !== 'playing') return;
    const res = trySwap(boardRef.current, a, d, rngRef.current);
    if (!res.ok) { setSel(null); return; }
    busyRef.current = true;
    setBusy(true);
    setSel(null);
    clearHint();
    setConfirmBuy(false);
    say('', '');
    const base = combatRef.current;
    // a jogada VÁLIDA inteira (dano do jogador, rodada extra OU a vez do inimigo) é a conta pura; a tela só a mostra por partes
    const ex = playTurn(base, res.steps, res.board, rngRef.current, streakRef.current);
    setBoard(res.swapped);
    await wait(T_SWAP);
    let preview = await runSteps(res.steps, base, applyPlayerSteps, [a, d]);
    if (!preview || !alive.current) return;
    boardRef.current = res.board;
    setBoard(res.board);
    setChain(0);
    if (res.reshuffled) {
      setFresh(f => ({ id: f.id + 1, cells: new Set(Array.from({ length: M3_ROWS * M3_COLS }, (_, i) => i)) }));
      say('Sem jogadas: embaralhei as peças para você.', 'No moves left: I shuffled the tiles for you.');
    }
    if (ex.extra) {
      // D-84: 4+ = rodada extra — o inimigo não joga e o turno não é contado
      streakRef.current += 1;
      flashExtra();
      combatRef.current = ex.state;
      setCombat(ex.state);
      if (!res.reshuffled) setNote(turnNote(base.log.length, ex.state));
      busyRef.current = false;
      setBusy(false);
      return;
    }
    streakRef.current = 1;
    // D-83: a vez do inimigo — ele MEXE as peças (uma troca; 4+ dá outra, até o teto) e os combos tiram HP do jogador
    for (let i = 0; i < ex.enemyMoves.length; i++) {
      const m = ex.enemyMoves[i];
      if (!alive.current) return;
      setHint({ a: m.a, b: m.b });
      setBoard(m.swapped);
      await wait(T_SWAP);
      setHint(null);
      const after = await runSteps(m.steps, preview, applyEnemySteps, [m.a, m.b]);
      if (!after || !alive.current) return;
      preview = after;
      boardRef.current = m.board;
      setBoard(m.board);
      setChain(0);
      if (i < ex.enemyMoves.length - 1) { flashExtra(); await wait(T_SWAP); }
    }
    if (!alive.current) return;
    boardRef.current = ex.board;
    setBoard(ex.board);
    combatRef.current = ex.state;
    setCombat(ex.state);
    if (!res.reshuffled) setNote(turnNote(base.log.length, ex.state));
    busyRef.current = false;
    setBusy(false);
    if (ex.state.outcome !== 'playing') finish();
  }, [clearHint, finish, flashExtra, runSteps, say, setSel, turnNote, wait]);

  const pick = useCallback((p: Pos) => {
    if (busyRef.current || overRef.current) return;
    setCursor(p);
    const cur = selRef.current;
    if (!cur) { setSel(p); return; }
    if (same(cur, p)) { setSel(null); return; }
    if (adjacent(cur, p)) { setSel(null); void play(cur, p); return; }
    setSel(p);
  }, [play, setSel]);

  const onKey = (e: ReactKeyboardEvent) => {
    const d: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (d[e.key]) {
      e.preventDefault();
      const n = { r: Math.min(M3_ROWS - 1, Math.max(0, cursor.r + d[e.key][0])), c: Math.min(M3_COLS - 1, Math.max(0, cursor.c + d[e.key][1])) };
      setCursor(n);
      btnRefs.current[key(n)]?.focus();
    } else if (e.key === 'Escape') {
      setSel(null);
    }
  };

  const onPointerDown = (e: ReactPointerEvent, pos: Pos) => { swipe.current = { x: e.clientX, y: e.clientY, pos }; swiped.current = false; };
  const onPointerUp = (e: ReactPointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_PX) return;
    swiped.current = true;
    const to: Pos = Math.abs(dx) > Math.abs(dy)
      ? { r: s.pos.r, c: s.pos.c + (dx > 0 ? 1 : -1) }
      : { r: s.pos.r + (dy > 0 ? 1 : -1), c: s.pos.c };
    setCursor(s.pos);
    void play(s.pos, to);
  };

  /** D-85: o botão de dica. Mostra a melhor jogada (a MESMA que a IA inimiga escolheria no tabuleiro do jogador); acabou o uso, compra com Bits (2 toques: pedir + confirmar). */
  const onHint = () => {
    if (busyRef.current || overRef.current) return;
    const act = hintAction(hintsLeft, bits);
    if (act === 'blocked') return;
    if (act === 'buy' && !confirmBuy) {
      setConfirmBuy(true);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmBuy(false), CONFIRM_MS);
      return;
    }
    const m = chooseMove(boardRef.current);
    if (!m) return;
    if (act === 'buy') {
      if (!onSpendBits || !onSpendBits(M3_HINT_PRICE_BITS)) { setConfirmBuy(false); return; }
      setConfirmBuy(false);
    } else {
      setHintsLeft(n => n - 1);
    }
    setSel(null);
    setHint({ a: m.a, b: m.b });
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(null), HINT_MS);
  };

  const restart = () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
    const sd = seed === undefined ? freshSeed() : seed + 1;
    const r = newRound(sd);
    const c = combatFor(sd, demoCharacterId);
    boardRef.current = r.board;
    rngRef.current = r.rng;
    combatRef.current = c.combat;
    enemyRngRef.current = c.rng;
    overRef.current = false;
    busyRef.current = false;
    setBoard(r.board); setCombat(c.combat); setSel(null); setCursor({ r: 0, c: 0 });
    setBusy(false); setFx([]); setClearing(new Set()); setChain(0); setNote(''); setOver(false); setHint(null); setHintsLeft(M3_HINTS_PER_GAME); setConfirmBuy(false); streakRef.current = 1; setEarned(0); setNewBest(false);
  };

  const score = combatScore(combat);
  const nextBitAt = (Math.floor(score / M3_POINTS_PER_BIT) + 1) * M3_POINTS_PER_BIT;
  const bitsNow = match3Bits(score);
  const win = combat.outcome === 'win';

  const cellLabel = (t: Tile, r: number, c: number) => {
    const nome = M3_TILE_NAMES[t.k];
    const esp = t.sp === 'row' ? (isPt ? ', limpa a linha' : ', clears the row') : t.sp === 'col' ? (isPt ? ', limpa a coluna' : ', clears the column') : '';
    return isPt ? `${nome.pt}${esp}, linha ${r + 1}, coluna ${c + 1}` : `${nome.en}${esp}, row ${r + 1}, column ${c + 1}`;
  };

  // O tabuleiro escala pela LARGURA da tela (alvo ≥ 44 px em 390 de largura: (366 − 12 − 24) / 7 ≈ 47).
  const boardStyle: CSSProperties = {
    display: 'grid', gridTemplateColumns: `repeat(${M3_COLS}, minmax(0, 1fr))`, gap: 4, padding: 6, boxSizing: 'border-box',
    width: '100%', maxWidth: 420, alignSelf: 'center', flex: 'none', touchAction: 'none', userSelect: 'none',
    backgroundColor: 'var(--sm2-surface-2)', border: '1px solid var(--sm2-line)', borderRadius: 'var(--sm2-radius-md)',
  };

  const playerSprite = getSpriteForStage(evolutionStage, demoCharacterId);

  // A arena (D-76, 19/10/2026): o SEU Soulmon em CIMA à esquerda; o time inimigo (1→3) EMBAIXO, em fila da DIREITA para a ESQUERDA (o 1º, ativo, na ponta direita). Ativo = borda + ▸ (a cor nunca é a única pista).
  const arena = (
    <div data-m3-arena style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 8, flex: '1 0 auto', minHeight: 130 }}>
      <div data-m3-player data-m3-pos="top-left" data-m3-hp={combat.player.hp} style={{ width: PLAYER_SPRITE + 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 'none', alignSelf: 'flex-start' }}>
        <img src={playerSprite} alt="" aria-hidden="true" draggable={false} width={PLAYER_SPRITE} height={PLAYER_SPRITE} style={{ width: PLAYER_SPRITE, height: PLAYER_SPRITE, imageRendering: 'pixelated', objectFit: 'contain' }} />
        <HpBars bars={[{ label: isPt ? 'Seu Soulmon' : 'Your Soulmon', cur: combat.player.hp, max: combat.player.max, tone: 'cyan' }]} />
      </div>
      <div role="group" aria-label={isPt ? 'Time da fenda' : 'Rift team'} data-m3-enemies data-m3-pos="bottom-right" style={{ display: 'flex', flexDirection: 'row-reverse', gap: 6, minWidth: 0, justifyContent: 'flex-start', alignItems: 'flex-end' }}>
        {combat.enemies.map((e, i) => {
          const line = e.line && DUNGEON_LINE_SPRITES[e.line] ? e.line : LINES[i];
          const src = DUNGEON_LINE_SPRITES[line][ENEMY_STAGES[i]];
          const isActive = combat.outcome === 'playing' && combat.active === i;
          const down = e.hp <= 0;
          const icon = elementIcon(e.element);
          const nome = `${DUNGEON_LINE_NAMES[line]}, ${elementName(e.element, isPt)}${isActive ? (isPt ? ', ativo' : ', active') : ''}${down ? (isPt ? ', recuou' : ', stepped back') : ''}`;
          return (
            <div
              key={i}
              data-m3-enemy={i + 1}
              data-m3-active={isActive ? '1' : '0'}
              data-m3-hp={e.hp}
              data-m3-element={e.element}
              aria-current={isActive ? 'true' : undefined}
              aria-label={nome}
              role="group"
              style={{
                flex: 1, minWidth: 0, maxWidth: 92, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '4px 2px', boxSizing: 'border-box',
                border: `2px solid ${isActive ? 'var(--sm2-gold-ink)' : 'transparent'}`, borderRadius: 8,
              }}
            >
              <p aria-hidden="true" style={{ ...sm2Hint, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 2 }}>
                <span>{isActive ? '▸' : ''}{i + 1}</span>
                {icon && <img src={icon} alt="" draggable={false} width={14} height={14} style={{ imageRendering: 'pixelated' }} />}
              </p>
              <img src={src} alt="" aria-hidden="true" draggable={false} width={ENEMY_SPRITE} height={ENEMY_SPRITE} style={{ width: ENEMY_SPRITE, height: ENEMY_SPRITE, maxWidth: '100%', imageRendering: 'pixelated', objectFit: 'contain', opacity: down ? 0.3 : 1, filter: down ? 'grayscale(1)' : undefined }} />
              <HpBars bars={[{ label: DUNGEON_LINE_NAMES[line], cur: e.hp, max: e.max, tone: 'gold' }]} />
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <GameRoot full>
      <GameHeader
        title={isPt ? 'Combina 3' : 'Match 3'}
        language={language}
        infoLabel={isPt ? 'Como se joga' : 'How to play'}
        info={(
          <>
            <span style={{ display: 'block' }}>{isPt ? 'Troque duas peças vizinhas para formar linhas de 3 ou mais iguais. Cada linha é um golpe do elemento da peça no inimigo da vez; o excesso de um golpe se perde.' : 'Swap two neighbouring tiles to line up 3 or more alike. Each line is a strike of the tile’s element on the current enemy; a strike’s excess is lost.'}</span>
            <span style={{ display: 'block', marginTop: 6 }}>{isPt ? 'Depois de cada troca, o inimigo da vez também troca duas peças — e os combos dele tiram vida do seu Soulmon —, pontue a sua troca ou não. A rodada acaba quando os três recuam ou quando a vida do seu Soulmon chega a zero. Perder não custa nada.' : 'After every swap the current enemy swaps two tiles too — and its combos take health from your Soulmon — whether your swap scored or not. The round ends when all three step back or your Soulmon’s health reaches zero. Losing costs nothing.'}</span>
            <span style={{ display: 'block', marginTop: 6 }}>{isPt ? 'Uma linha de 4 deixa uma peça com setas (quando ela entra numa combinação, limpa a linha ou a coluna inteira) e dá uma rodada extra: você joga de novo. Vale para o inimigo também; no máximo 3 jogadas seguidas.' : 'A line of 4 leaves a tile with arrows (when it joins a match, it clears its whole row or column) and gives an extra turn: you play again. The same goes for the enemy; at most 3 moves in a row.'}</span>
            <span style={{ display: 'block', marginTop: 6 }}>{isPt ? 'Toque numa peça e depois numa vizinha, ou arraste. Teclado: setas e Enter. O botão de dica mostra a melhor troca: são 3 por rodada, e dá para comprar mais com Bits.' : 'Tap a tile, then a neighbour, or swipe. Keyboard: arrows and Enter. The hint button shows the best swap: 3 per round, and you can buy more with Bits.'}</span>
            <span style={{ display: 'block', marginTop: 6 }}>{isPt ? `O placar é o dano causado menos o recebido, mais ${M3C_DEFEAT_BONUS} por inimigo que recuou. Cada ${M3_POINTS_PER_BIT} pontos viram 1 Bit.` : `The score is damage dealt minus damage taken, plus ${M3C_DEFEAT_BONUS} per enemy that stepped back. Every ${M3_POINTS_PER_BIT} points becomes 1 Bit.`}</span>
          </>
        )}
        closeLabel={isPt ? 'Sair' : 'Exit'}
        onClose={onExit}
        exitConfirm={over ? undefined : gameExitConfirm(isPt, 'da rodada')}
      />

      {/* a arena cresce até o tabuleiro: história, placar, o campo e o aviso vivo moram nela (D-02) */}
      <div ref={fieldRef} data-m3-field style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8, flex: '1 0 auto', minHeight: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <StatTag label={isPt ? 'Turno' : 'Turn'} value={<span data-m3-turn={combat.turns}>{combat.turns}</span>} />
          {extraFlash > 0 && (
            <span key={extraFlash} data-m3-extra={extraFlash} role="img" aria-label={isPt ? 'Rodada extra' : 'Extra turn'} style={{ display: 'inline-flex', marginLeft: 8, animation: reduced ? undefined : 'sm-m3-extra 900ms ease-out both' }}>
              <Icon name="replay" size={24} tone="gold" />
            </span>
          )}
        </div>
        {/* D-77: nada mais de texto na tela de jogo — placar e Bits só para leitor de tela (visualmente ocultos). */}
        <span className="sm2-sr-only" data-m3-sr>
          {isPt ? 'Placar' : 'Score'} <span data-m3-score={score}>{score}</span> · Bits <span data-m3-bits={bitsNow}>{bitsNow}</span>
        </span>
        {arena}
        {fx.map(f => <PowerFx key={f.id} fx={f} reduced={reduced} />)}
        {/* o aviso vivo: golpes, resposta, dica, embaralhada. Sem vermelho; fica fora da área do tabuleiro. */}
        <p role="status" aria-live="polite" data-m3-note className="sm2-sr-only">
          {note || (chain > 1 ? (isPt ? `Cascata ×${chain}!` : `Cascade ×${chain}!`) : '')}
        </p>
      </div>

      {over ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 'none' }}>
          <p role="status" style={phaseTitle} data-m3-end data-m3-outcome={combat.outcome}>
            {isPt ? `Você fez ${score} pontos` : `You scored ${score} points`}
          </p>
          <p style={phaseLine} data-m3-outcome-line>
            {win
              ? (isPt ? 'O time da fenda recuou. A passagem está livre.' : 'The rift team stepped back. The way is clear.')
              : (isPt ? 'O time da fenda segurou a passagem desta vez. Nada foi cobrado.' : 'The rift team held the way this time. Nothing was charged.')}
          </p>
          <p style={phaseLine}>
            {earned > 0 ? <BitsAmount value={earned} sign="+" /> : (isPt ? 'Rodada leve, sem Bits desta vez.' : 'A light round, no Bits this time.')}
          </p>
          <p className="sm2-num" style={phaseLine}>
            {isPt ? `Seu recorde: ${best}` : `Your best: ${best}`}{newBest ? (isPt ? ' · novo recorde' : ' · new best') : ''}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={restart} data-m3-again style={{ ...sm2Button('primary'), flex: 1, minWidth: 0, padding: '0 8px' }}>
              {isPt ? 'De novo' : 'Again'}
            </button>
            <button type="button" onClick={onExit} style={{ ...sm2Button('outline'), flex: 1, minWidth: 0, padding: '0 8px' }}>
              {isPt ? 'Sair' : 'Exit'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            role="grid"
            aria-label={isPt ? 'Tabuleiro do Combina 3' : 'Match 3 board'}
            aria-rowcount={M3_ROWS}
            aria-colcount={M3_COLS}
            aria-busy={busy}
            data-m3-board
            onKeyDown={onKey}
            style={boardStyle}
          >
            {board.map((row, r) => row.map((t, c) => {
              const p = { r, c };
              const k = key(p);
              const isSel = same(sel, p);
              const isHint = !!hint && (same(hint.a, p) || same(hint.b, p));
              return (
                <div key={k} role="gridcell" aria-colindex={c + 1} aria-rowindex={r + 1} aria-selected={isSel} style={{ display: 'contents' }}>
                  <TileButton
                    ref={el => { btnRefs.current[k] = el; }}
                    tile={t}
                    label={t ? cellLabel(t, r, c) : ''}
                    pos={p}
                    focusable={same(cursor, p)}
                    selected={isSel}
                    hint={isHint}
                    clearing={clearing.has(k)}
                    fresh={fresh.cells.has(k) ? fresh.id : 0}
                    shake={shake.cells.has(k) ? shake.id : 0}
                    reduced={reduced}
                    disabled={busy}
                    onPick={() => { if (swiped.current) { swiped.current = false; return; } pick(p); }}
                    onPointerDown={e => onPointerDown(e, p)}
                    onPointerUp={onPointerUp}
                  />
                </div>
              );
            }))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', flex: 'none' }}>
            {(() => {
              const act = hintAction(hintsLeft, bits);
              const falta = act === 'buy' && !onSpendBits;
              const bloqueado = busy || act === 'blocked' || falta;
              const nome = act === 'use'
                ? (isPt ? `Dica, ${hintsLeft} restantes` : `Hint, ${hintsLeft} left`)
                : confirmBuy
                  ? (isPt ? `Confirmar: comprar uma dica por ${M3_HINT_PRICE_BITS} Bits` : `Confirm: buy a hint for ${M3_HINT_PRICE_BITS} Bits`)
                  : (isPt ? `Comprar uma dica por ${M3_HINT_PRICE_BITS} Bits` : `Buy a hint for ${M3_HINT_PRICE_BITS} Bits`);
              return (
                <button type="button" onClick={onHint} disabled={bloqueado} aria-label={nome} data-m3-hint-button data-m3-hint-mode={confirmBuy ? 'confirm' : act} style={{ ...sm2Button('outline', bloqueado), minHeight: 44, minWidth: 72, padding: '0 14px', gap: 6 }}>
                  <Icon name={confirmBuy ? 'check' : 'help'} size={24} tone={confirmBuy ? 'primary' : 'ink'} />
                  {act === 'use'
                    ? <span className="sm2-num" data-m3-hints-left={hintsLeft}>{hintsLeft}</span>
                    : <span data-m3-hint-price={M3_HINT_PRICE_BITS}><BitsAmount value={M3_HINT_PRICE_BITS} /></span>}
                </button>
              );
            })()}
          </div>
          <p className="sm2-sr-only" data-m3-next>
            {bitsNow >= M3_MAX_BITS
              ? (isPt ? 'Você chegou ao máximo de Bits desta rodada.' : 'You reached the Bits maximum for this round.')
              : (isPt ? `Próximo Bit com ${nextBitAt} pontos.` : `Next Bit at ${nextBitAt} points.`)}
          </p>
        </>
      )}
    </GameRoot>
  );
}

// ── o poder que sai do combo (D-100) ───────────────────────────────────────────────────────────────────────────────────

/** Um poder em voo: onde nasceu (célula do combo), o alvo e o dano mostrado (o que a conta aplicou). Posições relativas ao campo. */
interface Fx { id: number; shot: PowerShot; x0: number; y0: number; x1: number; y1: number; delay: number }

/**
 * O ícone do elemento viaja da célula do combo ao alvo e o número do dano aparece NO alvo. Web Animations (transform/opacity, 1 animação
 * por poder e 1 pelo número; sem JS por frame); sem `animate` (jsdom) ou com movimento reduzido: nada viaja e o número já está no alvo. Mudo.
 */
function PowerFx({ fx, reduced }: { fx: Fx; reduced: boolean }) {
  const orb = useRef<HTMLSpanElement | null>(null);
  const num = useRef<HTMLSpanElement | null>(null);
  const { shot, x0, y0, x1, y1, delay } = fx;
  useEffect(() => {
    if (reduced) return;
    const o = orb.current;
    const n = num.current;
    if (o && typeof o.animate === 'function') {
      o.animate([{ transform: 'translate(0px, 0px) scale(0.6)', opacity: 0 }, { opacity: 1, offset: 0.15 }, { transform: `translate(${x1 - x0}px, ${y1 - y0}px) scale(1.1)`, opacity: 1, offset: 0.9 }, { transform: `translate(${x1 - x0}px, ${y1 - y0}px) scale(1.4)`, opacity: 0 }], { duration: FX_TRAVEL, delay, easing: 'ease-in', fill: 'both' });
    }
    if (n && typeof n.animate === 'function') {
      n.animate([{ transform: 'translate(-50%, 0px)', opacity: 0 }, { transform: 'translate(-50%, -6px)', opacity: 1, offset: 0.2 }, { transform: 'translate(-50%, -24px)', opacity: 0 }], { duration: 800, delay: delay + FX_TRAVEL, easing: 'ease-out', fill: 'both' });
    }
  }, [reduced, x0, y0, x1, y1, delay]);
  const icon = elementIcon(shot.element);
  const base: CSSProperties = { position: 'absolute', pointerEvents: 'none', zIndex: 3 };
  return (
    <>
      {!reduced && icon && (
        <span ref={orb} aria-hidden="true" data-m3-shot data-m3-shot-element={shot.element} data-m3-shot-by={shot.by} data-m3-shot-from={`${Math.round(x0)},${Math.round(y0)}`} style={{ ...base, left: x0 - 12, top: y0 - 12, width: 24, height: 24, opacity: 0, filter: 'drop-shadow(0 0 4px var(--sm2-gold-fill))' }}>
          <img src={icon} alt="" draggable={false} width={24} height={24} style={{ width: 24, height: 24, imageRendering: 'pixelated' }} />
        </span>
      )}
      <span ref={num} aria-hidden="true" className="sm2-num" data-m3-dmg={shot.dmg} data-m3-dmg-target={shot.target} data-m3-dmg-by={shot.by} style={{ ...base, left: x1, top: y1 - 18, transform: 'translate(-50%, 0)', fontWeight: 700, fontSize: 18, color: shot.by === 'player' ? 'var(--sm2-gold-ink)' : 'var(--sm2-primary-ink)', textShadow: '0 1px 0 var(--sm2-surface), 0 0 3px var(--sm2-surface)', whiteSpace: 'nowrap', opacity: reduced || !CAN_ANIMATE ? 1 : 0 }}>
        {shot.dmg}
      </span>
    </>
  );
}

// ── uma peça ───────────────────────────────────────────────────────────────────────────────────────────────────────────


interface TileButtonProps {
  tile: Tile | null; label: string; pos: Pos; focusable: boolean; selected: boolean; hint: boolean; clearing: boolean;
  fresh: number; shake: number; reduced: boolean; disabled: boolean;
  onPick: () => void; onPointerDown: (e: ReactPointerEvent) => void; onPointerUp: (e: ReactPointerEvent) => void;
}

const TileButton = forwardRef<HTMLButtonElement, TileButtonProps>(function TileButton(
  { tile, label, pos, focusable, selected, hint, clearing, fresh, shake, reduced, disabled, onPick, onPointerDown, onPointerUp }, ref,
) {
  const inner = useRef<HTMLButtonElement | null>(null);
  const setRefs = (el: HTMLButtonElement | null) => {
    inner.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) (ref as { current: HTMLButtonElement | null }).current = el;
  };
  // queda das peças novas e tremida da troca inválida: Web Animations (sem CSS novo); movimento reduzido ou jsdom: nada.
  useEffect(() => {
    const el = inner.current;
    if (!fresh || reduced || !el || typeof el.animate !== 'function') return;
    el.animate([{ transform: 'translateY(-26px)', opacity: 0.25 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 220, easing: 'ease-out' });
  }, [fresh, reduced]);
  useEffect(() => {
    const el = inner.current;
    if (!shake || reduced || !el || typeof el.animate !== 'function') return;
    el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }], { duration: 200 });
  }, [shake, reduced]);

  if (!tile) return <span aria-hidden="true" style={{ aspectRatio: '1 / 1' }} />;
  const art = elementIcon(M3_TILE_ELEMENTS[tile.k]);
  const st: CSSProperties = {
    ...sm2Text, position: 'relative', aspectRatio: '1 / 1', minWidth: 0, minHeight: 0, padding: 2, boxSizing: 'border-box', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: selected ? 'var(--sm2-primary-fill)' : 'var(--sm2-surface)',
    border: `2px solid ${selected ? 'var(--sm2-primary-ink)' : hint ? 'var(--sm2-gold-ink)' : tile.sp ? 'var(--sm2-gold-ink)' : 'var(--sm2-line)'}`,
    borderRadius: 8,
    boxShadow: hint ? '0 0 0 3px var(--sm2-gold-fill)' : undefined,
    opacity: clearing ? 0 : 1,
    transform: clearing && !reduced ? 'scale(0.55)' : 'none',
    transition: reduced ? 'none' : 'opacity 240ms var(--sm2-ease), transform 240ms var(--sm2-ease)',
    touchAction: 'none',
  };
  return (
    <button
      ref={setRefs}
      type="button"
      tabIndex={focusable ? 0 : -1}
      aria-label={label}
      aria-pressed={selected}
      disabled={disabled}
      data-m3-cell={`${pos.r},${pos.c}`}
      data-m3-kind={tile.k}
      data-m3-special={tile.sp ?? ''}
      data-m3-selected={selected ? '1' : '0'}
      data-m3-hint={hint ? '1' : '0'}
      onClick={onPick}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      style={st}
    >
      {art && <img src={art} alt="" aria-hidden="true" draggable={false} style={{ width: '82%', height: '82%', objectFit: 'contain', imageRendering: 'pixelated', pointerEvents: 'none' }} />}
      {tile.sp && (
        // a especial: setas na direção que limpa (a forma, não só a cor, diz o que ela faz)
        <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="55%" height="55%" style={{ position: 'absolute', pointerEvents: 'none', color: 'var(--sm2-gold-ink)', opacity: 0.95 }}>
          {tile.sp === 'row'
            ? <path d="M2 12 L8 7 V10 H16 V7 L22 12 L16 17 V14 H8 V17 Z" fill="currentColor" stroke="var(--sm2-surface)" strokeWidth="1" />
            : <path d="M12 2 L17 8 H14 V16 H17 L12 22 L7 16 H10 V8 H7 Z" fill="currentColor" stroke="var(--sm2-surface)" strokeWidth="1" />}
        </svg>
      )}
    </button>
  );
});

export default Match3Game;
