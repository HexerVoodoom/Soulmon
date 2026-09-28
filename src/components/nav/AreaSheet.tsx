import { useEffect, useRef, type ReactNode } from 'react';
import type { AreaId } from '../../navigation';
import type { Language } from '../../utils/i18n';
import { lotNpcArt } from '../../assets/soulmon/npcs';
import { areaNpcVoice } from '../../utils/areaNpcVoice';

/**
 * A FOLHA DE UM LOTE (minimal-ui F4) — bottom-sheet que abre ao tocar um
 * `.lote` da `AreaScene`. Espelha `.modal-backdrop`/`.modal-sheet` dos mocks
 * aprovados, com a proporção redecidida pelo dono em 28/09/2026: a folha
 * ocupa **2/3 da tela** (`height`, fixo — não é mais um range de
 * min/max-height), e o **1/3 de cima da tela** (= a metade de cima da
 * própria folha) é do NPC da sub-loja + balão de fala; o resto é o conteúdo
 * rolável. O NPC não é mais um ÚNICO anfitrião da área espiando por cima —
 * é o de CADA lote (`lotNpcArt`), embutido dentro da folha.
 *
 * **Só o molde.** O conteúdo de cada folha (abas por moeda, listas, etc.)
 * vem de quem chama (F5: Mercado e Arena em `App.tsx`); o molde só garante
 * abrir/fechar, o NPC certo, a fala e a proporção.
 */
export function AreaSheet({ areaId, lotId, language, title, closeLabel, open, onClose, npcArt, children }: {
  areaId: AreaId;
  /** Id do lote aberto (ex.: `'itens'`, `'torneio'`) — resolve o NPC certo
   *  via `lotNpcArt`. Áreas com folha única (Laboratório/Hall) passam o
   *  próprio id do lote de exemplo. */
  lotId?: string | null;
  /** Idioma da fala do NPC (`areaNpcVoice`). */
  language: Language;
  /** Override explícito do NPC (raro — testes/casos sem lote). Sem ele, usa
   *  `lotNpcArt(areaId, lotId)`. */
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

  const npcSrc = npcArt ?? lotNpcArt(areaId, lotId);
  const npc = areaNpcVoice(areaId, language);

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
          // 2/3 da tela, fixo (decisão do dono 28/09/2026) — não é mais um
          // range min/max: o 1/3 de cima da folha é sempre do NPC.
          height: '66.6667dvh',
          background: 'var(--sm2-surface)',
          borderRadius: '20px 20px 0 0',
          display: 'flex', flexDirection: 'column',
          boxSizing: 'border-box',
          boxShadow: '0 -8px 24px rgba(0,0,0,.4)',
          overflow: 'hidden',
        }}
      >
        {/* O 1/3 de cima da TELA (= metade de cima da folha): o NPC da
            sub-loja + o balão de fala dele. Nunca a área inteira — cada lote
            tem o seu (`lotNpcArt`). */}
        <div
          data-area-sheet-npc-zone
          style={{
            flex: '0 0 50%',
            position: 'relative',
            display: 'flex', alignItems: 'flex-end', gap: 8,
            padding: '14px 12px 10px 16px',
            overflow: 'hidden',
          }}
        >
          <img
            src={npcSrc}
            alt=""
            aria-hidden="true"
            data-area-sheet-npc
            style={{
              height: '100%', width: 'auto', maxWidth: '46%',
              flex: 'none', objectFit: 'contain', objectPosition: 'bottom',
              pointerEvents: 'none',
              filter: 'drop-shadow(0 6px 8px rgba(0,0,0,.6))',
            }}
          />
          {/* Balão de fala — espaço reservado mesmo quando a linha for curta. */}
          <p
            data-area-sheet-npc-line
            style={{
              flex: 1, minWidth: 0,
              margin: '0 0 8px',
              padding: '10px 12px',
              background: 'rgba(15,42,41,.96)',
              border: '2px solid var(--sm2-gold-fill)',
              borderRadius: '14px 14px 14px 2px',
              font: '500 14px/1.4 var(--sm2-font-text)',
              color: '#E9F5F2',
              boxShadow: '0 6px 14px rgba(0,0,0,.45)',
            }}
          >
            <b style={{ display: 'block', marginBottom: 4, fontSize: 12, letterSpacing: '0.06em', color: 'var(--sm2-gold-ink)' }}>
              {npc.name}
            </b>
            {npc.line}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px' }}>
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
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 16px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
