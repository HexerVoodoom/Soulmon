import { ListChecks, Heart, Star, Sun, CloudRain, HeartCrack, HeartHandshake } from 'lucide-react';
import iconClose from '../assets/soulmon/icons/icon-close.png';
import { MOOD_OPTIONS, type MoodValue } from '../utils/mood';
import type { GameState } from '../contexts/GameStateContext';
import type { Language } from '../utils/i18n';
import confettiBurst from '../assets/icons/confetti-burst.png';

interface DailyReportModalProps {
  report: NonNullable<GameState['lastDayReport']>;
  onClose: () => void;
  language: Language;
  /** O "porquê" que o usuário escreveu no onboarding. O pet devolve isso em
   *  momentos-chave — é o que separa "app que mede" de "avatar que acompanha". */
  soulGoal?: string;
  /** "Eu fiz, só esqueci de marcar": devolve os corações cobrados na virada. */
  onRecoverHearts?: () => void;
  /** Check-in de humor: opcional, e NUNCA entra em pontuação (utils/mood.ts). */
  moodToday?: MoodValue | null;
  onPickMood?: (mood: MoodValue) => void;
  moodNote?: string | null;
}

/**
 * "Daily report" shown once on the first open after the day rolls over.
 * Layout uses INLINE styles — several Tailwind utilities (px-5, py-4, max-w-xs)
 * don't exist in the precompiled index.css (see CLAUDE.md footgun #1).
 */
