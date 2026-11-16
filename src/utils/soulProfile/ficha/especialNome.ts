/**
 * O nome do especial que o JOGADOR escolheu, aplicado por cima da ficha em tempo de leitura: o cache `soulmonSkills`
 * do save nunca é reescrito com ele (some o nome = volta o gerado, sem migração). Um nome só para todos os estágios.
 */
import type { FichaSkills } from './stageSkillsFor';
import { nomeAtualDoEspecial } from './nomeEspecial';

export function comNomeDoEspecial(skills: FichaSkills | undefined | null, nome: string | undefined | null): FichaSkills | undefined {
  if (!skills) return skills ?? undefined;
  const n = typeof nome === 'string' ? nome.trim() : '';
  const out: FichaSkills = {};
  let mudou = false;
  for (const [stage, par] of Object.entries(skills)) {
    // sem nome do jogador: o gerado, lido pela tabela ATUAL (um substantivo renomeado na auditoria de coerência aparece novo, sem migrar o save)
    const esp = par?.especial ? (n ? { ...par.especial, nome: { pt: n, en: n } } : nomeAtualDoEspecial(par.especial)) : undefined;
    if (par && esp !== par.especial) mudou = true;
    out[stage as keyof FichaSkills] = par && esp ? { ...par, especial: esp } : par;
  }
  if (!mudou) return skills;
  return out;
}
