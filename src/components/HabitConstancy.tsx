import type { CSSProperties } from 'react';
import type { Language } from '../utils/i18n';
import type { Schedule } from '../types/taskModel';
import { CONSTANCY_WINDOW_DAYS, REST_SHIELD_MAX } from '../types/taskModel';
import {
  constancy,
  habitTier,
  dayKeyOf,
  steadyWindow, STEADY_WINDOW_DAYS,
  type HabitRhythm,
} from '../utils/habitRhythm';
import { Icon } from './ui/Icon';
import { InfoTip } from './ui/InfoTip';

/**
 * O INDICADOR DE CONSTÂNCIA DE UM HÁBITO
 * ======================================
 *
 * Componente puramente apresentacional. NÃO existe streak aqui, e a ausência é
 * deliberada: a métrica é "5 das últimas 7" (média móvel), então uma falha
 * custa ~14% e não 100%. Um número que zera é invenção de produto — Lally et
 * al. mediram que pular um único dia não prejudica a automaticidade.
 *
 * Canvas ATIVIDADES (identidade, D-A1/D-A2, DECISÕES §20):
 *
 *  1. **A janela de 7 são FORMAS de 12px com 4 de ar** — ● feito (`primary-fill`
 *     cheio) · ◆ protegido por escudo (contorno 2px `primary-ink`) · ○ falta
 *     (anel 2px `muted`) · — não devido (traço 2px `muted`, o menos saliente).
 *     Cada estado tem forma própria, não só cor: quem não separa verde de
 *     cinza (~8% dos homens) continua lendo a semana. Não-texto ≥ 3:1 nos
 *     dois temas.
 *  2. **A maturidade é UM glifo que se preenche** — `eco` com FILL 0/.34/.67/1
 *     (`TIER_FILL`) em `primary-ink`; a aura de 28 dias (`steadyWindow`) é
 *     FILL 1 + halo de 3px em `primary-soft` — sem sombra e sem `filter`
 *     (X3: no claro a sombra virava mancha).
 *  3. **Na lista (`compact`) só existem a janela e o glifo.** "N of the last 7"
 *     e a frase dos escudos saem da linha (achado 9): o número mora na ficha
 *     do hábito, um toque de distância. A janela é `role="img"` com o número
 *     no `aria-label` — a leitura sonora precisa do dado, a tela não.
 *  4. **Escudos como POSSE, inclusive zero** (só na ficha): `REST_SHIELD_MAX`
 *     casas, ◆ ciano = tem, ◇ tracejado `muted` = vazia — nunca o traço de
 *     "não devido".
 *  5. `hideMetrics` (WP2.8) tira o NÚMERO e preserva a recompensa: tier,
 *     janela e escudos ficam; some só o "N das últimas 7" e as contagens dos
 *     tooltips e dos `aria-label`.
 */

type DotState = 'done' | 'shielded' | 'missed' | 'notDue';

const DONE_FILL = 'var(--sm2-primary-fill)';
const SHIELD_INK = 'var(--sm2-primary-ink)';
const MISS_INK = 'var(--sm2-muted)';

/**
 * Maturidade: UM glifo que se PREENCHE, não quatro emojis diferentes.
 * `eco` com o eixo `FILL` de 0 a 1 — inativo→ativo é o mesmo desenho se
 * preenchendo, e o tier é legível na tinta e no rótulo, nunca só na cor.
 */
export const TIER_FILL: Record<string, number> = { seed: 0, sprout: 0.34, sapling: 0.67, tree: 1 };

const TIER_NAME: Record<string, { pt: string; en: string }> = {
  seed: { pt: 'semente', en: 'seed' },
  sprout: { pt: 'broto', en: 'sprout' },
  sapling: { pt: 'muda', en: 'sapling' },
  tree: { pt: 'árvore', en: 'tree' },
};

export interface HabitConstancyProps {
  rhythm: HabitRhythm;
  schedule: Schedule;
  now: Date;
  language: Language;
  /** Versão de linha: janela + glifo, e nada mais (D-A2). */
  compact?: boolean;
  /** WP2.8 — a mesma opção da Janela de Descanso (`rest.hideMetrics`). */
  hideMetrics?: boolean;
}

