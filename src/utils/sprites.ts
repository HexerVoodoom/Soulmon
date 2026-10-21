/**
 * WP1.12 — O FILTRO DE TONALIDADE DO DEMO.
 *
 * Quem entra pelo caminho grátis recebe um dos três personagens pré-prontos —
 * iguais para todo mundo. O tint é a menor coisa possível que transforma um
 * personagem emprestado em algo escolhido, e é o oposto de uma mecânica:
 * nenhuma regra, nenhum atributo, nenhum preço e nenhuma evolução olham para
 * ele. Some inteiro quando a pessoa gera a criatura dela.
 *
 * `hue-rotate` e não sprites novos: são três variações de graça sobre a arte
 * que já existe, sem um byte a mais no bundle.
 */
export const DEMO_TINTS = [0, 40, 200, 300] as const;

export function demoTintFilter(tint: number | undefined): string | undefined {
  const i = Math.max(0, Math.min(DEMO_TINTS.length - 1, Math.floor(tint ?? 0)));
  const graus = DEMO_TINTS[i];
  return graus ? `hue-rotate(${graus}deg)` : undefined;
}

// Stage → sprite map, shared by CompanionHUD and the dungeon minigame.
// D-104 (20/10/2026): a ÁRVORE GENÉRICA (gato-coruja: rookie/champion-*/ultimate-*/mega-*/ultra .png) foi APOSENTADA —
// o piso de quem não tem linha nem arte própria é um INICIAL atual (`fallbackStarterFor`).
export { default as DUNGEON_SPIRIT_SPRITE } from '../assets/soulmon/dungeon-spirit.png';

// 3 linhas completas de Soulmon (placeholder, até o Higgsfield gerar as do
// usuário) — usadas como inimigos "de verdade" na masmorra, uma por tier.
import kaelenRookie from '../assets/soulmon/lines/kaelen-rookie.png';
import kaelenChampion from '../assets/soulmon/lines/kaelen-champion-power.png';
import kaelenUltimate from '../assets/soulmon/lines/kaelen-ultimate-power.png';
import kaelenMega from '../assets/soulmon/lines/kaelen-mega-power.png';
import thalindraRookie from '../assets/soulmon/lines/thalindra-rookie.png';
import thalindraChampion from '../assets/soulmon/lines/thalindra-champion.png';
import thalindraUltimate from '../assets/soulmon/lines/thalindra-ultimate.png';
import thalindraMega from '../assets/soulmon/lines/thalindra-mega.png';
// As 3 linhas do oráculo com seed fixo (runs 1–3 de 18/08/2026, recortadas em
// 15/09/2026 — D1: entram na pré-seleção do jogador free).
import igniRookie from '../assets/soulmon/lines/igni-rookie.png';
import igniChampion from '../assets/soulmon/lines/igni-champion.png';
import igniUltimate from '../assets/soulmon/lines/igni-ultimate.png';
import igniMega from '../assets/soulmon/lines/igni-mega.png';
import astraseRookie from '../assets/soulmon/lines/astrase-rookie.png';
import astraseChampion from '../assets/soulmon/lines/astrase-champion.png';
import astraseUltimate from '../assets/soulmon/lines/astrase-ultimate.png';
import astraseMega from '../assets/soulmon/lines/astrase-mega.png';
// Os 5 PERSONAGENS INICIAIS (07/10/2026, pedido do dono): UM sprite por criatura,
// 512² (pixel art em grade grossa, alfa binário). A MESMA imagem serve a todos os
// estágios por enquanto — a evolução visual vem depois (limitação declarada).
import starterIndustrial from '../assets/soulmon/starters/industrial.png';
import starterNascente from '../assets/soulmon/starters/nascente.png';
import starterAlento from '../assets/soulmon/starters/alento.png';
import starterVida from '../assets/soulmon/starters/vida.png';
import starterMeteoro from '../assets/soulmon/starters/meteoro.png';

