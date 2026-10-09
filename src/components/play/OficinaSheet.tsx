import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { Field, Segment, sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { ModalInfo, InfoTipSection } from '../ui/InfoTip';
import { Icon } from '../ui/Icon';
import { sheetCard, sheetCardList, sheetCardTitle } from '../nav/sheetKit';
import type { Language } from '../../utils/i18n';
import { EVIDENCIA_LABEL, FOCO_TECNICAS } from '../../data/focoTecnicas';
import { readJson, writeJson } from '../../utils/safeStorage';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import {
  FOCO_MODES, armEndNotice, disarmEndNotice, formatClock, isLongBreak, loadSessions, loadTimer, pause,
  recordSession, remainingMs, resume, saveSessions, saveTimer, sessionsToday, settle, startPhase,
  type FocoModeId, type FocoTimer,
} from '../../utils/focoTimer';

/**
 * A FOLHA DA OFICINA DO FOCO (04/10/2026, `docs/PLANO-OFICINA-FOCO.md`).
 *
 * Duas coisas: o TIMER de foco de verdade (25/5 e 50/10) e os cards das técnicas de gestão de
 * tempo e produtividade, cada um com a explicação completa atrás de um `InfoTip`.
 *
 * Nada aqui paga Bits/XP/Emblema, nada vai ao save e não há sequência nem placar: o "foquei"
 * é uma marca LOCAL do dia, só para a própria pessoa (`utils/focoTimer.ts`). O relógio é um
 * timestamp relido na tela — sobrevive a aba em segundo plano e a fechar a folha.
 */
const sectionHead: CSSProperties = {
  ...sm2Hint, margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--sm2-gold-ink)', fontWeight: 600, fontSize: 'var(--sm2-text-xs)',
};

const fallbackDay = (): string => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/** O relógio da tela: relê `Date.now()` a cada segundo e quando a aba volta (nunca soma ticks). */
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

type WorkshopRecord = { name: string; day: string; completed: number };
const readWorkshopHistory = (): WorkshopRecord[] => {
  const rows = readJson<WorkshopRecord[]>(STORAGE_KEYS.FOCO_WORKSHOPS, []);
  return Array.isArray(rows) ? rows.filter(r => typeof r?.name === 'string' && typeof r?.day === 'string' && Number.isFinite(r?.completed)).slice(0, 20) : [];
};

const PRE_FOCUS_CHECKLIST = [
  { id: 'station', pt: 'Organizar a estação de trabalho', en: 'Set up the work station' },
  { id: 'water', pt: 'Beber água', en: 'Get some water' },
  { id: 'food', pt: 'Comer algo, se estiver com fome', en: 'Eat something, if hungry' },
  { id: 'bathroom', pt: 'Ir ao banheiro', en: 'Use the bathroom' },
  { id: 'notifications', pt: 'Silenciar notificações', en: 'Mute notifications' },
] as const;

