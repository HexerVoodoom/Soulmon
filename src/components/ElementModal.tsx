import { useState } from 'react';
import { RitualDialog } from './ritual/RitualKit';
import { elementIcon } from '../utils/elementIconArt';
import { elementLabel } from '../utils/arena';
import { elementoNomeDe } from '../utils/soulProfile/ficha/elementoNome';
import { BASE_ELEMENT_IDS, elementComponents } from '../utils/elementDex';
import { curatedComponents, curatedElementName, isCuratedElement } from '../utils/elementosCurados';
import { elementMatchups } from '../utils/elementDexMatchups';
import { textoDoElementoBase } from '../utils/elementoTextos.data';
import { useBackLayer } from '../utils/backStack';

/**
 * MODAL DO ELEMENTO (P5/24.5 e 24.6): a ficha de um elemento destrancado, extraída do `ElementDex` para ser a MESMA em todo lugar
 * (grade da aba Elementos e ícone do elemento na criatura). Cada componente da Composição destrancado é um botão que abre a ficha
 * daquele elemento; o que ainda está trancado segue "?" sem revelar nada. Pilha de navegação: "Voltar" volta UM elemento (e o
 * voltar do sistema também, via `useBackLayer`); o X (e Esc/fundo) fecha tudo.
 */
const BASE_SET: ReadonlySet<string> = new Set(BASE_ELEMENT_IDS);
export const dexElementName = (id: string, isPt: boolean): string =>
  BASE_SET.has(id) ? elementLabel(id, isPt) : isCuratedElement(id) ? curatedElementName(id, isPt) : (isPt ? elementoNomeDe(id).pt : elementoNomeDe(id).en);

function ElementRef({ id, open, isPt, onOpen }: { id: string; open: boolean; isPt: boolean; onOpen?: (id: string) => void }) {
  const icon = open ? elementIcon(id) : undefined;
  return (
    <li data-dex-ref={open ? id : undefined} data-open={open ? '1' : '0'} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 32 }}>
      {open ? (() => {
        const inner = (
          <>
            {icon && <img src={icon} alt="" aria-hidden="true" width={24} height={24} draggable={false} style={{ width: 24, height: 24, imageRendering: 'pixelated' }} />}
            <span className="sm2-lib-s" style={{ color: 'var(--sm2-ink)' }}>{dexElementName(id, isPt)}</span>
          </>
        );
        return onOpen
          ? <button type="button" data-dex-ref-open={id} onClick={() => onOpen(id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 32, padding: 0, background: 'none', border: 0, cursor: 'pointer', color: 'inherit' }}>{inner}</button>
          : inner;
      })() : (
        <span className="sm2-lib-s sm-dex-lock sm-dex-lock--sm" aria-label={isPt ? 'Elemento ainda trancado' : 'Element still locked'}>?</span>
      )}
    </li>
  );
}

function RefList({ title, ids, unlocked, isPt, onOpen }: { title: string; ids: readonly string[]; unlocked: ReadonlySet<string>; isPt: boolean; onOpen?: (id: string) => void }) {
  return (
    <div>
      <p className="sm2-lib-s" style={{ margin: '0 0 4px' }}>{title}</p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {ids.map(id => <ElementRef key={id} id={id} open={unlocked.has(id)} isPt={isPt} onOpen={onOpen} />)}
      </ul>
    </div>
  );
}

export function ElementModal({ id, unlocked, isPt, onClose }: { id: string; unlocked: ReadonlySet<string>; isPt: boolean; onClose: () => void }) {
  const [stack, setStack] = useState<string[]>([id]);
  const openId = stack[stack.length - 1];
  const canBack = stack.length > 1;
  const back = () => setStack(s => (s.length > 1 ? s.slice(0, -1) : s));
  useBackLayer(canBack, back);
  const comps = elementComponents(openId) ?? curatedComponents(openId);
  // Curado: a vantagem é a do 1º componente (o dominante, que dá os golpes); neutro não tem anel (listas vazias).
  const m = openId === 'neutro' ? { strong: [], weak: [] } : elementMatchups(curatedComponents(openId)?.[0] ?? openId);
  const texto = textoDoElementoBase(openId, isPt);
  return (
    <RitualDialog onClose={onClose} labelledBy="sm2-dex-title" closeLabel={isPt ? 'Fechar' : 'Close'} maxWidth={320} closeOnBackdrop>
      <h2 id="sm2-dex-title" className="sm2-lib-h2" style={{ minHeight: 44, display: 'flex', alignItems: 'center', paddingRight: 48 }}>
        {dexElementName(openId, isPt)}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }} data-element-detail={openId}>
        {elementIcon(openId) && <img src={elementIcon(openId)} alt="" aria-hidden="true" width={96} height={96} draggable={false} style={{ width: 96, height: 96, imageRendering: 'pixelated' }} />}
        <div style={{ alignSelf: 'stretch', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {texto && <p className="sm2-lib-s" data-element-text style={{ margin: 0 }}>{texto}</p>}
          {comps && <RefList title={isPt ? 'Composição' : 'Composition'} ids={comps} unlocked={unlocked} isPt={isPt} onOpen={next => setStack(s => [...s, next])} />}
          <RefList title={isPt ? 'Forte contra' : 'Strong against'} ids={m.strong} unlocked={unlocked} isPt={isPt} />
          <RefList title={isPt ? 'Fraco contra' : 'Weak against'} ids={m.weak} unlocked={unlocked} isPt={isPt} />
          {canBack && (
            <button type="button" data-element-back onClick={back} className="sm2-kit-btn" style={{ alignSelf: 'flex-start', minHeight: 44 }}>
              {isPt ? 'Voltar' : 'Back'}
            </button>
          )}
        </div>
      </div>
    </RitualDialog>
  );
}