export const DUNGEON_LINE_SPRITES: Record<string, Record<'rookie' | 'champion' | 'ultimate' | 'mega', string>> = {
  kaelen: { rookie: kaelenRookie, champion: kaelenChampion, ultimate: kaelenUltimate, mega: kaelenMega },
  thalindra: { rookie: astraseRookie, champion: astraseChampion, ultimate: astraseUltimate, mega: astraseMega }, // 21/10/2026 (dono): o sprite antigo da Nimbrata não aparece mais em lugar nenhum
  igni: { rookie: igniRookie, champion: igniChampion, ultimate: igniUltimate, mega: igniMega },
  astrase: { rookie: astraseRookie, champion: astraseChampion, ultimate: astraseUltimate, mega: astraseMega },
};
/**
 * O NOME DE EXIBIÇÃO DE CADA LINHA — dono único.
 *
 * ⚠️ Estes três nomes estavam escritos à mão em TRÊS arquivos: aqui, no
 * `PREMADE_CHARACTERS` (`monetization.ts`) e no `petName` dos NPCs da
 * Biblioteca (`libraryNpcs.ts`). É o footgun 9 em forma de string — renomear
 * num lugar deixaria o inimigo da masmorra e o NPC da Biblioteca chamando a
 * MESMA criatura por outro nome, sem nada ficar vermelho. Descoberto ao
 * renomeá-los em 08/09/2026; os outros dois arquivos agora LEEM daqui.
 *
 * Este arquivo é o dono porque é o mais baixo da pilha: `monetization.ts` e
 * `libraryNpcs.ts` já importam dele, e o contrário criaria ciclo.
 *
 * ⚠️ **Nada de sufixo `-mon`** (`CLAUDE.md`, seção de arte): eles eram
 * Pyrakamon / Akashaoimon / Nimbratamon, e prefixo somado a sufixo fixo é o que
 * soletra nome de franquia alheia. O `id` da linha (`kaelen`, `orrin`,
 * `thalindra`) não muda — é ele que resolve o sprite, vai para o save e nomeia
 * os arquivos de arte.
 */
export const DUNGEON_LINE_NAMES: Record<string, string> = {
  kaelen: 'Pyraka', thalindra: 'Nimbrata',
  igni: 'Igni', astrase: 'Astria',
};

/**
 * AS LINHAS APOSENTADAS (D-78, 19/10/2026; Ignar e Lumel somados em 20/10/2026) — dono único.
 *
 * Akashai (`orrin`), Serah (`serah`), Nautil (`nautilu`), Ignar (`ignar`) e Lumel (`lumel`) são linhas DEFASADAS: o dono
 * mandou tirar o SPRITE delas de todo lugar visível (Match 3, masmorra, bestiário, sombras
 * do Pesadelo, NPC da Biblioteca, fallback por hash). Elas saíram de `DUNGEON_LINE_SPRITES`
 * e de `DUNGEON_LINE_NAMES` (roster hoje = 6 linhas × 4 tiers); os PNGs foram removidos.
 * O NOME Serah segue no lore/copy (REGISTRO §14) — aposentar o sprite não é aposentar o nome.
 *
 * ⚠️ O ID continua VÁLIDO em save/perfil antigo (`demoCharacterId`, `artLine`, `eggType`):
 * só a ARTE exibida muda. Quem recebe um desses ids cai num INICIAL atual
 * (`RETIRED_LINE_STAND_IN`) — o mesmo mecanismo de reserva do `opponentArt.ts`.
 * Id novo de linha aposentada? Acrescente aqui; nunca devolva o id ao roster.
 */
export const RETIRED_LINE_IDS = ['orrin', 'serah', 'nautilu', 'ignar', 'lumel'] as const;
export const RETIRED_LINE_STAND_IN: Readonly<Record<typeof RETIRED_LINE_IDS[number], StarterId>> = {
  orrin: 'industrial', serah: 'vida', nautilu: 'nascente',
  // 20/10/2026 (dono: "defasados, troca pelo Soulmon novo"): fogo -> Bolid; luz/ar -> Zefi.
  ignar: 'meteoro', lumel: 'alento',
};
export const isRetiredLineId = (id: unknown): id is typeof RETIRED_LINE_IDS[number] =>
  typeof id === 'string' && (RETIRED_LINE_IDS as readonly string[]).includes(id);
/** O id de arte a DESENHAR: linha aposentada vira o inicial de reserva; o resto passa igual. */
export const resolveArtLineId = (id: string | undefined): string | undefined =>
  isRetiredLineId(id) ? RETIRED_LINE_STAND_IN[id] : id;

