/**
 * Combate v3 / PR7 — a arte da árvore de talentos, carregada SOB DEMANDA (nada disto entra no chunk de entrada).
 *
 * Só arte que já está na main (decisão do dono: sem arte nova), usada COMO ESTÁ. Se a peça faltar (ou o
 * carregamento falhar), `loadTalentArt` devolve `null` e a tela cai no fallback simples (só texto).
 */
const mods = import.meta.glob<string>('../assets/soulmon/combate-v3/{talentos,arvore,hud}/*.png', { import: 'default' });

const porNome = new Map<string, () => Promise<string>>();
for (const [caminho, load] of Object.entries(mods)) {
  const nome = caminho.split('/').pop()!.replace(/\.png$/, '');
  porNome.set(nome, load);
}

const cache = new Map<string, Promise<string | null>>();

/** URL da peça (`tal-pvp-01`, `talent-path-pve`, `talent-point-chip`...) ou `null` se faltar/falhar. */
export function loadTalentArt(nome: string): Promise<string | null> {
  const hit = cache.get(nome);
  if (hit) return hit;
  const load = porNome.get(nome);
  const p = load ? load().catch(() => null) : Promise.resolve(null);
  cache.set(nome, p);
  return p;
}

/** Os nomes que existem (para teste e para a tela saber se vale pedir). */
export function talentArtNames(): string[] {
  return [...porNome.keys()];
}
