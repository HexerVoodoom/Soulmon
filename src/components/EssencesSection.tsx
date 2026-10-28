import { useState } from 'react';
import { elementIcon } from '../utils/elementIconArt';
import { nightmareIcon } from '../utils/nightmareElement';
import { essenceName } from '../utils/essences';

/**
 * ESSÊNCIAS (Laboratório > Arquivo, logo abaixo da coleção de Sonhos; 28/10/2026, REGISTRO §183). Só as com quantidade > 0.
 * Cada uma é o ÍCONE DO PRÓPRIO ELEMENTO (sem arte nova, nunca dentro de caixa) + a quantidade; tocar mostra o nome (EN/PT).
 * Só coleta: não há uso ainda. Sem nenhuma, a seção nem aparece.
 */
export function EssencesSection({ essences, language = 'en-US' }: { essences: Record<string, number> | undefined; language?: string }) {
  const isPt = language === 'pt-BR';
  const [openId, setOpenId] = useState<string | null>(null);
  const list = Object.entries(essences ?? {}).filter(([, n]) => n > 0);
  if (list.length === 0) return null;
  return (
    <section data-essences aria-label={isPt ? 'Essências' : 'Essences'}>
      <p className="sm2-lib-s" style={{ margin: '0 0 8px' }}>{isPt ? 'Essências' : 'Essences'}</p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {list.map(([id, n]) => {
          const icon = id === 'pesadelo' ? nightmareIcon() : elementIcon(id);
          const name = essenceName(id, isPt);
          return (
            <li key={id} data-essence={id}>
              <button type="button" aria-label={`${name}: ${n}`} aria-pressed={openId === id} onClick={() => setOpenId(openId === id ? null : id)}
                style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 32, minWidth: 32 }}>
                {!icon && <span className="sm2-lib-s">{name}</span>}
                {icon && <img src={icon} alt="" aria-hidden="true" width={24} height={24} draggable={false} style={{ width: 24, height: 24, imageRendering: 'pixelated' }} />}
                <span className="sm2-num">{n}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {openId && <p role="status" data-essence-tip className="sm2-lib-s" style={{ margin: '8px 0 0', color: 'var(--sm2-ink)' }}>{essenceName(openId, isPt)}</p>}
    </section>
  );
}
