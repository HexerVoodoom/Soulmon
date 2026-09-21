/**
 * JANELA DE DESCANSO — o cartão de configurar e ver.
 *
 * Apresentação PURA de `utils/restWindow.ts`: recebe `rest` e `now` por
 * propriedade, não lê GameState, não toca localStorage, não chama Date.now().
 * Quem persiste é o App.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * REGRA DE PRODUTO — O QUE ESTA TELA NUNCA PODE MOSTRAR
 * ───────────────────────────────────────────────────────────────────────────
 * É PROIBIDO, aqui e em qualquer tela de sono do app:
 *
 *   1. score de 0 a 100 (ou qualquer nota de "qualidade do sono");
 *   2. gráfico de estágios do sono (leve/profundo/REM);
 *   3. texto que julgue a noite — "sono ruim", "você dormiu pouco",
 *      "sua regularidade caiu";
 *   4. qualquer menção a META DE DURAÇÃO ("8 horas", "faltaram 40 min").
 *
 * Por quê: a ortossonia — a busca ansiosa pelo sono perfeito, alimentada por
 * métrica — atinge 3–14% da população geral, com escores de insônia mais
 * altos, e o gradiente etário é brutal: ~23% dos usuários de 18 a 35 anos
 * relatam que apps de sono os deixam ESTRESSADOS com o próprio sono, contra
 * 2,4% acima dos 66. O público deste app está inteiro na faixa de risco.
 *
 * O mecanismo é conhecido: premiar o RESULTADO fisiológico (dormir bem) em vez
 * do COMPORTAMENTO (deitar no horário) é, literalmente, como se fabrica
 * ortossonia — ninguém comanda o próprio sono às 3h da manhã, então um número
 * que só o corpo controla vira ansiedade pura. Por isso a janela é DO USUÁRIO
 * (sem recomendação de duração ideal) e o único número exibido é a CONSTÂNCIA
 * DE HORÁRIO: quantas das noites registradas entraram na janela. Isso é um
 * comportamento sob controle de quem usa — nunca um veredito sobre a noite.
 *
 * O switch "não quero ver métricas de sono" não é enfeite nem opcional: é a
 * saída para quem a métrica atrapalha. Ele esconde os NÚMEROS e preserva as
 * RECOMPENSAS (`hideMetrics` em restWindow.ts, regra 5) — quem não quer ver
 * medida não deve por isso colecionar menos sonhos.
 */
import {
  restConstancy,
  dreamRarity,
  dexProgress,
  type RestState,
  type RestWindow,
  type DreamRarity,
} from '../utils/restWindow';
import { REST_WINDOW_DAYS } from '../types/taskModel';
import type { Language } from '../utils/i18n';
import { GroupCard, SwitchRow, TimeField, sm2Button, sm2Hint } from './form/FormKit';

/*
 * CANVAS "CONTA" (20/09/2026, `Descanso.dc.html`, D-K1/D-K3): o cartão é o
 * mesmo card SIS-03 da `SettingsPage` (`GroupCard`, Fredoka 20 em caixa de
 * frase — era `PixelPanel` Silkscreen 12 "REST WINDOW"); as horas em `.inp`
 * 44 com `schedule` + mono `tabular-nums`; "5 of 7" em Rubik 500 tabular
 * (`.sm2-conta-count`) + o `.meter` SIS-07 (`.sm2-kit-meter`); a tag de sonho
 * é a `.sm2-kit-tag` 24; o switch é a `SwitchRow` do kit. Nenhum PNG, nenhuma
 * Silkscreen — e nenhuma das quatro proibições acima entrou.
 */

export interface RestWindowCardProps {
  rest: RestState;
  /** Instante de referência. Entra por props — a regra é pura (restWindow.ts). */
  now: Date;
  language: Language;
  onChangeWindow: (window: RestWindow) => void;
  /** WP1.8 — pede a permissão de push AQUI, onde ela faz sentido. Ausente =
   *  o convite não aparece (é o estado de quem já tem push ligado). */
  onEnableReminder?: () => void;
  notificationsEnabled?: boolean;
  /** O corpo da frase que vai chegar — pedir permissão sem dizer o que chega
   *  é pedir um cheque em branco. */
  reminderPreview?: string;
  /** `true` = esconder os números. Preserva os prêmios. */
  onToggleMetrics: (hide: boolean) => void;
}

