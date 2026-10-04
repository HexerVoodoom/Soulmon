import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { EarningGameProps } from './types';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { GameRoot, GameHeader, GameVisor, VisorSprite, phaseTitle, phaseLine } from '../games/GameKit';
import { usePrefersReducedMotion } from '../ui/Viewport';
import { getSpriteForStage } from '../../utils/sprites';
import { ATELIE_SCENE, MINI_FX } from '../../utils/visorScenes';
import {
  checkTap, ecoBits, growSequence, playbackIntervalMs, startSequence,
  ECO_MAX_BITS, ECO_START_LENGTH, type Stone,
} from '../../utils/mente/eco';

/**
 * ECO DO PET (`docs/BENCHMARK-MINIJOGOS.md` §6.2) — o pet acende as pedras
 * numa ordem e você repete. A regra é de `utils/mente/eco.ts`; aqui só tela.
 *
 * Regras de casa: nasce MUDO (R-NOVA — nenhum import de `utils/sounds`); o
 * fim da rodada é o MAIOR ECO, nunca "game over"; nada de vermelho; cada pedra
 * tem FORMA e NOME, não só cor; alvo ≥ 44; ícone pelado (a forma não tem caixa).
 */

/** As quatro pedras: forma + nome + cor do kit. `visor` = a cor sobre o vidro escuro. */
const STONES: ReadonlyArray<{ pt: string; en: string; color: string; visor: string; clip?: string; radius?: string }> = [
  { pt: 'Círculo', en: 'Circle', color: 'var(--sm2-primary-fill)', visor: 'var(--sm2-primary-fill)', radius: '50%' },
  { pt: 'Triângulo', en: 'Triangle', color: 'var(--sm2-gold-fill)', visor: 'var(--sm2-gold-fill)', clip: 'polygon(50% 4%, 100% 96%, 0 96%)' },
  { pt: 'Quadrado', en: 'Square', color: 'var(--sm2-credit-ink)', visor: 'var(--sm2-credit-ink)', radius: '6px' },
  { pt: 'Losango', en: 'Diamond', color: 'var(--sm2-ink)', visor: 'var(--sm2-viewport-ink)', clip: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)' },
];

type Phase = 'intro' | 'show' | 'input' | 'done';

/**
 * A pedra é o sprite 48² da leva `visores` (01/10/2026): a FORMA (anel, losango, quadrado,
 * triângulo, todos com engaste de cobre) é o que distingue uma da outra — a cor deixou de
 * ser a pista, e a regra "forma e nome, não só cor" fica cumprida pela própria arte. A
 * cor do kit (`color`) segue só no brilho e no sublinhado do nome.
 */
function StoneShape({ stone, size }: { stone: Stone; size: number }) {
  return (
    <img
      src={MINI_FX.pedras[stone]}
      alt=""
      aria-hidden="true"
      draggable={false}
      data-eco-shape={stone}
      width={size}
      height={size}
      style={{ display: 'block', width: size, height: size, flex: 'none', imageRendering: 'pixelated' }}
    />
  );
}

