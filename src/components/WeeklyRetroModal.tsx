/**
 * RETROSPECTIVA DA SEMANA (segunda-feira) — o modal que celebra e convida (pedido do dono, 16/11/2026).
 *
 * Peso especial: não é uma folha comum. CELEBRA o que a pessoa fez e ENGAJA para a semana que
 * começa. Peça central: a CHAMA DA ALMA em turquesa (nunca laranja ou vermelha), com o Soulmon
 * do próprio usuário ao lado. Tudo em CSS/SVG, sem asset novo; com `prefers-reduced-motion` as
 * entradas, partículas, brilho e contadores viram o estado final direto.
 *
 * A regra (quem ganha o bônus, contagens, semana) mora em `utils/weeklyRetro.ts`; aqui é só a
 * apresentação. Ver o cartão do bônus NÃO conclui nada: o bônus paga na conclusão real.
 *
 * Etapa extra (só se o Soulmon evoluiu na semana passada): a forma ANTERIOR com um balão; ao
 * toque, flash turquesa e a troca para a forma ATUAL.
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Language } from '../utils/i18n';
import type { WeeklyRetro } from '../utils/weeklyRetro';
import { Icon } from './ui/Icon';
import { usePrefersReducedMotion } from './ui/Viewport';

export interface WeeklyRetroModalProps {
  language: Language;
  retro: WeeklyRetro;
  /** Sprite da forma atual do Soulmon do usuário (o mesmo que a Home usa). */
  spriteNow: string;
  /** Sprite da forma anterior, só se evoluiu na semana; senão `null` (a etapa não aparece). */
  spritePrev: string | null;
  petName?: string;
  onClose: () => void;
}

const TEAL = '#4DF0DC';
const INK = '#E9FBF8';

