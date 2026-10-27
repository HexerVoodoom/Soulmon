/**
 * OS 20 NOVOS SOULMON (17 + fada/industrial/planta de 27/10/2026) — DADOS PUROS (sem arte; 15/10/2026, REGISTRO §67/§68). Dono único de id, linha, elemento, nomes e
 * nomes dos golpes. A arte (PNG) é anexada por `novosSoulmon.ts`; este módulo existe para a Arena (`arena.ts`, sem imports
 * de asset) escolher e nomear a criatura.
 *
 * FORMAS ALTAS (Ultimate/Mega/Ultra) JÁ INSTALADAS (§78). Para nova forma/criatura: 1) ponha o PNG em `assets/soulmon/novos/`,
 * 2) liste o nome em `FORMAS_ALTAS` abaixo e 3) o sprite em `FORMAS_ALTAS_ART` (`novosSoulmon.ts`). Sem isso a forma NÃO
 * existe (criatura sem a forma: slots 4/5 caem nas linhas antigas; chefe da Arena usa o Champion).
 */
export type NovoLine = 'poder' | 'harmonia' | 'benevolencia';
export type NovoStage = 'rookie' | 'champion';
export type NovoHighStage = 'ultimate' | 'mega' | 'ultra';
export type NovoAnyStage = NovoStage | NovoHighStage;
export interface NovoAttack { pt: string; en: string }
export interface NovoData {
  id: string;
  line: NovoLine;
  element: string;
  rookie: string;
  champion: string;
  basico: NovoAttack;
  especial: NovoAttack;
}

