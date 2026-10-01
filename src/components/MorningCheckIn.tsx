import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { Language } from '../utils/i18n';
import { MAX_DAILY_FOCUS, normalizeEffort, type HabitTier } from '../types/taskModel';
import { tinyOfferIntro } from '../utils/tinyOffer';
import { isOvercommitted } from '../utils/taskTriage';
import { Icon } from './ui/Icon';
import { sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import { TIER_FILL } from './HabitConstancy';
import { RitualDialog, ritualLabel, ritualTitle } from './ritual/RitualKit';

/**
 * O CHECK-IN MATINAL (≤20 SEGUNDOS)
 * =================================
 *
 * O ritual de planejamento do Sunsama sem o custo de 20 minutos. E o achado que
 * justifica ele existir: **a tensão de uma tarefa inacabada não é aliviada por
 * concluí-la — é aliviada por fazer um plano concreto para ela** (Masicampo &
 * Baumeister). Por isso o app cobra o planejar, não o marcar o check.
 *
 * A ordem da tela é a mecânica:
 *
 *  1. **Pendências de ontem, PRIMEIRO** — o Shutdown do Sunsama invertido para
 *     caber num app mobile. A dívida nunca fica invisível; o que muda é o tom:
 *     ela abre a tela como fato, não como acusação.
 *  2. **Hábitos de hoje** — o contrato de constância, já resolvido pelo ritmo.
 *  3. **Até 3 focos** — três, e o número é a mecânica: escolher significa
 *     deixar de fora, e é o deixar de fora que alivia.
 *
 * As duas regras que não se negociam neste arquivo:
 *
 *  - **`overcommitted` é AVISO, NUNCA bloqueio.** O botão de confirmar continua
 *    ativo, sempre. O Motion é odiado exatamente por decidir no lugar do
 *    usuário, e um medidor que virasse trava reproduziria o defeito com outro
 *    nome.
 *  - **Pulável sem culpa, com `onSkip` sempre visível.** Um ritual que só sai
 *    da frente se cumprido é uma cobrança na porta do app — e um app que cobra
 *    na abertura é um app que a pessoa passa a evitar abrir.
 *
 * CANVAS RITUAIS (`docs/design/wireframes/rituais/identidade/`, DECISÕES §21):
 *  · o diálogo é o `.dlg` SIS-06 centrado sobre o scrim literal (D-R1);
 *  · hábito do dia = `.hchip` 32 (`surface-2`, sem borda, não interativo)
 *    com `eco` FILL por tier (D-R5) — etiqueta, não chip de escolha;
 *  · foco = `.focus-row` 44: escolhido `primary-soft` + anel 1px
 *    `primary-ink` + `check_circle` FILL 1; não escolhido
 *    `radio_button_unchecked` `muted` em `surface-2`; **inerte = sem fundo +
 *    contorno tracejado 1px `muted` + `aria-disabled`** — forma e tinta,
 *    nunca opacidade (D-R4, Home F1/E7);
 *  · carga do dia = texto `role=status` em `gold-ink` com `info` 20, sem
 *    moldura (D-R8); a linha "Planned load" some com `plannedEffort === 0` (S2: nada de "0 points");
 *  · saídas em `outline`, nunca `quiet` (D-R7).
 *
 * Componente puramente apresentacional: nada de GameState, nada de
 * localStorage. O plano vem pronto (`checkInPlan`) e quem grava é o pai.
 */

/** Um hábito devido hoje. Só `id` é exigido — o resto é o que houver. */
export interface CheckInHabitItem {
  id: string;
  name?: string;
  emoji?: string;
  /** A âncora do Atoms: "depois do café da manhã". */
  anchor?: { after?: string; where?: string };
}

/** Uma tarefa candidata a foco (ou vinda de ontem). */
export interface CheckInTaskItem {
  id: string;
  name?: string;
  effort?: number;
  postponedCount?: number;
}

/**
 * O formato devolvido por `checkInPlan` (utils/rituals.ts).
 *
 * Declarado aqui de propósito, com campos estruturalmente mínimos: o módulo de
 * rituais está sendo escrito em paralelo, e o contrato combinado é o FORMATO,
 * não o import. Tipos mais frouxos do lado da UI também são o que deixa o pai
 * passar a `Task` inteira do GameState sem conversão.
 */
export interface CheckInPlanShape {
  habitsToday: CheckInHabitItem[];
  suggestedFocus: CheckInTaskItem[];
  carryOver: CheckInTaskItem[];
  plannedEffort: number;
  overcommitted: boolean;
  /** Hábitos que faltaram 2× seguidas e ganham a oferta reduzida (WP2.10). */
  tinyOffer?: string[];
}

export interface MorningCheckInProps {
  open: boolean;
  plan: CheckInPlanShape;
  language: Language;
  onConfirm: (focusIds: string[]) => void;
  onSkip: () => void;
  /** Aceitar a versão reduzida — conta como FEITO, pelo mesmo caminho de sempre. */
  onTinyHabit?: (activityId: string) => void;
  /** WP2.5 — o "o que costuma atrapalhar?" do onboarding, para a oferta
   *  reduzida reconhecer o que a pessoa contou. Opcional: quem pulou a
   *  pergunta vê a oferta genérica, nunca um vazio. */
  soulStruggle?: string;
  /** Maturidade de cada hábito (`habitTier`), para o `eco` da etiqueta
   *  (D-R5). Ausente = semente (FILL 0). */
  habitTiers?: Record<string, HabitTier | string>;
}

const EFFORT_WORD: Record<number, { pt: string; en: string }> = {
  1: { pt: 'rápida', en: 'quick' },
  2: { pt: 'média', en: 'medium' },
  3: { pt: 'projeto', en: 'project' },
};

const hint = sm2Hint;
const body = sm2Text;

const section: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 };

