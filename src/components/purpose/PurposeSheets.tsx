import { useMemo, useState } from 'react';
import { Chip, Field, ModalSheet, SwitchRow, sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import type { Language } from '../../utils/i18n';
import type { CatalogItem } from '../../types/activityCatalog';
import { PathCards } from './PathCards';
import { PATH_COPY } from '../../utils/purposePaths';
import {
  PURPOSE_GOAL_MIN, PURPOSE_MAX_PRIORITIES, PURPOSE_NOTE_MAX, OBSTACLE_KEYS, PERCEIVED_KEYS, DECISION_KEYS,
  type MilestoneStatus, type ObstacleKey, type Perceived, type Purpose, type PurposePath, type ReviewDecision,
} from '../../utils/purpose';
import { DECISION_LABEL, MOTIVE_LABEL, OBSTACLE_LABEL, PERCEIVED_LABEL, PLAN_SUGGESTIONS, evidenceSentence, tx } from '../../utils/purposeCopy';
import {
  evidence, monthsEndingAt, openMilestone, type ReviewInput, type ReviewOffer, type WeekRow,
} from '../../utils/purposeReview';
import {
  EMPTY_DRAFT, MotiveFields, PlanFields, PriorityLimitNote, PriorityStar, YearGoalFields, applyDraft, draftFromPurpose,
  type PurposeDraft,
} from './PurposeFields';

/**
 * AS FOLHAS DO OBJETIVO ANUAL (E3, E4, E6-E9). Um chunk só, carregado por `lazy`
 * a partir do App; nada aqui entra no bundle de entrada.
 */

export interface ActivityLite { id: string; name: string; emoji?: string }

const row = { display: 'flex', flexWrap: 'wrap' as const, gap: 8 };

/** As prioridades (até 3) marcadas com estrela sobre os hábitos que a pessoa já tem. */
function PriorityPicker({ isPt, activities, value, onChange }: { isPt: boolean; activities: ActivityLite[]; value: string[]; onChange: (v: string[]) => void }) {
  const [limit, setLimit] = useState(false);
  if (activities.length === 0) return <p style={sm2Hint}>{tx('noPriorities', isPt)}</p>;
  return (
    <div data-purpose-priorities>
      <p style={{ ...sm2Hint, margin: '0 0 6px' }}>{tx('priorityHint', isPt)}</p>
      {activities.map(a => (
        <div key={a.id} style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ ...sm2Text, flex: 1, minWidth: 0 }}>{a.emoji ? `${a.emoji} ` : ''}{a.name}</span>
          <PriorityStar isPt={isPt} on={value.includes(a.id)} onToggle={() => {
            if (value.includes(a.id)) { onChange(value.filter(x => x !== a.id)); setLimit(false); return; }
            if (value.length >= PURPOSE_MAX_PRIORITIES) { setLimit(true); return; }
            onChange([...value, a.id]);
          }} />
        </div>
      ))}
      {limit && <PriorityLimitNote isPt={isPt} />}
    </div>
  );
}

// ── E4: Meu objetivo ────────────────────────────────────────────────────────

