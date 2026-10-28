import type { CSSProperties } from 'react';
import { Capacitor } from '@capacitor/core';
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
 * Versão que a tela mostra ("Soulmon 1.1.4" em Configurações › Ajuda). Vem do
 * `version` do `package.json` via `define` do Vite (`vite.config.ts`) — antes
 * era um literal aqui, e havia TRÊS versões no repositório (design-critic B1,
 * 21/09/2026). `src/deploy/versaoUnica.contract.test.ts` prende o
 * `build.gradle` ao mesmo número. O `typeof` é para o arquivo carregar fora
 * do Vite (ex.: script Node) sem estourar.
 */
export const APP_VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0-dev';

/**
 * Identidade do BUNDLE web (QA rodada 2, skeptic #7): `CACHE_VERSION` do
 * `public/sw.js` + SHA curto do commit quando o CI informa — ver
 * `vite.config.ts` › `__BUILD_ID__`. A versão sozinha não distingue dois
 * deploys no mesmo dia; isto distingue.
 */
export const BUILD_ID: string = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'dev';

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
    `Build: ${BUILD_ID}`,
    `${isPt ? 'Código' : 'Code'}: ${saveId}`,
    `${isPt ? 'Origem' : 'From'}: ${originLabel(opts.origin, isPt)}`,
  ];
  if (opts.errorMessage) linhas.push(`${isPt ? 'Erro' : 'Error'}: ${opts.errorMessage}`);
  // A6 (QA rodada 2): o assunto era 'Soulmon — erro' para quem lê em inglês.
  const subject = opts.origin === 'error' ? (isPt ? 'Soulmon — erro' : 'Soulmon — error') : 'Soulmon';
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(linhas.join('\n'))}`;
}

/** "Origem: settings" era inglês no meio de um e-mail em PT (design B4). */
function originLabel(origin: 'settings' | 'error', isPt: boolean): string {
  if (origin === 'error') return isPt ? 'tela de erro' : 'error screen';
  return isPt ? 'configurações' : 'settings';
}

export function feedbackLabel(language: Language): string {
  return language === 'pt-BR' ? 'Falar com quem faz o Soulmon' : 'Talk to the people who make Soulmon';
}

/**
 * REPORTAR BUG (28/10/2026): o MESMO mecanismo do feedback (`mailto:` para o
 * dono, sem backend, sem tabela nova), com assunto próprio "[Soulmon bug]" para
 * triar à parte. O corpo traz um espaço para a pessoa descrever e, abaixo da
 * linha, diagnóstico NÃO pessoal: versão, build, plataforma, idioma, user agent,
 * tela atual e horário. Nunca vai conteúdo do save, e-mail ou id — nem o trecho
 * do `saveId` que o feedback leva.
 */
export function bugMailto(opts: {
  language: Language;
  /** Tela de onde a pessoa reportou. */
  view?: string;
  now?: Date;
  platform?: string;
  userAgent?: string;
}): string {
  const isPt = opts.language === 'pt-BR';
  const platform = opts.platform ?? Capacitor.getPlatform();
  const ua = opts.userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  const plat = platform === 'android' ? 'Android' : platform === 'ios' ? 'iOS' : 'web';
  const linhas = [
    isPt ? 'O que aconteceu? (o que você fez, o que esperava, o que viu)' : 'What happened? (what you did, what you expected, what you saw)',
    '',
    '',
    `--- ${isPt ? 'diagnóstico automático (sem dados pessoais)' : 'automatic diagnostics (no personal data)'} ---`,
    `${isPt ? 'Versão' : 'Version'}: ${APP_VERSION}`,
    `Build: ${BUILD_ID}`,
    `${isPt ? 'Plataforma' : 'Platform'}: ${plat}`,
    `${isPt ? 'Idioma' : 'Language'}: ${opts.language}`,
    `${isPt ? 'Tela' : 'View'}: ${opts.view ?? 'settings'}`,
    `User agent: ${ua}`,
    `${isPt ? 'Horário' : 'Time'}: ${(opts.now ?? new Date()).toISOString()}`,
  ];
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent('[Soulmon bug]')}&body=${encodeURIComponent(linhas.join('\n'))}`;
}

export function bugLabel(language: Language): string {
  return language === 'pt-BR' ? 'Reportar bug' : 'Report a bug';
}

/** A linha logo ABAIXO do feedback — mesmo `ActionRow`, mesma largura e espaçamento. */
export function BugReportRow({ language, view }: { language: Language; view?: string }) {
  const isPt = language === 'pt-BR';
  return (
    <ActionRow
      label={bugLabel(language)}
      hint={isPt ? 'Abre seu e-mail com um diagnóstico sem dados pessoais (versão, aparelho, tela).' : 'Opens your email app with diagnostics that contain no personal data (version, device, screen).'}
      href={bugMailto({ language, view })}
    />
  );
}

/** A linha de Configurações — o mesmo `ActionRow` das outras linhas do grupo. */
export function FeedbackRow({ language, saveId }: { language: Language; saveId?: string | null }) {
  const isPt = language === 'pt-BR';
  return (
    <ActionRow
      label={feedbackLabel(language)}
      hint={isPt ? `Abre seu e-mail para ${FEEDBACK_EMAIL}. A versão do app já vai preenchida.` : `Opens your email app to ${FEEDBACK_EMAIL}. The app version is filled in.`}
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