const CSS = `
.rt-root{position:fixed;inset:0;z-index:240;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;
  background:radial-gradient(120% 80% at 50% 0%,#0E5A53 0%,#073A36 45%,#04211F 100%);color:${INK};
  padding:max(20px,env(safe-area-inset-top)) 16px max(24px,env(safe-area-inset-bottom));box-sizing:border-box}
.rt-col{width:100%;max-width:440px;display:flex;flex-direction:column;gap:16px;align-items:stretch}
.rt-in{animation:rt-up .6s cubic-bezier(.2,.8,.2,1) both;animation-delay:var(--d,0s)}
@keyframes rt-up{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}
.rt-hero{position:relative;height:210px;display:flex;align-items:flex-end;justify-content:center}
.rt-flame{position:absolute;left:50%;top:0;width:132px;height:168px;margin-left:-66px;transform-origin:50% 92%;
  filter:drop-shadow(0 0 18px rgba(77,240,220,.75)) drop-shadow(0 0 44px rgba(77,240,220,.4));animation:rt-flick 2.4s ease-in-out infinite}
@keyframes rt-flick{0%,100%{transform:scale(1,1) skewX(0)}30%{transform:scale(1.04,1.07) skewX(1.5deg)}60%{transform:scale(.98,1.02) skewX(-1.5deg)}}
.rt-halo{position:absolute;left:50%;top:6px;width:240px;height:240px;margin-left:-120px;border-radius:50%;
  background:radial-gradient(circle,rgba(77,240,220,.32),rgba(77,240,220,0) 68%);animation:rt-pulse 3s ease-in-out infinite}
@keyframes rt-pulse{0%,100%{opacity:.7;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}
.rt-spark{position:absolute;bottom:60px;width:5px;height:5px;border-radius:50%;background:${TEAL};box-shadow:0 0 8px ${TEAL};
  opacity:0;animation:rt-rise 3.4s ease-out infinite;animation-delay:var(--sd,0s)}
@keyframes rt-rise{0%{opacity:0;transform:translate(0,0) scale(.6)}15%{opacity:1}100%{opacity:0;transform:translate(var(--sx,0),-170px) scale(1.1)}}
.rt-pet{position:relative;height:104px;width:auto;image-rendering:pixelated;filter:drop-shadow(0 6px 10px rgba(0,0,0,.45));animation:rt-bob 3s ease-in-out infinite}
@keyframes rt-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.rt-title{margin:0;text-align:center;font-size:26px;line-height:1.15;font-weight:800;letter-spacing:.01em}
.rt-kicker{margin:0;text-align:center;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${TEAL}}
.rt-sub{margin:0;text-align:center;font-size:15px;line-height:1.4;color:rgba(233,251,248,.82)}
.rt-stats{display:flex;gap:10px}
.rt-stat{flex:1;min-width:0;text-align:center;padding:14px 8px;border-radius:16px;background:rgba(77,240,220,.09);border:1px solid rgba(77,240,220,.28)}
.rt-num{display:block;font-size:38px;line-height:1;font-weight:800;color:${TEAL};font-variant-numeric:tabular-nums;text-shadow:0 0 16px rgba(77,240,220,.5)}
.rt-lab{display:block;margin-top:6px;font-size:13px;line-height:1.25;color:rgba(233,251,248,.85)}
.rt-card{border-radius:16px;background:rgba(255,255,255,.06);border:1px solid rgba(233,251,248,.14);padding:12px 14px;display:flex;flex-direction:column;gap:8px}
.rt-row{display:flex;align-items:center;gap:10px;min-height:32px;font-size:15px;line-height:1.3}
.rt-row b{color:${TEAL};font-variant-numeric:tabular-nums}
.rt-acc{all:unset;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:44px;cursor:pointer;font-size:15px;font-weight:600}
.rt-acc:focus-visible,.rt-cta:focus-visible,.rt-ghost:focus-visible{outline:3px solid ${TEAL};outline-offset:2px}
.rt-chev{transition:transform .25s}
.rt-chev[data-open="true"]{transform:rotate(180deg)}
.rt-list{margin:0;padding:0 0 4px 0;list-style:none;display:flex;flex-direction:column;gap:6px;font-size:14px;color:rgba(233,251,248,.9)}
.rt-bonus{position:relative;border-radius:18px;padding:16px 16px 16px 18px;background:linear-gradient(135deg,rgba(77,240,220,.22),rgba(11,111,104,.32));
  border:1px solid ${TEAL};box-shadow:0 0 28px rgba(77,240,220,.25);display:flex;flex-direction:column;gap:8px}
.rt-badge{align-self:flex-start;display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:${TEAL};color:#03211F;font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase}
.rt-bonus p{margin:0;font-size:16px;line-height:1.4;font-weight:600}
.rt-close{margin:0;text-align:center;font-size:18px;font-weight:800;line-height:1.3}
.rt-cta{all:unset;box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:54px;cursor:pointer;border-radius:16px;
  background:linear-gradient(180deg,#7DF7E8,#2FD9C4);color:#03211F;font-size:18px;font-weight:800;box-shadow:0 0 24px rgba(77,240,220,.5),0 4px 0 #0B6F68;animation:rt-glow 2.2s ease-in-out infinite}
@keyframes rt-glow{0%,100%{box-shadow:0 0 18px rgba(77,240,220,.4),0 4px 0 #0B6F68}50%{box-shadow:0 0 34px rgba(77,240,220,.75),0 4px 0 #0B6F68}}
.rt-cta:active{transform:translateY(2px)}
.rt-evo{position:fixed;inset:0;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:24px;cursor:pointer}
.rt-evo-stage{position:relative;display:flex;flex-direction:column;align-items:center;gap:14px}
.rt-bubble{position:relative;max-width:300px;padding:12px 16px;border-radius:18px;background:#F1FFFC;color:#04211F;font-size:18px;font-weight:800;text-align:center;line-height:1.25}
.rt-bubble:after{content:"";position:absolute;left:50%;bottom:-9px;margin-left:-9px;width:18px;height:18px;background:#F1FFFC;transform:rotate(45deg)}
.rt-evo .rt-pet{height:168px}
.rt-flash{position:absolute;inset:-60px;pointer-events:none;border-radius:50%;opacity:0;background:radial-gradient(circle,#fff 0%,rgba(190,255,247,.95) 28%,rgba(77,240,220,.5) 58%,rgba(77,240,220,0) 75%)}
.rt-flash[data-on="true"]{animation:rt-flashA .7s ease-out both}
@keyframes rt-flashA{0%{opacity:0;transform:scale(.5)}35%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.5)}}
.rt-hint{margin:0;font-size:14px;color:rgba(233,251,248,.75);text-align:center}
@media (prefers-reduced-motion: reduce){
 .rt-in,.rt-flame,.rt-halo,.rt-pet,.rt-cta{animation:none!important}
 .rt-spark{display:none}
 .rt-flash[data-on="true"]{animation:none!important;opacity:0}
 .rt-chev{transition:none}
}
`;

