// Escolha do fundo chroma por DISTANCIA DE MATIZ (fonte unica; o cliente e o servidor importam daqui).
// Cada palavra de cor do prompt (PT e EN) vira um matiz (0-360) no circulo cromatico; a chave de fundo (verde, magenta ou azul)
// regra de 10/11/2026: VERDE sempre que a menor distancia real ate a criatura for >= 45 graus (acentos ignorados); senao a chave de maior distancia real.
// Por que so 3 chaves: o recorte (`_chroma.js › keyRgba`) chaveia por canal (G, min(R,B) ou B). Ciano e amarelo comeriam branco/ouro/
// turquesa e exigiriam outro recorte; verde/magenta/azul cobrem o circulo a cada 120 graus, o que basta (ver LIMITES no PR #749).

/** Matiz (graus) das 3 chaves. */
/** @type {Record<'green'|'magenta'|'blue', number>} */
export const KEY_HUE = { green: 120, magenta: 300, blue: 240 };
/** Ordem de desempate (padrao do projeto: verde primeiro). */
/** @type {Array<'green'|'magenta'|'blue'>} */
export const KEY_ORDER = ['green', 'magenta', 'blue'];
/** Distancia a partir da qual a chave ja e segura: o recorte so come cores a ate ~45 graus da chave (g - max(r,b) > 60), entao mais longe nao ganha nada. */
export const SAFE_DISTANCE = 60;
/** Distancia minima real (graus) ate as cores da criatura a partir da qual o VERDE (padrao) e mantido, sem penalidade de posicao (regra de 10/11/2026). */
export const GREEN_KEEP_DISTANCE = 45;

/**
 * Tabela palavra -> matiz. `soft` (true) = so conta quando saturada/viva: com "dark/deep/pale/pastel/navy/sky/steel..." na frente a
 * cor e escura ou lavada demais para o recorte comer (min(r,b)<150 etc.), entao e ignorada. Verde nunca e ignorado (mantem a regra do #745).
 */
/** @type {Array<[RegExp, number, boolean]>} */
export const COLOR_HUES = [
  // [regex da palavra, matiz, soft]
  [/\b(?:green|verde|lime|limao|limão|mint|menta|emerald|esmeralda|jade|olive|oliva|fern|samambaia|moss|musgo|sage|clover|trevo|forest|floresta|sprout|leaf|leaves|folha)\b/i, 120, false],
  [/\b(?:teal|turquoise|turquesa|aqua)\b/i, 175, true],
  [/\b(?:cyan|ciano)\b/i, 180, true],
  [/\b(?:azure|azul[- ]?celeste)\b/i, 210, true],
  [/\b(?:blue|azul|cobalt|cobalto|sapphire|safira|ultramarine|ultramarino)\b/i, 240, true],
  [/\b(?:indigo|anil)\b/i, 255, true],
  [/\b(?:purple|roxo|violet|violeta|lilac|lilas|lilás|lavender|lavanda|amethyst|ametista|plum|ameixa|grape|uva|mauve)\b/i, 275, true],
  [/\b(?:magenta|fuchsia|fúcsia|fucsia|hot[- ]pink|neon pink|rosa[- ]choque)\b/i, 300, true],
  [/\b(?:pink|rosa|rose|rosado)\b/i, 335, true],
  [/\b(?:red|vermelho|crimson|carmesim|scarlet|escarlate|ruby|rubi|ember|brasa)\b/i, 0, true],
  [/\b(?:orange|laranja|amber|ambar|âmbar|copper|cobre)\b/i, 30, true],
  [/\b(?:yellow|amarelo|gold|golden|dourado|ouro|lemon|limão-amarelo)\b/i, 55, true],
];

/** Palavras que, logo antes de uma cor "soft", a tornam escura/lavada demais para colidir com o recorte. */
const MODIFICADOR_FRACO = /(?:dark|deep|dim|dusky|muted|dull|pale|pastel|light|soft|baby|powder|sky|steel|navy|clear|cosmic|escuro|escura|profundo|profunda|claro|clara|palido|pálido|suave)[\s-]*$/i;

