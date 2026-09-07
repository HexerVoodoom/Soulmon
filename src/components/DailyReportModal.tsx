import { Icon } from './ui/Icon';
import { SM2_SHADOW_CARD, sm2Button, sm2Hint, sm2TitleStyle } from './form/FormKit';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { UnlockNudge } from './UnlockAccountModal';
import { MemoriesCard } from './MemoriesCard';
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
  /** WP5.1 — o convite no VALUE MOMENT (o primeiro dia perfeito). A REGRA de
   *  quando ele pode aparecer é de `utils/offerMoment.ts`; aqui só chega o
   *  resultado dela, para a tela não virar dona de uma decisão de ética. */
  showOffer?: boolean;
  onOpenOffer?: () => void;
  /** Dispensa o convite PARA SEMPRE (`offerDismissed` no save). O `×` do card
   *  é o único padrão POSITIVO que o dossiê achou em onze apps de paywall. */
  onDismissOffer?: () => void;
  /** WP4.8 — as memórias de 30/90 dias, quando este é o dia. */
  memories?: {
    mark: number;
    petName: string;
    spriteUrl?: string | null;
    formNames: readonly string[];
    dreamCount: number;
    soulGoal?: string | null;
  } | null;
}

const hint = sm2Hint;
type Row = { label: string; value: string; highlight?: 'good' | 'soft' };

/**
 * O relatório do dia, mostrado uma vez na primeira abertura depois da virada.
 *
 * O TOM JÁ PASSOU POR UM PASSE E NÃO REGRIDE: nenhum vermelho, nenhum sinal de
 * menos, nenhum imperativo. Perda vira "em recuperação", e a frase de rodapé
 * oferece o caminho de volta em vez de mandar.
 *
 * ONDA 5: o ícone da manchete saiu da caixa de cobre (regra do dono: ícone
 * nunca dentro de box) e os PNGs viraram Material Symbols. Os ícones de CADA
 * LINHA saíram — eles desenhavam de novo a palavra ao lado ("Corações" com um
 * coração), que é o tipo de repetição que esta onda existe para cortar.
 */
