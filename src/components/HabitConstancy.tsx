import type { Language } from '../utils/i18n';
import type { Schedule } from '../types/taskModel';
import { CONSTANCY_WINDOW_DAYS, REST_SHIELD_MAX } from '../types/taskModel';
import {
  constancy,
  habitTier,
  habitTierIcon,
  dayKeyOf,
  type HabitRhythm,
} from '../utils/habitRhythm';

/**
 * O INDICADOR DE CONSTÂNCIA DE UM HÁBITO
 * ======================================
 *
 * Componente puramente apresentacional. NÃO existe streak aqui, e a ausência é
 * deliberada: a métrica é "5 das últimas 7" (média móvel), então uma falha
 * custa ~14% e não 100%. Um número que zera é invenção de produto — Lally et
 * al. mediram que pular um único dia não prejudica a automaticidade.
 *
 * As duas decisões visuais que não se negociam:
 *
 *  1. **Cada estado tem FORMA própria, não só cor.** Quem não distingue verde
 *     de cinza (~8% dos homens) tem que conseguir ler a janela inteira. Feito é
 *     um quadrado cheio, protegido é um losango, falta é um anel vazado, não
 *     devido é um traço.
 *  2. **Dia protegido por escudo parece PROTEGIDO, nunca falho.** Ele conta
 *     como feito na constância (é para isso que o escudo existe) e aparece com
 *     a cor de destaque do app, não com a de falta. Um escudo que salva o
 *     número mas deixa a marca feia na tela não salvou nada.
 */

type DotState = 'done' | 'shielded' | 'missed' | 'notDue';

const DONE_INK = '#22A900';

export interface HabitConstancyProps {
  rhythm: HabitRhythm;
  schedule: Schedule;
  now: Date;
  language: Language;
  /** Versão de uma linha, para caber no card do hábito na lista. */
  compact?: boolean;
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

function stateOf(rhythm: HabitRhythm, _schedule: Schedule, day: Date, _now: Date): DotState {
  const key = dayKeyOf(day);
  if (rhythm.done.includes(key)) return 'done';
  if (rhythm.shielded.includes(key)) return 'shielded';
  if (rhythm.missed.includes(key)) return 'missed';
  // Dia sem registro NÃO vira falta, mesmo que `isDueOn` dissesse que era
  // devido: quem transforma "devido e não feito" em falta é a virada do dia
  // (`applyMissedDay`), depois de consumir escudo. Antecipar esse veredito na
  // tela mostraria falha para o dia de HOJE, que ainda está em aberto, e para
  // dias que um escudo ainda vai cobrir.
  return 'notDue';
}

function Dot({ state, label }: { state: DotState; label: string }) {
  const base: React.CSSProperties = {
    width: 12,
    height: 12,
    flexShrink: 0,
    display: 'inline-block',
  };
  const style: React.CSSProperties =
    state === 'done'
      ? { ...base, backgroundColor: DONE_INK }
      : state === 'shielded'
        ? {
            ...base,
            width: 10,
            height: 10,
            margin: 1,
            backgroundColor: 'var(--sm-px-cyan)',
            transform: 'rotate(45deg)',
          }
        : state === 'missed'
          ? {
              ...base,
              backgroundColor: 'transparent',
              border: '2px solid color-mix(in srgb, var(--sm-px-copper) 60%, transparent)',
            }
          : { ...base, height: 3, marginTop: 4.5, backgroundColor: 'var(--sm-line)' };

  return (
    <span
      title={label}
      aria-label={label}
      role="img"
      style={{ width: 12, height: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <span aria-hidden="true" style={style} />
    </span>
  );
}

export function HabitConstancy({ rhythm, schedule, now, language, compact = false }: HabitConstancyProps) {
  const isPt = language === 'pt-BR';
  const { done, window } = constancy(rhythm, now);
  const tier = habitTier(rhythm.totalDone);
  const tierIcon = habitTierIcon(rhythm.totalDone);
  const shields = Math.max(0, Math.min(REST_SHIELD_MAX, rhythm.shields));

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

  const tierName: Record<string, { pt: string; en: string }> = {
    seed: { pt: 'semente', en: 'seed' },
    sprout: { pt: 'broto', en: 'sprout' },
    sapling: { pt: 'muda', en: 'sapling' },
    tree: { pt: 'árvore', en: 'tree' },
  };

  // Denominador: a própria janela registrada. Um hábito de 3x por semana não
  // pode aparecer como "3 de 7" só porque a semana tem sete dias.
  const total = window || CONSTANCY_WINDOW_DAYS;
  const headline = isPt ? `${done} das últimas ${total}` : `${done} of the last ${total}`;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: compact ? 8 : 10,
        fontSize: compact ? 11.5 : 12.5,
        color: 'var(--sm-muted)',
      }}
    >
      {/* Maturidade. Emoji pelado, sem moldura — ícone nunca dentro de box. */}
      <span
        title={isPt ? `Maturidade: ${tierName[tier].pt} (${rhythm.totalDone} dias)` : `Maturity: ${tierName[tier].en} (${rhythm.totalDone} days)`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, color: 'var(--sm-ink)' }}
      >
        <span aria-hidden="true" style={{ fontSize: compact ? 14 : 16, lineHeight: 1 }}>{tierIcon}</span>
        {!compact && <span>{isPt ? tierName[tier].pt : tierName[tier].en}</span>}
      </span>

      {/* A métrica. Nada aqui zera. */}
      <span style={{ fontWeight: 800, color: 'var(--sm-ink)' }}>{headline}</span>

      {/* A janela. Forma OU cor distinta por estado. */}
      <span
        role="group"
        aria-label={isPt ? 'Últimos 7 dias' : 'Last 7 days'}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
      >
        {days.map(day => {
          const state = stateOf(rhythm, schedule, day, now);
          return <Dot key={day.toDateString()} state={state} label={dayLabel(day, state)} />;
        })}
      </span>

      {/* Escudos disponíveis. Consumidos sozinhos quando falta um dia — o
          usuário nunca precisa lembrar de ativar, que é exatamente o que faz o
          Streak Freeze do Duolingo funcionar. */}
      <span
        title={
          isPt
            ? `${shields} escudo(s) de descanso. Usados sozinhos num dia perdido.`
            : `${shields} rest shield(s). Spent automatically on a missed day.`
        }
        aria-label={
          isPt ? `${shields} escudos de descanso disponíveis` : `${shields} rest shields available`
        }
        style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}
      >
        {Array.from({ length: REST_SHIELD_MAX }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            style={{
              width: 8,
              height: 8,
              transform: 'rotate(45deg)',
              backgroundColor: i < shields ? 'var(--sm-px-cyan)' : 'transparent',
              border:
                i < shields
                  ? '1px solid var(--sm-px-cyan)'
                  : '1px solid color-mix(in srgb, var(--sm-px-copper) 45%, transparent)',
            }}
          />
        ))}
      </span>

      {!compact && (
        <span style={{ flexBasis: '100%', fontSize: 11, lineHeight: 1.45 }}>
          {isPt
            ? 'Nada zera aqui: um dia perdido custa um pontinho, não a sua história.'
            : 'Nothing resets here: one missed day costs a dot, not your history.'}
        </span>
      )}
    </div>
  );
}

export default HabitConstancy;
