import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ElementIcon, elName } from './ElementBaseSlots';
import { CtaButton } from './ui/CtaButton';
import { useBackLayer } from '../utils/backStack';
import { ELEMENTO_NOVO_COPY as C, paginaDeTotal } from '../utils/elementoNovoModal';
import type { Language } from '../utils/i18n';

/**
 * "Elemento novo" (15/11/2026, pedido do dono): o MESMO modal transparente da "Poção criada" (`PocaoCriada`: véu escuro, ícone grande, texto,
 * OK; as mesmas classes `sm2-potion-*`), mas SEM o brilho (sem os raios girando e sem o halo do ícone). Um elemento = modal simples. Vários
 * liberados de uma vez = UM modal em carrossel (setas de 44 px, pontinhos, deslizar, "1 de 3" no nome acessível de cada página). Toque na página
 * avança e, na última, fecha; OK, Esc e o voltar fecham. Movimento reduzido: sem animação de troca (CSS). Dono do "visto": o App, ao MOSTRAR.
 */
export function ElementosNovosModal({ language, elementIds, onClose }: { language: Language; elementIds: readonly string[]; onClose: () => void }) {
  const isPt = language === 'pt-BR';
  const n = elementIds.length;
  const [i, setI] = useState(0);
  const ok = useRef<HTMLButtonElement>(null);
  const downX = useRef<number | null>(null);
  const swiped = useRef(false);
  const mudou = useRef(false);
  useBackLayer(true, onClose);
  useEffect(() => { ok.current?.focus(); }, []);
  if (n === 0) return null;
  const go = (d: number) => { mudou.current = true; setI(x => Math.min(n - 1, Math.max(0, x + d))); };
  const id = elementIds[Math.min(i, n - 1)];
  const nome = elName(id, isPt);
  const titulo = isPt ? C.title.pt : C.title.en;
  const convite = isPt ? C.invite.pt : C.invite.en;
  const pagina = n > 1 ? paginaDeTotal(i, n, isPt) : undefined;
  const node = (
    <div
      role="dialog" aria-modal="true" aria-label={n > 1 ? `${titulo} (${pagina})` : `${titulo}: ${nome}`}
      aria-roledescription={n > 1 ? 'carousel' : undefined}
      data-elemento-novo data-brilho="false" data-elemento-novo-total={n}
      className="sm2-potion-made sm2-elem-new"
      onKeyDown={(e) => {
        if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
        else if (n > 1 && e.key === 'ArrowRight') go(1);
        else if (n > 1 && e.key === 'ArrowLeft') go(-1);
      }}
      onPointerDown={(e) => { downX.current = e.clientX; swiped.current = false; }}
      onPointerUp={(e) => {
        const x0 = downX.current; downX.current = null;
        if (n > 1 && x0 !== null && Math.abs(e.clientX - x0) > 40) { swiped.current = true; go(e.clientX < x0 ? 1 : -1); }
      }}
      onClick={() => {
        if (swiped.current) { swiped.current = false; return; }
        if (i >= n - 1) onClose(); else go(1);
      }}
    >
      <div className="sm2-elem-new-row">
        {n > 1 && (
          <button type="button" data-elemento-prev className="sm2-elem-new-arrow" disabled={i === 0} aria-label={isPt ? C.prev.pt : C.prev.en}
            onClick={(e) => { e.stopPropagation(); go(-1); }}>{'‹'}</button>
        )}
        <div
          key={id} className="sm2-elem-new-page" data-elemento-pagina={id} data-anim={mudou.current ? '' : undefined}
          role={n > 1 ? 'group' : undefined} aria-roledescription={n > 1 ? 'slide' : undefined} aria-label={pagina}
        >
          <p className="sm2-potion-text" style={{ fontSize: 'var(--sm2-text-md, 15px)', opacity: 0.85 }}>{titulo}</p>
          <div className="sm2-potion-stage" aria-hidden="true">
            <span className="sm2-potion-icon" data-elemento-art><ElementIcon id={id} size={120} /></span>
          </div>
          <p role="status" data-elemento-nome className="sm2-potion-text">{nome}</p>
          <p className="sm2-elem-new-hint">{convite}</p>
        </div>
        {n > 1 && (
          <button type="button" data-elemento-next className="sm2-elem-new-arrow" disabled={i >= n - 1} aria-label={isPt ? C.next.pt : C.next.en}
            onClick={(e) => { e.stopPropagation(); go(1); }}>{'›'}</button>
        )}
      </div>
      {n > 1 && (
        <div className="sm2-elem-new-dots" aria-hidden="true" data-elemento-dots>
          {elementIds.map((e, k) => <span key={e} className="sm2-elem-new-dot" data-on={k === i} />)}
        </div>
      )}
      <CtaButton ref={ok} tone="acao" width="auto" data-elemento-ok onClick={(e) => { e.stopPropagation(); onClose(); }}>{isPt ? C.ok.pt : C.ok.en}</CtaButton>
    </div>
  );
  return typeof document === 'undefined' ? node : createPortal(node, document.body);
}
