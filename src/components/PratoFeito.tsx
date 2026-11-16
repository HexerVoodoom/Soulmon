import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CtaButton } from './ui/CtaButton';
import { useBackLayer } from '../utils/backStack';
import { dishArt } from '../utils/dishArt';
import { dishById } from '../utils/restaurantMenu';
import { effectText } from '../utils/restaurantCopy';
import type { Language } from '../utils/i18n';

/**
 * "Prato feito" (16/11/2026, pedido do dono): o MESMO molde visual de `PocaoCriada` (véu escuro, luz girando, ícone grande, texto e
 * OK, sem caixa; classes `sm2-potion-*`). Confirma que o prato foi feito e guardado na pastinha — NÃO foi usado. Vários pratos feitos
 * seguidos NÃO empilham: o modal agrupa ("Salada Viva ×2") e mostra quantos há na pastinha. `aria-modal`: conta em `modalDepth`
 * e o voltar fecha. Nasce de gesto do jogador (como a poção criada): não entra na `presentationQueue`.
 */
export function PratoFeito({ language, dishId, made, inFolder, onClose }: { language: Language; dishId: string; made: number; inFolder: number; onClose: () => void }) {
  const isPt = language === 'pt-BR';
  const ok = useRef<HTMLButtonElement>(null);
  useBackLayer(true, onClose);
  useEffect(() => { ok.current?.focus(); }, []);
  const d = dishById(dishId);
  if (!d) return null;
  const name = isPt ? d.namePt : d.nameEn;
  const art = dishArt(d.id);
  const times = made > 1 ? ` ×${made}` : '';
  const texto = `${isPt ? 'Feito!' : 'Done!'} ${name}${times}`;
  const guardado = isPt ? `Guardado na pastinha · você tem ${inFolder}` : `Stored in the Items folder · you have ${inFolder}`;
  const node = (
    <div role="dialog" aria-modal="true" aria-label={texto} data-prato-feito className="sm2-potion-made"
      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}>
      <div className="sm2-potion-stage" aria-hidden="true">
        <div className="sm2-potion-rays" data-potion-rays />
        {art
          ? <img src={art} alt="" width={160} height={160} draggable={false} data-prato-art className="sm2-potion-icon" style={{ imageRendering: 'pixelated' }} />
          : <span className="sm2-potion-icon" data-prato-art style={{ fontSize: 120, lineHeight: 1 }}>{d.icon}</span>}
      </div>
      <p role="status" data-prato-texto className="sm2-potion-text">{texto}</p>
      <p data-prato-guardado className="sm2-potion-text" style={{ fontSize: 'var(--sm2-text-md, 16px)', fontWeight: 400, opacity: 0.9 }}>{guardado}</p>
      <p data-prato-efeito className="sm2-potion-text" style={{ fontSize: 'var(--sm2-text-sm, 14px)', fontWeight: 400, opacity: 0.75 }}>{effectText(d.effect, isPt)}</p>
      <CtaButton ref={ok} tone="acao" width="auto" data-prato-ok onClick={onClose}>OK</CtaButton>
    </div>
  );
  return typeof document === 'undefined' ? node : createPortal(node, document.body);
}
