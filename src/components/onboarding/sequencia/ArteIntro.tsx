import type { CSSProperties } from 'react';
import type { Language } from '../../../utils/i18n';
import { ASSETS, urlDoAsset, type AssetKey } from './assets';
import { t, UI } from './copy';

const imgBase: CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' };
const placeholder: CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
  border: '1px dashed #5b6b70', background: 'rgba(40,60,66,.35)', color: '#9fb2b7', fontSize: 'var(--sm2-text-xs)', textAlign: 'center',
};

/** Arte da intro. Arte ausente = silhueta nomeada com o arquivo esperado (nunca trava, nunca some em silêncio). */
export function ArteIntro({ k, language, extra, contain }: { k: AssetKey; language: Language; extra?: CSSProperties; contain?: boolean }) {
  const url = urlDoAsset(k);
  if (url) return <img src={url} alt="" draggable={false} style={{ ...imgBase, ...(contain ? { objectFit: 'contain' } : {}), ...extra }} />;
  return (
    <div style={{ ...placeholder, ...extra }} data-asset={k} role="img" aria-label={ASSETS[k].arquivo}>
      <span>{ASSETS[k].arquivo}</span>
      <small>{t(UI.semArte, language)}</small>
    </div>
  );
}
