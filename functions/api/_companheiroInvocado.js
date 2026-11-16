// ---------------------------------------------------------------------------
// COMPANHEIRO INVOCADO no servidor (PR 2, 16/11/2026) — espelho de `src/utils/companheiroInvocado.ts` (+ `...Linhas.ts` para
// simulados). As Pages Functions não importam de `src/`, então a regra "quem invoca" mora AQUI também; o teste
// `companheiroInvocado.parity.test.js` trava as duas cópias (flag, lista de criaturas, escola dos simulados por elemento × linha).
//
// O SERVIDOR NUNCA CONFIA NO CLIENTE: o veredito vem do SAVE que ele mesmo lê no KV (cache `soulmonEvocacao` + sorteio
// `soulmonCompanheiro`) ou da TABELA dos simulados. Save sem o cache do estágio (ou sem companheiro válido) = sem companheiro;
// nunca se adivinha. Flag desligada = `null` e NENHUM campo novo sai na ficha de luta (a resposta fica byte a byte a de hoje).
// ---------------------------------------------------------------------------
import { fichaStageOf } from './_duel.js';
import { SIMULADOS } from './_simulados.data.js';
import { hexCrownEquipped } from './_hexsmith.js';

/** INTERRUPTOR ÚNICO do servidor; igual à flag do app (o teste de paridade trava os dois). Religar: `true` aqui e em `companheiroInvocado.ts`. */
export const COMPANHEIRO_INVOCADO = true;

/** As 32 criaturas do class-system (espelho de `CRIATURAS_COMPANHEIRO`). */
export const CRIATURAS_COMPANHEIRO = [
  'lobo', 'urso', 'felino', 'javali', 'falcao', 'coruja', 'serpente_marinha', 'tubarao',
  'salamandra', 'cao_de_lava', 'fenix_menor', 'ghoul', 'cavaleiro_morto', 'sombra_rastejante', 'olho_vil', 'trevo_carnivoro',
  'ent', 'fada', 'anjo_menor', 'espectro', 'golem_pedra', 'automato', 'imp', 'demonio_maior',
  'wyvern', 'dragao_jovem', 'troll_montanhes', 'ciclope_forjador', 'gosma_acida', 'slime_cristalino', 'batedor_orc', 'arauto_elfico',
];

/** Papel do simulado a partir do elemento (espelho de `PAPEL_POR_ELEMENTO`; fora da tabela = mágico). */
const PAPEL_POR_ELEMENTO = {
  terra: 'tanque', planta: 'tanque', vida: 'tanque', vigor: 'tanque', industrial: 'tanque',
  agua: 'suporte', luz: 'suporte',
  fogo: 'fisico', marcial: 'fisico',
  ar: 'alcance',
};
/** As linhas em que cada papel cai na escola de Evocação (recorte de `ROLE_SCHOOL_BY_ALIGNMENT`; o teste compara com a tabela inteira). */
const EVOCACAO_POR_PAPEL = { tanque: ['harmonia', 'benevolencia'], magico: ['benevolencia'] };

/** O simulado (elemento + linha) é evocador? Sem flag aqui: o chamador decide. */
export function simuladoEvocador(elemento, linha) {
  const papel = typeof elemento === 'string' && Object.hasOwn(PAPEL_POR_ELEMENTO, elemento) ? PAPEL_POR_ELEMENTO[elemento] : 'magico';
  return typeof linha === 'string' && (EVOCACAO_POR_PAPEL[papel] ?? []).includes(linha);
}

const SIM_POR_ID = new Map(SIMULADOS.map((s) => [s.id, s]));

/**
 * O que a ficha de luta ganha quando o dono do save invoca: `{ invoca: true, companheiro? }`, ou `null`.
 * `saveId` só serve para reconhecer um SIMULADO (id da tabela). Flag desligada = sempre `null`.
 * `ligado` existe só para o teste exercitar o caminho ligado; produção usa a flag.
 * @param {any} state @param {string} [saveId] @param {boolean} [ligado]
 * @returns {{ invoca: true, companheiro?: string } | null}
 */
export function companheiroDoLado(state, saveId, ligado = COMPANHEIRO_INVOCADO) {
  if (!ligado) return null;
  const sim = typeof saveId === 'string' ? SIM_POR_ID.get(saveId) : undefined;
  if (sim) return simuladoEvocador(sim.element, sim.line) ? { invoca: true } : null;
  // Coroa da Hexsmith equipada (save já saneado por `_hexsmith.js`) = o especial vira o da Coroa e o companheiro descansa (paridade com o cliente).
  if (hexCrownEquipped(state?.hexsmith)) return null;
  const estagio = fichaStageOf(state?.evolutionStage);
  const evoc = state?.soulmonEvocacao;
  const e = evoc && typeof evoc === 'object' && !Array.isArray(evoc) && Object.hasOwn(evoc, estagio) ? evoc[estagio] : null;
  if (!e || typeof e !== 'object' || e.evocador !== true) return null;
  const id = state?.soulmonCompanheiro?.id;
  return typeof id === 'string' && CRIATURAS_COMPANHEIRO.includes(id) ? { invoca: true, companheiro: id } : null;
}