export function MeuObjetivoSheet({ open, onClose, language, purpose, activities, onSave, startEditing = false, onSwitchCard }: {
  open: boolean; onClose: () => void; language: Language; purpose: Purpose | undefined; activities: ActivityLite[];
  onSave: (next: Purpose) => void; startEditing?: boolean;
  /** Troca de carta livre (Perfil): abre as 3 cartas. */
  onSwitchCard?: () => void;
}) {
  const isPt = language === 'pt-BR';
  const [editing, setEditing] = useState(startEditing || !purpose?.goal);
  const [draft, setDraft] = useState<PurposeDraft>(() => draftFromPurpose(purpose));
  const [priorities, setPriorities] = useState<string[]>(purpose?.priorities ?? []);
  const names = useMemo(() => new Map(activities.map(a => [a.id, a])), [activities]);
  const goal = purpose?.goal;
  const canSave = draft.goalText.trim().length >= PURPOSE_GOAL_MIN;

  const save = () => {
    const next = applyDraft(purpose, draft, goal?.areas ?? [], new Date());
    if (!next) return;
    onSave({ ...next, priorities, promptedExisting: true });
    setEditing(false);
  };
  const startEdit = () => { setDraft(draftFromPurpose(purpose)); setPriorities(purpose?.priorities ?? []); setEditing(true); };

  return (
    <ModalSheet open={open} title={tx('myGoal', isPt)} onClose={onClose} language={language}
      footer={editing ? (
        <button type="button" style={{ ...sm2Button('primary', !canSave), width: '100%' }} onClick={save} aria-disabled={!canSave || undefined}>{tx('save', isPt)}</button>
      ) : undefined}>
      {editing ? (
        <div data-meu-objetivo-edit>
          <YearGoalFields isPt={isPt} areas={goal?.areas ?? []} draft={draft} onChange={setDraft} />
          <div style={{ marginTop: 20 }}><MotiveFields isPt={isPt} draft={draft} onChange={setDraft} /></div>
          <p style={{ ...sm2Text, margin: '20px 0 8px' }}>{tx('planTitle', isPt)}</p>
          <PlanFields isPt={isPt} draft={draft} onChange={setDraft} />
          <p style={{ ...sm2Text, margin: '20px 0 8px' }}>{tx('myPriorities', isPt)}</p>
          <PriorityPicker isPt={isPt} activities={activities} value={priorities} onChange={setPriorities} />
        </div>
      ) : goal ? (
        <div data-meu-objetivo-view>
          <p style={{ ...sm2Text, margin: '0 0 4px', fontSize: 'var(--sm2-text-lg)' }}>{goal.text}</p>
          <p style={{ ...sm2Hint, margin: '0 0 16px' }}>{tx('goalSince', isPt)} {goal.createdAt}</p>
          {purpose?.motive && (
            <section style={{ marginBottom: 14 }}>
              <p style={sm2Hint}>{tx('myWhy', isPt)}</p>
              <p style={{ ...sm2Text, margin: 0 }}>{purpose.motive.key === 'other' && purpose.motive.customText ? purpose.motive.customText : (isPt ? MOTIVE_LABEL[purpose.motive.key].pt : MOTIVE_LABEL[purpose.motive.key].en)}</p>
            </section>
          )}
          {purpose?.motive?.phrase && (
            <section style={{ marginBottom: 14 }}>
              <p style={sm2Hint}>{tx('myPhrase', isPt)}</p>
              <p style={{ ...sm2Text, margin: 0 }}>{purpose.motive.phrase}</p>
            </section>
          )}
          {purpose?.plan && (
            <section style={{ marginBottom: 14 }}>
              <p style={sm2Hint}>{tx('myPlan', isPt)}</p>
              <p style={{ ...sm2Text, margin: 0 }}>
                {purpose.plan.obstacleKey === 'other' && purpose.plan.obstacleText ? purpose.plan.obstacleText : (isPt ? OBSTACLE_LABEL[purpose.plan.obstacleKey].pt : OBSTACLE_LABEL[purpose.plan.obstacleKey].en)}
                {' → '}{tx('planWhen', isPt).replace('…', '')}{purpose.plan.response}
              </p>
            </section>
          )}
          <section style={{ marginBottom: 14 }}>
            <p style={sm2Hint}>{tx('myPriorities', isPt)}</p>
            {(purpose?.priorities ?? []).length === 0
              ? <p style={{ ...sm2Text, margin: 0 }}>{tx('noPriorities', isPt)}</p>
              : (purpose?.priorities ?? []).map(id => <p key={id} style={{ ...sm2Text, margin: 0 }}>{names.get(id)?.emoji ? `${names.get(id)!.emoji} ` : ''}{names.get(id)?.name ?? id}</p>)}
          </section>
          <button type="button" style={{ ...sm2Button('outline'), width: '100%', marginBottom: 12 }} onClick={startEdit}>{tx('edit', isPt)}</button>
          <SwitchRow checked={purpose?.prefs.voiceReminder !== false} label={tx('voiceToggle', isPt)} hint={tx('voiceToggleHint', isPt)}
            onToggle={() => purpose && onSave({ ...purpose, prefs: { ...purpose.prefs, voiceReminder: purpose.prefs.voiceReminder === false } })} />
          {(purpose?.history.length ?? 0) > 0 && (
            <section style={{ marginTop: 16 }}>
              <p style={sm2Hint}>{tx('history', isPt)}</p>
              {purpose!.history.slice().reverse().map((h, i) => <p key={i} style={{ ...sm2Text, margin: '0 0 4px' }}>{h.text} <span style={sm2Hint}>({h.createdAt})</span></p>)}
            </section>
          )}
        </div>
      ) : (
        <div>
          <p style={{ ...sm2Text, margin: '0 0 12px' }}>{tx('myGoalEmpty', isPt)}</p>
          <button type="button" style={{ ...sm2Button('primary'), width: '100%' }} onClick={startEdit}>{tx('setGoal', isPt)}</button>
        </div>
      )}
      {onSwitchCard && (
        <button type="button" data-switch-card style={{ ...sm2Button('quiet'), width: '100%', marginTop: 12 }} onClick={onSwitchCard}>
          {tx('switchCard', isPt)}{purpose?.path ? ` (${isPt ? PATH_COPY[purpose.path].name.pt : PATH_COPY[purpose.path].name.en})` : ''}
        </button>
      )}
    </ModalSheet>
  );
}

