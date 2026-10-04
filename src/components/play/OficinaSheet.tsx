import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { Segment, sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { InfoTip } from '../ui/InfoTip';
import { Icon } from '../ui/Icon';
import { sheetCard, sheetCardList, sheetCardTitle } from '../nav/sheetKit';
import type { Language } from '../../utils/i18n';
import { EVIDENCIA_LABEL, FOCO_TECNICAS } from '../../data/focoTecnicas';
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

export function OficinaSheet({ language, todayKey }: { language: Language; todayKey?: string }) {
  const isPt = language === 'pt-BR';
  const day = todayKey ?? fallbackDay();
  const [mode, setMode] = useState<FocoModeId>('p25');
  const [timer, setTimer] = useState<FocoTimer | null>(() => { const t = loadTimer(); return t ? settle(t, Date.now()) : null; });
  const [days, setDays] = useState(() => loadSessions());
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
  const left = timer ? remainingMs(timer, now) : FOCO_MODES[mode].focusMin * 60_000;
  const ended = timer?.status === 'ended';
  const label = timer
    ? (timer.phase === 'focus' ? (isPt ? 'Foco' : 'Focus') : (isPt ? 'Pausa' : 'Break'))
    : (isPt ? 'Foco' : 'Focus');

  return (
    <div data-oficina style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <p style={{ ...sectionHead, flex: 1 }}>{isPt ? 'Timer de foco' : 'Focus timer'}</p>
        <InfoTip language={language} align="right" label={isPt ? 'Como funciona o timer' : 'How the timer works'}>
          {isPt
            ? 'O relógio segue o horário de verdade: pode trocar de aba ou fechar esta folha que ele continua. Ao fim, o app avisa na tela, vibra de leve e, só se você já permitiu notificações, avisa também fora do app. Marcar “Foquei” guarda um registro do dia só neste aparelho: sem placar, sem sequência, sem Bits.'
            : 'The clock follows real time: you can switch tabs or close this sheet and it keeps going. At the end the app tells you on screen, buzzes lightly and, only if you already allowed notifications, also outside the app. Marking “I focused” keeps a note of the day on this device only: no scoreboard, no streak, no Bits.'}
        </InfoTip>
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
      <ul style={sheetCardList} data-oficina-tecnicas>
        {FOCO_TECNICAS.map(t => (
          <li key={t.id} data-oficina-tecnica={t.id} style={{ ...sheetCard, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name={t.icon} size={24} tone="primary" />
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
              <span style={sheetCardTitle}>{isPt ? t.namePt : t.nameEn}</span>
              <span style={{ ...sm2Hint, margin: 0 }}>{isPt ? t.linePt : t.lineEn}</span>
            </span>
            <InfoTip language={language} align="right" label={isPt ? `Sobre: ${t.namePt}` : `About: ${t.nameEn}`}>
              <strong>{isPt ? EVIDENCIA_LABEL[t.evidencia].pt : EVIDENCIA_LABEL[t.evidencia].en}.</strong>{' '}
              {isPt ? t.howPt : t.howEn}{' '}
              <em>{isPt ? 'Fonte: ' : 'Source: '}{t.fonte}</em>
            </InfoTip>
          </li>
        ))}
      </ul>
    </div>
  );
}
