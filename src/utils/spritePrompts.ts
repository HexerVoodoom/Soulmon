// ---------------------------------------------------------------------------
// spritePrompts — cadeia de prompts para gerar os sprites do Soulmon via
// Higgsfield (image-to-image). Regra combinada com o dono do projeto:
//
//   rookie    → prompt base (texto puro, descrição do oráculo)
//   champion  → USA A IMAGEM DO ROOKIE como referência + "evolua a forma
//               atual" + característica do pool do branch (Poder/Harmonia/
//               Benevolência)
//   ultimate  → usa a imagem do CHAMPION do mesmo branch como referência
//   mega      → usa a imagem do ULTIMATE do mesmo branch como referência
//   ultra     → usa AS TRÊS imagens MEGA como referência (fusão das três)
//
// Cada passo reforça no texto que o resultado deve ser uma forma EVOLUÍDA e
// mais desenvolvida da referência, mantendo identidade visual.
// ---------------------------------------------------------------------------

export type Branch = 'virus' | 'data' | 'vaccine';

/** Traços visuais por branch, sorteáveis para enriquecer o prompt. */
export const BRANCH_TRAIT_POOL: Record<Branch, string[]> = {
  // Poder (virus)
  virus: [
    'fierce power aura, jagged dark-green energy',
    'sharper claws and horns, predatory stance',
    'crackling wild energy, untamed power',
  ],
  // Harmonia (data)
  data: [
    'serene digital glyphs orbiting the body, balanced geometry',
    'crystalline blue circuits woven into the form',
    'calm flowing lines, harmonic symmetry',
  ],
  // Benevolência (vaccine)
  vaccine: [
    'warm golden halo, gentle guardian presence',
    'soft radiant wings of light',
    'protective golden ornaments, kind eyes',
  ],
};

const STYLE =
  'minimalist spiritual-digital creature, clean flat shapes, soft gradients, ' +
  'game sprite on transparent background, centered, full body';

export interface SpritePromptStep {
  /** id da forma ('rookie', 'champion-virus', …, 'ultra') */
  stageId: string;
  /** ids das formas cujas IMAGENS entram como referência (vazio = só texto) */
  referenceStageIds: string[];
  prompt: string;
}

/** Monta a cadeia completa de geração na ordem correta de dependências. */
export function buildSpritePromptChain(opts: {
  /** Descrição base da criatura (bio do oráculo, em EN de preferência). */
  baseDescription: string;
  /** Descrição por forma, se o oráculo tiver (stageId → texto). */
  stageDescriptions?: Record<string, string>;
  /** Sorteio dos traços — passe um RNG para reprodutibilidade. */
  pickTrait?: (pool: string[]) => string;
}): SpritePromptStep[] {
  const pick = opts.pickTrait ?? (pool => pool[Math.floor(Math.random() * pool.length)]);
  const desc = (id: string) => opts.stageDescriptions?.[id] ?? '';
  const steps: SpritePromptStep[] = [];

  steps.push({
    stageId: 'rookie',
    referenceStageIds: [],
    prompt: `${opts.baseDescription}. Small, simple base form (rookie). ${desc('rookie')} ${STYLE}`,
  });

  const BRANCHES: Branch[] = ['virus', 'data', 'vaccine'];
  for (const b of BRANCHES) {
    const trait = pick(BRANCH_TRAIT_POOL[b]);
    steps.push({
      stageId: `champion-${b}`,
      referenceStageIds: ['rookie'],
      prompt:
        `Evolve the creature in the reference image into its next, more developed form. ` +
        `Keep its visual identity, colors and species traits, but make it visibly stronger, ` +
        `larger and more mature. Add: ${trait}. ${desc(`champion-${b}`)} ${STYLE}`,
    });
    steps.push({
      stageId: `ultimate-${b}`,
      referenceStageIds: [`champion-${b}`],
      prompt:
        `Evolve the creature in the reference image into its next, clearly superior form. ` +
        `Same identity, but more imposing, more detailed and more powerful than the reference. ` +
        `Amplify: ${pick(BRANCH_TRAIT_POOL[b])}. ${desc(`ultimate-${b}`)} ${STYLE}`,
    });
    steps.push({
      stageId: `mega-${b}`,
      referenceStageIds: [`ultimate-${b}`],
      prompt:
        `Evolve the creature in the reference image into its final, fully realized mega form. ` +
        `Preserve identity, but push scale, presence and ornamentation to the maximum. ` +
        `Crown it with: ${pick(BRANCH_TRAIT_POOL[b])}. ${desc(`mega-${b}`)} ${STYLE}`,
    });
  }

  steps.push({
    stageId: 'ultra',
    referenceStageIds: ['mega-virus', 'mega-data', 'mega-vaccine'],
    prompt:
      `Fuse the THREE creatures in the reference images into a single transcendent ultra form. ` +
      `The result must clearly combine defining traits of all three references — power, harmony ` +
      `and benevolence united — as an evolved, more developed being beyond any of them. ` +
      `${desc('ultra')} ${STYLE}`,
  });

  return steps;
}
