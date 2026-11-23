/**
 * `normalizeName` mora sozinho aqui (e não em `oracle.ts`) para que `identity.ts`,
 * que está no caminho de entrada, não arraste o `oracle.ts` inteiro (~55 KB, as perguntas
 * do ritual) para o chunk de entrada — `entradaEnxuta.contract.test.ts` cobra.
 * `oracle.ts` re-exporta, então quem já importava de lá continua igual.
 */

/** Remove acentos e tudo que não for A-Z. */
export function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
}
