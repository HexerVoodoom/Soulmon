/**
 * OFICINA DO FOCO — o planejamento em ETAPAS (10/10/2026, `docs/PLANO-OFICINA-FOCO.md` §9).
 * Só desenha e coleta: a ordem das etapas, as escolhas e a lista final são de `utils/focoSessao.ts`.
 * Nada aqui toca nas tarefas do jogo — escolher/ordenar é local; concluir é a folha da Oficina.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { CheckRow, Field, Segment, sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { ModalInfo, InfoTipSection } from '../ui/InfoTip';
import { Icon } from '../ui/Icon';
import { TagChips } from './OficinaTags';
import { sheetCard, sheetCardList, sheetCardTitle } from '../nav/sheetKit';
import type { Language } from '../../utils/i18n';
import {
  FOCUS_ENVIRONMENTS, FOCUS_EXTRA_BASE_CHANCE, FOCUS_EXTRA_CHANCE_PER_CYCLE, FOCUS_EXTRA_MAX_CHANCE,
  FOCUS_LOOT_DAILY_CAP, isFocusEnvironmentId,
} from '../../utils/focusExpedition';
import { formatClock, type FocoModeId } from '../../utils/focoTimer';
import { readJson, removeLocal, writeJson } from '../../utils/safeStorage';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import {
  DUMP_MINUTE_OPTIONS, MAX_POOL, MAX_TWO_MIN, QUADRANTS, STEP_ORDER, buildPlan, canSave, dumpRemaining, lengthLabel,
  matrixOrder, missingToSave, nextStep, normalizeSession, toDraft, prevStep, setFrog, setQuadrant, startDump, stepNumber, toggleTwoMin,
  type PlanTask, type Quadrant, type SessionDraft, type StepId,
} from '../../utils/focoSessao';

const STEPS: Record<StepId, { pt: string; en: string; icon: string; infoPt: string; infoEn: string }> = {
  preparar: { pt: 'Preparar o foco', en: 'Prepare to focus', icon: 'task_alt', infoPt: 'Cuide de pequenas necessidades e prepare o espaço antes de começar. Marque apenas o que fizer sentido.', infoEn: 'Take care of small needs and prepare your space before starting. Check only what makes sense.' },
  ritmo: { pt: 'Escolher o ritmo', en: 'Choose a rhythm', icon: 'timer', infoPt: 'Pomodoro (25/5) ou blocos (50/10), e para onde o Soulmon vai enquanto você foca. O timer só começa depois, no card da sessão.', infoEn: 'Pomodoro (25/5) or blocks (50/10), and where Soulmon goes while you focus. The timer only starts later, from the session card.' },
  'dois-minutos': { pt: 'Regra dos dois minutos', en: 'Two-minute rule', icon: 'bolt', infoPt: `Toque nas tarefas que cabem em cerca de dois minutos (até ${MAX_TWO_MIN}). Elas abrem a lista, como aquecimento.`, infoEn: `Tap the tasks that fit in about two minutes (up to ${MAX_TWO_MIN}). They open your list as a warm-up.` },
  eisenhower: { pt: 'Matriz de Eisenhower', en: 'Eisenhower matrix', icon: 'schedule', infoPt: 'Classifique as tarefas que quiser. A lista abaixo se ordena sozinha: fazer, agendar, delegar. “Deixar de lado” sai da sessão. Isto não muda a sua Home.', infoEn: 'Sort any tasks you like. The list below orders itself: do, schedule, delegate. “Drop” leaves the session. This does not change your Home.' },
  sapo: { pt: 'O sapo primeiro', en: 'Eat the frog', icon: 'eco', infoPt: 'Escolha a tarefa mais difícil ou mais evitada. Ela vai logo depois dos dois minutos.', infoEn: 'Pick the hardest or most avoided task. It goes right after the two-minute items.' },
  'se-entao': { pt: 'Se… então…', en: 'If… then…', icon: 'flag', infoPt: 'Ligue um gatilho concreto a uma ação que você quer iniciar.', infoEn: 'Connect a concrete cue to an action you want to start.' },
  esvaziar: { pt: 'Descarregar a mente', en: 'Brain dump', icon: 'psychology', infoPt: 'Tirar da cabeça o que ocupa espaço deixa a atenção livre para a sessão. Não precisa organizar nem resolver: só escrever. O que for pendência, anote com um primeiro passo pequeno.', infoEn: 'Getting what takes up space out of your head frees your attention for the session. No need to organize or solve anything: just write. For anything pending, note one small first step.' },
  revisar: { pt: 'Sua lista', en: 'Your list', icon: 'check_circle', infoPt: 'A lista do que você vai fazer, em ordem. Dê um nome e salve; depois é só ativar o Pomodoro.', infoEn: 'What you will do, in order. Name it and save; then just start the Pomodoro.' },
};

const PREP = [
  { id: 'station', pt: 'Organizar a estação de trabalho', en: 'Set up the work station' },
  { id: 'water', pt: 'Beber água', en: 'Get some water' },
  { id: 'food', pt: 'Comer algo, se estiver com fome', en: 'Eat something, if hungry' },
  { id: 'bathroom', pt: 'Ir ao banheiro', en: 'Use the bathroom' },
  { id: 'notifications', pt: 'Silenciar notificações', en: 'Mute notifications' },
] as const;

const QUADRANT_LONG: Record<Quadrant, { pt: string; en: string }> = {
  do: { pt: 'Importante e urgente — fazer', en: 'Important and urgent — do' },
  schedule: { pt: 'Importante — agendar', en: 'Important — schedule' },
  delegate: { pt: 'Urgente — delegar', en: 'Urgent — delegate' },
  drop: { pt: 'Nenhum — deixar de lado', en: 'Neither — drop' },
};
const SUGGESTIONS = [
  { cue: { pt: 'Se eu sentar à mesa', en: 'If I sit at my desk' }, action: { pt: 'abro a primeira tarefa da lista', en: 'I open the first task on my list' } },
  { cue: { pt: 'Se eu terminar o foco', en: 'If I finish the focus' }, action: { pt: 'faço uma pausa de verdade', en: 'I take a real break' } },
  { cue: { pt: 'Se eu me distrair', en: 'If I get distracted' }, action: { pt: 'respiro e volto à tarefa', en: 'I breathe and go back to the task' } },
] as const;

const sectionHead: CSSProperties = { ...sm2Hint, margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sm2-gold-ink)', fontWeight: 600, fontSize: 'var(--sm2-text-xs)' };
const softLink: CSSProperties = { ...sm2Button('quiet'), minHeight: 40, padding: '4px 6px', textDecoration: 'underline', textUnderlineOffset: 3 };
const selectStyle: CSSProperties = { minHeight: 44, color: 'var(--sm2-ink)', background: 'var(--sm2-surface)', border: '1px solid var(--sm2-border)', borderRadius: 8 };

/** Uma linha tocável de lista (picker): 44px de alvo, estado em aria-checked, sem ícone em caixa. */
function PickRow({ role, checked, onClick, children, habit, ...rest }: { role: 'checkbox' | 'radio'; checked: boolean; onClick: () => void; children: React.ReactNode; habit?: React.ReactNode } & Record<string, unknown>) {
  return <button type="button" role={role} aria-checked={checked} onClick={onClick} {...rest}
    style={{ ...sm2Button(checked ? 'primary' : 'outline'), display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 8, textAlign: 'left', width: '100%', minHeight: 44 }}>
    <Icon name={checked ? 'check_circle' : 'radio_button_unchecked'} size={20} tone="inherit" />
    <span style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{children}</span>{habit}
  </button>;
}

