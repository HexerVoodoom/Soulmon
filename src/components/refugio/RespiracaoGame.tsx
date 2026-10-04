import { useEffect, useRef, useState } from 'react';
import { SupportNote } from './SupportNote';
import type { CSSProperties } from 'react';
import type { MiniGameBaseProps } from '../mente/types';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { GameRoot, GameHeader, GameVisor, VisorSprite, phaseTitle, phaseLine } from '../games/GameKit';
import { usePrefersReducedMotion } from '../ui/Viewport';
import { MINI_FX, REFUGIO_SCENE } from '../../utils/visorScenes';
import { getSpriteForStage } from '../../utils/sprites';
import {
  BREATH_PATTERNS, BREATH_DURATIONS_MIN, phaseAt, fillLevel, sessionMs, type BreathPhase,
} from '../../utils/refugio/respiracao';

/**
 * RESPIRAÇÃO COM O PET (Refúgio, `docs/BENCHMARK-MINIJOGOS.md` §6.8) — para os
 * momentos difíceis. Uma bolha enche e esvazia no ritmo escolhido e o pet
 * respira junto.
 *
 * NÃO mede nada, NÃO pontua, NÃO paga — por isso recebe `MiniGameBaseProps`,
 * sem o callback de Bits. Funciona sem toque nenhum; o botão de segurar é só um
 * apoio para quem quer acompanhar com o dedo. Nasce MUDO (R-NOVA).
 * Movimento reduzido troca a escala por uma barra de preenchimento — reduz o
 * MOVIMENTO, nunca a pausa.
 */

type Screen = 'setup' | 'run' | 'done';

const TICK_MS = 100;

const PATTERN_LABEL: Record<string, { pt: string; en: string; hintPt: string; hintEn: string }> = {
  calma: { pt: 'Calma', en: 'Calm', hintPt: 'entra 4 · sai 6', hintEn: 'in 4 · out 6' },
  quadrada: { pt: 'Quadrada', en: 'Box', hintPt: 'entra 4 · segura 4 · sai 4 · segura 4', hintEn: 'in 4 · hold 4 · out 4 · hold 4' },
};

function phaseWord(phase: BreathPhase, isPt: boolean): string {
  if (phase === 'inhale') return isPt ? 'Inspire' : 'Breathe in';
  if (phase === 'exhale') return isPt ? 'Expire' : 'Breathe out';
  return isPt ? 'Segure' : 'Hold';
}

/** O aviso de ajuda — mesma peça do Refúgio (`SupportNote`, dono dos números: `utils/supportLine.ts`). */
export function CrisisNote({ isPt }: { isPt: boolean }) {
  return <SupportNote isPt={isPt} data-respiracao-crisis />;
}

