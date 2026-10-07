/**
 * Espelho de `src/utils/fichaJornada.ts` + a parte PURA de `src/utils/soulProfile/ficha/comportamento.ts` (Combate v3 /
 * PR15c), so o que o SERVIDOR usa: validar o registro `fichaJornada` do save, recalcular o `plano` a partir dos
 * `galhos` gravados e fazer cumprir a IMUTABILIDADE por estagio. Pages Functions nao importam de `src/`: as constantes
 * sao copiadas e travadas por `fichaJornada.parity.test.js` (mudou constante de um lado, mude os dois).
 *
 * O que NAO esta aqui, de proposito: a FAMILIA do especial nao e recalculada (depende da seed local e do Oraculo, que
 * nao estao no save — risco ACEITO pelo dono, `contexto.md` §2.33). O servidor so garante que a `familia` gravada
 * pertence a lista fechada das 7 e que, uma vez gravada, nao muda. Tudo e SANEADO, nunca rejeita o save: o que nao
 * tem a forma vira ausente (ou o valor gravado antes), e o resto do estado do jogador segue intacto.
 */

/** Fatia do orcamento de elementos que o comportamento redistribui (espelho de `PESO_COMPORTAMENTO`; o servidor nao a aplica, so a trava). */
export const PESO_COMPORTAMENTO = 0.35;
/** Total de pontos da janela abaixo do qual nao ha plano (espelho de `MIN_AMOSTRA`). */
export const MIN_AMOSTRA = 30;
/** Teto de pontos por galho aceito num registro (so higiene: o plano e invariante a volume, so a razao conta). */
export const GALHO_MAX = 100000;
/** Estagios que tem janela anterior (espelho de `ESTAGIOS_COM_JANELA`). */
export const ESTAGIOS_COM_JANELA = ['champion', 'ultimate', 'mega', 'ultra'];
/** As 7 familias do especial (a mesma lista de `_duel.js` › `SPECIAL_FAMILY_IDS`; ha teste de igualdade). */
export const FAMILIAS_VALIDAS = ['direct', 'dot', 'heal', 'shield', 'atkBuff', 'defDebuff', 'spdBuff'];

/** Os galhos do cliente na ordem de `GALHOS` (poder, harmonia, benevolencia) e a chave da janela de cada um. */
const GALHOS = [['poder', 'power'], ['harmonia', 'harmony'], ['benevolencia', 'benevolence']];

/** Espelho de `GALHO_PARA_ELEMENTO`: 3 linhas x elementos BASE, cada linha soma 1. */
export const GALHO_PARA_ELEMENTO = {
  poder: {
    fogo: 0.26, vileza: 0.10, eletricidade: 0.10, marcial: 0.10, morte: 0.08, vigor: 0.08, terra: 0.06,
    arcano: 0.05, sombra: 0.05, gravidade: 0.04, ar: 0.03, som: 0.03, vida: 0.02,
  },
  harmonia: {
    arcano: 0.20, ar: 0.15, agua: 0.12, luz: 0.10, tempo: 0.08, som: 0.08, espaco: 0.08, marcial: 0.05,
    eletricidade: 0.04, sombra: 0.04, vida: 0.02, terra: 0.02, morte: 0.02,
  },
  benevolencia: {
    vida: 0.28, terra: 0.22, vigor: 0.16, agua: 0.10, luz: 0.10, gravidade: 0.06, sombra: 0.03, arcano: 0.03, marcial: 0.02,
  },
};

const MESES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Numero finito > 0, senao 0 (igual ao `n` do cliente), e agora com teto. */
function pts(v) {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.min(v, GALHO_MAX) : 0;
}

/** Os galhos de um registro, higienizados (finitos, >= 0, com teto). @param {any} g */
export function cleanGalhos(g) {
  const o = g && typeof g === 'object' ? g : {};
  return { power: pts(o.power), harmony: pts(o.harmony), benevolence: pts(o.benevolence) };
}

/** Espelho de `planoDoComportamento`: pesos por elemento BASE (soma 1) ou `null` abaixo de `MIN_AMOSTRA`. @param {any} janela */
export function planoDoComportamento(janela) {
  const b = GALHOS.map(([, k]) => (janela && typeof janela === 'object' ? (typeof janela[k] === 'number' && Number.isFinite(janela[k]) && janela[k] > 0 ? janela[k] : 0) : 0));
  const total = b.reduce((a, x) => a + x, 0);
  if (total < MIN_AMOSTRA) return null;
  const fatias = b.map((x) => x / total);
  const plano = {};
  const els = new Set(GALHOS.flatMap(([g]) => Object.keys(GALHO_PARA_ELEMENTO[g])));
  for (const el of els) {
    let p = 0;
    GALHOS.forEach(([g], i) => { p += fatias[i] * (GALHO_PARA_ELEMENTO[g][el] ?? 0); });
    if (p > 0) plano[el] = p;
  }
  return plano;
}

