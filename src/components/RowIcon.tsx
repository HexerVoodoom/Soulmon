import type { ComponentType } from 'react';

/**
 * Ícone de linha/stat que aceita OU um componente lucide-react OU uma imagem
 * pixel-art nossa (src de PNG) — várias telas guardam `{ Icon, label, value }`
 * numa lista e renderizam `<row.Icon .../>` genericamente; esse componente
 * deixa a lista misturar os dois tipos sem quebrar esse padrão.
 */
export function RowIcon({ icon, size = 18, color }: { icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }> | string; size?: number; color?: string }) {
  if (typeof icon === 'string') {
    return <img src={icon} alt="" width={size} height={size} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />;
  }
  const Icon = icon;
  return <Icon size={size} color={color} strokeWidth={2.2} />;
}
