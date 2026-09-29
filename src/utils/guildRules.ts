/**
 * REGRAS DA GUILDA QUE O CLIENTE PRECISA SABER (`docs/PLANO-GUILDA.md` §3.1).
 *
 * Só constantes espelhadas do servidor (`functions/api/_coop.js`), e o teste
 * `guildRules.parity.test.ts` lê o fonte do servidor e reprova se divergirem —
 * o cliente não decide teto nenhum, só desenha o que o servidor manda; estes
 * números existem para a COPY (`{n}`) e para a defesa da vista (LV-G2).
 * Nenhum texto de interface escreve o número à mão.
 */

/** Teto de pessoas por roda (`COOP_MAX_MEMBERS`/`GUILD_MAX_MEMBERS` no servidor). */
export const GUILD_MAX_MEMBERS = 12;

/** Até quantas pessoas a presença é nominal (`PRESENCA_NOMINAL_MAX`). A partir
 *  de `GUILD_PRESENCE_NOMINAL_MAX + 1` ninguém tem estado de presença. */
export const GUILD_PRESENCE_NOMINAL_MAX = 4;

/** Comprimento do nome (o `maxLength` do campo; o servidor higieniza de novo). */
export const GUILD_NAME_MAX = 24;

/** Comprimento e alfabeto do código de convite (`sortearCodigoLivre`, sem 0/O/1/I). */
export const GUILD_CODE_LENGTH = 8;
export const GUILD_CODE_FORBIDDEN = /[^A-HJ-NP-Z2-9]/g;

/** Higieniza o que a pessoa digita no campo de código: só o alfabeto do código. */
export function normalizeGuildCode(raw: string): string {
  return raw.toUpperCase().replace(GUILD_CODE_FORBIDDEN, '').slice(0, GUILD_CODE_LENGTH);
}
