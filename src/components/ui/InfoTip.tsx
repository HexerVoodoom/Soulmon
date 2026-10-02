import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

/**
 * `InfoTip` — o "?" PADRÃO do app (pedido do dono, 02/10/2026): todo texto
 * EXPLICATIVO sai da tela e vira um "?" em círculo; quem quiser, toca e lê.
 * A interface fica limpa e a explicação continua a UM toque.
 *
 * Desenho: o glifo `help` (que já é um "?" dentro de um círculo — o ícone
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
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
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
    setPos({ top: r.bottom + 6, left, width });
  }, [align]);

  useLayoutEffect(() => { if (open) place(); }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const fora = (e: PointerEvent) => {
      const t = e.target as Node | null;
      if (t && (btn.current?.contains(t) || tip.current?.contains(t))) return;
      setOpen(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const reflow = () => place();
    document.addEventListener('pointerdown', fora);
    document.addEventListener('keydown', esc);
    window.addEventListener('resize', reflow);
    window.addEventListener('scroll', reflow, true);
    return () => {
      document.removeEventListener('pointerdown', fora);
      document.removeEventListener('keydown', esc);
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
          cursor: 'pointer', color: 'var(--sm2-ink-muted, var(--sm2-primary-ink))', flexShrink: 0,
          ...style,
        }}
      >
        <Icon name="help" size={20} tone="inherit" />
      </button>
      {open && pos && typeof document !== 'undefined' && createPortal(
        <div
          ref={tip}
          id={id}
          role="note"
          data-info-tip-panel
          lang={isPt ? 'pt-BR' : 'en-US'}
          style={{
            position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9000,
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
