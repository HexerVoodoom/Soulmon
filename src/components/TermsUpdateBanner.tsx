import { sm2Button } from './form/FormKit';
import type { Language } from '../utils/i18n';

/**
 * BANNER "OS TERMOS MUDARAM" (decisão #24 do QA geral, 21/09/2026).
 *
 * Entra na fila de avisos da Home (`App.tsx`, slot único — `filaDeAvisos.
 * contract.test.ts`), com a mesma casca `.sm2-notice` do recomeço: um cartão
 * discreto, sem moldura de alerta, que a lista inteira continua viva por
 * baixo. Não bloqueia, não pede re-aceite — a regra e o porquê estão em
 * `utils/termsNotice.ts`, que decide QUANDO; aqui só se desenha.
 *
 * "Ler" são dois links (Termos e Privacidade), em aba nova, para que o
 * banner continue na tela quando a pessoa voltar. "Ok" grava a marca e o
 * cartão some — o dono da gravação é o App, por `onOk`.
 */
export function TermsUpdateBanner({ language, onOk }: { language: Language; onOk: () => void }) {
  const isPt = language === 'pt-BR';
  const link = { ...sm2Button('outline', false, 'sm'), textDecoration: 'none' } as const;
  return (
    <div className="sm2-notice" role="status">
      <p className="sm2-notice-title">
        {isPt ? 'Os Termos e a Política de Privacidade mudaram' : 'The Terms and the Privacy Policy changed'}
      </p>
      <p className="sm2-notice-body">
        {isPt
          ? 'Nada muda no seu jogo. Se quiser ler o que foi atualizado, está aqui.'
          : 'Nothing changes in your game. If you want to read what was updated, it is here.'}
      </p>
      <div className="sm2-notice-actions">
        <a href="/termos.html" target="_blank" rel="noopener noreferrer" style={link}>
          {isPt ? 'Ler os Termos' : 'Read the Terms'}
        </a>
        <a href="/privacidade.html" target="_blank" rel="noopener noreferrer" style={link}>
          {isPt ? 'Ler a Política' : 'Read the Policy'}
        </a>
        <button type="button" onClick={onOk} style={sm2Button('quiet', false, 'sm')}>
          Ok
        </button>
      </div>
    </div>
  );
}