/** O rascunho sobrevive a fechar a folha e a recarregar (só no aparelho): reaproveita a normalização da sessão salva. */
const loadDraft = (): { draft: SessionDraft; step: StepId } | null => {
  const raw = readJson<{ step?: unknown } | null>(STORAGE_KEYS.FOCO_PLAN_DRAFT, null);
  const s = normalizeSession(raw);
  if (!s) return null;
  return { draft: toDraft(s), step: (STEP_ORDER as readonly unknown[]).includes(raw?.step) ? raw?.step as StepId : 'preparar' };
};

export function OficinaPlano({ language, tasks, initial, keepDraft = false, onSave, onCancel }: {
  language: Language; tasks: PlanTask[]; initial: SessionDraft; keepDraft?: boolean;
  onSave: (draft: SessionDraft) => void; onCancel: () => void;
}) {
  const isPt = language === 'pt-BR';
  const [restored] = useState(() => (keepDraft ? loadDraft() : null));
  const [draft, setDraft] = useState<SessionDraft>(restored?.draft ?? initial);
  const [step, setStep] = useState<StepId>(restored?.step ?? 'preparar');
  const [dumpEnd, setDumpEnd] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [missing, setMissing] = useState<'name' | 'environment' | null>(null);
  const rootRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (keepDraft) writeJson(STORAGE_KEYS.FOCO_PLAN_DRAFT, { ...draft, id: 'draft', day: '', status: 'ready', step }, { silent: true });
  }, [keepDraft, draft, step]);
  const clearDraft = () => { if (keepDraft) removeLocal(STORAGE_KEYS.FOCO_PLAN_DRAFT, { silent: true }); };
  useEffect(() => {
    if (dumpEnd === null) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [dumpEnd]);

  const pool = tasks.filter(t => !t.completed).slice(0, MAX_POOL);
  const set = <K extends keyof SessionDraft>(key: K, value: SessionDraft[K]) => setDraft(p => ({ ...p, [key]: value }));
  useEffect(() => { if (missing && missingToSave(draft) !== missing) setMissing(missingToSave(draft)); }, [draft, missing]);
  const meta = STEPS[step];
  const plan = buildPlan(draft, tasks);
  const ordered = matrixOrder(draft, pool);
  const left = dumpRemaining(dumpEnd, now);
  const dumpDone = dumpEnd !== null && left === 0;
  /** Salvar nunca fica mudo (dono, 01/11/2026: o botão desabilitado parecia quebrado): diz o que falta e leva até lá. */
  const trySave = () => {
    const why = missingToSave(draft);
    setMissing(why);
    if (why === null) { if (canSave(draft)) { onSave(draft); clearDraft(); } return; }
    /* Nunca volta para o meio das etapas (dono, 05/11/2026: "preenche tudo duas vezes"): o ambiente que falta se escolhe aqui mesmo, na revisão. */
    if (why === 'name') rootRef.current?.querySelector('input')?.focus();
  };
  const habitChip = (t: PlanTask) => (t.kind === 'habit' ? <TagChips tags={['habit']} isPt={isPt} /> : null);
  const empty = <p style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Você não tem tarefas nem hábitos abertos hoje. Pode pular esta etapa.' : 'You have no open tasks or habits today. You can skip this step.'}</p>;

  const environmentPicker = <fieldset data-oficina-environment style={{ display: 'grid', gap: 8, margin: 0, padding: 0, border: 0 }}>
            <legend style={{ ...sm2Text, marginBottom: 4 }}>{isPt ? 'Para onde enviar o Soulmon?' : 'Where should Soulmon go?'}</legend>
            <div role="radiogroup" aria-label={isPt ? 'Ambiente da expedição' : 'Expedition environment'} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
              {FOCUS_ENVIRONMENTS.map(env => <button key={env.id} type="button" role="radio" aria-checked={draft.environment === env.id} data-focus-environment={env.id} onClick={() => set('environment', env.id)} style={{ ...sm2Button(draft.environment === env.id ? 'primary' : 'outline'), display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 8 }}>
                <Icon name={env.icon} size={20} tone="inherit" />{isPt ? env.pt : env.en}
              </button>)}
            </div>
            <p style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Cada ambiente tem quatro materiais possíveis. Uma comida aleatória também participa do sorteio.' : 'Each environment has four possible materials. A random food also joins the pool.'}</p>
          </fieldset>;

  return (
    <section ref={rootRef} data-oficina-plano style={{ ...sheetCard, alignItems: 'stretch', gap: 12 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <p style={{ ...sectionHead, flex: 1 }}>{isPt ? 'Planejar sessão' : 'Plan session'}</p>
        <button type="button" data-oficina-cancel-session onClick={() => { clearDraft(); onCancel(); }} style={softLink}>{isPt ? 'Cancelar' : 'Cancel'}</button>
      </header>
      <label style={{ ...sm2Text, display: 'grid', gap: 4 }}>{isPt ? 'Nome da sessão' : 'Session name'}
        <Field value={draft.name} onChange={e => set('name', e.target.value)} placeholder={isPt ? 'Ex.: fechar apresentação' : 'e.g. finish presentation'} maxLength={60} />
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div role="progressbar" aria-label={isPt ? 'Progresso do planejamento' : 'Planning progress'} aria-valuemin={1} aria-valuemax={STEP_ORDER.length} aria-valuenow={stepNumber(step)} style={{ flex: 1, height: 4, borderRadius: 4, background: 'var(--sm2-border)', overflow: 'hidden' }}>
          <span className="sm-oficina-bar" style={{ display: 'block', width: `${(stepNumber(step) / STEP_ORDER.length) * 100}%`, height: '100%', background: 'var(--sm2-primary)' }} />
        </div>
        <span style={{ ...sm2Hint, margin: 0, whiteSpace: 'nowrap' }}>{isPt ? `Etapa ${stepNumber(step)} de ${STEP_ORDER.length}` : `Step ${stepNumber(step)} of ${STEP_ORDER.length}`}</span>
      </div>

      <div data-oficina-step={step} style={{ display: 'grid', gap: 10 }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name={meta.icon} size={24} tone="primary" />
          <h3 style={{ ...sheetCardTitle, flex: 1, margin: 0 }}>{isPt ? meta.pt : meta.en}</h3>
          <ModalInfo language={language} align="right" label={isPt ? `Sobre ${meta.pt}` : `About ${meta.en}`}>
            <InfoTipSection title={isPt ? meta.pt : meta.en}>{isPt ? meta.infoPt : meta.infoEn}</InfoTipSection>
          </ModalInfo>
        </header>

        {step === 'preparar' && <div data-oficina-preparo style={{ display: 'grid', gap: 2 }}>
          <p style={{ ...sm2Hint, margin: '0 0 4px' }}>{isPt ? 'Pequenas necessidades que podem interromper o foco. Marque só o que fizer sentido.' : 'Small needs that can interrupt focus. Check only what makes sense.'}</p>
          {PREP.map(item => <CheckRow key={item.id} checked={!!draft.prepChecked[item.id]} onChange={v => set('prepChecked', { ...draft.prepChecked, [item.id]: v })}>{isPt ? item.pt : item.en}</CheckRow>)}
        </div>}

        {step === 'ritmo' && <div style={{ display: 'grid', gap: 8 }}>
          <div role="radiogroup" aria-label={isPt ? 'Ritmo da sessão' : 'Session rhythm'} style={{ display: 'flex', gap: 8 }}>
            {(['p25', 'p50'] as FocoModeId[]).map(m => <Segment key={m} selected={draft.mode === m} onSelect={() => set('mode', m)} label={lengthLabel(m).replace('/', ' / ')} />)}
          </div>
          {environmentPicker}
        </div>}

        {step === 'dois-minutos' && (pool.length === 0 ? empty : <div data-oficina-two-min role="group" aria-label={isPt ? 'Tarefas de dois minutos' : 'Two-minute tasks'} style={{ display: 'grid', gap: 6 }}>
          <p style={{ ...sm2Hint, margin: 0 }} role="status">{isPt ? `${draft.twoMin.length} de ${MAX_TWO_MIN} escolhidas` : `${draft.twoMin.length} of ${MAX_TWO_MIN} chosen`}</p>
          {pool.map(t => <PickRow key={t.id} role="checkbox" data-oficina-pick={t.id} checked={draft.twoMin.includes(t.id)} onClick={() => setDraft(d => toggleTwoMin(d, t.id))} habit={habitChip(t)}>{t.name}</PickRow>)}
        </div>)}

        {step === 'eisenhower' && (pool.length === 0 ? empty : <div data-oficina-matrix style={{ display: 'grid', gap: 8 }}>
          {pool.map(t => <label key={t.id} style={{ ...sm2Text, display: 'grid', gap: 4 }}><span style={{ overflowWrap: 'anywhere', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>{t.name}{habitChip(t)}</span>
            <select data-oficina-quadrant={t.id} aria-label={`${isPt ? 'Quadrante de' : 'Quadrant for'} ${t.name}`} value={draft.matrix[t.id] ?? ''} onChange={e => setDraft(d => setQuadrant(d, t.id, (e.target.value || null) as Quadrant | null))} style={selectStyle}>
              <option value="">{isPt ? 'Sem classificar' : 'Unsorted'}</option>
              {QUADRANTS.map(q => <option key={q} value={q}>{isPt ? QUADRANT_LONG[q].pt : QUADRANT_LONG[q].en}</option>)}
            </select>
          </label>)}
          <p style={sectionHead}>{isPt ? 'Ordem' : 'Order'}</p>
          {ordered.length === 0 ? <p style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Classifique uma tarefa para vê-la aqui.' : 'Sort a task to see it here.'}</p>
            : <ol data-oficina-matrix-order style={{ ...sheetCardList, margin: 0, paddingInlineStart: 22 }}>{ordered.map(t => <li key={t.id} style={{ ...sm2Text }}>{t.name} <TagChips tags={[t.quadrant]} isPt={isPt} /></li>)}</ol>}
        </div>)}

        {step === 'sapo' && (pool.length === 0 ? empty : <div data-oficina-frog role="radiogroup" aria-label={isPt ? 'A tarefa mais difícil' : 'The hardest task'} style={{ display: 'grid', gap: 6 }}>
          {pool.map(t => <PickRow key={t.id} role="radio" data-oficina-pick={t.id} checked={draft.frog === t.id} onClick={() => setDraft(d => setFrog(d, t.id))} habit={habitChip(t)}>{t.name}</PickRow>)}
        </div>)}

        {step === 'se-entao' && <div data-oficina-if-then style={{ display: 'grid', gap: 8 }}>
          <label style={{ ...sm2Text, display: 'grid', gap: 4 }}>{isPt ? 'Se…' : 'If…'}<Field value={draft.ifThen.cue} onChange={e => set('ifThen', { ...draft.ifThen, cue: e.target.value })} maxLength={200} placeholder={isPt ? 'Ex.: se eu concluir a tarefa…' : 'e.g. If I finish the task…'} /></label>
          <label style={{ ...sm2Text, display: 'grid', gap: 4 }}>{isPt ? 'Então…' : 'Then…'}<Field value={draft.ifThen.action} onChange={e => set('ifThen', { ...draft.ifThen, action: e.target.value })} maxLength={200} placeholder={isPt ? '…posso jogar videogame' : '…I can play video games'} /></label>
          <p style={sectionHead}>{isPt ? 'Sugestões' : 'Suggestions'}</p>
          {SUGGESTIONS.map((s, i) => <button key={i} type="button" data-oficina-suggestion={i} onClick={() => set('ifThen', { cue: isPt ? s.cue.pt : s.cue.en, action: isPt ? s.action.pt : s.action.en })} style={{ ...sm2Button('outline'), textAlign: 'left', justifyContent: 'flex-start' }}>{isPt ? `${s.cue.pt}, ${s.action.pt}` : `${s.cue.en}, ${s.action.en}`}</button>)}
        </div>}

        {step === 'esvaziar' && <div data-oficina-brain-dump style={{ display: 'grid', gap: 8 }}>
          <p style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Escreva tudo o que estiver na cabeça, sem ordem e sem julgar. Quando o tempo acabar, a cabeça fica mais leve para focar.' : 'Write down everything on your mind, in any order, no judging. When the time is up, your head is lighter for focus.'}</p>
          <div role="radiogroup" aria-label={isPt ? 'Tempo para descarregar' : 'Brain dump time'} style={{ display: 'flex', gap: 8 }}>
            {DUMP_MINUTE_OPTIONS.map(m => <Segment key={m} selected={draft.dumpMinutes === m} onSelect={() => { set('dumpMinutes', m); setDumpEnd(null); }} label={`${m} min`} />)}
          </div>
          <button type="button" data-oficina-dump-start style={sm2Button(dumpEnd === null ? 'primary' : 'outline')} onClick={() => { const t = Date.now(); setNow(t); setDumpEnd(startDump(t, draft.dumpMinutes)); }}>
            {dumpEnd === null ? (isPt ? `Começar ${draft.dumpMinutes} minutos` : `Start ${draft.dumpMinutes} minutes`) : `${isPt ? 'Reiniciar' : 'Restart'} · ${formatClock(left)}`}
          </button>
          {dumpDone && <p role="status" data-oficina-dump-fim style={{ ...sm2Text, margin: 0 }}>{isPt ? 'Tempo! Feche a última ideia e siga. O que você escreveu fica guardado na sessão.' : "Time's up! Wrap up your last thought and move on. What you wrote stays with the session."}</p>}
          <label style={{ ...sm2Text, display: 'grid', gap: 4 }}>{isPt ? 'O que está na sua cabeça' : "What's on your mind"}
            <textarea data-oficina-dump value={draft.dump} onChange={e => set('dump', e.target.value)} rows={5} maxLength={2000} placeholder={isPt ? 'Ex.: responder o Lucas, comprar ração, aquela ideia do projeto…' : 'e.g. reply to Lucas, buy pet food, that project idea…'} style={{ ...sm2Text, boxSizing: 'border-box', width: '100%', color: 'var(--sm2-ink)', background: 'var(--sm2-surface)', border: '1px solid var(--sm2-border)', borderRadius: 8, padding: 10 }} />
            <span style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Fica só nesta sessão, neste aparelho.' : 'Stays in this session, on this device.'}</span>
          </label>
        </div>}

        {step === 'revisar' && <div data-oficina-review style={{ display: 'grid', gap: 10 }}>
          {!isFocusEnvironmentId(draft.environment) && environmentPicker}
          <p style={{ ...sm2Hint, margin: 0 }}>{`${draft.name.trim() || (isPt ? 'Sua sessão' : 'Your session')} · ${draft.mode === 'p25' ? 'Pomodoro 25/5' : (isPt ? 'Blocos 50/10' : 'Focus blocks 50/10')}`}</p>
          {plan.length === 0 ? <p data-oficina-review-tasks style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Nenhuma tarefa na lista. Dá para salvar assim e focar sem lista.' : 'No tasks on the list. You can still save and focus without one.'}</p>
            : <ol data-oficina-review-tasks style={{ ...sheetCardList, margin: 0, paddingInlineStart: 22 }}>{plan.map(p => <li key={p.id} data-oficina-review-item={p.id} style={{ ...sm2Text, display: 'grid', gap: 4 }}><strong style={{ overflowWrap: 'anywhere' }}>{p.name}</strong><span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}><TagChips tags={p.tags} isPt={isPt} /></span></li>)}</ol>}
          {(draft.ifThen.cue || draft.ifThen.action) && <p style={{ ...sm2Hint, margin: 0 }} data-oficina-review-ifthen><Icon name="flag" size={20} tone="primary" /> {draft.ifThen.cue} → {draft.ifThen.action}</p>}
          {draft.dump.trim() && <p style={{ ...sm2Hint, margin: 0, overflowWrap: 'anywhere' }} data-oficina-review-dump><Icon name="psychology" size={20} tone="primary" /> {draft.dump}</p>}
          <p style={{ ...sm2Hint, margin: 0 }}>{isPt ? `Cada foco concluído rende um item; extra: ${FOCUS_EXTRA_BASE_CHANCE * 100}%, +${FOCUS_EXTRA_CHANCE_PER_CYCLE * 100}% por ciclo, até ${FOCUS_EXTRA_MAX_CHANCE * 100}%.` : `Each completed focus earns an item; extra: ${FOCUS_EXTRA_BASE_CHANCE * 100}%, +${FOCUS_EXTRA_CHANCE_PER_CYCLE * 100}% per cycle, up to ${FOCUS_EXTRA_MAX_CHANCE * 100}%.`}</p>
          <p style={{ ...sm2Hint, margin: 0 }}>{isPt ? `Concluir a sessão rende 1 item pequeno (até 2 por dia); limite de ${FOCUS_LOOT_DAILY_CAP} itens por dia.` : `Completing the session earns 1 small item (up to 2 a day); daily limit of ${FOCUS_LOOT_DAILY_CAP} items.`}</p>
        </div>}
      </div>

      {missing && <p role="alert" data-oficina-save-missing style={{ ...sm2Text, margin: 0, color: 'var(--sm2-gold-ink, var(--sm2-ink))' }}>{missing === 'name'
        ? (isPt ? 'Dê um nome à sessão, no topo. Depois toque em Salvar sessão de novo.' : 'Just add a session name at the top, then tap Save session again.')
        : (isPt ? 'Escolha aqui para onde o Soulmon vai e toque em Salvar sessão.' : 'Choose where Soulmon goes right here, then tap Save session.')}</p>}
      <footer style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {step !== 'preparar' && <button type="button" data-oficina-back onClick={() => setStep(prevStep(step))} style={softLink}>{isPt ? 'Voltar' : 'Back'}</button>}
        {step !== 'revisar' && <>
          <button type="button" data-oficina-skip onClick={() => setStep(nextStep(step))} style={softLink}>{isPt ? 'Pular' : 'Skip'}</button>
          <button type="button" data-oficina-next onClick={() => setStep(nextStep(step))} style={{ ...sm2Button('primary'), marginLeft: 'auto' }}>{isPt ? 'Próxima etapa' : 'Next step'}</button>
        </>}
        {step === 'revisar' && <button type="button" data-oficina-save-session onClick={trySave} style={{ ...sm2Button('primary'), marginLeft: 'auto' }}>{isPt ? 'Salvar sessão' : 'Save session'}</button>}
      </footer>
    </section>
  );
}
