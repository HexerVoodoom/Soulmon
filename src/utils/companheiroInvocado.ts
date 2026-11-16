// ---------------------------------------------------------------------------
// COMPANHEIRO INVOCADO — fundação (PR 1, 16/11/2026). Dono ÚNICO da regra
// "quem tem companheiro em combate" e do cache por estágio. Sem combate e sem
// UI: nada aqui é lido por `fight()`, `BattleStage` nem pelo servidor ainda.
//
// Decisões do dono (16/11/2026, docs/PLANO-COMPANHEIRO-INVOCADO-2026-11-16.md):
//  · vale para TODO Soulmon (jogador real, simulado, NPC) cujo ARQUÉTIPO do
//    estágio atual esteja em `ARQUETIPOS_EVOCACAO` OU cuja escola dominante da
//    ficha seja Evocação;
//  · a CRIATURA é uma das 32 do class-system, a do sorteio determinístico do
//    Oráculo (`selectCompanion`, cache `soulmonCompanheiro`): este módulo NÃO
//    sorteia, só decide se naquele estágio ela aparece;
//  · "perde se a forma não é evocadora; volta quando voltar": nada é apagado,
//    a decisão é por estágio e sem estado (a criatura fica no cache).
//
// Tudo atrás de UMA flag, desligada. Funções puras.
// ---------------------------------------------------------------------------

import { FICHA_STAGE_ORDER, type FichaStage } from './soulProfile/ficha/types';

/** INTERRUPTOR ÚNICO do companheiro invocado. Desligado: nada preenche o cache `soulmonEvocacao` e `companheiroAtivo` /
 *  `companheiroPorLinha` devolvem `null`. O código e o campo do save ficam inertes. Para religar: `true` aqui, e só aqui. */
export const COMPANHEIRO_INVOCADO = false as boolean;

/** Ids dos arquétipos de evocação (lista do dono, 16/11/2026). Ids estáveis do class-system, nunca o nome PT. */
export const ARQUETIPOS_EVOCACAO: readonly string[] = [
  'invocador',
  'senhor_das_feras',
  'xama_totemico',
  'necromante',
  'demonologista',
  'verdejante',
  'senhor_dos_mortos_vis',
  'bokor',
  'escriba_do_pacto',
];

/** Id da escola de Evocação na ficha (`EscolaId`). */
export const ESCOLA_EVOCACAO = 'evocacao';

/**
 * As 32 criaturas do class-system que podem ser companheiro (`classSystem.data.json` › `criaturas`). Lista fixa aqui para
 * este módulo não importar o registro inteiro; o teste a confronta com o snapshot (some/entra criatura = teste vermelho).
 */
export const CRIATURAS_COMPANHEIRO: readonly string[] = [
  'lobo', 'urso', 'felino', 'javali', 'falcao', 'coruja', 'serpente_marinha', 'tubarao',
  'salamandra', 'cao_de_lava', 'fenix_menor', 'ghoul', 'cavaleiro_morto', 'sombra_rastejante', 'olho_vil', 'trevo_carnivoro',
  'ent', 'fada', 'anjo_menor', 'espectro', 'golem_pedra', 'automato', 'imp', 'demonio_maior',
  'wyvern', 'dragao_jovem', 'troll_montanhes', 'ciclope_forjador', 'gosma_acida', 'slime_cristalino', 'batedor_orc', 'arauto_elfico',
];

const CRIATURAS_SET: ReadonlySet<string> = new Set(CRIATURAS_COMPANHEIRO);
const ARQUETIPOS_SET: ReadonlySet<string> = new Set(ARQUETIPOS_EVOCACAO);
const ESTAGIOS_SET: ReadonlySet<string> = new Set(FICHA_STAGE_ORDER);

/** É uma das 32 criaturas conhecidas? */
export function criaturaConhecida(id: unknown): id is string {
  return typeof id === 'string' && CRIATURAS_SET.has(id);
}

