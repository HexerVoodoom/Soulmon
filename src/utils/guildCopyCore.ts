/**
 * O MÍNIMO DA COPY DA GUILDA que o chunk de ENTRADA precisa (L3-codigo M4, 29/09/2026).
 *
 * O `guildCopy.ts` inteiro (a Feira, o Salão, o glossário: ~20 KB de fonte) só serve à folha, que é
 * `lazy` em `AreaView`. O App, porém, mostra a cerimônia de marco, o aviso da Home e o nome da
 * Concha na loja — e isso é o que mora aqui. `guildCopy.ts` ESPALHA este objeto em `GUILD_COPY`,
 * então a tabela do documento e a régua de vocabulário (`guildSemCobranca.contract.test.ts`)
 * continuam vendo UMA tabela só. Não escreva chave nova aqui a menos que o App precise dela na
 * entrada; o resto nasce em `guildCopy.ts`. Chave nova nasce no documento primeiro.
 */
import type { Language } from './i18n';
import type { GroveStageId } from './guildRules';

export const GUILD_COPY_CORE = {
  'guild.bosque.estagio.clareira.nome': ['Clareira', 'Clearing'],
  'guild.bosque.estagio.ramagem.nome': ['Ramagem', 'Boughs'],
  'guild.bosque.estagio.copa.nome': ['Copa', 'Canopy'],
  'guild.bosque.estagio.mata.nome': ['Mata', 'Thicket'],
  'guild.bosque.estagio.bosqueAntigo.nome': ['Bosque antigo', 'Old grove'],
  'guild.marco.ramagem.mundo': ['O bosque ganhou ramagem.', 'The grove grew boughs.'],
  'guild.marco.ramagem.pet': ['Olha, achou onde se apoiar.', 'Look, it found something to hold.'],
  'guild.marco.copa.mundo': ['O bosque fechou copa.', 'The grove has closed its canopy.'],
  'guild.marco.copa.pet': ['Tá mais alto que eu agora.', "It's taller than me now."],
  'guild.marco.mata.mundo': ['O bosque virou mata.', 'The grove has become a thicket.'],
  'guild.marco.mata.pet': ['Tem sombra aqui dentro.', "There's shade in here."],
  'guild.marco.bosqueAntigo.mundo': ['O bosque é antigo agora.', 'The grove is old now.'],
  'guild.marco.bosqueAntigo.pet': ['Tem cheiro de cobre.', 'It smells of copper.'],
  'guild.marco.botao': ['Continuar', 'Continue'],
  'guild.marco.aviso': ['Novo estágio do bosque: {estagio}.', 'New stage for the grove: {estagio}.'],
  'guild.marco.cenario': ['Cenário do bosque: {estagio}. Já está em Background.', 'Grove scenery: {estagio}. It is now under Background.'],
  'guild.concha.nome': ['Concha da Maré', 'Tide shell'],
  'guild.concha.desc': ['Deixada pela maré no bosque.', 'Left by the tide in the grove.'],
} as const satisfies Record<string, readonly [string, string]>;

export type GuildCoreKey = keyof typeof GUILD_COPY_CORE;

/** `{estagio}` e cia.: mesma interpolação de `guildText`, para o que o App lê sem trazer a tabela toda. */
export function guildCoreText(language: Language, key: GuildCoreKey, vars?: Record<string, string | number>): string {
  const [pt, en] = GUILD_COPY_CORE[key];
  const raw = language === 'pt-BR' ? pt : en;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

// Os ids do servidor são `bosque-antigo`… e as chaves do documento são camelCase: esta é a ÚNICA ponte.
export const STAGE_KEY = { clareira: 'clareira', ramagem: 'ramagem', copa: 'copa', mata: 'mata', 'bosque-antigo': 'bosqueAntigo' } as const satisfies Record<GroveStageId, string>;

export const groveStageName = (language: Language, stage: GroveStageId): string =>
  guildCoreText(language, `guild.bosque.estagio.${STAGE_KEY[stage]}.nome`);

/** Cerimônia: só a Ramagem em diante tem marco (a Clareira é o chão de partida). */
export type GroveMarcoStage = Exclude<GroveStageId, 'clareira'>;
export const groveMarcoText = (language: Language, stage: GroveMarcoStage, quem: 'mundo' | 'pet'): string =>
  guildCoreText(language, `guild.marco.${STAGE_KEY[stage]}.${quem}`);