/**
 * Cor da ETIQUETA de raridade — é TEXTO, então são tokens de TINTA (`*-ink`) e
 * nunca de fill. Os três passam 4,5:1 nos dois temas (`src/styles/tokens.md`).
 */
const RARITY_TONE: Record<DreamRarity, string> = {
  common: 'var(--sm2-muted)',
  rare: 'var(--sm2-primary-ink)',
  legendary: 'var(--sm2-gold-ink)',
};

function rarityLabel(rarity: DreamRarity, isPt: boolean): string {
  if (rarity === 'legendary') return isPt ? 'Lendário' : 'Legendary';
  if (rarity === 'rare') return isPt ? 'Raro' : 'Rare';
  return isPt ? 'Comum' : 'Common';
}

export function RestWindowCard({
  rest, now, language, onChangeWindow, onToggleMetrics,
  onEnableReminder, notificationsEnabled = false, reminderPreview,
}: RestWindowCardProps) {
  const isPt = language === 'pt-BR';
  const hidden = rest.hideMetrics === true;

  const constancy = restConstancy(rest, now);
  const rarity = dreamRarity(rest, now);
  const dex = dexProgress(rest);

  const switchLabel = isPt
    ? 'Não quero ver métricas de sono'
    : "Don't show me sleep metrics";

  return (
    <GroupCard title={isPt ? 'Janela de descanso' : 'Rest window'}>
      <p style={sm2Hint}>
        {isPt
          ? 'Escolha os horários que combinam com a sua vida. A janela é sua — o app não sugere nenhuma.'
          : 'Pick the hours that fit your life. The window is yours — the app suggests none.'}
      </p>

      {/* Os dois campos. Sem "duração", sem "ideal", sem cálculo de horas. O
          nome de cada um vai no `aria-label` (Starts / Ends), como no canvas. */}
      <div className="sm2-conta-times">
        <TimeField
          ariaLabel={isPt ? 'Começa' : 'Starts'}
          value={rest.window.start}
          onChange={(v) => onChangeWindow({ ...rest.window, start: v })}
        />
        <TimeField
          ariaLabel={isPt ? 'Termina' : 'Ends'}
          value={rest.window.end}
          onChange={(v) => onChangeWindow({ ...rest.window, end: v })}
        />
      </div>

      {/* WP1.8 — O MOMENTO-OURO DA PERMISSÃO DE PUSH.
          O pedido de permissão só saía do interruptor geral de notificações,
          em Configurações — longe de qualquer motivo. Aqui a pessoa acabou de
          escolher a hora de deitar: é o único instante em que "posso te
          lembrar disso?" é uma pergunta óbvia em vez de uma interrupção.
          Aparece só para quem NÃO tem push ligado, e o convite mostra a
          própria frase que chegaria — pedir permissão sem dizer o que vai
          chegar é pedir um cheque em branco. Lembrete é convite: `outline`. */}
      {onEnableReminder && !notificationsEnabled && (
        <div>
          <button
            type="button"
            onClick={onEnableReminder}
            style={{ ...sm2Button('outline'), width: '100%' }}
          >
            {isPt ? 'Quero um lembrete de deitar' : 'Remind me to lie down'}
          </button>
          {reminderPreview && (
            <p style={{ ...sm2Hint, marginTop: 6 }}>
              {isPt ? 'Vai chegar assim: ' : 'It will arrive like this: '}
              “{reminderPreview}”
            </p>
          )}
        </div>
      )}

      {/* CONSTÂNCIA DE HORÁRIO — nunca qualidade de sono.
          Média móvel das últimas REST_WINDOW_DAYS manhãs; noite sem registro
          sai do denominador (restConstancy), então nada aqui pode ler como
          falha. Some inteira quando `hideMetrics` está ligado. */}
      {/* `aria-live`: este bloco INTEIRO aparece e some quando o switch lá
          embaixo é ligado. Sem anúncio, quem usa leitor de tela apertava a
          chave e não recebia confirmação nenhuma de que os números tinham
          sumido — e é justamente a pessoa que escolheu não conviver com eles.
          O contêiner vive fora do `&&` de propósito: região viva que só nasce
          junto com o conteúdo não é anunciada por parte dos leitores. */}
      <div aria-live="polite">
      {!hidden && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* O denominador é o de noites REGISTRADAS, nunca `REST_WINDOW_DAYS`
              cru: pintar "0 de 7" numa semana sem registro inventaria sete
              falhas que não existem (restWindow.ts: noite sem registro é
              NEUTRA). Sem registro nenhum, o número simplesmente não aparece —
              e a barra tampouco (nunca "0 of 0"). */}
          {constancy.window > 0 && (
            <>
              <p className="sm2-conta-count" style={{ margin: 0 }}>
                {isPt
                  ? `${constancy.onTime} de ${constancy.window}`
                  : `${constancy.onTime} of ${constancy.window}`}
                {' '}
                <span style={{ fontWeight: 400, color: 'var(--sm2-muted)', fontSize: 'var(--sm2-text-xs)' }}>
                  {isPt
                    ? `noites registradas nos últimos ${REST_WINDOW_DAYS} dias começaram na sua janela`
                    : `logged nights in the last ${REST_WINDOW_DAYS} days started inside your window`}
                </span>
              </p>
              <div
                className="sm2-kit-meter"
                role="img"
                aria-label={isPt
                  ? `Constância de horário: ${constancy.onTime} de ${constancy.window}`
                  : `Bedtime constancy: ${constancy.onTime} of ${constancy.window}`}
              >
                <div className="sm2-kit-meter-fill" style={{ width: `${Math.round(Math.max(0, Math.min(1, constancy.ratio)) * 100)}%` }} />
              </div>
            </>
          )}
          {/* Com noites registradas, a frase "é a constância do HORÁRIO em que
              você deita" repetia palavra por palavra a linha que acompanha o
              número logo acima. Ficou só a metade que a linha de cima NÃO diz —
              e que é a regra de produto desta tela: noite sem registro nunca
              conta contra você. O texto vazio (sem registro nenhum) continua
              inteiro: ali não há linha nenhuma acima para repetir. */}
          <p style={sm2Hint}>
            {constancy.window === 0
              ? (isPt
                ? 'Ainda não há noites registradas. Nenhuma noite conta como falha — as que faltam simplesmente não entram na conta.'
                : 'No nights logged yet. No night ever counts as a miss — the ones missing just stay out of the count.')
              : (isPt
                ? 'Noite sem registro não conta contra você.'
                : 'A night without a log never counts against you.')}
          </p>
        </div>
      )}
      </div>

      {/* RECOMPENSAS — ficam visíveis com o switch ligado (regra 5). */}
      <div className="sm2-conta-dream">
        <span className="sm2-kit-tag" style={{ color: RARITY_TONE[rarity] }}>
          {isPt ? `Sonho ${rarityLabel(rarity, true).toLowerCase()}` : `${rarityLabel(rarity, false)} dream`}
        </span>
        <span className="sm2-num" style={sm2Hint}>
          {isPt ? 'Sonhos na coleção: ' : 'Dreams collected: '}
          <span className="sm2-conta-count" style={{ fontSize: 'var(--sm2-text-xs)' }}>
            {isPt ? `${dex.collected} de ${dex.total}` : `${dex.collected} of ${dex.total}`}
          </span>
        </span>
      </div>

      {/* O switch. Esconde números, mantém prêmios. */}
      <SwitchRow
        checked={hidden}
        onToggle={() => onToggleMetrics(!hidden)}
        label={switchLabel}
        hint={isPt
          ? 'Some com os números. Os sonhos continuam chegando igual.'
          : 'Hides the numbers. Dreams keep arriving all the same.'}
      />
    </GroupCard>
  );
}

export default RestWindowCard;
