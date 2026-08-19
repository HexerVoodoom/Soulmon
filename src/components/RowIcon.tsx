import type { ComponentType } from 'react';

/**
 * ⚠️ **OBSOLETO — não use em código novo. Use `components/ui/Icon`.**
 *
 * Ícone de linha/stat que aceita OU um componente lucide-react OU uma imagem
 * pixel-art nossa (src de PNG) — a "costura" entre as duas linguagens que o
 * `docs/PLANO-DESIGN.md` (§1.4) manda apagar assim que o último chamador migrar.
 *
 * Estado da migração (onda do revamp de Estatísticas/Pet/Evolução/Biblioteca):
 * `PlayerDetailModal` saiu daqui. **Sobraram dois chamadores**, e os dois têm
 * outro dono: `components/UnlockAccountModal.tsx` e `components/SettingsPage.tsx`.
 * Quando eles migrarem, este arquivo morre — não há mais nada segurando ele.
 */
export function RowIcon({ icon, size = 18, color }: { icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }> | string; size?: number; color?: string }) {
  if (typeof icon === 'string') {
    return <img src={icon} alt="" width={size} height={size} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />;
  }
  const Icon = icon;
  return <Icon size={size} color={color} strokeWidth={2.2} />;
}
