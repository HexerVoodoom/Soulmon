/**
 * ÍCONES DAS TRAVESSIAS (96², pixel art, 21 peças: 7 regiões x 3 desafios) — um por desafio, o arquivo
 * leva o próprio id do desafio (`trv-c-<regiao>-<n>.png` ↔ `CrossingChallenge.id`), então a ligação é por
 * id, sem tabela. Id sem arte → `undefined` → o chamador cai no glifo da área da vida (`AreaGlyph`).
 */
const mods = import.meta.glob<string>('./trv-c-*.png', { eager: true, import: 'default' });

export const TRAVESSIA_ICON_ART: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(mods).map(([path, url]) => [/\/(trv-c-[a-z0-9-]+)\.png$/.exec(path)?.[1] ?? path, url]),
);

/** O ícone do desafio, ou `undefined` (sem arte). */
export const travessiaIcon = (challengeId: string | null | undefined): string | undefined =>
  challengeId ? TRAVESSIA_ICON_ART[challengeId] : undefined;
