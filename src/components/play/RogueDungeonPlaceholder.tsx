/**
 * Ponto de ENCAIXE do Calabouço (beta3 M3, 25/10/2026): o prédio `jogos.dungeon` abre este placeholder "em breve".
 * A lane M7 troca o uso em `AreaView` (`open?.id === 'dungeon'`) pelo componente real `RogueDungeon.tsx`.
 */
import type { Language } from '../../utils/i18n';

export function RogueDungeonPlaceholder({ language }: { language: Language }) {
  const isPt = language === 'pt-BR';
  return (
    <p data-rogue-dungeon-placeholder style={{ margin: 0, color: 'var(--sm2-ink)', fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm, 14px)' }}>
      {isPt ? 'O Calabouço ainda está sendo preparado. Volte em breve.' : 'The Dungeon is still being prepared. Come back soon.'}
    </p>
  );
}
