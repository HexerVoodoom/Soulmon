/**
 * RESULTADO PADRÃO — "Proposta D" (dono, 27/10/2026; `product/resultado-padrao/PROPOSTAS.md`).
 *
 * UMA tela de fim de partida para todo minijogo: visor com o Soulmon reagindo ao desfecho (alegre / calmo / cansado),
 * título Cinzel + frase calorosa, UMA métrica-herói (32 px), faixa opcional (placar / melhor / faixa), livro "Ganhou"
 * com uma moeda por linha, e um dock fixo (jogar de novo + sair). Revelação em degraus (~2,6 s) com toque para pular;
 * `prefers-reduced-motion` = estado final no primeiro quadro. Mudo: nenhum som novo (R-NOVA); nenhuma regra de jogo.
 *
 * Quem chama passa os DADOS já calculados; este arquivo não sabe regra de recompensa nem de recorde.
 * Texto vem pronto (EN/PT-BR escolhido pelo chamador via `language === 'pt-BR'`).
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { GameVisor, VisorSprite, VisorSparks } from './GameKit';
import { BitsAmount } from '../ui/BitsAmount';
import { sm2Button, sm2Hint } from '../form/FormKit';
import { CURRENCIES, emblemStyle } from '../../utils/currencies';
import type { Language } from '../../utils/i18n';

/** Desfecho visual: `record` = pico, `win` = alegria, `calm` = fim neutro, `tired` = sem vitória (acolhedor, nunca luto). */
export type ResultOutcome = 'win' | 'record' | 'calm' | 'tired';

export interface ResultHero {
  /** Rótulo de 12 px acima do número ("Score", "Layer", "Time"). */
  label: string;
  /** Número (conta de 0 ao valor) ou texto pronto (tempo "0:42.1"). */
  value: number | string;
}

export interface ResultStripCell {
  key: string;
  label: string;
  value: ReactNode;
  /** Some numa corrida de recorde (a célula "Melhor" não pode contradizer o herói). */
  hideOnRecord?: boolean;
}

export type ResultLedgerRow =
  | { key: string; kind: 'bits'; value: number }
  | { key: string; kind: 'honor'; value: number }
  | { key: string; kind: 'item'; label: string; amount?: number; icon?: string }
  | { key: string; kind: 'node'; label: string; node: ReactNode }
  | { key: string; kind: 'text'; label: string };

export interface ResultScreenProps {
  language: Language;
  outcome: ResultOutcome;
  /** Nome do jogo, na barra (sem seta de voltar). */
  gameName: string;
  title: string;
  line?: string;
  hero?: ResultHero;
  /** Texto do selo dourado (só `record`). */
  recordNote?: string;
  strip?: ResultStripCell[];
  /** Livro "Ganhou". Linhas `bits`/`honor` com valor 0 são ignoradas. */
  ledger?: ResultLedgerRow[];
  /** Mostrada no lugar do livro quando nada foi ganho ("Rodada leve, sem Bits desta vez."). */
  emptyLedgerLine?: string;
  /** Rótulo da seção do livro (padrão "Earned" / "Ganhou"). */
  ledgerLabel?: string;
  /** Linhas de apoio (stats secundárias, teto diário, "Recuperando…"): depois do livro, no fim da revelação. */
  notes?: ReactNode;
  /** Sprite do pet no visor (omitido = visor só com a cena). */
  petSrc?: string;
  /** `background` da cena do visor. */
  scene?: string;
  /** Ações. `onPlayAgain` ausente = só o botão de sair. */
  playAgainLabel?: string;
  onPlayAgain?: () => void;
  /** Sem `onHome` não há botão de sair (o Torneio tem uma ação só: "Continuar"). */
  homeLabel?: string;
  onHome?: () => void;
  /** Modo `dialog`: Escape chama isto. */
  onDismiss?: () => void;
  /** `RankingPanel` etc.: abaixo do conteúdo, dentro da rolagem, sempre montado (ele envia a pontuação ao montar). */
  below?: ReactNode;
  /** `dialog` = o Torneio (role=dialog); `page` = painel que ocupa a tela. */
  mode?: 'page' | 'dialog';
  /** Jogo curto (30 s): revelação mais rápida. */
  quick?: boolean;
  /** Força o estado final (teste/inspeção). */
  instant?: boolean;
  testId?: string;
  /** Ganchos `data-*` da tela antiga que os testes e o QA ainda leem (raiz, linha de frase, botão primário). */
  rootAttrs?: DataAttrs;
  lineAttrs?: DataAttrs;
  againAttrs?: DataAttrs;
}

