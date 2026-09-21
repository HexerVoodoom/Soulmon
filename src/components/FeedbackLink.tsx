import type { CSSProperties } from 'react';
import { ActionRow } from './form/FormKit';
import type { Language } from '../utils/i18n';

/**
 * CANAL DE FEEDBACK IN-APP (QA geral de 21/09/2026, `08-produto-maestro.md`
 * §2.b item 4): o primeiro usuário real precisa de UM lugar para falar com
 * quem faz o app, e antes disto não havia nenhum — nem na tela de erro.
 *
 * É um `mailto:` e não um formulário porque não existe backend de suporte
 * nem caixa para ler: o e-mail chega direto no dono, sem tabela nova, sem
 * política nova. O corpo já vai com a VERSÃO e um trecho curto do `saveId`
 * para que a resposta não comece com "qual versão você está?" — e é só um
 * trecho porque o id inteiro localiza o save de alguém pelo algoritmo público
 * (SHA-256 do e-mail) e não precisa viajar num e-mail.
 */
export const FEEDBACK_EMAIL = 'mateus.sprnd@gmail.com';

/**
 * Versão que a tela mostra ("Soulmon 1.0.2" em Configurações › Ajuda). Mora
 * aqui, e não repetida em cada tela, para que a linha do rodapé e o corpo do
 * e-mail de feedback nunca divirjam (footgun 9).
 */
export const APP_VERSION = '1.0.2';

/** Quantos caracteres do `saveId` vão no e-mail — o suficiente para achar o save
 *  com o dono na frente, e nada mais. */
const SAVE_ID_PREVIEW = 8;

export function feedbackMailto(opts: {
  language: Language;
  saveId?: string | null;
  /** Ajuda o dono a triar: de onde a pessoa escreveu. */
  origin: 'settings' | 'error';
  /** Mensagem do erro (só na tela de erro; nunca stack, que pode conter dado). */
  errorMessage?: string | null;
}): string {
  const isPt = opts.language === 'pt-BR';
  const saveId = (opts.saveId ?? '').slice(0, SAVE_ID_PREVIEW) || (isPt ? 'sem código' : 'no code');
  const linhas = [
    '',
    '',
    '---',
    `${isPt ? 'Versão' : 'Version'}: ${APP_VERSION}`,
    `${isPt ? 'Código' : 'Code'}: ${saveId}`,
    `${isPt ? 'Origem' : 'From'}: ${opts.origin}`,
  ];
  if (opts.errorMessage) linhas.push(`${isPt ? 'Erro' : 'Error'}: ${opts.errorMessage}`);
  const subject = opts.origin === 'error' ? 'Soulmon — erro' : 'Soulmon';
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(linhas.join('\n'))}`;
}

export function feedbackLabel(language: Language): string {
  return language === 'pt-BR' ? 'Falar com quem faz o Soulmon' : 'Talk to the people who make Soulmon';
}

/** A linha de Configurações — o mesmo `ActionRow` das outras linhas do grupo. */
export function FeedbackRow({ language, saveId }: { language: Language; saveId?: string | null }) {
  const isPt = language === 'pt-BR';
  return (
    <ActionRow
      label={feedbackLabel(language)}
      hint={isPt ? 'Abre seu e-mail. A versão do app já vai preenchida.' : 'Opens your email app. The app version is filled in.'}
      href={feedbackMailto({ language, saveId, origin: 'settings' })}
    />
  );
}

/**
 * O link da tela de erro: texto simples, `primary-ink`, alvo de 44px. Não é o
 * `ActionRow` porque ali não existe grupo nem linha — é uma frase abaixo do
 * único botão ("Recarregar"), e um segundo botão competiria com ele.
 */
export function FeedbackLink({ language, saveId, errorMessage, style }: {
  language: Language;
  saveId?: string | null;
  errorMessage?: string | null;
  style?: CSSProperties;
}) {
  return (
    <a
      href={feedbackMailto({ language, saveId, origin: 'error', errorMessage })}
      style={{
        display: 'inline-flex', alignItems: 'center', minHeight: 44, padding: '0 8px',
        fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm)', fontWeight: 500,
        color: 'var(--sm2-primary-ink)', textDecoration: 'underline', textUnderlineOffset: 3,
        ...style,
      }}
    >
      {feedbackLabel(language)}
    </a>
  );
}
