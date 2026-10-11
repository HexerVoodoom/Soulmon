import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { CheckRow, Field, Segment, sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { ModalInfo, InfoTipSection } from '../ui/InfoTip';
import { Icon } from '../ui/Icon';
import { sheetCard, sheetCardList, sheetCardTitle } from '../nav/sheetKit';
import type { Language } from '../../utils/i18n';
import {
  FOCUS_ENVIRONMENTS, FOCUS_EXTRA_BASE_CHANCE, FOCUS_EXTRA_CHANCE_PER_CYCLE,
  FOCUS_EXTRA_MAX_CHANCE, FOCUS_LOOT_DAILY_CAP, focusExtraChance,
  isFocusEnvironmentId, type FocusEnvironmentId,
  type FocusLootItem, type FocusLootRequest,
} from '../../utils/focusExpedition';
import { EVIDENCIA_LABEL, FOCO_TECNICAS } from '../../data/focoTecnicas';
import { readJson, removeLocal, writeJson } from '../../utils/safeStorage';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import {
  FOCO_MODES, armEndNotice, disarmEndNotice, formatClock, isLongBreak, loadSessions, loadTimer, pause,
  recordSession, remainingMs, resume, saveSessions, saveTimer, sessionsToday, settle, startPhase,
  type FocoModeId, type FocoTimer,
} from '../../utils/focoTimer';

type StepId = 'preparar' | 'pomodoro' | 'dois-minutos' | 'sapo' | 'eisenhower' | 'se-entao' | 'esvaziar' | 'revisar';
type WorkshopTask = { id: string; name: string; completed: boolean; steps?: Array<{ id: string; label: string; completed: boolean }> };
type WorkshopDraft = {
  name: string;
  mode: FocoModeId;
  environment: FocusEnvironmentId | '';
  taskByStep: Partial<Record<StepId, string>>;
  prepChecked: Record<string, boolean>;
  ifThen: { cue: string; action: string };
  dump: string;
  quadrant: string;
};
type WorkshopSession = WorkshopDraft & {
  id: string;
  day: string;
  taskIds: string[];
  taskNames: Record<string, string>;
  status: 'ready' | 'completed';
  completedCycles: number;
};
export type FocusRewardResult = { accepted: boolean; items: FocusLootItem[]; chancePercent: number };

const PLAN: Array<{ id: StepId; pt: string; en: string; icon: string; infoPt: string; infoEn: string }> = [
  { id: 'preparar', pt: 'Preparar o foco', en: 'Prepare to focus', icon: 'checklist', infoPt: 'Cuide de pequenas necessidades e prepare o espaço antes de começar. Marque apenas o que fizer sentido.', infoEn: 'Take care of small needs and prepare your space before starting. Check only what makes sense.' },
  { id: 'pomodoro', pt: 'Escolher o ritmo', en: 'Choose a rhythm', icon: 'timer', infoPt: 'Escolha entre 25/5 e 50/10. Você poderá iniciar o Pomodoro no card da sessão salva.', infoEn: 'Choose 25/5 or 50/10. You can start the Pomodoro from the saved session card.' },
  { id: 'dois-minutos', pt: 'Regra dos dois minutos', en: 'Two-Minute Rule', icon: 'bolt', infoPt: 'Se a tarefa levar cerca de dois minutos, você pode resolvê-la agora. Escolha uma tarefa da sua lista.', infoEn: 'If a task takes about two minutes, you can do it now. Choose a task from your list.' },
  { id: 'sapo', pt: 'O sapo primeiro', en: 'Eat the Frog', icon: 'priority_high', infoPt: 'Escolha a tarefa mais importante ou mais difícil para começar por ela.', infoEn: 'Choose the most important or hardest task to start with.' },
  { id: 'eisenhower', pt: 'Matriz de Eisenhower', en: 'Eisenhower Matrix', icon: 'grid_view', infoPt: 'Classifique a tarefa escolhida para decidir se é hora de fazer, agendar, delegar ou deixar de lado.', infoEn: 'Classify the chosen task to decide whether to do, schedule, delegate, or drop it.' },
  { id: 'se-entao', pt: 'Se… então…', en: 'If… then…', icon: 'flag', infoPt: 'Ligue um gatilho concreto a uma ação que você quer iniciar.', infoEn: 'Connect a concrete cue to an action you want to start.' },
  { id: 'esvaziar', pt: 'Brain Dump', en: 'Brain Dump', icon: 'psychology', infoPt: 'Anote o que está ocupando sua cabeça; este rascunho fica somente nesta sessão.', infoEn: 'Write down what is on your mind; this draft stays only in this session.' },
  { id: 'revisar', pt: 'Revisar a sessão', en: 'Review session', icon: 'fact_check', infoPt: 'Confira nome, tarefas, subtópicos e escolhas antes de salvar.', infoEn: 'Review the name, tasks, subtasks and choices before saving.' },
];

const PRE_FOCUS_CHECKLIST = [
  { id: 'station', pt: 'Organizar a estação de trabalho', en: 'Set up the work station' },
  { id: 'water', pt: 'Beber água', en: 'Get some water' },
  { id: 'food', pt: 'Comer algo, se estiver com fome', en: 'Eat something, if hungry' },
  { id: 'bathroom', pt: 'Ir ao banheiro', en: 'Use the bathroom' },
  { id: 'notifications', pt: 'Silenciar notificações', en: 'Mute notifications' },
] as const;

const emptyDraft = (): WorkshopDraft => ({ name: '', mode: 'p25', environment: '', taskByStep: {}, prepChecked: {}, ifThen: { cue: '', action: '' }, dump: '', quadrant: '' });
const validMode = (v: unknown): v is FocoModeId => v === 'p25' || v === 'p50';
function loadWorkshopSession(): WorkshopSession | null {
  const raw = readJson<unknown>(STORAGE_KEYS.FOCO_WORKSHOP_PLAN, null);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Partial<WorkshopSession>;
  if (typeof r.id !== 'string' || typeof r.name !== 'string' || typeof r.day !== 'string' || (r.status !== 'ready' && r.status !== 'completed') || !validMode(r.mode) || !Array.isArray(r.taskIds)) return null;
  return { ...emptyDraft(), ...r, environment: isFocusEnvironmentId(r.environment) ? r.environment : '', completedCycles: Number.isFinite(r.completedCycles) ? Math.max(0, Math.min(99, Math.floor(r.completedCycles as number))) : 0, taskIds: r.taskIds.filter((id): id is string => typeof id === 'string'), taskNames: r.taskNames && typeof r.taskNames === 'object' ? r.taskNames : {}, taskByStep: r.taskByStep && typeof r.taskByStep === 'object' ? r.taskByStep : {} } as WorkshopSession;
}

const sectionHead: CSSProperties = {
  ...sm2Hint, margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--sm2-gold-ink)', fontWeight: 600, fontSize: 'var(--sm2-text-xs)',
};
const softLink: CSSProperties = { ...sm2Button('quiet'), minHeight: 40, padding: '4px 6px', textDecoration: 'underline', textUnderlineOffset: 3 };

