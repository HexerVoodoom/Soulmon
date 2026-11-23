import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ElementIcon, elName } from './ElementBaseSlots';
import { CtaButton } from './ui/CtaButton';
import { potionArt } from '../utils/potionArt';
import { useBackLayer } from '../utils/backStack';
import type { Language } from '../utils/i18n';

/**
 * "Poção criada" (12/11/2026, pedido do dono): o ícone da poção GRANDE no meio da tela, fundo escurecido, uma LUZ girando atrás
 * (raios em CSS, `.sm2-potion-rays`; parada com `prefers-reduced-motion`), o texto "Poção de fogo criada" e o OK centralizado.
 * SEM caixa, SEM card, SEM painel: só o véu escuro, o ícone, a luz, o texto e o botão (OK = `CtaButton` tom `acao`, §364). Usa o ícone da poção do app (`potionArt`;
 * elemento composto, sem poção própria, cai no ícone do elemento). `aria-modal`: conta como modal (`modalDepth`) e o voltar fecha.
 */
export function PocaoCriada({ language, elementId, onClose }: { language: Language; elementId: string; onClose: () => void }) {
  const isPt = language === 'pt-BR';
  const ok = useRef<HTMLButtonElement>(null);
  useBackLayer(true, onClose);
  useEffect(() => { ok.current?.focus(); }, []);
  const el = elName(elementId, isPt);
  const texto = isPt ? `Poção de ${el.toLocaleLowerCase('pt-BR')} criada` : `${el} potion created`;
  const art = potionArt(elementId);
  const node = (
    <div role="dialog" aria-modal="true" aria-label={texto} data-pocao-criada className="sm2-potion-made"
      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}>
      <div className="sm2-potion-stage" aria-hidden="true">
        <div className="sm2-potion-rays" data-potion-rays />
        {art
          ? <img src={art} alt="" width={160} height={160} draggable={false} data-pocao-art className="sm2-potion-icon" />
          : <span className="sm2-potion-icon" data-pocao-art><ElementIcon id={elementId} size={120} /></span>}
      </div>
      <p role="status" data-pocao-texto className="sm2-potion-text">{texto}</p>
      <CtaButton ref={ok} tone="acao" width="auto" data-vesca-ok onClick={onClose}>OK</CtaButton>
    </div>
  );
  return typeof document === 'undefined' ? node : createPortal(node, document.body);
}
