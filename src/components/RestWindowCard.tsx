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
import { useId, type CSSProperties } from 'react';
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
import { PixelPanel, PixelMeter, PixelSwitch, PixelTag } from './pixel/PixelKit';

export interface RestWindowCardProps {
  rest: RestState;
  /** Instante de referência. Entra por props — a regra é pura (restWindow.ts). */
  now: Date;
  language: Language;
  onChangeWindow: (window: RestWindow) => void;
  /** `true` = esconder os números. Preserva os prêmios. */
  onToggleMetrics: (hide: boolean) => void;
}

const RARITY_TONE: Record<DreamRarity, string> = {
  common: 'var(--sm-muted)',
  rare: 'var(--sm-px-cyan)',
  legendary: 'var(--sm-px-copper)',
};

function rarityLabel(rarity: DreamRarity, isPt: boolean): string {
  if (rarity === 'legendary') return isPt ? 'Lendário' : 'Legendary';
  if (rarity === 'rare') return isPt ? 'Raro' : 'Rare';
  return isPt ? 'Comum' : 'Common';
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '0.7rem',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--sm-muted)',
  marginBottom: 4,
};

const timeInputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  minHeight: 44,
  padding: '8px 10px',
  fontSize: '1rem',
  fontWeight: 700,
  color: 'var(--sm-ink)',
  background: 'var(--sm-bg)',
  border: '2px solid color-mix(in srgb, var(--sm-px-copper) 60%, transparent)',
  borderRadius: 0,
};

export function RestWindowCard({
  rest, now, language, onChangeWindow, onToggleMetrics,
}: RestWindowCardProps) {
  const isPt = language === 'pt-BR';
  const hidden = rest.hideMetrics === true;

  const constancy = restConstancy(rest, now);
  const rarity = dreamRarity(rest, now);
  const dex = dexProgress(rest);

  const startId = useId();
  const endId = useId();
  const switchLabel = isPt
    ? 'Não quero ver métricas de sono'
    : "Don't show me sleep metrics";

  return (
    <PixelPanel title={isPt ? 'JANELA DE DESCANSO' : 'REST WINDOW'}>
      <p style={{ fontSize: '0.78rem', color: 'var(--sm-muted)', lineHeight: 1.45, margin: '0 0 12px' }}>
        {isPt
          ? 'Escolha os horários que combinam com a sua vida. A janela é sua — o app não sugere nenhuma.'
          : 'Pick the hours that fit your life. The window is yours — the app suggests none.'}
      </p>

      {/* Os dois campos. Sem "duração", sem "ideal", sem cálculo de horas. */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <label htmlFor={startId} style={labelStyle}>
            {isPt ? 'Começa' : 'Starts'}
          </label>
          <input
            id={startId}
            type="time"
            value={rest.window.start}
            onChange={(e) => onChangeWindow({ ...rest.window, start: e.target.value })}
            style={timeInputStyle}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <label htmlFor={endId} style={labelStyle}>
            {isPt ? 'Termina' : 'Ends'}
          </label>
          <input
            id={endId}
            type="time"
            value={rest.window.end}
            onChange={(e) => onChangeWindow({ ...rest.window, end: e.target.value })}
            style={timeInputStyle}
          />
        </div>
      </div>

      {/* CONSTÂNCIA DE HORÁRIO — nunca qualidade de sono.
          Média móvel das últimas REST_WINDOW_DAYS manhãs; noite sem registro
          sai do denominador (restConstancy), então nada aqui pode ler como
          falha. Some inteira quando `hideMetrics` está ligado. */}
      {!hidden && (
        <div style={{ marginBottom: 14 }}>
          {/* O denominador é o de noites REGISTRADAS, nunca `REST_WINDOW_DAYS`
              cru: pintar "0 de 7" numa semana sem registro inventaria sete
              falhas que não existem (restWindow.ts: noite sem registro é
              NEUTRA). Sem registro nenhum, o número simplesmente não aparece. */}
          {constancy.window > 0 && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--sm-ink)' }}>
                {isPt
                  ? `${constancy.onTime} de ${constancy.window}`
                  : `${constancy.onTime} of ${constancy.window}`}
              </span>
              <span style={{ fontSize: '0.76rem', color: 'var(--sm-muted)' }}>
                {isPt
                  ? `noites registradas nos últimos ${REST_WINDOW_DAYS} dias começaram na sua janela`
                  : `logged nights in the last ${REST_WINDOW_DAYS} days started inside your window`}
              </span>
            </div>
          )}
          <PixelMeter
            ratio={constancy.ratio}
            tone="cyan"
            label={isPt ? 'Constância de horário' : 'Bedtime constancy'}
          />
          <p style={{ fontSize: '0.72rem', color: 'var(--sm-muted)', lineHeight: 1.45, margin: '6px 0 0' }}>
            {constancy.window === 0
              ? (isPt
                ? 'Ainda não há noites registradas. Nenhuma noite conta como falha — as que faltam simplesmente não entram na conta.'
                : 'No nights logged yet. No night ever counts as a miss — the ones missing just stay out of the count.')
              : (isPt
                ? 'É a constância do HORÁRIO em que você deita, não uma medida do seu sono. Noite sem registro não conta contra você.'
                : "It's the constancy of the TIME you go to bed, not a measure of your sleep. A night without a log never counts against you.")}
          </p>
        </div>
      )}

      {/* RECOMPENSAS — ficam visíveis com o switch ligado (regra 5). */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <PixelTag style={{ color: RARITY_TONE[rarity] }}>
          {isPt ? `Sonho ${rarityLabel(rarity, true).toLowerCase()}` : `${rarityLabel(rarity, false)} dream`}
        </PixelTag>
        <span style={{ fontSize: '0.76rem', color: 'var(--sm-muted)' }}>
          {isPt
            ? `Sonhos na coleção: ${dex.collected} de ${dex.total}`
            : `Dreams collected: ${dex.collected} of ${dex.total}`}
        </span>
      </div>

      {/* O switch. Esconde números, mantém prêmios. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <PixelSwitch
          checked={hidden}
          onToggle={() => onToggleMetrics(!hidden)}
          ariaLabel={switchLabel}
        />
        <span style={{ flex: 1, fontSize: '0.8rem', color: 'var(--sm-ink)', lineHeight: 1.35 }}>
          {switchLabel}
          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--sm-muted)' }}>
            {isPt
              ? 'Some com os números. Os sonhos continuam chegando igual.'
              : 'Hides the numbers. Dreams keep arriving all the same.'}
          </span>
        </span>
      </div>
    </PixelPanel>
  );
}

export default RestWindowCard;
