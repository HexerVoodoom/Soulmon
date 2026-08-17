// ---------------------------------------------------------------------------
// Poder REAL das skills — chama o motor de verdade do class-system
// (`calcularSkill`) em vez de só rotular custo por tipo. Pedido do dono:
// "isso tudo é balanceado quando tá criando a skill", com o motor real que
// já cria personagens e escolas.
//
// Uma `Ficha` já É um `Personagem` válido do class-system — mesmos ids (ver
// `ficha/types.ts`); só falta `bestiario`, que a skill nem consulta aqui.
//
// Import DINÂMICO: o motor completo (registro de elementos/talentos/
// arquétipos) só entra no bundle quando a página do Pet precisa dele —
// mesmo padrão da astronomy-engine em `soulProfile/`.
//
// Falha em QUALQUER skill (ficha degenerada, import falhando) devolve a
// skill original sem o campo `poder` — a página tem que ficar de pé mostrando
// nome/descrição mesmo se o número extra não vier.
// ---------------------------------------------------------------------------

import type { Ficha, EscolaId, RecursoId } from './types';
import type { StageSkill, StageSkills } from './skills';
import { buildRealPersonagem } from './realEngine';

/** Alcance-base por escola — a fórmula do motor cobra uma taxa por metro,
 *  então a escolha entra no custo real, não só no sabor da descrição. */
function alcanceBase(escola: EscolaId): number {
  if (escola === 'combate_fisico') return 2;
  if (escola === 'longo_alcance') return 12;
  return 8;
}

/**
 * Recalcula UMA skill com o motor real: energia como fração do teto da
 * escola (básica = fatia baixa, spamável; especial = fatia alta, perto do
 * teto — que já escala com o nível da escola, então o reajuste por forma
 * pedido pelo dono vem de graça da progressão real) e devolve o impacto
 * total que o motor calculou.
 */
async function poderDeUmaSkill(
  personagem: unknown,
  prog: unknown,
  engine: typeof import('class-system'),
  skill: StageSkill,
  fracaoEnergia: number,
  fracaoTempo: number,
): Promise<number> {
  const escola = skill.escolaId as EscolaId;
  const recurso = skill.recursoId as RecursoId;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fontes = [{ recurso: recurso as any, proporcao: 1 }];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const limites = engine.calcularLimites(personagem as any, escola as any, fontes);
  const cfg = {
    nome: skill.nome.en,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    elemento: skill.elementoId as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    escola: escola as any,
    fontes,
    energia: Math.max(0.01, limites.energiaMaxima * fracaoEnergia),
    tempoConjuracaoSegundos: Math.max(limites.tempoConjuracaoMinimo, limites.tempoConjuracaoMinimo * fracaoTempo),
    alcanceMetros: Math.min(alcanceBase(escola), limites.alcanceMaximo),
    area: { tipo: 'unico' as const },
    entrega: { tipo: 'instantaneo' as const },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = engine.calcularSkill(personagem as any, prog as any, cfg as any);
  return r.impactoTotal;
}

/**
 * Enriquece o par básica/especial de UM estágio com `poder` real. Chamada só
 * pela página do Pet (recomputa sob demanda); o par qualitativo continua
 * sendo a fonte usada por `pipeline.ts`/testes, que não precisam do motor
 * pesado só para rotular custo baixo/alto.
 */
export async function withRealPower(ficha: Ficha, skills: StageSkills): Promise<StageSkills> {
  const { engine, personagem, prog } = await buildRealPersonagem(ficha);

  const aplicar = async (skill: StageSkill, fracaoEnergia: number, fracaoTempo: number): Promise<StageSkill> => {
    try {
      const impactoTotal = await poderDeUmaSkill(personagem, prog, engine, skill, fracaoEnergia, fracaoTempo);
      return { ...skill, poder: Math.round(impactoTotal) };
    } catch {
      return skill;
    }
  };

  const [basica, especial] = await Promise.all([
    aplicar(skills.basica, 0.18, 1),
    aplicar(skills.especial, 0.85, 3),
  ]);
  return { basica, especial };
}

/** Aplica `withRealPower` a todos os estágios de uma vez. */
export async function withRealPowerAllStages(
  fichaByStage: Record<string, Ficha>,
  stageSkills: Record<string, StageSkills>,
): Promise<Record<string, StageSkills>> {
  const entries = await Promise.all(
    Object.entries(stageSkills).map(async ([stage, skills]) => {
      const ficha = fichaByStage[stage];
      if (!ficha) return [stage, skills] as const;
      return [stage, await withRealPower(ficha, skills)] as const;
    }),
  );
  return Object.fromEntries(entries);
}
