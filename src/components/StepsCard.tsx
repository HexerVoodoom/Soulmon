/**
 * PASSOS — o cartão opcional, e a palavra opcional é literal.
 *
 * Apresentação PURA de `utils/steps.ts`: recebe tudo por props, não lê
 * GameState, não chama o plugin, não toca localStorage. Quem lê o sensor e
 * persiste o agregado é o App.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * AS TRÊS REGRAS QUE ESTA TELA CARREGA
 * ───────────────────────────────────────────────────────────────────────────
 * 1. **Consentimento ANTES do diálogo do sistema** (steps.ts, regra 3). Nada de
 *    `onRequestPermission()` sem ter mostrado `stepsConsentCopy` — isso é bug de
 *    conformidade (política do Play + LGPD), não de UX. E RECUSAR é tão fácil
 *    quanto aceitar: os dois são botões do mesmo tamanho, lado a lado, sem
 *    hierarquia visual empurrando para o "sim". Padrão escuro é justamente a
 *    recusa escondida num link cinza.
 * 2. **Passos NUNCA pontuam sozinhos** (steps.ts, regra 1). A frase está na
 *    tela, sempre visível, não escondida num "saiba mais": o passo CONFIRMA um
 *    hábito que a pessoa já marcou. Nenhum número aqui vira HP, energia,
 *    `perfectDays` ou peso de esforço.
 * 3. **Sem sensor não existe desvantagem** (steps.ts, regra 2). Com
 *    `available === false` (o caso da PWA, que é a maior parte da base) esta
 *    tela NÃO mostra erro, NÃO mostra medidor vazio e NÃO diz que a pessoa está
 *    perdendo alguma coisa — no máximo uma linha neutra de "este aparelho não
 *    tem contador", e `onDismiss` some com ela de vez.
 *
 * O medidor de meta é COLEÇÃO, não desempenho: ele não tem estado de falha, não
 * fica vermelho e não existe texto de "faltam X passos para a meta" — a meta é
 * uma referência de caminhada, nunca uma cobrança.
 */
import type { CSSProperties } from 'react';
import { DEFAULT_STEP_GOAL, stepsConsentCopy, stepsGoalProgress } from '../utils/steps';
import type { Language } from '../utils/i18n';
import { PixelButton, PixelMeter, PixelPanel } from './pixel/PixelKit';

export interface StepsCardProps {
  /** Total de passos de hoje (`StepsRecord.today`). */
  steps: number;
  /** O aparelho tem contador (`isStepsAvailable`). `false` = PWA/sem sensor. */
  available: boolean;
  /** Já concedida (`hasStepsPermission`). */
  hasPermission: boolean;
  /** Meta diária. Padrão `DEFAULT_STEP_GOAL`. */
  goal?: number;
  language: Language;
  /** Só chame depois desta tela de consentimento — nunca antes. */
  onRequestPermission: () => void;
  /** Recusar, ou tirar o cartão da frente. Sem custo, sem confirmação. */
  onDismiss: () => void;
}

const mutedLine: CSSProperties = {
  fontSize: '0.76rem',
  color: 'var(--sm-muted)',
  lineHeight: 1.45,
  margin: 0,
};

const bodyLine: CSSProperties = {
  fontSize: '0.78rem',
  color: 'var(--sm-ink)',
  lineHeight: 1.5,
  margin: '0 0 8px',
};

export function StepsCard({
  steps, available, hasPermission, goal = DEFAULT_STEP_GOAL,
  language, onRequestPermission, onDismiss,
}: StepsCardProps) {
  const isPt = language === 'pt-BR';

  // ── Sem sensor: uma linha neutra e um jeito de sumir com ela ────────────
  // Nada de erro, nada de "ative para não perder". Quem está aqui não perdeu
  // nada — o app inteiro funciona igual.
  if (!available) {
    return (
      <PixelPanel title={isPt ? 'PASSOS' : 'STEPS'}>
        <p style={{ ...mutedLine, marginBottom: 10 }}>
          {isPt
            ? 'Este aparelho não tem contador de passos. O Soulmon funciona exatamente igual sem ele.'
            : 'This device has no step counter. Soulmon works exactly the same without it.'}
        </p>
        <PixelButton size="lg" onClick={onDismiss}>
          {isPt ? 'Entendi' : 'Got it'}
        </PixelButton>
      </PixelPanel>
    );
  }

  // ── Consentimento: o que é lido, para quê, e o que não guardamos ────────
  if (!hasPermission) {
    const copy = stepsConsentCopy(language);
    return (
      <PixelPanel title={copy.title.toUpperCase()}>
        <p style={bodyLine}>{copy.what}</p>
        <p style={bodyLine}>{copy.why}</p>
        <p style={{ ...mutedLine, marginBottom: 14 }}>{copy.privacy}</p>

        {/* Aceitar e recusar têm o MESMO peso: mesma largura, mesma altura,
            lado a lado. Recusa escondida é padrão escuro. */}
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ flex: 1 }}>
            <PixelButton size="lg" variant="primary" onClick={onRequestPermission}>
              {copy.accept}
            </PixelButton>
          </span>
          <span style={{ flex: 1 }}>
            <PixelButton size="lg" onClick={onDismiss}>
              {copy.decline}
            </PixelButton>
          </span>
        </div>
      </PixelPanel>
    );
  }

  // ── Com permissão: o número, a meta e o limite honesto ──────────────────
  const ratio = stepsGoalProgress(steps, goal);
  const shown = Math.max(0, Math.floor(steps || 0));
  const locale = isPt ? 'pt-BR' : 'en-US';

  return (
    <PixelPanel title={isPt ? 'PASSOS DE HOJE' : "TODAY'S STEPS"}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--sm-ink)', lineHeight: 1.1 }}>
          {shown.toLocaleString(locale)}
        </span>
        <span style={{ fontSize: '0.76rem', color: 'var(--sm-muted)' }}>
          {isPt
            ? `de ${goal.toLocaleString(locale)} passos`
            : `of ${goal.toLocaleString(locale)} steps`}
        </span>
      </div>

      <PixelMeter
        ratio={ratio}
        tone="cyan"
        label={isPt ? 'Progresso de passos do dia' : "Today's step progress"}
      />

      {/* A REGRA DE PRODUTO, na tela, sempre visível. */}
      <p style={{ ...mutedLine, margin: '10px 0 0' }}>
        {isPt
          ? 'Passos não valem ponto sozinhos: eles só confirmam um hábito de saúde que você já marcou como feito. Quem não tem contador de passos não fica atrás em nada.'
          : "Steps never score on their own: they only confirm a health habit you already marked as done. Anyone without a step counter is behind on nothing."}
      </p>
    </PixelPanel>
  );
}

export default StepsCard;
