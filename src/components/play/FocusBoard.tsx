import { CtaButton } from '../ui/CtaButton';
/**
 * O QUADRO DA OFICINA (§247): card Sessão em destaque + 6 cards de chave (as técnicas de antes, agora opcionais).
 * O servidor guarda a jornada; aqui se escolhe ritmo, cenário e chaves, se começa e se volta à jornada em andamento.
 */
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useBackLayer } from '../../utils/backStack';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { Icon } from '../ui/Icon';
import { checkBoxStyle, CheckMark } from '../pixel/RitualPanel';
import { sheetCard, sheetCardTitle } from '../nav/sheetKit';
import type { Language } from '../../utils/i18n';
import { FOCUS_ENVIRONMENTS, isFocusEnvironmentId, type FocusEnvironmentId } from '../../utils/focusExpedition';
import { JOURNEY_KEYS, JOURNEY_MODES, KEY_OF_STEP, focusElapsed, focusEndAt, type JourneyGrants, type JourneyItem, type JourneyKeyId, type JourneyMode } from '../../utils/focusJourney';
import { keyEarned, loadBoardKeys, saveBoardKeys } from '../../utils/focusBoard';
import { journeyAction, journeyStart, journeyState, type ActiveJourney, type JourneyResponse } from '../../utils/focusJourneyApi';
import type { Ice } from '../../utils/iceScore';
import { buildPlan, emptyDraft, normalizeSession, toDraft, type SessionDraft } from '../../utils/focoSessao';
import { readJson, writeJson } from '../../utils/safeStorage';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { formatClock } from '../../utils/focoTimer';
import { OficinaPlano } from './OficinaPlano';
import { RestRoom } from './RestRoom';
import { loadRest, restFromFocusEnd, restLeftMs, restEndsAt, saveRest, type RestState } from '../../utils/focusRest';
import { cancelFocusAlarm, scheduleFocusAlarm } from '../../utils/focusNotify';
import { FocusTaskPicker } from './FocusTaskPicker';
import { loadFocusSession, saveFocusSession, type FocusSessionState } from '../../utils/focusSession';
import { mergeItems } from '../../utils/journeyItemInfo';
import { JourneyScreen, KEY_COLOR, KeyGlyph } from './JourneyScreen';
import { useRequireAwake } from '../WakeToEnter';

type BoardTask = { id: string; name: string; completed: boolean; kind?: 'habit'; ice?: Ice; steps?: Array<{ id: string; label: string; completed: boolean }> };
const CARD: Record<JourneyKeyId, { pt: string; en: string; keyPt: string; keyEn: string }> = {
  bancada: { pt: 'Preparar o espaço', en: 'Prepare your space', keyPt: 'Chave de Bancada', keyEn: 'Bench Key' },
  relampago: { pt: 'Dois minutos', en: 'Two minutes', keyPt: 'Chave Relâmpago', keyEn: 'Lightning Key' },
  quadrantes: { pt: 'Prioridades', en: 'Priorities', keyPt: 'Chave das Prioridades', keyEn: 'Priorities Key' },
  brejo: { pt: 'O sapo primeiro', en: 'Eat the frog', keyPt: 'Chave do Brejo', keyEn: 'Marsh Key' },
  elo: { pt: 'Se… então…', en: 'If… then…', keyPt: 'Chave de Elo', keyEn: 'Link Key' },
  pena: { pt: 'Descarregar a mente', en: 'Brain dump', keyPt: 'Chave de Pena', keyEn: 'Quill Key' },
};

const loadDraft = (): SessionDraft => { const s = normalizeSession(readJson<unknown>(STORAGE_KEYS.FOCO_PLAN_DRAFT, null)); return s ? toDraft(s) : emptyDraft(); };
const saveDraft = (d: SessionDraft) => { writeJson(STORAGE_KEYS.FOCO_PLAN_DRAFT, { ...d, id: 'draft', day: '', status: 'ready' }, { silent: true }); };
const loadPrefs = (): { mode: JourneyMode; env: FocusEnvironmentId } => {
  const r = readJson<{ mode?: unknown; env?: unknown } | null>(STORAGE_KEYS.FOCO_JOURNEY_PREFS, null);
  return { mode: r?.mode === 'p50' ? 'p50' : 'p25', env: isFocusEnvironmentId(r?.env) ? r!.env as FocusEnvironmentId : 'forest' };
};