export function DailyReportModal({ report, onClose, language, soulGoal, onRecoverHearts, moodToday, onPickMood, moodNote, showOffer = false, onOpenOffer, onDismissOffer, memories }: DailyReportModalProps) {
  const isPt = language === 'pt-BR';
  const dialogRef = useDialogA11y<HTMLDivElement>(true, onClose);
  // Modo acolhida: quem passou dias fora não recebe cobrança nenhuma. O
  // relatório vira "que bom que você voltou", e os números de falha somem — o
  // retorno depois de uma ausência tem que ser um abraço, não uma fatura.
  const welcome = !!report.welcomeBack;
  // Só faz sentido oferecer quando houve cobrança e ela ainda não foi desfeita.
  const canRecover = !welcome && report.heartsLost > 0 && !report.heartsRecovered && !!onRecoverHearts;

  // `soft` = ouro. NÃO existe `bad`: o vermelho de alerta é a cor de erro do
  // sistema, e um dia mais devagar não é um erro do usuário (mesma tese escrita
  // em TaskMeta.tsx:29).
  // Sem sinal de menos: era o único número negativo do app, e escrever uma
  // perda como "-1" é o vocabulário de extrato bancário. A frase de rodapé já
  // oferece o caminho de volta (carinho).
  const heartsValue = report.heartsLost <= 0
    ? (isPt ? 'inteiros!' : 'all there!')
    : report.heartsLost <= 0.5
      ? (isPt ? 'meio em recuperação' : 'half recovering')
      : (isPt ? `${report.heartsLost} em recuperação` : `${report.heartsLost} recovering`);
  const rows: Row[] = welcome
    ? [
        { label: isPt ? 'Corações' : 'Hearts', value: isPt ? 'intactos' : 'untouched', highlight: 'good' },
        { label: isPt ? 'Dias perfeitos guardados' : 'Perfect days saved', value: `${report.perfectDays}`, highlight: 'good' },
      ]
    : [
        {
          label: isPt ? 'Tarefas de ontem' : "Yesterday's tasks",
          value: isPt ? `${report.done} de ${report.total}` : `${report.done} of ${report.total}`,
          highlight: report.wasPerfect ? 'good' : undefined,
        },
        { label: isPt ? 'Corações' : 'Hearts', value: heartsValue, highlight: report.heartsLost > 0 ? 'soft' : 'good' },
        { label: isPt ? 'Dias perfeitos' : 'Perfect days', value: `${report.perfectDays}`, highlight: report.wasPerfect ? 'good' : undefined },
      ];

  // Coração partido + vermelho + fundo rosa era uma composição de LUTO para um
  // evento que já exige dias ruins seguidos. A noite diz a mesma coisa
  // ("passou um tempo ruim") sem dizer que a pessoa falhou.
  const headIcon = welcome ? 'volunteer_activism'
    : report.wasPerfect ? 'star'
      : (report.degenerated || report.heartsLost > 0) ? 'bedtime' : 'wb_sunny';
  const headTone: 'primary' | 'gold' | 'muted' = welcome
    ? 'primary'
    : report.heartsLost > 0 && !report.degenerated
      ? 'muted'
      : 'gold';

  const headline = welcome
    ? (isPt ? 'Que saudade!' : 'I missed you!')
    : report.degenerated
      ? (isPt ? 'Seu Soulmon voltou um estágio' : 'Your Soulmon stepped back a stage')
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
      ? `Você ficou ${report.daysAway} dias fora e seu Soulmon não perdeu nada esperando — só estava com saudade. Comece de onde parou.`
      : `You were away ${report.daysAway} days and your Soulmon lost nothing waiting. It just missed you. Pick up where you left off.`);
  }
  if (report.weeklyRelief) {
    notes.push(isPt
      ? 'Semana nova: seu Soulmon recuperou meio coração. O que passou, passou.'
      : 'New week: your Soulmon recovered half a heart. Last week stays behind.');
  }
  if (!welcome && report.done >= report.required && report.energyWasFull === false) {
    notes.push(isPt
      // "Faltou" para quem cumpriu 100% da própria meta é a palavra de quem
      // cobra. Vira dica para amanhã, que é o que ela de fato é.
      ? 'Tarefas em dia! Fica a dica pra amanhã: encher a energia também fecha o dia perfeito.'
      : 'Tasks done! A tip for tomorrow: filling the energy bar also seals a perfect day.');
  }
  if (!welcome && report.heartsLost > 0 && !report.degenerated) {
    notes.push(isPt
      // Convite, não imperativo: era a única ordem dirigida ao usuário no app.
      ? 'Um carinho devolve meio coração, se você quiser — e nunca se perde mais que um por dia.'
      : 'A rub gives half a heart back, if you feel like it — and you never lose more than one a day.');
  }
  if (report.heartsRecovered) {
    notes.push(isPt
      // A segunda oração corrigia o comportamento logo depois de perdoar — o
      // perdão com ressalva é o que ensina a pessoa a não pedir de novo.
      ? 'Corações devolvidos. Ficou tudo certo.'
      : 'Hearts restored. All good.');
  }
  if (soulGoal && (report.wasPerfect || welcome)) {
    notes.push(isPt
      ? `Lembra por que você começou: "${soulGoal}".`
      : `Remember why you started: "${soulGoal}".`);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(6, 24, 26, .55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={headline}
        style={{
          width: '100%', maxWidth: 340, maxHeight: '90vh', overflowY: 'auto',
          backgroundColor: 'var(--sm2-surface)',
          borderRadius: 12,
          boxShadow: SM2_SHADOW_CARD,
        }}
      >
        {/* Cabeçalho */}
        <div style={{ position: 'relative', padding: '24px 20px 12px', textAlign: 'center' }}>
          {/* 44×44 de área de toque (WCAG 2.2 AA 2.5.8): fechar um modal é a
              saída de emergência da UI, e o pior lugar para um alvo pequeno. A
              placa cinza em volta saiu — ícone nunca dentro de box. */}
          <button type="button" onClick={onClose} aria-label={isPt ? 'Fechar' : 'Close'}
            style={{ position: 'absolute', top: 4, right: 4, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}>
            <Icon name="close" size={24} tone="muted" />
          </button>
          <div style={{ position: 'relative', width: 48, height: 48, margin: '0 auto 10px' }}>
            {report.wasPerfect && (
              <img src={confettiBurst} alt="" aria-hidden="true" style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: 140, height: 140, maxWidth: 'none', pointerEvents: 'none', imageRendering: 'pixelated',
              }} />
            )}
            <Icon name={headIcon} size={48} fill={1} tone={headTone} style={{ position: 'relative' }} />
          </div>
          <p className="sm2-title" style={sm2TitleStyle}>{headline}</p>
        </div>

        {/* Linhas */}
        <div style={{ padding: '0 20px 6px' }}>
          {rows.map(r => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
              <span style={{ ...hint, flex: 1 }}>{r.label}</span>
              <span className="sm2-num" style={{
                fontSize: 'var(--sm2-text-sm)', fontWeight: 500,
                color: r.highlight === 'good' ? 'var(--sm2-primary-ink)'
                  : r.highlight === 'soft' ? 'var(--sm2-gold-ink)' : 'var(--sm2-ink)',
              }}>{r.value}</span>
            </div>
          ))}
          {notes.map((n, i) => (
            <p key={i} style={{ ...hint, paddingTop: 8 }}>{n}</p>
          ))}
        </div>

        {/* Check-in de humor. Fica aqui porque o relatório já aparece 1×/dia:
            não custa uma abertura a mais do app. É opcional e não vale ponto. */}
        {onPickMood && (
          <div style={{ padding: '12px 20px 0' }}>
            <p style={{ ...hint, marginBottom: 8 }}>
              {isPt ? 'E você, como está hoje?' : 'And how are you today?'}
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              {MOOD_OPTIONS.map(m => {
                const active = moodToday === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => onPickMood(m.value)}
                    aria-label={isPt ? m.labelPt : m.labelEn}
                    aria-pressed={active}
                    title={isPt ? m.labelPt : m.labelEn}
                    style={{
                      flex: 1, minHeight: 44, cursor: 'pointer', fontSize: 20, lineHeight: 1,
                      borderRadius: 10,
                      backgroundColor: active ? 'var(--sm2-primary-soft)' : 'var(--sm2-surface-2)',
                      border: active ? '1px solid var(--sm2-primary-ink)' : '1px solid var(--sm2-line)',
                    }}
                  >
                    {m.emoji}
                  </button>
                );
              })}
            </div>
            {moodNote && <p style={{ ...hint, marginTop: 8 }}>{moodNote}</p>}
          </div>
        )}

        {/* WP4.8 — MEMÓRIAS. O app contava o dia e a semana e nunca contou a
            HISTÓRIA. Fica dentro do relatório que a pessoa já ia ver: não
            gera push, badge nem lembrete — um "momento" que persegue deixa de
            ser momento. */}
        {memories && (
          <div style={{ padding: '0 20px 8px' }}>
            <MemoriesCard {...memories} language={language} />
          </div>
        )}

        {/* WP5.1 — O CONVITE NO VALUE MOMENT.
            O momento em que este produto prova o que vende não é o reveal (ali
            a pessoa ainda não sabe se isso vai servir para alguma coisa): é o
            primeiro DIA PERFEITO — ela cumpriu o que combinou consigo mesma e
            viu a criatura responder. O convite existia em dois lugares e em
            nenhum deles.
            Fica ANTES do botão de fechar e depois do relatório inteiro: quem
            veio ver o próprio dia vê o dia primeiro. As travas (nunca no D0,
            nunca em cima de quem voltou de ausência, 1×/semana, só para quem
            não comprou) são de `utils/offerMoment.ts`. */}
        {showOffer && onOpenOffer && (
          /* A FORMA do card, e ela é a metade que faltava (auditoria de
             06/09/2026). O dossiê achou UM padrão positivo em onze apps de
             paywall (Garmin) e ele são quatro decisões JUNTAS: `×` no próprio
             card, botão de largura PARCIAL contra os CTAs de largura total,
             container irmão (não empilhado no fluxo da ação), e removível de
             vez. Sem o `×`, a única forma de nunca mais ver o convite era
             comprar ou nunca mais ter um dia perfeito na semana. */
          <div
            style={{
              margin: '0 20px',
              padding: 12,
              borderRadius: 12,
              border: '1px solid var(--sm2-line)',
              backgroundColor: 'var(--sm2-surface)',
              position: 'relative',
            }}
          >
            {onDismissOffer && (
              <button
                type="button"
                onClick={onDismissOffer}
                aria-label={isPt ? 'Não mostrar de novo' : 'Do not show again'}
                style={{
                  position: 'absolute', top: 4, right: 4, width: 32, height: 32,
                  display: 'grid', placeItems: 'center',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--sm2-muted)', fontSize: 16, lineHeight: 1,
                }}
              >
                ×
              </button>
            )}
            <p style={{ ...hint, margin: '0 24px 8px 0' }}>
              {isPt
                ? 'Foi um dia inteiro do jeito que você quis. Seu Soulmon sentiu.'
                : 'That was a whole day the way you wanted it. Your Soulmon felt it.'}
            </p>
            {/* Largura PARCIAL de propósito: os botões de ação do relatório
                ("Começar o dia") ocupam a largura toda, e um convite com o
                mesmo peso compete com a ação que fecha o ritual do dia. */}
            <div style={{ maxWidth: 260 }}>
              <UnlockNudge language={language} reason="report" onOpen={onOpenOffer} />
            </div>
          </div>
        )}

        {/* Ações */}
        <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {canRecover && (
            <>
              <button type="button" onClick={onRecoverHearts} style={{ ...sm2Button('ghost'), width: '100%' }}>
                {isPt ? 'Eu fiz, esqueci de marcar' : 'I did it, forgot to log'}
              </button>
              <p style={{ ...hint, textAlign: 'center' }}>
                {isPt
                  ? 'Devolve os corações. O dia perfeito não volta — esse já passou.'
                  : 'Gives the hearts back. The perfect day doesn’t return — that one’s gone.'}
              </p>
            </>
          )}
          <button type="button" onClick={onClose} style={{ ...sm2Button('primary'), width: '100%' }}>
            {isPt ? 'Começar o dia' : 'Start the day'}
          </button>
        </div>
      </div>
    </div>
  );
}
