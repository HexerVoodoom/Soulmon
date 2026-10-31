/**
 * POOL DE BBs (Onboarding Velado D18-D21; plano §12). Manifesto do que existe; a arte (~200,
 * gerada uma vez pela /squad-arte) entra aqui linha a linha. Hoje: 3 entradas PLACEHOLDER que
 * apontam para sprites de rookie existentes (`lines/full/<linha>-rookie.png`).
 *
 * `sprite` é a CHAVE de `LINE_FULL_ART` (`lineFullArt.ts`), não uma URL: este módulo fica puro,
 * sem glob de assets. Quem renderiza resolve a chave.
 */
export interface BBEntry {
  id: string;
  /** Elemento base (ids de `VISUAL_ELEMENTS`) do BB. */
  elemento: string;
  /** Reino (agrupamento do oráculo); opcional enquanto a arte final não marca. */
  reino?: string;
  sprite: string;
}

export const BB_POOL: readonly BBEntry[] = [
  { id: 'bb-placeholder-1', elemento: 'luz', reino: 'ceu', sprite: 'thalindra-rookie' },
  { id: 'bb-placeholder-2', elemento: 'fogo', reino: 'brasa', sprite: 'thalindra-rookie' },
  { id: 'bb-placeholder-3', elemento: 'agua', reino: 'mare', sprite: 'thalindra-rookie' },
];

export interface LeituraOraculo { elemento?: string | null; reino?: string | null }

/** FNV-1a 32 bits: determinístico, sem dependência (o saveId já é hash; só precisa de um inteiro estável). */
function hash32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}

/**
 * D19: o BB do jogador. Determinístico por `saveId` (mesmo e-mail, mesmo BB); dentro do que combina com a
 * leitura (elemento, senão reino); sem combinação = qualquer do pool (fallback). Pool vazio = `null`.
 */
export function sortearBB(
  saveId: string,
  leitura?: LeituraOraculo | null,
  pool: readonly BBEntry[] = BB_POOL,
): BBEntry | null {
  if (pool.length === 0) return null;
  const porElemento = leitura?.elemento ? pool.filter(b => b.elemento === leitura.elemento) : [];
  const porReino = leitura?.reino ? pool.filter(b => b.reino === leitura.reino) : [];
  const candidatos = porElemento.length ? porElemento : porReino.length ? porReino : pool;
  return candidatos[hash32(String(saveId)) % candidatos.length];
}