/**
 * O `eggType` de um save (campo legado, só o HUD o lê): id aposentado (`ignar`/`lumel`/`serah`...) vira o inicial de
 * reserva, inicial atual passa igual, qualquer outra coisa (lixo, `undefined`) vira `fallback`. Dono único da migração.
 */
export function migrateEggType(raw: unknown, fallback: StarterId = 'meteoro'): StarterId {
  const r = typeof raw === 'string' ? resolveArtLineId(raw) : undefined;
  return isStarterId(r) ? r : fallback;
}

/**
 * OS 5 INICIAIS — dono único de id, arte e NOME (07/10/2026).
 *
 * São os personagens oferecidos ao jogador (`PREMADE_CHARACTERS`, `monetization.ts`)
 * e os únicos da demo local (`utils/demoMode.ts`). Ficam FORA de
 * `DUNGEON_LINE_SPRITES` de propósito: aquele mapa é o roster da masmorra e do
 * bestiário (9 linhas × 4 tiers, contadas por teste) e cinco criaturas de um
 * sprite só não têm os 4 tiers.
 *
 * ⚠️ **Um sprite por criatura, o MESMO em todos os estágios (rookie→ultra).**
 * Limitação declarada: a evolução visual vem depois. A mecânica de evolução não
 * muda; só a pele repete.
 *
 * ⚠️ Nada de sufixo `-mon` nos nomes (`CLAUDE.md`, seção de arte) — a régua é
 * `sprites.dungeonRoster.test.ts`. O `id` é o nome do arquivo de arte
 * (`starters/<id>.png`) e vai para o save (`demoCharacterId`): não renomeie.
 */
export type StarterId = 'industrial' | 'nascente' | 'alento' | 'vida' | 'meteoro';
export const STARTER_IDS: readonly StarterId[] = ['industrial', 'nascente', 'alento', 'vida', 'meteoro'];
export const STARTER_SPRITES: Record<StarterId, string> = {
  industrial: starterIndustrial, nascente: starterNascente, alento: starterAlento,
  vida: starterVida, meteoro: starterMeteoro,
};
export const STARTER_NAMES: Record<StarterId, string> = {
  industrial: 'Crato', nascente: 'Brooka', alento: 'Zefi', vida: 'Oaken', meteoro: 'Bolid',
};
export function isStarterId(id: unknown): id is StarterId {
  return typeof id === 'string' && (STARTER_IDS as readonly string[]).includes(id);
}

/** Os 6 ids ANTIGOS de personagem pronto: seguem resolvendo sprite (save antigo), mas não são mais oferecidos. */
export const LEGACY_PREMADE_IDS = ['kaelen', 'orrin', 'thalindra', 'igni', 'nautilu', 'astrase'] as const;
export type LegacyPremadeId = typeof LEGACY_PREMADE_IDS[number];
/** Todo `demoCharacterId` válido num save: os 5 novos + os 6 antigos. */
export type DemoCharacterId = StarterId | LegacyPremadeId;
export const DEMO_CHARACTER_IDS: readonly DemoCharacterId[] = [...STARTER_IDS, ...LEGACY_PREMADE_IDS];

/** Sprite de inimigo de masmorra: sorteia uma das nossas linhas pelo tier
 *  (baby-i/ii caem no rookie da linha; mega cobre ultimate também).
 *  `excludeLine` tira do sorteio a linha que o próprio jogador está usando
 *  (modo demo), pra ninguém encarar um espelho de si mesmo. */
export function getDungeonEnemySprite(tier: string, excludeLine?: string, rng: () => number = Math.random): { sprite: string; name: string; line: string } {
  const all = Object.keys(DUNGEON_LINE_SPRITES);
  const lines = all.filter(l => l !== excludeLine);
  const pool = lines.length > 0 ? lines : all;
  const line = pool[Math.floor(rng() * pool.length)];
  const stage = tier === 'baby-i' || tier === 'baby-ii' ? 'rookie'
    : tier === 'rookie' ? 'rookie'
    : tier === 'champion' ? 'champion'
    : tier === 'ultimate' ? 'ultimate'
    : 'mega';
  return { sprite: DUNGEON_LINE_SPRITES[line][stage], name: DUNGEON_LINE_NAMES[line], line };
}

import { getStageLevel } from '../types/progression';
import { CORVO_LINE, CORVO_SPRITES, CORVO_SPRITES_256, corvoSpriteFor } from './corvoPet';

