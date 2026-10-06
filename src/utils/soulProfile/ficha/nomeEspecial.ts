// ---------------------------------------------------------------------------
// O ESPECIAL de cada estágio (PR9): família do efeito + nome próprio, por REGRA determinística.
//
// Sem IA e sem rede: o perfil não sai do aparelho. Entrada = escola dominante, elemento(s), a
// tendência do perfil (elemento dominante da leitura) e a seed da pessoa; saída = família
// (uma das 7 do núcleo, `SPECIAL_FAMILIES`), nome {en,pt} e descrição {en,pt}. Mesma seed + mesmo
// estágio = mesmo especial. Cada estágio ganha um especial NOVO: a família já usada nos estágios
// anteriores da jornada só volta quando as 7 se esgotam.
//
// Vocabulário: nada de franquia, nada de sufixo fixo, nada de "nível" (bíblia §12). Os
// substantivos são DISJUNTOS dos da básica (`skills.ts` › NOMES) — o teste varre. O nome vem do
// léxico de família; a escola e o elemento escolhem a FAMÍLIA, não o substantivo.
// ---------------------------------------------------------------------------

import { hashString, mulberry32, pick } from '../../oracle';
import { SPECIAL_FAMILIES, type SpecialFamily } from '../../combate/specials';
import type { EscolaSkillId } from './types';

import { elementoConhecido, elementoNomeDe, type TextoPar } from './elementoNome';
export type { TextoPar };

/** Substantivos por família: PT forma "Substantivo de Elemento", EN "Elemento Substantivo". 8 por família. */
export const SUBSTANTIVOS_ESPECIAL: Record<SpecialFamily, TextoPar[]> = {
  direct: [
    { en: 'Fury', pt: 'Fúria' }, { en: 'Avalanche', pt: 'Avalanche' }, { en: 'Devastation', pt: 'Devastação' },
    { en: 'Colossus', pt: 'Colosso' }, { en: 'Cataclysm', pt: 'Cataclismo' }, { en: 'Meteor', pt: 'Meteoro' },
    { en: 'Nova', pt: 'Nova' }, { en: 'Onslaught', pt: 'Investida Total' },
  ],
  dot: [
    { en: 'Erosion', pt: 'Erosão' }, { en: 'Seep', pt: 'Infiltração' }, { en: 'Undertow', pt: 'Correnteza' },
    { en: 'Drizzle', pt: 'Garoa' }, { en: 'Smolder', pt: 'Brasa Lenta' }, { en: 'Corrosion', pt: 'Corrosão' },
    { en: 'Ripple', pt: 'Ondulação' }, { en: 'Lingering', pt: 'Persistência' },
  ],
  heal: [
    { en: 'Solace', pt: 'Alento' }, { en: 'Sanctuary', pt: 'Santuário' }, { en: 'Choir', pt: 'Coral' },
    { en: 'Halo', pt: 'Aurora' }, { en: 'Rapture', pt: 'Êxtase' }, { en: 'Bloom', pt: 'Floração' },
    { en: 'Lullaby', pt: 'Cantiga' }, { en: 'Respite', pt: 'Trégua' },
  ],
  shield: [
    { en: 'Bulwark', pt: 'Baluarte' }, { en: 'Aegis', pt: 'Égide' }, { en: 'Bastion', pt: 'Bastião' },
    { en: 'Rampart', pt: 'Muralha' }, { en: 'Citadel', pt: 'Cidadela' }, { en: 'Veil', pt: 'Véu' },
    { en: 'Cocoon', pt: 'Casulo' }, { en: 'Carapace', pt: 'Carapaça' },
  ],
  atkBuff: [
    { en: 'Fervor', pt: 'Fervor' }, { en: 'Zeal', pt: 'Zelo' }, { en: 'Surge', pt: 'Surto' },
    { en: 'Rally', pt: 'Brado' }, { en: 'Mettle', pt: 'Brio' }, { en: 'Ascendance', pt: 'Ascensão' },
    { en: 'Valor', pt: 'Bravura' }, { en: 'Crescendo', pt: 'Crescendo' },
  ],
  defDebuff: [
    { en: 'Eclipse', pt: 'Eclipse' }, { en: 'Requiem', pt: 'Réquiem' }, { en: 'Collapse', pt: 'Colapso' },
    { en: 'Sunder', pt: 'Fissura' }, { en: 'Fracture', pt: 'Fratura' }, { en: 'Sentence', pt: 'Sentença' },
    { en: 'Ruin', pt: 'Ruína' }, { en: 'Breach', pt: 'Brecha' },
  ],
  spdBuff: [
    { en: 'Slipstream', pt: 'Esteira' }, { en: 'Zephyr', pt: 'Zéfiro' }, { en: 'Quickening', pt: 'Aceleração' },
    { en: 'Dash', pt: 'Disparada' }, { en: 'Momentum', pt: 'Embalo' }, { en: 'Swiftness', pt: 'Presteza' },
    { en: 'Rapids', pt: 'Corredeira' }, { en: 'Flurry', pt: 'Torvelinho' },
  ],
};

