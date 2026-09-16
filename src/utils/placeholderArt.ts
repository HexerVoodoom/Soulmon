// Placeholders de FORMA AINDA NÃO GERADA (leva sprites-20260915, 256² alfa):
//   egg    — o rookie do jogador pago ainda está sendo gerado
//   cocoon — a próxima forma existe na árvore mas o sprite ainda não foi gerado
//   glitch — a geração falhou (o jogador pode pedir de novo)
// D1 (15/09/2026): o pago recebe o rookie gerado e as formas seguintes são
// geradas conforme avança — enquanto isso o visor mostra ISTO, dentro dele,
// nunca um SVG genérico. Ligação nos consumidores (`displaySprite`/`Reveal*`)
// é da Fase 2; hoje é só o mapa.
import egg from '../assets/soulmon/placeholder/egg.png';
import cocoon from '../assets/soulmon/placeholder/cocoon.png';
import glitch from '../assets/soulmon/placeholder/glitch.png';

export type PlaceholderId = 'egg' | 'cocoon' | 'glitch';
export const PLACEHOLDER_ART: Record<PlaceholderId, string> = { egg, cocoon, glitch };