export function FocusBoard({ language, todayKey, saveId, tasks = [], petSprite, onCompleteTask = () => {}, onToggleStep = () => {}, onSetIce, onCreateTask, onGrants, onFocusCycle }: {
  language: Language; todayKey: string; saveId?: string; tasks?: BoardTask[]; petSprite?: string;
  onCompleteTask?: (id: string) => void;
  /** Subtópico de tarefa marcado na lista da sessão: o mesmo handler da Home (`handleToggleTaskStep`). */
  onToggleStep?: (taskId: string, stepId: string) => void;
  /** Prioridades: grava (ou limpa, com `null`) as 4 notas ICE na tarefa. */
  onSetIce?: (taskId: string, ice: Ice | null) => void;
  /** Cria uma tarefa na hora (o modal de escolha oferece isso quando não há tarefa aberta). `false` = não coube. */
  onCreateTask?: (name: string) => boolean;
  onGrants: (day: string, grants: JourneyGrants, dungeonKeyDay?: string) => void;
  /** Um foco terminou de verdade: a missão do dia conta o evento (REGISTRO §52). Leva o id da tarefa ESCOLHIDA na sessão (`habit:<id>` = hábito): o App marca o hábito de foco adotado que a sessão usou (beta12 §J, Q5). */
  onFocusCycle?: (taskId?: string) => void;
}) {
  const isPt = language === 'pt-BR';
  const [keys, setKeys] = useState<JourneyKeyId[]>(loadBoardKeys);
  const [draft, setDraft] = useState<SessionDraft>(loadDraft);
  const [prefs, setPrefs] = useState(loadPrefs);
  const [openCard, setOpenCard] = useState<JourneyKeyId | null>(null);
  const [active, setActive] = useState<ActiveJourney | null>(null);
  const [delta, setDelta] = useState(0);
  const [online, setOnline] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [showJourney, setShowJourney] = useState(false);
  const [lastItems, setLastItems] = useState<JourneyItem[] | null>(null);
  const [doneNote, setDoneNote] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [envOpen, setEnvOpen] = useState(false);
  const [session, setSession] = useState<FocusSessionState | null>(loadFocusSession);
  const [pickOpen, setPickOpen] = useState(false);
  const [rest, setRest] = useState<RestState | null>(() => loadRest());
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [restNote, setRestNote] = useState<string | null>(null);
  const setRestState = useCallback((r: RestState | null) => { setRest(r); saveRest(r); }, []);
  /* O relógio do descanso é o do aparelho, por timestamp: sair e voltar não muda a conta. */
  useEffect(() => {
    if (!rest) return;
    const tick = () => setNowMs(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [rest]);
  const updateSession = useCallback((fn: (s: FocusSessionState) => FocusSessionState) => {
    setSession(prev => { if (!prev) return prev; const n = fn(prev); saveFocusSession(n); return n; });
  }, []);

  const absorb = useCallback((r: JourneyResponse, prevGrants?: Set<string>) => {
    setDelta(r.now - Date.now());
    if (r.grants && r.ledger) {
      const novos = Object.keys(r.grants).filter(k => !prevGrants?.has(k));
      if (novos.length) { const itens = novos.flatMap(k => r.grants![k]); setLastItems(itens); updateSession(s => ({ ...s, collected: mergeItems(s.collected, itens) })); }
      onGrants(r.ledger.day, r.grants, r.dungeonKeyDay);
    }
    setActive(r.active);
  }, [onGrants, updateSession]);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  /* Avisos com o app fechado (§301): «hora do descanso» no fim do foco (anda com as pausas) e «descanso acabou» no fim do descanso. */
  useEffect(() => {
    const end = active ? focusEndAt(active) : null;
    if (end === null) cancelFocusAlarm('focus-end'); else scheduleFocusAlarm('focus-end', end - delta, language);
  }, [active, delta, language]);
  useEffect(() => {
    if (!rest) { cancelFocusAlarm('rest-end'); return; }
    scheduleFocusAlarm('rest-end', restEndsAt(rest), language);
  }, [rest, language]);

  const refresh = useCallback(() => {
    if (!saveId) { setOnline(false); return; }
    journeyState(saveId, todayKey).then(r => { setOnline(true); setSeen(new Set(Object.keys(r.grants ?? {}))); absorb(r); }).catch(() => setOnline(false));
  }, [saveId, todayKey, absorb]);
  useEffect(() => {
    refresh();
    const back = () => { if (online === false) refresh(); };
    window.addEventListener('online', back);
    return () => window.removeEventListener('online', back);
  }, [refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = (action: 'pause' | 'resume' | 'claim' | 'end') => {
    if (!saveId) return;
    journeyAction(saveId, action).then(r => {
      const had = active;
      absorb(r, seen);
      setSeen(new Set(Object.keys(r.grants ?? {})));
      if (!r.active && had) {
        setKeys([]); saveBoardKeys([]);
        setDraft(emptyDraft()); saveDraft(emptyDraft());
        if (action === 'claim') {
          /* O foco acabou: o Soulmon atravessa a porta e chega à sala de descanso (§301). A sessão (tarefa, achados) continua. */
          const itens = Object.keys(r.grants ?? {}).filter(k => !seen.has(k)).flatMap(k => r.grants![k]);
          const dKey = !!r.dungeonKeyDay;
          setRestState(restFromFocusEnd(focusEndAt(had), r.now - Date.now(), Date.now(), { mode: had.mode, env: had.env, items: itens, key: dKey }));
          updateSession(s => ({ ...s, cycles: s.cycles + 1, ...(dKey ? { key: true } : {}) }));
          setRestNote(null); setDoneNote(null);
          onFocusCycle?.(session?.taskId);
          return;
        }
        setSession(null); saveFocusSession(null);
        setRestState(null);
        setShowJourney(false);
        setDoneNote(action === 'end'
          ? (isPt ? 'Jornada encerrada. O que o Soulmon achou pelo caminho já é seu.' : 'Journey ended. What your Soulmon found on the way is yours.')
          : r.dungeonKeyDay ? (isPt ? 'Jornada concluída. A chave do Calabouço é sua. Válida por 48 h · 1 uso por dia.' : 'Journey complete. The Dungeon key is yours. Valid for 48 h · 1 use per day.')
            : (isPt ? 'Jornada concluída.' : 'Journey complete.'));
      }
    }).catch(() => setOnline(false));
  };

  /** Começar abre a ESCOLHA DA TAREFA (sempre; sem sessão livre). Confirmada, `begin` liga a tarefa e abre a jornada. */
  /* 💤 §329: a Oficina entra livre (cards, chaves, lista, concluir tarefa — G-01); COMEÇAR a jornada leva o Soulmon e pergunta com ele
     dormindo, no toque. Voltar a uma jornada já em andamento não pergunta. */
  const requireAwake = useRequireAwake();
  const start = () => { if (!saveId || busy) return; requireAwake('forja.oficina', () => { setDoneNote(null); setPickOpen(true); }); };
  const begin = (task: { id: string; name: string }) => {
    if (!saveId || busy) return;
    setBusy(true); setDoneNote(null);
    const fresh: FocusSessionState = { taskId: task.id, taskName: task.name, collected: [], cycles: 0 };
    setSession(fresh); saveFocusSession(fresh);
    journeyStart(saveId, { mode: prefs.mode, env: prefs.env, keys, day: todayKey })
      .then(r => { setOnline(true); absorb(r); if (r.active) { setPickOpen(false); setShowJourney(true); } else { setSession(null); saveFocusSession(null); } })
      .catch(() => { setOnline(false); setSession(null); saveFocusSession(null); setPickOpen(false); })
      .finally(() => setBusy(false));
  };
  /** «Seguir»: outro foco, nova travessia, na mesma sessão (mesma tarefa, mesmo ritmo e cenário). */
  const nextCycle = () => {
    if (!saveId || busy || !rest) return;
    setBusy(true); setRestNote(null);
    journeyStart(saveId, { mode: rest.mode, env: rest.env, keys: [], day: todayKey })
      .then(r => { setOnline(true); absorb(r); if (r.active) { setRestState(null); setShowJourney(true); } else setRestNote(isPt ? 'Não deu para seguir agora.' : "Couldn't keep going right now."); })
      .catch(() => { setOnline(false); setRestNote(isPt ? 'Precisa de conexão para seguir.' : 'Needs a connection to keep going.'); })
      .finally(() => setBusy(false));
  };
  /** «Concluir a missão»: encerra a sessão inteira, com o resumo. O que foi achado já é do jogador. */
  const finishMission = () => {
    const n = session?.cycles ?? 1;
    const key = !!(session?.key || rest?.key);
    setRestState(null); setSession(null); saveFocusSession(null); setShowJourney(false); setRestNote(null);
    setDoneNote(isPt
      ? `Missão concluída: ${n} ${n === 1 ? 'foco' : 'focos'}. O que o Soulmon achou já é seu.${key ? ' A chave do Calabouço é sua hoje.' : ''}`
      : `Mission complete: ${n} ${n === 1 ? 'focus' : 'focuses'}. What your Soulmon found is yours.${key ? ' The Dungeon key is yours today.' : ''}`);
  };
  const setPref = (p: Partial<typeof prefs>) => { const n = { ...prefs, ...p }; setPrefs(n); writeJson(STORAGE_KEYS.FOCO_JOURNEY_PREFS, n, { silent: true }); };
  const envIdx = FOCUS_ENVIRONMENTS.findIndex(e => e.id === prefs.env);
  const env = FOCUS_ENVIRONMENTS[envIdx] ?? FOCUS_ENVIRONMENTS[0];
  const plan = buildPlan(draft, tasks);
  const left = active ? Math.max(0, JOURNEY_MODES[active.mode].focusMin * 60_000 - focusElapsed(active, Date.now() + delta)) : 0;

  if (openCard) {
    const k = openCard;
    return <div data-focus-board-card={k} style={{ display: 'grid', gap: 10 }}>
      <p style={{ ...sm2Hint, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}><KeyGlyph k={k} size={20} />{isPt ? CARD[k].keyPt : CARD[k].keyEn}</p>
      <OficinaPlano language={language} tasks={tasks} initial={draft} onSetIce={onSetIce} onCompleteTask={onCompleteTask} onSave={() => {}} onCancel={() => setOpenCard(null)} only={{
        step: KEY_OF_STEP[k],
        onKey: (d, info) => {
          setDraft(d); saveDraft(d);
          if (!keyEarned(k, d, info)) return false;
          const n = keys.includes(k) ? keys : [...keys, k];
          setKeys(n); saveBoardKeys(n); setOpenCard(null);
          return true;
        },
      }} />
    </div>;
  }

  return (
    <div data-focus-board style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <article data-focus-session style={{ ...sheetCard, alignItems: 'stretch', gap: 10 }}>
        <h3 style={{ ...sheetCardTitle, margin: 0 }}>{isPt ? 'Sessão de foco' : 'Focus session'}</h3>
        {rest && !active ? <>
          <p className="sm2-num" data-focus-rest-line style={{ ...sm2Text, margin: 0 }}>{isPt ? 'O Soulmon está descansando' : 'Your Soulmon is resting'} · {formatClock(restLeftMs(rest, nowMs))}</p>
          {session && <p data-focus-session-task style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Tarefa: ' : 'Task: '}{session.taskName}</p>}
          <button type="button" data-focus-return-rest onClick={() => setShowJourney(true)} style={{ ...sm2Button('primary'), minHeight: 48 }}>{isPt ? 'Voltar ao descanso' : 'Back to the break'}</button>
        </> : active ? <>
          <p className="sm2-num" style={{ ...sm2Text, margin: 0 }}>{isPt ? 'O Soulmon está em jornada' : 'Your Soulmon is on a journey'} · {formatClock(left)}</p>
          {session && <p data-focus-session-task style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Tarefa: ' : 'Task: '}{session.taskName}</p>}
          <button type="button" data-focus-return onClick={() => setShowJourney(true)} style={{ ...sm2Button('primary'), minHeight: 48 }}>{isPt ? 'Voltar à jornada' : 'Back to the journey'}</button>
        </> : <>
          <div role="radiogroup" aria-label={isPt ? 'Ritmo' : 'Rhythm'} style={{ display: 'flex', gap: 8 }}>
            {(['p25', 'p50'] as JourneyMode[]).map(m => <button key={m} type="button" role="radio" aria-checked={prefs.mode === m} data-focus-mode={m} onClick={() => setPref({ mode: m })} style={{ ...sm2Button(prefs.mode === m ? 'primary' : 'outline'), flex: 1, minHeight: 44 }}>{m === 'p25' ? '25 / 5' : '50 / 10'}</button>)}
          </div>
          <button type="button" data-focus-env-open aria-haspopup="dialog" aria-label={`${isPt ? 'Cenário da jornada' : 'Journey scene'}: ${isPt ? env.pt : env.en}`} onClick={() => setEnvOpen(true)} style={{ ...sm2Button('outline'), minHeight: 48, justifyContent: 'flex-start', gap: 8 }}>
            <Icon name={env.icon} size={20} tone="primary" />
            <span data-focus-env={env.id} style={{ ...sm2Text, flex: 1, textAlign: 'left' }}>{isPt ? env.pt : env.en}</span>
            <Icon name="chevron_right" size={24} tone="inherit" />
          </button>
          {keys.length > 0 && <div aria-label={isPt ? 'Chaves desta sessão' : 'Keys for this session'} style={{ display: 'flex', gap: 6 }}>
            {keys.map(k => <KeyGlyph key={k} k={k} size={24} />)}
          </div>}
          {online === false && <p role="status" data-focus-offline style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Precisa de conexão para começar.' : 'Needs a connection to start.'}</p>}
          <CtaButton data-focus-start tone="acao" disabled={online === false || busy || !saveId} onClick={start}>{isPt ? 'Começar jornada' : 'Start journey'}</CtaButton>
        </>}
        {doneNote && <p role="status" data-focus-done style={{ ...sm2Text, margin: 0 }}>{doneNote}</p>}
      </article>

      <div data-focus-cards style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
        {JOURNEY_KEYS.map(k => {
          const got = keys.includes(k);
          return <button key={k} type="button" data-focus-card={k} data-has-key={got} onClick={() => setOpenCard(k)} style={{ ...sheetCard, minHeight: 88, alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, cursor: 'pointer', textAlign: 'left', border: got ? `2px solid ${KEY_COLOR[k]}` : undefined }}>
            <KeyGlyph k={k} size={24} muted={!got} label={isPt ? `${CARD[k].keyPt} — bloqueada` : `${CARD[k].keyEn} — locked`} />
            <span style={{ ...sm2Text, fontWeight: 600 }}>{isPt ? CARD[k].pt : CARD[k].en}</span>
            <span style={{ ...sm2Hint, margin: 0 }}>{got ? (isPt ? 'Refazer' : 'Redo') : (isPt ? 'Fazer' : 'Do it')}</span>
          </button>;
        })}
      </div>
      {active && <p style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Cards feitos agora valem para a próxima jornada.' : 'Cards done now count for the next journey.'}</p>}

      {plan.length > 0 && <section data-focus-list style={{ ...sheetCard, alignItems: 'stretch', gap: 6 }}>
        <button type="button" aria-expanded={listOpen} onClick={() => setListOpen(v => !v)} style={{ ...sm2Button('quiet'), justifyContent: 'space-between', minHeight: 44 }}>{isPt ? `Lista da sessão (${plan.length})` : `Session list (${plan.length})`}<Icon name={listOpen ? 'expand_less' : 'expand_more'} size={20} tone="inherit" /></button>
        {listOpen && plan.map(item => {
          const done = tasks.some(t => t.id === item.id && t.completed);
          return <button key={item.id} type="button" role="checkbox" aria-checked={done} disabled={done} data-focus-task={item.id} onClick={() => onCompleteTask(item.id)} style={{ ...sm2Button(done ? 'quiet' : 'outline'), justifyContent: 'flex-start', gap: 8, minHeight: 44, textAlign: 'left' }}>
            <span aria-hidden="true" className={done ? 'sm2-check-halo' : undefined} style={checkBoxStyle({ checked: done })}>{done && <CheckMark />}</span><span style={{ overflowWrap: 'anywhere', textDecoration: done ? 'line-through' : 'none' }}>{item.name}</span>
          </button>;
        })}
      </section>}

      {pickOpen && <FocusTaskPicker language={language} tasks={tasks} initialId={session?.taskId} busy={busy} onClose={() => setPickOpen(false)} onPick={begin} onCreate={onCreateTask} />}
      {envOpen && <EnvModal isPt={isPt} current={prefs.env} onPick={id => { setPref({ env: id }); setEnvOpen(false); }} onClose={() => setEnvOpen(false)} />}

      {showJourney && !active && rest && <RestRoom language={language} rest={rest} petSprite={petSprite} cycles={session?.cycles ?? 1} now={nowMs} busy={busy} error={restNote} onNext={nextCycle} onFinish={finishMission} onClose={() => setShowJourney(false)} />}
      {showJourney && active && <JourneyScreen language={language} active={active} delta={delta} petSprite={petSprite} lastItems={lastItems} collected={session?.collected ?? []} focusTaskId={session?.taskId} tasks={tasks} onToggleTask={onCompleteTask} onToggleStep={onToggleStep}
        onPause={() => act('pause')} onResume={() => act('resume')} onClaim={() => act('claim')} onEnd={() => act('end')} onClose={() => setShowJourney(false)} />}
    </div>
  );
}

/** Modal do cenário da jornada: lista os cenários; escolher fecha e grava. Todos estão liberados hoje; se algum vier a travar, entra em `locked`. */
function EnvModal({ isPt, current, onPick, onClose, locked = [] }: { isPt: boolean; current: FocusEnvironmentId; onPick: (id: FocusEnvironmentId) => void; onClose: () => void; locked?: readonly FocusEnvironmentId[] }) {
  useBackLayer(true, onClose);
  return createPortal(
    <div data-focus-env-backdrop onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div role="dialog" aria-modal="true" aria-label={isPt ? 'Escolher o cenário' : 'Choose the scene'} data-focus-env-modal onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, background: 'var(--sm2-surface)', color: 'var(--sm2-ink)', borderRadius: '14px 14px 0 0', padding: 16, paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))', display: 'grid', gap: 8 }}>
        <h3 style={{ ...sheetCardTitle, margin: 0 }}>{isPt ? 'Para onde o Soulmon vai?' : 'Where will Soulmon go?'}</h3>
        <div role="radiogroup" aria-label={isPt ? 'Cenários' : 'Scenes'} style={{ display: 'grid', gap: 6 }}>
          {FOCUS_ENVIRONMENTS.map(e => {
            const isLocked = locked.includes(e.id);
            return <button key={e.id} type="button" role="radio" aria-checked={current === e.id} disabled={isLocked} data-focus-env-option={e.id} onClick={() => onPick(e.id)} style={{ ...sm2Button(current === e.id ? 'primary' : 'outline', isLocked), minHeight: 48, justifyContent: 'flex-start', gap: 8 }}>
              <Icon name={e.icon} size={20} tone="inherit" /><span style={{ flex: 1, textAlign: 'left' }}>{isPt ? e.pt : e.en}</span>
              {current === e.id && <Icon name="check" size={20} tone="inherit" />}
            </button>;
          })}
        </div>
        <button type="button" data-focus-env-close onClick={onClose} style={{ ...sm2Button('quiet'), minHeight: 44 }}>{isPt ? 'Fechar' : 'Close'}</button>
      </div>
    </div>,
    document.body,
  );
}