type DataAttrs = Record<string, string | number | boolean | undefined>;

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Tempo de solução como m:ss.d (0:42.1) para o herói dos jogos por tempo (menor é melhor). */
export const formatResultTime = (ms: number): string => {
  const t = Math.floor(ms / 100) / 10;
  const m = Math.floor(t / 60);
  return `${m}:${(t - m * 60).toFixed(1).padStart(4, '0')}`;
};

/** Degraus: 0 faixa de título · 1 herói · 2 selo · 3 faixa · 4..6 linhas do livro · 7 fim. */
export const RESULT_FINAL_STEP = 7;

/**
 * O cronograma da revelação. Reduced motion / `instant` = degrau final no 1º quadro.
 * Com recorde o selo espera 1150 ms (o pet pula antes); sem recorde tudo aperta (~1,9 s).
 */
export function useResultReveal(opts: { record: boolean; quick: boolean; instant: boolean }): { step: number; skip: () => void; animated: boolean } {
  const [reduced] = useState(() => opts.instant || prefersReducedMotion());
  const [step, setStep] = useState(reduced ? RESULT_FINAL_STEP : 0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    if (reduced) return;
    const k = opts.quick ? 0.55 : 1;
    const times = (opts.record ? [300, 1150, 1500, 1750, 2000, 2250, 2500] : [300, 300, 900, 1150, 1400, 1650, 1900]).map(t => Math.round(t * k));
    timers.current = times.map((t, i) => setTimeout(() => setStep(i + 1), t));
    return () => { timers.current.forEach(clearTimeout); timers.current = []; };
    // O cronograma nasce uma vez por montagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const skip = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setStep(RESULT_FINAL_STEP);
  }, []);
  return { step, skip, animated: !reduced && step < RESULT_FINAL_STEP };
}

/** Conta de 0 ao valor em `ms` (ease-out cúbico). Sem `active`, devolve o valor final. */
function useCount(value: number, active: boolean, ms: number): number {
  const [n, setN] = useState(active ? 0 : value);
  useEffect(() => {
    if (!active) { setN(value); return; }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, value, ms]);
  return n;
}

function HeroNumber({ value, active }: { value: number; active: boolean }) {
  return <>{useCount(value, active, 800)}</>;
}

/** 7+ dígitos cai para 24 px (nunca abaixo, nunca abreviar). */
const heroSize = (v: number | string): string => (String(v).replace(/\D/g, '').length >= 7 ? 'var(--sm2-text-xl)' : 'var(--sm2-text-2xl)');

const MOOD: Record<ResultOutcome, string> = { record: 'happy', win: 'happy', calm: 'calm', tired: 'tired' };
const MOOD_CLASS: Record<string, string> = { happy: 'sm-result-visor--happy', calm: 'sm-result-visor--calm', tired: 'sm-result-visor--tired' };

