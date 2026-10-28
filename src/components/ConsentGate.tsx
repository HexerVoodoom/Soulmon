import { useId, useState } from 'react';
import { sm2Button } from './form/FormKit';
import type { Language } from '../utils/i18n';

/**
 * REACEITE DOS TERMOS (QA-13, decisão do dono de 28/10/2026 — REGISTRO §184).
 *
 * Tela BLOQUEANTE para quem já passou do onboarding mas não tem o consentimento da versão ATUAL dos
 * documentos (`isConsentCurrent`): save antigo sem registro, ou aceite de uma versão anterior. Substitui o
 * banner informativo da decisão #24 (que não pedia aceite). A pessoa lê (links em aba nova), marca a caixa e
 * confirma; quem grava `buildConsentRecord()` é o App — aqui só se desenha. Sem a caixa o botão não liga.
 */
const HREF = {
  terms: { 'pt-BR': '/termos.html#pt', 'en-US': '/termos.html' },
  privacy: { 'pt-BR': '/privacidade.html#pt', 'en-US': '/privacidade.html' },
} as const;

export function ConsentGate({ language, onAccept }: { language: Language; onAccept: () => void }) {
  const isPt = language === 'pt-BR';
  const lang: 'pt-BR' | 'en-US' = isPt ? 'pt-BR' : 'en-US';
  const [checked, setChecked] = useState(false);
  const titleId = useId();
  const boxId = useId();
  const link = { ...sm2Button('outline', false, 'sm'), textDecoration: 'none' } as const;
  const novaAba = isPt ? '(abre em nova aba)' : '(opens in a new tab)';
  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby={titleId} data-consent-gate
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, backgroundColor: 'var(--sm2-bg)', overflowY: 'auto',
      }}
    >
      <div className="sm2-notice" style={{ maxWidth: 420, width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p className="sm2-notice-title" id={titleId}>
          {isPt ? 'Os Termos e a Política de Privacidade foram atualizados' : 'The Terms and the Privacy Policy were updated'}
        </p>
        <p className="sm2-notice-body">
          {isPt
            ? 'Para continuar, leia e aceite as versões atuais. Seus dados e seu Soulmon continuam intactos.'
            : 'To continue, please read and accept the current versions. Your data and your Soulmon stay intact.'}
        </p>
        <div className="sm2-notice-actions">
          <a href={HREF.terms[lang]} target="_blank" rel="noopener noreferrer" style={link}
            aria-label={`${isPt ? 'Ler os Termos' : 'Read the Terms'} ${novaAba}`}>{isPt ? 'Ler os Termos' : 'Read the Terms'}</a>
          <a href={HREF.privacy[lang]} target="_blank" rel="noopener noreferrer" style={link}
            aria-label={`${isPt ? 'Ler a Política' : 'Read the Policy'} ${novaAba}`}>{isPt ? 'Ler a Política' : 'Read the Policy'}</a>
        </div>
        <label htmlFor={boxId} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', minHeight: 44 }}>
          <input id={boxId} type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} style={{ width: 24, height: 24, flex: 'none' }} />
          <span className="sm2-notice-body">
            {isPt ? 'Li e aceito os Termos de Uso e a Política de Privacidade.' : 'I have read and accept the Terms of Use and the Privacy Policy.'}
          </span>
        </label>
        <button type="button" disabled={!checked} onClick={onAccept} style={sm2Button('primary', !checked)}>
          {isPt ? 'Aceitar e continuar' : 'Accept and continue'}
        </button>
      </div>
    </div>
  );
}
