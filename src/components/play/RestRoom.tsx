import { EndSessionModal } from './EndSessionModal';
import { CtaButton, CtaTextButton } from '../ui/CtaButton';
/**
 * A SALA DE DESCANSO (§301/§312, 12/11/2026, pedido do dono): o fim do trajeto troca o fundo do mapa, em tela cheia, por um oásis calmo (sem porta, sem moldura),
 * um por cenário do Foco (caverna → gruta de água cristalina). O descanso dura 5 min (10 no 50/10) e é contado por TIMESTAMP
 * (`utils/focusRest.ts`): sair do app não para o relógio. Aqui mora o «Baú aberto» do fim do foco, com a chave do Calabouço.
 * Dois botões: «Seguir» (outro foco, nova travessia) e «Concluir a missão» (encerra a sessão inteira, com o resumo).
 * Arte: slot `src/assets/soulmon/jornada/oasis-<cenário>.(webp|png)`; sem arquivo, fundo gerado em código (gradiente + lagoa).
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { sm2Hint, sm2Text } from '../form/FormKit';
import { useBackLayer } from '../../utils/backStack';
import { formatClock } from '../../utils/focoTimer';
import type { Language } from '../../utils/i18n';
import { restLeftMs, restOver, type RestState } from '../../utils/focusRest';
import { journeyItemInfo } from '../../utils/journeyItemInfo';
import { JOURNEY_CARD_WIDTH, JOURNEY_GLASS } from './FocusTaskDock';
import { CHEST_OPEN_SHEET, OASIS_ART, OASIS_TONE } from './journeyArt';
import { ItemIcon } from './FocusBag';

const reduced = (): boolean => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

/** Fundo gerado em código: gradiente calmo do cenário, lagoa com ondas suaves e pontinhos de luz. Vale até a arte chegar. */
function OasisFallback({ env }: { env: string }) {
  const t = OASIS_TONE[env] ?? OASIS_TONE.forest;
  return (
    <svg data-rest-fallback={env} viewBox="0 0 100 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="rs-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={t.sky} /><stop offset="0.6" stopColor={t.mid} /><stop offset="1" stopColor={t.ground} /></linearGradient>
        <radialGradient id="rs-glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor={t.glow} stopOpacity="0.55" /><stop offset="1" stopColor={t.glow} stopOpacity="0" /></radialGradient>
        <linearGradient id="rs-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={t.water} stopOpacity="0.95" /><stop offset="1" stopColor={t.waterDeep} /></linearGradient>
      </defs>
      <rect width="100" height="200" fill="url(#rs-sky)" />
      <circle cx="50" cy="62" r="46" fill="url(#rs-glow)" />
      <path d="M0 118 Q22 104 50 112 T100 108 V200 H0Z" fill={t.ground} opacity="0.55" />
      <ellipse cx="50" cy="132" rx="44" ry="15" fill="url(#rs-water)" />
      <ellipse cx="50" cy="132" rx="44" ry="15" fill="none" stroke={t.glow} strokeOpacity="0.4" strokeWidth="0.6" />
      <ellipse cx="42" cy="133" rx="14" ry="3.6" fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="0.5" />
      <ellipse cx="60" cy="129" rx="9" ry="2.4" fill="none" stroke="#fff" strokeOpacity="0.22" strokeWidth="0.5" />
      {[[14, 78], [82, 70], [30, 96], [70, 92], [90, 100], [10, 108]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="0.9" fill={t.glow} opacity="0.7" />)}
    </svg>
  );
}

