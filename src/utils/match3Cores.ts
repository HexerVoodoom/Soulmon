/**
 * ELEMENTAL FUSION — quais ícones de elemento podem dividir o MESMO tabuleiro (REGISTRO §400).
 *
 * Pedido do dono (15/11/2026): no PVP o sorteio ainda juntava ícones de cor parecida (a maioria do pool é azul/violeta escuro
 * "cósmico") e ficava difícil distinguir uma peça da outra. Dono único das regras de distinção; `match3Pvp.pickDistinctMixedElements`
 * só chama daqui. Duas camadas, as duas valem sempre:
 *  a) `M3_PARES_PROIBIDOS`: lista CURADA, simétrica ("se X aparece, Y não"), montada da medição + conferência a olho. NUNCA é relaxada.
 *  b) `M3_MIN_DELTA_E`: distância mínima entre QUAISQUER dois ícones, rede de segurança para ícone novo que ainda não está na lista.
 *     Só ESTA camada relaxa (em passos de `M3_DELTA_E_STEP`) quando o pool não fecha `n` ícones.
 *
 * Métrica: `m3DeltaE` = o MAIOR entre o CIEDE2000 da cor MÉDIA (`elementVisual.data.ts`) e o da cor DOMINANTE
 * (`elementDominante.data.ts`) do ícone. Só a média erra ícone multicolorido; só a dominante erra ícone de contorno escuro: dois
 * ícones só contam como parecidos quando as DUAS leituras concordam. Id sem assinatura conta como distante (não trava o sorteio).
 * Tabelas geradas por `scripts/element-visual.py` e `scripts/element-dominante.py`: rode os dois quando entrar ícone novo.
 */
import { ELEMENT_DOMINANTE } from './elementDominante.data';
import { ELEMENT_PALETA } from './elementPaleta.data';
import { ELEMENT_SILHUETA } from './elementSilhueta.data';
import { ELEMENT_VISUAL } from './elementVisual.data';

/** ΔE (CIEDE2000, maior entre média e dominante) mínimo entre dois ícones do mesmo tabuleiro. Pool de 285: 14,2% dos pares (5735 de 40470) ficam abaixo, e ainda assim 0 de 20000 sorteios precisam relaxar (só relaxa perto de 35). */
export const M3_MIN_DELTA_E = 24;
/** Quanto o limiar cai a cada rodada sem fechar `n` ícones (nunca trava: no fim chega a 0 = só a lista curada vale). */
export const M3_DELTA_E_STEP = 2;

type Lab = readonly [number, number, number];

