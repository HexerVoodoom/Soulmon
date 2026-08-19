import type { Language } from '../utils/i18n';
import type { Schedule } from '../types/taskModel';
import { CONSTANCY_WINDOW_DAYS, REST_SHIELD_MAX } from '../types/taskModel';
import {
  constancy,
  habitTier,
  dayKeyOf,
  type HabitRhythm,
} from '../utils/habitRhythm';
import { Icon } from './ui/Icon';

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

/**
 * As três tintas da janela, agora na fundação `--sm2-*` (todas com par nos DOIS
 * temas e medidas em `src/styles/tokens.md`; nenhuma delas é hex cru).
 *
 * O que mudou de valor e por quê: o verde `--sm-ok-ink` e o ciano/cobre do kit
 * antigo não existem na fundação nova, e inventar um terceiro verde só para
 * esta linha reabriria o problema que ela já teve (o ponto "feito", o mais
 * frequente da janela, era o que menos aparecia no tema claro). Feito passa a
 * usar o acento do app (`primary`) e protegido usa o ouro. A FORMA continua
 * sendo o que distingue os quatro estados — ver a nota do topo — então a troca
 * de matiz não custa nenhuma leitura a quem não separa verde de ciano.
 *
 * São objetos gráficos (3:1, WCAG 1.4.11): `primary-fill` mede 5,55:1 (claro) e
 * 13,21:1 (escuro) contra o fundo; `gold-fill`, 4,80:1 e 6,60:1.
 */
const DONE_FILL = 'var(--sm2-primary-fill)';
const SHIELD_FILL = 'var(--sm2-gold-fill)';
const MISS_INK = 'var(--sm2-muted)';

/**
 * Maturidade: UM glifo que se PREENCHE, não quatro emojis diferentes.
 *
 * Os 🌱🌿🌳 eram ícone de sistema disfarçado de emoji (o próprio plano de
 * design os cita nominalmente): não são escolha da pessoa, são o estado que o
 * app calcula. `eco` com o eixo `FILL` de 0 a 1 é o mesmo estado dito do jeito
 * da fundação — inativo→ativo é o mesmo desenho se preenchendo, e o tier é
 * legível na tinta e no rótulo, nunca só na cor.
 */
