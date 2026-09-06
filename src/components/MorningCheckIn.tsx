import { useEffect, useLayoutEffect, useMemo, useState, type CSSProperties } from 'react';
import type { Language } from '../utils/i18n';
import { MAX_DAILY_FOCUS, normalizeEffort } from '../types/taskModel';
import { tinyOfferIntro } from '../utils/tinyOffer';
import { isOvercommitted } from '../utils/taskTriage';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { Icon } from './ui/Icon';
import { SM2_SHADOW_CARD, sm2Button, sm2Hint, sm2Text, sm2TitleStyle } from './form/FormKit';

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
 * ONDA 5: saiu o kit de arcade (moldura de cobre em cada pendência, caixa em
 * cada hábito, os três quadradinhos de esforço que cifravam a palavra ao lado).
 * Superfície limpa nos tokens `--sm2-*`, raio 12.
 *
 * Componente puramente apresentacional: nada de GameState, nada de
 * localStorage. O plano vem pronto (`checkInPlan`) e quem grava é o pai.
 */

/** Um hábito devido hoje. Só `id` é exigido — o resto é o que houver. */
export interface CheckInHabitItem {
  id: string;
  name?: string;
  emoji?: string;
  /** Ícone de maturidade do hábito (`habitTierIcon`), se o pai já calculou. */
  tierIcon?: string;
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
}

const EFFORT_WORD: Record<number, { pt: string; en: string }> = {
  1: { pt: 'rápida', en: 'quick' },
  2: { pt: 'média', en: 'medium' },
  3: { pt: 'projeto', en: 'project' },
};

const hint = sm2Hint;
const body = sm2Text;

const sectionTitle: CSSProperties = { ...sm2Hint, margin: '0 0 8px', fontWeight: 500, letterSpacing: '.02em' };

