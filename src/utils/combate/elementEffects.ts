/**
 * EFEITO DE COMBATE PELO ELEMENTO DO ESPECIAL (dono, 04/11/2026; REGISTRO §228, §236).
 *
 * O efeito depende do elemento do ESPECIAL, não do Soulmon: água com especial de fogo pode queimar. E nem todo especial
 * tem efeito: a FAMÍLIA continua decidindo a mecânica e `direct` é só dano. O elemento apenas diz qual é o "sabor" de
 * uma família que já deixa estado. Sem par na tabela, a família segue com o efeito genérico dela.
 *
 * Dono único da tabela. Função pura: o núcleo não conhece elemento.
 */
import { DERIVED_ELEMENT_PAIRS } from '../soulProfile/derivedElements';
import { curatedComponents } from '../elementosCurados';
import { EFFECT_TUNE_PESADELO, type Special, type SpecialEffect, type SpecialFamily } from './specials';

export type EfeitoElemento =
  | 'queimadura' | 'veneno' | 'maldicao' | 'silencio' | 'lentidao' | 'curaContinua'
  | 'defesaTerra' | 'defesaAgua' | 'ataqueFisico' | 'ataqueMagico' | 'velocidade' | 'curaGrande'
  // §236: os 11 elementos restantes. Mesmas mecânicas, selo próprio.
  | 'peso' | 'retardo' | 'ferrugem' | 'distorcao' // lentidão
  | 'ofuscado' | 'curtoCircuito' | 'atordoado' | 'selado' // silêncio
  | 'seiva' | 'poDeFada' | 'folego' // cura contínua
  | 'escudoPeso' | 'blindagem' | 'furia' | 'postura' | 'aceleracao' | 'carga'; // buff da própria família

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

/**
 * §236 (dono, 05/11/2026: "tem que ter efeito, não pode ser só visual"). Separada de `TABELA` para o derivado herdar
 * primeiro o par antigo: `silencio_cosmico` (espaço + som) continua silêncio, e nenhum derivado que já tinha efeito muda.
 */
const TABELA_11: Readonly<Partial<Record<SpecialFamily, Readonly<Record<string, EfeitoElemento>>>>> = {
  defDebuff: {
    gravidade: 'peso', tempo: 'retardo', industrial: 'ferrugem', espaco: 'distorcao',
    luz: 'ofuscado', eletricidade: 'curtoCircuito', marcial: 'atordoado', arcano: 'selado',
  },
  shield: { planta: 'seiva', fada: 'poDeFada', vigor: 'folego', gravidade: 'escudoPeso', industrial: 'blindagem' },
  atkBuff: { vigor: 'furia', marcial: 'postura' },
  spdBuff: { tempo: 'aceleracao', eletricidade: 'carga' },
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
  const direto = EXCECAO_DERIVADO[elemento]?.[family] ?? TABELA[family][elemento] ?? TABELA_11[family]?.[elemento];
  if (direto) return direto;
  const componentes = COMPONENTES.get(elemento) ?? curatedComponents(elemento) ?? []; // §232: curado herda como o par
  for (const c of componentes) if (TABELA[family][c]) return TABELA[family][c];
  for (const c of componentes) if (TABELA_11[family]?.[c]) return TABELA_11[family]![c];
  return null;
}

const MECANICA: Partial<Record<EfeitoElemento, SpecialEffect>> = {
  curaContinua: 'hot', seiva: 'hot', poDeFada: 'hot', folego: 'hot',
  lentidao: 'slow', peso: 'slow', retardo: 'slow', ferrugem: 'slow', distorcao: 'slow',
  silencio: 'silence', ofuscado: 'silence', curtoCircuito: 'silence', atordoado: 'silence', selado: 'silence',
};

/** Efeitos que exigem regra nova no núcleo. Sem a regra ligada (PvP sempre), o selo deles mentiria e não aparecem. */
export const EFEITOS_COM_MECANICA: readonly EfeitoElemento[] = Object.keys(MECANICA) as EfeitoElemento[];

/** O efeito que a cena pode mostrar. `mecanicaLigada` = o núcleo está aplicando a regra nova nesta luta. */
export function efeitoVisivel(
  family: SpecialFamily | null | undefined, elemento: string | null | undefined, mecanicaLigada = false,
): EfeitoElemento | null {
  const e = efeitoDoEspecial(family, elemento);
  if (!e || !EFEITOS_COM_MECANICA.includes(e)) return e;
  return mecanicaLigada && EFEITOS_PVE_LIGADOS.includes(e) ? e : null;
}

/**
 * §228: as regras novas LIGADAS em PvE. Só entra o que passa em ±3pp no gate `efeitosPve.medicao.test.ts`.
 * Arena e Masmorra usam a mesma regra; o Pesadelo tem botões próprios (`EFFECT_TUNE_PESADELO`).
 */
export const EFEITOS_PVE_LIGADOS: readonly EfeitoElemento[] = EFEITOS_COM_MECANICA;

/** O elemento que a tela passa ao simulador: só quando a regra daquele par está ligada. PvP nunca chama. */
export function efeitoElementoPve(family: SpecialFamily, elemento: string | null | undefined): string | undefined {
  const e = efeitoDoEspecial(family, elemento);
  return e && EFEITOS_PVE_LIGADOS.includes(e) ? (elemento as string) : undefined;
}

/** O especial com a regra do elemento. Sem elemento ou sem mecânica: o mesmo objeto, sem `effect`. PvP nunca chama. */
export function comEfeitoDoElemento(sp: Special, elemento: string | null | undefined, pesadelo = false): Special {
  const e = efeitoDoEspecial(sp.family, elemento);
  const effect = e ? MECANICA[e] : undefined;
  return effect ? { ...sp, effect, ...(pesadelo ? { tune: EFFECT_TUNE_PESADELO } : {}) } : sp;
}