export const NOVOS_DATA: readonly NovoData[] = [
  { id: 'embrit', line: 'poder', element: 'fogo', rookie: 'Embrit', champion: 'Pyrolisk',
    basico: { pt: "Cuspe de Brasa", en: "Ember Spit" }, especial: { pt: "Erupção de Magma", en: "Magma Eruption" } },
  { id: 'spinvex', line: 'poder', element: 'vileza', rookie: 'Spinvex', champion: 'Spinvorax',
    basico: { pt: "Farpa Ácida", en: "Acid Barb" }, especial: { pt: "Veneno Voraz", en: "Ravenous Venom" } },
  { id: 'ossumi', line: 'poder', element: 'morte', rookie: 'Ossumi', champion: 'Ceifoss',
    basico: { pt: "Toque Fúnebre", en: "Grave Touch" }, especial: { pt: "Ceifa Final", en: "Final Reap" } },
  { id: 'umbrae', line: 'poder', element: 'sombra', rookie: 'Umbrae', champion: 'Noctherix',
    basico: { pt: "Garra Sombria", en: "Shade Claw" }, especial: { pt: "Eclipse Umbral", en: "Umbral Eclipse" } },
  { id: 'brawnu', line: 'poder', element: 'vigor', rookie: 'Brawnu', champion: 'Brawnor',
    basico: { pt: "Cabeçada Firme", en: "Steady Bash" }, especial: { pt: "Investida Incansável", en: "Relentless Charge" } },
  { id: 'kenjo', line: 'poder', element: 'marcial', rookie: 'Kenvar', champion: 'Shihanor',
    basico: { pt: "Soco Duplo", en: "Twin Strike" }, especial: { pt: "Mil Palmas", en: "Thousand Palms" } },
  { id: 'runix', line: 'harmonia', element: 'arcano', rookie: 'Runeko', champion: 'Arcanowl',
    basico: { pt: "Dardo Rúnico", en: "Rune Bolt" }, especial: { pt: "Selo Arcano", en: "Arcane Seal" } },
  { id: 'chronib', line: 'harmonia', element: 'tempo', rookie: 'Chronib', champion: 'Tempora',
    basico: { pt: "Pulso Temporal", en: "Time Pulse" }, especial: { pt: "Reversão", en: "Rewind Burst" } },
  { id: 'voidlet', line: 'harmonia', element: 'espaco', rookie: 'Voidlet', champion: 'Rifthound',
    basico: { pt: "Estocada Dobrada", en: "Warp Jab" }, especial: { pt: "Fenda Espacial", en: "Rift Tear" } },
  { id: 'gravul', line: 'harmonia', element: 'gravidade', rookie: 'Gravul', champion: 'Gravodon',
    basico: { pt: "Peso Morto", en: "Heavy Slam" }, especial: { pt: "Poço Gravitacional", en: "Gravity Well" } },
  { id: 'vibri', line: 'harmonia', element: 'som', rookie: 'Vibri', champion: 'Sonorana',
    basico: { pt: "Estalo Sônico", en: "Sonic Snap" }, especial: { pt: "Rugido Ressonante", en: "Resonant Roar" } },
  { id: 'voltrix', line: 'harmonia', element: 'eletricidade', rookie: 'Voltrix', champion: 'Fulgurion',
    basico: { pt: "Faísca", en: "Spark Zap" }, especial: { pt: "Raio em Cadeia", en: "Chain Lightning" } },
  { id: 'sprouti', line: 'benevolencia', element: 'vida', rookie: 'Sprouti', champion: 'Florestag',
    basico: { pt: "Chicote de Cipó", en: "Vine Lash" }, especial: { pt: "Florescer", en: "Bloom Burst" } },
  { id: 'solion', line: 'benevolencia', element: 'luz', rookie: 'Solion', champion: 'Aurolion',
    basico: { pt: "Raio de Luz", en: "Light Beam" }, especial: { pt: "Nova Radiante", en: "Radiant Nova" } },
  { id: 'bubbo', line: 'benevolencia', element: 'agua', rookie: 'Bubbo', champion: 'Tidotter',
    basico: { pt: "Jato d'Água", en: "Water Jet" }, especial: { pt: "Maremoto", en: "Tidal Surge" } },
  { id: 'pebblo', line: 'benevolencia', element: 'terra', rookie: 'Pebblo', champion: 'Terrarhino',
    basico: { pt: "Pedrada", en: "Rock Toss" }, especial: { pt: "Tremor", en: "Quake Stomp" } },
  { id: 'zephir', line: 'benevolencia', element: 'ar', rookie: 'Zephir', champion: 'Cirruwing',
    basico: { pt: "Bicada de Vento", en: "Gust Peck" }, especial: { pt: "Ciclone", en: "Cyclone Dive" } },
  // 27/10/2026: os 3 elementos novos (fada, industrial, planta) viram criatura base, com as 5 formas.
  { id: 'glimmi', line: 'benevolencia', element: 'fada', rookie: 'Glimmi', champion: 'Fayloom',
    basico: { pt: "Pó de Fada", en: "Fairy Dust" }, especial: { pt: "Chuva de Brilho", en: "Glitter Storm" } },
  { id: 'smeltu', line: 'poder', element: 'industrial', rookie: 'Smeltu', champion: 'Cruciblor',
    basico: { pt: "Jato Fundido", en: "Molten Splash" }, especial: { pt: "Fundição Pesada", en: "Heavy Pour" } },
  { id: 'brotto', line: 'harmonia', element: 'planta', rookie: 'Brotto', champion: 'Thornhog',
    basico: { pt: "Espinho de Folha", en: "Leaf Quill" }, especial: { pt: "Brotar", en: "Overgrowth" } },
];