export function MorningCheckIn({ open, plan, language, onConfirm, onSkip, onTinyHabit, soulStruggle }: MorningCheckInProps) {
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

  // `aria-modal="true"` é uma promessa: nada fora daqui existe agora. Sem trap
  // o Tab passeava pela lista de tarefas atrás do véu, e não havia Escape.
  // Fechar pelo teclado equivale a "hoje não, obrigado" — nunca a confirmar um
  // plano que a pessoa não escolheu.
  const dialogRef = useDialogA11y<HTMLDivElement>(open, onSkip);

  /* ── O PONTO DE ENTRADA DO FOCO É O CARTÃO, E ELE É DAQUI ────────────────
     Este diálogo não é aberto por um toque da pessoa: ele é o primeiro item
     da fila de intersticiais e MONTA SOZINHO na abertura do app. Quem chega
     de teclado ou leitor de tela não tem um "eu cliquei em alguma coisa" para
     ancorar o que acabou de acontecer — então a entrada do foco tem que ser
     inequívoca, e tem que ser o CARTÃO.

     Duas coisas mudam em relação a deixar isso por conta do `useDialogA11y`:

      1. **QUANDO.** O foco inicial do hook vive num efeito PASSIVO, que só
         roda depois da pintura e depois de todos os efeitos de layout do
         commit — inclusive os de quem estava montado antes na fila (o
         relatório diário devolvendo o foco a quem o abriu, por exemplo).
         Aqui ele é de LAYOUT: acontece no próprio commit, antes de a tela
         pintar, e nenhum outro efeito pode chegar antes com um `focus()` de
         despedida. O hook enxerga o foco já dentro do diálogo
         (`!node.contains(activeElement)`) e respeita — é o mesmo caminho que
         o `autoFocus` do `MorningDream` já usava, e está documentado lá.

      2. **ONDE.** O primeiro focável do cartão é a primeira TAREFA da lista
         de focos, lá no meio da tela: quem usa leitor caía em "Escrever o
         relatório, esforço 2 de 3, média, botão" (medido) e nunca ouvia o
         nome do diálogo, o "Bom dia" nem a seção de pendências de ontem, que
         é justamente a primeira coisa que esta tela existe para dizer.
         Focando o container (`tabIndex={-1}`, declarado no JSX e não herdado
         do último recurso do hook), o leitor anuncia o diálogo pelo nome e lê
         do começo; o primeiro Tab entra na lista.

     O trap, o Escape, o fundo inerte e a devolução do foco continuam sendo do
     hook — nada disso é reimplementado aqui. */
  useLayoutEffect(() => {
    if (!open) return;
    const node = dialogRef.current;
    if (!node) return;
    if (node.contains(document.activeElement)) return;
    node.focus({ preventScroll: true });
  }, [open, dialogRef]);

  // Progresso dotado (Nunes & Drèze): ninguém começa em 0%. A tela abre com a
  // sugestão já marcada, e desmarcar é um toque.
  useEffect(() => {
    if (!open) return;
    setSelected(candidates.slice(0, MAX_DAILY_FOCUS).map(t => t.id));
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

  const overcommitted = plan.overcommitted || isOvercommitted(plan.plannedEffort);
  // Pluralização: "Planned load: 1 points" era o primeiro texto que o usuário
  // novo lia depois de nascer o pet.
  const points = (n: number) => (isPt ? (n === 1 ? 'ponto' : 'pontos') : (n === 1 ? 'point' : 'points'));

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(6, 24, 26, .55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={isPt ? 'Check-in da manhã' : 'Morning check-in'}
        /* Focável por programa, FORA da ordem de Tab — ver a nota do efeito
           de layout lá em cima. Declarado aqui de propósito: o hook põe o
           mesmo `-1` como último recurso, e depender disso deixaria o ponto
           de entrada desta tela invisível em quem lê o JSX. */
        tabIndex={-1}
        /* Sem anel de foco no cartão: ele recebe o foco por MONTAGEM, não por
           navegação, e um contorno de 380px em volta do diálogo inteiro leria
           como "isto está selecionado". Quem navega de teclado só volta aqui
           por Shift+Tab a partir do primeiro botão, e o foco visível dos
           controles continua intacto. */
        style={{
          outline: 'none',
          width: '100%',
          maxWidth: 380,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: 'var(--sm2-surface)',
          borderRadius: 12,
          boxShadow: SM2_SHADOW_CARD,
        }}
      >
        <div style={{ padding: '18px 18px 0' }}>
          <p className="sm2-title" style={sm2TitleStyle}>
            {isPt ? 'Bom dia!' : 'Good morning!'}
          </p>
          <p style={{ ...hint, marginTop: 4 }}>
            {isPt ? 'Vinte segundos e a gente começa.' : 'Twenty seconds and we’re off.'}
          </p>
        </div>

        <div style={{ overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* (a) PENDÊNCIAS DE ONTEM — primeiro, sempre que houver.
              As molduras de cobre saíram: uma lista de linhas é uma lista. */}
          {carryOver.length > 0 && (
            <section>
              <p style={sectionTitle}>
                {isPt ? 'Ficou de ontem — sem cobrança' : 'Left from yesterday — no blame'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {carryOver.map(t => (
                  <p key={t.id} style={{ ...body, margin: 0 }}>
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
              </div>
            </section>
          )}

          {/* (b) HÁBITOS DE HOJE. O emoji é do usuário — conteúdo, e fica. */}
          <section>
            <p style={sectionTitle}>{isPt ? 'Hábitos de hoje' : 'Today’s habits'}</p>
            {habits.length === 0 ? (
              <p style={hint}>
                {isPt ? 'Nenhum hábito devido hoje. Dia leve.' : 'No habits due today. Light day.'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {habits.map(h => (
                  <span
                    key={h.id}
                    style={{
                      ...body,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 10px',
                      borderRadius: 999,
                      fontSize: 'var(--sm2-text-xs)',
                      backgroundColor: 'var(--sm2-surface-2)',
                    }}
                    title={
                      h.anchor?.after
                        ? `${h.anchor.after}${h.anchor.where ? ` — ${h.anchor.where}` : ''}`
                        : undefined
                    }
                  >
                    {(h.tierIcon || h.emoji) && (
                      <span aria-hidden="true" style={{ fontSize: 14, lineHeight: 1 }}>
                        {h.tierIcon || h.emoji}
                      </span>
                    )}
                    {h.name || (isPt ? 'Hábito' : 'Habit')}
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
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* WP2.5 — o que a pessoa contou no onboarding volta AQUI, e
                    só aqui: no momento em que o hábito custa, não numa tela de
                    resumo. `soulStruggle` era escrito e nunca lido — perguntar
                    algo pessoal, guardar e não devolver é extração. A frase é
                    LOCAL (nada vai para a IA) e não repete o que falhou. */}
                {introStruggle && <p style={hint}>{introStruggle}</p>}
                {ofertaReduzida.map(h => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => onTinyHabit(h.id)}
                    style={{ ...sm2Button('ghost'), width: '100%', justifyContent: 'flex-start' }}
                  >
                    {isPt
                      ? `${h.name || 'Esse hábito'}: hoje, só 5 minutos?`
                      : `${h.name || 'This habit'}: just 5 minutes today?`}
                  </button>
                ))}
                <p style={hint}>
                  {isPt
                    ? 'Aceitar já conta como feito.'
                    : 'Saying yes already counts as done.'}
                </p>
              </div>
            )}
          </section>

          {/* (c) ATÉ 3 FOCOS */}
          <section>
            <p style={sectionTitle}>
              {isPt ? `Foco do dia (até ${MAX_DAILY_FOCUS})` : `Today’s focus (up to ${MAX_DAILY_FOCUS})`}
            </p>
            {candidates.length === 0 ? (
              <p style={hint}>
                {isPt
                  ? 'Nenhuma tarefa esperando. Hoje é só cuidar dos hábitos.'
                  : 'No tasks waiting. Today is habits only.'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {candidates.map(t => {
                  const active = selected.includes(t.id);
                  const full = !active && selected.length >= MAX_DAILY_FOCUS;
                  const effort = normalizeEffort(t.effort);
                  const name = t.name || (isPt ? 'Tarefa sem nome' : 'Untitled task');
                  // O esforço só existia como três pontinhos `aria-hidden`:
                  // quem não vê a tela escolhia foco sem saber o peso. Agora é
                  // a PALAVRA na tela e no rótulo. E `full` (limite de 3
                  // atingido) precisa de `aria-disabled` — antes era só
                  // opacidade e cursor, que nenhum leitor de tela anuncia.
                  // `aria-disabled` e não `disabled`: o botão continua focável,
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
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        minHeight: 44,
                        padding: '8px 12px',
                        borderRadius: 10,
                        textAlign: 'left',
                        cursor: full ? 'not-allowed' : 'pointer',
                        opacity: full ? 0.5 : 1,
                        color: 'var(--sm2-ink)',
                        backgroundColor: active ? 'var(--sm2-primary-soft)' : 'var(--sm2-surface-2)',
                        border: active ? '1px solid var(--sm2-primary-ink)' : '1px solid var(--sm2-line)',
                      }}
                    >
                      {/* FILL 0→1 é o estado: o MESMO glifo se preenchendo. */}
                      <Icon name="check_circle" size={20} fill={active ? 1 : 0}
                        tone={active ? 'primary' : 'muted'} />
                      <span style={{ ...body, flex: 1 }}>{name}</span>
                      <span style={hint}>{word}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <p style={{ ...hint, marginTop: 8 }}>
              {isPt ? 'Carga planejada: ' : 'Planned load: '}
              <span className="sm2-num">{plan.plannedEffort}</span> {points(plan.plannedEffort)}
              {isPt ? ' · foco escolhido: ' : ' · chosen focus: '}
              <span className="sm2-num">{focusEffort}</span>
            </p>
          </section>

          {/* O aviso gentil do pet. AVISO, nunca bloqueio — o botão abaixo
              continua ativo, e isso é regra, não detalhe de implementação. */}
          {overcommitted && (
            <div
              role="status"
              style={{
                ...body,
                fontSize: 'var(--sm2-text-xs)',
                padding: '10px 12px',
                borderRadius: 10,
                backgroundColor: 'color-mix(in srgb, var(--sm2-gold-fill) 14%, var(--sm2-surface))',
                border: '1px solid var(--sm2-gold-fill)',
              }}
            >
              {isPt
                ? 'Isso é bastante pra um dia só — quer deixar uma pra amanhã? (Tudo bem se não.)'
                : 'That’s a lot for one day — want to leave one for tomorrow? (It’s fine either way.)'}
            </div>
          )}
        </div>

        {/* Ações. Pular fica SEMPRE visível e sem tom de desistência. */}
        <div style={{ padding: 16, borderTop: '1px solid var(--sm2-line)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* WP2.3: o botão é um COMPROMISSO, não um "continuar" — foi só a
              troca desse texto que rendeu ao Duolingo dezenas de milhares de
              DAU (transcrição A2). Sem meta cadastrada não há o que assumir,
              então o texto volta a ser neutro. */}
          <button type="button" onClick={() => onConfirm(selected)} style={{ ...sm2Button('primary'), width: '100%' }}>
            {plan.plannedEffort > 0
              ? (isPt ? 'Assumir minha meta de hoje' : 'Commit to today’s goal')
              : (isPt ? 'Começar o dia' : 'Start the day')}
          </button>
          <button type="button" onClick={onSkip} style={{ ...sm2Button('ghost'), width: '100%' }}>
            {isPt ? 'Hoje não, obrigado' : 'Not today, thanks'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MorningCheckIn;
