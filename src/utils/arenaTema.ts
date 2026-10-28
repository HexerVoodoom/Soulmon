// ---------------------------------------------------------------------------
// ARENA POR TEMA (27/10/2026) — REVOGADA em 28/10/2026 (REGISTRO-DE-DECISOES): a Arena sorteia entre TODOS os elementos (`arenaSorteio.ts`) e usa as arenas do Torneio. Este arquivo ficou SEM USO na Arena (tabela elemento→domínio de cenário, arte instalada).
//
// Dono único de duas regras PURAS (sem import de arte — a arte mora em `combatArt.ts`):
//   1. `arenaTemaElementos(id)`   — o elemento do jogador → os elementos BASE que valem como "do tema": o próprio (base) ou os
//      dois componentes (par derivado). Quem não é de nenhum (neutro, id desconhecido) devolve `[]` = sem tema.
//   2. `dominioDoElemento(id)`    — o elemento → o DOMÍNIO (`src/assets/dominios/<dominio>/`) cujos cenários valem para ele.
//
// A tabela elemento→domínio: os 17 domínios são 8 elementos do Oráculo (agua fogo terra ar sombra luz planta industrial) + 9
// reinos (akasha campina cavernas deserto floresta gelo oceano pantano picos). Os 8 do Oráculo têm domínio PRÓPRIO; os outros 12
// elementos-base NÃO têm — usam o domínio MAIS PRÓXIMO e entram no backlog (`docs/ASSETS-A-GERAR.md`, "Arena: cenários por elemento").
// ---------------------------------------------------------------------------
import { CLASS_ELEMENT_ORDER } from './soulProfile/types';
import { DERIVED_ELEMENT_PAIRS } from './soulProfile/derivedElements';

export const ARENA_DOMINIOS = [
  'agua', 'fogo', 'terra', 'ar', 'sombra', 'luz', 'planta', 'industrial',
  'akasha', 'campina', 'cavernas', 'deserto', 'floresta', 'gelo', 'oceano', 'pantano', 'picos',
] as const;
export type ArenaDominio = (typeof ARENA_DOMINIOS)[number];

/** Cada elemento BASE → o domínio dele. `proprio: true` = o domínio é do elemento; `false` = o mais próximo (cenário a gerar). */
export const DOMINIO_DO_ELEMENTO_BASE: Readonly<Record<string, { dominio: ArenaDominio; proprio: boolean }>> = {
  fogo: { dominio: 'fogo', proprio: true },
  agua: { dominio: 'agua', proprio: true },
  terra: { dominio: 'terra', proprio: true },
  ar: { dominio: 'ar', proprio: true },
  sombra: { dominio: 'sombra', proprio: true },
  luz: { dominio: 'luz', proprio: true },
  planta: { dominio: 'planta', proprio: true },
  industrial: { dominio: 'industrial', proprio: true },
  eletricidade: { dominio: 'picos', proprio: false },
  arcano: { dominio: 'akasha', proprio: false },
  tempo: { dominio: 'akasha', proprio: false },
  espaco: { dominio: 'akasha', proprio: false },
  gravidade: { dominio: 'cavernas', proprio: false },
  som: { dominio: 'cavernas', proprio: false },
  vileza: { dominio: 'pantano', proprio: false },
  morte: { dominio: 'pantano', proprio: false },
  vida: { dominio: 'floresta', proprio: false },
  fada: { dominio: 'campina', proprio: false },
  vigor: { dominio: 'campina', proprio: false },
  marcial: { dominio: 'deserto', proprio: false },
};

/** Pares derivados que TÊM um domínio exato (o do 1º componente seria o errado: gelo não é água, areia não é terra). */
const DOMINIO_DO_PAR: Readonly<Record<string, ArenaDominio>> = {
  gelo: 'gelo', areia: 'deserto', pantano: 'pantano', mare: 'oceano', abismo: 'oceano', correnteza: 'oceano',
};

const PAR_POR_ID = new Map(DERIVED_ELEMENT_PAIRS.map(d => [d.id, d.componentes as readonly string[]]));

/** Os elementos BASE do tema de um elemento do jogador: `[X]` (base), `[A, B]` (par derivado) ou `[]` (sem tema). */
export function arenaTemaElementos(id: string | null | undefined): string[] {
  if (!id) return [];
  // planta e industrial são BASE e têm domínio PRÓPRIO (o alias para vida/aço foi apagado em 27/10/2026).
  const mapped = id;
  if ((CLASS_ELEMENT_ORDER as readonly string[]).includes(mapped)) return [mapped];
  return [...(PAR_POR_ID.get(mapped) ?? [])];
}

/** O domínio dos cenários do elemento (base ou par), ou `null` se o elemento não tem tema (neutro/desconhecido). */
export function dominioDoElemento(id: string | null | undefined): ArenaDominio | null {
  if (!id) return null;
  const mapped = id;
  const par = DOMINIO_DO_PAR[mapped];
  if (par) return par;
  const [primeiro] = arenaTemaElementos(mapped);
  return primeiro ? DOMINIO_DO_ELEMENTO_BASE[primeiro]?.dominio ?? null : null;
}

/** Quantos cenários cada domínio tem (`masmorra-1..3`). */
export const ARENA_CENARIOS_POR_DOMINIO = 3;

/** Qual dos cenários do domínio vale numa rodada (1-based): determinístico pela semente da run, nunca `Math.random`. */
export function arenaVarianteDaRodada(seed: number, rodada: number): number {
  return Math.abs(((seed | 0) + Math.imul(rodada, 0x9e3779b1)) | 0) % ARENA_CENARIOS_POR_DOMINIO;
}
