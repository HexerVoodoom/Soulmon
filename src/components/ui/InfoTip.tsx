import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useReducer, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';
import { useBackLayer } from '../../utils/backStack';

/** Garante área de toque ≥ 44 sem mudar o espaço que o "i" ocupa no layout (padding + margem negativa iguais). */
export function alvo44(style: CSSProperties | undefined): CSSProperties {
  const h = typeof style?.minHeight === 'number' ? style.minHeight : 44;
  const w = typeof style?.minWidth === 'number' ? style.minWidth : 44;
  const extraV = Math.max(0, 44 - h) / 2;
  const extraH = Math.max(0, 44 - w) / 2;
  if (!extraV && !extraH) return {};
  return { minHeight: Math.max(h, 44), minWidth: Math.max(w, 44), margin: `-${extraV}px -${extraH}px` };
}

/**
 * `InfoTip` — o "i" PADRÃO do app (pedido do dono, 02/10/2026; o "?" virou "i"
 * cinza claro na rodada 7, 04/10/2026 — o "?" amarelo é das quests): todo texto
 * EXPLICATIVO sai da tela e vira um "i" em círculo; quem quiser, toca e lê.
 * A interface fica limpa e a explicação continua a UM toque. UM por modal/folha,
 * no canto superior direito, explicando TUDO daquele modal.
 *
 * Desenho: o glifo `info` (que já é um "i" dentro de um círculo — o ícone
 * continua PELADO, sem box nem fundo, regra visual do dono) a 20px, num alvo
 * de toque de 44px. O tooltip abre num PORTAL em `document.body` (nunca é
 * cortado por `overflow` de folha/modal), posicionado junto ao botão e preso
 * às bordas da tela; fecha com novo toque no "?", toque fora ou Esc.
 *
 * Uso:
 *   <InfoTip language={language} label="Como funciona a Feira">
 *     {isPt ? 'Texto longo…' : 'Long text…'}
 *   </InfoTip>
 *
 * - `label` é o nome acessível do botão (obrigatório, por idioma) — NÃO é o
 *   texto do tooltip. `aria-expanded` e `aria-describedby` ligam os dois.
 * - Sem estilos de classe: tudo inline, para não depender de CSS novo
 *   (footgun do `index.css.contract`).
 */
