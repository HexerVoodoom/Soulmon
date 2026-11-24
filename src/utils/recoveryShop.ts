/**
 * EXCHANGER — "Recuperar energia" e "Recuperar vida" (decisão do dono, 24/11/2026). Só EXIBE e checa "cheio": quem cobra, conta o
 * teto SEMANAL (1 de cada, semana ISO) e deduplica é o servidor (`functions/api/_recoveryShop.js`, espelho com paridade em
 * `recoveryShop.parity.test.js`). Só Créditos (nada de Bits/Honra).
 * Preço: 150 Créditos = R$ 9,90 no pacote padrão de 150 (`CREDIT_PACKS`) ≈ os R$ 10,00 pedidos (10 ÷ (9,90 ÷ 150) = 151,5 → 150).
 */
export type RecoveryKind = 'energy' | 'life';
export const RECOVERY_ITEMS: Record<RecoveryKind, { credits: number; weeklyCap: number; restores: number }> = {
  energy: { credits: 150, weeklyCap: 1, restores: 5 },
  life: { credits: 150, weeklyCap: 1, restores: 1 },
};

/** Por que o item não pode ser comprado AGORA (o servidor reconfere preço e teto; "cheio" é só do cliente). */
export type RecoveryBlock = 'full' | 'credits' | null;

/** @param energy energia atual, @param maxEnergy teto do estágio, @param hp corações atuais, @param maxHp corações máximos */
export function recoveryBlock(kind: RecoveryKind, s: { credits: number; energy: number; maxEnergy: number; hp: number; maxHp: number }): RecoveryBlock {
  if (kind === 'energy' ? s.energy >= s.maxEnergy : s.hp >= s.maxHp) return 'full';
  if (!(s.credits >= RECOVERY_ITEMS[kind].credits)) return 'credits';
  return null;
}