const fallbackDay = (): string => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/** Timer display reads the clock rather than accumulating ticks, including after backgrounding. */
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [active]);
  return now;
}

export function OficinaSheet({ language, todayKey, tasks = [], onCompleteTask = () => {}, onFocusReward }: {
  language: Language; todayKey?: string; tasks?: WorkshopTask[]; onCompleteTask?: (taskId: string) => void;
  onFocusReward?: (request: FocusLootRequest, completedCycles: number) => FocusRewardResult;
}) {
  const isPt = language === 'pt-BR';
  const day = todayKey ?? fallbackDay();
  const [mode, setMode] = useState<FocoModeId>('p25');
  const [timer, setTimer] = useState<FocoTimer | null>(() => { const t = loadTimer(); return t ? settle(t, Date.now()) : null; });
  const [days, setDays] = useState(() => loadSessions());
  const [openId, setOpenId] = useState<string | null>(null);
  const [tab, setTab] = useState<'session' | 'guides'>('session');
  const [session, setSession] = useState<WorkshopSession | null>(loadWorkshopSession);
  const [editing, setEditing] = useState(() => !loadWorkshopSession());
  const [draft, setDraft] = useState<WorkshopDraft>(() => {
    const saved = loadWorkshopSession();
    if (!saved) return emptyDraft();
    const { id: _id, day: _day, taskIds: _ids, taskNames: _names, status: _status, ...rest } = saved;
    return rest;
  });
  const [stepIndex, setStepIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dumpEnd, setDumpEnd] = useState<number | null>(null);
  const [lootNotice, setLootNotice] = useState<FocusRewardResult | null>(null);
  const now = useNow(timer?.status === 'running' || dumpEnd !== null);

  const copy = useCallback((phase: 'focus' | 'break') => ({
    title: phase === 'focus' ? (isPt ? 'Foco concluído' : 'Focus done') : (isPt ? 'Pausa concluída' : 'Break done'),
    body: phase === 'focus' ? (isPt ? 'Hora de uma pausa.' : 'Time for a break.') : (isPt ? 'Quando quiser, outra rodada.' : 'Another round, whenever you like.'),
  }), [isPt]);
  const apply = useCallback((t: FocoTimer | null) => {
    setTimer(t); saveTimer(t);
    if (t?.status === 'running' && t.endAt !== null) armEndNotice(t.endAt, Date.now(), copy(t.phase));
    else disarmEndNotice();
  }, [copy]);
  useEffect(() => {
    if (!timer) return;
    const s = settle(timer, now);
    if (s !== timer) { setTimer(s); saveTimer(s); }
  }, [now, timer]);

  useEffect(() => { if (session) setMode(session.mode); }, [session?.mode]);

  const feito = () => {
    if (!timer) return;
    const next = recordSession(days, day, timer.totalMs / 60_000);
    setDays(next); saveSessions(next);
    if (session && timer.expeditionId && timer.sessionId === session.id) {
      const request: FocusLootRequest = { day, environment: timer.expeditionId as FocusEnvironmentId, sessionId: timer.sessionId, eventId: `${timer.sessionId}:${timer.phaseId}` };
      setLootNotice(onFocusReward?.(request, session.completedCycles) ?? null);
    }
    apply(startPhase(timer.mode, 'break', Date.now(), isLongBreak(timer.mode, sessionsToday(next, day)), timer.expeditionId && timer.sessionId ? { expeditionId: timer.expeditionId, sessionId: timer.sessionId } : undefined));
  };
  const fimDaPausa = () => {
    if (timer?.sessionId && session?.id === timer.sessionId) {
      writeSession({ ...session, completedCycles: Math.min(99, session.completedCycles + 1) });
    }
    apply(null);
  };
  const cancelarTimer = () => {
    if (timer?.sessionId && session?.id === timer.sessionId && session.completedCycles !== 0) writeSession({ ...session, completedCycles: 0 });
    setLootNotice(null);
    apply(null);
  };
  const hoje = sessionsToday(days, day);
  const active = PLAN[stepIndex];
  const taskIds = [...new Set(Object.values(draft.taskByStep).filter((id): id is string => !!id))];
  const selected = tasks.find(t => t.id === draft.taskByStep[active?.id] && !t.completed);
  const writeSession = (next: WorkshopSession | null) => {
    setSession(next);
    if (next) writeJson(STORAGE_KEYS.FOCO_WORKSHOP_PLAN, next);
    else removeLocal(STORAGE_KEYS.FOCO_WORKSHOP_PLAN, { silent: true });
  };
  const updateDraft = <K extends keyof WorkshopDraft>(key: K, value: WorkshopDraft[K]) => setDraft(prev => ({ ...prev, [key]: value }));
  const cancelEdit = () => {
    setEditing(false); setStepIndex(0); setDumpEnd(null);
    if (session) {
      const { id: _id, day: _day, taskIds: _ids, taskNames: _names, status: _status, ...rest } = session;
      setDraft(rest);
    } else setDraft(emptyDraft());
  };
  const startEdit = () => {
    if (session) {
      const { id: _id, day: _day, taskIds: _ids, taskNames: _names, status: _status, ...rest } = session;
      setDraft(rest);
    } else setDraft(emptyDraft());
    setStepIndex(0); setEditing(true); setTab('session');
  };
  const saveSession = () => {
    const name = draft.name.trim().slice(0, 60);
    if (!name) { setStepIndex(0); return; }
    const ids = [...new Set(Object.values(draft.taskByStep).filter((id): id is string => !!id))];
    const taskNames = Object.fromEntries(ids.map(id => [id, tasks.find(t => t.id === id)?.name ?? session?.taskNames[id] ?? '']));
    if (!isFocusEnvironmentId(draft.environment)) { setStepIndex(1); return; }
    const next: WorkshopSession = { ...draft, name, id: session?.id ?? `foco-${Date.now()}`, day: session?.day ?? day, taskIds: ids, taskNames, status: session?.status === 'completed' ? 'completed' : 'ready', completedCycles: session?.completedCycles ?? 0 };
    writeSession(next); setEditing(false); setExpanded(false); setConfirmDelete(false);
  };
  const completeSession = () => {
    if (!session || session.status === 'completed') return;
    for (const id of session.taskIds) if (tasks.some(t => t.id === id && !t.completed)) onCompleteTask(id);
    const next = { ...session, status: 'completed' as const };
    writeSession(next);
  };
  const deleteSession = () => { if (timer?.sessionId === session?.id) apply(null); writeSession(null); setDraft(emptyDraft()); setEditing(false); setConfirmDelete(false); setExpanded(false); setLootNotice(null); };
  const newSession = () => { writeSession(null); setDraft(emptyDraft()); setStepIndex(0); setEditing(true); setExpanded(false); };
  const activeTaskNames = taskIds.map(id => tasks.find(t => t.id === id)?.name ?? session?.taskNames[id] ?? '').filter(Boolean);
  const left = timer ? remainingMs(timer, now) : FOCO_MODES[mode].focusMin * 60_000;
  const ended = timer?.status === 'ended';
  const timerLabel = timer ? (timer.phase === 'focus' ? (isPt ? 'Foco' : 'Focus') : (isPt ? 'Pausa' : 'Break')) : (isPt ? 'Foco' : 'Focus');
  const canStartSessionFocus = !!session && session.status === 'ready' && !editing && isFocusEnvironmentId(session.environment);
  const startSessionFocus = () => {
    if (!canStartSessionFocus || !session) { setTab('session'); setEditing(true); setStepIndex(1); return; }
    setMode(session.mode);
    setLootNotice(null);
    apply(startPhase(session.mode, 'focus', Date.now(), false, { expeditionId: session.environment, sessionId: session.id }));
  };

  return (
    <div data-oficina style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <p style={{ ...sectionHead, flex: 1 }}>{isPt ? 'Timer de foco' : 'Focus timer'}</p>
        <ModalInfo language={language} align="right" label={isPt ? 'Como funciona a Oficina' : 'How the Workshop works'}>
          <InfoTipSection title={isPt ? 'Timer de foco' : 'Focus timer'}>
            {isPt ? 'O relógio segue o horário de verdade. Ao fim, o app avisa na tela e vibra de leve; se você já permitiu notificações, também avisa fora do app. O app não toca um alarme sonoro automático. “Foquei” guarda um registro do dia só neste aparelho: sem placar, sem sequência, sem Bits.' : 'The clock follows real time. At the end the app tells you on screen and buzzes lightly; if you already allowed notifications, it also alerts you outside the app. There is no automatic alarm sound. “I focused” keeps a note of the day on this device only: no scoreboard, streak or Bits.'}
          </InfoTipSection>
          {FOCO_TECNICAS.map((t, i) => <InfoTipSection key={t.id} title={isPt ? t.namePt : t.nameEn} last={i === FOCO_TECNICAS.length - 1}>
            <strong>{isPt ? EVIDENCIA_LABEL[t.evidencia].pt : EVIDENCIA_LABEL[t.evidencia].en}.</strong>{' '}{isPt ? t.howPt : t.howEn}{' '}<em>{isPt ? 'Fonte: ' : 'Source: '}{t.fonte}</em>
          </InfoTipSection>)}
        </ModalInfo>
      </div>

      <div data-oficina-timer style={{ ...sheetCard, alignItems: 'center', gap: 12 }}>
        {!timer && <div role="radiogroup" aria-label={isPt ? 'Ritmo' : 'Rhythm'} style={{ display: 'flex', gap: 8, width: '100%' }}>
          <Segment selected={mode === 'p25'} onSelect={() => { setMode('p25'); updateDraft('mode', 'p25'); }} label="25 / 5" />
          <Segment selected={mode === 'p50'} onSelect={() => { setMode('p50'); updateDraft('mode', 'p50'); }} label="50 / 10" />
        </div>}
        <p style={sectionHead}>{timerLabel}</p>
        <p role="timer" data-oficina-clock className="sm2-num" style={{ margin: 0, fontFamily: 'var(--sm2-font-display)', fontWeight: 700, fontSize: 48, lineHeight: 1, color: 'var(--sm2-ink)' }}>{formatClock(left)}</p>
        {ended && <p role="status" data-oficina-fim style={{ ...sm2Text, margin: 0, textAlign: 'center' }}>{timer?.phase === 'focus' ? (isPt ? 'O tempo acabou.' : 'Time is up.') : (isPt ? 'A pausa acabou.' : 'The break is over.')}</p>}
        <div style={{ display: 'flex', gap: 8, width: '100%', flexWrap: 'wrap' }}>
          {!timer && <button type="button" data-oficina-start onClick={startSessionFocus} style={{ ...sm2Button('primary'), flex: 1 }}>{canStartSessionFocus ? (isPt ? 'Enviar Soulmon e iniciar' : 'Send Soulmon & start') : (isPt ? 'Planejar sessão e escolher cenário' : 'Plan a session & choose a scene')}</button>}
          {timer?.status === 'running' && <button type="button" data-oficina-pause onClick={() => apply(pause(timer, Date.now()))} style={{ ...sm2Button('primary'), flex: 1 }}><Icon name="pause" size={20} tone="inherit" /> {isPt ? 'Pausar' : 'Pause'}</button>}
          {timer?.status === 'paused' && <button type="button" data-oficina-resume onClick={() => apply(resume(timer, Date.now()))} style={{ ...sm2Button('primary'), flex: 1 }}><Icon name="play_arrow" size={20} tone="inherit" /> {isPt ? 'Continuar' : 'Resume'}</button>}
          {ended && timer?.phase === 'focus' && <button type="button" data-oficina-foquei onClick={feito} style={{ ...sm2Button('primary'), flex: 1 }}>{isPt ? 'Foquei' : 'I focused'}</button>}
          {ended && timer?.phase === 'break' && <button type="button" data-oficina-ok onClick={fimDaPausa} style={{ ...sm2Button('primary'), flex: 1 }}>{isPt ? 'Pronto' : 'Done'}</button>}
          {timer && <button type="button" data-oficina-cancel onClick={cancelarTimer} style={{ ...sm2Button('outline'), flex: ended ? 0 : 1 }}>{ended && timer.phase === 'focus' ? (isPt ? 'Agora não' : 'Not now') : (isPt ? 'Cancelar' : 'Cancel')}</button>}
        </div>
        {lootNotice && <p role="status" data-oficina-loot style={{ ...sm2Text, margin: 0, textAlign: 'center' }}>
          {lootNotice.accepted
            ? `${isPt ? 'O Soulmon voltou com' : 'Soulmon returned with'}: ${lootNotice.items.map(item => `${item.icon} ${isPt ? item.namePt : item.nameEn}`).join(' · ')}${lootNotice.items.length > 1 ? ` (${isPt ? 'bônus' : 'bonus'} ${lootNotice.chancePercent}%)` : ''}`
            : (isPt ? `Teto diário de ${FOCUS_LOOT_DAILY_CAP} itens alcançado.` : `Daily cap of ${FOCUS_LOOT_DAILY_CAP} items reached.`)}
        </p>}
        {hoje > 0 && <p data-oficina-hoje style={{ ...sm2Hint, margin: 0 }}>{isPt ? `Hoje: ${hoje} ${hoje === 1 ? 'foco' : 'focos'}` : `Today: ${hoje} ${hoje === 1 ? 'focus' : 'focuses'}`}</p>}
      </div>

      <div role="tablist" aria-label={isPt ? 'Oficina do Foco' : 'Focus Workshop'} data-oficina-tabs style={{ display: 'flex', alignItems: 'center', gap: 18, borderBottom: '1px solid var(--sm2-border)' }}>
        <button type="button" role="tab" aria-selected={tab === 'session'} onClick={() => setTab('session')} style={{ ...softLink, textDecoration: tab === 'session' ? 'underline' : 'none', color: tab === 'session' ? 'var(--sm2-ink)' : 'var(--sm2-muted)' }}>{isPt ? 'Sessão' : 'Session'}</button>
        <button type="button" role="tab" aria-selected={tab === 'guides'} onClick={() => setTab('guides')} style={{ ...softLink, textDecoration: tab === 'guides' ? 'underline' : 'none', color: tab === 'guides' ? 'var(--sm2-ink)' : 'var(--sm2-muted)' }}>{isPt ? 'Guias' : 'Guides'}</button>
      </div>

      {tab === 'session' && editing && <section data-oficina-plano style={{ ...sheetCard, alignItems: 'stretch', gap: 12 }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <p style={{ ...sectionHead, flex: 1, margin: 0 }}>{isPt ? 'Planejar sessão' : 'Plan session'}</p>
          <button type="button" data-oficina-cancel-session onClick={cancelEdit} style={softLink}>{isPt ? 'Cancelar' : 'Cancel'}</button>
        </header>
        <label style={{ ...sm2Text, display: 'grid', gap: 4 }}>{isPt ? 'Nome da sessão' : 'Session name'}<Field value={draft.name} onChange={e => updateDraft('name', e.target.value)} placeholder={isPt ? 'Ex.: fechar apresentação' : 'e.g. finish presentation'} maxLength={60} /></label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div role="progressbar" aria-label={isPt ? 'Progresso do planejamento' : 'Planning progress'} aria-valuemin={1} aria-valuemax={PLAN.length} aria-valuenow={stepIndex + 1} style={{ flex: 1, height: 4, borderRadius: 4, background: 'var(--sm2-border)', overflow: 'hidden' }}>
            <span style={{ display: 'block', width: `${((stepIndex + 1) / PLAN.length) * 100}%`, height: '100%', background: 'var(--sm2-primary)', transition: 'width 180ms ease' }} />
          </div>
          <span style={{ ...sm2Hint, margin: 0, whiteSpace: 'nowrap' }}>{isPt ? `Etapa ${stepIndex + 1} de ${PLAN.length}` : `Step ${stepIndex + 1} of ${PLAN.length}`}</span>
        </div>
        <div data-oficina-step={active.id} style={{ display: 'grid', gap: 10 }}>
          <header style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name={active.icon} size={22} tone="primary" />
            <h3 style={{ ...sheetCardTitle, flex: 1, margin: 0 }}>{isPt ? active.pt : active.en}</h3>
            <ModalInfo language={language} align="right" label={isPt ? `Sobre ${active.pt}` : `About ${active.en}`}>
              <InfoTipSection title={isPt ? active.pt : active.en}>{isPt ? active.infoPt : active.infoEn}</InfoTipSection>
            </ModalInfo>
          </header>
          {active.id === 'preparar' && <div data-oficina-preparo style={{ display: 'grid', gap: 2 }}>
            <p style={{ ...sm2Hint, margin: '0 0 4px' }}>{isPt ? 'Pequenas necessidades que podem interromper o foco. Marque só o que fizer sentido.' : 'Small needs that can interrupt focus. Check only what makes sense.'}</p>
            {PRE_FOCUS_CHECKLIST.map(item => <CheckRow key={item.id} checked={!!draft.prepChecked[item.id]} onChange={v => updateDraft('prepChecked', { ...draft.prepChecked, [item.id]: v })}>{isPt ? item.pt : item.en}</CheckRow>)}
          </div>}
          {active.id === 'pomodoro' && <div style={{ display: 'grid', gap: 8 }}>
            <div role="radiogroup" aria-label={isPt ? 'Ritmo da sessão' : 'Session rhythm'} style={{ display: 'flex', gap: 8 }}>
              <Segment selected={draft.mode === 'p25'} onSelect={() => updateDraft('mode', 'p25')} label="25 / 5" />
              <Segment selected={draft.mode === 'p50'} onSelect={() => updateDraft('mode', 'p50')} label="50 / 10" />
            </div>
            <fieldset data-oficina-environment style={{ display: 'grid', gap: 8, margin: 0, padding: 0, border: 0 }}>
              <legend style={{ ...sm2Text, marginBottom: 4 }}>{isPt ? 'Para onde enviar o Soulmon?' : 'Where should Soulmon go?'}</legend>
              <div role="radiogroup" aria-label={isPt ? 'Ambiente da expedição' : 'Expedition environment'} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                {FOCUS_ENVIRONMENTS.map(environment => <button key={environment.id} type="button" role="radio" aria-checked={draft.environment === environment.id} data-focus-environment={environment.id} onClick={() => updateDraft('environment', environment.id)} style={{ ...sm2Button(draft.environment === environment.id ? 'primary' : 'outline'), display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 8 }}>
                  <Icon name={environment.icon} size={20} tone="inherit" />{isPt ? environment.pt : environment.en}
                </button>)}
              </div>
              <p style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Cada ambiente tem quatro materiais possíveis. Uma comida aleatória também participa do sorteio.' : 'Each environment has four possible materials. A random food also joins the pool.'}</p>
            </fieldset>
            <TaskPicker tasks={tasks} value={draft.taskByStep.pomodoro ?? ''} onChange={v => updateDraft('taskByStep', { ...draft.taskByStep, pomodoro: v })} isPt={isPt} />
          </div>}
          {(['dois-minutos', 'sapo', 'eisenhower'] as StepId[]).includes(active.id) && <div style={{ display: 'grid', gap: 8 }}>
            <TaskPicker tasks={tasks} value={draft.taskByStep[active.id] ?? ''} onChange={v => updateDraft('taskByStep', { ...draft.taskByStep, [active.id]: v })} isPt={isPt} />
            {active.id === 'eisenhower' && <label style={{ ...sm2Text, display: 'grid', gap: 4 }}>{isPt ? 'Quadrante' : 'Quadrant'}
              <select aria-label={isPt ? 'Quadrante' : 'Quadrant'} value={draft.quadrant} onChange={e => updateDraft('quadrant', e.target.value)} style={{ minHeight: 44, color: 'var(--sm2-ink)', background: 'var(--sm2-surface)', border: '1px solid var(--sm2-border)', borderRadius: 8 }}>
                <option value="">{isPt ? 'Escolher…' : 'Choose…'}</option><option value="do">{isPt ? 'Importante e urgente — fazer' : 'Important and urgent — do'}</option><option value="schedule">{isPt ? 'Importante — agendar' : 'Important — schedule'}</option><option value="delegate">{isPt ? 'Urgente — delegar' : 'Urgent — delegate'}</option><option value="drop">{isPt ? 'Nenhum — deixar de lado' : 'Neither — drop'}</option>
              </select>
            </label>}
          </div>}
          {active.id === 'se-entao' && <div data-oficina-if-then style={{ display: 'grid', gap: 8 }}>
            <label style={{ ...sm2Text, display: 'grid', gap: 4 }}>{isPt ? 'Se…' : 'If…'}<Field value={draft.ifThen.cue} onChange={e => updateDraft('ifThen', { ...draft.ifThen, cue: e.target.value })} placeholder={isPt ? 'Ex.: se eu concluir a tarefa…' : 'e.g. If I finish the task…'} /></label>
            <label style={{ ...sm2Text, display: 'grid', gap: 4 }}>{isPt ? 'Então…' : 'Then…'}<Field value={draft.ifThen.action} onChange={e => updateDraft('ifThen', { ...draft.ifThen, action: e.target.value })} placeholder={isPt ? '…posso jogar videogame' : '…I can play video games'} /></label>
          </div>}
          {active.id === 'esvaziar' && <div data-oficina-brain-dump style={{ display: 'grid', gap: 8 }}>
            <label style={{ ...sm2Text, display: 'grid', gap: 4 }}>{isPt ? 'Brain Dump — anotações temporárias desta sessão' : 'Brain Dump — notes just for this session'}<textarea data-oficina-dump value={draft.dump} onChange={e => updateDraft('dump', e.target.value)} rows={4} maxLength={2000} style={{ ...sm2Text, boxSizing: 'border-box', width: '100%', color: 'var(--sm2-ink)', background: 'var(--sm2-surface)', border: '1px solid var(--sm2-border)', borderRadius: 8, padding: 10 }} /></label>
            <p role="timer" style={{ ...sm2Hint, margin: 0 }}>{dumpEnd ? formatClock(Math.max(0, dumpEnd - now)) : '05:00'}</p>
            <button type="button" style={sm2Button('outline')} onClick={() => setDumpEnd(Date.now() + 5 * 60_000)}>{dumpEnd ? (isPt ? 'Reiniciar 5 minutos' : 'Restart 5 minutes') : (isPt ? 'Iniciar 5 minutos' : 'Start 5 minutes')}</button>
          </div>}
          {active.id === 'revisar' && <div data-oficina-review style={{ display: 'grid', gap: 10 }}>
            <p style={{ ...sm2Hint, margin: 0 }}>{isPt ? `${draft.name.trim() || 'Sua sessão'} · ${draft.mode === 'p25' ? 'Pomodoro 25/5' : 'Blocos 50/10'}` : `${draft.name.trim() || 'Your session'} · ${draft.mode === 'p25' ? 'Pomodoro 25/5' : 'Focus blocks 50/10'}`}</p>
            <ul style={{ ...sheetCardList, margin: 0 }} data-oficina-review-tasks>{taskIds.length === 0 ? <li style={{ ...sm2Hint }}>{isPt ? 'Nenhuma tarefa selecionada.' : 'No tasks selected.'}</li> : taskIds.map(id => {
              const task = tasks.find(t => t.id === id);
              const name = task?.name ?? session?.taskNames[id] ?? '';
              return <li key={id} style={{ ...sm2Text, display: 'grid', gap: 4 }}><strong>{name}</strong>{task?.steps?.length ? <ul style={{ margin: 0, paddingInlineStart: 20 }}>{task.steps.map(step => <li key={step.id}>{step.label}</li>)}</ul> : null}</li>;
            })}</ul>
            {draft.ifThen.cue || draft.ifThen.action ? <p style={{ ...sm2Hint, margin: 0 }} data-oficina-review-ifthen><Icon name="flag" size={16} tone="primary" /> {draft.ifThen.cue} → {draft.ifThen.action}</p> : null}
            {draft.dump.trim() ? <p style={{ ...sm2Hint, margin: 0 }} data-oficina-review-dump><Icon name="psychology" size={16} tone="primary" /> {draft.dump}</p> : null}
            <p style={{ ...sm2Hint, margin: 0 }}>{isPt ? `Item garantido por foco concluído. Chance de item extra: começa em ${FOCUS_EXTRA_BASE_CHANCE * 100}% e cresce ${FOCUS_EXTRA_CHANCE_PER_CYCLE * 100}% por ciclo foco + pausa, até ${FOCUS_EXTRA_MAX_CHANCE * 100}%. Limite: ${FOCUS_LOOT_DAILY_CAP} itens por dia.` : `One guaranteed item per completed focus. Extra-item chance starts at ${FOCUS_EXTRA_BASE_CHANCE * 100}% and grows by ${FOCUS_EXTRA_CHANCE_PER_CYCLE * 100}% per focus + break cycle, up to ${FOCUS_EXTRA_MAX_CHANCE * 100}%. Daily limit: ${FOCUS_LOOT_DAILY_CAP} items.`}</p>
            <button type="button" data-oficina-save-session style={{ ...sm2Button('primary'), justifySelf: 'end' }} disabled={!draft.name.trim() || !isFocusEnvironmentId(draft.environment)} onClick={saveSession}>{isPt ? 'Salvar sessão' : 'Save session'}</button>
          </div>}
        </div>
        {active.id !== 'revisar' && <footer style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {stepIndex > 0 && <button type="button" onClick={() => setStepIndex(i => Math.max(0, i - 1))} style={softLink}>{isPt ? 'Voltar' : 'Back'}</button>}
          <button type="button" onClick={() => setStepIndex(i => i + 1)} style={softLink}>{isPt ? 'Pular' : 'Skip'}</button>
          <button type="button" onClick={() => setStepIndex(i => Math.min(PLAN.length - 1, i + 1))} style={{ ...sm2Button('primary'), marginLeft: 'auto' }}>{isPt ? 'Próxima etapa' : 'Next step'}</button>
        </footer>}
      </section>}

      {tab === 'session' && !editing && session && <article data-oficina-sessao-salva style={{ ...sheetCard, alignItems: 'stretch', gap: 10 }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name={session.status === 'completed' ? 'task_alt' : 'event_note'} size={22} tone="primary" />
          <div style={{ flex: 1, minWidth: 0 }}><h3 style={{ ...sheetCardTitle, margin: 0 }}>{session.name}</h3><p style={{ ...sm2Hint, margin: 0 }}>{session.day} · {session.status === 'completed' ? (isPt ? 'Sessão concluída' : 'Session complete') : (isPt ? 'Sessão pronta' : 'Session ready')}</p></div>
          <button type="button" aria-expanded={expanded} onClick={() => setExpanded(v => !v)} style={softLink}>{expanded ? (isPt ? 'Ocultar detalhes' : 'Hide details') : (isPt ? 'Expandir sessão' : 'Expand session')}</button>
        </header>
        <div data-oficina-session-task-list style={{ display: 'grid', gap: 4 }}>
          {session.taskIds.length ? session.taskIds.map(id => {
            const task = tasks.find(t => t.id === id);
            const name = task?.name ?? session.taskNames[id] ?? '';
            return <div key={id} data-oficina-session-task={id} style={{ ...sm2Text, display: 'grid', gap: 3 }}><span>• {name}</span>{task?.steps?.length ? <ul style={{ margin: '0 0 0 20px', padding: 0 }}>{task.steps.map(step => <li key={step.id} style={sm2Hint}>{step.label}</li>)}</ul> : null}</div>;
          }) : <p style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Nenhuma tarefa vinculada.' : 'No linked tasks.'}</p>}
        </div>
        {expanded && <div data-oficina-session-details style={{ display: 'grid', gap: 6, paddingTop: 8, borderTop: '1px solid var(--sm2-border)' }}>
          <p style={{ ...sm2Hint, margin: 0 }}>{isPt ? `Ritmo: ${session.mode === 'p25' ? 'Pomodoro 25/5' : 'Blocos de foco 50/10'}` : `Rhythm: ${session.mode === 'p25' ? 'Pomodoro 25/5' : 'Focus blocks 50/10'}`}</p>
          {isFocusEnvironmentId(session.environment) && <p data-oficina-session-environment style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Expedição: ' : 'Expedition: '}{FOCUS_ENVIRONMENTS.find(item => item.id === session.environment)?.pt}/{FOCUS_ENVIRONMENTS.find(item => item.id === session.environment)?.en}</p>}
          <p style={{ ...sm2Hint, margin: 0 }}>{isPt ? `Ciclos completos: ${session.completedCycles} · próximo bônus ${focusExtraChance(session.completedCycles)}%` : `Completed cycles: ${session.completedCycles} · next bonus ${focusExtraChance(session.completedCycles)}%`}</p>
          {session.ifThen.cue || session.ifThen.action ? <p style={{ ...sm2Hint, margin: 0 }}><Icon name="flag" size={16} tone="primary" /> {session.ifThen.cue} → {session.ifThen.action}</p> : null}
          {session.dump.trim() ? <p style={{ ...sm2Hint, margin: 0 }}><Icon name="psychology" size={16} tone="primary" /> {session.dump}</p> : null}
          {session.quadrant && <p style={{ ...sm2Hint, margin: 0 }}>{isPt ? `Matriz: ${session.quadrant}` : `Matrix: ${session.quadrant}`}</p>}
        </div>}
        {confirmDelete && <p role="alert" style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Excluir esta sessão?' : 'Delete this session?'}</p>}
        <footer style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {session.status === 'ready' && <>
            {!timer && <button type="button" onClick={startEdit} style={softLink}>{isPt ? 'Editar sessão' : 'Edit session'}</button>}
            {!confirmDelete ? <button type="button" onClick={() => setConfirmDelete(true)} style={softLink}>{isPt ? 'Excluir sessão' : 'Delete session'}</button> : <><button type="button" onClick={deleteSession} style={{ ...softLink, color: 'var(--sm2-danger, #b42318)' }}>{isPt ? 'Confirmar exclusão' : 'Confirm delete'}</button><button type="button" onClick={() => setConfirmDelete(false)} style={softLink}>{isPt ? 'Manter' : 'Keep'}</button></>}
            <button type="button" data-oficina-session-pomodoro disabled={!!timer} onClick={startSessionFocus} style={{ ...sm2Button('outline'), marginLeft: 'auto' }}>{isPt ? 'Iniciar Pomodoro' : 'Start Pomodoro'}</button>
            <button type="button" data-oficina-complete-session disabled={!!timer} onClick={completeSession} style={sm2Button('primary')}>{isPt ? 'Concluir sessão' : 'Complete session'}</button>
          </>}
          {session.status === 'completed' && <button type="button" data-oficina-new-session onClick={newSession} style={{ ...sm2Button('outline'), marginLeft: 'auto' }}>{isPt ? 'Nova sessão' : 'New session'}</button>}
        </footer>
      </article>}

      {tab === 'session' && !editing && !session && <button type="button" data-oficina-new-session onClick={startEdit} style={sm2Button('outline')}>{isPt ? 'Planejar sessão' : 'Plan a session'}</button>}

      {tab === 'guides' && <ul style={sheetCardList} data-oficina-guias>
        {FOCO_TECNICAS.map(t => {
          const open = openId === t.id;
          return <li key={t.id} data-oficina-tecnica={t.id} style={{ ...sheetCard, padding: 0 }}>
            <button type="button" data-oficina-tecnica-btn aria-expanded={open} onClick={() => setOpenId(open ? null : t.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: 'var(--sm2-space-3, 12px)', background: 'none', border: 0, color: 'inherit', font: 'inherit', cursor: 'pointer', minHeight: 56 }}>
              <Icon name={t.icon} size={24} tone="primary" />
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}><span style={sheetCardTitle}>{isPt ? t.namePt : t.nameEn}</span><span style={{ ...sm2Hint, margin: 0 }}>{isPt ? t.linePt : t.lineEn}</span></span>
              <span data-oficina-tecnica-kind={t.timer ? 'timer' : 'guia'} style={{ ...sm2Hint, margin: 0 }}>{t.timer ? (isPt ? 'Timer' : 'Timer') : (isPt ? 'Guia' : 'Guide')}</span>
            </button>
            {open && <div data-oficina-tecnica-corpo style={{ ...sm2Text, padding: '0 var(--sm2-space-3, 12px) var(--sm2-space-3, 12px)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span><strong>{isPt ? EVIDENCIA_LABEL[t.evidencia].pt : EVIDENCIA_LABEL[t.evidencia].en}.</strong>{' '}{isPt ? t.howPt : t.howEn}</span>
              <em style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Fonte: ' : 'Source: '}{t.fonte}</em>
              {!t.timer && <span data-oficina-tecnica-guia style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'É um guia para fazer por conta própria; não tem registro aqui.' : 'A guide to try on your own; there is no log here.'}</span>}
            </div>}
          </li>;
        })}
      </ul>}
    </div>
  );
}

function TaskPicker({ tasks, value, onChange, isPt }: { tasks: WorkshopTask[]; value: string; onChange: (id: string) => void; isPt: boolean }) {
  return <label style={{ ...sm2Text, display: 'grid', gap: 4 }}>{isPt ? 'Escolha uma tarefa' : 'Choose a task'}
    <select aria-label={isPt ? 'Escolha uma tarefa' : 'Choose a task'} value={value} onChange={e => onChange(e.target.value)} style={{ minHeight: 44, color: 'var(--sm2-ink)', background: 'var(--sm2-surface)', border: '1px solid var(--sm2-border)', borderRadius: 8 }}>
      <option value="">{isPt ? 'Selecionar…' : 'Select…'}</option>
      {tasks.filter(t => !t.completed).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
    </select>
  </label>;
}
