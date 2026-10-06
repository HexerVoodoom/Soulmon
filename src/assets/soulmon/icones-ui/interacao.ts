/**
 * ÍCONES DE INTERAÇÃO (04/10/2026) — as 7 folhas `ui-*` do dono (ciclo do dia, atividades ×3, passivas,
 * recompensas, status; ordem em `E:/Soulmon-assets/entrada-dono/ui-icones-MANIFEST.json`), fatiadas por
 * projeção, alfa binarizado, 96² nearest. Arquivos em `./interacao/`.
 *
 * ⚠️ EXCEÇÃO À TESE "O VISOR" (decisão do dono, 04/10/2026 — `docs/REGISTRO-DE-DECISOES.md`): estes ícones
 * são pixel art e entram na UI do APARELHO (folhas, catálogo, estatísticas, relatório). A regra "pixel só dentro
 * do visor" cede para ESTE set, e só para ele.
 *
 * Só o que tem slot é importado (o resto fica em disco, fora do bundle): o glob das atividades e das passivas
 * casa pelo id do catálogo; as peças avulsas vão por import nomeado. Sem arte → `undefined` → o chamador cai
 * no glifo de antes.
 */
import cicloNascerDoSol from './interacao/ciclo-nascer-do-sol.png';
import cicloLuaCrescente from './interacao/ciclo-lua-crescente.png';
import cicloLuaCheiaNuvem from './interacao/ciclo-lua-cheia-nuvem.png';
import recompensaEstrela from './interacao/recompensa-estrela.png';
import statusCadeado from './interacao/status-cadeado.png';
import statusRaio from './interacao/status-raio.png';

const porPrefixo = (mods: Record<string, string>, prefixo: string): Readonly<Record<string, string>> => {
  const out: Record<string, string> = {};
  for (const [path, url] of Object.entries(mods)) {
    const m = new RegExp(`/${prefixo}-([a-z0-9-]+)\.png$`).exec(path);
    if (m) out[m[1]] = url;
  }
  return out;
};

/** Id do `ACTIVITY_CATALOG` → ícone (28 dos 28 desde 05/10/2026). */
export const ACTIVITY_ICON_ART = porPrefixo(
  import.meta.glob<string>('./interacao/ativ-*.png', { eager: true, import: 'default' }), 'ativ');

/** Id de `PET_PASSIVES` (`utils/passives.ts`) → ícone. */
export const PASSIVE_ICON_ART = porPrefixo(
  import.meta.glob<string>('./interacao/passiva-*.png', { eager: true, import: 'default' }), 'passiva');

/** O glifo de cabeçalho do relatório da noite → a arte do ciclo do dia / recompensa. */
export const REPORT_HEAD_ART: Readonly<Record<'star' | 'nightlight' | 'bedtime' | 'wb_sunny', string>> = {
  star: recompensaEstrela,
  nightlight: cicloLuaCheiaNuvem,
  bedtime: cicloLuaCrescente,
  wb_sunny: cicloNascerDoSol,
};

/** Peças de status com slot: o cadeado (trancado) e o raio (skill básica). */
export const STATUS_ICON_ART = { cadeado: statusCadeado, raio: statusRaio } as const;
