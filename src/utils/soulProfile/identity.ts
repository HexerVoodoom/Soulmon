// ---------------------------------------------------------------------------
// A identidade estável da pessoa — a chave de tudo que NÃO muda no reroll
// (ficha, companheiro, skills). Mora sozinha aqui porque a página do Pet
// precisa dela sem arrastar o pipeline inteiro (bestiário + máquina criativa).
// ---------------------------------------------------------------------------

import { normalizeName } from '../oracle';
import type { OracleInput } from '../oracle';

/** Identidade estável — NÃO inclui o salt, de propósito. As respostas do
 *  ritual entram SEMPRE (não só na ausência do teste de 20): mesma data de
 *  nascimento com respostas diferentes é outra pessoa para a ficha. */
export function identityKey(input: OracleInput): string {
  return [
    normalizeName(input.fullName), input.birthDate, input.birthTime,
    input.birthPlace.trim().toLowerCase(),
    JSON.stringify(input.soulProfile?.psychometric.traitPoints ?? {}),
    JSON.stringify(input.answers ?? {}),
  ].join('|');
}
