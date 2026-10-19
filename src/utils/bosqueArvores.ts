/**
 * AS 4 ÁRVORES DO BOSQUE (D-33..D-35, 18/10/2026): uma por estação (hemisfério sul), cada uma com 5 níveis —
 * 1 broto, 2 pequena, 3 média, 4 completa, 5 aperfeiçoada. Esta é a parte PURA (sem React, sem relógio solto).
 *
 * De onde vem o nível: do PLANTIO do clã (o que o clã faz crescer). `nivelDoPlantio` mapeia o estágio 0..4 do
 * servidor para 1..4. O pico fica no SAVE (`bosqueArvores`, uma entrada por estação), porque o servidor só
 * mostra a estação de hoje e o Bosque mostra as quatro.
 *
 * A APERFEIÇOADA (nível 5) só existe no ciclo da MESMA estação do ano seguinte a ter COMPLETADO (4): completou o
 * outono de 2026 -> o outono de 2027 pode amadurecer a árvore perfeita. O "ano" é o do CICLO da estação (jan/fev
 * pertencem ao verão que começou em dezembro, como no servidor), derivado do DIA que o app já usa — nunca de um
 * `new Date()` solto aqui dentro. Registrar é idempotente: a mesma vista no mesmo dia devolve a MESMA referência.
 */
import type { PlantioView } from './claApi';
import type { PlantSpecies } from './plantSpecies';
import { ESTACOES_BOSQUE, sanitizeBosqueArvores, type EstacaoBosque, type ArvoreSalva, type BosqueArvores } from './bosqueArvoresSave';

export { ESTACOES_BOSQUE, sanitizeBosqueArvores };
export type { EstacaoBosque, ArvoreSalva, BosqueArvores };

/** Calendário do hemisfério sul: mar–mai outono, jun–ago inverno, set–nov primavera, dez–fev verão. */
export function estacaoDoMes(mes: number): EstacaoBosque {
  if (mes >= 3 && mes <= 5) return 'outono';
  if (mes >= 6 && mes <= 8) return 'inverno';
  if (mes >= 9 && mes <= 11) return 'primavera';
  return 'verao';
}

/** O ciclo de um dia `YYYY-MM-DD`: a estação e o ano em que ELA começou (jan/fev -> ano anterior, no verão). */
export function cicloDoDia(dia: string): { estacao: EstacaoBosque; ano: number } {
  const ano = Number(dia.slice(0, 4));
  const mes = Number(dia.slice(5, 7));
  const estacao = estacaoDoMes(mes);
  return { estacao, ano: estacao === 'verao' && mes <= 2 ? ano - 1 : ano };
}

export const ESPECIE_DA_ESTACAO: Record<EstacaoBosque, PlantSpecies> = {
  outono: 'abobora', inverno: 'pinheiro', primavera: 'cerejeira', verao: 'cacto',
};
export const ESTACAO_DA_ESPECIE: Record<PlantSpecies, EstacaoBosque> = {
  abobora: 'outono', pinheiro: 'inverno', cerejeira: 'primavera', cacto: 'verao',
};

/** 0 sem planta · estágio 0->1 broto, 1->2 pequena, 2 e 3->3 média, madura->4 completa. */
export function nivelDoPlantio(v: Pick<PlantioView, 'planted' | 'mature' | 'stage'>): number {
  if (!v.planted) return 0;
  if (v.mature) return 4;
  return [1, 2, 3, 3][Math.min(3, Math.max(0, Math.floor(v.stage) || 0))];
}

/**
 * Registra o que a vista do plantio de `dia` mostra. Só vale se a vista é da estação de `dia`.
 * Completar (4) pela 1ª vez grava `completaEm`; amadurecer de novo em ciclo POSTERIOR grava `perfeitaEm`.
 */
export function registrarPlantio(prev: BosqueArvores, v: Pick<PlantioView, 'planted' | 'mature' | 'stage' | 'season'>, dia: string): BosqueArvores {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) return prev; // só ISO (`playerDayIso`); `toDateString` não tem ciclo
  const { estacao, ano: ciclo } = cicloDoDia(dia);
  const lvl = nivelDoPlantio(v);
  if (lvl === 0 || v.season !== estacao) return prev;
  const antes = prev[estacao];
  const mesmoCiclo = antes?.ciclo === ciclo;
  const next: ArvoreSalva = {
    nivel: mesmoCiclo ? Math.max(antes!.nivel, lvl) : lvl,
    ciclo: antes && antes.ciclo > ciclo ? antes.ciclo : ciclo,
    ...(antes?.completaEm !== undefined ? { completaEm: antes.completaEm } : {}),
    ...(antes?.perfeitaEm !== undefined ? { perfeitaEm: antes.perfeitaEm } : {}),
  };
  if (antes && antes.ciclo > ciclo) return prev; // relógio atrasado nunca desfaz o que já foi visto
  if (lvl === 4) {
    if (next.completaEm === undefined) next.completaEm = ciclo;
    else if (ciclo > next.completaEm && next.perfeitaEm === undefined) next.perfeitaEm = ciclo;
  }
  if (antes && antes.nivel === next.nivel && antes.ciclo === next.ciclo && antes.completaEm === next.completaEm && antes.perfeitaEm === next.perfeitaEm) return prev;
  return { ...prev, [estacao]: next };
}

/** O nível que a árvore da estação mostra: 0 = lugar vazio · 1..4 · 5 só com `perfeitaEm`. */
export function nivelDaArvore(salvo: BosqueArvores, estacao: EstacaoBosque): number {
  const r = salvo[estacao];
  if (!r) return 0;
  if (r.perfeitaEm !== undefined) return 5;
  if (r.completaEm !== undefined) return 4;
  return Math.min(4, Math.max(1, r.nivel));
}

/** A aperfeiçoada já PODE crescer neste ciclo? (completou num ciclo anterior ao de `dia`). */
export function aperfeicoadaDisponivel(salvo: BosqueArvores, estacao: EstacaoBosque, dia: string): boolean {
  const c = cicloDoDia(dia);
  const r = salvo[estacao];
  return c.estacao === estacao && !!r && r.completaEm !== undefined && c.ano > r.completaEm && r.perfeitaEm === undefined;
}
