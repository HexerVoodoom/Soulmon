import { useEffect, useRef, type ReactNode } from 'react';
import type { AreaId } from '../../navigation';
import { AREA_NPC_ART } from '../../assets/soulmon/npcs';

/**
 * A FOLHA DE UM LOTE (minimal-ui F4) — bottom-sheet que abre ao tocar um
 * `.lote` da `AreaScene`. Espelha `.modal-backdrop`/`.modal-sheet`/`.npc-top`
 * dos mocks aprovados: `min-height: 62%` (nunca baixa demais — regra do
 * plano), o NPC da área espia ATRÁS/ACIMA da folha (`top: -215px` no mock;
 * aqui escalado para a largura da folha), backdrop fecha ao tocar fora.
 *
 * **Só o molde.** O conteúdo de cada folha (abas por moeda, listas, etc.)
 * vem de quem chama (F5: Mercado e Arena em `App.tsx`); o molde só garante
 * abrir/fechar, o NPC visível e a min-height.
 */
export function AreaSheet({ areaId, title, closeLabel, open, onClose, npcArt, children }: {
  areaId: AreaId;
  /** NPC próprio da lojinha (ex.: os três vendedores do Mercado). Sem ele,
   *  o anfitrião da área. */
  npcArt?: string;
  title: string;
  /** Rótulo acessível do fechar — PT/EN, decidido por quem chama (a `AreaScene` sabe o idioma). */
  closeLabel: string;
  open: boolean;
  onClose: () => void;
  children?: ReactNode;
}) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      data-area-sheet-backdrop
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 20,
        background: 'rgba(4,10,10,.6)',
        display: 'flex', alignItems: 'flex-end',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-area-sheet
        // Toque dentro da folha não deve fechar (só o backdrop fecha).
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '62%',
          maxHeight: '82%',
          background: 'var(--sm2-surface)',
          borderRadius: '20px 20px 0 0',
          padding: '10px 16px 16px',
          display: 'flex', flexDirection: 'column', gap: 10,
          boxSizing: 'border-box',
          boxShadow: '0 -8px 24px rgba(0,0,0,.4)',
        }}
      >
        {/* O NPC da área, espiando por cima da folha — atrás/acima, nunca
            dentro do conteúdo rolável. */}
        <img
          src={npcArt ?? AREA_NPC_ART[areaId]}
          alt=""
          aria-hidden="true"
          data-area-sheet-npc
          style={{
            position: 'absolute', right: 4, top: -160,
            width: 170, pointerEvents: 'none',
            filter: 'drop-shadow(0 6px 8px rgba(0,0,0,.6))',
            zIndex: -1,
          }}
        />
        <div aria-hidden="true" style={{ width: 36, height: 4, background: 'var(--sm2-line)', borderRadius: 2, margin: '0 auto' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ flex: 1, margin: 0, fontFamily: 'var(--sm2-font-display)', fontSize: 'var(--sm2-text-lg)', fontWeight: 700, color: 'var(--sm2-ink)' }}>
            {title}
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            data-area-sheet-close
            onClick={onClose}
            aria-label={closeLabel}
            title={closeLabel}
            style={{
              width: 36, height: 36, flex: '0 0 36px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
              color: 'var(--sm2-ink)', fontSize: 20, lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