/** Nome das formas altas que JÁ têm arte instalada, por criatura. Leva de 15/10/2026 aprovada pelo dono (REGISTRO §78); nomes curtos propostos no tom do jogo (PT = EN, como os das criaturas). */
export const FORMAS_ALTAS: Readonly<Record<string, Partial<Record<NovoHighStage, string>>>> = {
  embrit: { ultimate: 'Ignivorn', mega: 'Magmatyr', ultra: 'Infernarch' },
  spinvex: { ultimate: 'Toxivorax', mega: 'Venomaw', ultra: 'Pestilarch' },
  ossumi: { ultimate: 'Ceifaron', mega: 'Ossolich', ultra: 'Thanatarch' },
  umbrae: { ultimate: 'Noctyrant', mega: 'Umbralord', ultra: 'Eclipsarch' },
  brawnu: { ultimate: 'Brawnoth', mega: 'Vigorath', ultra: 'Hercularch' },
  kenjo: { ultimate: 'Shihanox', mega: 'Bushidor', ultra: 'Kenzarch' },
  runix: { ultimate: 'Sigilowl', mega: 'Runemancer', ultra: 'Arcanarch' },
  chronib: { ultimate: 'Horavex', mega: 'Eternox', ultra: 'Chronarch' },
  voidlet: { ultimate: 'Riftfang', mega: 'Voidwarden', ultra: 'Cosmarch' },
  gravul: { ultimate: 'Gravothar', mega: 'Massivor', ultra: 'Singularch' },
  vibri: { ultimate: 'Sonorath', mega: 'Echoreign', ultra: 'Cacophonarch' },
  voltrix: { ultimate: 'Fulgurex', mega: 'Stormion', ultra: 'Voltarch' },
  sprouti: { ultimate: 'Sylvastag', mega: 'Verdantlord', ultra: 'Edenarch' },
  solion: { ultimate: 'Luminion', mega: 'Solarion', ultra: 'Radiarch' },
  bubbo: { ultimate: 'Tidalord', mega: 'Oceanor', ultra: 'Abyssarch' },
  pebblo: { ultimate: 'Terraclast', mega: 'Geodon', ultra: 'Tectonarch' },
  zephir: { ultimate: 'Cirrostrix', mega: 'Zenithawk', ultra: 'Aeriarch' },
  glimmi: { ultimate: 'Sylphine', mega: 'Faeregent', ultra: 'Feyarch' },
  smeltu: { ultimate: 'Foundrax', mega: 'Smelterion', ultra: 'Forgearch' },
  brotto: { ultimate: 'Briarmor', mega: 'Thornlord', ultra: 'Florarch' },
};

export const NOVO_IDS: readonly string[] = NOVOS_DATA.map(n => n.id);
const BY_ID: Readonly<Record<string, NovoData>> = Object.fromEntries(NOVOS_DATA.map(n => [n.id, n]));
export const novoDataById = (id: string | undefined | null): NovoData | undefined => (id ? BY_ID[id] : undefined);

/** O `stage` de um inimigo da masmorra (`<id>-<tier>`) -> a criatura nova, ou `undefined` (linha antiga). */
export function novoDataOfStage(stage: string | undefined | null): NovoData | undefined {
  if (!stage) return undefined;
  const i = stage.indexOf('-'); // o id não tem hífen; o tier pode (`baby-i`)
  return i > 0 ? BY_ID[stage.slice(0, i)] : undefined;
}

/** A forma `stage` existe (arte instalada) para a criatura? Rookie/Champion sempre. */
export function novoHasForm(id: string, stage: NovoAnyStage): boolean {
  return stage === 'rookie' || stage === 'champion' || !!FORMAS_ALTAS[id]?.[stage];
}

export function novoFormName(n: NovoData, stage: NovoAnyStage): string {
  if (stage === 'rookie') return n.rookie;
  if (stage === 'champion') return n.champion;
  return FORMAS_ALTAS[n.id]?.[stage] ?? n.champion;
}

/**
 * Sorteio de UMA criatura nova para um slot. `prefer` = formas desejadas em ordem de preferência (ex. `['ultra','mega']`);
 * só entram criaturas que TÊM a forma (a 1ª preferência que alguém tem vence); sem nenhuma, `null` (o chamador cai no
 * fallback). `used` = criaturas já na onda: saem do sorteio enquanto sobrar alguma. Exatamente 1 chamada de `rng`.
 * `themeElements` (opcional, Arena por tema): só entram criaturas desse(s) elemento(s) — sem a forma pedida no tema, vale a próxima
 * preferência DO TEMA, nunca uma criatura de fora.
 */
export function pickNovo(
  prefer: readonly NovoAnyStage[], used: ReadonlySet<string>, rng: () => number, themeElements?: readonly string[],
): { data: NovoData; stage: NovoAnyStage } | null {
  for (const stage of prefer) {
    const have = NOVOS_DATA.filter(n => novoHasForm(n.id, stage) && (!themeElements?.length || themeElements.includes(n.element)));
    if (have.length === 0) continue;
    const fresh = have.filter(n => !used.has(n.id));
    const pool = fresh.length > 0 ? fresh : have;
    return { data: pool[Math.floor(rng() * pool.length)], stage };
  }
  return null;
}