/**
 * `at` e um dia do jogador em um dos dois formatos que circulam (`YYYY-MM-DD` ou `Www Mmm DD YYYY`). Plausivel = mes e
 * dia validos e ano entre 2024 e o proximo ano; senao vira ''. Le o TEXTO (nenhum fuso entra).
 * @param {unknown} at @param {number} [agora]
 */
export function cleanAt(at, agora = Date.now()) {
  if (typeof at !== 'string') return '';
  const s = at.trim();
  let y; let m; let d;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (iso) { y = +iso[1]; m = +iso[2]; d = +iso[3]; } else {
    const nat = /^[A-Z][a-z]{2} ([A-Z][a-z]{2}) (\d{2}) (\d{4})$/.exec(s);
    if (!nat) return '';
    m = MESES.indexOf(nat[1]) + 1; d = +nat[2]; y = +nat[3];
  }
  const anoMax = new Date(agora).getUTCFullYear() + 1;
  return m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 2024 && y <= anoMax ? s : '';
}

const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

/**
 * Higieniza `fichaJornada` (forma do cliente: `{ v:1, estagios:{ champion|ultimate|mega|ultra:{ galhos, at, plano?, familia? } } }`).
 * Estagio desconhecido e descartado; galhos finitos e com teto; `at` plausivel; `familia` so se estiver na lista fechada; o
 * `plano` e SEMPRE o recalculado dos galhos (o enviado e ignorado). Sem nenhum estagio valido = `undefined` (campo ausente).
 * @param {unknown} raw @param {number} [agora]
 */
export function sanitizeFichaJornada(raw, agora = Date.now()) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const est = /** @type {any} */ (raw).estagios;
  if (!est || typeof est !== 'object' || Array.isArray(est)) return undefined;
  const estagios = {};
  for (const stage of ESTAGIOS_COM_JANELA) {
    if (!own(est, stage)) continue;
    const e = est[stage];
    if (!e || typeof e !== 'object' || Array.isArray(e)) continue;
    const galhos = cleanGalhos(e.galhos);
    /** @type {any} */
    const out = { galhos, at: cleanAt(e.at, agora) };
    const plano = planoDoComportamento(galhos);
    if (plano) out.plano = plano;
    if (typeof e.familia === 'string' && FAMILIAS_VALIDAS.includes(e.familia)) out.familia = e.familia;
    estagios[stage] = out;
  }
  return Object.keys(estagios).length > 0 ? { v: 1, estagios } : undefined;
}

/**
 * IMUTABILIDADE por estagio: um estagio ja gravado no save do servidor NAO e sobrescrito por um save posterior. Mantem
 * `galhos`, `at` e (se ja havia) `familia` do gravado; so deixa preencher a `familia` UMA vez, quando o gravado ainda
 * nao a tinha (o cliente a espelha depois de derivar, `completarEstagios`). Estagio novo entra como veio (saneado).
 * Sem campo no que chegou = `undefined` (nada a fazer cumprir: reset de pet/renascimento tambem apaga o campo).
 * @param {unknown} incoming @param {unknown} stored @param {number} [agora]
 * @returns {{ ficha: any, mexeu: string[] }}
 */
export function enforceImmutableFicha(incoming, stored, agora = Date.now()) {
  const novo = sanitizeFichaJornada(incoming, agora);
  const antigo = sanitizeFichaJornada(stored, agora);
  if (!novo || !antigo) return { ficha: novo, mexeu: [] };
  const mexeu = [];
  const estagios = { ...novo.estagios };
  for (const stage of ESTAGIOS_COM_JANELA) {
    const a = antigo.estagios[stage];
    if (!a) continue;
    const n = estagios[stage];
    if (n && (n.at !== a.at || n.galhos.power !== a.galhos.power || n.galhos.harmony !== a.galhos.harmony
      || n.galhos.benevolence !== a.galhos.benevolence || (a.familia && n.familia !== a.familia))) mexeu.push(stage);
    const familia = a.familia ?? n?.familia;
    estagios[stage] = { ...a, ...(familia ? { familia } : {}) };
  }
  return { ficha: { v: 1, estagios }, mexeu };
}

/**
 * A familia GRAVADA do estagio (lista fechada) ou `null`. E o que o duelo le (`_duel.js` › `duelSide`): vale mais que o cache
 * editavel `soulmonSkills`. Rookie nao tem registro. @param {unknown} ficha @param {string} stage
 */
export function fichaJornadaFamilia(ficha, stage) {
  if (!ESTAGIOS_COM_JANELA.includes(stage) || !ficha || typeof ficha !== 'object') return null;
  const est = /** @type {any} */ (ficha).estagios;
  const f = est && typeof est === 'object' && own(est, stage) ? est[stage]?.familia : null;
  return typeof f === 'string' && FAMILIAS_VALIDAS.includes(f) ? f : null;
}