// ── E3: modal do jogador existente ──────────────────────────────────────────

export function PurposeInviteModal({ language, areas, activities, onSave, onNotNow }: {
  language: Language; areas: string[]; activities: ActivityLite[]; onSave: (next: Purpose) => void; onNotNow: () => void;
}) {
  const isPt = language === 'pt-BR';
  const [draft, setDraft] = useState<PurposeDraft>(EMPTY_DRAFT);
  const [priorities, setPriorities] = useState<string[]>([]);
  const canSave = draft.goalText.trim().length >= PURPOSE_GOAL_MIN;
  return (
    <ModalSheet open title={tx('existingTitle', isPt)} onClose={onNotNow} language={language} placement="center" dismissOnBackdrop={false}
      footer={(
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" data-purpose-notnow style={{ ...sm2Button('outline'), flex: 1 }} onClick={onNotNow}>{tx('notNow', isPt)}</button>
          <button type="button" data-purpose-save style={{ ...sm2Button('primary', !canSave), flex: 1 }} aria-disabled={!canSave || undefined}
            onClick={() => { if (!canSave) return; const p = applyDraft(undefined, draft, areas, new Date()); if (p) onSave({ ...p, priorities, promptedExisting: true }); }}>
            {tx('save', isPt)}
          </button>
        </div>
      )}>
      <p style={{ ...sm2Hint, margin: '0 0 14px' }}>{tx('existingHint', isPt)}</p>
      <YearGoalFields isPt={isPt} areas={areas} draft={draft} onChange={setDraft} />
      <div style={{ marginTop: 20 }}><MotiveFields isPt={isPt} draft={draft} onChange={setDraft} /></div>
      <p style={{ ...sm2Text, margin: '20px 0 8px' }}>{tx('planTitle', isPt)}</p>
      <PlanFields isPt={isPt} draft={draft} onChange={setDraft} />
      <p style={{ ...sm2Text, margin: '20px 0 8px' }}>{tx('myPriorities', isPt)}</p>
      <PriorityPicker isPt={isPt} activities={activities} value={priorities} onChange={setPriorities} />
    </ModalSheet>
  );
}

// ── E6: a semanal (dentro do relatório de domingo) ─────────────────────────

