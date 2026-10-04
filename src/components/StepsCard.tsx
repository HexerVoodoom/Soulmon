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
import { DEFAULT_STEP_GOAL, stepsConsentCopy, stepsGoalProgress } from '../utils/steps';
import type { Language } from '../utils/i18n';
import { GroupCard, sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import { InfoTip } from './ui/InfoTip';

/*
 * CANVAS "CONTA" (20/09/2026, `Passos.dc.html`, CONTA-11/12): o consentimento
 * é o card SIS-03 "Count your steps?" (Cinzel 20, caixa de frase — era
 * `PixelPanel` Silkscreen), "Count them" `primary` + "Not now" `outline` do
 * MESMO tamanho; com permissão, o número do dia em mono 24 `tabular-nums`
 * (valor = mono; leitura, não placar) e o `.meter` SIS-07 em `primary-fill`.
 * O ramo "sem sensor" não é desenhado (DECISÕES §15 S2: o App só monta com
 * `available` literal; `!available` devolve nada).
 */

export interface StepsCardProps {
  /** Total de passos de hoje (`StepsRecord.today`). */
  steps: number;
  /** O aparelho tem contador (`isStepsAvailable`). `false` = PWA/sem sensor:
   *  o cartão não existe (regra 3 — sem sensor não há desvantagem nem aviso). */
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

export function StepsCard({
  steps, available, hasPermission, goal = DEFAULT_STEP_GOAL,
  language, onRequestPermission, onDismiss,
}: StepsCardProps) {
  const isPt = language === 'pt-BR';

  // ── Sem sensor: nada. O app inteiro funciona igual, e dizer isso num
  // cartão seria mais um medidor a administrar (S2: ramo sem caminho vivo).
  if (!available) return null;

  // ── Consentimento: o que é lido, para quê, e o que não guardamos ────────
  if (!hasPermission) {
    const copy = stepsConsentCopy(language);
    return (
      <GroupCard title={copy.title}>
        <p style={{ ...sm2Text, margin: 0 }}>{copy.what}</p>
        <p style={{ ...sm2Text, margin: 0 }}>{copy.why}</p>
        <p style={sm2Hint}>{copy.privacy}</p>

        {/* Aceitar e recusar têm o MESMO peso: mesma largura, mesma altura,
            lado a lado. Recusa escondida é padrão escuro. */}
        <div className="sm2-conta-two">
          <button type="button" onClick={onRequestPermission} style={sm2Button('primary')}>
            {copy.accept}
          </button>
          <button type="button" onClick={onDismiss} style={sm2Button('outline')}>
            {copy.decline}
          </button>
        </div>
      </GroupCard>
    );
  }

  // ── Com permissão: o número, a meta e o limite honesto ──────────────────
  const ratio = stepsGoalProgress(steps, goal);
  const shown = Math.max(0, Math.floor(steps || 0));
  const locale = isPt ? 'pt-BR' : 'en-US';

  return (
    <GroupCard title={isPt ? 'Passos de hoje' : "Today's steps"}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* O dado do dia em mono `tabular-nums` (D-K3): é o número que mais
            muda do cartão — sem largura fixa de dígito ele pula de posição a
            cada leitura do sensor. */}
        <span className="sm2-conta-bignum">{shown.toLocaleString(locale)}</span>
        <span className="sm2-num" style={sm2Hint}>
          {isPt
            ? `de ${goal.toLocaleString(locale)} passos`
            : `of ${goal.toLocaleString(locale)} steps`}
        </span>
      </div>

      <div
        className="sm2-kit-meter"
        role="img"
        aria-label={isPt ? 'Progresso de passos do dia' : "Today's step progress"}
      >
        <div className="sm2-kit-meter-fill" style={{ width: `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%` }} />
      </div>

      {/* A REGRA DE PRODUTO (I13: atrás do "?"; o consentimento dos passos
          continua inteiro em `stepsConsentCopy`). */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <InfoTip language={language} label={isPt ? 'Como os passos contam' : 'How steps count'} align="right" style={{ minHeight: 24 }}>
          {isPt
            ? 'Passos não valem ponto sozinhos: eles só confirmam um hábito de saúde que você já marcou como feito.'
            : 'Steps never score on their own: they only confirm a health habit you already marked as done.'}
        </InfoTip>
      </div>
    </GroupCard>
  );
}

export default StepsCard;