export function RestRoom({ language, rest, petSprite, cycles, now, onNext, onFinish, onClose, busy, error }: {
  language: Language; rest: RestState; petSprite?: string; cycles: number;
  /** Agora (ms, relógio do aparelho): quem chama o atualiza a cada segundo. */
  now: number;
  onNext: () => void; onFinish: () => void; onClose: () => void;
  busy?: boolean; error?: string | null;
}) {
  const isPt = language === 'pt-BR';
  useBackLayer(true, onClose);
  const left = restLeftMs(rest, now);
  const over = restOver(rest, now);
  const art = OASIS_ART[rest.env];
  const bg = useRef<HTMLDivElement>(null);
  const [fadedIn, setFadedIn] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  useEffect(() => {
    // Chegar pela porta: a sala aparece devagar (sem animação com movimento reduzido).
    const el = bg.current;
    if (!el || reduced() || typeof el.animate !== 'function') { setFadedIn(true); return; }
    const a = el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700, easing: 'ease-out' });
    a.onfinish = () => setFadedIn(true);
    return () => a.cancel();
  }, []);
  const tone = OASIS_TONE[rest.env] ?? OASIS_TONE.forest;
  /* Fundo sólido na cor do céu do oásis (a mesma em que o mapa se dissolveu): só a camada de arte aparece devagar. */
  const box: CSSProperties = { position: 'fixed', inset: 0, zIndex: 210, background: tone.sky, overflow: 'hidden', color: '#e9f5f2' };
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={isPt ? 'Sala de descanso' : 'Rest room'} data-rest-room data-rest-over={over} data-rest-faded={fadedIn} style={box}>
      <div ref={bg} data-rest-bg style={{ position: 'absolute', inset: 0 }}>
        {art
          ? <img data-rest-art={rest.env} src={art} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          : <OasisFallback env={rest.env} />}
      </div>

      <section data-rest-card style={{ ...JOURNEY_GLASS, position: 'absolute', top: 'calc(10px + env(safe-area-inset-top, 0px))', left: '50%', transform: 'translateX(-50%)', width: JOURNEY_CARD_WIDTH, zIndex: 2, padding: '8px 12px 10px', display: 'grid', justifyItems: 'center', gap: 4 }}>
        <span style={{ ...sm2Hint, margin: 0 }}>{over ? (isPt ? 'Descanso concluído' : 'Break is over') : (isPt ? 'Descanso' : 'Rest')}</span>
        <span data-rest-clock role="timer" aria-label={isPt ? (over ? 'Descanso concluído' : 'Tempo de descanso restante') : (over ? 'Break is over' : 'Rest time left')} className="sm2-num" style={{ fontFamily: 'var(--sm2-font-display)', fontWeight: 700, fontSize: 'calc(var(--sm2-text-2xl) * 1.6)', lineHeight: 1.1 }}>{formatClock(left)}</span>
        <span data-rest-cycles style={{ ...sm2Hint, margin: 0 }}>{isPt ? `${cycles} ${cycles === 1 ? 'foco concluído' : 'focos concluídos'}` : `${cycles} ${cycles === 1 ? 'focus done' : 'focuses done'}`}</span>
      </section>

      <div data-rest-pet style={{ position: 'absolute', left: '50%', top: '57%', transform: 'translate(-50%, -50%)', width: 'min(34vw, 150px)', zIndex: 1 }}>
        {petSprite ? <img src={petSprite} alt="" style={{ display: 'block', width: '100%', imageRendering: 'pixelated' }} /> : <span aria-hidden="true" style={{ display: 'block', width: 56, height: 56, margin: '0 auto', borderRadius: '50%', background: '#e9f5f2' }} />}
      </div>

      <div data-rest-bottom style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 2, padding: '0 12px calc(16px + env(safe-area-inset-bottom, 0px))', display: 'grid', justifyItems: 'center', gap: 10 }}>
        <section data-rest-chest aria-label={isPt ? 'Baú aberto' : 'Chest opened'} style={{ ...JOURNEY_GLASS, width: JOURNEY_CARD_WIDTH, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg aria-hidden="true" width={44} height={58} viewBox="576 0 192 256" preserveAspectRatio="xMidYMid meet" style={{ flex: '0 0 auto' }}>
            <image href={CHEST_OPEN_SHEET} width={768} height={256} />
          </svg>
          <div style={{ display: 'grid', gap: 4, minWidth: 0 }}>
            <span style={{ ...sm2Text, fontWeight: 600 }}>{isPt ? 'Baú aberto' : 'Chest opened'}</span>
            {rest.items.length > 0 && <ul data-rest-items style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {rest.items.map(it => <li key={`${it.kind}:${it.id}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ItemIcon item={it} isPt={isPt} size={22} /><span style={sm2Text}>{journeyItemInfo(it, isPt).name} ×{it.qty}</span></li>)}
            </ul>}
            {rest.key && <span data-rest-key role="status" style={{ ...sm2Text, margin: 0 }}>{isPt ? 'A chave do Calabouço é sua hoje.' : 'The Dungeon key is yours today.'}</span>}
            {rest.items.length === 0 && !rest.key && <span style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Dessa vez o baú veio vazio.' : 'This time the chest was empty.'}</span>}
          </div>
        </section>
        {error && <p role="status" data-rest-error style={{ ...sm2Hint, margin: 0, color: '#e9f5f2', textAlign: 'center' }}>{error}</p>}
        {/* CTA em coluna (§316b) + secundárias SÓ TEXTO (§316c, 13/11/2026, dono): Seguir em cima; Concluir a missão e Sair embaixo, sem fundo e sem borda. */}
        <div data-cta-stack style={{ display: 'grid', gap: 4, width: JOURNEY_CARD_WIDTH }}>
          <CtaButton data-rest-next onClick={onNext} disabled={!!busy}>{isPt ? 'Seguir' : 'Keep going'}</CtaButton>
          <CtaTextButton data-rest-finish surface="escuro" onClick={() => setConfirmFinish(true)} disabled={busy} aria-haspopup="dialog">{isPt ? 'Concluir a missão' : 'Finish the mission'}</CtaTextButton>
          <CtaTextButton data-rest-close surface="escuro" onClick={onClose} aria-label={isPt ? 'Sair para a Oficina (o descanso continua)' : 'Leave to the Workshop (the break goes on)'}>{isPt ? 'Sair (o descanso continua)' : 'Leave (the break goes on)'}</CtaTextButton>
        </div>
      </div>
      {confirmFinish && <EndSessionModal language={language} onYes={() => { setConfirmFinish(false); onFinish(); }} onNo={() => setConfirmFinish(false)} />}
    </div>,
    document.body,
  );
}
