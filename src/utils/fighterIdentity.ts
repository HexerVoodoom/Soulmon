// ---------------------------------------------------------------------------
// A IDENTIDADE DE COMBATE de um lutador — DONO ÚNICO (fix/identidade-lutador).
//
// Cada personagem tem UM golpe básico fixo e UM especial, idênticos na Arena, na Masmorra, no Pesadelo, no Duelo e
// no Torneio, e iguais ao que o OPONENTE vê no PvP:
//   • BÁSICO  = o elemento PRINCIPAL do Soulmon (`elementoDominante`: base OU combinado) + a forma da escola da skill básica;
//   • ESPECIAL = elemento, escola, forma e família PRÓPRIOS da skill especial da ficha.
// Nenhuma tela decide isso sozinha: todas chamam `fighterIdentity` (o save local) ou `fighterIdentityFromFx` (o que o
// servidor publica do save do oponente) e leem o resultado. Espelho no servidor: `functions/api/_duel.js`
// (`identidadeDoSave`), travado por `fighterIdentity.parity.test.ts`. Teste de grep: `fighterIdentity.owner.test.ts`.
//
// Sem ficha (save que nunca abriu a página do Pet): o elemento é o `fallbackElement` (o dominante do oráculo,
// `soulmonMeta.dominantElement`) e a forma sai do elemento — a MESMA regra em todas as telas.
// ---------------------------------------------------------------------------
import type { StageSkills, StageSkill } from './soulProfile/ficha/skills';
import { escolaSkillSegura, type EscolaSkillId } from './soulProfile/ficha/types';
import { SCHOOL_STRIKE_FORM, type StrikeForm, type SkillRole } from './soulProfile/ficha/strikeForm';
import { elementStrikeForm, FX_FALLBACK_ELEMENT } from './combatFx';
import { familyOfSkill } from './arena';
import { elementoConhecido } from './soulProfile/ficha/elementoNome';
import { SPECIAL_FAMILIES, type SpecialFamily } from './combate/specials';

/** Um golpe do lutador: o elemento (id da ficha, usado também no jogo), a escola (`null` = sem ficha) e a forma. */
export interface FighterStrike {
  elemento: string;
  escola: EscolaSkillId | null;
  forma: StrikeForm;
}
export interface FighterIdentity {
  basico: FighterStrike;
  especial: FighterStrike & { familia: SpecialFamily };
}

/** O que o servidor publica do lutador (`duelSide(...).fx`): só ids de lista fechada, nunca texto do save. */
export interface FighterFx {
  basica: string | null;
  especial: string | null;
  familia?: string | null;
  /** Elemento do golpe básico e do especial (ids no formato fechado de elemento). */
  elBasica?: string | null;
  elEspecial?: string | null;
}

const ELEMENTO_ID = /^[a-z][a-z_]{0,23}$/;
const elementoValido = (id: unknown): id is string => typeof id === 'string' && ELEMENTO_ID.test(id);
const famValida = (f: unknown): SpecialFamily | null => (typeof f === 'string' && (SPECIAL_FAMILIES as readonly string[]).includes(f) ? (f as SpecialFamily) : null);

function golpe(escola: unknown, elemento: string, role: SkillRole): FighterStrike {
  if (typeof escola === 'string') {
    const e = escolaSkillSegura(escola);
    return { elemento, escola: e, forma: SCHOOL_STRIKE_FORM[e][role] };
  }
  return { elemento, escola: null, forma: elementStrikeForm(elemento, role) };
}

/** O elemento do golpe básico de uma ficha: o dominante (base ou combinado); skills antigas, sem o campo, caem no elemento da básica. */
export function elementoDoBasico(par: Pick<StageSkills, 'basica' | 'elementoDominante'> | null | undefined): string | null {
  const d = par?.elementoDominante?.id;
  if (elementoValido(d)) return d;
  const b = par?.basica?.elementoId;
  return elementoValido(b) ? b : null;
}

function semFicha(fallbackElement: string | null | undefined): string {
  return elementoValido(fallbackElement) ? fallbackElement : FX_FALLBACK_ELEMENT;
}

/** A identidade do SEU lutador, da ficha do estágio (`stageSkillsFor`). Sem ela, `fallbackElement` e a forma pelo elemento. */
export function fighterIdentity(par: StageSkills | null | undefined, fallbackElement?: string | null): FighterIdentity {
  const sem = semFicha(fallbackElement);
  const esp: StageSkill | undefined = par?.especial;
  const elBasico = elementoDoBasico(par) ?? sem;
  const elEspecial = elementoValido(esp?.elementoId) ? esp!.elementoId : elBasico;
  return {
    basico: golpe(par?.basica?.escolaId, elBasico, 'basica'),
    especial: { ...golpe(esp?.escolaId, elEspecial, 'especial'), familia: familyOfSkill(esp) },
  };
}

/** A identidade do OPONENTE (ou do próprio lado, vinda do servidor): o `fx` publicado. Mesma saída que `fighterIdentity` do save dele. */
export function fighterIdentityFromFx(fx: Partial<FighterFx> | null | undefined, fallbackElement?: string | null): FighterIdentity {
  const sem = semFicha(fallbackElement);
  // o elemento vindo do servidor só vale se estiver na lista fechada do app (17 base + 136 pares)
  const elBasico = elementoConhecido(fx?.elBasica) ? fx.elBasica : sem;
  const elEspecial = elementoConhecido(fx?.elEspecial) ? fx.elEspecial : elBasico;
  const fam = famValida(fx?.familia);
  return {
    basico: golpe(fx?.basica, elBasico, 'basica'),
    // sem escola do especial (save sem ficha) a família é a padrão de `familyOfSkill`; com ela, a publicada se for válida
    especial: { ...golpe(fx?.especial, elEspecial, 'especial'), familia: fam ?? familyOfSkill({ escolaId: fx?.especial ?? undefined }) },
  };
}

/** O `fx` do SEU lado (o treino local do Torneio): o mesmo formato que o servidor publica. */
export function fxDoLutador(par: StageSkills | null | undefined): FighterFx {
  return {
    basica: typeof par?.basica?.escolaId === 'string' ? escolaSkillSegura(par.basica.escolaId) : null,
    especial: typeof par?.especial?.escolaId === 'string' ? escolaSkillSegura(par.especial.escolaId) : null,
    familia: par ? familyOfSkill(par.especial) : null,
    elBasica: elementoDoBasico(par),
    elEspecial: elementoValido(par?.especial?.elementoId) ? par!.especial.elementoId : null,
  };
}