export function OficinaSheet({ language, todayKey, tasks, onCompleteTask }: {
  language: Language; todayKey?: string; tasks?: Array<{ id: string; name: string; completed: boolean }>;
  onCompleteTask?: (taskId: string) => void;
}) {
  tasks ??= [];
  onCompleteTask ??= () => {};
  const isPt = language === 'pt-BR';
  const day = todayKey ?? fallbackDay();
  const [mode, setMode] = useState<FocoModeId>('p25');
  const [timer, setTimer] = useState<FocoTimer | null>(() => { const t = loadTimer(); return t ? settle(t, Date.now()) : null; });
  const [days, setDays] = useState(() => loadSessions());
  /** Qual card está aberto (a explicação sai atrás do toque, nunca corrida na tela). */
  const [openId, setOpenId] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedTask, setSelectedTask] = useState('');
  const [dump, setDump] = useState('');
  const [ifThen, setIfThen] = useState({ cue: '', action: '' });
  const [quadrant, setQuadrant] = useState<Record<string, string>>({});
  const [history, setHistory] = useState(readWorkshopHistory);
  const [completedInSession, setCompletedInSession] = useState(0);
  const [planningSteps, setPlanningSteps] = useState<Array<'preparar' | 'pomodoro' | 'dois-minutos' | 'sapo' | 'eisenhower' | 'se-entao' | 'esvaziar' | 'blocos'>>(['preparar', 'pomodoro', 'dois-minutos', 'sapo', 'eisenhower', 'se-entao', 'esvaziar', 'blocos']);
  const [prepChecked, setPrepChecked] = useState<Record<string, boolean>>({});
  const [dumpEnd, setDumpEnd] = useState<number | null>(null);
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

  // Chegou a zero com a folha aberta: fica `ended` (o aviso já foi agendado ao iniciar).
  useEffect(() => {
    if (!timer) return;
    const s = settle(timer, now);
    if (s !== timer) { setTimer(s); saveTimer(s); }
  }, [now, timer]);

  const feito = () => {
    if (!timer) return;
    const next = recordSession(days, day, timer.totalMs / 60_000);
    setDays(next); saveSessions(next);
    apply(startPhase(timer.mode, 'break', Date.now(), isLongBreak(timer.mode, sessionsToday(next, day))));
  };

  const hoje = sessionsToday(days, day);
  const activeStep = planningSteps[stepIndex];
  const selected = tasks.find(t => t.id === selectedTask && !t.completed);
  const finishSession = () => {
    const name = sessionName.trim().slice(0, 60);
    if (name) {
      const next = [{ name, day, completed: completedInSession }, ...history].slice(0, 20);
      setHistory(next); writeJson(STORAGE_KEYS.FOCO_WORKSHOPS, next);
    }
    setStepIndex(0); setSessionName(''); setDump(''); setIfThen({ cue: '', action: '' }); setQuadrant({}); setPrepChecked({});
    setPlanningSteps(['preparar', 'pomodoro', 'dois-minutos', 'sapo', 'eisenhower', 'se-entao', 'esvaziar', 'blocos']); setDumpEnd(null); setCompletedInSession(0);
  };
  const completeSelectedTask = () => {
    if (!selected) return;
    onCompleteTask(selected.id);
    setCompletedInSession(n => n + 1);
    setSelectedTask('');
  };
  const activeStepName = activeStep === 'preparar'
    ? (isPt ? 'Preparar o foco' : 'Prepare to focus')
    : (FOCO_TECNICAS.find(t => t.id === activeStep)?.[isPt ? 'namePt' : 'nameEn'] ?? '');
  const left = timer ? remainingMs(timer, now) : FOCO_MODES[mode].focusMin * 60_000;
  const ended = timer?.status === 'ended';
  const label = timer
    ? (timer.phase === 'focus' ? (isPt ? 'Foco' : 'Focus') : (isPt ? 'Pausa' : 'Break'))
    : (isPt ? 'Foco' : 'Focus');

  return (
    <div data-oficina style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <p style={{ ...sectionHead, flex: 1 }}>{isPt ? 'Timer de foco' : 'Focus timer'}</p>
        <ModalInfo language={language} align="right" label={isPt ? 'Como funciona a Oficina' : 'How the Workshop works'}>
          <InfoTipSection title={isPt ? 'Timer de foco' : 'Focus timer'}>
            {isPt
              ? 'O relógio segue o horário de verdade: pode trocar de aba ou fechar esta folha que ele continua. Ao fim, o app avisa na tela e vibra de leve; se você já permitiu notificações, avisa também fora do app. O app não toca um alarme sonoro automático. Marcar “Foquei” guarda um registro do dia só neste aparelho: sem placar, sem sequência, sem Bits.'
              : 'The clock follows real time: you can switch tabs or close this sheet and it keeps going. At the end the app tells you on screen and buzzes lightly; if you already allowed notifications, it also alerts you outside the app. The app does not play an automatic alarm sound. Marking “I focused” keeps a note of the day on this device only: no scoreboard, no streak, no Bits.'}
          </InfoTipSection>
          {FOCO_TECNICAS.map((t, i) => (
            <InfoTipSection key={t.id} title={isPt ? t.namePt : t.nameEn} last={i === FOCO_TECNICAS.length - 1}>
              <strong>{isPt ? EVIDENCIA_LABEL[t.evidencia].pt : EVIDENCIA_LABEL[t.evidencia].en}.</strong>{' '}
              {isPt ? t.howPt : t.howEn}{' '}
              <em>{isPt ? 'Fonte: ' : 'Source: '}{t.fonte}</em>
            </InfoTipSection>
          ))}
        </ModalInfo>
      </div>

      <div data-oficina-timer style={{ ...sheetCard, alignItems: 'center', gap: 12 }}>
        {!timer && (
          <div role="radiogroup" aria-label={isPt ? 'Ritmo' : 'Rhythm'} style={{ display: 'flex', gap: 8, width: '100%' }}>
            <Segment selected={mode === 'p25'} onSelect={() => setMode('p25')} label="25 / 5" />
            <Segment selected={mode === 'p50'} onSelect={() => setMode('p50')} label="50 / 10" />
          </div>
        )}
        <p style={{ ...sectionHead }}>{label}</p>
        <p
          role="timer"
          data-oficina-clock
          className="sm2-num"
          style={{ margin: 0, fontFamily: 'var(--sm2-font-display)', fontWeight: 700, fontSize: 48, lineHeight: 1, color: 'var(--sm2-ink)' }}
        >
          {formatClock(left)}
        </p>

        {ended && (
          <p role="status" data-oficina-fim style={{ ...sm2Text, margin: 0, textAlign: 'center' }}>
            {timer?.phase === 'focus' ? (isPt ? 'O tempo acabou.' : 'Time is up.') : (isPt ? 'A pausa acabou.' : 'The break is over.')}
          </p>
        )}

        <div style={{ display: 'flex', gap: 8, width: '100%', flexWrap: 'wrap' }}>
          {!timer && (
            <button type="button" data-oficina-start onClick={() => apply(startPhase(mode, 'focus', Date.now()))} style={{ ...sm2Button('primary'), flex: 1 }}>
              {isPt ? 'Iniciar' : 'Start'}
            </button>
          )}
          {timer?.status === 'running' && (
            <button type="button" data-oficina-pause onClick={() => apply(pause(timer, Date.now()))} style={{ ...sm2Button('primary'), flex: 1 }}>
              <Icon name="pause" size={20} tone="inherit" /> {isPt ? 'Pausar' : 'Pause'}
            </button>
          )}
          {timer?.status === 'paused' && (
            <button type="button" data-oficina-resume onClick={() => apply(resume(timer, Date.now()))} style={{ ...sm2Button('primary'), flex: 1 }}>
              <Icon name="play_arrow" size={20} tone="inherit" /> {isPt ? 'Continuar' : 'Resume'}
            </button>
          )}
          {ended && timer?.phase === 'focus' && (
            <button type="button" data-oficina-foquei onClick={feito} style={{ ...sm2Button('primary'), flex: 1 }}>
              {isPt ? 'Foquei' : 'I focused'}
            </button>
          )}
          {ended && timer?.phase === 'focus' && selected && (
            <button type="button" data-oficina-task-complete onClick={completeSelectedTask} style={{ ...sm2Button('primary'), flex: 1 }}>
              {isPt ? 'Concluí a tarefa' : 'I completed the task'}
            </button>
          )}
          {ended && timer?.phase === 'break' && (
            <button type="button" data-oficina-ok onClick={() => apply(null)} style={{ ...sm2Button('primary'), flex: 1 }}>
              {isPt ? 'Pronto' : 'Done'}
            </button>
          )}
          {timer && (
            <button type="button" data-oficina-cancel onClick={() => apply(null)} style={{ ...sm2Button('outline'), flex: ended ? 0 : 1 }}>
              {ended && timer.phase === 'focus' ? (isPt ? 'Agora não' : 'Not now') : (isPt ? 'Cancelar' : 'Cancel')}
            </button>
          )}
        </div>
        {hoje > 0 && (
          <p data-oficina-hoje style={{ ...sm2Hint, margin: 0 }}>
            {isPt ? `Hoje: ${hoje} ${hoje === 1 ? 'foco' : 'focos'}` : `Today: ${hoje} ${hoje === 1 ? 'focus' : 'focuses'}`}
          </p>
        )}
      </div>

      <p style={sectionHead}>{isPt ? 'Técnicas' : 'Techniques'}</p>
      <section data-oficina-plano style={{ ...sheetCard, alignItems: 'stretch', gap: 10 }}>
        <p style={{ ...sectionHead, margin: 0 }}>{isPt ? 'Planejar uma sessão' : 'Plan a session'}</p>
        <label style={{ ...sm2Text, display: 'grid', gap: 4 }}>{isPt ? 'Nome da sessão' : 'Session name'}<Field value={sessionName} onChange={e => setSessionName(e.target.value)} placeholder={isPt ? 'Ex.: fechar apresentação' : 'e.g. finish presentation'} maxLength={60} /></label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><p style={{ ...sm2Hint, flex: 1, margin: 0 }}>{isPt ? `Etapa ${stepIndex + 1} de ${planningSteps.length}: ${activeStepName}` : `Step ${stepIndex + 1} of ${planningSteps.length}: ${activeStepName}`}</p>
          <button type="button" aria-label={isPt ? 'Mover etapa para trás' : 'Move step earlier'} style={sm2Button('quiet')} disabled={stepIndex === 0} onClick={() => { setPlanningSteps(s => { const n = [...s]; [n[stepIndex - 1], n[stepIndex]] = [n[stepIndex], n[stepIndex - 1]]; return n; }); setStepIndex(i => i - 1); }}>↑</button>
          <button type="button" aria-label={isPt ? 'Mover etapa para frente' : 'Move step later'} style={sm2Button('quiet')} disabled={stepIndex === planningSteps.length - 1} onClick={() => { setPlanningSteps(s => { const n = [...s]; [n[stepIndex], n[stepIndex + 1]] = [n[stepIndex + 1], n[stepIndex]]; return n; }); setStepIndex(i => i + 1); }}>↓</button>
        </div>
        {['dois-minutos', 'sapo', 'eisenhower', 'pomodoro', 'blocos'].includes(activeStep) && <label style={{ ...sm2Text, display: 'grid', gap: 4 }}>
          {isPt ? 'Escolha uma tarefa' : 'Choose a task'}
          <select value={selectedTask} onChange={e => setSelectedTask(e.target.value)} style={{ minHeight: 44, color: 'var(--sm2-ink)', background: 'var(--sm2-surface)', border: '1px solid var(--sm2-border)', borderRadius: 8 }}>
            <option value="">{isPt ? 'Selecionar…' : 'Select…'}</option>
            {tasks.filter(t => !t.completed).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>}
        {activeStep === 'preparar' && <div data-oficina-preparo style={{ display: 'grid', gap: 8 }}>
          <p style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Pequenas necessidades que podem interromper o foco. Marque só o que fizer sentido; esta lista é temporária e não conta como tarefa.' : 'Small needs that can interrupt focus. Check only what makes sense; this list is temporary and does not count as tasks.'}</p>
          {PRE_FOCUS_CHECKLIST.map(item => <label key={item.id} style={{ ...sm2Text, display: 'flex', alignItems: 'center', gap: 8, minHeight: 40 }}>
            <input type="checkbox" checked={!!prepChecked[item.id]} onChange={e => setPrepChecked(prev => ({ ...prev, [item.id]: e.target.checked }))} />
            {isPt ? item.pt : item.en}
          </label>)}
        </div>}
        {activeStep === 'eisenhower' && selected && <label style={{ ...sm2Text, display: 'grid', gap: 4 }}>{isPt ? 'Quadrante' : 'Quadrant'}
          <select value={quadrant[selected.id] ?? ''} onChange={e => setQuadrant(q => ({ ...q, [selected.id]: e.target.value }))} style={{ minHeight: 44, color: 'var(--sm2-ink)', background: 'var(--sm2-surface)', border: '1px solid var(--sm2-border)', borderRadius: 8 }}>
            <option value="">{isPt ? 'Escolher…' : 'Choose…'}</option><option value="do">{isPt ? 'Importante e urgente — fazer' : 'Important and urgent — do'}</option><option value="schedule">{isPt ? 'Importante — agendar' : 'Important — schedule'}</option><option value="delegate">{isPt ? 'Urgente — delegar' : 'Urgent — delegate'}</option><option value="drop">{isPt ? 'Nenhum — deixar de lado' : 'Neither — drop'}</option>
          </select>
        </label>}
        {activeStep === 'se-entao' && <div style={{ display: 'grid', gap: 8 }}><label style={{ ...sm2Text }}>{isPt ? 'Se…' : 'If…'}<Field value={ifThen.cue} onChange={e => setIfThen(v => ({ ...v, cue: e.target.value }))} /></label><label style={{ ...sm2Text }}>{isPt ? 'Então…' : 'Then…'}<Field value={ifThen.action} onChange={e => setIfThen(v => ({ ...v, action: e.target.value }))} /></label></div>}
        {activeStep === 'esvaziar' && <><label style={{ ...sm2Text, display: 'grid', gap: 4 }}>{isPt ? 'Anotações (temporárias nesta sessão)' : 'Notes (temporary for this session)'}<textarea value={dump} onChange={e => setDump(e.target.value)} rows={4} maxLength={2000} style={{ color: 'var(--sm2-ink)', background: 'var(--sm2-surface)', border: '1px solid var(--sm2-border)', borderRadius: 8, padding: 8 }} /></label><p role="timer" style={{ ...sm2Hint, margin: 0 }}>{dumpEnd ? formatClock(Math.max(0, dumpEnd - now)) : '05:00'}</p><button type="button" style={sm2Button('outline')} onClick={() => setDumpEnd(Date.now() + 5 * 60_000)}>{dumpEnd ? (isPt ? 'Reiniciar 5 minutos' : 'Restart 5 minutes') : (isPt ? 'Iniciar 5 minutos' : 'Start 5 minutes')}</button></>}
        {['dois-minutos', 'sapo'].includes(activeStep) && selected && <button type="button" style={sm2Button('outline')} onClick={completeSelectedTask}>{isPt ? `Concluir tarefa: ${selected.name}` : `Complete task: ${selected.name}`}</button>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" style={sm2Button('outline')} onClick={() => setStepIndex(i => (i + 1) % planningSteps.length)}>{isPt ? 'Pular etapa' : 'Skip step'}</button>
          <button type="button" style={sm2Button('primary')} onClick={() => stepIndex + 1 === planningSteps.length ? finishSession() : setStepIndex(i => i + 1)}>{stepIndex + 1 === planningSteps.length ? (isPt ? 'Salvar sessão' : 'Save session') : (isPt ? 'Próxima etapa' : 'Next step')}</button>
        </div>
        {history.length > 0 && <div><p style={{ ...sectionHead, margin: '4px 0' }}>{isPt ? 'Sessões recentes (só neste aparelho)' : 'Recent sessions (this device only)'}</p>{history.slice(0, 5).map((item, i) => <p key={`${item.day}-${i}`} style={{ ...sm2Hint, margin: '3px 0' }}>{item.day} · {item.name} · {item.completed} {isPt ? 'tarefas' : 'tasks'}</p>)}</div>}
      </section>
      <ul style={sheetCardList} data-oficina-tecnicas>
        {FOCO_TECNICAS.map(t => {
          const aberto = openId === t.id;
          const modeOf: FocoModeId | null = t.id === 'pomodoro' ? 'p25' : t.id === 'blocos' ? 'p50' : null;
          const ativo = modeOf !== null && !timer && mode === modeOf;
          return (
            <li key={t.id} data-oficina-tecnica={t.id} style={{ ...sheetCard, padding: 0 }}>
              <button
                type="button"
                data-oficina-tecnica-btn
                aria-expanded={aberto}
                onClick={() => { setOpenId(aberto ? null : t.id); if (modeOf && !timer) setMode(modeOf); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
                  padding: 'var(--sm2-space-3, 12px)', background: 'none', border: 0, color: 'inherit',
                  font: 'inherit', cursor: 'pointer', minHeight: 44,
                }}
              >
                <Icon name={t.icon} size={24} tone="primary" />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                  <span style={sheetCardTitle}>{isPt ? t.namePt : t.nameEn}</span>
                  <span style={{ ...sm2Hint, margin: 0 }}>{isPt ? t.linePt : t.lineEn}</span>
                </span>
                <span data-oficina-tecnica-kind={t.timer ? 'timer' : 'guia'} style={{ ...sm2Hint, margin: 0, whiteSpace: 'nowrap', color: ativo ? 'var(--sm2-primary-ink)' : undefined }}>
                  {t.timer ? (ativo ? (isPt ? 'No timer' : 'On the timer') : (isPt ? 'Usa o timer' : 'Uses the timer')) : (isPt ? 'Guia' : 'Guide')}
                </span>
              </button>
              {aberto && (
                <div data-oficina-tecnica-corpo style={{ ...sm2Text, padding: '0 var(--sm2-space-3, 12px) var(--sm2-space-3, 12px)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span>
                    <strong>{isPt ? EVIDENCIA_LABEL[t.evidencia].pt : EVIDENCIA_LABEL[t.evidencia].en}.</strong>{' '}
                    {isPt ? t.howPt : t.howEn}
                  </span>
                  <em style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Fonte: ' : 'Source: '}{t.fonte}</em>
                  {!t.timer && (
                    <span data-oficina-tecnica-guia style={{ ...sm2Hint, margin: 0 }}>
                      {isPt ? 'É um guia para fazer por conta própria: não tem timer nem registro aqui.' : 'A guide to try on your own: there is no timer or log for it here.'}
                    </span>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
