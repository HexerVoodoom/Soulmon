/**
 * ARTE DA FEIRA — o REGISTRO para a leva de arte (`docs/design/areas/prompts/arena.md`
 * §5/§6, `00-BIBLIA-DAS-AREAS.md`). Hoje tudo é PLACEHOLDER em SVG/CSS na paleta do Visor
 * (`components/guild/FeiraVisor.tsx`); quando a arte real existir, é SÓ preencher `FAIR_ART`
 * (id → URL importada) — a sala já prefere a imagem quando ela existe.
 *
 * Ids que a leva de arte deve entregar (convenção: `<familia>-<area>-<id do lote>`):
 *  · `fair-fenomeno-aberto` / `-ferido` / `-dissipado` — sprite 384² alfa, MESMA massa nos
 *    três estados (lajes de pedra-petróleo com fendas turquesa; sem rosto, sem olho, sem HP);
 *  · `fx-fair-nevoa` / `-mare` / `-estatica` / `-enxame` — FX sobre o visor, um por tipo;
 *  · `npc-arena-feira` — o busto do Fanfa (`assets/soulmon/npcs`, `LOT_NPC_ART['arena:feira']`);
 *  · `lote-arena-feira` — a construção do lote (`assets/soulmon/areas`, `ARENA_LOT_ART.feira`).
 * O estado `ferido` é um BOOLEANO do servidor (dano ≥ metade); o cliente nunca conhece HP.
 */
import type { GuildRaid } from './community';
import type { RaidPhenomenon } from './guildRules';

export type FairState = 'aberto' | 'ferido' | 'dissipado';

export const FAIR_ART_IDS = {
  fenomeno: ['fair-fenomeno-aberto', 'fair-fenomeno-ferido', 'fair-fenomeno-dissipado'],
  fx: ['fx-fair-nevoa', 'fx-fair-mare', 'fx-fair-estatica', 'fx-fair-enxame'],
  npc: 'npc-arena-feira',
  lote: 'lote-arena-feira',
} as const;

/** id → URL da arte real. Vazio = usa o placeholder desenhado. */
export const FAIR_ART: Partial<Record<string, string>> = {};

/** Os três estados visuais: `aberta && !ferido` · `aberta && ferido` · `dissipada`. */
export const fairStateOf = (raid: Pick<GuildRaid, 'state' | 'ferido'>): FairState =>
  raid.state === 'dissipada' ? 'dissipado' : raid.ferido ? 'ferido' : 'aberto';

export const fairFxId = (p: RaidPhenomenon) => `fx-fair-${p}` as const;