/** CIEDE2000 entre duas cores CIELAB (Sharma, Wu, Dalal 2005). */
export function ciede2000(p: Lab, q: Lab): number {
  const rad = Math.PI / 180;
  const [L1, a1, b1] = p, [L2, a2, b2] = q;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2);
  const Cb7 = ((C1 + C2) / 2) ** 7;
  const G = 0.5 * (1 - Math.sqrt(Cb7 / (Cb7 + 25 ** 7)));
  const a1p = (1 + G) * a1, a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const h1 = ((Math.atan2(b1, a1p) / rad) + 360) % 360, h2 = ((Math.atan2(b2, a2p) / rad) + 360) % 360;
  const dL = L2 - L1, dC = C2p - C1p;
  let dh = 0;
  if (C1p * C2p !== 0) { dh = h2 - h1; if (dh > 180) dh -= 360; else if (dh < -180) dh += 360; }
  const dH = 2 * Math.sqrt(C1p * C2p) * Math.sin((dh * rad) / 2);
  const Lb = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2;
  let hb = h1 + h2;
  if (C1p * C2p !== 0) hb = Math.abs(h1 - h2) <= 180 ? (h1 + h2) / 2 : h1 + h2 < 360 ? (h1 + h2 + 360) / 2 : (h1 + h2 - 360) / 2;
  const T = 1 - 0.17 * Math.cos((hb - 30) * rad) + 0.24 * Math.cos(2 * hb * rad) + 0.32 * Math.cos((3 * hb + 6) * rad) - 0.2 * Math.cos((4 * hb - 63) * rad);
  const dTh = 30 * Math.exp(-(((hb - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lb - 50) ** 2) / Math.sqrt(20 + (Lb - 50) ** 2);
  const Sc = 1 + 0.045 * Cbp, Sh = 1 + 0.015 * Cbp * T;
  const Rt = -Math.sin(2 * dTh * rad) * Rc;
  const x = dL / Sl, y = dC / Sc, z = dH / Sh;
  return Math.sqrt(x * x + y * y + z * z + Rt * y * z);
}

/** Distância perceptual entre dois ícones: o maior entre a leitura pela cor média e pela dominante. Sem assinatura = `Infinity`. */
export function m3DeltaE(a: string, b: string): number {
  const ma = ELEMENT_VISUAL[a], mb = ELEMENT_VISUAL[b], da = ELEMENT_DOMINANTE[a], db = ELEMENT_DOMINANTE[b];
  if (!ma || !mb || !da || !db) return Infinity;
  return Math.max(ciede2000([ma[0], ma[1], ma[2]], [mb[0], mb[1], mb[2]]), ciede2000(da, db));
}

/** RODADA 1 (REGISTRO §402): distância mínima entre as PALETAS (até 4 cores dominantes) de dois ícones do mesmo tabuleiro. */
export const M3_MIN_DELTA_E_PALETA = 10;
/** RODADA 1: distância mínima entre dois ícones vistos por quem tem daltonismo (deuteranopia, protanopia ou tritanopia: vale a pior). */
export const M3_MIN_DELTA_E_DALTONICO = 8;

/** Matrizes de simulação de daltonismo (Machado, Oliveira, Fernandes 2009, severidade 1,0), em RGB linear. */
const SIM_DALTONISMO: ReadonlyArray<readonly number[]> = [
  [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881], // deuteranopia
  [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998], // protanopia
  [1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039], // tritanopia
];

const labParaLinear = (lab: Lab): [number, number, number] => {
  const fy = (lab[0] + 16) / 116, fx = fy + lab[1] / 500, fz = fy - lab[2] / 200;
  const inv = (f: number) => (f ** 3 > 216 / 24389 ? f ** 3 : (116 * f - 16) / (24389 / 27));
  const X = 0.95047 * inv(fx), Y = inv(fy), Z = 1.08883 * inv(fz);
  return [3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z, -0.969266 * X + 1.8760108 * Y + 0.041556 * Z, 0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z];
};
const linearParaLab = (rgb: readonly number[]): Lab => {
  const c = rgb.map(v => Math.min(1, Math.max(0, v)));
  const X = (0.4124564 * c[0] + 0.3575761 * c[1] + 0.1804375 * c[2]) / 0.95047, Y = 0.2126729 * c[0] + 0.7151522 * c[1] + 0.072175 * c[2], Z = (0.0193339 * c[0] + 0.119192 * c[1] + 0.9503041 * c[2]) / 1.08883;
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
};
/** Uma cor CIELAB como a veria cada tipo de daltonismo (mesma ordem de `SIM_DALTONISMO`). */
export function simulaDaltonismo(lab: Lab): Lab[] {
  const [r, g, b] = labParaLinear(lab);
  return SIM_DALTONISMO.map(m => linearParaLab([m[0] * r + m[1] * g + m[2] * b, m[3] * r + m[4] * g + m[5] * b, m[6] * r + m[7] * g + m[8] * b]));
}

const cacheDalt = new Map<string, readonly [Lab[], Lab[]] | null>();
/** Média e dominante do ícone nas 3 simulações de daltonismo (cache por id; sem assinatura = `null`). */
function daltonicoDe(id: string): readonly [Lab[], Lab[]] | null {
  let v = cacheDalt.get(id);
  if (v === undefined) {
    const m = ELEMENT_VISUAL[id], d = ELEMENT_DOMINANTE[id];
    v = m && d ? [simulaDaltonismo([m[0], m[1], m[2]]), simulaDaltonismo(d)] : null;
    cacheDalt.set(id, v);
  }
  return v;
}

/** Distância entre dois ícones sob daltonismo: em cada tipo vale o maior entre média e dominante (as duas leituras têm de concordar), e vale o PIOR tipo. Sem assinatura = `Infinity`. */
export function m3DeltaEDaltonico(a: string, b: string): number {
  const da = daltonicoDe(a), db = daltonicoDe(b);
  if (!da || !db) return Infinity;
  let pior = Infinity;
  for (let s = 0; s < SIM_DALTONISMO.length; s++) pior = Math.min(pior, Math.max(ciede2000(da[0][s], db[0][s]), ciede2000(da[1][s], db[1][s])));
  return pior;
}

/** Distância entre as paletas de dois ícones: chamfer ponderado (cada cor procura a mais próxima na outra paleta, nos dois sentidos, pelo peso). Sem paleta = `Infinity`. */
export function m3DeltaEPaleta(a: string, b: string): number {
  const pa = ELEMENT_PALETA[a], pb = ELEMENT_PALETA[b];
  if (!pa || !pb) return Infinity;
  const lado = (x: typeof pa, y: typeof pa) => {
    let soma = 0, peso = 0;
    for (const c of x) { soma += c[3] * Math.min(...y.map(d => ciede2000([c[0], c[1], c[2]], [d[0], d[1], d[2]]))); peso += c[3]; }
    return soma / peso;
  };
  return (lado(pa, pb) + lado(pb, pa)) / 2;
}

/** RODADA 2 (REGISTRO §402): IoU mínimo de silhueta (máscara 16x16) a partir do qual dois ícones têm "forma quase igual". */
export const M3_MAX_SILHUETA = 0.8;
/** RODADA 2: forma quase igual só conflita se a cor também for próxima (ΔE abaixo disto): forma igual com cor bem diferente se lê fácil. */
export const M3_COR_PROXIMA_SILHUETA = 32;
/** RODADA 2: com luminosidade média quase igual (|ΔL| abaixo disto) o piso de silhueta cai `M3_FOLGA_SILHUETA_BRILHO`. */
export const M3_MAX_DELTA_BRILHO = 3;
export const M3_FOLGA_SILHUETA_BRILHO = 0.1;
/** Quanto o piso de silhueta SOBE a cada rodada de relaxamento (acima de 1 a camada deixa de conflitar). */
export const M3_SILHUETA_STEP = 0.02;

const popcount16 = (v: number): number => { let n = 0; for (let x = v; x; x &= x - 1) n++; return n; };
const cacheSil = new Map<string, number[] | null>();
/** As 16 linhas (16 bits cada) da máscara do ícone, em cache; sem assinatura = `null`. */
function mascaraDe(id: string): number[] | null {
  let v = cacheSil.get(id);
  if (v === undefined) {
    const h = ELEMENT_SILHUETA[id];
    v = h && h.length === 64 ? Array.from({ length: 16 }, (_, r) => parseInt(h.slice(r * 4, r * 4 + 4), 16)) : null;
    cacheSil.set(id, v);
  }
  return v;
}
/** Semelhança de silhueta entre dois ícones: IoU (0 a 1) das máscaras 16x16. Sem assinatura = 0 (não trava ícone novo). */
export function m3Silhueta(a: string, b: string): number {
  const ma = mascaraDe(a), mb = mascaraDe(b);
  if (!ma || !mb) return 0;
  let inter = 0, uniao = 0;
  for (let r = 0; r < 16; r++) { inter += popcount16(ma[r] & mb[r]); uniao += popcount16(ma[r] | mb[r]); }
  return uniao === 0 ? 0 : inter / uniao;
}
/** Diferença de luminosidade média (L do CIELAB) entre dois ícones. Sem assinatura = `Infinity`. */
export function m3DeltaBrilho(a: string, b: string): number {
  const ma = ELEMENT_VISUAL[a], mb = ELEMENT_VISUAL[b];
  return ma && mb ? Math.abs(ma[0] - mb[0]) : Infinity;
}
/** `true` se a forma é quase igual E a cor é próxima (ou, com brilho quase igual, a forma é só parecida). */
export function m3SilhuetaConfunde(a: string, b: string, maxSilhueta: number = M3_MAX_SILHUETA): boolean {
  if (maxSilhueta > 1) return false;
  const de = m3DeltaE(a, b);
  if (de >= M3_COR_PROXIMA_SILHUETA) return false;
  const sil = m3Silhueta(a, b);
  return sil >= maxSilhueta || (sil >= maxSilhueta - M3_FOLGA_SILHUETA_BRILHO && m3DeltaBrilho(a, b) < M3_MAX_DELTA_BRILHO);
}

/**
 * Pares que NUNCA dividem tabuleiro, qualquer que seja o limiar. Origem: pares com `m3DeltaE` < 6 na medição de 15/11/2026 (116),
 * conferidos a olho na prancha `E:\Soulmon-assets\_lote-15-11\match3\pares-parecidos.png` (a esmagadora maioria é o bloco azul/violeta
 * escuro "cósmico": nebulosa, espectro, magnetar, silêncio cósmico...), mais os `PARES_POR_OLHO` abaixo.
 */
const PARES_COSMICO_AZUL_VIOLETA: ReadonlyArray<readonly [string, string]> = [
  ['abismo', 'alma'], ['abismo', 'espectro'], ['abismo', 'gravidade'], ['abismo', 'magnetar'],
  ['abismo', 'nebulosa'], ['abismo', 'silencio_cosmico'], ['agua_viva', 'esgrima'],
  ['alma', 'encantamento'], ['alma', 'espectro'], ['alma', 'gravidade'], ['alma', 'magnetar'],
  ['alma', 'nebulosa'], ['alma', 'silencio_cosmico'], ['alma', 'tormento'],
  ['arcano', 'onda_de_choque'], ['buraco_negro', 'devorador'], ['buraco_negro', 'jugo'],
  ['buraco_negro', 'lamina_oculta'], ['buraco_negro', 'sombra'], ['cantico', 'continuum'],
  ['cantico', 'dilatacao'], ['ceifador_estelar', 'erosao'],
  ['ceifador_estelar', 'materia_escura'], ['ceifador_estelar', 'via_lactea'],
  ['chama_azul', 'continuum'], ['cometa', 'tempera'], ['cometa', 'voragem'],
  ['continuum', 'dobra'], ['continuum', 'erosao'], ['continuum', 'pulsar'],
  ['continuum', 'tempestade'], ['continuum', 'voragem'], ['correnteza', 'galvanismo'],
  ['devorador', 'lamina_oculta'], ['devorador', 'obsidiana'], ['devorador', 'praga'],
  ['dobra', 'erosao'], ['dobra', 'leviata'], ['dobra', 'pulsar'], ['dobra', 'veneno'],
  ['eco', 'semente_estelar'], ['encantamento', 'magnetar'], ['encantamento', 'nebulosa'],
  ['encantamento', 'ocaso'], ['encantamento', 'paradoxo'], ['encantamento', 'silencio_cosmico'],
  ['encantamento', 'tormento'], ['erosao', 'pulsar'], ['erosao', 'voragem'],
  ['espaco', 'espectro'], ['espaco', 'sombra'], ['espectro', 'gravidade'],
  ['espectro', 'leviata'], ['espectro', 'magnetar'], ['espectro', 'nebulosa'],
  ['espectro', 'silencio_cosmico'], ['espectro', 'tormento'],
  ['estacao_orbital', 'peso_descomunal'], ['gravidade', 'lamina_oculta'],
  ['gravidade', 'magnetar'], ['gravidade', 'nebulosa'], ['gravidade', 'silencio_cosmico'],
  ['gravidade', 'tormento'], ['jugo', 'portal'], ['lamina_oculta', 'portal'],
  ['lamina_oculta', 'sussurro'], ['lamina_oculta', 'tormento'], ['leviata', 'pulsar'],
  ['leviata', 'veneno'], ['magnetar', 'nebulosa'], ['magnetar', 'ocaso'],
  ['magnetar', 'paradoxo'], ['magnetar', 'silencio_cosmico'], ['magnetar', 'sussurro'],
  ['magnetar', 'tormento'], ['nebulosa', 'silencio_cosmico'], ['nebulosa', 'sussurro'],
  ['nebulosa', 'tormento'], ['ocaso', 'poeira_estelar'], ['ocaso', 'tormento'],
  ['pacto', 'paradoxo'], ['pacto', 'singularidade'], ['pacto', 'sonho_sombrio'],
  ['paradoxo', 'sussurro'], ['pneumatica', 'vapor'], ['portal', 'sussurro'], ['praga', 'terror'],
  ['presagio', 'vacuo'], ['silencio_cosmico', 'tormento'], ['singularidade', 'sonho_sombrio'],
];
/** Outros blocos de cor parecida (dourado, terra, laranja, verde, branco-azulado) medidos abaixo de 6. */
const PARES_OUTRAS_CORES: ReadonlyArray<readonly [string, string]> = [
  ['ascensao', 'milagre'], ['brado', 'fogo'], ['carniceiro', 'ossario_vivo'],
  ['chama_solar', 'luz'], ['clareira', 'farol'], ['duelista_temporal', 'lamina_do_juizo'],
  ['enxofre', 'planta'], ['fervor', 'fornalha_estelar'], ['flora', 'lamina_viva'],
  ['fluxo', 'onda_de_choque'], ['fluxo', 'sono_encantado'], ['gladiador', 'titano_forjado'],
  ['glitter', 'lamina_purpurina'], ['harmonia', 'milagre'], ['harmonia', 'renascimento'],
  ['industrial', 'lava'], ['jardim_eterno', 'maestria'], ['jardim_eterno', 'murcha'],
  ['jardim_eterno', 'terra'], ['jardim_eterno', 'vigor'], ['lamina_radiante', 'renascimento'],
  ['maestria', 'terra'], ['maestria', 'vigor'], ['murcha', 'sabbat'], ['nevasca', 'orvalho'],
  ['terra', 'vigor'],
];
/** Pares acima de 6 que a conferência a olho achou confundíveis na tela (mesma família de cor ou mesmo desenho de brilho). */
const PARES_POR_OLHO: ReadonlyArray<readonly [string, string]> = [
  ['agua', 'tempestade_perfeita'], // gota azul vs redemoinho azul com raio: mesmo azul vivo
  ['chama_azul', 'tempestade_perfeita'], // chama azul e redemoinho azul com raio
  ['leveza', 'nevasca'], // pluma branca-azulada vs floco branco-azulado
  ['brisa_cintilante', 'leveza'], // duas peças claras, branco-azuladas e cintilantes
  // Rodada 3 (REGISTRO §402), fronteira conferida a olho: mesmo motivo desenhado, passam em todas as métricas.
  ['circulo_feerico', 'fungo'], // os dois são um cogumelo luminoso sobre fundo roxo
  ['semente_estelar', 'tempo'], // cristal turquesa com anel/folhas
  ['florescer', 'frenesi'], // ampulheta turquesa entre folhas
  ['flora', 'tita'], // dono 15/11/2026: "muito parecido" (cristal verde-musgo com vegetação, os dois lidos como a mesma pedra verde)
];

/** A lista curada inteira, simétrica (cada par aparece nos dois sentidos). */
export const M3_PARES_PROIBIDOS: ReadonlySet<string> = new Set(
  [...PARES_COSMICO_AZUL_VIOLETA, ...PARES_OUTRAS_CORES, ...PARES_POR_OLHO].flatMap(([a, b]) => [`${a}|${b}`, `${b}|${a}`]),
);

/** `true` se o par está na lista curada. */
export const m3ParProibido = (a: string, b: string): boolean => M3_PARES_PROIBIDOS.has(`${a}|${b}`);

/** Os limiares de cada camada medida (a lista curada não tem limiar: não relaxa). */
export interface M3Limiares { deltaE: number; paleta: number; daltonico: number; silhueta: number }
/** Os limiares de produção. */
export const M3_LIMIARES: Readonly<M3Limiares> = { deltaE: M3_MIN_DELTA_E, paleta: M3_MIN_DELTA_E_PALETA, daltonico: M3_MIN_DELTA_E_DALTONICO, silhueta: M3_MAX_SILHUETA };

/** `true` se os dois ícones NÃO podem dividir o tabuleiro com estes limiares: par da lista curada ou abaixo de algum limiar. */
export function m3Conflito(a: string, b: string, lim: Readonly<M3Limiares> = M3_LIMIARES): boolean {
  return m3ParProibido(a, b) || m3DeltaE(a, b) < lim.deltaE || m3DeltaEPaleta(a, b) < lim.paleta || m3DeltaEDaltonico(a, b) < lim.daltonico || m3SilhuetaConfunde(a, b, lim.silhueta);
}

/** Resultado do sorteio: os ícones, o limiar de ΔE com que fechou e se precisou relaxar algum limiar abaixo do de produção. */
export interface M3Sorteio { elements: string[]; limiar: number; relaxado: boolean }

/**
 * Sorteio guloso com semente: percorre o `order` (já embaralhado pelo chamador, então determinístico) e aceita um ícone só se
 * `m3Conflito` for falso com TODOS os aceitos. Se não fecha `n`, baixa TODOS os limiares medidos em `M3_DELTA_E_STEP` por rodada e
 * refaz sobre a MESMA ordem; a lista curada não relaxa. No pior caso devolve menos de `n` (pool minúsculo), nunca laço infinito.
 * `base` aceita só o ΔE (número, como na §400) ou um conjunto parcial de limiares.
 */
export function pickM3Distinct(order: readonly string[], n: number, base: number | Partial<M3Limiares> = M3_LIMIARES): M3Sorteio {
  const b: M3Limiares = typeof base === 'number' ? { ...M3_LIMIARES, deltaE: base } : { ...M3_LIMIARES, ...base };
  if (n <= 0) return { elements: [], limiar: b.deltaE, relaxado: false };
  for (let k = 0; ; k++) {
    const folga = k * M3_DELTA_E_STEP;
    const lim: M3Limiares = { deltaE: Math.max(0, b.deltaE - folga), paleta: Math.max(0, b.paleta - folga), daltonico: Math.max(0, b.daltonico - folga), silhueta: b.silhueta + k * M3_SILHUETA_STEP };
    const out: string[] = [];
    for (const id of order) {
      if (out.every(o => !m3Conflito(o, id, lim))) out.push(id);
      if (out.length >= n) return { elements: out, limiar: lim.deltaE, relaxado: k > 0 };
    }
    if (lim.deltaE <= 0 && lim.paleta <= 0 && lim.daltonico <= 0 && lim.silhueta > 1) return { elements: out, limiar: 0, relaxado: k > 0 };
  }
}
