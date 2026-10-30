// Ícone dos PONTOS DE CONQUISTA (30/10/2026). Arte: `assets/soulmon/icones-ui/pontos-conquista.png` — pega sozinha pelo glob quando
// existe; sem ela cai no troféu dourado existente (mesmo padrão dos resolvedores "assume sozinho").
import trophyGold from '../assets/icons/icon-trophy-gold.png';

const found = import.meta.glob('../assets/soulmon/icones-ui/pontos-conquista.png', { eager: true, import: 'default' }) as Record<string, string>;

export const ACHIEVEMENT_POINTS_ICON: string = Object.values(found)[0] ?? trophyGold;