function InfoTipBase({
  children, label, language, align = 'center', style, trigger, bare = false,
}: {
  children: ReactNode;
  /** Nome acessível do "?" (ex.: "Como funciona a Feira" / "How the Fair works"). */
  label: string;
  language: 'pt-BR' | 'en-US';
  /** Âncora horizontal preferida do tooltip em relação ao "?". */
  align?: 'left' | 'center' | 'right';
  style?: React.CSSProperties;
  /** Gatilho próprio no lugar do "i" (ex.: o ícone de uma poção que explica de onde ela vem). Mesmo popover, mesmo fechar. */
  trigger?: ReactNode;
  /** Disparador TRANSPARENTE sobre o ornamento "i" que a arte da moldura já traz (sem ícone próprio, ≥ 44 px, foco visível). */
  bare?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; maxHeight: number; left: number; width: number } | null>(null);
  const btn = useRef<HTMLButtonElement | null>(null);
  const tip = useRef<HTMLDivElement | null>(null);
  const id = useId();
  const isPt = language === 'pt-BR';

  const place = useCallback(() => {
    const b = btn.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    const vw = window.innerWidth;
    const margin = 12;
    const width = Math.min(300, vw - margin * 2);
    const anchor = align === 'left' ? r.left : align === 'right' ? r.right - width : r.left + r.width / 2 - width / 2;
    const left = Math.max(margin, Math.min(anchor, vw - margin - width));
    // Abre embaixo; sem ~140px livres (o "?" do pé da cena de combate) e com mais espaço em cima, vira para CIMA.
    const vh = window.innerHeight;
    const below = vh - r.bottom - 6 - margin;
    const above = r.top - 6 - margin;
    if (below < 140 && above > below) setPos({ bottom: vh - r.top + 6, maxHeight: above, left, width });
    else setPos({ top: r.bottom + 6, maxHeight: Math.max(96, below), left, width });
  }, [align]);

  useLayoutEffect(() => { if (open) place(); }, [open, place]);
  // O voltar do Android/navegador fecha só a dica (camada própria), sem sair da tela.
  useBackLayer(open, () => setOpen(false));

  useEffect(() => {
    if (!open) return;
    const fora = (e: PointerEvent) => {
      const t = e.target as Node | null;
      if (t && (btn.current?.contains(t) || tip.current?.contains(t))) return;
      setOpen(false);
    };
    // CAPTURA + stopPropagation: com o tooltip aberto, o Esc fecha SÓ ele — sem
    // levar junto o modal/folha em volta (`useDialogA11y` também escuta o Esc).
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } };
    const reflow = () => place();
    // Um diálogo NOVO (aria-modal) abrindo por cima fecha a dica (QA L11-07): ela é
    // `fixed` com z-index 9000 e, aberta, cobria o paywall e comia o 1º Esc.
    const modais = () => document.querySelectorAll('[aria-modal="true"]').length;
    const modaisAoAbrir = modais();
    const obs = typeof MutationObserver !== 'undefined'
      ? new MutationObserver(() => { if (modais() > modaisAoAbrir) setOpen(false); })
      : null;
    obs?.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('pointerdown', fora);
    // `window` (e não `document`): na captura o `window` vem ANTES, então a dica trata o Esc primeiro
    // e o modal em volta (que ouve o `document`) nem chega a vê-lo.
    window.addEventListener('keydown', esc, true);
    window.addEventListener('resize', reflow);
    window.addEventListener('scroll', reflow, true);
    return () => {
      obs?.disconnect();
      document.removeEventListener('pointerdown', fora);
      window.removeEventListener('keydown', esc, true);
      window.removeEventListener('resize', reflow);
      window.removeEventListener('scroll', reflow, true);
    };
  }, [open, place]);

  return (
    <>
      <button
        ref={btn}
        type="button"
        data-info-tip
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        title={bare ? undefined : label}
        data-info-bare={bare ? '' : undefined}
        className={bare ? 'sm2-info-hit' : undefined}
        onClick={() => setOpen(o => !o)}
        style={bare ? undefined : {
          background: 'none', border: 'none', padding: 0, margin: 0,
          minWidth: 44, minHeight: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--sm2-muted)', flexShrink: 0,
          ...style,
          // O alvo de toque nunca fica abaixo de 44 (QA L05-02/L09-04): quem pede um `minHeight` menor para caber na linha
          // (ex.: 24) continua ocupando 24 no layout — a área extra vem de padding compensado por margem negativa.
          ...alvo44(style),
        }}
      >
        {bare ? null : (trigger ?? <Icon name="info" size={20} tone="inherit" />)}
      </button>
      {open && pos && typeof document !== 'undefined' && createPortal(
        <div
          ref={tip}
          id={id}
          role="note"
          data-info-tip-panel
          lang={isPt ? 'pt-BR' : 'en-US'}
          // O painel é filho React do "?" (portal): sem isto o toque nele sobe pela ÁRVORE React
          // até o ancestral (ex.: a `TorcidaLayer`, que o contaria como torcida).
          onPointerDown={e => e.stopPropagation()}
          style={{
            position: 'fixed', top: pos.top, bottom: pos.bottom, left: pos.left, width: pos.width, maxHeight: pos.maxHeight, overflowY: 'auto', zIndex: 9000,
            boxSizing: 'border-box', padding: '10px 12px',
            border: '1px solid var(--sm2-line)', borderRadius: 'var(--sm2-radius-md)',
            backgroundColor: 'var(--sm2-surface-2)', color: 'var(--sm2-ink)',
            fontFamily: 'var(--sm2-font-text)', fontSize: 14, lineHeight: 1.4,
            boxShadow: '0 6px 24px rgba(0,0,0,.35)',
          }}
        >
          {children}
        </div>,
        document.body,
      )}
    </>
  );
}

/**
 * Uma seção curta DENTRO do tooltip único de um modal/folha (rodada 7, I2):
 * título em negrito + texto. Várias seções = tudo do modal num "i" só.
 */
export function InfoTipSection({ title, children, last = false }: { title: string; children: ReactNode; last?: boolean }) {
  return (
    <span style={{ display: 'block', marginBottom: last ? 0 : 10 }}>
      <b style={{ display: 'block', fontWeight: 600, marginBottom: 2 }}>{title}</b>
      {children}
    </span>
  );
}

