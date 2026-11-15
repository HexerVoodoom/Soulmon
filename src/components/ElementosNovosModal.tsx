import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ElementIcon, elName } from './ElementBaseSlots';
import { BackArrow } from './ui/BackArrow';
import { CtaButton } from './ui/CtaButton';
import { useBackLayer } from '../utils/backStack';
import { ELEMENTO_NOVO_COPY as C, componentesDoElemento, paginaDeTotal, todasVistas } from '../utils/elementoNovoModal';
import type { Language } from '../utils/i18n';

/** "Água", "Água e Terra", "Água, Terra e Fogo": a lista dita em voz alta pelo nome acessível da carta. */
const listar = (nomes: string[], isPt: boolean): string => {
  if (nomes.length <= 1) return nomes.join('');
  const e = isPt ? ' e ' : ' and ';
  return `${nomes.slice(0, -1).join(', ')}${e}${nomes[nomes.length - 1]}`;
};

/**
 * "Elemento novo" como CARTA (15/11/2026, pedido do dono, REGISTRO §399): uma carta preta grande, IGUAL para todos os elementos, com o ícone
 * do elemento no meio (pelado, sem box), o NOME embaixo na fonte de título e, só nos compostos, uma fileira pequena com os elementos que o
 * formam (ícone + nome, "+" entre eles). Vários liberados de uma vez = UM modal em carrossel: uma carta por elemento, setas (44 px) e
 * deslize de dedo, pontinhos, "1 de N". O OK fica DESATIVADO até todas as cartas terem sido a página atual. O X do topo fecha sempre (Esc e o
 * voltar do Android também) e conta como visto para o lote inteiro: o "visto" é gravado pelo App AO MOSTRAR. Movimento reduzido: troca sem animação (CSS).
 */
export function ElementosNovosModal({ language, elementIds, onClose }: { language: Language; elementIds: readonly string[]; onClose: () => void }) {
  const isPt = language === 'pt-BR';
  const n = elementIds.length;
  const [i, setI] = useState(0);
  const [vistas, setVistas] = useState<ReadonlySet<number>>(() => new Set([0]));
  const ok = useRef<HTMLButtonElement>(null);
  const downX = useRef<number | null>(null);
  const mudou = useRef(false);
  useBackLayer(true, onClose);
  useEffect(() => { ok.current?.focus(); }, []);
  if (n === 0) return null;
  const go = (d: number) => {
    const k = Math.min(n - 1, Math.max(0, i + d));
    if (k === i) return;
    mudou.current = true;
    setI(k);
    setVistas(v => (v.has(k) ? v : new Set(v).add(k)));
  };
  const libera = todasVistas(vistas, n);
  const id = elementIds[Math.min(i, n - 1)];
  const nome = elName(id, isPt);
  const comps = componentesDoElemento(id);
  const nomesComps = comps.map(c => elName(c, isPt));
  const titulo = isPt ? C.newElement.pt : C.newElement.en;
  const descr = comps.length > 0
    ? `${titulo}: ${nome}, ${isPt ? C.madeOf.pt : C.madeOf.en} ${listar(nomesComps, isPt)}`
    : `${titulo}: ${nome}`;
  const pagina = n > 1 ? paginaDeTotal(i, n, isPt) : undefined;
  const node = (
    <div
      role="dialog" aria-modal="true" aria-label={descr}
      aria-roledescription={n > 1 ? 'carousel' : undefined}
      data-elemento-novo data-brilho="false" data-elemento-novo-total={n} data-elemento-carta-total={n}
      className="sm2-elem-new"
      onKeyDown={(e) => {
        if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
        else if (n > 1 && e.key === 'ArrowRight') go(1);
        else if (n > 1 && e.key === 'ArrowLeft') go(-1);
      }}
      onPointerDown={(e) => { downX.current = e.clientX; }}
      onPointerUp={(e) => {
        const x0 = downX.current; downX.current = null;
        if (n > 1 && x0 !== null && Math.abs(e.clientX - x0) > 40) go(e.clientX < x0 ? 1 : -1);
      }}
    >
      <div className="sm2-elem-new-close" data-elemento-fechar>
        <BackArrow icon="close" language={language} label={isPt ? C.close.pt : C.close.en} onClick={onClose} />
      </div>
      <div className="sm2-elem-new-row">
        {n > 1 && (
          <button type="button" data-elemento-prev className="sm2-elem-new-arrow" disabled={i === 0} aria-label={isPt ? C.prev.pt : C.prev.en}
            onClick={() => go(-1)}>{'‹'}</button>
        )}
        <div
          key={id} className="sm2-elem-new-page" data-elemento-pagina={id} data-anim={mudou.current ? '' : undefined}
          role={n > 1 ? 'group' : undefined} aria-roledescription={n > 1 ? 'slide' : undefined} aria-label={pagina}
        >
          <div className="sm2-elem-carta" data-elemento-carta>
            <div className="sm2-elem-carta-miolo">
              <span className="sm2-elem-carta-icone" data-elemento-art aria-hidden="true"><ElementIcon id={id} size={128} /></span>
              <p role="status" data-elemento-nome className="sm2-elem-carta-nome">{nome}</p>
              {comps.length > 0 && (
                <ul className="sm2-elem-carta-comps" data-elemento-componentes aria-label={`${isPt ? C.madeOf.pt : C.madeOf.en} ${listar(nomesComps, isPt)}`}>
                  {comps.map((c, k) => (
                    <li key={`${c}-${k}`} className="sm2-elem-carta-comp" data-elemento-componente={c}>
                      {k > 0 && <span className="sm2-elem-carta-mais" aria-hidden="true">+</span>}
                      <span className="sm2-elem-carta-comp-in">
                        <span aria-hidden="true"><ElementIcon id={c} size={32} /></span>
                        <span className="sm2-elem-carta-comp-nome">{nomesComps[k]}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        {n > 1 && (
          <button type="button" data-elemento-next className="sm2-elem-new-arrow" disabled={i >= n - 1} aria-label={isPt ? C.next.pt : C.next.en}
            onClick={() => go(1)}>{'›'}</button>
        )}
      </div>
      {n > 1 && (
        <div className="sm2-elem-new-dots" aria-hidden="true" data-elemento-dots>
          {elementIds.map((e, k) => <span key={e} className="sm2-elem-new-dot" data-on={k === i} />)}
        </div>
      )}
      <CtaButton ref={ok} tone="acao" width="auto" data-elemento-ok disabled={!libera}
        aria-describedby={libera ? undefined : 'sm2-elem-new-dica'} onClick={onClose}>{isPt ? C.ok.pt : C.ok.en}</CtaButton>
      {!libera && <span id="sm2-elem-new-dica" className="sm2-sr-only">{isPt ? C.seeAllFirst.pt : C.seeAllFirst.en}</span>}
    </div>
  );
  return typeof document === 'undefined' ? node : createPortal(node, document.body);
}