export function WeeklyPriorities({ language, rows, names, answered, onAnswer }: {
  language: Language; rows: WeekRow[]; names: Map<string, ActivityLite>; answered: boolean; onAnswer: (obstacles: ObstacleKey[]) => void;
}) {
  const isPt = language === 'pt-BR';
  const [picked, setPicked] = useState<ObstacleKey | null>(null);
  const [done, setDone] = useState(answered);
  if (rows.length === 0) return null;
  return (
    <section data-weekly-priorities className="sm2-notice" aria-label={tx('weeklyTitle', isPt)}>
      <p className="sm2-notice-title">{tx('weeklyTitle', isPt)}</p>
      {rows.map(r => (
        <p key={r.id} className="sm2-notice-body" style={{ margin: '2px 0' }}>
          {names.get(r.id)?.emoji ? `${names.get(r.id)!.emoji} ` : ''}{names.get(r.id)?.name ?? ''}: <strong className="sm2-num">{evidenceSentence(r.done, r.due, isPt)}</strong>
        </p>
      ))}
      {done ? <p className="sm2-notice-body" role="status">{tx('weeklyDone', isPt)}</p> : (
        <>
          <p className="sm2-notice-body" style={{ margin: '10px 0 6px' }}>{tx('weeklyAsk', isPt)}</p>
          <div style={row}>
            {OBSTACLE_KEYS.map(k => (
              <Chip key={k} selected={picked === k} onToggle={() => { setPicked(k); onAnswer([k]); setDone(true); }}>{isPt ? OBSTACLE_LABEL[k].pt : OBSTACLE_LABEL[k].en}</Chip>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// ── E7-E9: mensal / semestral / anual ───────────────────────────────────────

type Step = 'evidence' | 'perceived' | 'obstacles' | 'note' | 'decision' | 'tasks' | 'next';

export function GoalReviewSheet({ open, onClose, language, purpose, offer, names, onComplete, askTasks = false }: {
  open: boolean; onClose: () => void; language: Language; purpose: Purpose; offer: ReviewOffer; names: Map<string, ActivityLite>;
  onComplete: (input: ReviewInput) => void;
  /** `shouldAskReviewTasks(...)`: mostra o passo "Você quer rever suas tarefas?" antes do último. */
  askTasks?: boolean;
}) {
  const isPt = language === 'pt-BR';
  const months = useMemo(() => monthsEndingAt(offer.monthKey, offer.kind === 'month' ? 1 : 6), [offer]);
  const ev = useMemo(() => evidence(purpose, months), [purpose, months]);
  const base: Step[] = offer.kind === 'month'
    ? ['evidence', 'perceived', 'obstacles', 'decision', 'next']
    : ['evidence', 'perceived', 'obstacles', 'note', 'decision', 'next'];
  const steps: Step[] = askTasks ? [...base.slice(0, -1), 'tasks', 'next'] : base;
  const [reviewTasks, setReviewTasks] = useState<boolean | undefined>();
  const [plansChanged, setPlansChanged] = useState(false);
  const [i, setI] = useState(0);
  const [perceived, setPerceived] = useState<Perceived | undefined>();
  const [obstacles, setObstacles] = useState<ObstacleKey[]>([]);
  const [decision, setDecision] = useState<ReviewDecision | undefined>();
  const [note, setNote] = useState('');
  const [prevStatus, setPrevStatus] = useState<MilestoneStatus | undefined>();
  const [next, setNext] = useState('');
  const [archive, setArchive] = useState(false);
  const prev = openMilestone(purpose, offer.kind === 'month' ? 'month' : 'semester');
  const step = steps[i];
  const last = i === steps.length - 1;

  const title = offer.kind === 'month' ? tx('monthTitle', isPt) : offer.kind === 'semester' ? tx('semesterTitle', isPt) : tx('yearTitleReview', isPt);
  const finish = () => onComplete({ perceived, obstacles, decision, note, previousStatus: prevStatus, nextMilestone: next, archiveGoal: offer.kind === 'year' && archive, reviewTasks: askTasks ? !!reviewTasks : undefined, plansChanged: askTasks && purpose.path === 'ambicao' ? plansChanged : undefined });

  return (
    <ModalSheet open={open} title={title} onClose={onClose} language={language} dismissOnBackdrop={false}
      footer={(
        <div style={{ display: 'flex', gap: 8 }}>
          {i > 0 && <button type="button" style={{ ...sm2Button('outline'), flex: 1 }} onClick={() => setI(i - 1)}>{tx('back', isPt)}</button>}
          <button type="button" data-review-next style={{ ...sm2Button('primary'), flex: 1 }} onClick={() => (last ? finish() : setI(i + 1))}>
            {last ? tx('finish', isPt) : tx('next', isPt)}
          </button>
        </div>
      )}>
      <div data-review-step={step}>
        {step === 'evidence' && (
          <>
            <p style={{ ...sm2Text, margin: '0 0 10px' }}>{tx('stepEvidence', isPt)}</p>
            {!ev.has ? <p style={sm2Hint}>{tx('evidenceNone', isPt)}</p> : (
              <>
                {ev.rows.map(r => (
                  <p key={r.id} style={{ ...sm2Text, margin: '0 0 4px' }}>
                    {names.get(r.id)?.emoji ? `${names.get(r.id)!.emoji} ` : ''}{names.get(r.id)?.name ?? ''}: <strong className="sm2-num">{evidenceSentence(r.done, r.due, isPt)}</strong>
                  </p>
                ))}
                <p style={{ ...sm2Text, margin: '10px 0 4px' }}>{tx('evidenceTotal', isPt)}: <strong className="sm2-num">{evidenceSentence(ev.total.done, ev.total.due, isPt)}</strong></p>
                {ev.total.done < ev.total.due && <p style={sm2Hint}>{tx('evidenceAsk', isPt)}</p>}
              </>
            )}
          </>
        )}
        {step === 'perceived' && (
          <>
            <p style={{ ...sm2Text, margin: '0 0 10px' }}>{tx('stepPerceived', isPt)}</p>
            <div role="radiogroup" aria-label={tx('stepPerceived', isPt)} style={row}>
              {PERCEIVED_KEYS.map(k => <Chip key={k} selected={perceived === k} onToggle={() => setPerceived(perceived === k ? undefined : k)}>{isPt ? PERCEIVED_LABEL[k].pt : PERCEIVED_LABEL[k].en}</Chip>)}
            </div>
          </>
        )}
        {step === 'obstacles' && (
          <>
            <p style={{ ...sm2Text, margin: '0 0 10px' }}>{tx('stepObstacles', isPt)}</p>
            <div role="group" aria-label={tx('stepObstacles', isPt)} style={row}>
              {OBSTACLE_KEYS.map(k => (
                <Chip key={k} selected={obstacles.includes(k)} onToggle={() => setObstacles(o => (o.includes(k) ? o.filter(x => x !== k) : o.length >= 3 ? o : [...o, k]))}>
                  {isPt ? OBSTACLE_LABEL[k].pt : OBSTACLE_LABEL[k].en}
                </Chip>
              ))}
            </div>
          </>
        )}
        {step === 'note' && (
          <>
            <p style={{ ...sm2Text, margin: '0 0 6px' }}>{offer.kind === 'year' ? tx('yearLook', isPt) : tx('semesterChanged', isPt)}</p>
            <Field type="text" aria-label={tx('semesterChanged', isPt)} value={note} maxLength={PURPOSE_NOTE_MAX} placeholder={tx('notePlaceholder', isPt)} onChange={e => setNote(e.target.value)} />
          </>
        )}
        {step === 'decision' && (
          <>
            <p style={{ ...sm2Text, margin: '0 0 10px' }}>{offer.kind === 'month' ? tx('stepDecision', isPt) : tx('semesterStill', isPt)}</p>
            <div role="radiogroup" aria-label={tx('stepDecision', isPt)} style={row}>
              {DECISION_KEYS.map(k => <Chip key={k} selected={decision === k} onToggle={() => setDecision(decision === k ? undefined : k)}>{isPt ? DECISION_LABEL[k].pt : DECISION_LABEL[k].en}</Chip>)}
            </div>
            {offer.kind === 'year' && (
              <div style={{ ...row, marginTop: 14 }}>
                <Chip selected={archive} onToggle={() => setArchive(a => !a)}>{tx('yearArchive', isPt)}</Chip>
              </div>
            )}
          </>
        )}
        {step === 'tasks' && (
          <>
            <p style={{ ...sm2Text, margin: '0 0 10px' }}>{tx('tasksAsk', isPt)}</p>
            <div role="radiogroup" aria-label={tx('tasksAsk', isPt)} style={row}>
              <Chip selected={reviewTasks === true} onToggle={() => setReviewTasks(reviewTasks === true ? undefined : true)}>{tx('tasksYes', isPt)}</Chip>
              <Chip selected={reviewTasks === false} onToggle={() => { setReviewTasks(reviewTasks === false ? undefined : false); setPlansChanged(false); }}>{tx('tasksNo', isPt)}</Chip>
            </div>
            {purpose.path === 'ambicao' && (
              <div style={{ ...row, marginTop: 14 }}>
                <Chip selected={plansChanged} onToggle={() => setPlansChanged(v => !v)}>{tx('plansChanged', isPt)}</Chip>
              </div>
            )}
          </>
        )}
        {step === 'next' && (
          <>
            {prev && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ ...sm2Text, margin: '0 0 4px' }}>{tx('prevMilestone', isPt)}</p>
                <p style={{ ...sm2Hint, margin: '0 0 8px' }}>{prev.label}</p>
                <div role="radiogroup" aria-label={tx('prevMilestone', isPt)} style={row}>
                  {([['done', 'mDone'], ['partial', 'mPartial'], ['not', 'mNot']] as const).map(([s, k]) => (
                    <Chip key={s} selected={prevStatus === s} onToggle={() => setPrevStatus(prevStatus === s ? undefined : s)}>{tx(k, isPt)}</Chip>
                  ))}
                </div>
              </div>
            )}
            <p style={{ ...sm2Text, margin: '0 0 6px' }}>{offer.kind === 'month' ? tx('stepNext', isPt) : tx('semesterMilestone', isPt)}</p>
            <Field type="text" aria-label={tx('stepNext', isPt)} value={next} maxLength={120} placeholder={tx('nextPlaceholder', isPt)} onChange={e => setNext(e.target.value)} />
            {offer.kind === 'semester' && <p style={{ ...sm2Hint, marginTop: 14 }}>{tx('semesterReward', isPt)}</p>}
          </>
        )}
      </div>
    </ModalSheet>
  );
}

// ── as 3 cartas fora do onboarding: trocar de carta e refazer a escolha de tarefas ──

export function PathSwitchSheet({ open, onClose, language, current, onChoose }: {
  open: boolean; onClose: () => void; language: Language; current?: PurposePath; onChoose: (p: PurposePath) => void;
}) {
  const isPt = language === 'pt-BR';
  return (
    <ModalSheet open={open} title={tx('switchCardTitle', isPt)} onClose={onClose} language={language}>
      <p style={{ ...sm2Hint, margin: '0 0 12px' }}>{tx('switchCardHint', isPt)}</p>
      {current && <p style={{ ...sm2Hint, margin: '0 0 8px' }}>{tx('currentCard', isPt)}: {isPt ? PATH_COPY[current].name.pt : PATH_COPY[current].name.en}</p>}
      <PathCards isPt={isPt} selected={current} onChoose={onChoose} />
    </ModalSheet>
  );
}

/** Sugestões de tarefas (Ressurgimento: "quero mais" e a lista-base; Satisfação: o recomendador). Nada é adicionado sem o toque. */
export function TaskSuggestionsSheet({ open, onClose, language, items, title, hint, onAdd }: {
  open: boolean; onClose: () => void; language: Language; items: CatalogItem[]; title: string; hint?: string; onAdd: (items: CatalogItem[]) => void;
}) {
  const isPt = language === 'pt-BR';
  const [off, setOff] = useState<string[]>([]);
  const kept = items.filter(i => !off.includes(i.id));
  return (
    <ModalSheet open={open} title={title} onClose={onClose} language={language}
      footer={items.length > 0 ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" style={{ ...sm2Button('outline'), flex: 1 }} onClick={onClose}>{tx('suggestSkip', isPt)}</button>
          <button type="button" data-suggest-add style={{ ...sm2Button('primary', kept.length === 0), flex: 1 }} aria-disabled={kept.length === 0 || undefined}
            onClick={() => { if (kept.length) onAdd(kept); }}>{tx('suggestAdd', isPt)}</button>
        </div>
      ) : undefined}>
      {hint && <p style={{ ...sm2Hint, margin: '0 0 12px' }}>{hint}</p>}
      {items.length === 0 ? <p style={sm2Text}>{tx('suggestNone', isPt)}</p> : (
        <div data-suggest-list style={row}>
          {items.map(i => (
            <Chip key={i.id} selected={!off.includes(i.id)} onToggle={() => setOff(v => (v.includes(i.id) ? v.filter(x => x !== i.id) : [...v, i.id]))}>
              {i.emoji} {isPt ? i.name.pt : i.name.en}
            </Chip>
          ))}
        </div>
      )}
    </ModalSheet>
  );
}

// reexport para o App importar de um só lugar
export { PLAN_SUGGESTIONS };