export function MorningCheckIn({ open, plan, language, onConfirm, onSkip, onTinyHabit, soulStruggle, habitTiers }: MorningCheckInProps) {
  const isPt = language === 'pt-BR';
  const introStruggle = tinyOfferIntro(soulStruggle, isPt);

  const carryOver = plan.carryOver ?? [];
  const habits = plan.habitsToday ?? [];
  /** Os que faltaram 2× seguidas (`needsIntervention`, calculado no `checkInPlan`). */
  const ofertaReduzida = habits.filter(h => (plan.tinyOffer ?? []).includes(h.id));
  const suggested = plan.suggestedFocus ?? [];

  // Candidatos ao foco: pendência de ontem primeiro (é o que já custou um dia),
  // depois a sugestão. Sem duplicar quem aparece nos dois.
  const candidates = useMemo(() => {
    const seen = new Set<string>();
    const out: CheckInTaskItem[] = [];
    for (const t of [...carryOver, ...suggested]) {
      if (!t || seen.has(t.id)) continue;
      seen.add(t.id);
      out.push(t);
    }
    return out;
  }, [carryOver, suggested]);

  const [selected, setSelected] = useState<string[]>([]);
  /* R6 — o estado "aceitei" da oferta reduzida: o botão vira chip preenchido
     "Stretch · counted". Sem prêmio, sem confete: é uma conclusão como
     qualquer outra. Estado de UI desta abertura — o save já contou. */
  const [accepted, setAccepted] = useState<string[]>([]);

  // Progresso dotado (Nunes & Drèze): ninguém começa em 0%. A tela abre com a
  // sugestão já marcada, e desmarcar é um toque.
  useEffect(() => {
    if (!open) return;
    setSelected(candidates.slice(0, MAX_DAILY_FOCUS).map(t => t.id));
    setAccepted([]);
  }, [open, candidates]);

  if (!open) return null;

  const toggle = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= MAX_DAILY_FOCUS) return prev;
      return [...prev, id];
    });
  };

  const focusEffort = candidates
    .filter(t => selected.includes(t.id))
    .reduce((sum, t) => sum + normalizeEffort(t.effort), 0);

  /* V2 / STATUS c — a linha de carga continua lendo `plan.plannedEffort`
     (hábitos + tarefas já datadas para hoje). Somar o foco escolhido aqui
     contaria duas vezes a tarefa que já está datada — quem sabe quais são é
     o motor (`checkInPlan`), não a superfície. Fica registrado como dívida
     do motor; a UI mostra os dois números lado a lado, como o canvas. */
  const load = plan.plannedEffort;
  const overcommitted = plan.overcommitted || isOvercommitted(load);
  // Pluralização: "Planned load: 1 points" era o primeiro texto que o usuário
  // novo lia depois de nascer o pet.
  const points = (n: number) => (isPt ? (n === 1 ? 'ponto' : 'pontos') : (n === 1 ? 'point' : 'points'));

  return (
    <RitualDialog
      label={isPt ? 'Check-in da manhã' : 'Morning check-in'}
      onClose={onSkip}
      maxWidth={380}
      /* O ponto de entrada do foco é o CARTÃO (efeito de layout, antes da
         pintura): este diálogo monta sozinho na abertura do app, e quem chega
         de leitor de tela precisa ouvir o nome e o "Bom dia" antes da lista.
         Escape = "hoje não, obrigado" — nunca confirma um plano que a pessoa
         não escolheu. */
      focusContainer
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p style={ritualTitle}>{isPt ? 'Bom dia!' : 'Good morning!'}</p>
        {/* C7 (navegação do dono, 01/10/2026): saiu a descrição pequena
            ("Twenty seconds and we're off"). C9: no lugar, UMA linha dizendo o
            benefício de engajar — voz de produto, sem veredito sobre a pessoa.
            Planejar poucos itens antes é o que alivia a largada (intenções de
            implementação, Gollwitzer; Masicampo & Baumeister). */}
        <p style={hint} data-checkin-why>
          {isPt
            ? 'Escolher o foco antes deixa mais fácil começar.'
            : 'Picking your focus ahead makes it easier to start.'}
        </p>
      </div>

      {/* (a) PENDÊNCIAS DE ONTEM — primeiro, sempre que houver. Texto plano:
          uma lista de linhas é uma lista. */}
      {carryOver.length > 0 && (
        <section style={section}>
          <p style={ritualLabel}>
            {isPt ? 'Ficou de ontem — sem cobrança' : 'Left from yesterday — no blame'}
          </p>
          {carryOver.map(t => (
            <p key={t.id} style={{ ...body, margin: 0, padding: '2px 0' }}>
              {t.name || (isPt ? 'Tarefa sem nome' : 'Untitled task')}
              {(t.postponedCount ?? 0) >= 1 && (
                <span style={{ ...hint, marginLeft: 6 }}>
                  {isPt ? '· adiada ' : '· postponed '}
                  <span className="sm2-num">{t.postponedCount}</span>
                  {isPt
                    ? (t.postponedCount === 1 ? ' vez' : ' vezes')
                    : (t.postponedCount === 1 ? ' time' : ' times')}
                </span>
              )}
            </p>
          ))}
        </section>
      )}

      {/* (b) HÁBITOS DE HOJE — etiquetas 32 com o glifo de maturidade. */}
      <section style={section}>
        <p style={ritualLabel}>{isPt ? 'Hábitos de hoje' : 'Today’s habits'}</p>
        {habits.length === 0 ? (
          <p style={hint}>
            {isPt ? 'Nenhum hábito devido hoje. Dia leve.' : 'No habits due today. Light day.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {habits.map(h => (
              <span
                key={h.id}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  minHeight: 32, padding: '0 12px 0 8px', borderRadius: 999,
                  boxSizing: 'border-box',
                  backgroundColor: 'var(--sm2-surface-2)',
                  fontFamily: 'var(--sm2-font-text)',
                  fontSize: 'var(--sm2-text-xs)', fontWeight: 500,
                  lineHeight: 'var(--sm2-leading-body)',
                  color: 'var(--sm2-ink)',
                }}
              >
                {/* `eco` = maturidade (D-A2): o MESMO glifo da lista se
                    preenchendo. 20 e não 18: `inline` é o degrau da escala. */}
                <Icon name="eco" size={20} fill={TIER_FILL[habitTiers?.[h.id] ?? 'seed'] ?? 0} tone="primary" />
                {h.name || (isPt ? 'Hábito' : 'Habit')}
                {/* A12 (QA rodada 2): a âncora ("depois do café") vivia num
                    `title`, que só existe no hover — no celular e no leitor
                    de tela, nunca. Vira texto 12 `muted` ao lado do nome. */}
                {h.anchor?.after && (
                  <span data-habit-anchor style={{ fontSize: 'var(--sm2-text-xs)', fontWeight: 400, color: 'var(--sm2-muted)' }}>
                    {` · ${h.anchor.after}${h.anchor.where ? ` — ${h.anchor.where}` : ''}`}
                  </span>
                )}
              </span>
            ))}
          </div>
        )}

        {/* WP2.10 — A OFERTA REDUZIDA (never miss twice).
            `needsIntervention` existia com teste, 40 linhas de comentário e
            NENHUM chamador: o guia e o `CLAUDE.md` prometiam que "o pet
            oferece uma versão bem menor do hábito — aceitar já conta como
            feito", e o pet nunca ofereceu nada. A primeira falha continua
            não gerando nada visível; a segunda gera isto.

            Três travas de forma, e as três são a diferença entre companhia
            e cobrança:
            · NENHUM dígito de falta. Nunca "você falhou 2 dias" — a pessoa
              sabe. O único número na frase é o 5 dos minutos.
            · aceitar chama o MESMO caminho de conclusão de sempre
              (`onTinyHabit` → `handleToggleActivityCompletion`), com os
              mesmos ganhos. "Conta como feito" é literal, não simbólico.
            · não há botão de recusar. Ignorar é a recusa, e ela não custa
              nada nem aparece em lugar nenhum. */}
        {onTinyHabit && ofertaReduzida.length > 0 && (
          <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* WP2.5 — o que a pessoa contou no onboarding volta AQUI, e
                só aqui: no momento em que o hábito custa, não numa tela de
                resumo. `soulStruggle` era escrito e nunca lido — perguntar
                algo pessoal, guardar e não devolver é extração. A frase é
                LOCAL (nada vai para a IA) e não repete o que falhou. */}
            {introStruggle && <p style={hint}>{introStruggle}</p>}
            {ofertaReduzida.map(h => {
              const name = h.name || (isPt ? 'Esse hábito' : 'This habit');
              if (accepted.includes(h.id)) {
                /* R6 — "aceitei": chip tonal selecionado, inerte, sem alpha. */
                return (
                  <div key={h.id} style={{ display: 'flex' }}>
                    <span
                      aria-disabled="true"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        minHeight: 44, padding: '0 16px 0 12px', borderRadius: 999,
                        boxSizing: 'border-box',
                        border: '1px solid var(--sm2-primary-ink)',
                        backgroundColor: 'var(--sm2-primary-soft)',
                        color: 'var(--sm2-primary-ink)',
                        fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm)',
                        fontWeight: 500, lineHeight: 'var(--sm2-leading-body)',
                      }}
                    >
                      <Icon name="check" size={20} fill={1} tone="inherit" />
                      {isPt ? `${name} · contou` : `${name} · counted`}
                    </span>
                  </div>
                );
              }
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => { onTinyHabit(h.id); setAccepted(prev => [...prev, h.id]); }}
                  style={{ ...sm2Button('outline'), width: '100%', justifyContent: 'flex-start', textAlign: 'left' }}
                >
                  {isPt ? `${name}: hoje, só 5 minutos?` : `${name}: just 5 minutes today?`}
                </button>
              );
            })}
            <p style={hint}>
              {isPt ? 'Aceitar já conta como feito.' : 'Saying yes already counts as done.'}
            </p>
          </div>
        )}
      </section>

      {/* (c) ATÉ 3 FOCOS */}
      <section style={section}>
        <p style={ritualLabel}>
          {isPt ? `Foco do dia (até ${MAX_DAILY_FOCUS})` : `Today’s focus (up to ${MAX_DAILY_FOCUS})`}
        </p>
        {candidates.length === 0 ? (
          <p style={hint}>
            {isPt
              ? 'Nenhuma tarefa esperando. Hoje é só cuidar dos hábitos.'
              : 'No tasks waiting. Today is habits only.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {candidates.map(t => {
              const active = selected.includes(t.id);
              const full = !active && selected.length >= MAX_DAILY_FOCUS;
              const effort = normalizeEffort(t.effort);
              const name = t.name || (isPt ? 'Tarefa sem nome' : 'Untitled task');
              // O esforço é a PALAVRA na tela e no rótulo — quem não vê a
              // tela escolhe foco sabendo o peso. `full` (limite de 3) é
              // `aria-disabled`, não `disabled`: o botão continua focável,
              // então dá para ler o que ficou de fora.
              const word = isPt ? EFFORT_WORD[effort].pt : EFFORT_WORD[effort].en;
              const effortText = isPt ? `esforço ${effort} de 3, ${word}` : `effort ${effort} of 3, ${word}`;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggle(t.id)}
                  aria-pressed={active}
                  aria-disabled={full || undefined}
                  aria-label={
                    full
                      ? isPt
                        ? `${name}, ${effortText}. Limite de ${MAX_DAILY_FOCUS} focos atingido — desmarque um para escolher este.`
                        : `${name}, ${effortText}. Limit of ${MAX_DAILY_FOCUS} focuses reached — unselect one to pick this.`
                      : `${name}, ${effortText}`
                  }
                  /* D-R4: escolhido = `primary-soft` + anel interno 1px;
                     não escolhido = `surface-2`; INERTE = sem fundo + tracejado
                     1px `muted` (forma), tinta `muted` — nunca `opacity`. A
                     fronteira vive em `border` (e não em `outline`) para não
                     apagar o anel de foco global do `:focus-visible`. */
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', minHeight: 44, padding: '0 12px',
                    boxSizing: 'border-box',
                    borderRadius: 'var(--sm2-radius-md)',
                    textAlign: 'left',
                    cursor: full ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--sm2-font-text)',
                    color: full ? 'var(--sm2-muted)' : 'var(--sm2-ink)',
                    backgroundColor: full ? 'transparent' : active ? 'var(--sm2-primary-soft)' : 'var(--sm2-surface-2)',
                    border: full ? '1px dashed var(--sm2-muted)' : '1px solid transparent',
                    boxShadow: active ? 'inset 0 0 0 1px var(--sm2-primary-ink)' : 'none',
                  }}
                >
                  {active
                    ? <Icon name="check_circle" size={24} fill={1} tone="primary" />
                    : <Icon name="radio_button_unchecked" size={24} tone="muted" />}
                  <span style={{ ...body, flex: 1, minWidth: 0, fontWeight: 500, color: 'inherit' }}>{name}</span>
                  <span style={hint}>{word}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* S2 — sem meta não há carga a mostrar ("Planned load: 0 points" era
            o mesmo zero pela porta de trás). "· chosen focus: 0" também some. */}
        {load > 0 && (
          <p style={hint}>
            {isPt ? 'Carga planejada: ' : 'Planned load: '}
            <span className="sm2-num" style={{ color: 'var(--sm2-ink)', fontWeight: 500 }}>{load}</span>
            {' '}{points(load)}
            {focusEffort > 0 && (
              <>
                {isPt ? ' · foco escolhido: ' : ' · chosen focus: '}
                <span className="sm2-num" style={{ color: 'var(--sm2-ink)', fontWeight: 500 }}>{focusEffort}</span>
              </>
            )}
          </p>
        )}
      </section>

      {/* O aviso gentil do pet. AVISO, nunca bloqueio — o botão abaixo
          continua ativo, e isso é regra, não detalhe de implementação.
          D-R8: texto em `gold-ink` com `info` 20, sem moldura (a mesma peça
          da carga do dia na fila 2). */}
      {overcommitted && (
        <p
          role="status"
          style={{
            ...body, margin: 0,
            display: 'flex', gap: 8, alignItems: 'flex-start',
            color: 'var(--sm2-gold-ink)',
          }}
        >
          <Icon name="info" size={20} tone="gold" style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            {isPt
              ? 'Isso é bastante pra um dia só — quer deixar uma pra amanhã? (Tudo bem se não.)'
              : 'That’s a lot for one day — want to leave one for tomorrow? (It’s fine either way.)'}
          </span>
        </p>
      )}

      {/* Ações. Pular fica SEMPRE visível, em `outline` (D-R7). */}
      <div style={{ borderTop: '1px solid var(--sm2-line)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* WP2.3: o botão é um COMPROMISSO, não um "continuar" — foi só a
            troca desse texto que rendeu ao Duolingo dezenas de milhares de
            DAU (transcrição A2). Sem meta cadastrada não há o que assumir,
            então o texto volta a ser neutro. */}
        <button type="button" onClick={() => onConfirm(selected)} style={{ ...sm2Button('primary'), width: '100%' }}>
          {plan.plannedEffort > 0
            /* C9 (01/10/2026): "Commit" → "Definir"/"Set", a palavra do dono. */
            ? (isPt ? 'Definir' : 'Set')
            : (isPt ? 'Começar o dia' : 'Start the day')}
        </button>
        <button type="button" onClick={onSkip} style={{ ...sm2Button('outline'), width: '100%' }}>
          {isPt ? 'Hoje não, obrigado' : 'Not today, thanks'}
        </button>
      </div>
    </RitualDialog>
  );
}

export default MorningCheckIn;
