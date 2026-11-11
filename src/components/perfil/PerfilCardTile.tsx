import type { CSSProperties, ReactNode } from 'react';
import { sm2Text } from '../form/FormKit';

/**
 * CARD DO MENU DA HOME (Perfil / Home / Widget). Os três usam a MESMA peça, no estilo do card do Perfil: palco com o
 * visual do item, nome embaixo, moldura fina. Identidade Soulmon (UI): fundo turquesa escuro com brilho de cristal e fio de cobre.
 *
 * SLOT DE ARTE: `src/assets/soulmon/perfil-cards/card-<chave>.{webp,png}` (ver `docs/ASSETS-A-GERAR.md`, card-home e card-widget).
 * Com o arquivo, ele vira o fundo do palco; sem ele, o visual de hoje (sprite / prévia da moldura) segue sozinho.
 */
const ART_FILES = import.meta.glob<string>('../../assets/soulmon/perfil-cards/card-*.{webp,png}', { eager: true, import: 'default' });
const ART: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(ART_FILES).flatMap(([path, url]) => {
    const m = /card-([a-z]+)\.(?:webp|png)$/.exec(path);
    return m ? [[m[1], url]] : [];
  }),
);

export const perfilCardArt = (key: string): string | undefined => ART[key];

const stage = (art: string | undefined): CSSProperties => ({
  position: 'relative', width: '100%', height: 76, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  borderRadius: 'calc(var(--sm2-radius-lg) - 4px)', border: '1px solid color-mix(in srgb, var(--sm2-gold-fill) 45%, transparent)',
  background: art
    ? `center / cover no-repeat url(${art})`
    : 'radial-gradient(ellipse at 50% 38%, color-mix(in srgb, var(--sm2-primary-fill) 38%, transparent), transparent 70%), linear-gradient(180deg, color-mix(in srgb, var(--sm2-primary-fill) 18%, var(--sm2-surface-2)), var(--sm2-surface-2))',
});

export function PerfilCardTile({ cardKey, attr, label, ariaLabel, onClick, children }: {
  cardKey: string; attr: object; label: string; ariaLabel: string; onClick: () => void; children: ReactNode;
}) {
  return (
    <button type="button" {...attr} data-perfil-card={cardKey} data-perfil-card-art={ART[cardKey] ? 'on' : 'off'} onClick={onClick} aria-label={ariaLabel}
      style={{
        flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 6, cursor: 'pointer',
        color: 'var(--sm2-ink)', background: 'var(--sm2-surface)', border: '1px solid var(--sm2-line)', borderRadius: 'var(--sm2-radius-lg)',
      }}>
      <span data-perfil-card-stage style={stage(ART[cardKey])}>{children}</span>
      <span style={{ ...sm2Text, fontWeight: 600, paddingBottom: 4 }}>{label}</span>
    </button>
  );
}