export function RespiracaoGame({ language, evolutionStage, demoCharacterId, onExit }: MiniGameBaseProps) {
  const isPt = language === 'pt-BR';
  const reduced = usePrefersReducedMotion();
  const [screen, setScreen] = useState<Screen>('setup');
  const [patternId, setPatternId] = useState(BREATH_PATTERNS[0].id);
  const [minutes, setMinutes] = useState(BREATH_DURATIONS_MIN[0]);
  const [elapsed, setElapsed] = useState(0);
  const [holding, setHolding] = useState(false);
  const startedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const pattern = BREATH_PATTERNS.find(p => p.id === patternId) ?? BREATH_PATTERNS[0];
  const total = sessionMs(pattern, minutes);

  const stopTimer = () => {
    if (timer.current !== null) { clearInterval(timer.current); timer.current = null; }
  };
  useEffect(() => stopTimer, []);

  const start = () => {
    stopTimer();
    startedAt.current = Date.now();
    setElapsed(0);
    setHolding(false);
    setScreen('run');
    timer.current = setInterval(() => {
      const e = Date.now() - startedAt.current;
      if (e >= total) {
        stopTimer();
        setElapsed(total);
        setHolding(false);
        setScreen('done');
        return;
      }
      setElapsed(e);
    }, TICK_MS);
  };

  const finish = () => { stopTimer(); setHolding(false); setScreen('done'); };

  const { phase, progress } = phaseAt(pattern, elapsed);
  const level = fillLevel(phase, progress);
  const sprite = getSpriteForStage(evolutionStage, demoCharacterId);
  const title = isPt ? 'Respirar com o pet' : 'Breathe with your pet';
  const closeLabel = isPt ? 'Sair' : 'Exit';

  const chip = (on: boolean): CSSProperties => ({
    display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    minHeight: 44, padding: '4px 16px', borderRadius: 'var(--sm2-radius-md)', boxSizing: 'border-box',
    border: `1px solid ${on ? 'var(--sm2-primary-ink)' : 'var(--sm2-muted)'}`,
    boxShadow: on ? '0 0 0 1px var(--sm2-primary-ink)' : 'none',
    backgroundColor: on ? 'var(--sm2-surface)' : 'var(--sm2-surface-2)', color: 'var(--sm2-ink)',
    fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm)', fontWeight: 500,
    lineHeight: 'var(--sm2-leading-body)', cursor: 'pointer', flex: 1, minWidth: 0,
  });

  if (screen === 'setup') {
    return (
      <GameRoot>
        <GameHeader
          title={title}
          language={language}
          infoLabel={isPt ? 'Como respirar com o Soulmon' : 'How to breathe with your Soulmon'}
          info={isPt ? 'Siga a bolha. Não precisa tocar em nada.' : 'Follow the bubble. No need to touch anything.'}
          closeLabel={closeLabel}
          onClose={onExit}
        />
        <GameVisor height={72} scene={REFUGIO_SCENE}>
          <VisorSprite src={sprite} data-visor-pet style={{ left: 'calc(50% - 64px)', top: 8 }} />
        </GameVisor>
        <div role="group" aria-label={isPt ? 'Ritmo' : 'Rhythm'} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ ...sm2Text, margin: 0, fontWeight: 500 }}>{isPt ? 'Ritmo' : 'Rhythm'}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {BREATH_PATTERNS.map(p => {
              const l = PATTERN_LABEL[p.id] ?? { pt: p.id, en: p.id, hintPt: '', hintEn: '' };
              return (
                <button key={p.id} type="button" data-respiracao-pattern={p.id} aria-pressed={p.id === patternId} onClick={() => setPatternId(p.id)} style={chip(p.id === patternId)}>
                  <span>{isPt ? l.pt : l.en}</span>
                  <span style={{ ...sm2Hint, fontWeight: 400 }}>{isPt ? l.hintPt : l.hintEn}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div role="group" aria-label={isPt ? 'Duração' : 'Duration'} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ ...sm2Text, margin: 0, fontWeight: 500 }}>{isPt ? 'Duração' : 'Duration'}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {BREATH_DURATIONS_MIN.map(m => (
              <button key={m} type="button" data-respiracao-min={m} aria-pressed={m === minutes} onClick={() => setMinutes(m)} style={chip(m === minutes)}>
                {m} min
              </button>
            ))}
          </div>
        </div>
        <button type="button" data-respiracao-start onClick={start} style={sm2Button('primary')}>
          {isPt ? 'Começar' : 'Start'}
        </button>
        <CrisisNote isPt={isPt} />
      </GameRoot>
    );
  }

  if (screen === 'done') {
    return (
      <GameRoot>
        <GameHeader title={title} closeLabel={closeLabel} onClose={onExit} />
        <GameVisor height={72} scene={REFUGIO_SCENE}>
          <VisorSprite src={sprite} data-visor-pet style={{ left: 'calc(50% - 64px)', top: 8 }} />
        </GameVisor>
        <p role="status" data-respiracao-done style={phaseTitle}>
          {isPt ? 'Tudo bem. Volte quando precisar.' : 'All good. Come back whenever you need.'}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setScreen('setup')} style={{ ...sm2Button('outline'), flex: 1, minWidth: 0 }}>
            {isPt ? 'De novo' : 'Again'}
          </button>
          <button type="button" onClick={onExit} style={{ ...sm2Button('primary'), flex: 1, minWidth: 0 }}>
            {isPt ? 'Sair' : 'Exit'}
          </button>
        </div>
        <CrisisNote isPt={isPt} />
      </GameRoot>
    );
  }

  // ---- respirando ----
  // Bolha: de 40% a 100% do diâmetro máximo. Com movimento reduzido ela não
  // muda de tamanho — só de opacidade — e a barra abaixo mostra o enchimento.
  // 144 = 3× o sprite 48² (escala inteira; a 136 o pixel saía irregular).
  const BUBBLE = 144;
  const scale = reduced ? 1 : 0.4 + 0.6 * level;
  const petScale = reduced ? 1 : 0.94 + 0.08 * level;
  const ease = `${TICK_MS}ms linear`;
  return (
    <GameRoot>
      <GameHeader run activity title={title} closeLabel={closeLabel} onClose={onExit} />
      <GameVisor height={80} scene={REFUGIO_SCENE}>
        <div
          aria-hidden="true"
          data-respiracao-bubble
          style={{
            position: 'absolute', left: '50%', top: '50%', width: BUBBLE, height: BUBBLE,
            marginLeft: -BUBBLE / 2, marginTop: -BUBBLE / 2,
            // Sprite 48² `fx-bolha-respiro` (leva `visores`, 01/10/2026), sem borda nem caixa.
            background: `url(${MINI_FX.bolhaRespiro}) center/100% 100% no-repeat`,
            imageRendering: 'pixelated',
            opacity: reduced ? 0.25 + 0.65 * level : (holding ? 0.95 : 0.8),
            transform: `scale(${scale})`,
            transition: reduced ? `opacity ${ease}` : `transform ${ease}, opacity 200ms linear`,
          }}
        />
        <VisorSprite
          src={sprite}
          size={64}
          idle={false}
          data-visor-pet
          style={{ left: 'calc(50% - 32px)', top: 'calc(50% - 32px)', transform: `scale(${petScale})`, transition: reduced ? undefined : `transform ${ease}` }}
        />
      </GameVisor>
      <p aria-live="polite" data-respiracao-phase style={{ ...phaseTitle, fontSize: 'var(--sm2-text-lg)' }}>
        {phaseWord(phase, isPt)}
      </p>
      {reduced && (
        <div
          data-respiracao-fill
          aria-hidden="true"
          style={{ height: 12, borderRadius: 6, backgroundColor: 'var(--sm2-surface-2)', border: '1px solid var(--sm2-line)', overflow: 'hidden' }}
        >
          <div style={{ width: `${Math.round(level * 100)}%`, height: '100%', backgroundColor: 'var(--sm2-primary-fill)' }} />
        </div>
      )}
      {/* Apoio opcional: segurar enquanto inspira. Não mede nada — só acende a bolha. */}
      <button
        type="button"
        data-respiracao-hold
        aria-pressed={holding}
        onPointerDown={() => setHolding(true)}
        onPointerUp={() => setHolding(false)}
        onPointerLeave={() => setHolding(false)}
        onPointerCancel={() => setHolding(false)}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setHolding(true); }}
        onKeyUp={() => setHolding(false)}
        style={{ ...sm2Button('outline'), minHeight: 56, touchAction: 'none', userSelect: 'none' }}
      >
        {isPt ? 'Segure enquanto inspira (opcional)' : 'Hold while breathing in (optional)'}
      </button>
      <p style={phaseLine}>{isPt ? 'Se preferir, só olhe a bolha.' : 'Or just watch the bubble.'}</p>
      <button type="button" data-respiracao-stop onClick={finish} style={sm2Button('quiet')}>
        {isPt ? 'Terminar' : 'Finish'}
      </button>
      <CrisisNote isPt={isPt} />
    </GameRoot>
  );
}