export function ResultScreen(p: ResultScreenProps) {
  const isPt = p.language === 'pt-BR';
  const record = p.outcome === 'record';
  const mode = p.mode ?? 'page';
  const { step, skip, animated } = useResultReveal({ record, quick: !!p.quick, instant: !!p.instant });
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [summary, setSummary] = useState('');

  const ledger = (p.ledger ?? []).filter(r => !((r.kind === 'bits' || r.kind === 'honor') && r.value <= 0));
  const strip = (p.strip ?? []).filter(c => !(record && c.hideOnRecord));
  const honorName = CURRENCIES.emblems.name[isPt ? 'pt' : 'en'];

  const summaryText = [
    p.title, p.line,
    p.hero ? `${p.hero.label}: ${p.hero.value}` : '',
    record ? p.recordNote : '',
    ...ledger.map(r => r.kind === 'bits' ? `${r.value} Bits` : r.kind === 'honor' ? `+${r.value} ${honorName}` : r.kind === 'item' ? `${r.label}${r.amount ? ` ×${r.amount}` : ''}` : r.label),
    ledger.length === 0 ? p.emptyLedgerLine : '',
  ].filter(Boolean).join('. ');

  // A região viva existe vazia desde a montagem e recebe o resumo logo depois (leitor de tela só anuncia mudança).
  useEffect(() => {
    const id = setTimeout(() => setSummary(summaryText), 150);
    return () => clearTimeout(id);
  }, [summaryText]);
  useEffect(() => { titleRef.current?.focus({ preventScroll: true }); }, []);
  const dismissRef = useRef(p.onDismiss);
  dismissRef.current = p.onDismiss;
  useEffect(() => {
    if (mode !== 'dialog') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismissRef.current?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode]);

  const stageCls = (n: number) => `sm-result-in${step >= n ? ' sm-result-in--on' : ''}`;

  const onSkipTap = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input, [data-result-noskip]')) return;
    if (step < RESULT_FINAL_STEP) skip();
  };

  const rootProps = mode === 'dialog' ? { role: 'dialog' as const, 'aria-modal': true as const, 'aria-label': p.title } : {};
  const mood = MOOD[p.outcome];
  const rowStep = (i: number) => 4 + Math.min(i, 2);

  return (
    <div
      data-result-screen
      data-result-outcome={p.outcome}
      data-result-step={step}
      data-testid={p.testId}
      onClick={onSkipTap}
      {...rootProps}
      {...p.rootAttrs}
      style={{
        position: 'fixed', inset: 0, zIndex: 110, display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
        backgroundColor: 'var(--sm2-bg)', color: 'var(--sm2-ink)', fontFamily: 'var(--sm2-font-text)',
      }}
    >
      {/* Região viva ANTES do conteúdo: o resumo único e final. */}
      <div role="status" aria-live="polite" className="sm2-sr-only" data-result-live>{summary}</div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '12px 16px 16px' }}>
        <p style={{ ...sm2Hint, textAlign: 'center' }} data-result-game>{p.gameName}</p>

        <div className={`sm-result-visor ${MOOD_CLASS[mood]}${record ? ' sm-result-visor--record' : ''}${animated ? ' sm-result-visor--live' : ''}`} aria-hidden="true">
          <GameVisor height={84} scene={p.scene}>
            {p.petSrc && (
              <div className="sm-result-pet" data-result-pet={mood} style={{ position: 'absolute', left: '50%', marginLeft: -64, bottom: 6, width: 128, height: 128 }}>
                <VisorSprite src={p.petSrc} style={{ left: 0, bottom: 0 }} data-visor-pet />
              </div>
            )}
            {(record || p.outcome === 'win') && step >= 1 && <div className="sm-result-sparks"><VisorSparks /></div>}
          </GameVisor>
        </div>

        {/* O título e a frase ficam na leitura (o foco inicial é o título); hero, selo, faixa, livro e notas vão ao leitor pela região viva. */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%', maxWidth: 348 }}>
          <div className="sm-result-banner" style={{ textAlign: 'center' }}>
            <h2
              ref={titleRef}
              tabIndex={-1}
              data-result-title
              style={{ margin: 0, fontFamily: 'var(--sm2-font-display)', fontSize: 'var(--sm2-text-xl)', fontWeight: 600, color: 'var(--sm2-ink)', outline: 'none' }}
            >
              {p.title}
            </h2>
            {p.line && <p style={{ margin: '4px 0 0', fontSize: 'var(--sm2-text-sm)', lineHeight: 'var(--sm2-leading-body)', color: 'var(--sm2-muted)' }} data-result-line {...p.lineAttrs}>{p.line}</p>}
          </div>

          {p.hero && (
            <div aria-hidden="true" className={stageCls(1)} style={{ textAlign: 'center' }} data-result-hero>
              <div style={{ ...sm2Hint, fontWeight: 500 }}>{p.hero.label}</div>
              <div className="sm2-num" data-result-hero-value style={{ fontSize: heroSize(p.hero.value), fontWeight: 700, lineHeight: 1.15, fontVariantNumeric: 'tabular-nums', color: 'var(--sm2-ink)' }}>
                {typeof p.hero.value === 'number' ? <HeroNumber value={p.hero.value} active={animated && step >= 1} /> : p.hero.value}
                {/* O valor final sempre no DOM: a contagem é enfeite, nunca o único lugar do número. */}
                <span className="sm2-sr-only" data-result-final>{p.hero.value}</span>
              </div>
            </div>
          )}

          {record && p.recordNote && (
            <div aria-hidden="true" className={stageCls(2)} data-result-record style={{ fontFamily: 'var(--sm2-font-display)', fontSize: 'var(--sm2-text-sm)', fontWeight: 600, color: 'var(--sm2-gold-ink)', textAlign: 'center' }}>
              {p.recordNote}
            </div>
          )}

          {strip.length > 0 && (
            <div aria-hidden="true" className={stageCls(3)} data-result-strip style={{ display: 'flex', width: '100%', borderTop: '1px solid var(--sm2-line)', borderBottom: '1px solid var(--sm2-line)' }}>
              {strip.map((c, i) => (
                <div key={c.key} data-result-strip-cell={c.key} style={{ flex: 1, minWidth: 0, padding: '8px 4px', textAlign: 'center', borderLeft: i ? '1px solid var(--sm2-line)' : undefined }}>
                  <div style={sm2Hint}>{c.label}</div>
                  <div className="sm2-num" style={{ fontSize: 'var(--sm2-text-md)', fontWeight: 600 }}>{c.value}</div>
                </div>
              ))}
            </div>
          )}

          {(ledger.length > 0 || p.emptyLedgerLine) && (
            <div aria-hidden="true" style={{ width: '100%' }} data-result-ledger>
              {ledger.length > 0 ? (
                <>
                  <div style={{ ...sm2Hint, fontWeight: 500, marginBottom: 4 }}>{p.ledgerLabel ?? (isPt ? 'Ganhou' : 'Earned')}</div>
                  {ledger.map((r, i) => (
                    <div key={r.key} className={stageCls(rowStep(i))} data-result-row={r.kind} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 36, borderBottom: '1px solid var(--sm2-line)' }}>
                      <span style={{ fontSize: 'var(--sm2-text-sm)', color: 'var(--sm2-ink)', textAlign: 'left' }}>
                        {r.kind === 'bits' ? 'Bits' : r.kind === 'honor' ? honorName : r.label}
                      </span>
                      {r.kind === 'bits' && <BitsAmount value={r.value} sign="+" size={18} />}
                      {r.kind === 'honor' && <span className="sm2-num" data-result-honor style={{ ...emblemStyle, fontSize: 20 }}>+{r.value}</span>}
                      {r.kind === 'node' && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{r.node}</span>}
                      {r.kind === 'item' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          {r.icon && <img src={r.icon} alt="" width={24} height={24} style={{ imageRendering: 'pixelated' }} />}
                          {r.amount ? <span className="sm2-num" style={{ fontWeight: 600 }}>×{r.amount}</span> : null}
                        </span>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <p className={stageCls(4)} style={{ ...sm2Hint, textAlign: 'center' }} data-result-empty>{p.emptyLedgerLine}</p>
              )}
            </div>
          )}

          {p.notes && <div aria-hidden="true" className={stageCls(RESULT_FINAL_STEP)} data-result-notes style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'center' }}>{p.notes}</div>}
        </div>

        {p.below && <div data-result-noskip style={{ width: '100%', maxWidth: 348 }}>{p.below}</div>}
      </div>

      {/* Dock fixo, ativo desde 0 ms; sem seta de voltar duplicada. */}
      <div data-result-dock style={{ display: 'flex', gap: 8, padding: '8px 16px calc(env(safe-area-inset-bottom, 0px) + 12px)', borderTop: '1px solid var(--sm2-line)', backgroundColor: 'var(--sm2-bg)' }}>
        {p.onPlayAgain && (
          <button type="button" data-result-again {...p.againAttrs} onClick={p.onPlayAgain} style={{ ...sm2Button('primary'), flex: 1, minWidth: 0, padding: '0 8px' }}>
            {p.playAgainLabel ?? (isPt ? 'Jogar de novo' : 'Play again')}
          </button>
        )}
        {p.onHome && (
          <button type="button" data-result-home onClick={p.onHome} style={{ ...sm2Button('outline'), flex: 1, minWidth: 0, padding: '0 8px' }}>
            {p.homeLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export type { CSSProperties };
