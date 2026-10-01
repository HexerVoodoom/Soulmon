/**
 * ARTE DA FEIRA — o REGISTRO para a leva de arte (`docs/design/areas/prompts/arena.md`
 * §5/§6, `00-BIBLIA-DAS-AREAS.md`). Hoje tudo é PLACEHOLDER em SVG/CSS na paleta do Visor
 * (`components/guild/FeiraVisor.tsx`). Desde a rodada 3 (30/09/2026, aprovada pelo dono)
 * `FAIR_ART` tem a arte real — 12 sprites de fenômeno (tipo × estado) e 4 FX — e a sala
 * prefere a imagem; o SVG continua como fallback para id sem arte.
 *
 * Ids que a leva de arte deve entregar (convenção: `<familia>-<area>-<id do lote>`):
 *  · `fair-fenomeno-<tipo>-<estado>` (tipo = nevoa/mare/estatica/enxame; estado =
 *    aberto/ferido/dissipado) — sprite 384² alfa, MESMA massa nos três estados (lajes de
 *    pedra-petróleo com fendas turquesa; sem rosto, sem olho, sem HP). Até a rodada 3 o id
 *    era genérico por estado; a arte saiu por tipo, e a chave passou a ser tipo × estado;
 *  · `fx-fair-nevoa` / `-mare` / `-estatica` / `-enxame` — FX sobre o visor, um por tipo;
 *  · `npc-arena-feira` — o busto do Fanfare (`assets/soulmon/npcs`, `LOT_NPC_ART['arena:feira']`);
 *  · `lote-arena-feira` — a construção do lote (`assets/soulmon/areas`, `ARENA_LOT_ART.feira`).
 * O estado `ferido` é um BOOLEANO do servidor (dano ≥ metade); o cliente nunca conhece HP.
 */
import type { GuildRaid } from './community';
import type { RaidPhenomenon } from './guildRules';

// Ids com hífen e o glob eager (mesmo molde de `emblemArt.ts`): o nome do arquivo
// É o id, e um arquivo que falte só faz aquele id cair no placeholder.
const FENOMENO_PNG = import.meta.glob<string>('../assets/soulmon/arena/fair-fenomeno-*.png', { eager: true, import: 'default' });
const FX_PNG = import.meta.glob<string>('../assets/soulmon/fx/fx-fair-*.png', { eager: true, import: 'default' });

export type FairState = 'aberto' | 'ferido' | 'dissipado';

export const FAIR_ART_IDS = {
  fenomeno: (['nevoa', 'mare', 'estatica', 'enxame'] as const).flatMap(t =>
    (['aberto', 'ferido', 'dissipado'] as const).map(e => `fair-fenomeno-${t}-${e}` as const)),
  fx: ['fx-fair-nevoa', 'fx-fair-mare', 'fx-fair-estatica', 'fx-fair-enxame'],
  npc: 'npc-arena-feira',
  lote: 'lote-arena-feira',
} as const;

/** id → URL da arte real. Id ausente = usa o placeholder desenhado. */
export const FAIR_ART: Partial<Record<string, string>> = {};
for (const [path, url] of Object.entries({ ...FENOMENO_PNG, ...FX_PNG })) {
  const m = path.match(/\/((?:fair-fenomeno|fx-fair)-[a-z-]+)\.png$/);
  if (m) FAIR_ART[m[1]] = url;
}

/** Os três estados visuais: `aberta && !ferido` · `aberta && ferido` · `dissipada`. */
export const fairStateOf = (raid: Pick<GuildRaid, 'state' | 'ferido'>): FairState =>
  raid.state === 'dissipada' ? 'dissipado' : raid.ferido ? 'ferido' : 'aberto';

export const fairFxId = (p: RaidPhenomenon) => `fx-fair-${p}` as const;

/** Id do sprite do fenômeno: tipo × estado (rodada 3). */
export const fairFenomenoId = (p: RaidPhenomenon, state: FairState) => `fair-fenomeno-${p}-${state}` as const;