/**
 * O PISO (D-104): estágio sem linha de arte e sem sprite próprio — jogador sem `demoCharacterId` (conta com criatura gerada ainda
 * sem arte no acervo), id de estágio antigo (nome de espécie) ou ramo da árvore. NUNCA a árvore genérica aposentada: é um dos 5
 * INICIAIS atuais, escolhido por hash estável do id do estágio (o mesmo id é sempre a mesma criatura). Só muda a arte exibida —
 * o id guardado no save continua válido.
 */
export function fallbackStarterFor(stage: string): StarterId {
  return STARTER_IDS[hashId(stage.toLowerCase()) % STARTER_IDS.length];
}

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/** Tiers com arte própria nas linhas (`lines/<linha>-<tier>.png`). */
export type LineTier = 'rookie' | 'champion' | 'ultimate' | 'mega';

/**
 * A LINHA e o TIER por trás de um estágio — a mesma resolução de
 * `getSpriteForStage`, sem o sprite: demo → a linha escolhida; qualquer outro
 * caso (inicial, corvo, árvore do jogador, id legado — o piso é um inicial
 * por hash, D-104) → `null`, porque aí a arte não é de linha. Consumido por `lineIcons.ts` (rodada 2: ícones-ficha 64²/32²).
 */
export function resolveLineForStage(stage: string, demoCharacterIdRaw?: string): { line: string; tier: LineTier } | null {
  const demoCharacterId = resolveArtLineId(demoCharacterIdRaw);
  const key = stage.toLowerCase();
  const level = getStageLevel(key);
  const tier = (level === 'ultra' ? 'mega' : level) as LineTier;
  if (demoCharacterId === CORVO_LINE) return null; // arte própria por forma (`corvoPet.ts`)
  if (isStarterId(demoCharacterId)) return null; // arte própria, um sprite só (`STARTER_SPRITES`)
  if (demoCharacterId && DUNGEON_LINE_SPRITES[demoCharacterId]) return { line: demoCharacterId, tier };
  return null; // D-104: sem linha → piso = inicial (`fallbackStarterFor`), que não tem ícone-ficha
}

/**
 * PARA ONDE A ARTE OLHA (11/10/2026, "os pets andam de costas"). Dono único.
 *
 * A regra antiga ("toda arte nossa olha para a DIREITA") era falsa para parte do
 * acervo — conferido sprite a sprite: estas linhas são desenhadas olhando para a
 * ESQUERDA, e o espelhamento do passeio (`scaleX(-1)` ao ir para a esquerda) as
 * fazia andar de costas. O resto (linhas de frente, a árvore do Soulmon,
 * `nascente`) olha para a direita ou de frente, e segue sem mudança. Arte gerada
 * pelo jogador (acervo) não declara lado: tratada como direita.
 * Linha NOVA com arte de perfil: declare aqui, senão anda de costas.
 */
export const LEFT_FACING_LINES: ReadonlySet<string> = new Set(['igni', 'kaelen', CORVO_LINE]);

/**
 * Os INICIAIS (um sprite só, `STARTER_SPRITES`) cuja arte olha para a ESQUERDA.
 * Auditoria de 14/10/2026, sprite a sprite (`docs/AUDITORIA-FACING-GRATUITOS.md`):
 * `meteoro` (Bolid) TINHA rosto e pernas voltados à esquerda; em 20/10/2026 os cinco
 * sprites foram trocados pelos novos do dono e todos olham para a direita ou de frente,
 * então a lista ficou VAZIA (o mecanismo continua para arte futura).
 */
export const LEFT_FACING_STARTERS: ReadonlySet<string> = new Set<string>(); // vazio desde 20/10/2026: a arte nova do Bolid olha para a direita

export function artFacesLeft(stage: string, demoCharacterIdRaw?: string): boolean {
  const demoCharacterId = resolveArtLineId(demoCharacterIdRaw);
  if (demoCharacterId === CORVO_LINE) return true;
  if (isStarterId(demoCharacterId)) return LEFT_FACING_STARTERS.has(demoCharacterId);
  const r = resolveLineForStage(stage, demoCharacterId);
  return !!r && LEFT_FACING_LINES.has(r.line);
}