export function DailyReportModal({ report, onClose, language, soulGoal, onRecoverHearts, moodToday, onPickMood, moodNote }: DailyReportModalProps) {
  const isPt = language === 'pt-BR';
  // Modo acolhida: quem passou dias fora não recebe cobrança nenhuma. O
  // relatório vira "que bom que você voltou", e os números de falha somem — o
  // retorno depois de uma ausência tem que ser um abraço, não uma fatura.
  const welcome = !!report.welcomeBack;
  // Só faz sentido oferecer quando houve cobrança e ela ainda não foi desfeita.
  const canRecover = !welcome && report.heartsLost > 0 && !report.heartsRecovered && !!onRecoverHearts;

  const rows: { Icon: typeof Heart; label: string; value: string; highlight?: 'good' | 'bad' }[] = welcome
    ? [
        {
          Icon: Heart,
          label: isPt ? 'Corações' : 'Hearts',
          value: isPt ? 'intactos' : 'untouched',
          highlight: 'good',
        },
        {
          Icon: Star,
          label: isPt ? 'Dias perfeitos guardados' : 'Perfect days saved',
          value: `${report.perfectDays}`,
          highlight: 'good',
        },
      ]
    : [
        {
          Icon: ListChecks,
          label: isPt ? 'Tarefas de ontem' : "Yesterday's tasks",
          value: `${report.done}/${report.total}`,
          highlight: report.wasPerfect ? 'good' : undefined,
        },
        {
          Icon: Heart,
          label: isPt ? 'Corações' : 'Hearts',
          value: report.heartsLost > 0 ? `-${report.heartsLost} ❤️` : (isPt ? 'inteiros!' : 'all there!'),
          highlight: report.heartsLost > 0 ? 'bad' : 'good',
        },
        {
          Icon: Star,
          label: isPt ? 'Dias perfeitos' : 'Perfect days',
          value: `${report.perfectDays}`,
          highlight: report.wasPerfect ? 'good' : undefined,
        },
      ];

  const HeadIcon = welcome ? HeartHandshake : report.degenerated ? HeartCrack : report.wasPerfect ? Star : report.heartsLost > 0 ? CloudRain : Sun;
  const headColor = welcome ? '#22A900' : report.degenerated ? '#e0483e' : report.wasPerfect ? '#d9a441' : report.heartsLost > 0 ? '#6b7280' : '#f0a500';
  const headBg = welcome ? '#e6f6e2' : report.degenerated ? '#fde8e6' : report.wasPerfect ? '#fbf1dd' : report.heartsLost > 0 ? '#eef0f3' : '#fff4e0';

  const headline = welcome
    ? (isPt ? 'Que saudade!' : 'I missed you!')
    : report.degenerated
      ? (isPt ? 'Seu Soulmon regrediu...' : 'Your Soulmon degenerated...')
      : report.wasPerfect
        ? (isPt ? 'Dia perfeito!' : 'Perfect day!')
        : report.heartsLost > 0
          ? (isPt ? 'Um dia mais devagar' : 'A slower day')
          : (isPt ? 'Novo dia!' : 'New day!');

  // Frases de rodapé. Nenhuma delas cobra — a mais "dura" apenas conta o que
  // aconteceu e oferece o caminho de volta.
  const notes: string[] = [];
  if (welcome) {
    notes.push(isPt
      ? `Você ficou ${report.daysAway} dias fora e seu Soulmon não perdeu nada esperando. Ele só estava com saudade. Comece de onde parou.`
      : `You were away ${report.daysAway} days and your Soulmon lost nothing waiting. It just missed you. Pick up where you left off.`);
  }
  if (report.weeklyRelief) {
    notes.push(isPt
      ? 'Semana nova: seu Soulmon recuperou meio coração. O que passou, passou.'
      : 'New week: your Soulmon recovered half a heart. Last week stays behind.');
  }
  if (!welcome && report.done >= report.required && report.energyWasFull === false) {
    notes.push(isPt
      ? 'Tarefas em dia! Faltou só encher a energia antes do fim do dia para o dia perfeito.'
      : 'Tasks done! Only the energy bar was short of full for a perfect day.');
  }
  if (!welcome && report.heartsLost > 0 && !report.degenerated) {
    notes.push(isPt
      ? 'Faça carinho nele para recuperar meio coração — e nunca se perde mais que um por dia.'
      : 'Rub your pet to restore half a heart — and you never lose more than one a day.');
  }
  if (report.heartsRecovered) {
    notes.push(isPt
      ? 'Corações devolvidos. Da próxima vez marque no dia — seu Soulmon gosta de acompanhar de perto.'
      : 'Hearts restored. Next time log it the same day — your Soulmon likes following along.');
  }
  if (soulGoal && (report.wasPerfect || welcome)) {
    notes.push(isPt
      ? `Lembra por que você começou: "${soulGoal}".`
      : `Remember why you started: "${soulGoal}".`);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(42,36,64,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="sm-card" style={{ width: '100%', maxWidth: 320, padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ position: 'relative', padding: '24px 20px 16px', textAlign: 'center' }}>
          <button
            onClick={onClose}
            aria-label={isPt ? 'Fechar' : 'Close'}
            style={{ position: 'absolute', top: 12, right: 12, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sm-bg)', border: 'none', borderRadius: 999, color: 'var(--sm-muted)', cursor: 'pointer' }}
          >
            <img src={iconClose} alt="" width={16} height={16} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
          </button>
          <div style={{ position: 'relative', width: 56, height: 56, margin: '0 auto 10px' }}>
            {report.wasPerfect && (
              <img
                src={confettiBurst}
                alt=""
                aria-hidden="true"
                style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  width: 140, height: 140, maxWidth: 'none', pointerEvents: 'none', imageRendering: 'pixelated',
                }}
              />
            )}
            <div style={{ position: 'relative', width: 56, height: 56, borderRadius: 18, background: headBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HeadIcon size={28} color={headColor} strokeWidth={2} />
            </div>
          </div>
          <p style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--sm-ink)', margin: 0 }}>{headline}</p>
        </div>

        {/* Rows */}
        <div style={{ padding: '4px 20px 6px' }}>
          {rows.map(r => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
              <span style={{ width: 30, height: 30, borderRadius: 10, background: 'var(--sm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <r.Icon size={16} color="var(--sm-muted)" strokeWidth={2.2} />
              </span>
              <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--sm-muted)' }}>{r.label}</span>
              <span style={{
                fontSize: '0.92rem', fontWeight: 800,
                color: r.highlight === 'good' ? '#22A900' : r.highlight === 'bad' ? '#e0483e' : 'var(--sm-ink)',
              }}>
                {r.value}
              </span>
            </div>
          ))}
          {notes.map((n, i) => (
            <p key={i} style={{ fontSize: '0.74rem', color: 'var(--sm-muted)', paddingTop: 8, lineHeight: 1.4 }}>{n}</p>
          ))}
        </div>

        {/* Check-in de humor. Fica aqui porque o relatório já aparece 1×/dia:
            não custa uma abertura a mais do app. É opcional e não vale ponto. */}
        {onPickMood && (
          <div style={{ padding: '10px 20px 0' }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--sm-muted)', margin: '0 0 8px' }}>
              {isPt ? 'E você, como está hoje?' : 'And how are you today?'}
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              {MOOD_OPTIONS.map(m => {
                const active = moodToday === m.value;
                return (
                  <button
                    key={m.value}
                    onClick={() => onPickMood(m.value)}
                    aria-label={isPt ? m.labelPt : m.labelEn}
                    title={isPt ? m.labelPt : m.labelEn}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 12, cursor: 'pointer', fontSize: 20, lineHeight: 1,
                      background: active ? 'var(--sm-primary-soft)' : 'var(--sm-bg)',
                      border: active ? '2px solid var(--sm-primary)' : '2px solid transparent',
                    }}
                  >
                    {m.emoji}
                  </button>
                );
              })}
            </div>
            {moodNote && (
              <p style={{ fontSize: '0.72rem', color: 'var(--sm-muted)', margin: '8px 0 0', lineHeight: 1.45 }}>
                {moodNote}
              </p>
            )}
          </div>
        )}

        {/* Ações */}
        <div style={{ padding: '14px 20px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {canRecover && (
            <>
              <button onClick={onRecoverHearts} className="sm-btn sm-btn-secondary" style={{ width: '100%' }}>
                {isPt ? 'Eu fiz, esqueci de marcar' : 'I did it, forgot to log'}
              </button>
              <p style={{ fontSize: '0.7rem', color: 'var(--sm-muted)', textAlign: 'center', margin: 0, lineHeight: 1.4 }}>
                {isPt
                  ? 'Devolve os corações. O dia perfeito não volta — esse já passou.'
                  : 'Gives the hearts back. The perfect day doesn’t return — that one’s gone.'}
              </p>
            </>
          )}
          <button onClick={onClose} className="sm-btn" style={{ width: '100%' }}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