/** Peso de cada família por escola. Toda família tem peso > 0 em toda escola: nenhuma é inalcançável. */
export const PESO_FAMILIA_ESCOLA: Record<EscolaSkillId, Record<SpecialFamily, number>> = {
  combate_fisico: { direct: 4, dot: 2, heal: 1, shield: 2, atkBuff: 3, defDebuff: 1, spdBuff: 1 },
  longo_alcance: { direct: 3, dot: 3, heal: 1, shield: 1, atkBuff: 1, defDebuff: 2, spdBuff: 2 },
  conjuracao: { direct: 4, dot: 2, heal: 2, shield: 2, atkBuff: 1, defDebuff: 2, spdBuff: 1 },
  benca: { direct: 1, dot: 1, heal: 4, shield: 3, atkBuff: 2, defDebuff: 1, spdBuff: 2 },
  maldicao: { direct: 1, dot: 3, heal: 1, shield: 1, atkBuff: 1, defDebuff: 4, spdBuff: 1 },
};

/** Elementos que puxam cada família (afinidade ×3). Elemento fora da tabela (par derivado) é neutro. */
export const AFINIDADE_ELEMENTO: Record<SpecialFamily, readonly string[]> = {
  direct: ['arcano', 'espaco', 'eletricidade'],
  dot: ['fogo', 'agua', 'som'],
  heal: ['vida', 'luz'],
  shield: ['terra', 'gravidade', 'aco'],
  atkBuff: ['fogo', 'marcial', 'vigor'],
  defDebuff: ['sombra', 'morte', 'vileza'],
  spdBuff: ['ar', 'eletricidade', 'tempo'],
};

const AFINIDADE = 3;
const TENDENCIA = 1.5;

export interface EntradaEspecial {
  escola: EscolaSkillId;
  /** Elemento do especial. */
  elementoId: string;
  /** Elemento dominante da leitura do perfil (tendência leve). Opcional. */
  tendencia?: string;
  seedKey: string;
  stage: string;
  /** Famílias já usadas nos estágios anteriores desta jornada. */
  familiasUsadas?: ReadonlySet<SpecialFamily>;
}

/** A família do especial: sorteio PONDERADO e determinístico; evita repetir as já usadas na jornada. */
export function familiaDoEspecial(e: EntradaEspecial): SpecialFamily {
  const rng = mulberry32(hashString(`${e.seedKey}|familia|${e.stage}`));
  const livres = SPECIAL_FAMILIES.filter(f => !e.familiasUsadas?.has(f));
  const candidatas = livres.length > 0 ? livres : SPECIAL_FAMILIES;
  const pesos = candidatas.map(f => {
    let p = PESO_FAMILIA_ESCOLA[e.escola][f];
    if (AFINIDADE_ELEMENTO[f].includes(e.elementoId)) p *= AFINIDADE;
    if (e.tendencia && AFINIDADE_ELEMENTO[f].includes(e.tendencia)) p *= TENDENCIA;
    return p;
  });
  let r = rng() * pesos.reduce((a, b) => a + b, 0);
  for (let i = 0; i < candidatas.length; i++) {
    r -= pesos[i];
    if (r < 0) return candidatas[i];
  }
  return candidatas[candidatas.length - 1];
}

export interface EntradaNome {
  familia: SpecialFamily;
  elemento: TextoPar;
  /** Elemento da BÁSICA; se diferente do especial, o nome pode citar os dois. */
  elementoBasica?: TextoPar;
  seedKey: string;
  stage: string;
}

/** O ID do nome (PR9b): índice do substantivo no léxico da família + formato (0 = "Substantivo de X", 1 = "X Substantivo" em EN, 2 = dois elementos). */
export interface LexNome { n: number; f: 0 | 1 | 2 }

/** Quantos substantivos cada família tem (o servidor valida o índice contra este número; o teste o trava). */
export const SUBSTANTIVOS_POR_FAMILIA = 8;

/** Compõe o nome a partir do ID — a ÚNICA função que escreve o nome (gerador e oponente do PvP). */
export function comporNome(familia: SpecialFamily, lex: LexNome, elemento: TextoPar, elementoBasica?: TextoPar): TextoPar {
  const n = SUBSTANTIVOS_ESPECIAL[familia][lex.n];
  const dois = !!elementoBasica && elementoBasica.en !== elemento.en;
  if (lex.f === 2 && dois && elementoBasica) {
    return { en: `${n.en} of ${elemento.en} and ${elementoBasica.en}`, pt: `${n.pt} de ${elemento.pt} e ${elementoBasica.pt}` };
  }
  return lex.f === 0
    ? { en: `${elemento.en} ${n.en}`, pt: `${n.pt} de ${elemento.pt}` }
    : { en: `${n.en} of ${elemento.en}`, pt: `${n.pt} de ${elemento.pt}` };
}