const TIER_FILL: Record<string, number> = { seed: 0, sprout: 0.34, sapling: 0.67, tree: 1 };

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
      ? { ...base, backgroundColor: DONE_FILL }
      : state === 'shielded'
        ? {
            ...base,
            width: 10,
            height: 10,
            margin: 1,
            backgroundColor: SHIELD_FILL,
            transform: 'rotate(45deg)',
          }
        : state === 'missed'
          ? {
              ...base,
              backgroundColor: 'transparent',
              border: `2px solid ${MISS_INK}`,
              borderRadius: '50%',
            }
          : { ...base, height: 3, marginTop: 4.5, backgroundColor: 'var(--sm2-line)' };

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
  //
  // JANELA VAZIA NÃO VIRA "0 DE 7". O fallback para `CONSTANCY_WINDOW_DAYS`
  // fabricava um denominador que não existe e imprimia "0 das últimas 7" logo
  // abaixo do hábito recém-criado, na primeira tela do app — contradizendo o
  // dono da própria regra, que devolve `ratio: 1` sem histórico exatamente
  // porque ninguém começa em 0% (progresso dotado, Nunes & Drèze). O mesmo
  // aparecia para quem volta de uma ausência (ausência não registra falta, então
  // a janela fica vazia): o relatório dizia "você não perdeu nada" e a linha
  // logo abaixo dizia zero, na mesma tela. `WeeklyReportCard` já filtrava
  // `window > 0` pelo motivo certo — "0 de 0 não descreve nada".
  const semJanela = window === 0;
  const total = window || CONSTANCY_WINDOW_DAYS;
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

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: compact ? 8 : 10,
        fontFamily: 'var(--sm2-font-text)',
        // Piso ABSOLUTO de 12px: o modo largo estava em 12.5 e o compacto em 12
        // — dois tamanhos para a mesma linha, um deles fora da escala fechada.
        fontSize: 'var(--sm2-text-xs)',
        lineHeight: 'var(--sm2-leading-body)',
        color: 'var(--sm2-muted)',
      }}
    >
      {/* Maturidade. Glifo pelado, sem moldura — ícone nunca dentro de box. */}
      <span
        title={isPt ? `Maturidade: ${tierName[tier].pt} (${rhythm.totalDone} dias)` : `Maturity: ${tierName[tier].en} (${rhythm.totalDone} days)`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500, color: 'var(--sm2-ink)' }}
      >
        <Icon
          name="eco"
          size={20}
          fill={TIER_FILL[tier] ?? 0}
          tone="primary"
          label={isPt ? `Maturidade: ${tierName[tier].pt}` : `Maturity: ${tierName[tier].en}`}
        />
        {!compact && <span>{isPt ? tierName[tier].pt : tierName[tier].en}</span>}
      </span>

      {/* A métrica. Nada aqui zera — e sem janela ela nem vira número.
          `sm2-num` (tabular-nums) porque o numerador muda todo dia: sem ele a
          linha inteira dança na horizontal a cada conclusão. */}
      <span
        title={headlineTitle}
        className={semJanela ? undefined : 'sm2-num'}
        style={{ fontWeight: 500, color: 'var(--sm2-ink)' }}
      >
        {headline}
      </span>

      {/* A janela. Forma OU cor distinta por estado. */}
      {/* O rótulo dizia "Últimos 7 dias" fixo enquanto o denominador EXIBIDO é
          `total` (a janela realmente registrada) — um hábito de 3x por semana
          era anunciado como uma janela de 7 que a tela não mostra. */}
      <span
        role="group"
        aria-label={
          semJanela
            ? (isPt
              ? 'Janela de constância: nenhum dia devido ainda'
              : 'Constancy window: no due days yet')
            : isPt
              ? `Janela de constância: últimos ${total} dias devidos`
              : `Constancy window: last ${total} due days`
        }
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
      >
        {days.map(day => {
          const state = stateOf(rhythm, schedule, day, now);
          return <Dot key={day.toDateString()} state={state} label={dayLabel(day, state)} />;
        })}
      </span>

      {/* Escudos disponíveis. Consumidos sozinhos quando falta um dia — o
          usuário nunca precisa lembrar de ativar, que é exatamente o que faz o
          Streak Freeze do Duolingo funcionar.

          ONDA 2: as CASAS VAZIAS saíram. A linha desenhava sempre
          `REST_SHIELD_MAX` losangos e apagava os que faltavam — ou seja, com 0
          escudo (o caso mais comum, e o de quem acabou de criar o hábito) a
          lista mostrava três contornos vazios embaixo de cada hábito, dizendo
          "você não tem" três vezes. Agora só existe o que existe: sem escudo,
          nada é desenhado. O losango é o MESMO do dia protegido, de propósito —
          é a mesma coisa, guardada. */}
      {shields > 0 && (
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
          {Array.from({ length: shields }, (_, i) => (
            <span
              key={i}
              aria-hidden="true"
              style={{
                width: 8,
                height: 8,
                transform: 'rotate(45deg)',
                backgroundColor: SHIELD_FILL,
              }}
            />
          ))}
        </span>
      )}

      {/* A tese do produto, escrita. Fica só no modo largo — na lista diária
          ela apareceria embaixo de CADA hábito, e uma frase repetida seis vezes
          na mesma tela deixa de ser tranquilizadora. */}
      {!compact && (
        <span style={{ flexBasis: '100%', fontSize: 'var(--sm2-text-xs)', lineHeight: 'var(--sm2-leading-body)' }}>
          {isPt
            ? 'Nada zera aqui: um dia perdido custa um pontinho, não a sua história.'
            : 'Nothing resets here: one missed day costs a dot, not your history.'}
        </span>
      )}
    </div>
  );
}

export default HabitConstancy;
