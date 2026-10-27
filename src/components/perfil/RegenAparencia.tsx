import type { CSSProperties } from 'react';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { sheetCard, sheetCardTitle } from '../nav/sheetKit';
import { isSafeSpriteSrc } from '../../utils/spriteLibrary';
import { SPRITE_REGEN_COST_CREDITS } from '../../utils/spriteRegen';
import type { RegenAparencia as RegenState, RegenNotice } from '../../hooks/useRegenAparencia';
import type { Language } from '../../utils/i18n';

/**
 * "GERAR DE NOVO" A APARÊNCIA (Laboratório › Centro de Evolução; nasceu no Perfil na rodada 5, Lane B, e mudou para cá em 27/10/2026, pedido do dono; REGISTRO §34b).
 *
 * Um sorteio PAGO da imagem da forma atual, com o mesmo prompt: 50 Créditos, 1 por forma por mês, só conta paga. A cópia diz a verdade antes do
 * toque (é um novo sorteio, sem garantia de resultado; cobra antes; devolve se não sair) e depois dele (a nova aparece ao lado da atual e a
 * pessoa escolhe). Voz de produto, sem cobrança nem culpa (`docs/NARRATIVA-E-UNIVERSO.md`): a frase nunca tem a pessoa como sujeito de um
 * veredito, e "manter a atual" é uma saída tão boa quanto a outra. Inglês primeiro, português ao lado.
 */

export interface RegenAparenciaProps {
  language: Language;
  state: RegenState;
  /** A aparência atual e a nova (só para a escolha). */
  currentUrl?: string;
  newUrl?: string;
}

const T = {
  title: { en: 'Draw this look again', pt: 'Gerar a aparência de novo' },
  intro: {
    en: 'A new drawing of this form, from the same prompt. It is a fresh draw, so the result is not guaranteed to be better or even similar.',
    pt: 'Um novo desenho desta forma, a partir do mesmo prompt. É um novo sorteio: o resultado não tem garantia de ser melhor, nem parecido.',
  },
  rules: {
    en: `${SPRITE_REGEN_COST_CREDITS} Credits, charged up front and returned automatically if the drawing doesn't come out. One per form each month.`,
    pt: `${SPRITE_REGEN_COST_CREDITS} Créditos, cobrados antes e devolvidos sozinhos se o desenho não sair. Um por forma a cada mês.`,
  },
  cta: { en: 'Generate again', pt: 'Gerar de novo' },
  ctaNoCredits: { en: 'Get Credits', pt: 'Ver os Créditos' },
  confirmAsk: {
    en: `Draw again for ${SPRITE_REGEN_COST_CREDITS} Credits? You will see the new one next to the current one and choose.`,
    pt: `Gerar de novo por ${SPRITE_REGEN_COST_CREDITS} Créditos? A nova aparece ao lado da atual e você escolhe.`,
  },
  confirmYes: { en: `Draw again (${SPRITE_REGEN_COST_CREDITS} Credits)`, pt: `Gerar (${SPRITE_REGEN_COST_CREDITS} Créditos)` },
  confirmNo: { en: 'Not now', pt: 'Agora não' },
  working: { en: 'Drawing… this can take a minute.', pt: 'Desenhando… pode levar um minuto.' },
  monthUsed: { en: 'This form already had its new draw this month. It opens again next month.', pt: 'Esta forma já teve o novo desenho deste mês. Ela abre de novo no mês que vem.' },
  busy: { en: 'A drawing is on its way. Check back in a moment.', pt: 'Um desenho está a caminho. Volte em um instante.' },
  chooseTitle: { en: 'Which one stays?', pt: 'Qual fica?' },
  chooseHint: {
    en: 'Keep the current one or use the new one. Only the previous version is kept. If you choose nothing, the new one is used from tomorrow.',
    pt: 'Mantenha a atual ou use a nova. Só a versão anterior fica guardada. Se não escolher, a nova passa a valer a partir de amanhã.',
  },
  current: { en: 'Current', pt: 'Atual' },
  fresh: { en: 'New', pt: 'Nova' },
  keep: { en: 'Keep current', pt: 'Manter a atual' },
  use: { en: 'Use the new one', pt: 'Usar a nova' },
} as const;

