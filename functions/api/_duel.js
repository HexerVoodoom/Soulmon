/**
 * DUELO FANTASMA — o PvP do Torneio em que os pets lutam SOZINHOS e o dono
 * TORCE. Dono único da regra do duelo no servidor.
 *
 * COMBATE v3 (PR5, `docs/squad-alpha-runs/combate-v3-01`, contexto §2.19): o motor é o núcleo
 * v3 (`_combate.js`, espelho de `src/utils/combate/` travado por `combate.parity.test.js`), e a ficha de
 * luta de cada lado é DERIVADA DO SAVE no servidor (`duelCombatant`/`duelSide`): o servidor nunca aceita
 * level, stats, família do especial, semente nem resultado vindos do cliente. O perfil público
 * (`profile.stage`/`profile.attrs`) deixou de ser fonte de luta.
 *
 * Como a luta é justa sem o cliente decidir nada:
 *  - a semente NÃO é escolhida pelo cliente NEM conhecida de antemão: ela é sorteada no servidor em
 *    `duelStart`, DEPOIS de a partida ser gasta, e o `match` usa a guardada — nunca uma enviada;
 *  - a ficha dos DOIS lados é congelada em `duelStart` (`pending.me`/`pending.opp`) e o `match` luta com
 *    ELA. Reler o save no `match` abriria uma brecha: com a semente na mão, o cliente editaria o save
 *    (família do especial, level) entre as duas chamadas até a luta virar vitória;
 *  - DESISTÊNCIA = DERROTA: a cota é gasta na abertura (`forfeitPending`, `community.js`);
 *  - a torcida só SOMA: sem torcer o pet luta normal. Mandar torcida forjada rende no máximo o que o teto
 *    de toques por balde rende (`CHEER.tapsCapPerBucket` por balde de `CHEER.bucketSeconds`).
 *
 * ── TORCIDA POR BALDE (PR5) ───────────────────────────────────────────────────
 * No v3 o número de golpes varia com SPD e buffs, então a torcida deixou de ser "toques por golpe" e é
 * "toques por BALDE DE TEMPO" (3 s). O cliente manda quantos toques deu em cada balde (até
 * `DUEL_CHEER_BUCKETS` = 20, 60 s); o servidor higieniza (`sanitizeTaps`: inteiros em [0, teto]) e
 * recalcula tudo. A descarga de um balde cai no FIM dele (`bucketTapTimes`): é causal (o cliente só sabe a
 * contagem do balde quando ele fecha) e é a MESMA conta nos dois lados.
 *
 * ── TETO ANTI-FRAUDE S1 (§2.15 P3) ────────────────────────────────────────────
 * O save é escrito pelo cliente, então `perfectDays` e `evolutionStage` podem ser forjados. O servidor tem um
 * relógio que o cliente não toca: `metadata.f`, a data da 1ª gravação do save (`save.js`). Daí
 * `maxLevelFor`: no máximo 1 level por dia de servidor, SÓ no duelo (o save não é reescrito). O valor é
 * LIMITADO, não rejeitado.
 *
 * Perder não custa coração nem nada do pet (mesma regra da Masmorra/Arena). EMPATE é um resultado válido:
 * não dá pontos nem Honra para ninguém.
 */
import {
  CHEER, PVP_HP_SCALE, cheerEvents, combinedAttrBonus, fightSteps, soulCombatant, specialOf,
} from './_combate.js';
import { bondLevelFor } from './_bond.js';
import { talentAttrBonus, talentCheerScale } from './_talents.js';
import { equipAttrBonus } from './_equipment.js';

export { PVP_HP_SCALE };

/** Quanto tempo um duelo aberto vale: passou disso, o `match` conta como desistência. */
export const DUEL_PENDING_MS = 5 * 60 * 1000;
/** Toques que enchem a barra de CHEER (o do núcleo). */
export const DUEL_TAPS_FULL = CHEER.tapsFull;
/** Teto de toques contados por balde de tempo (anti auto-clique; o do núcleo). */
export const DUEL_TAPS_CAP = CHEER.tapsCapPerBucket;
/** Baldes de torcida de uma luta: 60 s / 3 s = 20. Toque depois disso não conta. */
export const DUEL_CHEER_BUCKETS = Math.ceil(60 / CHEER.bucketSeconds);
/**
 * Teto do save LIDO como oponente (PR13, ALTO-3): acima disso o lado "nao luta" e o save NEM e parseado. A gravacao aceita 5 MB
 * (`save.js`), mas o maior save real observado e ~50x menor; parsear 5 MB por listagem de oponentes e vetor de DoS. 1 milhao de
 * caracteres = ~10x o maior save real. Quem passa disso continua jogando; so nao entra como oponente do Torneio.
 */