/** Entradas que decidem o gatilho de UM estágio. */
export interface EvocacaoDoEstagio {
  /** id do arquétipo do estágio (`ClassTitle.id`); ausente = classe sem arquétipo (genérica) ou cache antigo. */
  arquetipoId?: string | null;
  /** id da escola dominante da ficha do estágio (`EscolaId`). */
  escolaDominante?: string | null;
}

/** O estágio é de um evocador? (arquétipo da lista OU escola dominante = Evocação). `estagio` inválido = false. */
export function eEvocador(estagio: string, dados: EvocacaoDoEstagio | null | undefined): boolean {
  if (!ESTAGIOS_SET.has(estagio) || !dados) return false;
  if (typeof dados.arquetipoId === 'string' && ARQUETIPOS_SET.has(dados.arquetipoId)) return true;
  return dados.escolaDominante === ESCOLA_EVOCACAO;
}

/**
 * A criatura que acompanha o Soulmon NESTE estágio, ou `null`. `criaturaId` é o `soulmonCompanheiro.id` (sorteio do Oráculo,
 * igual em todos os estágios). Forma não evocadora = `null`; a criatura não é apagada, então volta quando a forma voltar.
 */
export function companheiroDoEstagio(args: { estagio: string; criaturaId: unknown } & EvocacaoDoEstagio): string | null {
  if (!criaturaConhecida(args.criaturaId)) return null;
  return eEvocador(args.estagio, args) ? args.criaturaId : null;
}

// ------------------------------------------------------------------ cache

/** Cache aditivo por estágio (`GameState.soulmonEvocacao`). `evocador` é o veredito; `arquetipoId` é o dado de origem. */
export interface EvocacaoEstagio {
  evocador: boolean;
  arquetipoId?: string;
}
export type EvocacaoPorEstagio = Partial<Record<FichaStage, EvocacaoEstagio>>;

/** Leitura tolerante do cache vindo do save/nuvem. Qualquer lixo vira `undefined`/estágio descartado; nunca lança. */
export function sanitizeEvocacao(v: unknown): EvocacaoPorEstagio | undefined {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const bruto = v as Record<string, unknown>;
  const out: EvocacaoPorEstagio = {};
  for (const estagio of FICHA_STAGE_ORDER) {
    const e = Object.prototype.hasOwnProperty.call(bruto, estagio) ? bruto[estagio] : undefined;
    if (!e || typeof e !== 'object' || Array.isArray(e)) continue;
    const { evocador, arquetipoId } = e as { evocador?: unknown; arquetipoId?: unknown };
    if (typeof evocador !== 'boolean') continue;
    out[estagio] = typeof arquetipoId === 'string' && arquetipoId.length > 0 && arquetipoId.length <= 64
      ? { evocador, arquetipoId }
      : { evocador };
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * Migração idempotente: o PRIMEIRO valor de cada estágio vence (mesmo padrão de `soulmonCompanheiro`); só entram estágios que
 * faltam. `migrar(migrar(a, b), b)` é igual a `migrar(a, b)`. Devolve a MESMA referência de `atual` quando nada muda.
 */
export function migrarEvocacao(atual: EvocacaoPorEstagio | undefined, derivado: EvocacaoPorEstagio | undefined): EvocacaoPorEstagio | undefined {
  if (!derivado) return atual;
  const out: EvocacaoPorEstagio = { ...(atual ?? {}) };
  let mudou = false;
  for (const estagio of FICHA_STAGE_ORDER) {
    const novo = derivado[estagio];
    if (out[estagio] || !novo) continue;
    out[estagio] = novo;
    mudou = true;
  }
  return mudou ? out : atual;
}

/**
 * Consulta de quem usará o cache (PR 2): o companheiro do estágio a partir do que o SAVE guarda. Flag desligada = `null`.
 * Estágio sem entrada no cache = `null` (nunca adivinha).
 */
export function companheiroAtivo(
  estagio: string,
  criaturaId: unknown,
  cache: EvocacaoPorEstagio | undefined,
): string | null {
  if (!COMPANHEIRO_INVOCADO || !ESTAGIOS_SET.has(estagio)) return null;
  if (!cache?.[estagio as FichaStage]?.evocador) return null;
  return criaturaConhecida(criaturaId) ? criaturaId : null;
}
