import { useEffect, useMemo, useState } from 'react';
import type { Language } from '../utils/i18n';
import { MAX_DAILY_FOCUS, normalizeEffort } from '../types/taskModel';
import { isOvercommitted } from '../utils/taskTriage';

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
}

export interface MorningCheckInProps {
  open: boolean;
  plan: CheckInPlanShape;
  language: Language;
  onConfirm: (focusIds: string[]) => void;
  onSkip: () => void;
}

export function MorningCheckIn({ open, plan, language, onConfirm, onSkip }: MorningCheckInProps) {
  const isPt = language === 'pt-BR';

  const carryOver = plan.carryOver ?? [];
  const habits = plan.habitsToday ?? [];
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

  const sectionTitle: React.CSSProperties = {
    margin: '0 0 8px',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '.02em',
    color: 'var(--sm-muted)',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isPt ? 'Check-in da manhã' : 'Morning check-in'}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(6, 24, 26, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        className="sm-card"
        style={{
          width: '100%',
          maxWidth: 380,
          maxHeight: '90vh',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 18px 12px',
            background: 'var(--sm-surface)',
            borderBottom: '1px solid var(--sm-line)',
          }}
        >
          <p className="sm-display" style={{ fontSize: '1rem', margin: 0, color: 'var(--sm-ink)' }}>
            {isPt ? 'Bom dia!' : 'Good morning!'}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 11.5, color: 'var(--sm-muted)', lineHeight: 1.5 }}>
            {isPt ? 'Vinte segundos e a gente começa.' : 'Twenty seconds and we’re off.'}
          </p>
        </div>

        <div style={{ overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* (a) PENDÊNCIAS DE ONTEM — primeiro, sempre que houver. */}
          {carryOver.length > 0 && (
            <section>
              <p style={sectionTitle}>{isPt ? 'FICOU DE ONTEM' : 'LEFT FROM YESTERDAY'}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {carryOver.map(t => (
                  <div
                    key={t.id}
                    style={{
                      padding: '8px 10px',
                      fontSize: 12.5,
                      color: 'var(--sm-ink)',
                      backgroundColor: 'var(--sm-surface)',
                      border: '1px solid color-mix(in srgb, var(--sm-px-copper) 40%, transparent)',
                    }}
                  >
                    {t.name || (isPt ? 'Tarefa sem nome' : 'Untitled task')}
                    {(t.postponedCount ?? 0) >= 1 && (
                      <span style={{ marginLeft: 6, fontSize: 10.5, color: 'var(--sm-muted)' }}>
                        {isPt
                          ? `· adiada ${t.postponedCount} ${t.postponedCount === 1 ? 'vez' : 'vezes'}`
                          : `· postponed ${t.postponedCount}${t.postponedCount === 1 ? ' time' : ' times'}`}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--sm-muted)', lineHeight: 1.5 }}>
                {isPt
                  ? 'Sem cobrança: só pra não começar o dia sem saber o que sobrou.'
                  : 'No blame: just so the day doesn’t start blind to what’s left.'}
              </p>
            </section>
          )}

          {/* (b) HÁBITOS DE HOJE */}
          <section>
            <p style={sectionTitle}>{isPt ? 'HÁBITOS DE HOJE' : 'TODAY’S HABITS'}</p>
            {habits.length === 0 ? (
              <p style={{ margin: 0, fontSize: 12, color: 'var(--sm-muted)', lineHeight: 1.5 }}>
                {isPt ? 'Nenhum hábito devido hoje. Dia leve.' : 'No habits due today. Light day.'}
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {habits.map(h => (
                  <span
                    key={h.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '5px 9px',
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--sm-ink)',
                      backgroundColor: 'var(--sm-bg)',
                      border: '1px solid color-mix(in srgb, var(--sm-px-cyan) 55%, transparent)',
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
          </section>

          {/* (c) ATÉ 3 FOCOS */}
          <section>
            <p style={sectionTitle}>
              {isPt ? `FOCO DO DIA (ATÉ ${MAX_DAILY_FOCUS})` : `TODAY’S FOCUS (UP TO ${MAX_DAILY_FOCUS})`}
            </p>
            {candidates.length === 0 ? (
              <p style={{ margin: 0, fontSize: 12, color: 'var(--sm-muted)', lineHeight: 1.5 }}>
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
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggle(t.id)}
                      aria-pressed={active}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        minHeight: 44,
                        padding: '8px 10px',
                        textAlign: 'left',
                        cursor: full ? 'not-allowed' : 'pointer',
                        opacity: full ? 0.5 : 1,
                        color: 'var(--sm-ink)',
                        backgroundColor: active ? 'var(--sm-primary-soft)' : 'var(--sm-bg)',
                        border: active
                          ? '2px solid var(--sm-px-cyan)'
                          : '2px solid color-mix(in srgb, var(--sm-px-copper) 35%, transparent)',
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: 12,
                          height: 12,
                          flexShrink: 0,
                          backgroundColor: active ? 'var(--sm-px-cyan)' : 'transparent',
                          border: active
                            ? '2px solid var(--sm-px-cyan)'
                            : '2px solid color-mix(in srgb, var(--sm-px-copper) 55%, transparent)',
                        }}
                      />
                      <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.4 }}>
                        {t.name || (isPt ? 'Tarefa sem nome' : 'Untitled task')}
                      </span>
                      <span aria-hidden="true" style={{ display: 'inline-flex', gap: 2, flexShrink: 0 }}>
                        {[1, 2, 3].map(n => (
                          <span
                            key={n}
                            style={{
                              width: 5,
                              height: 5,
                              backgroundColor: n <= effort ? 'var(--sm-px-cyan)' : 'var(--sm-line)',
                            }}
                          />
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--sm-muted)', lineHeight: 1.5 }}>
              {isPt
                ? `Carga planejada: ${plan.plannedEffort} pontos · foco escolhido: ${focusEffort}`
                : `Planned load: ${plan.plannedEffort} points · chosen focus: ${focusEffort}`}
            </p>
          </section>

          {/* O aviso gentil do pet. AVISO, nunca bloqueio — o botão abaixo
              continua ativo, e isso é regra, não detalhe de implementação. */}
          {overcommitted && (
            <div
              role="status"
              style={{
                padding: '10px 12px',
                fontSize: 12,
                lineHeight: 1.5,
                color: 'var(--sm-ink)',
                backgroundColor: 'color-mix(in srgb, #d9a441 14%, var(--sm-surface))',
                border: '1px solid color-mix(in srgb, #d9a441 55%, transparent)',
              }}
            >
              {isPt
                ? 'Isso é bastante pra um dia só — quer deixar uma pra amanhã? (Tudo bem se não.)'
                : 'That’s a lot for one day — want to leave one for tomorrow? (It’s fine either way.)'}
            </div>
          )}
        </div>

        {/* Ações. Pular fica SEMPRE visível e sem tom de desistência. */}
        <div
          style={{
            padding: 16,
            background: 'var(--sm-surface)',
            borderTop: '1px solid var(--sm-line)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <button onClick={() => onConfirm(selected)} className="sm-btn" style={{ width: '100%' }}>
            {isPt ? 'Começar o dia' : 'Start the day'}
          </button>
          <button onClick={onSkip} className="sm-btn sm-btn-secondary" style={{ width: '100%' }}>
            {isPt ? 'Hoje não, obrigado' : 'Not today, thanks'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MorningCheckIn;
