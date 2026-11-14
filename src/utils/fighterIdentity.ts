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
import { chaveDaIdentidade, meleeImpactOf, type ImpactoMelee } from './combate/golpeImpacto';

/** Um golpe do lutador: o elemento (id da ficha, usado também no jogo), a escola (`null` = sem ficha) e a forma. */
export interface FighterStrike {
  elemento: string;
  escola: EscolaSkillId | null;
  forma: StrikeForm;
  /** Só com Luvas da Hexsmith (acabamento visual do básico: corte ou splash); ausente = o sorteio estável por elemento. */
  impacto?: 'corte' | 'concussao';
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
  /** Só dos simulados (`sim_NNNN`): o golpe À DISTÂNCIA dele é Magic (`true`, splash) ou Ranged Slash (`false`, corte). Ausente = jogador real: sem mudança. */
  magia?: boolean;
  /** REGISTRO §332: família e elementos SEM Coroa/Amuleto/Garra (o servidor só publica com algum deles equipado). Base do TIPO do básico. Ausente = comportamento antigo. */
  orig?: { familia?: string | null; elBasica?: string | null; elEspecial?: string | null } | null;
  /** REGISTRO §332: o ataque das Luvas (`HEX_STRIKES`): o ÚNICO item que troca o tipo do básico. Ausente = sem Luvas. */
  golpe?: string | null;
}

/** As Luvas (espelho de `strikeParts` de `hexsmith.ts`, sem importar o módulo; `fighterIdentity.pvpTipo.test.ts` compara). */
const GOLPE_DAS_LUVAS: Readonly<Record<string, { forma: StrikeForm; impacto: 'corte' | 'concussao' }>> = {
  magic: { forma: 'ranged', impacto: 'concussao' },
  'ranged-slash': { forma: 'ranged', impacto: 'corte' },
  'melee-slash': { forma: 'melee', impacto: 'corte' },
  'melee-smash': { forma: 'melee', impacto: 'concussao' },
};
const golpeDasLuvas = (g: unknown) => (typeof g === 'string' && Object.prototype.hasOwnProperty.call(GOLPE_DAS_LUVAS, g) ? GOLPE_DAS_LUVAS[g] : undefined);

const ELEMENTO_ID = /^[a-z][a-z_]{0,23}$/;
const elementoValido = (id: unknown): id is string => typeof id === 'string' && ELEMENTO_ID.test(id);
const famValida = (f: unknown): SpecialFamily | null => (typeof f === 'string' && (SPECIAL_FAMILIES as readonly string[]).includes(f) ? (f as SpecialFamily) : null);

function golpe(escola: unknown, elemento: string, role: SkillRole, formaDoElemento = false): FighterStrike {
  if (formaDoElemento && typeof escola === 'string') {
    return { elemento, escola: escolaSkillSegura(escola), forma: elementStrikeForm(elemento, role) };
  }
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
  // `petElementOf` só devolve 'neutro' para o corvinho do administrador: a ficha herdada do oráculo não decide o elemento dele.
  const neutro = fallbackElement === FX_FALLBACK_ELEMENT;
  // DONO (30/10/2026): o elemento do SPRITE manda — golpe básico E especial usam o elemento da arte (`petElementOf`); a ficha decide só a FORMA/escola.
  // Sem elemento conhecido (`fallbackElement` ausente), a ficha decide como antes.
  const doSprite = elementoValido(fallbackElement) ? fallbackElement : null;
  const elBasico = neutro ? FX_FALLBACK_ELEMENT : (doSprite ?? elementoDoBasico(par) ?? sem);
  const elEspecial = neutro ? FX_FALLBACK_ELEMENT : (doSprite ?? (elementoValido(esp?.elementoId) ? esp!.elementoId : elBasico));
  return {
    basico: golpe(par?.basica?.escolaId, elBasico, 'basica', par?.basica?.formaDoElemento === true),
    especial: { ...golpe(esp?.escolaId, elEspecial, 'especial', esp?.formaDoElemento === true), familia: familyOfSkill(esp) },
  };
}

