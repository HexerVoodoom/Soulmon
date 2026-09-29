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

/**
 * Os cinco estágios do Bosque, na ordem (`BOSQUE_STAGES` no servidor). O
 * servidor manda o id e o índice (1..5; 0 = ainda sem estágio); o cliente só
 * NOMEIA e desenha — nunca deriva o estágio de progresso nenhum (não recebe).
 */
export const GROVE_STAGES = ['clareira', 'ramagem', 'copa', 'mata', 'bosque-antigo'] as const;
export type GroveStageId = (typeof GROVE_STAGES)[number];

/** Os três gestos fixos, anônimos (`GUILD_GESTURES` no servidor). A ordem é a da tela. */
export const GUILD_GESTURES = ['aceno', 'luz', 'descanso'] as const;
export type GuildGesture = (typeof GUILD_GESTURES)[number];

/** Tamanhos DESCRITIVOS de uma floração colhida (nenhum é "pior"), pequeno → grande. */
export const TIDE_SIZES = ['petala', 'corola', 'floracao'] as const;
export type TideSize = (typeof TIDE_SIZES)[number];

/**
 * A FEIRA (`docs/PLANO-GUILDA.md` §3, WPG-10). Espelhos do servidor
 * (`functions/api/_coop.js`; o encontro lê o fonte em `guildRules.parity.test.ts`):
 * existem para a COPY (`{cheio}`/`{piso}`/`{semanas}`) — a copy nunca escreve o
 * número à mão. O cliente NUNCA conhece HP nem dano: o servidor sorteia e não devolve.
 */
export const RAID_EMBLEMS = 4;
export const RAID_EMBLEMS_FLOOR = 2;
export const RAID_TROPHY_EVERY = 4;
export const RAID_TROPHY_ID = 'trophy-concha-mare';
export const GUILD_TIDE_WEEKS = 6;

/** Os quatro fenômenos, em rotação semanal (`raid.phenomenon`). Tempo da Malha, nunca adversário com gente. */
export const RAID_PHENOMENA = ['nevoa', 'mare', 'estatica', 'enxame'] as const;
export type RaidPhenomenon = (typeof RAID_PHENOMENA)[number];