function windowDays(now: Date): Date[] {
  const days: Date[] = [];
  for (let i = CONSTANCY_WINDOW_DAYS - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

function stateOf(rhythm: HabitRhythm, day: Date): DotState {
  const key = dayKeyOf(day);
  if (rhythm.done.includes(key)) return 'done';
  if (rhythm.shielded.includes(key)) return 'shielded';
  if (rhythm.missed.includes(key)) return 'missed';
  // Dia sem registro NÃO vira falta, mesmo que `isDueOn` dissesse que era
  // devido: quem transforma "devido e não feito" em falta é a virada do dia
  // (`applyMissedDay`), depois de consumir escudo. Antecipar esse veredito na
  // tela mostraria falha para o dia de HOJE, que ainda está em aberto.
  return 'notDue';
}

/** As formas (D-A1). `empty` = casa vazia de escudo (só na ficha). */
export function dotStyle(state: DotState | 'empty'): CSSProperties {
  const base: CSSProperties = { display: 'block', width: 12, height: 12, boxSizing: 'border-box', flexShrink: 0 };
  switch (state) {
    case 'done':
      return { ...base, borderRadius: '50%', backgroundColor: DONE_FILL };
    case 'shielded':
      return { ...base, width: 10, height: 10, margin: '0 1px', border: `2px solid ${SHIELD_INK}`, borderRadius: 2, transform: 'rotate(45deg)' };
    case 'missed':
      return { ...base, borderRadius: '50%', border: `2px solid ${MISS_INK}`, backgroundColor: 'transparent' };
    case 'empty':
      return { ...base, width: 10, height: 10, margin: '0 1px', border: `2px dashed ${MISS_INK}`, borderRadius: 2, transform: 'rotate(45deg)' };
    default:
      return { ...base, height: 2, backgroundColor: MISS_INK, borderRadius: 1 };
  }
}

/**
 * O glifo de maturidade — exportado porque a ficha o mostra 5× (os 4 tiers +
 * a aura) e a linha 1×. `aura` = FILL 1 + halo `primary-soft`, sem sombra.
 */
export function MaturityGlyph({ tier, aura = false, label }: { tier: string; aura?: boolean; label: string }) {
  return (
    <Icon
      name="eco"
      size={20}
      fill={aura ? 1 : (TIER_FILL[tier] ?? 0)}
      tone="primary"
      label={label}
      style={aura ? { borderRadius: '50%', boxShadow: '0 0 0 3px var(--sm2-primary-soft)' } : undefined}
    />
  );
}

/**
 * A JANELA DE 7 sozinha — exportada porque o cartão da semana
 * (`WeeklyReportCard`, canvas Rituais RIT-18) desenha a mesma janela por
 * hábito com o mesmo léxico (A2). Uma segunda cópia das formas e do
 * `aria-label` divergiria em silêncio (footgun 9).
 */
export function ConstancyWindow({ rhythm, now, language, hideMetrics = false }: {
  rhythm: HabitRhythm;
  now: Date;
  language: Language;
  hideMetrics?: boolean;
}) {
  const isPt = language === 'pt-BR';
  const { done, window } = constancy(rhythm, now);
  const semJanela = window === 0;
  const total = window || CONSTANCY_WINDOW_DAYS;
  const days = windowDays(now);
  const dayLabel = (day: Date, state: DotState) => {
    const d = day.toLocaleDateString(isPt ? 'pt-BR' : 'en-US', { weekday: 'short', day: 'numeric' });
    const s =
      state === 'done'
        ? isPt ? 'feito' : 'done'
        : state === 'shielded'
          ? isPt ? 'protegido por escudo' : 'protected by a shield'
          : state === 'missed'
            ? isPt ? 'falta' : 'missed'
            : isPt ? 'não devido' : 'not due';
    return `${d}: ${s}`;
  };
  const headlineTitle = semJanela
    ? (isPt
      ? 'Sem dias devidos na janela — começa hoje. Ninguém começa em 0%.'
      : 'No due days in this window — it starts today. Nobody starts at 0%.')
    : undefined;
  /* O rótulo da janela: o número vai AQUI (leitura sonora), não na tela. */
  const windowLabel = semJanela
    ? (isPt ? 'Janela de constância: nenhum dia devido ainda' : 'Constancy window: no due days yet')
    : hideMetrics
      ? (isPt ? 'Janela de constância' : 'Constancy window')
      : isPt
        ? `Janela de constância: ${done} das últimas ${total}`
        : `Constancy window: ${done} of the last ${total}`;
  return (
    <span
      role="img"
      aria-label={windowLabel}
      title={headlineTitle}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 12 }}
    >
      {days.map(day => {
        const state = stateOf(rhythm, day);
        return <span key={day.toDateString()} aria-hidden="true" title={dayLabel(day, state)} style={dotStyle(state)} />;
      })}
    </span>
  );
}

