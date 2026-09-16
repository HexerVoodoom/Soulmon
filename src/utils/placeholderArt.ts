// Placeholders de FORMA AINDA NÃO GERADA (leva sprites-20260915 v3, 256² alfa):
// o CRISTAL DO MEIO da cena da Home (`home-scene`, os três cristais presos por
// garras de cobre e cabos sobre a base de pedra), com um ser adormecido
// dentro, esperando para nascer — referência e pedido do dono, 15/09/2026:
//   dormant — o cristal apagado, silhueta escura: o rookie do pago ainda vai nascer
//   forming — o cristal aceso, o ser brilhando: a forma está sendo gerada
//   glitch  — o cristal rachado em blocos: a geração falhou (pode pedir de novo)
// Consumidor: `EvolutionPath` (D1) — GERANDO → forming (rookie: dormant),
// RESERVA_FINAL → glitch; só para quem não é personagem pronto.
import dormant from '../assets/soulmon/placeholder/dormant.png';
import forming from '../assets/soulmon/placeholder/forming.png';
import glitch from '../assets/soulmon/placeholder/glitch.png';

export type PlaceholderId = 'dormant' | 'forming' | 'glitch';
export const PLACEHOLDER_ART: Record<PlaceholderId, string> = { dormant, forming, glitch };
