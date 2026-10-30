import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { RewardPreview } from '../ui/RewardPreview';
import { Segment, sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { ModalInfo, InfoTipSection } from '../ui/InfoTip';
import { Icon } from '../ui/Icon';
import { sheetCard, sheetCardList, sheetCardTitle } from '../nav/sheetKit';
import type { Language } from '../../utils/i18n';
import {
  FOCUS_ENVIRONMENTS, FOCUS_LOOT_DAILY_CAP, FOCUS_PLAN_EVENT_PREFIX, focusExtraChance,
  isFocusEnvironmentId, type FocusEnvironmentId, type FocusLootItem, type FocusLootRequest,
} from '../../utils/focusExpedition';
import { EVIDENCIA_LABEL, FOCO_TECNICAS } from '../../data/focoTecnicas';
import { readJson, removeLocal, writeJson } from '../../utils/safeStorage';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import {
  FOCO_MODES, armEndNotice, disarmEndNotice, formatClock, isLongBreak, loadSessions, loadTimer, pause,
  recordSession, remainingMs, resume, saveSessions, saveTimer, sessionsToday, settle, startPhase,
  type FocoModeId, type FocoTimer,
} from '../../utils/focoTimer';
import {
  completeSession as finishSession, doneToday, emptyDraft, markDone, normalizeHistory, normalizeSession,
  recordDone, saveSession as buildSession, toDraft, type DoneSession, type FocoSession, type SessionDraft,
} from '../../utils/focoSessao';
import { TagChips } from './OficinaTags';
import { OficinaPlano } from './OficinaPlano';

/** A folha inteira já é lazy (AreaView); o planejamento viaja junto, fora do chunk de entrada. */
type WorkshopTask = { id: string; name: string; completed: boolean; steps?: Array<{ id: string; label: string; completed: boolean }> };
export type FocusRewardResult = { accepted: boolean; items: FocusLootItem[]; chancePercent: number };

const loadWorkshopSession = (): FocoSession | null => normalizeSession(readJson<unknown>(STORAGE_KEYS.FOCO_WORKSHOP_PLAN, null));

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

export function OficinaSheet({ language, todayKey, tasks = [], onCompleteTask = () => {}, onFocusReward, onPlanReward, onFocusCycle, planInPrepare = false, onFocusStart, onFocusPause, onFocusResume, onFocusCancel }: {
  language: Language; todayKey?: string; tasks?: WorkshopTask[]; onCompleteTask?: (taskId: string) => void;
  onFocusReward?: (request: FocusLootRequest, completedCycles: number) => FocusRewardResult;
  /** Recompensa por concluir o processo (1 item, teto diário no ledger). Sem ela, concluir não paga. */
  onPlanReward?: (request: FocusLootRequest) => FocusRewardResult;
  /** Um ciclo de foco (Pomodoro) terminou de verdade — a missão do dia conta o evento (REGISTRO §52). */
  onFocusCycle?: () => void;
  /** beta3 F1: o planejamento da sessão mora no prédio "Prepare to Focus"; aqui só se executa a sessão pronta. */
  planInPrepare?: boolean;
  /** beta3 F1: o timer de foco começou — abre a descida da masmorra em background e devolve o que aconteceu (para o aviso). */
  onFocusStart?: (focusEndsAt?: number) => 'started' | 'busy' | 'no-hp' | 'no-energy';
  /** A descida do foco acompanha o timer: pausar congela, continuar retoma (com o novo fim), cancelar retira o Soulmon (livre, com o que rendeu). */
  onFocusPause?: () => void;
  onFocusResume?: (focusEndsAt?: number) => void;
  onFocusCancel?: () => void;
}) {
  const isPt = language === 'pt-BR';
  const day = todayKey ?? fallbackDay();
  const [mode, setMode] = useState<FocoModeId>('p25');
  const [timer, setTimer] = useState<FocoTimer | null>(() => { const t = loadTimer(); return t ? settle(t, Date.now()) : null; });
  const [days, setDays] = useState(() => loadSessions());
  const [openId, setOpenId] = useState<string | null>(null);
  const [tab, setTab] = useState<'session' | 'guides'>('session');
  const [session, setSession] = useState<FocoSession | null>(loadWorkshopSession);
  const [history, setHistory] = useState<DoneSession[]>(() => normalizeHistory(readJson<unknown>(STORAGE_KEYS.FOCO_WORKSHOPS, [])));
  const [editing, setEditing] = useState(() => !planInPrepare && !loadWorkshopSession());
  const [prepHint, setPrepHint] = useState(false);
  const [descent, setDescent] = useState<'started' | 'busy' | 'no-hp' | 'no-energy' | null>(null);
  const [initial, setInitial] = useState<SessionDraft>(emptyDraft);
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lootNotice, setLootNotice] = useState<FocusRewardResult | null>(null);
  const [planNotice, setPlanNotice] = useState<FocusRewardResult | null>(null);
  const now = useNow(timer?.status === 'running');

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

  const writeSession = (next: FocoSession | null) => {
    setSession(next);
    if (next) writeJson(STORAGE_KEYS.FOCO_WORKSHOP_PLAN, next);
    else removeLocal(STORAGE_KEYS.FOCO_WORKSHOP_PLAN, { silent: true });
  };
  const feito = () => {
    if (!timer) return;
    const next = recordSession(days, day, timer.totalMs / 60_000);
    setDays(next); saveSessions(next);
    onFocusCycle?.();
    if (session && timer.expeditionId && timer.sessionId === session.id) {
      const request: FocusLootRequest = { day, environment: timer.expeditionId as FocusEnvironmentId, sessionId: timer.sessionId, eventId: `${timer.sessionId}:${timer.phaseId}` };
      setLootNotice(onFocusReward?.(request, session.completedCycles) ?? null);
    }
    apply(startPhase(timer.mode, 'break', Date.now(), isLongBreak(timer.mode, sessionsToday(next, day)), timer.expeditionId && timer.sessionId ? { expeditionId: timer.expeditionId, sessionId: timer.sessionId } : undefined));
  };
  const fimDaPausa = () => {
    if (timer?.sessionId && session?.id === timer.sessionId) writeSession({ ...session, completedCycles: Math.min(99, session.completedCycles + 1) });
    apply(null);
  };
  const cancelarTimer = () => {
    if (timer?.phase === 'focus') { onFocusCancel?.(); setDescent(null); }
    if (timer?.sessionId && session?.id === timer.sessionId && session.completedCycles !== 0) writeSession({ ...session, completedCycles: 0 });
    setLootNotice(null);
    apply(null);
  };
  const pickMode = (m: FocoModeId) => { setMode(m); if (session?.status === 'ready') writeSession({ ...session, mode: m }); };
  const hoje = sessionsToday(days, day);
  const startEdit = () => { if (planInPrepare) { setPrepHint(true); return; } setInitial(session ? toDraft(session) : emptyDraft()); setEditing(true); setTab('session'); };
  const saveDraft = (draft: SessionDraft) => {
    const next = buildSession(draft, tasks, { id: `foco-${Date.now()}`, day, prev: session?.status === 'ready' ? session : null });
    if (!next) return;
    writeSession(next); setEditing(false); setExpanded(false); setConfirmDelete(false);
  };
  /** Marcar aqui = a MESMA conclusão do jogo (handler injetado: XP, meta, itens). Aqui só guardo o check. */
  const checkTask = (id: string) => {
    if (!session) return;
    if (tasks.some(t => t.id === id && !t.completed)) onCompleteTask(id);
    writeSession(markDone(session, id));
  };
  const completeSession = () => {
    if (!session || session.status === 'completed') return;
    const next = finishSession(session);
    if (next === session) return;
    writeSession(next);
    const h = recordDone(history, next);
    setHistory(h); writeJson(STORAGE_KEYS.FOCO_WORKSHOPS, h, { silent: true });
    if (onPlanReward && isFocusEnvironmentId(next.environment)) {
      setPlanNotice(onPlanReward({ day, environment: next.environment, sessionId: next.id, eventId: `${FOCUS_PLAN_EVENT_PREFIX}${next.id}` }));
    }
  };
  const deleteSession = () => { if (timer?.sessionId === session?.id) { if (timer?.phase === 'focus') { onFocusCancel?.(); setDescent(null); } apply(null); } writeSession(null); setEditing(false); setConfirmDelete(false); setExpanded(false); setLootNotice(null); };
  const newSession = () => { if (planInPrepare) { setPrepHint(true); return; } writeSession(null); setPlanNotice(null); setInitial(emptyDraft()); setEditing(true); setExpanded(false); setTab('session'); };
  const left = timer ? remainingMs(timer, now) : FOCO_MODES[mode].focusMin * 60_000;
  const ended = timer?.status === 'ended';
  const timerLabel = timer ? (timer.phase === 'focus' ? (isPt ? 'Foco' : 'Focus') : (isPt ? 'Pausa' : 'Break')) : (isPt ? 'Foco' : 'Focus');
  const canStartSessionFocus = !!session && session.status === 'ready' && !editing && isFocusEnvironmentId(session.environment);
  const startSessionFocus = () => {
    if (!canStartSessionFocus || !session) { startEdit(); return; }
    setMode(session.mode);
    setLootNotice(null);
    const phase = startPhase(session.mode, 'focus', Date.now(), false, { expeditionId: session.environment, sessionId: session.id });
    setDescent(onFocusStart ? onFocusStart(phase.endAt ?? undefined) : null);
    apply(phase);
  };
  const isDone = (id: string) => !!session?.doneIds.includes(id) || tasks.some(t => t.id === id && t.completed);
  const todays = doneToday(history, day);

  return (
    <div data-oficina style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <p style={{ ...sectionHead, flex: 1 }}>{isPt ? 'Timer de foco' : 'Focus timer'}</p>
        <ModalInfo language={language} align="right" label={isPt ? 'Como funciona a Oficina' : 'How the Workshop works'}>
          <InfoTipSection title={isPt ? 'Timer de foco' : 'Focus timer'}>
            {isPt ? 'O relógio segue o horário real. Ao fim, o app avisa na tela e vibra de leve (e fora do app, se você permitiu notificações). Sem alarme sonoro. ' + '“Foquei” guarda um registro do dia só neste aparelho: sem placar, sem sequência, sem Bits. ' + 'Os Bits (dentro do teto diário) vêm da descida do Soulmon enquanto você foca; pausar pausa a descida e cancelar recolhe o Soulmon com o que já rendeu.' : 'The clock follows real time. At the end the app tells you on screen and buzzes lightly (and outside the app, if you allowed notifications). No alarm sound. ' + '“I focused” keeps a note of the day on this device only: no scoreboard, no streak, no Bits. ' + 'Bits (within the daily cap) come from your Soulmon\'s descent while you focus; pausing pauses it, and cancelling brings it home with what it earned.'}
          </InfoTipSection>
          {FOCO_TECNICAS.map((t, i) => <InfoTipSection key={t.id} title={isPt ? t.namePt : t.nameEn} last={i === FOCO_TECNICAS.length - 1}>
            <strong>{isPt ? EVIDENCIA_LABEL[t.evidencia].pt : EVIDENCIA_LABEL[t.evidencia].en}.</strong>{' '}{isPt ? t.howPt : t.howEn}{' '}<em>{isPt ? 'Fonte: ' : 'Source: '}{t.fonte}</em>
          </InfoTipSection>)}
        </ModalInfo>
      </div>

      <div data-oficina-timer style={{ ...sheetCard, alignItems: 'center', gap: 12 }}>
        {!timer && <div role="radiogroup" aria-label={isPt ? 'Ritmo' : 'Rhythm'} style={{ display: 'flex', gap: 8, width: '100%' }}>
          <Segment selected={mode === 'p25'} onSelect={() => pickMode('p25')} label="25 / 5" />
          <Segment selected={mode === 'p50'} onSelect={() => pickMode('p50')} label="50 / 10" />
        </div>}
        <p style={sectionHead}>{timerLabel}</p>
        <p role="timer" data-oficina-clock className="sm2-num" style={{ margin: 0, fontFamily: 'var(--sm2-font-display)', fontWeight: 700, fontSize: 48, lineHeight: 1, color: 'var(--sm2-ink)' }}>{formatClock(left)}</p>
        {ended && <p role="status" data-oficina-fim style={{ ...sm2Text, margin: 0, textAlign: 'center' }}>{timer?.phase === 'focus' ? (isPt ? 'O tempo acabou.' : 'Time is up.') : (isPt ? 'A pausa acabou.' : 'The break is over.')}</p>}
        <div style={{ display: 'flex', gap: 8, width: '100%', flexWrap: 'wrap' }}>
          {!timer && <RewardPreview mode="before" language={language} size={14} items={[{ kind: 'custom', emoji: '🎁', label: isPt ? 'material de foco' : 'focus material' }]} />}
          {timer && <button type="button" data-oficina-cancel onClick={cancelarTimer} style={{ ...sm2Button('outline'), flex: ended ? 0 : 1 }}>{ended && timer.phase === 'focus' ? (isPt ? 'Agora não' : 'Not now') : (isPt ? 'Cancelar' : 'Cancel')}</button>}
          {!timer && <button type="button" data-oficina-start onClick={startSessionFocus} style={{ ...sm2Button('primary'), flex: 1 }}>{canStartSessionFocus ? (isPt ? 'Enviar Soulmon e iniciar' : 'Send Soulmon & start') : (isPt ? 'Planejar sessão e escolher cenário' : 'Plan a session & choose a scene')}</button>}
          {timer?.status === 'running' && <button type="button" data-oficina-pause onClick={() => { if (timer.phase === 'focus') onFocusPause?.(); apply(pause(timer, Date.now())); }} style={{ ...sm2Button('primary'), flex: 1 }}><Icon name="pause" size={20} tone="inherit" /> {isPt ? 'Pausar' : 'Pause'}</button>}
          {timer?.status === 'paused' && <button type="button" data-oficina-resume onClick={() => { const r = resume(timer, Date.now()); if (timer.phase === 'focus') onFocusResume?.(r.endAt ?? undefined); apply(r); }} style={{ ...sm2Button('primary'), flex: 1 }}><Icon name="play_arrow" size={20} tone="inherit" /> {isPt ? 'Continuar' : 'Resume'}</button>}
          {ended && timer?.phase === 'focus' && <button type="button" data-oficina-foquei onClick={feito} style={{ ...sm2Button('primary'), flex: 1 }}>{isPt ? 'Foquei' : 'I focused'}</button>}
          {ended && timer?.phase === 'break' && <button type="button" data-oficina-ok onClick={fimDaPausa} style={{ ...sm2Button('primary'), flex: 1 }}>{isPt ? 'Pronto' : 'Done'}</button>}
        </div>
        {lootNotice && <p role="status" data-oficina-loot style={{ ...sm2Text, margin: 0, textAlign: 'center' }}>
          {lootNotice.accepted
            ? `${isPt ? 'O Soulmon voltou com' : 'Soulmon returned with'}: ${lootNotice.items.map(item => `${item.icon} ${isPt ? item.namePt : item.nameEn}`).join(' · ')}${lootNotice.items.length > 1 ? ` (${isPt ? 'bônus' : 'bonus'} ${lootNotice.chancePercent}%)` : ''}`
            : (isPt ? `Teto diário de ${FOCUS_LOOT_DAILY_CAP} itens alcançado.` : `Daily cap of ${FOCUS_LOOT_DAILY_CAP} items reached.`)}
        </p>}
        {descent && timer?.phase === 'focus' && <p role="status" data-oficina-descida={descent} style={{ ...sm2Hint, margin: 0, textAlign: 'center' }}>
          {descent === 'started'
            ? (isPt ? 'Enquanto você foca, o Soulmon desce a Fenda sozinho.' : 'While you focus, your Soulmon goes down the Endless Rift on its own.')
            : descent === 'busy'
              ? (isPt ? 'O Soulmon já está ocupado; a descida dele segue.' : 'Your Soulmon is already busy; his descent goes on.')
              : descent === 'no-hp'
                ? (isPt ? 'O Soulmon está sem fôlego para descer agora.' : 'Your Soulmon is too out of breath to go down right now.')
                : (isPt ? 'Sem energia para a descida agora.' : 'No energy for a descent right now.')}
        </p>}
        {prepHint && <p role="status" data-oficina-prepare-hint style={{ ...sm2Hint, margin: 0, textAlign: 'center' }}>{isPt ? 'Planeje a sessão no prédio "Preparar o Foco".' : 'Plan the session in the "Prepare to Focus" building.'}</p>}
        {hoje > 0 && <p data-oficina-hoje style={{ ...sm2Hint, margin: 0 }}>{isPt ? `Hoje: ${hoje} ${hoje === 1 ? 'foco' : 'focos'}` : `Today: ${hoje} ${hoje === 1 ? 'focus' : 'focuses'}`}</p>}
      </div>

      <div role="tablist" aria-label={isPt ? 'Oficina do Foco' : 'Focus Workshop'} data-oficina-tabs style={{ display: 'flex', alignItems: 'center', gap: 18, borderBottom: '1px solid var(--sm2-border)' }}>
        <button type="button" role="tab" aria-selected={tab === 'session'} onClick={() => setTab('session')} style={{ ...softLink, textDecoration: tab === 'session' ? 'underline' : 'none', color: tab === 'session' ? 'var(--sm2-ink)' : 'var(--sm2-muted)' }}>{isPt ? 'Sessão' : 'Session'}</button>
        <button type="button" role="tab" aria-selected={tab === 'guides'} onClick={() => setTab('guides')} style={{ ...softLink, textDecoration: tab === 'guides' ? 'underline' : 'none', color: tab === 'guides' ? 'var(--sm2-ink)' : 'var(--sm2-muted)' }}>{isPt ? 'Guias' : 'Guides'}</button>
      </div>

      {tab === 'session' && editing && <OficinaPlano language={language} tasks={tasks} initial={initial} onSave={saveDraft} onCancel={() => setEditing(false)} />}

      {tab === 'session' && !editing && session && <article data-oficina-sessao-salva style={{ ...sheetCard, alignItems: 'stretch', gap: 10 }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name={session.status === 'completed' ? 'check_circle' : 'task_alt'} size={24} tone="primary" />
          <div style={{ flex: 1, minWidth: 0 }}><h3 style={{ ...sheetCardTitle, margin: 0, overflowWrap: 'anywhere' }}>{session.name}</h3><p style={{ ...sm2Hint, margin: 0 }}>{session.day} · {session.status === 'completed' ? (isPt ? 'Sessão concluída' : 'Session complete') : (isPt ? 'Sessão pronta' : 'Session ready')}</p></div>
          <button type="button" aria-expanded={expanded} onClick={() => setExpanded(v => !v)} style={softLink}>{expanded ? (isPt ? 'Ocultar detalhes' : 'Hide details') : (isPt ? 'Expandir sessão' : 'Expand session')}</button>
        </header>
        <div data-oficina-session-task-list style={{ display: 'grid', gap: 6 }}>
          {session.plan.length ? <ol style={{ ...sheetCardList, margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>{session.plan.map(item => {
            const task = tasks.find(t => t.id === item.id);
            const done = isDone(item.id);
            return <li key={item.id} data-oficina-session-task={item.id} style={{ display: 'grid', gap: 3 }}>
              <button type="button" role="checkbox" aria-checked={done} disabled={done || session.status === 'completed'} data-oficina-check={item.id} onClick={() => checkTask(item.id)} style={{ ...sm2Button(done ? 'quiet' : 'outline'), display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 8, textAlign: 'left', width: '100%', minHeight: 44 }}>
                <Icon name={done ? 'check_circle' : 'radio_button_unchecked'} size={20} tone="inherit" />
                <span style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere', textDecoration: done ? 'line-through' : 'none' }}>{item.name}</span>
                <TagChips tags={item.tags.slice(0, 2)} isPt={isPt} />
              </button>
              {task?.steps?.length ? <ul style={{ margin: '0 0 0 36px', padding: 0 }}>{task.steps.map(step => <li key={step.id} style={sm2Hint}>{step.label}</li>)}</ul> : null}
            </li>;
          })}</ol> : <p style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Nenhuma tarefa na lista.' : 'No tasks on the list.'}</p>}
        </div>
        {expanded && <div data-oficina-session-details style={{ display: 'grid', gap: 6, paddingTop: 8, borderTop: '1px solid var(--sm2-border)' }}>
          <p style={{ ...sm2Hint, margin: 0 }}>{isPt ? `Ritmo: ${session.mode === 'p25' ? 'Pomodoro 25/5' : 'Blocos de foco 50/10'}` : `Rhythm: ${session.mode === 'p25' ? 'Pomodoro 25/5' : 'Focus blocks 50/10'}`}</p>
          {isFocusEnvironmentId(session.environment) && <p data-oficina-session-environment style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Expedição: ' : 'Expedition: '}{FOCUS_ENVIRONMENTS.find(item => item.id === session.environment)?.[isPt ? 'pt' : 'en']}</p>}
          <p style={{ ...sm2Hint, margin: 0 }}>{isPt ? `Ciclos completos: ${session.completedCycles} · próximo bônus ${Math.round(focusExtraChance(session.completedCycles) * 100)}%` : `Completed cycles: ${session.completedCycles} · next bonus ${Math.round(focusExtraChance(session.completedCycles) * 100)}%`}</p>
          {(session.ifThen.cue || session.ifThen.action) && <p style={{ ...sm2Hint, margin: 0 }}><Icon name="flag" size={20} tone="primary" /> {session.ifThen.cue} → {session.ifThen.action}</p>}
          {session.dump.trim() && <p style={{ ...sm2Hint, margin: 0, overflowWrap: 'anywhere' }}><Icon name="psychology" size={20} tone="primary" /> {session.dump}</p>}
        </div>}
        {planNotice && <p role="status" data-oficina-plan-loot style={{ ...sm2Text, margin: 0 }}>
          {planNotice.accepted
            ? `${isPt ? 'Sessão concluída. O Soulmon trouxe' : 'Session complete. Soulmon brought'}: ${planNotice.items.map(item => `${item.icon} ${isPt ? item.namePt : item.nameEn}`).join(' · ')}`
            : (isPt ? 'Sessão concluída. O limite de itens de hoje já foi alcançado.' : 'Session complete. Today’s item limit has been reached.')}
        </p>}
        {confirmDelete && <p role="alert" style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Excluir esta sessão?' : 'Delete this session?'}</p>}
        <footer style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {session.status === 'ready' && <>
            {!timer && <button type="button" onClick={startEdit} style={softLink}>{isPt ? 'Editar sessão' : 'Edit session'}</button>}
            {!confirmDelete ? <button type="button" onClick={() => setConfirmDelete(true)} style={softLink}>{isPt ? 'Excluir sessão' : 'Delete session'}</button> : <><button type="button" onClick={deleteSession} style={{ ...softLink, color: 'var(--sm2-danger-ink)' }}>{isPt ? 'Confirmar exclusão' : 'Confirm delete'}</button><button type="button" onClick={() => setConfirmDelete(false)} style={softLink}>{isPt ? 'Manter' : 'Keep'}</button></>}
            <button type="button" data-oficina-session-pomodoro disabled={!!timer} onClick={startSessionFocus} style={{ ...sm2Button('outline'), marginLeft: 'auto' }}>{isPt ? 'Iniciar Pomodoro' : 'Start Pomodoro'}</button>
            <button type="button" data-oficina-complete-session disabled={!!timer || session.plan.length === 0} onClick={completeSession} style={sm2Button('primary')}>{isPt ? 'Concluir sessão' : 'Complete session'}</button>
          </>}
          {session.status === 'completed' && <button type="button" data-oficina-new-session onClick={newSession} style={{ ...sm2Button('outline'), marginLeft: 'auto' }}>{isPt ? 'Nova sessão' : 'New session'}</button>}
        </footer>
      </article>}

      {tab === 'session' && !editing && !session && <button type="button" data-oficina-new-session onClick={startEdit} style={sm2Button('outline')}>{isPt ? 'Planejar sessão' : 'Plan a session'}</button>}

      {tab === 'session' && !editing && todays.length > 0 && <p data-oficina-concluidas style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Sessões concluídas hoje: ' : 'Sessions completed today: '}{todays.map(d => d.name).join(' · ')}</p>}

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
