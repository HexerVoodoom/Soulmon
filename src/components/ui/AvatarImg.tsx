import { useEffect, useState } from 'react';
import { defaultAvatarId } from '../../utils/avatar';

/**
 * A imagem do avatar, CARREGADA SOB DEMANDA. As miniaturas (`assets/avatares/<id>.webp`, 128 px) entram por
 * `import.meta.glob` preguiçoso: cada uma vira um mini-chunk que só baixa quando o id é pedido, então nenhuma
 * entra no bundle de entrada. Este módulo só é puxado por `React.lazy` (`UserAvatar`) pelo mesmo motivo.
 * Id fora do catálogo cai no padrão do mesmo id (determinístico), nunca em imagem quebrada.
 */
const LOADERS = import.meta.glob<string>('../../assets/avatares/*.webp', { import: 'default' });
const keyOf = (id: string) => `../../assets/avatares/${id}.webp`;
const cache = new Map<string, string>();

export function AvatarImg({ id, size, alt }: { id: string; size: number; alt: string }) {
  const real = keyOf(id) in LOADERS ? id : defaultAvatarId(id);
  const [url, setUrl] = useState<string | null>(cache.get(real) ?? null);
  useEffect(() => {
    let vivo = true;
    const hit = cache.get(real);
    if (hit) { setUrl(hit); return; }
    const load = LOADERS[keyOf(real)];
    if (!load) return;
    load().then(u => { cache.set(real, u); if (vivo) setUrl(u); }).catch(() => {});
    return () => { vivo = false; };
  }, [real]);
  return url
    ? <img src={url} alt={alt} width={size} height={size} draggable={false} style={{ width: size, height: size, objectFit: 'cover', display: 'block' }} />
    : <span role="img" aria-label={alt} style={{ width: size, height: size, display: 'block', background: 'var(--sm2-surface-2)' }} />;
}

/** Todos os ids com miniatura (a grade do seletor lê isto; o catálogo com nomes é `catalogo.json`). */
export const AVATAR_THUMB_IDS = Object.keys(LOADERS).map(k => k.slice(keyOf('').length, -'.webp'.length));
