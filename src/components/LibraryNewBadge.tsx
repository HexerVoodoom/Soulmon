import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import newTag from '../assets/soulmon/ui/new-tag.png';
import { LIBRARY_NEW_BADGE, LIBRARY_NEW_TEXT } from '../utils/libraryNew';

/**
 * SELO "NEW" e AVISO de entrada nova na Biblioteca (01/11/2026, pedido do dono; regra em `utils/libraryNew.ts`).
 * - `NewBadge`: o ícone com a palavra NEW. `overlay` = sobrepõe ligeiramente o canto do ícone do elemento/Soulmon.
 *   Par de tokens `--sm2-gold-fill` / `--sm2-on-gold` (classe `.sm2-new-badge`, `index.css`), nunca cor própria.
 * - `useLibraryNewNotice(count)`: quando o número de entradas não vistas SOBE durante a sessão, mostra UM toast discreto (id
 *   fixo: 2+ entradas juntas viram o MESMO aviso, sem contagem nem plural). Abrir o app com entradas pendentes não avisa de
 *   novo: o valor inicial é o de referência.
 */
/** `hidden` = só visual (aria-hidden): na aba, o nome acessível da aba não muda. */
export function NewBadge({ overlay = false, hidden = false }: { overlay?: boolean; hidden?: boolean }) {
  return (
    <span className={overlay ? 'sm2-new-badge sm2-new-badge--overlay' : 'sm2-new-badge'} data-library-new-badge aria-hidden={overlay || hidden ? 'true' : undefined}>
      <img className="sm2-new-badge__img" src={newTag} alt="" aria-hidden="true" draggable={false} />
      <span className="sm2-sr-only">{LIBRARY_NEW_BADGE}</span>
    </span>
  );
}

export function LibraryNewNoticeContent() {
  return (
    <span data-library-new-notice style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <NewBadge />
      <span>{LIBRARY_NEW_TEXT}</span>
    </span>
  );
}

export const LIBRARY_NEW_TOAST_ID = 'library-new-entry';

export function useLibraryNewNotice(count: number): void {
  const last = useRef(count);
  useEffect(() => {
    if (count > last.current) toast(<LibraryNewNoticeContent />, { id: LIBRARY_NEW_TOAST_ID, duration: 4000 });
    last.current = count;
  }, [count]);
}
