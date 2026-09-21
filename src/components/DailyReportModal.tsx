import type { CSSProperties } from 'react';
import { Icon } from './ui/Icon';
import { sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import { UnlockNudge } from './UnlockAccountModal';
import { MemoriesCard } from './MemoriesCard';
import { MOOD_OPTIONS, type MoodValue } from '../utils/mood';
import type { AdventureFind } from '../utils/adventure';
import { ADVENTURE_ART } from '../utils/adventureArt';
import { welcomeBackLine } from '../utils/welcomeBack';
import type { GameState } from '../contexts/GameStateContext';
import type { Language } from '../utils/i18n';
import { RitualDialog, RitualGlass, RitualRow, SpriteGlass, ritualTitle, type RitualRowTone } from './ritual/RitualKit';

interface DailyReportModalProps {
  report: NonNullable<GameState['lastDayReport']>;
  /**
   * O que a criatura trouxe da aventura do dia (`utils/adventure.ts`).
   *
   * Chega PRONTO de fora, e isso não é detalhe: o sorteio é determinístico pelo
   * dia, e um `useState` aqui daria um achado novo a cada reabertura — a tela
   * viraria caça-níquel e ensinaria a pessoa a reabrir o relatório em vez de
   * viver o dia.
   */
  adventure?: AdventureFind | null;
  /** Ainda não estava no diário. Muda só o rótulo. */
  adventureIsNew?: boolean;
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
  /** Sprite atual do pet — a criatura NA peça do retorno (R4, D-H7). */
  spriteUrl?: string | null;
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
type Row = { label: string; value: string; tone?: RitualRowTone };

/**
 * O confete do dia completo — VETOR, na faixa da estrela, nunca sobre as
 * letras (D-R2, X2). SVG 200×60 em `primary-ink`/`gold-ink`, `aria-hidden`;
 * termina acima do título (medido: 0 das 14 peças dentro do retângulo do
 * `h2`). O `gain-confetti.png` fica para o vidro da Home.
 */
function Confetti() {
  return (
    <svg
      data-confetti
      viewBox="0 0 200 60"
      aria-hidden="true"
      style={{ position: 'absolute', left: '50%', top: 0, width: 200, height: 60, marginLeft: -100, pointerEvents: 'none', zIndex: 0 }}
    >
      <g fill="none" strokeWidth="3" strokeLinecap="round">
        <path d="M22 22 q6 -8 12 0 t12 0" stroke="var(--sm2-primary-ink)" />
        <path d="M150 12 q6 8 12 0 t12 0" stroke="var(--sm2-gold-ink)" />
        <path d="M30 46 q6 -8 12 0" stroke="var(--sm2-gold-ink)" />
        <path d="M158 42 q6 8 12 0" stroke="var(--sm2-primary-ink)" />
      </g>
      <g>
        <rect x="60" y="6" width="6" height="6" rx="1" fill="var(--sm2-primary-ink)" transform="rotate(20 63 9)" />
        <rect x="128" y="4" width="6" height="6" rx="1" fill="var(--sm2-gold-ink)" transform="rotate(-15 131 7)" />
        <rect x="12" y="36" width="6" height="6" rx="1" fill="var(--sm2-gold-ink)" transform="rotate(30 15 39)" />
        <rect x="182" y="28" width="6" height="6" rx="1" fill="var(--sm2-primary-ink)" transform="rotate(10 185 31)" />
        <rect x="66" y="48" width="6" height="6" rx="1" fill="var(--sm2-primary-ink)" transform="rotate(-25 69 51)" />
        <rect x="126" y="50" width="6" height="6" rx="1" fill="var(--sm2-gold-ink)" transform="rotate(40 129 53)" />
        <circle cx="46" cy="34" r="3" fill="var(--sm2-primary-ink)" />
        <circle cx="160" cy="28" r="3" fill="var(--sm2-gold-ink)" />
        <circle cx="8" cy="14" r="2.5" fill="var(--sm2-gold-ink)" />
        <circle cx="192" cy="10" r="2.5" fill="var(--sm2-primary-ink)" />
      </g>
    </svg>
  );
}

/** O `.card` SIS-03: `surface` + fronteira `line`, raio 12. */
const card: CSSProperties = {
  backgroundColor: 'var(--sm2-surface)',
  border: '1px solid var(--sm2-line)',
  borderRadius: 'var(--sm2-radius-md)',
  boxSizing: 'border-box',
};

/** `pick` determinístico pela data do relatório: a mesma manhã, a mesma frase. */
function pickFor(date: string): number {
  let h = 0;
  for (let i = 0; i < date.length; i += 1) h = (h * 31 + date.charCodeAt(i)) % 1000;
  return h / 1000;
}

/**
 * O relatório do dia, mostrado uma vez na primeira abertura depois da virada.
 *
 * O TOM JÁ PASSOU POR UM PASSE E NÃO REGRIDE: nenhum vermelho, nenhum sinal de
 * menos, nenhum imperativo. Perda vira "em recuperação", e a frase de rodapé
 * oferece o caminho de volta em vez de mandar.
 *
 * CANVAS RITUAIS (DECISÕES §7 R2–R5, S1–S3; §21 D-R1/D-R2/D-R3/D-R6/D-R7/D-R9):
 *  · **aparelho, não pixel**: manchete com glifo Material 48 (`bedtime`
 *    `muted` · `star` FILL 1 `gold-ink` · `wb_sunny` · `nightlight`), confete
 *    em SVG vetor na faixa da estrela; o pixel entra só em vidro — a arte da
 *    aventura 96² a 48 num vidro 48², a criatura do retorno/memória a 64 num
 *    vidro 96²;
 *  · **ordem de tempo (R2)**: ONTEM inteiro (linhas · notas · aventura ·
 *    memória) → a pergunta de HOJE (humor) → convite → "Start the day";
 *  · **piso de dígitos (R5/S2)**: "Yesterday's tasks" com feitos = 0 vira
 *    "not logged" quando houve cobrança e SOME sem cobrança; "Complete days
 *    saved" some com `perfectDays === 0`;
 *  · **retorno (R4/S1)**: o sprite na peça + UMA linha da família
 *    `welcomeBackLine` (faixa de ausência, nunca o N de dias);
 *  · **um caminho de volta (R3/S3)**: a nota do carinho saiu; "I did it,
 *    forgot to log" fica, em `outline`;
 *  · **humor = 5 alvos 44 iguais** com o emoji de `mood.ts` (D-R6);
 *  · **convite** = card irmão com × 44 e `outline` de duas linhas em 260 (D-R9).
 */
export function DailyReportModal({ report, adventure, adventureIsNew = false, onClose, language, soulGoal, onRecoverHearts, moodToday, onPickMood, moodNote, showOffer = false, onOpenOffer, onDismissOffer, spriteUrl, memories }: DailyReportModalProps) {
  const isPt = language === 'pt-BR';
  // Modo acolhida: quem passou dias fora não recebe cobrança nenhuma. O
  // relatório vira "que bom que você voltou", e os números de falha somem — o
  // retorno depois de uma ausência tem que ser um abraço, não uma fatura.
  const welcome = !!report.welcomeBack;
  // Só faz sentido oferecer quando houve cobrança e ela ainda não foi desfeita.
  const canRecover = !welcome && report.heartsLost > 0 && !report.heartsRecovered && !!onRecoverHearts;

  // Sem sinal de menos: era o único número negativo do app, e escrever uma
  // perda como "-1" é o vocabulário de extrato bancário. A perda é peso 400,
  // sem itálico, sem vermelho (D-R2). NÃO existe `bad`.
  // Copy §2.4 (21/09/2026): a perda de sustentação DESCREVE o fenômeno e não
  // atribui causa — nem acusa ("porque você não fez") nem absolve ("não é
  // culpa sua"): as duas reprovam (§17 #3). O número segue nas linhas de fato.
  const heartsValue = report.heartsLost <= 0
    ? (isPt ? 'inteiros!' : 'all there!')
    : (isPt ? 'O padrão afrouxou um pouco.' : 'The pattern loosened a little.');
  const rows: Row[] = [];
  if (welcome) {
    rows.push({ label: isPt ? 'Corações' : 'Hearts', value: isPt ? 'intactos' : 'untouched', tone: 'hi' });
    // 13.7 — posse pode mostrar zero, mas aqui o zero não é posse: some (R4).
    if (report.perfectDays > 0) {
      rows.push({ label: isPt ? 'Dias completos guardados' : 'Complete days saved', value: `${report.perfectDays}`, tone: 'hi' });
    }
  } else {
    // R5 — feitos = 0: "not logged" quando houve cobrança (é o referente do
    // botão "I did it, forgot to log"); sem cobrança a linha some — um "0 of
    // 4" numa manhã perdoada não explica nada.
    if (report.done > 0) {
      rows.push({
        label: isPt ? 'Tarefas de ontem' : "Yesterday's tasks",
        value: isPt ? `${report.done} de ${report.total}` : `${report.done} of ${report.total}`,
        tone: report.wasPerfect ? 'hi' : undefined,
      });
    } else if (report.heartsLost > 0) {
      rows.push({ label: isPt ? 'Tarefas de ontem' : "Yesterday's tasks", value: isPt ? 'sem registro' : 'not logged', tone: 'soft' });
    }
    rows.push({ label: isPt ? 'Corações' : 'Hearts', value: heartsValue, tone: report.heartsLost > 0 ? 'soft' : 'hi' });
    rows.push({ label: isPt ? 'Dias completos' : 'Complete days', value: `${report.perfectDays}`, tone: report.wasPerfect ? 'hi' : undefined });
  }

  // Coração partido + vermelho + fundo rosa era uma composição de LUTO para um
  // evento que já exige dias ruins seguidos. A noite diz a mesma coisa
  // ("passou um tempo ruim") sem dizer que a pessoa falhou.
  const headIcon = report.wasPerfect ? 'star'
    : report.degenerated ? 'nightlight'
      : report.heartsLost > 0 ? 'bedtime' : 'wb_sunny';
  const headTone: 'gold' | 'muted' = report.wasPerfect || headIcon === 'wb_sunny' ? 'gold' : 'muted';

  /* Copy §2.1–§2.4 (21/09/2026): o mundo CONSTATA — sem `!`, que transforma
     constatação em animação encomendada. "Um trecho fechou" no lugar de "Dia
     completo!" (§10 da bíblia proíbe dia perfeito/imperfeito); a queda de forma
     RECOLHE, nunca "volta"/"regride" (§17 #11). O ramo `welcome` continua com
     a família do `welcomeBack.ts`, por decisão 3 do dono (faixas mantidas). */
  const headline = welcome
    ? (isPt ? 'Que saudade!' : 'I missed you!')
    : report.degenerated
      ? (isPt ? 'Ele recolheu para uma forma que se sustenta com menos.' : 'The pattern drew back into a form that holds with less.')
      : report.wasPerfect
        ? (isPt ? 'Um trecho fechou.' : 'A stretch closed.')
        : report.heartsLost > 0
          ? (isPt ? 'Um dia mais devagar.' : 'A slower day.')
          : (isPt ? 'Dia novo.' : 'New day.');

  // Frases de rodapé. Nenhuma delas cobra — a mais "dura" apenas conta o que
  // aconteceu. S1: o N de dias fora NÃO aparece (a acolhida é a linha do pet,
  // no cabeçalho). STATUS h: folga e alívio semanal não entram no retorno.
  const notes: string[] = [];
  // P2 — a folga da semana entrou. **Contar é obrigatório**: uma folga gasta em
  // silêncio é um perdão que a pessoa nunca soube que recebeu — e na semana
  // seguinte ela é cobrada sem entender por que desta vez doeu.
  // Copy §2.6: "maré" é o termo canônico (§12) — ninguém concedeu nada, a
  // Malha tem ciclo próprio. ⚠️ Sem SALDO ("resta 0", "1 de 1"): saldo de
  // perdão é dívida com outro nome (§10). "Recarrega na segunda" é permitido
  // por ser fato que só sobe (§17 #6).
  if (!welcome && report.restDayUsed) {
    notes.push(isPt
      ? 'A maré absorveu ontem. Nada foi cobrado. Ela recarrega na segunda.'
      : 'The tide absorbed yesterday. Nothing was charged. It comes back on Monday.');
  }
  // Copy §2.5: nunca "recuperamos seu progresso perdido" — sugere perda, e L4
  // diz que não houve.
  if (!welcome && report.weeklyRelief) {
    notes.push(isPt
      ? 'A maré devolveu um pouco. Semana nova.'
      : 'The tide gave a little back. New week.');
  }
  // Copy §3.4, linha de apoio: sem ela a manchete da queda de forma lê como
  // punição. Fato verdadeiro no código — `unlockedEvolutions`, `perfectDays` e
  // o registro não são tocados (L4).
  if (!welcome && report.degenerated) {
    notes.push(isPt
      ? 'Nada do que foi descoberto saiu. O caminho de volta é o mesmo caminho.'
      : 'Nothing found is gone. The way back is the same way.');
  }
  // Copy §2.3, linha de apoio do dia completo: o exemplo literal ✅ da §13.
  // Nomeia o ato e o efeito na Malha (L12); o mérito fica de fora.
  if (!welcome && report.wasPerfect) {
    notes.push(isPt ? 'A fagulha firmou.' : 'The ember steadied.');
  }
  if (!welcome && report.done >= report.required && report.energyWasFull === false) {
    notes.push(isPt
      // "Faltou" para quem cumpriu 100% da própria meta é a palavra de quem
      // cobra. Vira dica para amanhã, que é o que ela de fato é.
      ? 'Tarefas em dia! Fica a dica pra amanhã: encher a energia também fecha o dia completo.'
      : 'Tasks done! A tip for tomorrow: filling the energy bar also seals a complete day.');
  }
  if (report.heartsRecovered) {
    notes.push(isPt
      // A segunda oração corrigia o comportamento logo depois de perdoar — o
      // perdão com ressalva é o que ensina a pessoa a não pedir de novo.
      ? 'Corações devolvidos. Ficou tudo certo.'
      : 'Hearts restored. All good.');
  }
  const goalNote = soulGoal && (report.wasPerfect || welcome) ? soulGoal : null;

  const welcomeLine = welcome
    ? welcomeBackLine(Number(report.daysAway ?? 0), isPt, pickFor(report.date))
    : null;

  const adventureArt = adventure ? ADVENTURE_ART[adventure.id] : undefined;

  return (
    <RitualDialog label={headline} onClose={onClose} maxWidth={340} closeLabel={isPt ? 'Fechar' : 'Close'}>
      {/* Cabeçalho: a manchete é APARELHO — glifo 48 pelado (ícone nunca
          dentro de box) ou, no retorno, a criatura num vidro. O confete é
          absoluto na faixa do glifo e o título fica acima dele no z. */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center', paddingTop: report.wasPerfect ? 6 : 4 }}>
        {report.wasPerfect && <Confetti />}
        {welcome && spriteUrl
          ? <SpriteGlass spriteUrl={spriteUrl} />
          : <Icon name={headIcon} size={48} fill={report.wasPerfect ? 1 : 0} tone={headTone} style={{ position: 'relative', zIndex: 1 }} />}
        <h2 data-headline style={{ ...ritualTitle, position: 'relative', zIndex: 1 }}>{headline}</h2>
      </div>

      {/* R4 — UMA linha da família `welcomeBackLine`; nunca o N de dias. */}
      {welcomeLine && <p style={{ ...sm2Text, margin: 0, textAlign: 'center' }}>{welcomeLine}</p>}

      {/* Linhas de ONTEM */}
      <div>
        {rows.map(r => <RitualRow key={r.label} label={r.label} value={r.value} tone={r.tone} />)}
        {notes.map((n, i) => (
          <p key={i} style={{ ...hint, paddingTop: 4 }}>{n}</p>
        ))}
        {goalNote && (
          <p style={{ ...hint, paddingTop: 4 }}>
            {isPt ? 'Lembra por que você começou: “' : 'Remember why you started: “'}
            <i>{goalNote}</i>
            ”.
          </p>
        )}
      </div>

      {/* ── A AVENTURA DA NOITE ──────────────────────────────────────────
          O pet saiu durante o dia e voltou com uma cena. É o loop de duas
          visitas do Finch, e a razão de ele ser narrativo está no benchmark
          do `docs/PLANO-TAREFAS.md`: **narrativa não satura**.

          APARECE EM TODO RELATÓRIO, inclusive no do dia ruim e no de quem
          voltou depois de sumir. É deliberado: o dia ruim é o momento mais
          frágil do app, e é justamente nele que a única coisa boa da tela não
          pode faltar.

          NÃO PAGA NADA (decisão do dono, 08/09/2026). Sem Bits, sem item, sem
          atributo. A arte (96² nativa) entra a 48 (0,5×) num vidro 48² — o
          único pixel do card (D-R3). */}
      {adventure && (
        <div style={{ ...card, display: 'flex', gap: 12, alignItems: 'flex-start', padding: '8px 12px 8px 8px' }}>
          {adventureArt
            ? (
              <RitualGlass width={48}>
                <img src={adventureArt} alt="" width={48} height={48} style={{ width: 48, height: 48, display: 'block' }} />
              </RitualGlass>
            )
            /* Emoji do catálogo quando a arte ainda não existe — conteúdo, não
               pixel: fica fora do vidro. */
            : <span aria-hidden style={{ fontSize: 28, lineHeight: '48px', width: 48, textAlign: 'center', flexShrink: 0 }}>{adventure.emoji}</span>}
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <p style={hint}>
              {isPt ? 'Da aventura de hoje' : "From today's adventure"}
              {adventureIsNew && <b style={{ fontWeight: 600 }}>{isPt ? ' · inédito' : ' · new'}</b>}
            </p>
            <p style={{ ...sm2Text, margin: 0, fontWeight: 500 }}>
              {isPt ? adventure.titlePt : adventure.titleEn}
            </p>
            <p style={hint}>
              {isPt ? adventure.textPt : adventure.textEn}
            </p>
          </div>
        </div>
      )}

      {/* WP4.8 — MEMÓRIAS. O app contava o dia e a semana e nunca contou a
          HISTÓRIA. Fica dentro do relatório que a pessoa já ia ver: não
          gera push, badge nem lembrete. Ainda é ONTEM (R2). */}
      {memories && <MemoriesCard {...memories} language={language} />}

      {/* A pergunta de HOJE (R2): o humor, colado ao CTA. Fica aqui porque o
          relatório já aparece 1×/dia. Opcional, e não vale ponto (D-R6: sem
          rótulo de prêmio; 5 alvos 44 iguais com o emoji de `mood.ts`). */}
      {onPickMood && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
          <p style={hint}>{isPt ? 'E você, como está hoje?' : 'And how are you today?'}</p>
          <div role="group" aria-label={isPt ? 'Humor' : 'Mood'} style={{ display: 'flex', gap: 8 }}>
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
                    flex: 1, minHeight: 44, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, lineHeight: 1,
                    boxSizing: 'border-box',
                    border: 'none',
                    borderRadius: 'var(--sm2-radius-md)',
                    backgroundColor: active ? 'var(--sm2-primary-soft)' : 'var(--sm2-surface-2)',
                    boxShadow: active ? 'inset 0 0 0 2px var(--sm2-primary-ink)' : 'inset 0 0 0 1px var(--sm2-muted)',
                  }}
                >
                  <span aria-hidden="true">{m.emoji}</span>
                </button>
              );
            })}
          </div>
          {moodNote && <p style={hint}>{moodNote}</p>}
        </div>
      )}

      {/* WP5.1 — O CONVITE NO VALUE MOMENT.
          Fica ANTES do botão de fechar e depois do relatório inteiro: quem
          veio ver o próprio dia vê o dia primeiro. As travas são de
          `utils/offerMoment.ts`. A FORMA (D-R9, o único padrão positivo do
          dossiê — Garmin): × 44 no próprio card, `outline` de duas linhas com
          largura PARCIAL (260) contra os CTAs de largura total, container
          irmão, removível de vez. Sem cadeado: é convite, não recusa. */}
      {showOffer && onOpenOffer && (
        <div aria-label={isPt ? 'Convite' : 'Invitation'} style={{ ...card, position: 'relative', padding: 12 }}>
          {onDismissOffer && (
            <button
              type="button"
              onClick={onDismissOffer}
              aria-label={isPt ? 'Não mostrar de novo' : 'Do not show again'}
              style={{
                position: 'absolute', top: 0, right: 0, width: 44, height: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              <Icon name="close" size={24} tone="muted" />
            </button>
          )}
          <p style={{ ...hint, margin: '0 36px 8px 0' }}>
            {isPt
              ? 'Foi um dia inteiro do jeito que você quis. Seu Soulmon sentiu.'
              : 'That was a whole day the way you wanted it. Your Soulmon felt it.'}
          </p>
          <div style={{ maxWidth: 260 }}>
            <UnlockNudge language={language} reason="report" onOpen={onOpenOffer} />
          </div>
        </div>
      )}

      {/* Ações */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {canRecover && (
          <>
            <button type="button" onClick={onRecoverHearts} style={{ ...sm2Button('outline'), width: '100%' }}>
              {isPt ? 'Eu fiz, esqueci de marcar' : 'I did it, forgot to log'}
            </button>
            <p style={{ ...hint, textAlign: 'center' }}>
              {isPt
                ? 'Devolve os corações. O dia completo não volta — esse já passou.'
                : 'Gives the hearts back. The complete day doesn’t return — that one’s gone.'}
            </p>
          </>
        )}
        <button type="button" onClick={onClose} style={{ ...sm2Button('primary'), width: '100%' }}>
          {isPt ? 'Começar o dia' : 'Start the day'}
        </button>
      </div>
    </RitualDialog>
  );
}
