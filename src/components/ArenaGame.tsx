import { useState, useEffect, useRef, useCallback } from 'react';
import iconSwords from '../assets/soulmon/icons/games/icon-game-dungeon.png';
import iconClose from '../assets/soulmon/icons/icon-close.png';
import { PixelButton, PixelTag } from './pixel/PixelKit';
import { getSpriteForStage, getDungeonEnemySprite } from '../utils/sprites';
import { playTaskComplete, playDegenerate, playFeed } from '../utils/sounds';
import { getStageLevel } from '../types/progression';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { readJson } from '../utils/safeStorage';
import type { OracleInput } from '../utils/oracle';
import type { FichaStage } from '../utils/soulProfile/ficha/types';
import type { StageSkills } from '../utils/soulProfile/ficha/skills';
import {
  ARENA_ROUNDS, ROUND_CLEAR_HEAL, SPECIAL_CHARGE_TURNS, SPECIAL_EFFECTS,
  DEFAULT_ARENA_ATTRIBUTES, buildDefaultArenaSkills, buildArenaRound,
  getArenaAttributes, getArenaPlayerStats, elementLabel, elementMultiplier,
  countersElement, playerHitDamage, enemyHitDamage, loadBestiaryPool,
  type ArenaEnemy, type BestiaryCreature,
} from '../utils/arena';
import { TimingBar } from './DungeonGame';
import type { Language } from '../utils/i18n';

/**
 * Arena minigame — the EXPERIMENTAL second dungeon that battle-tests the
 * class-system: the pet fights with its OWN skills (básica/especial from the
 * ficha) and its two elemental attributes; enemies come from the bestiary
 * pool (stats only — displayed names are always generated, never the pool's).
 *
 * 5 rounds: 1 medium / 2 weak / 1 medium / 3 weak / 1 boss. Same timing bar
 * as the dungeon. Rewards: Bits per enemy — no heart drops, no Glitchtama
 * (it's a test arena), and losing NEVER costs hearts.
 */

type Phase = 'intro' | 'attack' | 'defend' | 'result' | 'round-clear' | 'run-complete' | 'lost';
interface Popup { icon: string; title: string; detail: string; color: string }
interface ViewEnemy extends ArenaEnemy { sprite: string }

const DEFEND_TIME = 3.0;
const POPUP_MS = 1400;

const FICHA_STAGES: FichaStage[] = ['rookie', 'champion', 'ultimate', 'mega', 'ultra'];