/** Cor citada como acento ("sickly green accents", "red accent", "hints of violet"): ignoravel para escolher o fundo (decisao do dono, 10/11/2026). */
const ACENTO_DEPOIS = /^[\s,-]*(?:accents?|highlights?|tints?|flecks?|specks?)\b/i;
const ACENTO_ANTES = /(?:hints?|touch(?:es)?|traces?|flecks?|dashes?) of (?:\w+ ){0,2}$/i;

const WORD = /[A-Za-zÀ-ÿ]+(?:[- ](?:pink|choque|celeste))?/g;

/**
 * Cores do texto na ordem de citacao: [{ word, hue, index }]. Palavras de cor fraca (escuras/lavadas) ficam de fora.
 * @param {string} texto
 */
export function coresDoTexto(texto) {
  const t = String(texto ?? '');
  /** @type {{ word: string, hue: number, index: number, accent: boolean }[]} */
  const out = [];
  for (const [re, hue, soft] of COLOR_HUES) {
    const g = new RegExp(re.source, 'gi');
    let m;
    while ((m = g.exec(t))) {
      const antes = t.slice(Math.max(0, m.index - 14), m.index);
      if (soft && MODIFICADOR_FRACO.test(antes)) continue;
      const depois = t.slice(m.index + m[0].length, m.index + m[0].length + 14);
      const accent = ACENTO_DEPOIS.test(depois) || ACENTO_ANTES.test(t.slice(Math.max(0, m.index - 30), m.index));
      out.push({ word: m[0].toLowerCase(), hue, index: m.index, accent });
    }
  }
  out.sort((a, b) => a.index - b.index);
  return out;
}

/** Distancia angular (0-180) entre dois matizes. */
export function hueDist(a, b) {
  const d = Math.abs(((a - b) % 360 + 360) % 360);
  return d > 180 ? 360 - d : d;
}

/** Distancia minima real (graus) de uma chave ate as cores NAO-acento do texto (180 quando nao ha cor). */
export function distanciaMinimaDaChave(key, cores) {
  const base = cores.filter(c => !c.accent);
  return base.length ? Math.min(...base.map(c => hueDist(c.hue, KEY_HUE[key]))) : 180;
}

/** Posicao (citacao) da cor NAO-acento mais proxima da chave: so desempata chaves com a MESMA distancia (circulo cheio: sacrifica a cor citada por ultimo). */
function indiceDaCorMaisProxima(key, cores) {
  let best = -1, d = 999;
  cores.forEach((c, i) => { if (c.accent) return; const x = hueDist(c.hue, KEY_HUE[key]); if (x < d || (x === d && i > best)) { d = x; best = i; } });
  return best;
}

/**
 * Regra (10/11/2026): VERDE sempre que a menor distancia REAL ate as cores da criatura for >= 45 graus (sem peso de posicao; acentos nao
 * contam). So quando algo da paleta esta a < 45 graus do verde, escolhe a chave de MAIOR distancia real (empate: ordem verde, magenta, azul).
 * `excluir` tira chaves da disputa (usado para TROCAR o fundo no motivo "recorte").
 * @param {string} texto
 * @param {Array<'green'|'magenta'|'blue'>} [excluir]
 * @returns {{ key: 'green'|'magenta'|'blue', ranking: { key: 'green'|'magenta'|'blue', score: number }[], cores: { word: string, hue: number, index: number, accent: boolean }[] }}
 */
export function escolherChaveDeMatiz(texto, excluir = []) {
  const cores = coresDoTexto(texto);
  const ranking = KEY_ORDER.filter(k => !excluir.includes(k)).map((key, ordem) => ({ key, score: distanciaMinimaDaChave(key, cores), ultima: indiceDaCorMaisProxima(key, cores), ordem }))
    .sort((a, b) => b.score - a.score || b.ultima - a.ultima || a.ordem - b.ordem).map(({ key, score }) => ({ key, score }));
  const verde = ranking.find(r => r.key === 'green');
  const key = verde && verde.score >= GREEN_KEEP_DISTANCE ? 'green' : ranking[0].key;
  return { key, ranking, cores };
}

/** true = nenhuma chave passa de 30 graus das cores citadas (acentos fora): o circulo esta cheio (criatura multicolor); listar para o dono. */
export function semChaveSegura(texto) {
  const cores = coresDoTexto(texto).filter(c => !c.accent);
  if (!cores.length) return false;
  return KEY_ORDER.every(k => distanciaMinimaDaChave(k, cores) < 30);
}
