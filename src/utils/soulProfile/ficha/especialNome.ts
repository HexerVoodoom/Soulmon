/**
 * O nome do especial que o JOGADOR escolheu, aplicado por cima da ficha em tempo de leitura: o cache `soulmonSkills`
 * do save nunca é reescrito com ele (some o nome = volta o gerado, sem migração). Um nome só para todos os estágios.
 */
import type { FichaSkills } from './stageSkillsFor';

export function comNomeDoEspecial(skills: FichaSkills | undefined | null, nome: string | undefined | null): FichaSkills | undefined {
  if (!skills) return skills ?? undefined;
  const n = typeof nome === 'string' ? nome.trim() : '';
  if (!n) return skills;
  const out: FichaSkills = {};
  for (const [stage, par] of Object.entries(skills)) {
    out[stage as keyof FichaSkills] = par?.especial ? { ...par, especial: { ...par.especial, nome: { pt: n, en: n } } } : par;
  }
  return out;
}