export function HabitConstancy({ rhythm, schedule: _schedule, now, language, compact = false, hideMetrics = false }: HabitConstancyProps) {
  const isPt = language === 'pt-BR';
  const { done, window } = constancy(rhythm, now);
  const tier = habitTier(rhythm.totalDone);
  const shields = Math.max(0, Math.min(REST_SHIELD_MAX, rhythm.shields));

  /* WP2.2 — a aura. Calculada aqui, do mesmo `rhythm` que já chega. Quando
     deixa de valer ela some EM SILÊNCIO — anunciar a perda é exatamente a
     punição que a streak que zera faz. */
  const aura = steadyWindow(rhythm, now);
  const semJanela = window === 0;
  const total = window || CONSTANCY_WINDOW_DAYS;

  // JANELA VAZIA NÃO VIRA "0 DE 7": o dono da regra devolve `ratio: 1` sem
  // histórico (progresso dotado, Nunes & Drèze). "0 das últimas 7" (janela
  // cheia de faltas) é SILÊNCIO na linha e número na ficha — nunca frase de
  // consolo.
  const headline = semJanela
    ? (rhythm.totalDone === 0
      ? (isPt ? 'hábito novo' : 'new habit')
      : (isPt ? 'sem dias devidos' : 'no due days'))
    : isPt ? `${done} das últimas ${total}` : `${done} of the last ${total}`;
  const headlineTitle = semJanela
    ? (isPt
      ? 'Sem dias devidos na janela — começa hoje. Ninguém começa em 0%.'
      : 'No due days in this window — it starts today. Nobody starts at 0%.')
    : undefined;

  const tierWord = isPt ? TIER_NAME[tier].pt : TIER_NAME[tier].en;
  const maturityLabel = isPt ? `Maturidade: ${tierWord}` : `Maturity: ${tierWord}`;
  const auraLabel = hideMetrics
    ? (isPt ? 'Ritmo firme' : 'Steady rhythm')
    : (isPt ? `Ritmo firme nos últimos ${STEADY_WINDOW_DAYS} dias` : `Steady rhythm over the last ${STEADY_WINDOW_DAYS} days`);
  const glyphLabel = aura ? `${maturityLabel} · ${auraLabel}` : maturityLabel;
  const glyphTitle = hideMetrics
    ? glyphLabel
    : `${maturityLabel} (${rhythm.totalDone} ${isPt ? 'dias' : 'days'})${aura ? ` · ${auraLabel}` : ''}`;

  const janela = <ConstancyWindow rhythm={rhythm} now={now} language={language} hideMetrics={hideMetrics} />;

  const glifo = (
    <span title={glyphTitle} style={{ display: 'inline-flex' }}>
      <MaturityGlyph tier={tier} aura={aura} label={glyphLabel} />
    </span>
  );

  if (compact) {
    return (
      <>
        {janela}
        {glifo}
      </>
    );
  }

  const shieldsLabel = hideMetrics
    ? (isPt ? 'Escudos de descanso disponíveis' : 'Rest shields available')
    : isPt
      ? `${shields} escudo${shields === 1 ? '' : 's'} de descanso disponíve${shields === 1 ? 'l' : 'is'}`
      : `${shields} rest shield${shields === 1 ? '' : 's'} available`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        fontFamily: 'var(--sm2-font-text)',
        fontSize: 'var(--sm2-text-xs)',
        lineHeight: 'var(--sm2-leading-body)',
        color: 'var(--sm2-muted)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        {janela}
        {/* A métrica. Nada aqui zera — e sem janela ela nem vira número.
            `sm2-num` porque o numerador muda todo dia. */}
        {!hideMetrics && (
          <span
            title={headlineTitle}
            className={semJanela ? undefined : 'sm2-num'}
            style={{ fontSize: 'var(--sm2-text-sm)', fontWeight: 500, color: 'var(--sm2-ink)' }}
          >
            {headline}
          </span>
        )}
        {glifo}
        <span>{maturityLabel}</span>
      </div>

      {/* Escudos como POSSE, inclusive zero (T5 / 13.5): `REST_SHIELD_MAX`
          casas; consumidos sozinhos num dia perdido — o usuário nunca precisa
          lembrar de ativar. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span>{isPt ? 'Escudos de descanso' : 'Rest shields'}</span>
        <span
          role="img"
          aria-label={shieldsLabel}
          title={hideMetrics
            ? (isPt ? 'Escudos de descanso. Usados sozinhos num dia perdido.' : 'Rest shields. Spent automatically on a missed day.')
            : shieldsLabel}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 12 }}
        >
          {Array.from({ length: REST_SHIELD_MAX }, (_, i) => (
            <span key={i} aria-hidden="true" style={dotStyle(i < shields ? 'shielded' : 'empty')} />
          ))}
        </span>
        {/* I13 (02/10/2026): as duas frases de regra moram atrás do "?". A tese
            do produto ("nada zera") continua escrita aqui — só na ficha; na
            lista ela apareceria embaixo de CADA hábito. */}
        <InfoTip language={language} label={isPt ? 'Como funcionam os escudos' : 'How shields work'} align="right" style={{ minHeight: 24 }}>
          <span style={{ display: 'block' }}>
            {isPt
              ? 'Chegam com semanas firmes e entram sozinhos quando um dia escapa.'
              : 'They arrive with steady weeks and step in on their own when a day slips.'}
          </span>
          <span style={{ display: 'block', marginTop: 6 }}>
            {isPt
              ? 'Nada zera aqui: um dia perdido custa um pontinho, não a sua história.'
              : 'Nothing resets here: one missed day costs a dot, not your history.'}
          </span>
        </InfoTip>
      </div>
    </div>
  );
}

export default HabitConstancy;
