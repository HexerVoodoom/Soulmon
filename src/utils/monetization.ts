// Monetização — SCAFFOLD. Nada aqui processa dinheiro real ainda.
// purchaseCredits/purchaseFullUnlock são placeholders que sempre retornam
// false (nunca fingem cobrar) até conectar um processador de pagamento de
// verdade (Google Play Billing no Android / Stripe Checkout no web).
// watchRewardedAd() simula um anúncio recompensado (sem SDK real ainda) só
// pra dar pra testar o loop de recompensa fim-a-fim — troque por AdMob (ou
// equivalente) quando a conta de anúncios existir; a assinatura já serve.
import { STORAGE_KEYS } from './storageKeys';
import { readJson, writeJson } from './safeStorage';
import { getSpriteForStage } from './sprites';
import { STAGE_NAMES, type CreatureStage, type StageId, type AlignmentId } from './oracle';

export type AccountTier = 'demo' | 'paid';

// ── Personagens pré-prontos (modo demo) ─────────────────────────────────────
// Reaproveita as 3 linhas Soulmon já ilustradas via Higgsfield — as únicas
// com arte de verdade pronta hoje (ver utils/sprites.ts / libraryNpcs.ts).
// Só têm sprite pra rookie/champion/ultimate/mega (sem variação por branch,
// sem ultra) — por isso o modo demo evolui num caminho ÚNICO por nível
// (sem escolha de Poder/Harmonia/Benevolência) e capa em Mega.
export interface PremadeCharacter {
  id: 'kaelen' | 'orrin' | 'thalindra';
  name: string;
  bioPt: string;
  bioEn: string;
}

export const PREMADE_CHARACTERS: PremadeCharacter[] = [
  {
    id: 'kaelen', name: 'Pyrakamon',
    bioPt: 'Um espírito de chamas contidas, forjado em brasa e fúria silenciosa.',
    bioEn: 'A spirit of contained flame, forged in ember and quiet fury.',
  },
  {
    id: 'orrin', name: 'Akashaoimon',
    bioPt: 'Um guardião etéreo que carrega o eco de tempestades distantes.',
    bioEn: 'An ethereal guardian carrying the echo of distant storms.',
  },
  {
    id: 'thalindra', name: 'Nimbratamon',
    bioPt: 'Uma presença dourada e serena, tecida a partir de luz calma.',
    bioEn: 'A golden, serene presence woven from calm light.',
  },
];

/** Sprite de um personagem pré-pronto (modo demo) num nível dado — usado na
 *  tela de escolha do onboarding. getSpriteForStage já sabe resolver isso
 *  quando um demoCharacterId é passado (ver utils/sprites.ts). */
export function getDemoSprite(characterId: string, stage: string): string {
  return getSpriteForStage(stage, characterId);
}

const DEMO_BRANCH_ALIGNMENTS: AlignmentId[] = ['poder', 'harmonia', 'benevolencia'];

/**
 * Formas do modo demo pra alimentar a página de Evolução (EvolutionPath.tsx),
 * que espera uma árvore CreatureStage[] no formato do oráculo. Como o
 * personagem pré-pronto só tem UM sprite por nível (sem variação por
 * branch), as 3 linhas ficam idênticas — não tem escolha de caminho real,
 * só o nome/descrição do personagem repetido em cada nível. Sem 'ultra'
 * (cap em Mega, sem arte pra Ultra ainda).
 */
export function getDemoCreatureStages(character: PremadeCharacter): CreatureStage[] {
  const description = { pt: character.bioPt, en: character.bioEn };
  const stages: CreatureStage[] = [
    { stage: 'rookie', stageName: STAGE_NAMES.rookie, name: character.name, description, imagePrompt: '' },
  ];
  (['champion', 'perfeito', 'mega'] as StageId[]).forEach(stage => {
    DEMO_BRANCH_ALIGNMENTS.forEach(branch => {
      stages.push({ stage, branch, stageName: STAGE_NAMES[stage], name: character.name, description, imagePrompt: '' });
    });
  });
  return stages;
}

// ── Créditos (moeda premium, dinheiro real) ─────────────────────────────────
export const REROLL_COST_CREDITS = 50;   // regenerar personagem (novo oráculo)
export const HEART_COST_CREDITS = 10;    // curar 1 coração na hora

/** Um pacote à venda. `id` é o SKU no Google Play Console (tem que bater
 *  EXATAMENTE com PRODUCTS em functions/api/billing.js). O preço mostrado aqui
 *  é só rótulo de UI — quem cobra e define o valor real é a Play. */
export interface CreditPack { id: string; credits: number; priceLabel: string }
export const CREDIT_PACKS: CreditPack[] = [
  { id: 'soulmon.credits.60', credits: 60, priceLabel: 'R$ 4,90' },
  { id: 'soulmon.credits.150', credits: 150, priceLabel: 'R$ 9,90' },
  { id: 'soulmon.credits.400', credits: 400, priceLabel: 'R$ 19,90' },
];

/** SKU do desbloqueio completo (compra única, NÃO consumível). */
export const FULL_UNLOCK_SKU = 'soulmon.unlock.full';
export const FULL_UNLOCK_PRICE_LABEL = 'R$ 29,90';

// ── Anúncio recompensado ────────────────────────────────────────────────────
// Os valores abaixo espelham functions/api/_entitlements.js — o teto diário
// que VALE é o do servidor; este aqui é só para a UI.
export const AD_REWARD_CREDITS = 5;
export const AD_DAILY_CAP = 3;

// ── Modo demo: limite de criação de atividades ──────────────────────────────
export const DEMO_ACTIVITY_DAILY_CAP = 1;

interface DemoCreationRecord { date: string; count: number }

function readDemoCreations(): DemoCreationRecord {
  const saved = readJson<DemoCreationRecord | null>(STORAGE_KEYS.DEMO_TASKS_CREATED_TODAY, null);
  if (saved && saved.date === new Date().toDateString()) return saved;
  return { date: new Date().toDateString(), count: 0 };
}

export function getDemoCreationsToday(): number {
  return readDemoCreations().count;
}

export function canCreateDemoTaskToday(): boolean {
  return readDemoCreations().count < DEMO_ACTIVITY_DAILY_CAP;
}

/** Chame depois de criar com sucesso uma atividade/tarefa nova no modo demo. */
export function recordDemoCreation(): void {
  const rec = readDemoCreations();
  rec.count += 1;
  // Limite do modo grátis: se não gravar, o cap do dia some. É regra de
  // monetização — a falha AVISA (e o app segue permitindo, nunca bloqueando).
  writeJson(STORAGE_KEYS.DEMO_TASKS_CREATED_TODAY, rec);
}
