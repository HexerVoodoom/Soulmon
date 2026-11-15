/**
 * ELEMENTAL FUSION — quais ícones de elemento podem dividir o MESMO tabuleiro (REGISTRO §400).
 *
 * Pedido do dono (15/11/2026): no PVP o sorteio ainda juntava ícones de cor parecida (a maioria do pool é azul/violeta escuro
 * "cósmico") e ficava difícil distinguir uma peça da outra. Dono único das regras de distinção; `match3Pvp.pickDistinctPvpElements`
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
];

/** A lista curada inteira, simétrica (cada par aparece nos dois sentidos). */
export const M3_PARES_PROIBIDOS: ReadonlySet<string> = new Set(
  [...PARES_COSMICO_AZUL_VIOLETA, ...PARES_OUTRAS_CORES, ...PARES_POR_OLHO].flatMap(([a, b]) => [`${a}|${b}`, `${b}|${a}`]),
);

/** `true` se o par está na lista curada. */
export const m3ParProibido = (a: string, b: string): boolean => M3_PARES_PROIBIDOS.has(`${a}|${b}`);

/** Resultado do sorteio: os ícones, o limiar com que fechou e se precisou relaxá-lo abaixo do `M3_MIN_DELTA_E`. */
export interface M3Sorteio { elements: string[]; limiar: number; relaxado: boolean }

/**
 * Sorteio guloso com semente: percorre o `order` (já embaralhado pelo chamador, então determinístico) e aceita um ícone só se ele
 * não forma par proibido com NENHUM aceito e fica a `m3DeltaE` ≥ limiar de todos. Se não fecha `n`, baixa o limiar em
 * `M3_DELTA_E_STEP` e refaz sobre a MESMA ordem; a lista curada não relaxa. No pior caso devolve menos de `n` (pool minúsculo),
 * nunca laço infinito.
 */
export function pickM3Distinct(order: readonly string[], n: number, minDeltaE: number = M3_MIN_DELTA_E): M3Sorteio {
  if (n <= 0) return { elements: [], limiar: minDeltaE, relaxado: false };
  for (let lim = minDeltaE; ; lim = Math.max(0, lim - M3_DELTA_E_STEP)) {
    const out: string[] = [];
    for (const id of order) {
      if (out.every(o => !m3ParProibido(o, id) && m3DeltaE(o, id) >= lim)) out.push(id);
      if (out.length >= n) return { elements: out, limiar: lim, relaxado: lim < minDeltaE };
    }
    if (lim <= 0) return { elements: out, limiar: 0, relaxado: lim < minDeltaE };
  }
}
