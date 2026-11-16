/**
 * RETROSPECTIVA DA SEMANA (segunda-feira) — o modal que celebra e convida (pedido do dono, 16/11/2026).
 *
 * Peso especial: não é uma folha comum. CELEBRA o que a pessoa fez e ENGAJA para a semana que
 * começa. Peça central: a CHAMA DA ALMA em turquesa (nunca laranja ou vermelha) dentro de um CRISTAL (v3, ilustração lisa), com o Soulmon
 * do próprio usuário ao lado. A chama é a folha animada `ui/SoulFlameAnim`; o selo é webp com alfa real; com `prefers-reduced-motion` as
 * entradas, partículas, brilho e contadores viram o estado final direto.
 *
 * Layout (redo de 16/11, críticas do dono): UM card liso (sem `border-image`, nada esticado) e a chama como ARTE PELADA no topo,
 * centrada, METADE DENTRO e METADE FORA da borda de cima (o mesmo recurso do `TicketBuyModal`/`ShopItemSheet`); o Soulmon fica
 * por baixo da chama, inteiro, sem ninguém por cima. O botão é o `CtaButton` tom `acao` (o mesmo do site e de "Criar poção elemental").
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
import { retroQuality, type RetroQuality, type WeeklyRetro } from '../utils/weeklyRetro';
import { CtaButton } from './ui/CtaButton';
import { Icon } from './ui/Icon';
import { SoulFlameAnim } from './ui/SoulFlameAnim';
import selo from '../assets/soulmon/chama-alma/selo-bonus.webp';
import { usePrefersReducedMotion } from './ui/Viewport';
import { useDialogA11y } from '../hooks/useDialogA11y';

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

/** Altura da caixa do cristal (o quadro da folha: o cristal visível ocupa de 12,5% a 87,5% da altura, centrado). */
const FLAME_H = 260;
/** Onde está o centro do cristal VISÍVEL dentro da caixa: é ele que fica na borda do card (metade dentro, metade fora). */
const FLAME_CENTER = Math.round(FLAME_H * 0.5);
/** Quanto do cristal visível fica DENTRO do card (a metade de baixo). */
const FLAME_INSIDE = Math.round(FLAME_H * 0.375);