/** O nome próprio (substantivo da família + elemento(s), em um de 3 formatos que a seed decide) e o ID dele. */
export function nomeEscolhidoDoEspecial(e: EntradaNome, evitarEn?: ReadonlySet<string>): { nome: TextoPar; lex: LexNome } {
  const rng = mulberry32(hashString(`${e.seedKey}|nome|${e.stage}`));
  const banco = SUBSTANTIVOS_ESPECIAL[e.familia];
  const livres = evitarEn ? banco.filter(n => !evitarEn.has(n.en)) : banco;
  const n = pick(rng, livres.length > 0 ? livres : banco);
  const dois = !!e.elementoBasica && e.elementoBasica.en !== e.elemento.en;
  const f = Math.floor(rng() * (dois ? 3 : 2)) as 0 | 1 | 2;
  const lex: LexNome = { n: banco.indexOf(n), f };
  return { nome: comporNome(e.familia, lex, e.elemento, e.elementoBasica), lex };
}

export function nomeDoEspecial(e: EntradaNome, evitarEn?: ReadonlySet<string>): TextoPar {
  return nomeEscolhidoDoEspecial(e, evitarEn).nome;
}

/**
 * O nome do especial de um lado do PvP, recomposto no APARELHO a partir do ID que o servidor publicou (`fx.lex`) —
 * o MESMO nome que o dono vê. Nada do que veio do servidor vira texto: família da lista fechada, índice inteiro dentro
 * do léxico, formato 0..2 e elementos da lista fechada do app (os nomes saem das tabelas do app). Qualquer coisa fora
 * disso devolve `null` e o chamador cai no nome por família (`nomeEspecialInimigo`).
 */
export function nomeDeLexico(fx: unknown): TextoPar | null {
  if (!fx || typeof fx !== 'object') return null;
  const { familia, lex } = fx as { familia?: unknown; lex?: unknown };
  if (typeof familia !== 'string' || !(SPECIAL_FAMILIES as readonly string[]).includes(familia)) return null;
  if (!lex || typeof lex !== 'object') return null;
  const { n, f, el, elB } = lex as { n?: unknown; f?: unknown; el?: unknown; elB?: unknown };
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 0 || n >= SUBSTANTIVOS_POR_FAMILIA) return null;
  if (f !== 0 && f !== 1 && f !== 2) return null;
  if (!elementoConhecido(el) || !elementoConhecido(elB)) return null;
  return comporNome(familia as SpecialFamily, { n, f }, elementoNomeDe(el), elementoNomeDe(elB));
}

/** A descrição por família: o EFEITO, sem cobrança e sem nível. */
export function descricaoDoEspecial(familia: SpecialFamily, el: TextoPar, recurso: TextoPar): TextoPar {
  const eEn = el.en.toLowerCase(), ePt = el.pt.toLowerCase();
  const rEn = recurso.en.toLowerCase(), rPt = recurso.pt.toLowerCase();
  switch (familia) {
    case 'direct': return {
      en: `A devastating burst of ${eEn} that drains ${rEn} — saved for the moments that matter.`,
      pt: `Uma explosão devastadora de ${ePt} que drena ${rPt} — guardada para os momentos decisivos.`,
    };
    case 'dot': return {
      en: `${el.en} that keeps working after the hit, wearing the foe down over time. Drains ${rEn}.`,
      pt: `${el.pt} que segue agindo depois do golpe, desgastando o oponente aos poucos. Drena ${rPt}.`,
    };
    case 'heal': return {
      en: `A wave of ${eEn} that restores your own hold. Drains ${rEn}.`,
      pt: `Uma onda de ${ePt} que devolve sustentação a você. Drena ${rPt}.`,
    };
    case 'shield': return {
      en: `${el.en} gathers into a barrier that soaks up the next blows. Drains ${rEn}.`,
      pt: `${el.pt} se reúne numa barreira que absorve os próximos golpes. Drena ${rPt}.`,
    };
    case 'atkBuff': return {
      en: `${el.en} runs through the body and strengthens the next strikes. Drains ${rEn}.`,
      pt: `${el.pt} percorre o corpo e reforça os próximos golpes. Drena ${rPt}.`,
    };
    case 'defDebuff': return {
      en: `${el.en} loosens the guard of the opponent, so the next strikes land deeper. Drains ${rEn}.`,
      pt: `${el.pt} afrouxa a guarda do oponente, e os próximos golpes entram mais fundo. Drena ${rPt}.`,
    };
    case 'spdBuff': return {
      en: `${el.en} lightens every step and quickens the next strikes. Drains ${rEn}.`,
      pt: `${el.pt} alivia cada passo e acelera os próximos golpes. Drena ${rPt}.`,
    };
  }
}

/**
 * Nome do especial de um INIMIGO (Arena, Masmorra, Pesadelo, Duelo fantasma). O especial do inimigo é
 * `direct` no PvE (`arena.ts`) e a família publicada pelo servidor no PvP (só da lista fechada; outra coisa vira `direct`), então o nome sai do banco da família + o elemento dele, determinístico pela
 * identidade dele (`seed`: o nome gerado). Não depende de nada do jogador.
 */
export function nomeEspecialInimigo(elemento: TextoPar, seed: string, familia?: string | null): TextoPar {
  const f = (SPECIAL_FAMILIES as readonly string[]).includes(familia ?? '') ? (familia as SpecialFamily) : 'direct';
  return nomeDoEspecial({ familia: f, elemento, seedKey: seed, stage: 'foe' });
}
