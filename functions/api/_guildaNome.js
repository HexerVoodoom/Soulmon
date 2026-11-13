// O NOME DO CLÃ embaixo do nome do jogador (13/11/2026, pedido do dono; REGISTRO §321).
//
// Toda rota que mostra o nome de OUTRA pessoa (diretório, perfil, oponentes, treino, ranking do Torneio, placares dos jogos,
// convites de amizade, busca de jogadores) acrescenta `guildName` — e SÓ quando a pessoa está num clã. Sem clã, o campo não
// existe (a tela não desenha nada). O campo é ADITIVO: cliente antigo o ignora.
//
// A fonte é o ESTADO VIVO do clã (`coopOf:<save>` → `coop:<gid>`, `_coop.js`), lido na hora: nada é copiado para o perfil, então
// quem sai do clã deixa de mostrar o nome na próxima leitura, sem migração nem lápide. Custo: 1 `get` por pessoa + 1 por clã
// distinto (o `memo` divide a leitura do clã entre as linhas da MESMA resposta).
//
// O nome do clã já é público (o diretório "Procurar clã" o lista) e foi saneado na criação/renomeação
// (`sanitizarNomeDeGuilda`); aqui ele é saneado DE NOVO na saída — KV editado ou clã anterior à régua nunca vaza texto fora dela.
// Quem se escondeu da lista pública (`publicHidden`) nem chega aqui: as rotas o descartam antes.
import { kvOrThrow } from './_kv.js';
import { coopOfKey, lerGrupo, sanitizarNomeDeGuilda } from './_coop.js';

/**
 * Nome do clã de `saveId`, ou `null` (sem clã, índice órfão, clã do qual já saiu, nome fora da régua, KV fora do ar).
 * Nunca lança: o nome do clã é enfeite da linha, e uma falha aqui não pode derrubar o ranking ou o diretório.
 * @param {any} env
 * @param {string} saveId
 * @param {Map<string, Promise<{ members: string[], name: string | null } | null>>} [memo] por resposta (gid → clã)
 * @returns {Promise<string | null>}
 */
export async function nomeDaGuildaDe(env, saveId, memo = new Map()) {
  if (typeof saveId !== 'string' || !saveId) return null;
  try {
    const gid = await kvOrThrow(env).get(coopOfKey(saveId));
    if (!gid) return null;
    let entrada = memo.get(gid);
    if (!entrada) {
      entrada = lerGrupo(env, gid)
        .then(g => (g && Array.isArray(g.members) ? { members: g.members, name: sanitizarNomeDeGuilda(g.name) } : null))
        .catch(() => null);
      memo.set(gid, entrada);
    }
    const g = await entrada;
    // Índice que aponta um clã do qual a pessoa já saiu: sem nome (a limpeza do índice é de `grupoDe`, no caminho do DONO).
    if (!g || !g.members.includes(saveId) || !g.name) return null;
    return g.name;
  } catch {
    return null;
  }
}

/** `{ guildName }` só quando há nome — o campo AUSENTE é o "sem clã" do contrato. */
export const campoGuilda = (nome) => (typeof nome === 'string' && nome ? { guildName: nome } : {});

/**
 * Acrescenta `guildName` a cada linha, em paralelo, com UM memo para a resposta inteira.
 * @template T
 * @param {any} env
 * @param {T[]} linhas
 * @param {(linha: T) => string | null | undefined} saveIdDe
 * @returns {Promise<Array<T & { guildName?: string }>>}
 */
export async function comGuildas(env, linhas, saveIdDe) {
  const memo = new Map();
  return Promise.all(linhas.map(async (l) => {
    const save = saveIdDe(l);
    const nome = save ? await nomeDaGuildaDe(env, save, memo) : null;
    return { ...l, ...campoGuilda(nome) };
  }));
}
