import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

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
export function InfoTip({
  children, label, language, align = 'center', style,
}: {
  children: ReactNode;
  /** Nome acessível do "?" (ex.: "Como funciona a Feira" / "How the Fair works"). */
  label: string;
  language: 'pt-BR' | 'en-US';
  /** Âncora horizontal preferida do tooltip em relação ao "?". */
  align?: 'left' | 'center' | 'right';
  style?: React.CSSProperties;
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
    document.addEventListener('pointerdown', fora);
    // `window` (e não `document`): na captura o `window` vem ANTES, então a dica trata o Esc primeiro
    // e o modal em volta (que ouve o `document`) nem chega a vê-lo.
    window.addEventListener('keydown', esc, true);
    window.addEventListener('resize', reflow);
    window.addEventListener('scroll', reflow, true);
    return () => {
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
        title={label}
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: 'none', padding: 0, margin: 0,
          minWidth: 44, minHeight: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--sm2-muted)', flexShrink: 0,
          ...style,
        }}
      >
        <Icon name="info" size={20} tone="inherit" />
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
 * O ENCAIXE DO "i" NA LINHA DO TÍTULO (ajuste do dono, 05/10/2026): o "i" de um
 * modal/folha mora no canto superior DIREITO, NA MESMA LINHA do título. Quem
 * desenha o título (as molduras `ModalSheet` e `AreaSheet`) é o ÚNICO dono da
 * posição: ele abre um encaixe (`ModalInfoSlot`) e publica o elemento por
 * contexto. O conteúdo da folha usa `ModalInfo`, que entra no encaixe por portal
 * — nenhuma folha posiciona o próprio "i". Fora de uma moldura (sem encaixe),
 * `ModalInfo` cai no `InfoTip` comum, onde foi escrito.
 */
const ModalInfoSlotContext = createContext<HTMLElement | null>(null);

/** Moldura: chame no título e passe `slot` para o `<span ref>` do canto direito. */
export function useModalInfoSlot() {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  return { slot, slotRef: setSlot };
}

export function ModalInfoSlotProvider({ slot, children }: { slot: HTMLElement | null; children: ReactNode }) {
  return <ModalInfoSlotContext.Provider value={slot}>{children}</ModalInfoSlotContext.Provider>;
}

/** O "i" ÚNICO de um modal/folha — sempre na linha do título da moldura em volta. */
export function ModalInfo(props: Parameters<typeof InfoTip>[0]) {
  const slot = useContext(ModalInfoSlotContext);
  const tip = <InfoTip {...props} align={props.align ?? 'right'} />;
  return slot ? createPortal(tip, slot) : tip;
}