export const DUEL_SAVE_MAX_CHARS = 1_000_000;
/** Um dia de servidor, em ms (o passo do teto S1). */
export const DUEL_DAY_MS = 86_400_000;

/** Higieniza os toques da rede: `DUEL_CHEER_BUCKETS` inteiros em [0, DUEL_TAPS_CAP]; o resto vira 0. */
export function sanitizeTaps(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  return Array.from({ length: DUEL_CHEER_BUCKETS }, (_, i) => {
    const n = Math.floor(Number(arr[i]));
    return Number.isFinite(n) ? Math.min(DUEL_TAPS_CAP, Math.max(0, n)) : 0;
  });
}

/** Contagens por balde -> marcas de tempo (s): os toques do balde `b` valem no FIM dele, em `(b + 1) * bucketSeconds`. */
export function bucketTapTimes(counts) {
  const out = [];
  counts.forEach((n, b) => { for (let k = 0; k < n; k++) out.push((b + 1) * CHEER.bucketSeconds); });
  return out;
}

/**
 * Os eventos de descarga de uma torcida por baldes (é o `cheer` do `fight()`), higienizados.
 * @param {unknown} rawTaps @param {0 | 1} [side] @param {number} [scale] PR7b: rendimento da torcida (talento), 1 por padrao
 */
export function duelCheerEvents(rawTaps, side = 0, scale = 1) {
  return cheerEvents(bucketTapTimes(sanitizeTaps(rawTaps)), side, scale);
}

/**
 * Teto S1: o level máximo que o duelo aceita, pela data da 1ª gravação do save (`firstSeen`, ms).
 * `1 + dias de servidor desde então`. Sem `firstSeen` vale o level 1 (PR13: o piso, nao o teto do estagio) ate o
 * `save.js` gravar o `f` — o que acontece na PRIMEIRA gravacao seguinte do save (`f = agora` se nao ha). Relógio no futuro conta 0 dias.
 * @param {unknown} firstSeen @param {number} now
 */
export function maxLevelFor(firstSeen, now) {
  if (typeof firstSeen !== 'number' || !Number.isFinite(firstSeen) || firstSeen <= 0) return 1;
  return 1 + Math.max(0, Math.floor((now - firstSeen) / DUEL_DAY_MS));
}

/** Escola do especial -> família PADRÃO (espelho do `ESCOLA_FAMILY_PADRAO` de `src/utils/arena.ts`; travado por teste): só o fallback de uma skill sem `familia` válida. */
export const ESCOLA_FAMILY = {
  combate_fisico: 'direct', longo_alcance: 'dot', conjuracao: 'direct', benca: 'heal', maldicao: 'defDebuff',
};
/** As 7 famílias do núcleo (`SPECIAL_FAMILIES`); `familia` vinda do save só vale se estiver nesta lista fechada. */
export const SPECIAL_FAMILY_IDS = ['direct', 'dot', 'heal', 'shield', 'atkBuff', 'defDebuff', 'spdBuff'];
const FICHA_STAGES = ['rookie', 'champion', 'ultimate', 'mega', 'ultra'];
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

/** Estágio da ficha (os dois bebês caem em `rookie`), igual a `fichaStageOf` do app. */
export function fichaStageOf(evolutionStage) {
  const nivel = typeof evolutionStage === 'string' ? evolutionStage.split('-')[0] : '';
  return FICHA_STAGES.includes(nivel) ? nivel : 'rookie';
}

/** Quantos substantivos cada família tem no léxico do cliente (`SUBSTANTIVOS_POR_FAMILIA` de `nomeEspecial.ts`; travado por teste de paridade). */
export const LEXICO_POR_FAMILIA = 8;
const ELEMENTO_ID = /^[a-z][a-z_]{0,23}$/;

/**
 * O ID do nome do especial (PR9b): `{ n, f, el, elB }` = índice do substantivo no léxico da família + formato +
 * ids dos elementos do especial e da básica. O servidor NUNCA publica texto do save: só inteiros dentro de faixa e ids
 * de elemento no formato fechado; o cliente recompõe o nome pela mesma função do dono e só aceita elemento da lista
 * dele. Sem `lex` válido (save antigo, família inválida, lixo) = `null`, e o cliente cai no nome por família.
 * @param {any} especial @param {any} basica @param {string | null} familia
 */
export function lexOf(especial, basica, familia) {
  const lex = especial && typeof especial === 'object' ? especial.lex : null;
  if (!lex || typeof lex !== 'object' || !familia) return null;
  const { n, f } = lex;
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 0 || n >= LEXICO_POR_FAMILIA) return null;
  if (f !== 0 && f !== 1 && f !== 2) return null;
  const el = especial.elementoId, elB = basica && typeof basica === 'object' ? basica.elementoId : null;
  if (typeof el !== 'string' || !ELEMENTO_ID.test(el) || typeof elB !== 'string' || !ELEMENTO_ID.test(elB)) return null;
  return { n, f, el, elB };
}