/** A identidade do OPONENTE (ou do próprio lado, vinda do servidor): o `fx` publicado. Mesma saída que `fighterIdentity` do save dele. */
export function fighterIdentityFromFx(fx: Partial<FighterFx> | null | undefined, fallbackElement?: string | null): FighterIdentity {
  const sem = semFicha(fallbackElement);
  // o elemento vindo do servidor só vale se estiver na lista fechada do app (17 base + 136 pares)
  const elBasico = elementoConhecido(fx?.elBasica) ? fx.elBasica : sem;
  const elEspecial = elementoConhecido(fx?.elEspecial) ? fx.elEspecial : elBasico;
  const fam = famValida(fx?.familia);
  const basico = golpe(fx?.basica, elBasico, 'basica');
  const esp = golpe(fx?.especial, elEspecial, 'especial');
  // Simulado: no golpe à distância o acabamento vem da flag do servidor (80% Magic). Corpo a corpo e jogador real ficam como estão.
  const mag = typeof fx?.magia === 'boolean' ? (f: FighterStrike): FighterStrike => (f.forma === 'ranged' ? { ...f, impacto: fx!.magia ? 'concussao' : 'corte' } : f) : (f: FighterStrike) => f;
  // §332: as Luvas do oponente (publicadas em `golpe`) trocam a forma e o acabamento do básico, igual a `hexIdentity` no aparelho dele.
  const luvas = golpeDasLuvas(fx?.golpe);
  return {
    basico: luvas ? { ...basico, forma: luvas.forma, impacto: luvas.impacto } : mag(basico),
    // sem escola do especial (save sem ficha) a família é a padrão de `familyOfSkill`; com ela, a publicada se for válida
    especial: { ...mag(esp), familia: fam ?? familyOfSkill({ escolaId: fx?.especial ?? undefined }) },
  };
}

/**
 * REGISTRO §332: a identidade do lutador do `fx` como ela era SEM Coroa/Amuleto/Garra (o `orig` publicado; sem ele, a própria).
 * É a BASE do sorteio estável do TIPO do básico (`chaveDaIdentidade` + `meleeImpactOf`): trocar esses itens não muda o tipo,
 * como `hexIdentity` faz no aparelho do dono do Soulmon (§321/§325). Só visual: nada de dano lê isto.
 */
export function fighterIdentitySemItensFromFx(fx: Partial<FighterFx> | null | undefined, fallbackElement?: string | null): FighterIdentity {
  // sem as Luvas também (`golpe`): quem as aplica é `fighterIdentityFromFx`, e `tipoDoBasicoPvp` as lê de lá
  const o = fx?.orig;
  if (!o || typeof o !== 'object') return fighterIdentityFromFx(fx ? { ...fx, golpe: null } : fx, fallbackElement);
  return fighterIdentityFromFx({ ...fx, familia: o.familia ?? null, elBasica: o.elBasica ?? null, elEspecial: o.elEspecial ?? null, orig: null, golpe: null }, fallbackElement);
}

/**
 * REGISTRO §332: o TIPO (acabamento corte × splash) do ataque BÁSICO no PvP. Luvas/simulado (`id.basico.impacto`) mandam; senão
 * o sorteio estável da identidade SEM itens (`semItens`). `elementoVisual` = o mapeamento que a tela aplica ao elemento
 * (`fxElementId` no Duelo). Só visual.
 */
export function tipoDoBasicoPvp(id: FighterIdentity, semItens: FighterIdentity, elementoVisual: (el: string) => string = el => el): ImpactoMelee {
  return id.basico.impacto ?? meleeImpactOf({ element: elementoVisual(semItens.basico.elemento), key: chaveDaIdentidade(semItens) });
}

/** O `fx` do SEU lado (o treino local do Torneio): o mesmo formato que o servidor publica. */
export function fxDoLutador(par: StageSkills | null | undefined, petElement?: string | null): FighterFx {
  return {
    basica: typeof par?.basica?.escolaId === 'string' ? escolaSkillSegura(par.basica.escolaId) : null,
    especial: typeof par?.especial?.escolaId === 'string' ? escolaSkillSegura(par.especial.escolaId) : null,
    familia: par ? familyOfSkill(par.especial) : null,
    elBasica: petElement ?? elementoDoBasico(par),
    elEspecial: petElement ?? (elementoValido(par?.especial?.elementoId) ? par!.especial.elementoId : null),
  };
}