export function ArenaGame({ evolutionStage, demoCharacterId, language, soulmonSkills, onEarnPoints, onExit }: {
  evolutionStage: string;
  demoCharacterId?: string;
  language: Language;
  /** Skills persistidas no save (cache da PetPage) — par por estágio. */
  soulmonSkills?: Record<FichaStage, StageSkills>;
  onEarnPoints: (pts: number) => void;
  onExit: () => void;
}) {
  const isPt = language === 'pt-BR';
  const stageLevel = getStageLevel(evolutionStage);
  const stage: FichaStage = (FICHA_STAGES as string[]).includes(stageLevel)
    ? (stageLevel as FichaStage) : 'rookie';

  // Skills do estágio atual — persistidas, senão o par default de combate
  // físico (fallback: a Arena abre para TODO save, inclusive legado).
  const skills = soulmonSkills?.[stage] ?? buildDefaultArenaSkills();
  const playerStats = getArenaPlayerStats(stage, skills.basica.escolaId);
  const special = SPECIAL_EFFECTS[skills.especial.escolaId];

  // Atributos elementais — recomputados do perfil local (mesmo caminho da
  // PetPage); sem perfil, vigor/vigor.
  const [attrs, setAttrs] = useState(DEFAULT_ARENA_ATTRIBUTES);
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const saved = readJson<(OracleInput & { seed: number }) | null>(STORAGE_KEYS.SOULMON_PROFILE, null);
        if (!saved?.soulProfile) return;
        const [{ buildFichaESkills }, { identityKey }] = await Promise.all([
          import('../utils/soulProfile/ficha/fromInput'),
          import('../utils/soulProfile/identity'),
        ]);
        const { fichaByStage } = buildFichaESkills(saved, identityKey(saved));
        if (!vivo) return;
        setAttrs(getArenaAttributes(fichaByStage[stage]));
      } catch {
        // fica no fallback vigor/vigor — a Arena nunca deixa de abrir
      }
    })();
    return () => { vivo = false; };
  }, [stage]);

  const poolRef = useRef<BestiaryCreature[] | null>(null);

  const [phase, setPhase] = useState<Phase>('intro');
  const [round, setRound] = useState(1);
  const [enemies, setEnemies] = useState<ViewEnemy[]>([]);
  const [playerHp, setPlayerHp] = useState(playerStats.hp);
  const [charge, setCharge] = useState(0);
  const [pending, setPending] = useState<'basica' | 'especial' | null>(null);
  const [popup, setPopup] = useState<Popup | null>(null);
  const [rewardMsg, setRewardMsg] = useState('');
  const [defendTimeLeft, setDefendTimeLeft] = useState(DEFEND_TIME);
  const [attackerIdx, setAttackerIdx] = useState(0);
  const [hitFx, setHitFx] = useState<number | 'player' | null>(null);

  const echoRef = useRef(0);
  const weakenRef = useRef(0);
  const defendQueueRef = useRef<number[]>([]);
  const defendResolvedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const after = useCallback((ms: number, fn: () => void) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(fn, ms);
  }, []);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const flash = (who: number | 'player') => {
    setHitFx(who);
    setTimeout(() => setHitFx(null), 450);
  };

  // `getDungeonEnemySprite` exclui uma LINHA (ex.: 'ignar'), não um estágio —
  // no modo demo a linha do jogador é o próprio `demoCharacterId`. É isso que
  // evita encarar um espelho de si mesmo na arena.
  const buildRound = useCallback((r: number, pool: BestiaryCreature[]): ViewEnemy[] =>
    buildArenaRound(r, 1, Math.random, pool).map(e => ({
      ...e,
      sprite: getDungeonEnemySprite(e.tier, demoCharacterId).sprite,
    })), [demoCharacterId]);

  const startRun = async () => {
    if (!poolRef.current) {
      // Pool do bestiário entra por import dinâmico — fora do bundle inicial.
      poolRef.current = await loadBestiaryPool();
    }
    echoRef.current = 0;
    weakenRef.current = 0;
    setRound(1);
    setEnemies(buildRound(1, poolRef.current));
    setPlayerHp(playerStats.hp);
    setCharge(0);
    setPending(null);
    setPopup(null);
    setRewardMsg('');
    setPhase('attack');
  };

  // ── Player turn ───────────────────────────────────────────────────────────
  const resolvePlayerAction = (acc: number) => {
    const skill = pending === 'especial' ? skills.especial : skills.basica;
    const list = enemies.map(e => ({ ...e }));
    const alive = () => list.filter(e => e.hp > 0);
    let dealt = 0;
    let killed = 0;
    let points = 0;

    // eco de evocação pendente
    if (echoRef.current > 0) {
      const t = alive()[0];
      if (t) {
        t.hp -= Math.max(1, Math.round(
          playerStats.dmg * (SPECIAL_EFFECTS[skills.especial.escolaId].echoMult ?? 0)
          * elementMultiplier(skills.especial.elementoId, t.elements)));
      }
      echoRef.current--;
    }

    let healMsg = '';
    if (pending === 'especial') {
      const targets = special.targets === 'all' ? alive() : alive().slice(0, special.targets);
      for (const t of targets) {
        const dmg = playerHitDamage(playerStats.dmg, acc,
          elementMultiplier(skills.especial.elementoId, t.elements), special.mult);
        t.hp -= dmg;
        dealt += dmg;
      }
      if (special.healFrac) {
        const heal = Math.round(playerStats.hp * special.healFrac);
        setPlayerHp(hp => Math.min(playerStats.hp, hp + heal));
        healMsg = isPt ? ` · +${heal} HP` : ` · +${heal} HP`;
      }
      if (special.weakenTurns) weakenRef.current = special.weakenTurns;
      if (special.echoTurns) echoRef.current = special.echoTurns;
      setCharge(0);
    } else {
      const t = alive()[0];
      if (t) {
        const dmg = playerHitDamage(playerStats.dmg, acc,
          elementMultiplier(skills.basica.elementoId, t.elements));
        t.hp -= dmg;
        dealt = dmg;
      }
      setCharge(c => Math.min(SPECIAL_CHARGE_TURNS, c + 1));
    }

    for (let i = 0; i < list.length; i++) {
      if (enemies[i].hp > 0 && list[i].hp <= 0) {
        killed++;
        points += list[i].points;
      }
      list[i].hp = Math.max(0, list[i].hp);
    }
    if (points > 0) {
      onEarnPoints(points);
      setRewardMsg(`+${points} Bits`);
    }
    setEnemies(list);
    flash(0);
    try { navigator.vibrate?.(acc >= 0.92 ? 40 : 15); } catch { /* noop */ }

    const crit = acc >= 0.92;
    const title = crit ? (isPt ? 'PERFEITO!' : 'PERFECT!')
      : acc >= 0.6 ? (isPt ? 'Bom golpe!' : 'Good hit!')
      : (isPt ? 'Raspão...' : 'Graze...');
    const skillName = isPt ? skill.nome.pt : skill.nome.en;
    setPopup({
      icon: pending === 'especial' ? '✨' : '⚔️', title,
      detail: `${skillName} — ${dealt} ${isPt ? 'de dano' : 'damage'}${killed > 0 ? (isPt ? ` · ${killed} derrotado(s)` : ` · ${killed} down`) : ''}${healMsg}`,
      color: pending === 'especial' ? '#c084fc' : '#4ade80',
    });
    setPending(null);
    setPhase('result');

    const anyAlive = list.some(e => e.hp > 0);
    after(POPUP_MS, () => {
      setPopup(null);
      if (!anyAlive) { clearRound(); return; }
      defendQueueRef.current = list.map((e, i) => (e.hp > 0 ? i : -1)).filter(i => i >= 0);
      setAttackerIdx(defendQueueRef.current[0]);
      defendResolvedRef.current = false;
      setDefendTimeLeft(DEFEND_TIME);
      setPhase('defend');
    });
  };

  const clearRound = () => {
    playTaskComplete();
    if (round >= ARENA_ROUNDS) { setPhase('run-complete'); return; }
    const heal = Math.round(playerStats.hp * ROUND_CLEAR_HEAL);
    setPlayerHp(hp => Math.min(playerStats.hp, hp + heal));
    setRewardMsg(isPt ? `Recuperou ${heal} de HP` : `Recovered ${heal} HP`);
    setPhase('round-clear');
  };

  const nextRound = () => {
    const r = round + 1;
    setRound(r);
    setEnemies(buildRound(r, poolRef.current ?? []));
    setPopup(null);
    setRewardMsg('');
    setPhase('attack');
  };

  // ── Enemy turns (one defend bar per attacker) ────────────────────────────
  const handleDefend = (acc: number, timedOut = false) => {
    if (defendResolvedRef.current) return;
    defendResolvedRef.current = true;
    const attacker = enemies[attackerIdx];
    if (!attacker) { setPhase('attack'); return; }

    const proceed = () => {
      const queue = defendQueueRef.current;
      const at = queue.indexOf(attackerIdx);
      const next = queue[at + 1];
      if (next === undefined) {
        if (weakenRef.current > 0) weakenRef.current--;
        setPopup(null);
        setPhase('attack');
        return;
      }
      setAttackerIdx(next);
      defendResolvedRef.current = false;
      setDefendTimeLeft(DEFEND_TIME);
      setPopup(null);
      setPhase('defend');
    };

    if (!timedOut && acc >= 0.92) {
      setPopup({
        icon: '🛡️', title: isPt ? 'DESVIO PERFEITO!' : 'PERFECT DODGE!',
        detail: isPt ? 'Nenhum dano sofrido' : 'No damage taken',
        color: '#60a5fa',
      });
      setPhase('result');
      after(POPUP_MS, proceed);
      return;
    }

    const effAcc = timedOut ? 0 : acc;
    const taken = enemyHitDamage(attacker.atk, effAcc, attacker.elements[0], attrs, weakenRef.current > 0);
    const newHp = Math.max(0, playerHp - taken);
    setPlayerHp(newHp);
    flash('player');
    try { navigator.vibrate?.(30); } catch { /* noop */ }

    const title = timedOut ? (isPt ? 'Muito lento!' : 'Too slow!')
      : effAcc >= 0.6 ? (isPt ? 'Desvio parcial!' : 'Partial dodge!')
      : (isPt ? 'Ataque em cheio!' : 'Direct hit!');
    setPopup({ icon: '💥', title, detail: isPt ? `Você sofreu ${taken} de dano` : `You took ${taken} damage`, color: '#f87171' });
    setPhase('result');

    if (newHp <= 0) {
      playDegenerate();
      after(POPUP_MS, () => { setPopup(null); setPhase('lost'); });
      return;
    }
    after(POPUP_MS, proceed);
  };
  const handleDefendRef = useRef(handleDefend);
  handleDefendRef.current = handleDefend;

  useEffect(() => {
    if (phase !== 'defend') return;
    const id = setInterval(() => {
      setDefendTimeLeft(t => {
        const nt = Math.max(0, +(t - 0.1).toFixed(1));
        if (nt <= 0) handleDefendRef.current(0, true);
        return nt;
      });
    }, 100);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === 'round-clear') playFeed();
  }, [phase]);

  // ── Rendering helpers ─────────────────────────────────────────────────────
  const petSprite = getSpriteForStage(evolutionStage, demoCharacterId);
  const inBattle = enemies.length > 0 && ['attack', 'defend', 'result', 'round-clear', 'run-complete', 'lost'].includes(phase);

  const hpBar = (cur: number, max: number, color: string, width = 90) => (
    <div style={{ width, height: 8, background: '#1c2636', border: '1px solid color-mix(in srgb, var(--sm-px-copper) 55%, transparent)', overflow: 'hidden' }}>
      <div style={{ width: `${(cur / max) * 100}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
    </div>
  );

  /** ▲ vantagem (skill do jogador countera) · ▼ perigo (countera o jogador). */
  const enemyElementChip = (el: string, key: string) => {
    const adv = countersElement(skills.basica.elementoId, el) || countersElement(skills.especial.elementoId, el);
    const threat = countersElement(el, attrs.principal) || countersElement(el, attrs.secundario);
    return (
      <span key={key} style={{ fontSize: '0.62rem', fontWeight: 700, color: adv ? '#4ade80' : threat ? '#f87171' : '#9fb2d8' }}>
        {elementLabel(el, isPt)}{adv ? ' ▲' : threat ? ' ▼' : ''}
      </span>
    );
  };

  const chargeReady = charge >= SPECIAL_CHARGE_TURNS;
  const attacker = enemies[attackerIdx];

  return (
    <div className="sm-px-dark-ctx sm-px-arcade-root" style={{ background: '#07090f', color: '#e8eefc' }}>
      {/* Top bar */}
      <div className="sm-px-arcade-bar" style={{ margin: '14px 16px 8px', justifyContent: 'space-between' }}>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
          <span className="sm-px-arcade-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={iconSwords} alt="" width={22} height={22} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
            {isPt ? 'Arena' : 'Arena'}
            <PixelTag>{isPt ? 'Teste' : 'Beta'}</PixelTag>
          </span>
          <span className="sm-px-arcade-label" style={{ color: '#c084fc' }}>
            {isPt ? 'Round' : 'Round'} {round}/{ARENA_ROUNDS}
          </span>
        </span>
        <button onClick={onExit} aria-label={isPt ? 'Sair' : 'Exit'} className="sm-px-arcade-close">
          <img src={iconClose} alt="" width={18} height={18} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
        </button>
      </div>

      {/* Battlefield */}
      {inBattle && (
        <div className="sm-px-card" style={{ flex: 1, position: 'relative', margin: '0 16px', borderColor: '#c084fc', ['--sm-cham-line' as string]: '#c084fc', backgroundColor: '#0c0a18', overflow: 'hidden', boxShadow: 'inset 0 0 60px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0 1px, transparent 1px 3px)', backgroundSize: '100% 6px', animation: 'dungeon-vhs 5s linear infinite', opacity: 0.55, mixBlendMode: 'overlay' }} />

          {/* Inimigos lado a lado, cada um com HP individual */}
          <div style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'flex-start', gap: 8, padding: '14px 8px 0', flexWrap: 'wrap' }}>
            {enemies.map((e, i) => (
              <div key={`${round}-${i}`} style={{ textAlign: 'center', opacity: e.hp <= 0 ? 0.25 : 1, transition: 'opacity 0.4s', maxWidth: 110 }}>
                <p style={{ fontSize: '0.68rem', fontWeight: 700, marginBottom: 2, textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                  {isPt ? e.namePt : e.nameEn}
                  {phase === 'defend' && i === attackerIdx && e.hp > 0 ? ' ⚔️' : ''}
                </p>
                <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginBottom: 3 }}>
                  {e.elements.map((el, j) => enemyElementChip(el, `${i}-${j}`))}
                </div>
                <div style={{ display: 'inline-block' }}>{hpBar(e.hp, e.maxHp, '#f87171', e.cls === 'boss' ? 110 : 80)}</div>
                <img
                  src={e.sprite}
                  alt={isPt ? e.namePt : e.nameEn}
                  style={{
                    width: e.cls === 'boss' ? 96 : e.cls === 'medium' ? 80 : 64,
                    height: e.cls === 'boss' ? 96 : e.cls === 'medium' ? 80 : 64,
                    objectFit: 'contain', imageRendering: 'pixelated', display: 'block', margin: '4px auto 0',
                    filter: hitFx === 0 && e.hp > 0 ? 'brightness(3) drop-shadow(0 0 10px #f87171)' : 'drop-shadow(0 0 8px rgba(248,113,113,0.35))',
                    transition: 'filter 0.15s',
                    animation: e.hp > 0 ? 'dungeon-idle 1.6s ease-in-out infinite' : 'none',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Jogador embaixo — chips dos 2 atributos */}
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-end', gap: 10, padding: '8px 14px 12px' }}>
            <img
              src={petSprite}
              alt="pet"
              style={{
                width: 76, height: 76, objectFit: 'contain', imageRendering: 'pixelated',
                filter: hitFx === 'player' ? 'brightness(3) drop-shadow(0 0 10px #f87171)' : 'drop-shadow(0 0 8px rgba(74,222,128,0.35))',
                transition: 'filter 0.15s', animation: 'dungeon-idle 1.3s ease-in-out infinite',
              }}
            />
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, marginBottom: 2, textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>{isPt ? 'Você' : 'You'}</p>
              <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                <PixelTag>{elementLabel(attrs.principal, isPt)}</PixelTag>
                <PixelTag>{elementLabel(attrs.secundario, isPt)}</PixelTag>
              </div>
              {hpBar(playerHp, playerStats.hp, '#4ade80', 110)}
            </div>
          </div>

          {popup && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,9,15,0.45)' }}>
              <div className="sm-px-card" style={{ textAlign: 'center', backgroundColor: '#0e1522', borderColor: popup.color, ['--sm-cham-line' as string]: popup.color, padding: '16px 26px', maxWidth: 300 }}>
                <div style={{ fontSize: '1.7rem', lineHeight: 1.2 }}>{popup.icon}</div>
                <p className="sm-px-arcade-value" style={{ fontSize: '1rem', color: popup.color, margin: '4px 0 2px' }}>{popup.title}</p>
                <p style={{ fontSize: '0.82rem', color: '#c6d4f2' }}>{popup.detail}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Intro */}
      {phase === 'intro' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24, textAlign: 'center' }}>
          <div className="sm-px-slot" style={{ width: 72, height: 72 }}>
            <img src={iconSwords} alt="" width={40} height={40} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <PixelTag>{elementLabel(attrs.principal, isPt)}</PixelTag>
            <PixelTag>{elementLabel(attrs.secundario, isPt)}</PixelTag>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#9fb2d8', maxWidth: 330 }}>
            {isPt
              ? '5 rounds contra criaturas selvagens. Lute com as habilidades do seu Soulmon: a básica sempre pronta, a especial precisa de 3 turnos de carga. Elementos têm vantagem (▲) e desvantagem (▼). Arena de teste: Bits por inimigo, e perder nunca custa corações.'
              : '5 rounds against wild creatures. Fight with your Soulmon\'s own skills: the basic is always ready, the special needs 3 turns of charge. Elements have advantage (▲) and disadvantage (▼). Test arena: Bits per enemy, and losing never costs hearts.'}
          </p>
          <div style={{ fontSize: '0.72rem', color: '#c6d4f2', maxWidth: 320 }}>
            <p>⚔️ {isPt ? skills.basica.nome.pt : skills.basica.nome.en} · ✨ {isPt ? skills.especial.nome.pt : skills.especial.nome.en}</p>
          </div>
          <span style={{ width: '100%', maxWidth: 320 }}>
            <PixelButton size="lg" variant="primary" onClick={() => { void startRun(); }}>
              {isPt ? 'Entrar na arena' : 'Enter the arena'}
            </PixelButton>
          </span>
        </div>
      )}

      {/* Action area */}
      {inBattle && (
        <div style={{ padding: 16, minHeight: 170 }}>
          {phase === 'attack' && pending === null && (
            <div>
              <p className="sm-px-arcade-label" style={{ textAlign: 'center', marginBottom: 8 }}>
                {isPt ? 'Seu turno — escolha a habilidade' : 'Your turn — pick a skill'}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ flex: 1 }}>
                  <PixelButton size="lg" variant="primary" onClick={() => setPending('basica')}>
                    ⚔️ {isPt ? skills.basica.nome.pt : skills.basica.nome.en}
                  </PixelButton>
                </span>
                <span style={{ flex: 1, opacity: chargeReady ? 1 : 0.55 }}>
                  <PixelButton size="lg" disabled={!chargeReady} onClick={() => chargeReady && setPending('especial')}>
                    ✨ {chargeReady
                      ? (isPt ? skills.especial.nome.pt : skills.especial.nome.en)
                      : (isPt ? `Carga ${charge}/${SPECIAL_CHARGE_TURNS}` : `Charge ${charge}/${SPECIAL_CHARGE_TURNS}`)}
                  </PixelButton>
                </span>
              </div>
            </div>
          )}
          {phase === 'attack' && pending !== null && (
            <div>
              <p className="sm-px-arcade-label" style={{ textAlign: 'center', marginBottom: 6 }}>
                {isPt ? 'Mire no centro!' : 'Aim for the center!'}
              </p>
              <TimingBar
                key={`atk-${round}-${charge}-${playerHp}`}
                speed={enemies.find(e => e.hp > 0)?.speed ?? 1}
                color={pending === 'especial' ? '#c084fc' : '#4ade80'}
                label={pending === 'especial' ? (isPt ? 'Soltar especial!' : 'Unleash special!') : (isPt ? 'Atacar!' : 'Attack!')}
                onStop={resolvePlayerAction}
              />
            </div>
          )}
          {phase === 'defend' && attacker && (
            <div>
              <p style={{ textAlign: 'center', fontSize: '0.84rem', fontWeight: 800, color: defendTimeLeft <= 1 ? '#f87171' : '#facc15', marginBottom: 6 }}>
                {isPt ? `${attacker.namePt} atacando — desvie!` : `${attacker.nameEn} attacking — dodge!`} {defendTimeLeft.toFixed(1)}s
              </p>
              <TimingBar
                key={`def-${round}-${attackerIdx}-${playerHp}`}
                speed={attacker.speed * 1.2}
                color="#60a5fa"
                label={isPt ? 'Desviar!' : 'Dodge!'}
                onStop={a => handleDefend(a)}
              />
            </div>
          )}
          {phase === 'result' && (
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#5d729c', paddingTop: 24 }}>…</p>
          )}
          {phase === 'round-clear' && (
            <div style={{ textAlign: 'center' }}>
              <p className="sm-px-arcade-value" style={{ fontSize: '1.05rem', marginBottom: 4 }}>
                {isPt ? `Round ${round} vencido!` : `Round ${round} cleared!`}
              </p>
              <p style={{ fontSize: '0.76rem', color: '#4ade80', marginBottom: 10 }}>{rewardMsg}</p>
              <PixelButton size="lg" variant="primary" onClick={nextRound}>
                {round + 1 === ARENA_ROUNDS
                  ? (isPt ? 'Round final — o chefe!' : 'Final round — the boss!')
                  : (isPt ? `Round ${round + 1}` : `Round ${round + 1}`)}
              </PixelButton>
            </div>
          )}
          {phase === 'run-complete' && (
            <div style={{ textAlign: 'center' }}>
              <p className="sm-px-arcade-value" style={{ fontSize: '1.05rem', marginBottom: 4, color: '#facc15' }}>
                {isPt ? 'Arena conquistada! Os 5 rounds caíram!' : 'Arena conquered! All 5 rounds down!'}
              </p>
              <p style={{ fontSize: '0.76rem', color: '#c6d4f2', marginBottom: 10 }}>
                {isPt ? 'Arena de teste: sem Glitchtama por aqui — só glória e Bits.' : 'Test arena: no Glitchtama here — just glory and Bits.'}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ flex: 1 }}>
                  <PixelButton size="lg" variant="primary" onClick={() => { void startRun(); }}>{isPt ? 'Nova run' : 'New run'}</PixelButton>
                </span>
                <span style={{ flex: 1 }}>
                  <PixelButton size="lg" onClick={onExit}>{isPt ? 'Sair' : 'Exit'}</PixelButton>
                </span>
              </div>
            </div>
          )}
          {phase === 'lost' && (
            <div style={{ textAlign: 'center' }}>
              <p className="sm-px-arcade-value" style={{ fontSize: '1.05rem', marginBottom: 4 }}>
                {isPt ? 'Você foi derrotado — seus corações continuam intactos.' : 'You were defeated — your hearts are untouched.'}
              </p>
              <p style={{ fontSize: '0.8rem', color: '#c6d4f2', marginBottom: 10 }}>
                {isPt ? `Round ${round}/${ARENA_ROUNDS}` : `Round ${round}/${ARENA_ROUNDS}`}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ flex: 1 }}>
                  <PixelButton size="lg" variant="primary" onClick={() => { void startRun(); }}>{isPt ? 'Jogar de novo' : 'Play again'}</PixelButton>
                </span>
                <span style={{ flex: 1 }}>
                  <PixelButton size="lg" onClick={onExit}>{isPt ? 'Sair' : 'Exit'}</PixelButton>
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