/** Espelho de `escolaSkillSegura` + `fighterIdentity` (src/utils/fighterIdentity.ts): escola de skill válida = ela mesma; texto que não é escola de skill (um `evocacao` antigo, lixo) = `conjuracao`; sem skill/sem texto = `null` (o cliente cai no elemento). */
const escolaOf = (skill) => (skill && typeof skill.escolaId === 'string' ? (own(ESCOLA_FAMILY, skill.escolaId) ? skill.escolaId : 'conjuracao') : null);

/** A lista FECHADA de elementos do app (17 base + 136 pares: `CLASS_ELEMENT_ORDER` + `DERIVED_ELEMENT_PAIRS`; travada por `fighterIdentity.parity.test.ts`). O elemento publicado em `fx` só sai se estiver aqui. */
export const ELEMENTOS_FICHA = new Set([
  'fogo', 'agua', 'terra', 'ar', 'eletricidade', 'arcano', 'sombra', 'luz', 'vileza', 'morte', 'vida', 'vigor',
  'marcial', 'tempo', 'som', 'gravidade', 'espaco', 'vapor', 'lava', 'incendio', 'plasma', 'fogo_feiticeiro',
  'fogo_negro', 'chama_solar', 'fogo_infernal', 'chama_azul', 'fenix', 'fervor', 'pantano', 'gelo',
  'agua_viva', 'mare', 'abismo', 'prisma', 'acido', 'veneno', 'nascente', 'correnteza', 'areia', 'magnetismo',
  'cristal', 'obsidiana', 'ouro_vivo', 'solo_profano', 'ossuario', 'flora', 'tita', 'tempestade', 'eter',
  'murmurio', 'aurora', 'enxofre', 'miasma', 'alento', 'impeto', 'fluxo', 'trovao_negro', 'fulgor', 'tormento',
  'galvanismo', 'sinapse', 'reflexo', 'ocultismo', 'runa', 'pacto', 'alma', 'essencia', 'encantamento',
  'crepusculo', 'terror', 'espectro', 'parasita', 'assassinio', 'heresia', 'julgamento', 'santidade',
  'bravura', 'praga', 'mutacao', 'carnificina', 'equilibrio', 'ceifa', 'vitalidade', 'forja', 'tempera', 'aco',
  'esgrima', 'aco_voltaico', 'arsenal', 'lamina_oculta', 'lamina_radiante', 'serrilha', 'fio_funebre',
  'lamina_viva', 'maestria', 'pira_eterna', 'erosao', 'fossil', 'aceleracao', 'instante', 'cronomancia',
  'entropia', 'eon', 'ruina', 'ocaso', 'florescer', 'frenesi', 'contratempo', 'estrondo', 'sonar', 'terremoto',
  'estampido', 'trovao', 'cantico', 'sussurro', 'harmonia', 'dissonancia', 'requiem', 'melodia', 'brado',
  'cadencia', 'eco', 'fornalha_estelar', 'voragem', 'colapso', 'vacuo', 'magnetar', 'singularidade',
  'buraco_negro', 'halo_gravitacional', 'jugo', 'implosao', 'ancora_vital', 'peso_descomunal', 'ariete',
  'dilatacao', 'onda_de_choque', 'meteoro', 'cometa', 'asteroide', 'estratosfera', 'pulsar', 'portal', 'vazio',
  'constelacao', 'devorador', 'nebulosa', 'semente_estelar', 'gigante_estelar', 'lamina_sideral', 'continuum',
  'silencio_cosmico', 'dobra',
]);

/** Id de elemento da lista fechada (o cliente valida de novo contra a dele). */
const idElemento = (id) => (typeof id === 'string' && ELEMENTOS_FICHA.has(id) ? id : null);

/**
 * Espelho de `elementoDoBasico` (src/utils/fighterIdentity.ts): o golpe BÁSICO usa o elemento PRINCIPAL do Soulmon
 * (`elementoDominante`, base ou combinado); skills antigas, sem o campo, caem no elemento da básica. Derivado do `soulmonSkills`
 * do save no servidor, nunca de campo do cliente.
 * @param {any} skills
 */
export function elementoDoBasico(skills) {
  const dom = skills && typeof skills === 'object' && skills.elementoDominante && typeof skills.elementoDominante === 'object' ? skills.elementoDominante.id : null;
  return idElemento(dom) ?? idElemento(skills?.basica?.elementoId);
}

