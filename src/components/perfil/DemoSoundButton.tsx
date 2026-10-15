import { Icon } from '../ui/Icon';
import type { Language } from '../../utils/i18n';

/**
 * DEMO (portfólio, 15/10/2026): no lugar do avatar/perfil da Home, um botão de SOM que liga/desliga TODO o áudio pelo mudo
 * existente (`handleToggleSound` do App → `setMuted` + `safeStorage`). A demo não dá acesso a Configurações. Alvo 44×44.
 */
export function DemoSoundButton({ muted, language, onToggle }: { muted: boolean; language: Language; onToggle: () => void }) {
  const pt = language === 'pt-BR';
  const label = muted ? (pt ? 'Ligar o som' : 'Turn sound on') : (pt ? 'Desligar o som' : 'Turn sound off');
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-pressed={muted}
      title={label}
      data-demo-sound-btn
      className="sm2-corner-link"
      style={{ position: 'relative', zIndex: 20, width: 44, height: 44, flex: '0 0 44px', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--sm2-primary-ink)' }}
    >
      <Icon name={muted ? 'volume_off' : 'volume_up'} size={28} />
    </button>
  );
}
