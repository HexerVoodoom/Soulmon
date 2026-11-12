import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { Icon } from '../ui/Icon';
import { PURPOSE_PATHS, type PurposePath } from '../../utils/purpose';
import { PATH_COPY } from '../../utils/purposePaths';

/**
 * AS 3 CARTAS (decisão do dono, 12/11/2026, PLANO §2b): "Em que momento você está?". Ambição, Satisfação e Ressurgimento.
 * A carta SÓ orienta a escolha das tarefas. Tocar uma carta a traz para a frente (animação), escurece o fundo, mostra um X e os botões
 * "Escolher esta carta" / "Escolher outra". Arte PLACEHOLDER em CSS e tokens (TODO(arte): os arquétipos de tarô entram pela fila de assets).
 * Movimento reduzido: sem animação, só o estado final. Chunk próprio (`lazy`).
 */

const NUMERAL: Record<PurposePath, string> = { ambicao: 'I', satisfacao: 'II', ressurgimento: 'III' };

const cardFace = (big: boolean): CSSProperties => ({
  boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', textAlign: 'center',
  width: big ? 'min(78vw, 280px)' : '100%', minHeight: big ? 380 : 190, padding: big ? 24 : 10,
  borderRadius: 'var(--sm2-radius-lg, 16px)', border: '2px solid var(--sm2-primary-ink)',
  background: 'linear-gradient(160deg, var(--sm2-surface-2), var(--sm2-primary-soft))', color: 'var(--sm2-ink)', fontFamily: 'var(--sm2-font-text)',
});

function Face({ id, isPt, big }: { id: PurposePath; isPt: boolean; big: boolean }) {
  const c = PATH_COPY[id];
  return (
    <>
      <span aria-hidden="true" style={{ fontSize: big ? 'var(--sm2-text-lg)' : 'var(--sm2-text-sm)', color: 'var(--sm2-muted)' }}>{NUMERAL[id]}</span>
      <Icon name={c.icon} size={big ? 64 : 36} fill={1} tone="primary" />
      <span style={{ ...sm2Text, fontWeight: 600, fontSize: big ? 'var(--sm2-text-lg)' : 'var(--sm2-text-md)', margin: 0 }}>{isPt ? c.name.pt : c.name.en}</span>
      <span style={{ ...sm2Hint, margin: 0, fontSize: big ? 'var(--sm2-text-sm)' : 'var(--sm2-text-xs)' }}>{isPt ? c.text.pt : c.text.en}</span>
    </>
  );
}

export function PathCards({ isPt, onChoose, selected, title }: { isPt: boolean; onChoose: (p: PurposePath) => void; selected?: PurposePath; title?: string }) {
  const [open, setOpen] = useState<PurposePath | null>(null);
  const [shown, setShown] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const reduced = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!open) { setShown(false); return; }
    const t = requestAnimationFrame(() => setShown(true));
    dialogRef.current?.focus();
    return () => cancelAnimationFrame(t);
  }, [open]);

  const trans = reduced ? 'none' : 'transform 260ms var(--sm2-ease, ease), opacity 260ms var(--sm2-ease, ease)';
  return (
    <div data-path-cards>
      <div role="group" aria-label={title ?? (isPt ? 'Em que momento você está?' : 'Where are you right now?')} style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
        {PURPOSE_PATHS.map(id => (
          <button key={id} type="button" data-path-card={id} aria-pressed={selected === id} aria-haspopup="dialog"
            onClick={() => setOpen(id)}
            style={{ ...cardFace(false), flex: 1, minWidth: 0, minHeight: 190, cursor: 'pointer', outlineOffset: 2, borderColor: selected === id ? 'var(--sm2-primary-ink)' : 'var(--sm2-muted)' }}>
            <Face id={id} isPt={isPt} big={false} />
          </button>
        ))}
      </div>

      {open && (
        <div role="dialog" aria-modal="true" aria-label={isPt ? PATH_COPY[open].name.pt : PATH_COPY[open].name.en} ref={dialogRef} tabIndex={-1} data-path-dialog
          onKeyDown={e => { if (e.key === 'Escape') setOpen(null); }}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16,
            backgroundColor: 'rgba(4, 18, 20, .78)', opacity: reduced || shown ? 1 : 0, transition: reduced ? 'none' : 'opacity 260ms ease', outline: 'none' }}>
          <button type="button" data-path-close aria-label={isPt ? 'Fechar' : 'Close'} onClick={() => setOpen(null)}
            style={{ position: 'absolute', top: 'max(12px, env(safe-area-inset-top))', right: 12, minWidth: 44, minHeight: 44, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sm2-ink-on-scrim, #fff)' }}>
            <Icon name="close" size={28} tone="inherit" />
          </button>
          <div style={{ ...cardFace(true), transform: reduced || shown ? 'scale(1)' : 'scale(.82)', opacity: reduced || shown ? 1 : 0, transition: trans }}>
            <Face id={open} isPt={isPt} big />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 'min(78vw, 280px)' }}>
            <button type="button" data-path-choose style={{ ...sm2Button('primary'), width: '100%' }} onClick={() => { const p = open; setOpen(null); onChoose(p); }}>
              {isPt ? 'Escolher esta carta' : 'Choose this card'}
            </button>
            <button type="button" data-path-other style={{ ...sm2Button('outline'), width: '100%' }} onClick={() => setOpen(null)}>
              {isPt ? 'Escolher outra' : 'Choose another'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
