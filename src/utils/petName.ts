/**
 * O nome que o Soulmon MOSTRA.
 *
 * O oráculo sempre devolve um `baseName` — ele é a criatura, não o apelido.
 * Depois de gerado, a pessoa pode batizar o bicho (passo de cadastro do
 * onboarding). O batismo vive em `soulmonMeta.petName` e NUNCA sobrescreve o
 * `baseName`: a página do Oráculo, a bio e a linhagem continuam falando do
 * nome da espécie, e quem já jogava (sem `petName` no save) segue vendo
 * exatamente o que via — a regra do `?? padrão` do projeto.
 *
 * Nome vazio ou só espaços conta como ausente: um save meio gravado não pode
 * apagar o nome do pet da tela.
 */
export function soulmonDisplayName(
  meta?: { baseName?: string; petName?: string } | null,
): string {
  const batizado = meta?.petName?.trim();
  if (batizado) return batizado;
  return meta?.baseName?.trim() || '';
}