const CSS = `
.rt-root{position:fixed;top:0;right:0;bottom:0;left:0;height:100vh;height:100dvh;z-index:240;display:flex;flex-direction:column;overflow:hidden;
  background:rgba(2,16,15,.7);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);color:${INK};box-sizing:border-box}
.rt-scroll{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;
  padding:max(20px,env(safe-area-inset-top)) 16px 20px;box-sizing:border-box}
.rt-wrap{width:100%;max-width:440px;margin:0 auto;padding-top:${Math.round(FLAME_H * 0.4)}px}
.rt-card{position:relative;box-sizing:border-box;border-radius:var(--sm2-radius-lg,20px);background:linear-gradient(180deg,rgba(15,42,41,.94),rgba(9,31,30,.96));
  border:1px solid rgba(77,240,220,.4);box-shadow:0 0 0 1px rgba(0,0,0,.25),0 0 36px rgba(77,240,220,.18),0 14px 30px rgba(0,0,0,.4);
  padding:${FLAME_INSIDE + 10}px 16px 20px;display:flex;flex-direction:column;gap:16px}
.rt-art{position:absolute;left:50%;top:0;width:${FLAME_H}px;height:${FLAME_H}px;margin-left:-${FLAME_H / 2}px;margin-top:-${FLAME_CENTER}px;pointer-events:none}
.rt-seal{width:44px;height:44px;flex:none;image-rendering:pixelated;filter:drop-shadow(0 0 8px rgba(77,240,220,.55))}
.rt-dock{flex:none;padding:10px 16px max(12px,env(safe-area-inset-bottom));background:rgba(2,16,15,.55);border-top:1px solid rgba(77,240,220,.18)}
.rt-dock-in{max-width:440px;margin:0 auto}
.rt-bonus-head{display:flex;align-items:center;gap:10px}
.rt-in{animation:rt-up .6s cubic-bezier(.2,.8,.2,1) both;animation-delay:var(--d,0s)}
@keyframes rt-up{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}
.rt-hero{display:flex;align-items:center;justify-content:center;gap:14px;padding-top:2px}
.rt-hero-text{display:flex;flex-direction:column;align-items:flex-start;gap:6px;min-width:0;flex:0 1 auto;text-align:left}
.rt-hero .rt-pet{height:112px;flex:none}
@media (min-width:400px){.rt-hero .rt-pet{height:128px}}
.rt-flame{position:absolute;left:0;top:0;filter:drop-shadow(0 0 14px rgba(77,240,220,.55)) drop-shadow(0 0 34px rgba(77,240,220,.35))}
.rt-halo{position:absolute;left:50%;top:50%;width:${FLAME_H * 1.5}px;height:${FLAME_H * 1.5}px;margin:-${FLAME_H * 0.75}px 0 0 -${FLAME_H * 0.75}px;border-radius:50%;
  background:radial-gradient(circle,rgba(77,240,220,.34),rgba(77,240,220,0) 66%);animation:rt-pulse 3s ease-in-out infinite}
@keyframes rt-pulse{0%,100%{opacity:.7;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}
.rt-pet{position:relative;height:128px;width:auto;image-rendering:pixelated;filter:drop-shadow(0 6px 10px rgba(0,0,0,.45));animation:rt-bob 3s ease-in-out infinite}
@keyframes rt-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.rt-title{margin:0;text-align:left;font-size:24px;line-height:1.15;font-weight:800;letter-spacing:.01em}
.rt-kicker{margin:0;text-align:left;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${TEAL}}
.rt-sub{margin:0;text-align:left;font-size:15px;line-height:1.4;color:rgba(233,251,248,.82)}
.rt-stats{display:flex;gap:10px}
.rt-stat{flex:1;min-width:0;text-align:center;padding:14px 8px;border-radius:16px;background:rgba(77,240,220,.09);border:1px solid rgba(77,240,220,.28)}
.rt-num{display:block;font-size:38px;line-height:1;font-weight:800;color:${TEAL};font-variant-numeric:tabular-nums;text-shadow:0 0 16px rgba(77,240,220,.5)}
.rt-lab{display:block;margin-top:6px;font-size:13px;line-height:1.25;color:rgba(233,251,248,.85)}
.rt-box{border-radius:16px;background:rgba(255,255,255,.06);border:1px solid rgba(233,251,248,.14);padding:12px 14px;display:flex;flex-direction:column;gap:8px}
.rt-row{display:flex;align-items:center;gap:10px;min-height:32px;font-size:15px;line-height:1.3}
.rt-row b{color:${TEAL};font-variant-numeric:tabular-nums}
.rt-acc{all:unset;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:44px;cursor:pointer;font-size:15px;font-weight:600}
.rt-ghost{all:unset;box-sizing:border-box;cursor:pointer;min-height:44px;display:flex;align-items:center;padding:0 12px;color:${TEAL};font-weight:700;font-size:15px}
.rt-acc:focus-visible,.rt-ghost:focus-visible{outline:3px solid ${TEAL};outline-offset:2px}
.rt-chev{transition:transform .25s}
.rt-chev[data-open="true"]{transform:rotate(180deg)}
.rt-list[hidden]{display:none}
.rt-list{margin:0;padding:0 0 4px 0;list-style:none;display:flex;flex-direction:column;gap:6px;font-size:14px;color:rgba(233,251,248,.9)}
.rt-bonus{position:relative;border-radius:18px;padding:16px 16px 16px 18px;background:linear-gradient(135deg,rgba(77,240,220,.22),rgba(11,111,104,.32));
  border:1px solid ${TEAL};box-shadow:0 0 28px rgba(77,240,220,.25);display:flex;flex-direction:column;gap:8px}
.rt-badge{align-self:flex-start;display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:${TEAL};color:#03211F;font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase}
.rt-bonus p{margin:0;font-size:16px;line-height:1.4;font-weight:600}
.rt-close{margin:0;text-align:center;font-size:18px;font-weight:800;line-height:1.3}
.rt-evo{position:fixed;inset:0;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:24px;cursor:pointer}
.rt-evo-stage{position:relative;display:flex;flex-direction:column;align-items:center;gap:14px}
.rt-bubble{position:relative;max-width:300px;padding:12px 16px;border-radius:18px;background:#F1FFFC;color:#04211F;font-size:18px;font-weight:800;text-align:center;line-height:1.25}
.rt-bubble:after{content:"";position:absolute;left:50%;bottom:-9px;margin-left:-9px;width:18px;height:18px;background:#F1FFFC;transform:rotate(45deg)}
.rt-evo .rt-pet{height:168px}
.rt-evo .rt-kicker{text-align:center}
.rt-flash{position:absolute;inset:-60px;pointer-events:none;border-radius:50%;opacity:0;background:radial-gradient(circle,#fff 0%,rgba(190,255,247,.95) 28%,rgba(77,240,220,.5) 58%,rgba(77,240,220,0) 75%)}
.rt-flash[data-on="true"]{animation:rt-flashA .7s ease-out both}
@keyframes rt-flashA{0%{opacity:0;transform:scale(.5)}35%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.5)}}
.rt-hint{margin:0;font-size:14px;color:rgba(233,251,248,.75);text-align:center}
@media (prefers-reduced-motion: reduce){
 .rt-in,.rt-halo,.rt-pet{animation:none!important}
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

/** Título e subtítulo por qualidade da semana (critério em `retroQuality`). Sem travessão longo. */
const HEAD: Record<RetroQuality, { pt: [string, string]; en: [string, string] }> = {
  good: {
    pt: ['A gente arrebentou!', 'Que semana, parabéns. Olha o que a sua chama fez.'],
    en: ['We crushed it!', 'What a week, congrats. Look at what your flame did.'],
  },
  medium: {
    pt: ['Boa semana, e dá para mais', 'Você manteve a chama acesa. Nesta semana dá para ir um pouco além.'],
    en: ['A solid week, with room for more', 'You kept the flame lit. This week we can go a little further.'],
  },
  bad: {
    pt: ['Essa semana a gente vai conseguir.', 'Uma semana nova começa agora. Escolha um hábito e comece por ele.'],
    en: ["This week we'll get there.", 'A new week starts now. Pick one habit and start with it.'],
  },
};
/** Duração do preenchimento do botão (toque único) até fechar o modal. */
export const RETRO_FILL_MS = 1200;


/**
 * INSTÂNCIA ÚNICA: dois modais da retrospectiva abertos ao mesmo tempo travavam o de cima (sem scroll, CTA mudo; relato do dono, 16/11/2026).
 * Quem chega primeiro vira o dono; uma segunda montagem (remontagem do App, efeito duplo, outro ponto de render) não desenha nada.
 */
let retroOwner: symbol | null = null;

export function WeeklyRetroModal(props: WeeklyRetroModalProps) {
  const id = useRef<symbol>(Symbol('retro'));
  const [mine, setMine] = useState(false);
  useEffect(() => {
    if (retroOwner !== null && retroOwner !== id.current) return;
    retroOwner = id.current;
    setMine(true);
    return () => { if (retroOwner === id.current) retroOwner = null; setMine(false); };
  }, []);
  return mine ? <WeeklyRetroDialog {...props} /> : null;
}

function WeeklyRetroDialog({ language, retro, spriteNow, spritePrev, petName, onClose }: WeeklyRetroModalProps) {
  const isPt = language === 'pt-BR';
  const reduced = usePrefersReducedMotion();
  const [step, setStep] = useState<'evo' | 'main'>(spritePrev ? 'evo' : 'main');
  const [evoPhase, setEvoPhase] = useState<'before' | 'after'>('before');
  const [flash, setFlash] = useState(false);
  const [open, setOpen] = useState(false); // accordion: fechado por padrão
  const ctaRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const timer2 = useRef<number | undefined>(undefined);

  useEffect(() => () => { window.clearTimeout(timer.current); window.clearTimeout(timer2.current); }, []);
  const dialogRef = useDialogA11y<HTMLDivElement>(true, onClose);
  useEffect(() => { if (step === 'main') ctaRef.current?.focus({ preventScroll: true }); }, [step]);

  const tapEvo = () => {
    if (evoPhase !== 'before' || flash) return;
    if (reduced) { setEvoPhase('after'); return; }
    setFlash(true);
    // A troca acontece no pico do brilho.
    timer.current = window.setTimeout(() => setEvoPhase('after'), 280);
    timer2.current = window.setTimeout(() => setFlash(false), 700);
  };

  const times = (n: number) => (isPt ? (n === 1 ? '1 vez' : `${n} vezes`) : (n === 1 ? '1 time' : `${n} times`));
  const d = (s: number) => ({ '--d': reduced ? '0s' : `${s}s` } as React.CSSProperties);
  const hardest = retro.hardest;
  const quality = retroQuality(retro);
  const [title, subtitle] = isPt ? HEAD[quality].pt : HEAD[quality].en;
  const n1 = (n: number, one: string, many: string) => (n === 1 ? one : many);

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
        <button type="button" className="rt-ghost" onClick={tapEvo}>
          {isPt ? 'Toque para ver' : 'Tap to see'}
        </button>
      ) : (
        <CtaButton tone="acao" width="auto" onClick={() => setStep('main')} autoFocus>
          {isPt ? 'Continuar' : 'Continue'}
        </CtaButton>
      )}
    </div>
  );

  const body = (
    <div ref={dialogRef} className="rt-root" role="dialog" aria-modal="true" data-dialog-top data-retro-dialog aria-label={isPt ? 'Retrospectiva da semana' : 'Week in review'}>
      <style>{CSS}</style>
      {evo}
      {step === 'main' && (
        <>
        <div className="rt-scroll" data-retro-scroll>
        <div className="rt-wrap" data-retro-card-wrap>
        <div className="rt-card" data-retro-card>
          <div className="rt-art rt-in" aria-hidden="true" data-retro-flame-art style={d(0.1)}>
            <div className="rt-halo" />
            <SoulFlameAnim className="rt-flame" height={FLAME_H} cycleSeconds={1.6} />
          </div>
          <div className="rt-hero rt-in" style={d(0.2)} data-retro-hero data-retro-quality={quality}>
            <img className="rt-pet" src={spriteNow} alt={petName ?? (isPt ? 'Seu Soulmon' : 'Your Soulmon')} />
            <div className="rt-hero-text">
              <p className="rt-kicker">{isPt ? 'Retrospectiva da semana' : 'Week in review'}</p>
              <h2 className="rt-title">{title}</h2>
              <p className="rt-sub">{subtitle}</p>
            </div>
          </div>

          <div className="rt-stats rt-in" style={d(0.55)}>
            <div className="rt-stat">
              <span className="rt-num"><CountUp to={retro.totalHabitDone} reduced={reduced} delay={650} /></span>
              <span className="rt-lab">{isPt ? n1(retro.totalHabitDone, 'hábito cumprido', 'hábitos cumpridos') : n1(retro.totalHabitDone, 'habit completed', 'habits completed')}</span>
            </div>
            <div className="rt-stat">
              <span className="rt-num"><CountUp to={retro.tasksDone} reduced={reduced} delay={800} /></span>
              <span className="rt-lab">{isPt ? n1(retro.tasksDone, 'tarefa pontual', 'tarefas pontuais') : n1(retro.tasksDone, 'one-off task', 'one-off tasks')}</span>
            </div>
          </div>

          {retro.habits.length > 0 && (
            <ul className="rt-box rt-in" style={{ ...d(0.75), listStyle: 'none', margin: 0 }}>
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
            <div className="rt-box rt-in" style={d(0.9)}>
              <button type="button" className="rt-acc" aria-expanded={open} aria-controls="rt-tasks" onClick={() => setOpen(o => !o)}>
                <span>
                  {isPt ? `Você concluiu ${retro.tasksDone} ${retro.tasksDone === 1 ? 'tarefa pontual' : 'tarefas pontuais'}`
                    : `You finished ${retro.tasksDone} one-off ${retro.tasksDone === 1 ? 'task' : 'tasks'}`}
                </span>
                <span className="rt-chev" data-open={open}><Icon name="expand_more" size={24} tone="inherit" /></span>
              </button>
              {(
                <ul id="rt-tasks" className="rt-list" hidden={!open}>
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
              <div className="rt-bonus-head">
                <span className="rt-seal" data-bonus-seal aria-hidden="true" style={{ backgroundImage: `url(${selo})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat' }} />
                <span className="rt-badge"><Icon name="bolt" size={16} fill={1} tone="inherit" />{isPt ? 'Bônus da semana' : 'Week bonus'}</span>
              </div>
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
        </div>
        </div>
        </div>
        <div className="rt-dock" data-retro-dock>
          <div className="rt-dock-in">
            <CtaButton ref={ctaRef} tone="acao" className="rt-in" style={d(1.3)} fillMs={RETRO_FILL_MS} onFillComplete={onClose}>
              {isPt ? 'Vamos começar a semana' : "Let's start the week"}
            </CtaButton>
          </div>
        </div>
        </>
      )}
    </div>
  );

  return typeof document === 'undefined' ? body : createPortal(body, document.body);
}

export default WeeklyRetroModal;
