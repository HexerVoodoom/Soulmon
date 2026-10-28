/**
 * Ponto de ENCAIXE do Calabouço (beta3 M3, 25/10/2026): o prédio `exploracao.dungeon` abre este placeholder (fallback sem save de run; o Calabouço real já existe).
 * A lane M7 troca o uso em `AreaView` (`open?.id === 'dungeon'`) pelo componente real `RogueDungeon.tsx`.
 */
import type { Language } from '../../utils/i18n';

export function RogueDungeonPlaceholder({ language }: { language: Language }) {
  const isPt = language === 'pt-BR';
  return (
    <p data-rogue-dungeon-placeholder style={{ margin: 0, color: 'var(--sm2-ink)', fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm, 14px)' }}>
      {isPt ? 'O Calabouço não está disponível aqui agora.' : 'The Dungeon is not available here right now.'}
    </p>
  );
}