/**
 * A ficha de luta de um lado, derivada do SAVE. Só números e ids de uma lista fechada saem daqui:
 *  - `combatant`: level (derivado e limitado por `maxLevel`), stats e bônus (canal `combinedBonus`, 0 até o PR7/PR8);
 *  - `special`: a família é a `familia` da skill ESPECIAL da ficha (PR9; só se estiver na lista fechada das 7), senão a padrão da
 *    escola dela (desconhecida/ausente = `direct`);
 *  - `fx`: as escolas do golpe básico e do especial, para o CLIENTE desenhar a forma do golpe (só cosmético).
 * @param {any} save @param {{ maxLevel?: number }} [opts]
 */
export function duelSide(save, opts = {}) {
  const state = save && typeof save === 'object' ? save : {};
  // O bônus entra pelo canal único `combinedBonus` (teto 5% somando todas as fontes). Talento (PR7): vale só
  // se o vetor do save é válido para o Vínculo derivado do próprio save (inválido = 0). Equipamento (PR8): `equipAttrBonus`.
  // PR7b: o canal é POR ATRIBUTO (ATK dano dado, DEF dano recebido, SPD ritmo); o teto de 5% é a SOMA dos três.
  const bondLvl = bondLevelFor(state.totalXP);
  const bonus = combinedAttrBonus({
    talent: talentAttrBonus(state.talentPicks, bondLvl),
    // PR8: equipamento por slot (Nucleo ATK, Carapaca DEF, Rastro SPD), percentual, saneado do save; o teto de 5% e a SOMA dos tres.
    equipment: equipAttrBonus(state.equipment),
  });
  const combatant = soulCombatant(state, { maxLevel: opts.maxLevel, bonus });
  const skills = state.soulmonSkills && typeof state.soulmonSkills === 'object' ? state.soulmonSkills[fichaStageOf(state.evolutionStage)] : null;
  const basica = escolaOf(skills?.basica);
  const especial = escolaOf(skills?.especial);
  const familiaSalva = skills?.especial?.familia;
  const family = especial
    ? (typeof familiaSalva === 'string' && SPECIAL_FAMILY_IDS.includes(familiaSalva) ? familiaSalva : ESCOLA_FAMILY[especial])
    : 'direct';
  // `familia` + `lex` também saem em `fx`: o CLIENTE recompõe o nome EXATO do especial do oponente (regra fechada, nunca texto do save).
  const lex = especial && typeof familiaSalva === 'string' && familiaSalva === family ? lexOf(skills?.especial, skills?.basica, family) : null;
  // `cheerScale` (PR7b, `tal-pvp-05`): o rendimento da torcida do Duelo do LADO de quem tem o nó (1 sem ele).
  return { combatant, special: specialOf(family), cheerScale: talentCheerScale(state.talentPicks, bondLvl), fx: { basica, especial, familia: especial ? family : null, lex, elBasica: elementoDoBasico(skills), elEspecial: idElemento(skills?.especial?.elementoId) } };
}

/** Só o combatente (a forma curta de `duelSide`). */
export function duelCombatant(save, opts = {}) {
  return duelSide(save, opts).combatant;
}

/** FNV-1a 32 bits (usado pelo cliente para elementos visuais determinísticos). */
export function duelSeed(...parts) {
  let h = 0x811c9dc5;
  const s = parts.join('|');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * A luta inteira, PURA e determinística: `fight()` do núcleo com a vida × `PVP_HP_SCALE` e a torcida de `me`.
 * `me`/`opp` = `{ combatant, special, cheerScale? }` (`duelSide`). Devolve os eventos (para animar), o vencedor
 * (`'me' | 'opp' | 'draw'`) e a fração de vida de cada lado no PRIMEIRO nocaute (o placar).
 * @returns {{ events: any[], winner: 'me' | 'opp' | 'draw', hpMe: number, hpOpp: number, timeMe: number, timeOpp: number }}
 */
export function simulateDuel({ me, opp, seed, taps }) {
  const g = fightSteps(
    { combatant: me.combatant, special: me.special },
    { combatant: opp.combatant, special: opp.special },
    { seed: seed >>> 0, hpScale: PVP_HP_SCALE, cheer: duelCheerEvents(taps, 0, me.cheerScale) },
  );
  const events = [];
  let hpMe = null, hpOpp = null;
  let r = g.next();
  while (!r.done) {
    const e = r.value;
    events.push(e);
    if (e.kind === 'ko' && hpMe === null) {
      hpMe = Math.max(0, Math.min(1, e.hp[0]));
      hpOpp = Math.max(0, Math.min(1, e.hp[1]));
    }
    r = g.next(1);
  }
  const res = r.value;
  const winner = res.winner === 'draw' ? 'draw' : res.winner === 'A' ? 'me' : 'opp';
  return { events, winner, hpMe: hpMe ?? res.hpA, hpOpp: hpOpp ?? res.hpB, timeMe: res.timeA, timeOpp: res.timeB };
}