export function EcoGame({ language, evolutionStage, demoCharacterId, onEarnPoints, onExit }: EarningGameProps) {
  const isPt = language === 'pt-BR';
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>('intro');
  const [reverse, setReverse] = useState(false);
  const [seq, setSeq] = useState<Stone[]>([]);
  const [input, setInput] = useState<Stone[]>([]);
  const [lit, setLit] = useState<Stone | null>(null);
  // Acertos desta rodada: cada um dá um pulinho no pet (`VisorSprite hop`).
  const [hits, setHits] = useState(0);
  const [longest, setLongest] = useState(0);
  const [earned, setEarned] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const paid = useRef(false);

  const clearTimers = useCallback(() => {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers]);

  const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)); };

  /** O pet "canta" a sequência: cada pedra acende por 60% do intervalo. */
  const playback = useCallback((s: Stone[]) => {
    clearTimers();
    setPhase('show');
    setInput([]);
    setLit(null);
    const iv = playbackIntervalMs(s.length);
    const lead = 500;
    s.forEach((st, i) => {
      timers.current.push(setTimeout(() => setLit(st), lead + i * iv));
      timers.current.push(setTimeout(() => setLit(null), lead + i * iv + Math.round(iv * 0.6)));
    });
    timers.current.push(setTimeout(() => setPhase('input'), lead + s.length * iv));
  }, [clearTimers]);

  const start = () => {
    paid.current = false;
    setLongest(0);
    setEarned(0);
    const s = startSequence(Math.random);
    setSeq(s);
    playback(s);
  };

  const finish = (best: number) => {
    clearTimers();
    setLit(null);
    setPhase('done');
    const bits = ecoBits(best);
    setEarned(bits);
    // Uma vez por rodada, e só se houver o que pagar.
    if (bits > 0 && !paid.current) {
      paid.current = true;
      onEarnPoints(bits);
    }
  };

  const tap = (stone: Stone) => {
    if (phase !== 'input') return;
    if (!reduced) { try { navigator.vibrate?.(15); } catch { /* noop */ } }
    // Eco visual do toque (mesma tinta para certo e para fora da ordem).
    setLit(stone);
    later(() => setLit(null), 180);
    const r = checkTap(seq, input, stone, reverse);
    if (r === 'miss') { finish(longest); return; }
    setHits(h => h + 1);
    if (r === 'continue') { setInput([...input, stone]); return; }
    // Completou: guarda o maior eco e cresce 1.
    const best = Math.max(longest, seq.length);
    setLongest(best);
    setInput([]);
    setPhase('show');
    const next = growSequence(seq, Math.random);
    later(() => { setSeq(next); playback(next); }, 600);
  };

  const pet = getSpriteForStage(evolutionStage, demoCharacterId);
  const title = isPt ? 'Eco do Pet' : 'Pet Echo';
  const sub = reverse
    ? (isPt ? 'Repita as pedras de trás para frente.' : 'Repeat the stones backwards.')
    : (isPt ? 'Repita as pedras na ordem em que o pet cantar.' : 'Repeat the stones in the order your pet sings them.');

  const status = phase === 'intro'
    ? (isPt ? 'Quando quiser' : 'Whenever you like')
    : phase === 'show'
      ? (isPt ? 'Observe o eco…' : 'Watch the echo…')
      : phase === 'input'
        ? (isPt ? `Sua vez · ${input.length}/${seq.length}` : `Your turn · ${input.length}/${seq.length}`)
        : (isPt ? `Maior eco: ${longest}` : `Longest echo: ${longest}`);

  const toggle: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    minHeight: 44, padding: '0 16px', borderRadius: 999, boxSizing: 'border-box', alignSelf: 'center',
    border: `1px solid ${reverse ? 'var(--sm2-primary-ink)' : 'var(--sm2-muted)'}`,
    backgroundColor: reverse ? 'var(--sm2-primary-soft)' : 'var(--sm2-surface-2)',
    color: reverse ? 'var(--sm2-primary-ink)' : 'var(--sm2-ink)',
    fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm)', fontWeight: 500,
    lineHeight: 'var(--sm2-leading-body)', cursor: 'pointer',
  };

  return (
    <GameRoot>
      <GameHeader
        title={title}
        language={language}
        infoLabel={isPt ? 'Como se joga' : 'How to play'}
        info={(
          <>
            <span style={{ display: 'block' }}>{sub}</span>
            <span style={{ display: 'block', marginTop: 6 }}>
              {isPt ? `Começa com ${ECO_START_LENGTH} pedras e cresce uma a cada eco.` : `Starts with ${ECO_START_LENGTH} stones and grows by one each echo.`}
            </span>
            <span style={{ display: 'block', marginTop: 6 }}>
              {isPt ? `1 Bit por pedra além de ${ECO_START_LENGTH}, até ${ECO_MAX_BITS}.` : `1 Bit per stone past ${ECO_START_LENGTH}, up to ${ECO_MAX_BITS}.`}
            </span>
          </>
        )}
        closeLabel={isPt ? 'Sair' : 'Exit'}
        onClose={onExit}
      />

      {/* O VISOR: o pet no meio e a pedra que ele está cantando ao lado. */}
      <GameVisor height={80} scene={ATELIE_SCENE} label={isPt ? 'O pet canta as pedras' : 'Your pet sings the stones'}>
        <VisorSprite
          src={pet}
          data-visor-pet
          idle={!reduced}
          hop={hits}
          style={{
            left: 110, top: 24,
            transform: !reduced && lit !== null && phase === 'show' ? 'translateY(-6px)' : undefined,
          }}
        />
        {lit !== null && (
          <span data-eco-note={lit} style={{ position: 'absolute', left: 258, top: 56 }}>
            <StoneShape stone={lit} size={48} />
          </span>
        )}
      </GameVisor>

      <p role="status" className="sm2-num" style={phaseTitle} data-eco-status>
        {status}
      </p>
      {phase === 'done' && (
        <p style={phaseLine} data-eco-done>
          {earned > 0
            ? (isPt ? `Seu pet comemora o eco. +${earned} Bits` : `Your pet celebrates the echo. +${earned} Bits`)
            : (isPt ? 'Seu pet comemora o eco. Bora mais uma?' : 'Your pet celebrates the echo. Another go?')}
        </p>
      )}

      {/* As pedras: forma pelada + nome, sem caixa (ícone nunca em box). */}
      {phase !== 'intro' && phase !== 'done' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%', maxWidth: 348, alignSelf: 'center' }}>
          {STONES.map((s, i) => {
            const on = lit === i;
            const off = phase !== 'input';
            return (
              <button
                key={s.en}
                type="button"
                data-eco-stone={i}
                aria-label={isPt ? s.pt : s.en}
                disabled={off}
                onClick={() => tap(i as Stone)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                  minHeight: 88, padding: 4, background: 'none', border: 'none',
                  cursor: off ? 'default' : 'pointer', color: 'var(--sm2-ink)',
                  opacity: on ? 1 : off ? 0.55 : 0.8,
                  borderRadius: 'var(--sm2-radius-md)',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    transform: on && !reduced ? 'scale(1.12)' : undefined,
                    filter: on ? `drop-shadow(0 0 8px ${s.color})` : undefined,
                    transition: 'transform 120ms var(--sm2-ease), filter 120ms var(--sm2-ease)',
                  }}
                >
                  <StoneShape stone={i as Stone} size={48} />
                </span>
                <span
                  style={{
                    ...sm2Hint, color: 'var(--sm2-ink)', fontWeight: on ? 600 : 500,
                    borderBottom: `2px solid ${on ? s.color : 'transparent'}`,
                  }}
                >
                  {isPt ? s.pt : s.en}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {phase === 'intro' && (
        <>
          <button type="button" aria-pressed={reverse} onClick={() => setReverse(r => !r)} style={toggle} data-eco-reverse>
            {isPt ? 'Eco reverso' : 'Reverse echo'}{reverse ? (isPt ? ' · ligado' : ' · on') : ''}
          </button>
          <button type="button" onClick={start} style={sm2Button('primary')} data-eco-start>
            {isPt ? 'Começar' : 'Start'}
          </button>
        </>
      )}

      {phase === 'done' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={start} style={{ ...sm2Button('primary'), flex: 1, minWidth: 0, padding: '0 8px' }} data-eco-again>
            {isPt ? 'Jogar de novo' : 'Play again'}
          </button>
          <button type="button" onClick={onExit} style={{ ...sm2Button('outline'), flex: 1, minWidth: 0, padding: '0 8px' }}>
            {isPt ? 'Sair' : 'Exit'}
          </button>
        </div>
      )}

      {phase === 'input' && reverse && (
        <p style={{ ...sm2Text, margin: 0, textAlign: 'center' }}>
          {isPt ? 'De trás para frente.' : 'Backwards.'}
        </p>
      )}
    </GameRoot>
  );
}