function noticeText(n: RegenNotice, isPt: boolean): string {
  const L = (x: { en: string; pt: string }) => (isPt ? x.pt : x.en);
  switch (n.why) {
    case 'month-used': return L(T.monthUsed);
    case 'busy': return L(T.busy);
    case 'no-credits': return isPt ? `Faltam Créditos: são ${SPRITE_REGEN_COST_CREDITS} para gerar de novo.` : `You need ${SPRITE_REGEN_COST_CREDITS} Credits to draw again.`;
    case 'not-paid': return isPt ? 'Gerar de novo faz parte da conta completa.' : 'Drawing again is part of the full account.';
    case 'no-first': return isPt ? 'O primeiro desenho desta forma vem antes: ele é gratuito e acontece sozinho.' : 'The first drawing of this form comes first: it is free and happens on its own.';
    case 'unavailable': return isPt ? 'Gerar de novo está descansando por agora. Nada foi cobrado.' : 'Drawing again is resting for now. Nothing was charged.';
    case 'failed':
    case 'offline':
      if (n.refunded === true) return isPt ? `O desenho não saiu desta vez. Seus ${SPRITE_REGEN_COST_CREDITS} Créditos estão de volta.` : `The drawing didn't come out this time. Your ${SPRITE_REGEN_COST_CREDITS} Credits are back.`;
      return isPt
        ? 'O desenho não saiu desta vez. Se algo foi cobrado, volta sozinho: confira o saldo de Créditos em instantes.'
        : "The drawing didn't come out this time. If anything was charged it comes back on its own: check your Credits balance in a moment.";
  }
}

const pairStyle: CSSProperties = { display: 'flex', gap: 12 };
const figStyle: CSSProperties = { flex: 1, minWidth: 0, margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 };
const imgStyle: CSSProperties = { width: '100%', maxWidth: 140, aspectRatio: '1 / 1', objectFit: 'contain', imageRendering: 'pixelated', borderRadius: 'var(--sm2-radius-md)', backgroundColor: 'var(--sm2-surface)', border: '1px solid var(--sm2-line)' };
const btnRow: CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' };

export function RegenAparencia({ language, state, currentUrl, newUrl }: RegenAparenciaProps) {
  const isPt = language === 'pt-BR';
  const L = (x: { en: string; pt: string }) => (isPt ? x.pt : x.en);
  const { availability: av } = state;
  if (av === 'hidden') return null;

  if (av === 'choosing') {
    return (
      <div style={sheetCard} data-regen="choosing">
        <p style={sheetCardTitle}>{L(T.chooseTitle)}</p>
        <div style={pairStyle}>
          {([[T.current, currentUrl], [T.fresh, newUrl]] as const).map(([label, url]) => (
            <figure key={label.en} style={figStyle}>
              {isSafeSpriteSrc(url) ? <img src={url} alt={L(label)} style={imgStyle} /> : <div style={imgStyle} aria-hidden />}
              <figcaption style={{ ...sm2Hint, margin: 0 }}>{L(label)}</figcaption>
            </figure>
          ))}
        </div>
        <p style={{ ...sm2Hint, margin: 0 }}>{L(T.chooseHint)}</p>
        <div style={btnRow}>
          <button type="button" data-regen-keep style={{ ...sm2Button('outline'), flex: 1 }} onClick={state.keepCurrent}>{L(T.keep)}</button>
          <button type="button" data-regen-use style={{ ...sm2Button('primary'), flex: 1 }} onClick={state.useNew}>{L(T.use)}</button>
        </div>
      </div>
    );
  }

  const travado = av === 'month-used' || av === 'busy' || state.working;
  return (
    <div style={sheetCard} data-regen={av}>
      <p style={sheetCardTitle}>{L(T.title)}</p>
      <p style={{ ...sm2Text, margin: 0 }}>{L(T.intro)}</p>
      <p style={{ ...sm2Hint, margin: 0 }}>{L(T.rules)}</p>
      {state.working && <p role="status" style={{ ...sm2Hint, margin: 0 }}>{L(T.working)}</p>}
      {!state.working && av === 'month-used' && <p style={{ ...sm2Hint, margin: 0 }}>{L(T.monthUsed)}</p>}
      {!state.working && av === 'busy' && <p style={{ ...sm2Hint, margin: 0 }}>{L(T.busy)}</p>}
      {state.notice && !state.working && <p role="status" data-regen-notice style={{ ...sm2Hint, margin: 0 }}>{noticeText(state.notice, isPt)}</p>}
      {state.confirming ? (
        <>
          <p style={{ ...sm2Text, margin: 0 }}>{L(T.confirmAsk)}</p>
          <div style={btnRow}>
            <button type="button" data-regen-no style={{ ...sm2Button('quiet'), flex: 1 }} onClick={state.cancel}>{L(T.confirmNo)}</button>
            <button type="button" data-regen-yes style={{ ...sm2Button('primary'), flex: 1 }} onClick={state.confirm}>{L(T.confirmYes)}</button>
          </div>
        </>
      ) : (
        <button
          type="button"
          data-regen-ask
          disabled={travado}
          style={{ ...sm2Button(av === 'no-credits' ? 'outline' : 'primary', travado), width: '100%' }}
          onClick={state.ask}
        >
          {av === 'no-credits' ? L(T.ctaNoCredits) : `${L(T.cta)} · ${SPRITE_REGEN_COST_CREDITS} ${isPt ? 'Créditos' : 'Credits'}`}
        </button>
      )}
    </div>
  );
}
