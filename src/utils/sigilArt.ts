// Sigilos do class-system (D:\Soulmon\Class-System\assets\sigilos → aqui em
// 15/09/2026, decisão D6 do dono): 45 peças de 192×192 com alfa — 21
// elementos/escolas base, 6 estados de talento (marcial, conjuracao,
// evocacao, longo_alcance, combate_fisico…), 11 famílias (`fam_*`), 6
// profissões (`prof_*`) e `soullink`.
//
// Fronteira de troca no molde de `elementIconArt.ts`: chave = nome do arquivo
// sem extensão. NÃO há consumidor hoje: entram na Ficha do Pet, DENTRO do
// visor, quando o Class-System for integrado ao Soulmon (a classe do bicho
// ainda não existe no save). Sem arte para a chave → `undefined`, e o
// consumidor mostra nada (nunca emoji, nunca box — `04` §5.4).
const modules = import.meta.glob('../assets/soulmon/sigilos/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const SIGIL_ART: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  const match = /\/([a-z_]+)\.png$/.exec(path);
  if (match) SIGIL_ART[match[1]] = url;
}

/** URL do sigilo de um elemento/escola/família/profissão, ou `undefined`. */
export const sigilArt = (id: string): string | undefined => SIGIL_ART[id];

/** Quantos sigilos o glob encontrou — guard de instalação (45). */
export const SIGIL_COUNT = Object.keys(SIGIL_ART).length;
