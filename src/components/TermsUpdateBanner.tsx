import { useId } from 'react';
import { sm2Button } from './form/FormKit';
import type { Language } from '../utils/i18n';
import type { DocMudado } from '../utils/termsNotice';

/**
 * BANNER "OS TERMOS MUDARAM" (decisão #24 do QA geral, 21/09/2026).
 *
 * Entra na fila de avisos da Home (`App.tsx`, slot único — `filaDeAvisos.
 * contract.test.ts`), com a mesma casca `.sm2-notice` do recomeço: um cartão
 * discreto, sem moldura de alerta, que a lista inteira continua viva por
 * baixo. Não bloqueia, não pede re-aceite — a regra e o porquê estão em
 * `utils/termsNotice.ts`, que decide QUANDO e QUAL (`qualDocMudou`); aqui só
 * se desenha.
 *
 * `changed` escolhe o título e os links: afirmar "os Termos e a Política
 * mudaram" quando só um mudou era mentira de interface (design-critic A1).
 * O link abre em aba nova (o banner segue na tela quando a pessoa volta) e
 * DIZ isso no nome acessível (A3). É `region` com rótulo, não `status`:
 * `status` é para texto que muda sozinho, e este cartão tem controles (A4).
 * Em EN o link aponta para a âncora `#en` dos documentos (A5).
 */
const HREF = {
  terms: { 'pt-BR': '/termos.html', 'en-US': '/termos.html#en' },
  privacy: { 'pt-BR': '/privacidade.html', 'en-US': '/privacidade.html#en' },
} as const;

const TITULO: Record<DocMudado, { pt: string; en: string }> = {
  terms: { pt: 'Os Termos de Uso mudaram', en: 'The Terms of Use changed' },
  privacy: { pt: 'A Política de Privacidade mudou', en: 'The Privacy Policy changed' },
  both: { pt: 'Os Termos e a Política de Privacidade mudaram', en: 'The Terms and the Privacy Policy changed' },
};

export function TermsUpdateBanner({ language, changed = 'both', onOk }: { language: Language; changed?: DocMudado; onOk: () => void }) {
  const isPt = language === 'pt-BR';
  const lang: 'pt-BR' | 'en-US' = isPt ? 'pt-BR' : 'en-US';
  const link = { ...sm2Button('outline', false, 'sm'), textDecoration: 'none' } as const;
  const novaAba = isPt ? '(abre em nova aba)' : '(opens in a new tab)';
  const titleId = useId();
  const showTerms = changed !== 'privacy';
  const showPrivacy = changed !== 'terms';
  const lerTermos = isPt ? 'Ler os Termos' : 'Read the Terms';
  const lerPolitica = isPt ? 'Ler a Política' : 'Read the Policy';
  return (
    <div className="sm2-notice" role="region" aria-labelledby={titleId}>
      <p className="sm2-notice-title" id={titleId}>
        {isPt ? TITULO[changed].pt : TITULO[changed].en}
      </p>
      <p className="sm2-notice-body">
        {isPt
          ? 'Você continua jogando normalmente. Se quiser ler o que mudou, está aqui.'
          : 'You keep playing as usual. If you want to read what changed, it is here.'}
      </p>
      <div className="sm2-notice-actions">
        {showTerms && (
          <a href={HREF.terms[lang]} target="_blank" rel="noopener noreferrer" style={link} aria-label={`${lerTermos} ${novaAba}`}>
            {lerTermos}
          </a>
        )}
        {showPrivacy && (
          <a href={HREF.privacy[lang]} target="_blank" rel="noopener noreferrer" style={link} aria-label={`${lerPolitica} ${novaAba}`}>
            {lerPolitica}
          </a>
        )}
        <button type="button" onClick={onOk} style={sm2Button('quiet', false, 'sm')}>
          {isPt ? 'Entendi' : 'Got it'}
        </button>
      </div>
    </div>
  );
}
