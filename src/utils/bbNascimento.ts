/**
 * Quem é o BB no NASCIMENTO (Onboarding Velado D30-D32; plano §15).
 *
 *  · D30: FREE recebe um BB PRONTO do pool (`data/bbPool.ts`), custo de API zero.
 *  · D31: quem JÁ ENTRA pagante (entitlement `paid` no nascimento) ganha o BB EXCLUSIVO, gerado pelo
 *    pipeline de sprite de sempre (formId `bb`, prompt do estágio bb em `creature.bbPrompts`). Se a geração
 *    falhar ou estourar a espera, cai no BB do pool: o nascimento nunca trava.
 *  · D32: quem paga DEPOIS de já ter o BB do pool NÃO ganha BB gerado. Nada aqui roda fora do nascimento:
 *    a geração do BB só é pedida por `gerarBBExclusivo`, chamado só na cerimônia de nascimento; o upgrade
 *    (`handleUpgradeRevealed`) não passa por aqui, e a próxima forma gerada é o rookie.
 *
 * Nunca lança. Não gera nada para free.
 */
export const BB_EXCLUSIVO_ESPERA_MS = 12_000;

/** O pipeline de sprite de sempre (`generate-sprite`, tetos do servidor), com `formId: 'bb'`. Carrega sob demanda. */
export async function gerarBBPeloPipeline(prompt: string, promptFallback: string): Promise<string> {
  const { requestSprite } = await import('./spriteGen');
  return (await requestSprite(prompt, { promptFallback, formId: 'bb' })).image;
}

export interface BBPrompts { imagePrompt: string; imagePromptFallback: string }

/** Única regra de quem gera: pagante no nascimento, com prompts do bb e sem BB já escolhido. */
export function deveGerarBBExclusivo(i: { pago: boolean; prompts?: BBPrompts | null; jaTemBB?: boolean }): boolean {
  return i.pago === true && !i.jaTemBB && !!i.prompts?.imagePrompt;
}

/**
 * Devolve a imagem do BB exclusivo, ou `null` (não pagante, sem prompts, falha ou estouro de `esperaMs`).
 * `gerar` é o pipeline de sprite (injetado: nos testes, um mock).
 */
export async function gerarBBExclusivo(i: {
  pago: boolean;
  prompts?: BBPrompts | null;
  jaTemBB?: boolean;
  gerar: (prompt: string, promptFallback: string) => Promise<string | null | undefined>;
  esperaMs?: number;
}): Promise<string | null> {
  if (!deveGerarBBExclusivo(i)) return null;
  const { imagePrompt, imagePromptFallback } = i.prompts as BBPrompts;
  let relogio: ReturnType<typeof setTimeout> | undefined;
  try {
    const img = await Promise.race([
      i.gerar(imagePrompt, imagePromptFallback),
      new Promise<null>(res => { relogio = setTimeout(() => res(null), i.esperaMs ?? BB_EXCLUSIVO_ESPERA_MS); }),
    ]);
    return typeof img === 'string' && img ? img : null;
  } catch {
    return null;
  } finally {
    if (relogio) clearTimeout(relogio);
  }
}