/**
 * O "i" ÚNICO DE UMA MOLDURA (pedido do dono, 18/11/2026): a arte da moldura (`ModalFrame`/`TelaMoldura`) JÁ traz um ornamento circular com um "i" desenhado
 * no canto superior direito. Quem desenha a moldura (dono único da posição) abre um provedor (`ModalInfoSlotProvider`) com o encaixe exatamente sobre
 * esse ornamento; todo `InfoTip`/`ModalInfo` escrito DENTRO dela deixa de desenhar o próprio ícone e se REGISTRA no provedor. O provedor então:
 *  - sem nenhum registro, não renderiza nada (o ornamento fica puramente decorativo, sem botão);
 *  - com um, monta UM botão transparente (≥ 44 px, `aria-label` do registro) sobre o ornamento, que abre o painel do registro;
 *  - com vários, monta o MESMO botão com um painel único: uma seção por registro (o título é o `label` de cada um).
 * Sem provedor (página, card, folha sem moldura) o `InfoTip` é o "i" de sempre, onde foi escrito. `trigger` próprio nunca é capturado.
 * Uma sub-folha que abre no miolo da moldura (`inherit`) assume o ornamento enquanto está aberta e o devolve ao fechar.
 */
interface InfoEntry { label: string; language: 'pt-BR' | 'en-US'; node: ReactNode }
interface InfoRegistry {
  slot: HTMLElement | null;
  bare: boolean;
  set: (id: string, e: InfoEntry) => void;
  remove: (id: string) => void;
  cover: () => () => void;
}
const ModalInfoCtx = createContext<InfoRegistry | null>(null);

/** Moldura: chame no título e passe `slot` para o `<span ref>` do canto direito. */
export function useModalInfoSlot() {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  return { slot, slotRef: setSlot };
}

export function ModalInfoSlotProvider({ slot, bare, inherit = false, children }: {
  slot: HTMLElement | null;
  /** O encaixe fica sobre o ornamento "i" da arte: o botão é transparente, sem ícone. */
  bare?: boolean;
  /** Sub-folha no miolo de uma moldura: usa o encaixe do pai (se houver) e o cobre enquanto estiver montada. */
  inherit?: boolean;
  children: ReactNode;
}) {
  const parent = useContext(ModalInfoCtx);
  const herda = inherit && !!parent?.slot;
  const effSlot = herda ? parent!.slot : slot;
  const effBare = herda ? parent!.bare : !!bare;
  const store = useRef(new Map<string, InfoEntry>());
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const [covered, setCovered] = useState(0);
  const cover = useCallback(() => { setCovered(c => c + 1); return () => setCovered(c => c - 1); }, []);
  const set = useCallback((id: string, e: InfoEntry) => {
    const prev = store.current.get(id);
    store.current.set(id, e);
    if (!prev || prev.label !== e.label || prev.language !== e.language || prev.node !== e.node) bump();
  }, []);
  const remove = useCallback((id: string) => { if (store.current.delete(id)) bump(); }, []);
  const parentCover = parent?.cover;
  useLayoutEffect(() => (herda && parentCover ? parentCover() : undefined), [herda, parentCover]);
  const value = useMemo<InfoRegistry>(() => ({ slot: effSlot, bare: effBare, set, remove, cover }), [effSlot, effBare, set, remove, cover]);
  const list = Array.from(store.current.values());
  const first = list[0];
  const isPt = first?.language === 'pt-BR';
  const trigger = effSlot && first && covered === 0 ? createPortal(
    <InfoTipBase bare={effBare} language={first.language} align="right" label={list.length === 1 ? first.label : (isPt ? 'Informações' : 'Info')}>
      {list.length === 1 ? first.node : list.map((e, i) => <InfoTipSection key={i} title={e.label} last={i === list.length - 1}>{e.node}</InfoTipSection>)}
    </InfoTipBase>,
    effSlot,
  ) : null;
  return (
    <>
      <ModalInfoCtx.Provider value={value}>{children}</ModalInfoCtx.Provider>
      {trigger}
    </>
  );
}

function InfoRegistrado({ reg, label, language, children }: { reg: InfoRegistry; label: string; language: 'pt-BR' | 'en-US'; children: ReactNode }) {
  const id = useId();
  useLayoutEffect(() => { reg.set(id, { label, language, node: children }); });
  useLayoutEffect(() => () => reg.remove(id), [id, reg]);
  return null;
}

/** O "i" PADRÃO. Dentro de uma moldura (provedor) vira entrada do disparador único do canto; fora dela é o botão "i" de sempre. */
export function InfoTip(props: Parameters<typeof InfoTipBase>[0]) {
  const reg = useContext(ModalInfoCtx);
  if (reg && !props.trigger) return <InfoRegistrado reg={reg} label={props.label} language={props.language}>{props.children}</InfoRegistrado>;
  return <InfoTipBase {...props} />;
}

/** O "i" ÚNICO de um modal/folha (mesma API do `InfoTip`; ancora à direita). */
export function ModalInfo(props: Parameters<typeof InfoTipBase>[0]) {
  return <InfoTip {...props} align={props.align ?? 'right'} />;
}