let facesLeftUrls: Set<string> | null = null;
/**
 * A URL deste sprite é de arte que olha para a ESQUERDA (linhas de `LEFT_FACING_LINES`, inicial `meteoro`, corvo)? Existe para o
 * COMBATE (`BattleStage`), que recebe só a URL do sprite: o palco fixa os lados (eu à esquerda olhando à direita, inimigo à direita
 * olhando à esquerda), então arte de perfil esquerdo precisa do espelho INVERSO do da arte de perfil direito — senão o bicho luta
 * de costas. Sprite próprio gerado (acervo) não está no conjunto: é tratado como direita, igual à Home.
 */
export function spriteUrlFacesLeft(url: string | undefined): boolean {
  if (!url) return false;
  if (!facesLeftUrls) {
    const set = new Set<string>();
    for (const line of LEFT_FACING_LINES) {
      const l = DUNGEON_LINE_SPRITES[line];
      if (l) Object.values(l).forEach(u => set.add(u));
    }
    LEFT_FACING_STARTERS.forEach(id => { if (isStarterId(id)) set.add(STARTER_SPRITES[id]); });
    Object.values(CORVO_SPRITES).forEach(u => set.add(u));
    Object.values(CORVO_SPRITES_256).forEach(u => set.add(u));
    facesLeftUrls = set;
  }
  return facesLeftUrls.has(url);
}

/**
 * OS SPRITES PRÓPRIOS, para TODA tela (20/10/2026, dono: "na masmorra aparece aquele Soulmon de fogo, não o que gerou pra mim").
 * Dezenas de telas (Masmorra, Arena, Pesadelo, Torneio, jogos da mente, Pet…) escolhem a arte do pet só por `getSpriteForStage(estágio, linha)`
 * e nunca liam o acervo gerado — quem tem criatura do Oráculo via o inicial de reserva (o Meteoro, de fogo) lá dentro. O `App` registra aqui, a cada
 * mudança do acervo, o que `displaySprite` já mostra na Home (`forma → url`), e esta função o devolve quando o pet NÃO é de uma linha pronta.
 * `fallback` é o cristal "chocando" enquanto ainda não existe nenhum sprite próprio. Estado de módulo, mas só ESCRITO por `setOwnSprites`
 * (idempotente) e vazio por padrão — testes e telas sem o `App` seguem exatamente como antes.
 */
let ownSprites: Readonly<Record<string, string>> = {};
let ownFallback: string | undefined;
export function setOwnSprites(map: Readonly<Record<string, string>>, fallback?: string): void {
  ownSprites = map;
  ownFallback = fallback;
}

export function getSpriteForStage(stage: string, demoCharacterIdRaw?: string, size?: 256): string {
  const demoCharacterId = resolveArtLineId(demoCharacterIdRaw); // D-78: linha aposentada → inicial de reserva
  const key = stage.toLowerCase();
  // O corvinho do administrador (`utils/corvoPet.ts`, dono único): uma arte
  // por forma. O 2º parâmetro é a LINHA de arte do save — `spriteLineOf`.
  if (demoCharacterId === CORVO_LINE) return corvoSpriteFor(key, size);
  // Os 5 iniciais: o MESMO sprite em todos os estágios (limitação declarada).
  // 21/10/2026 (dono): se o jogador já tem o sprite GERADO dele, ele vence o inicial de reserva (contas que mostravam o Meteoro).
  if (isStarterId(demoCharacterId)) return ownSprites[key] ?? STARTER_SPRITES[demoCharacterId];
  // Modo demo (utils/monetization.ts): personagem pré-pronto, sem branch —
  // um sprite só por nível (rookie/champion/ultimate/mega; ultra reusa mega).
  if (demoCharacterId && DUNGEON_LINE_SPRITES[demoCharacterId]) {
    const levelRaw = key === 'rookie' || key === 'ultra' ? key : key.split('-')[0];
    const level = (levelRaw === 'ultra' ? 'mega' : levelRaw) as 'rookie' | 'champion' | 'ultimate' | 'mega';
    const line = DUNGEON_LINE_SPRITES[demoCharacterId];
    return line[level] ?? line.rookie;
  }
  // O Soulmon PRÓPRIO (criatura do Oráculo) já adotado no acervo; enquanto ele ainda não nasceu, o cristal (`setOwnSprites`).
  return ownSprites[key] ?? Object.values(ownSprites)[0] ?? ownFallback ?? STARTER_SPRITES[fallbackStarterFor(key)];
}

