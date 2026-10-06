/**
 * Combate v3 / PR8b — a arte do equipamento, carregada SOB DEMANDA (nada disto entra no chunk de entrada).
 *
 * Só os 13 ícones que já estão instalados em `assets/soulmon/combate-v3/equip` (decisão do dono: sem arte nova), usados COMO ESTÃO.
 * Peça ausente (ou falha de carga) devolve `null` e a tela cai no texto.
 */
const mods = import.meta.glob<string>('../assets/soulmon/combate-v3/equip/*.png', { import: 'default' });

const porNome = new Map<string, () => Promise<string>>();
for (const [caminho, load] of Object.entries(mods)) porNome.set(caminho.split('/').pop()!.replace(/\.png$/, ''), load);

const cache = new Map<string, Promise<string | null>>();

/** URL da peça (`eq-nucleo-t1`, `slot-rastro`, `fragmento`...) ou `null` se faltar/falhar. */
export function loadEquipArt(nome: string): Promise<string | null> {
  const hit = cache.get(nome);
  if (hit) return hit;
  const load = porNome.get(nome);
  const p = load ? load().catch(() => null) : Promise.resolve(null);
  cache.set(nome, p);
  return p;
}

/** Os nomes que existem (para teste). */
export function equipArtNames(): string[] {
  return [...porNome.keys()];
}