/** Contador que sobe até `to`; com movimento reduzido já nasce no valor final. */
function CountUp({ to, reduced, delay = 0 }: { to: number; reduced: boolean; delay?: number }) {
  const [v, setV] = useState(reduced ? to : 0);
  useEffect(() => {
    if (reduced || to <= 0) { setV(to); return; }
    let raf = 0;
    let start = 0;
    const t0 = window.setTimeout(() => {
      const tick = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min(1, (ts - start) / 1000);
        setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => { window.clearTimeout(t0); cancelAnimationFrame(raf); };
  }, [to, reduced, delay]);
  return <>{v}</>;
}

/** A chama da alma: sempre turquesa. */
function SoulFlame() {
  return (
    <svg className="rt-flame" viewBox="0 0 100 126" aria-hidden="true">
      <defs>
        <linearGradient id="rtF1" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#0B6F68" />
          <stop offset=".55" stopColor="#19C9B8" />
          <stop offset="1" stopColor="#9DFFF0" />
        </linearGradient>
        <linearGradient id="rtF2" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#4DF0DC" />
          <stop offset="1" stopColor="#F1FFFC" />
        </linearGradient>
      </defs>
      <path d="M50 4C54 26 82 42 82 78c0 26-15 44-32 44S18 104 18 78c0-18 9-28 17-38 2 10 7 15 12 17-4-18-2-38 3-53z" fill="url(#rtF1)" />
      <path d="M50 48c3 14 20 24 20 46 0 15-9 25-20 25s-20-10-20-25c0-12 6-18 11-25 1 6 4 9 8 10-2-11-1-22 1-31z" fill="url(#rtF2)" opacity=".92" />
    </svg>
  );
}

const SPARKS = [
  { l: '38%', sx: '-18px', sd: '0s' }, { l: '46%', sx: '10px', sd: '.5s' }, { l: '54%', sx: '-8px', sd: '1.1s' },
  { l: '62%', sx: '20px', sd: '1.6s' }, { l: '42%', sx: '14px', sd: '2.1s' }, { l: '58%', sx: '-20px', sd: '2.6s' },
];

export function WeeklyRetroModal({ language, retro, spriteNow, spritePrev, petName, onClose }: WeeklyRetroModalProps) {
  const isPt = language === 'pt-BR';
  const reduced = usePrefersReducedMotion();
  const [step, setStep] = useState<'evo' | 'main'>(spritePrev ? 'evo' : 'main');
  const [evoPhase, setEvoPhase] = useState<'before' | 'after'>('before');
  const [flash, setFlash] = useState(false);
  const [open, setOpen] = useState(false); // accordion: fechado por padrão
  const ctaRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  useEffect(() => { if (step === 'main') ctaRef.current?.focus({ preventScroll: true }); }, [step]);

  const tapEvo = () => {
    if (evoPhase !== 'before' || flash) return;
    if (reduced) { setEvoPhase('after'); return; }
    setFlash(true);
    // A troca acontece no pico do brilho.
    timer.current = window.setTimeout(() => setEvoPhase('after'), 280);
    window.setTimeout(() => setFlash(false), 700);
  };

  const times = (n: number) => (isPt ? (n === 1 ? '1 vez' : `${n} vezes`) : (n === 1 ? '1 time' : `${n} times`));
  const d = (s: number) => ({ '--d': reduced ? '0s' : `${s}s` } as React.CSSProperties);
  const hardest = retro.hardest;

  const evo = step === 'evo' && spritePrev && (
    <div className="rt-evo" onClick={evoPhase === 'before' ? tapEvo : undefined} role="presentation">
      <p className="rt-kicker">{isPt ? 'Retrospectiva da semana' : 'Week in review'}</p>
      <div className="rt-evo-stage">
        <div className="rt-bubble">{isPt ? 'Essa semana eu evoluí!' : 'I evolved this week!'}</div>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <div className="rt-flash" data-on={flash} aria-hidden="true" />
          <img className="rt-pet" src={evoPhase === 'before' ? spritePrev : spriteNow} alt={petName ?? (isPt ? 'Seu Soulmon' : 'Your Soulmon')} />
        </div>
      </div>
      {evoPhase === 'before' ? (
        <button type="button" className="rt-ghost" onClick={tapEvo}
          style={{ all: 'unset', cursor: 'pointer', minHeight: 44, color: TEAL, fontWeight: 700, fontSize: 15 }}>
          {isPt ? 'Toque para ver' : 'Tap to see'}
        </button>
      ) : (
        <button type="button" className="rt-cta" style={{ maxWidth: 320 }} onClick={() => setStep('main')} autoFocus>
          {isPt ? 'Continuar' : 'Continue'}
        </button>
      )}
    </div>
  );

  const body = (
    <div className="rt-root" role="dialog" aria-modal="true" aria-label={isPt ? 'Retrospectiva da semana' : 'Week in review'}>
      <style>{CSS}</style>
      {evo}
      {step === 'main' && (
        <div className="rt-col">
          <p className="rt-kicker rt-in" style={d(0)}>{isPt ? 'Retrospectiva da semana' : 'Week in review'}</p>
          <div className="rt-hero rt-in" style={d(0.1)}>
            <div className="rt-halo" aria-hidden="true" />
            <SoulFlame />
            {SPARKS.map((s, i) => (
              <span key={i} className="rt-spark" aria-hidden="true" style={{ left: s.l, '--sx': s.sx, '--sd': s.sd } as React.CSSProperties} />
            ))}
            <img className="rt-pet" src={spriteNow} alt={petName ?? (isPt ? 'Seu Soulmon' : 'Your Soulmon')} />
          </div>
          <h2 className="rt-title rt-in" style={d(0.3)}>{isPt ? 'Que semana!' : 'What a week!'}</h2>
          <p className="rt-sub rt-in" style={d(0.4)}>
            {isPt ? 'Olha o que a sua chama fez.' : 'Look at what your flame did.'}
          </p>

          <div className="rt-stats rt-in" style={d(0.55)}>
            <div className="rt-stat">
              <span className="rt-num"><CountUp to={retro.totalHabitDone} reduced={reduced} delay={650} /></span>
              <span className="rt-lab">{isPt ? 'vezes em hábitos' : 'habit check-ins'}</span>
            </div>
            <div className="rt-stat">
              <span className="rt-num"><CountUp to={retro.tasksDone} reduced={reduced} delay={800} /></span>
              <span className="rt-lab">{isPt ? (retro.tasksDone === 1 ? 'tarefa pontual' : 'tarefas pontuais') : (retro.tasksDone === 1 ? 'one-off task' : 'one-off tasks')}</span>
            </div>
          </div>

          {retro.habits.length > 0 && (
            <ul className="rt-card rt-in" style={{ ...d(0.75), listStyle: 'none', margin: 0 }}>
              {retro.habits.map(h => (
                <li key={h.id} className="rt-row">
                  <Icon name="event_repeat" size={20} tone="inherit" />
                  <span style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
                    {isPt ? `Você fez ${h.name} ` : `You did ${h.name} `}<b>{times(h.done)}</b>
                  </span>
                </li>
              ))}
            </ul>
          )}

          {retro.tasksDone > 0 && (
            <div className="rt-card rt-in" style={d(0.9)}>
              <button type="button" className="rt-acc" aria-expanded={open} aria-controls="rt-tasks" onClick={() => setOpen(o => !o)}>
                <span>
                  {isPt ? `Você concluiu ${retro.tasksDone} ${retro.tasksDone === 1 ? 'tarefa pontual' : 'tarefas pontuais'}`
                    : `You finished ${retro.tasksDone} one-off ${retro.tasksDone === 1 ? 'task' : 'tasks'}`}
                </span>
                <span className="rt-chev" data-open={open}><Icon name="expand_more" size={24} tone="inherit" /></span>
              </button>
              {open && (
                <ul id="rt-tasks" className="rt-list">
                  {retro.tasks.map(t => (
                    <li key={t.id} className="rt-row" style={{ minHeight: 28 }}>
                      <Icon name="task_alt" size={18} tone="inherit" />
                      <span style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{t.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {hardest && (
            <div className="rt-bonus rt-in" style={d(1.05)} data-weekly-bonus>
              <span className="rt-badge"><Icon name="bolt" size={16} fill={1} tone="inherit" />{isPt ? 'Bônus da semana' : 'Week bonus'}</span>
              <p>
                {isPt
                  ? `Você teve mais dificuldade em ${hardest.name}. Vamos dar um bônus nela para te incentivar esta semana.`
                  : `You had a harder time with ${hardest.name}. Let's put a bonus on it to cheer you on this week.`}
              </p>
            </div>
          )}

          <p className="rt-close rt-in" style={d(1.2)}>
            {isPt ? 'Nova semana, a chama já está acesa.' : 'New week, the flame is already lit.'}
          </p>
          <button ref={ctaRef} type="button" className="rt-cta rt-in" style={d(1.3)} onClick={onClose}>
            {isPt ? 'Bora para a semana' : "Let's go, new week"}
          </button>
        </div>
      )}
    </div>
  );

  return typeof document === 'undefined' ? body : createPortal(body, document.body);
}

export default WeeklyRetroModal;
