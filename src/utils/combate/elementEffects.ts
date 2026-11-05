/**
 * EFEITO DE COMBATE PELO ELEMENTO DO ESPECIAL (dono, 04/11/2026; REGISTRO §226).
 *
 * O efeito depende do elemento do ESPECIAL, não do Soulmon: água com especial de fogo pode queimar. E nem todo especial
 * tem efeito: a FAMÍLIA continua decidindo a mecânica e `direct` é só dano. O elemento apenas diz qual é o "sabor" de
 * uma família que já deixa estado. Sem par na tabela, a família segue com o efeito genérico dela.
 *
 * Dono único da tabela. Função pura: o núcleo não conhece elemento.
 */
import { DERIVED_ELEMENT_PAIRS } from '../soulProfile/derivedElements';
import { EFFECT_TUNE_PESADELO, type Special, type SpecialEffect, type SpecialFamily } from './specials';

export type EfeitoElemento =
  | 'queimadura' | 'veneno' | 'maldicao' | 'silencio' | 'lentidao' | 'curaContinua'
  | 'defesaTerra' | 'defesaAgua' | 'ataqueFisico' | 'ataqueMagico' | 'velocidade' | 'curaGrande';

/** Elemento base → efeito, por família. O que não está aqui não tem efeito próprio. */
const TABELA: Readonly<Record<SpecialFamily, Readonly<Record<string, EfeitoElemento>>>> = {
  direct: {},
  dot: { fogo: 'queimadura', vileza: 'veneno' },
  defDebuff: { vileza: 'maldicao', sombra: 'maldicao', morte: 'maldicao', som: 'silencio', ar: 'lentidao' },
  shield: { terra: 'defesaTerra', agua: 'defesaAgua', vida: 'curaContinua' },
  atkBuff: { terra: 'ataqueFisico', agua: 'ataqueMagico' },
  spdBuff: { ar: 'velocidade' },
  heal: { vida: 'curaGrande' },
};

/** Derivados cujo NOME promete um efeito que os componentes não dão (Veneno é água + morte). */
const EXCECAO_DERIVADO: Readonly<Record<string, Partial<Record<SpecialFamily, EfeitoElemento>>>> = {
  veneno: { dot: 'veneno' },
  acido: { dot: 'veneno' },
};

const COMPONENTES = new Map<string, readonly string[]>(DERIVED_ELEMENT_PAIRS.map((d) => [d.id, d.componentes as readonly string[]]));

/** O efeito de um especial; `null` = só o que a família já faz. Derivado herda do primeiro componente que tem efeito na família. */
export function efeitoDoEspecial(family: SpecialFamily | null | undefined, elemento: string | null | undefined): EfeitoElemento | null {
  if (!family || !elemento) return null;
  const direto = EXCECAO_DERIVADO[elemento]?.[family] ?? TABELA[family][elemento];
  if (direto) return direto;
  for (const c of COMPONENTES.get(elemento) ?? []) {
    const herdado = TABELA[family][c];
    if (herdado) return herdado;
  }
  return null;
}

/** Efeitos que exigem regra nova no núcleo. Sem a regra ligada (PvP sempre), o selo deles mentiria e não aparecem. */
export const EFEITOS_COM_MECANICA: readonly EfeitoElemento[] = ['silencio', 'lentidao', 'curaContinua'];

/** O efeito que a cena pode mostrar. `mecanicaLigada` = o núcleo está aplicando a regra nova nesta luta. */
export function efeitoVisivel(
  family: SpecialFamily | null | undefined, elemento: string | null | undefined, mecanicaLigada = false,
): EfeitoElemento | null {
  const e = efeitoDoEspecial(family, elemento);
  if (!e || !EFEITOS_COM_MECANICA.includes(e)) return e;
  return mecanicaLigada && EFEITOS_PVE_LIGADOS.includes(e) ? e : null;
}

/**
 * §226: as regras novas LIGADAS em PvE. Só entra o que passa em ±3pp no gate `efeitosPve.medicao.test.ts`.
 * Arena e Masmorra usam a mesma regra; o Pesadelo tem botões próprios (`EFFECT_TUNE_PESADELO`).
 */
export const EFEITOS_PVE_LIGADOS: readonly EfeitoElemento[] = ['silencio', 'curaContinua', 'lentidao'];

/** O elemento que a tela passa ao simulador: só quando a regra daquele par está ligada. PvP nunca chama. */
export function efeitoElementoPve(family: SpecialFamily, elemento: string | null | undefined): string | undefined {
  const e = efeitoDoEspecial(family, elemento);
  return e && EFEITOS_PVE_LIGADOS.includes(e) ? (elemento as string) : undefined;
}

const MECANICA: Partial<Record<EfeitoElemento, SpecialEffect>> = {
  curaContinua: 'hot', lentidao: 'slow', silencio: 'silence',
};

/** O especial com a regra do elemento. Sem elemento ou sem mecânica: o mesmo objeto, sem `effect`. PvP nunca chama. */
export function comEfeitoDoElemento(sp: Special, elemento: string | null | undefined, pesadelo = false): Special {
  const e = efeitoDoEspecial(sp.family, elemento);
  const effect = e ? MECANICA[e] : undefined;
  return effect ? { ...sp, effect, ...(pesadelo ? { tune: EFFECT_TUNE_PESADELO } : {}) } : sp;
}
