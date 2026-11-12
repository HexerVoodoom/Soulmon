// Validador/importador do CSV E2.4. NAO escreve no jogo: devolve o que a sessao operacional aplicaria.
// Regras (E2.4): e atualizacao, nao substituicao. `id` desconhecido = erro com o numero da linha; `id` ausente no CSV NAO e apagado;
// celula vazia em campo obrigatorio = erro (`nome_pt`, `estagio` e `elemento` sao obrigatorios para `soulmon`); valores fechados validados.
import { COLUNAS, parseCsv } from './csv.mjs';

export const ENUMS_FECHADOS = {
  tipo_entidade: ['soulmon', 'npc'],
  estagio: ['rookie', 'champion', 'ultimate', 'mega', 'ultra'],
  ramo: ['power', 'harmony', 'benevolence'],
  origem_ataque: ['ficha', 'padrao', 'sem_ataque'],
};
export const OBRIGATORIOS_SOULMON = ['nome_pt', 'estagio', 'elemento'];
const SOMENTE_LEITURA = ['id', 'tipo_entidade', 'fonte_codigo'];

/**
 * @param texto CSV
 * @param canonicas linhas hoje no jogo (objetos com as COLUNAS)
 * @param vocab { elementos: string[], escolas: string[], familias: string[] }
 * @returns { erros: {linha:number, id:string, mensagem:string}[], atualizacoes: {id, linha, campos:{col:{de,para}}}[], mantidos: string[], ok: boolean }
 */
export function validarImportacao(texto, canonicas, vocab) {
  const erros = []; const atualizacoes = []; const vistos = new Set();
  let parsed;
  try { parsed = parseCsv(texto); } catch (e) { return { erros: [{ linha: 1, id: '', mensagem: String(e.message) }], atualizacoes, mantidos: [], ok: false }; }
  const { registros, linhaInicial } = parsed;
  if (!registros.length) return { erros: [{ linha: 1, id: '', mensagem: 'arquivo vazio' }], atualizacoes, mantidos: [], ok: false };
  if (registros[0].join(',') !== COLUNAS.join(',')) {
    return { erros: [{ linha: 1, id: '', mensagem: 'cabecalho diferente do E2.4; esperado: ' + COLUNAS.join(',') }], atualizacoes, mantidos: [], ok: false };
  }
  const porId = new Map(canonicas.map((l) => [l.id, l]));
  const fechadas = { ...ENUMS_FECHADOS, elemento: vocab.elementos, ataque_basico: vocab.escolas, ataque_especial_escola: vocab.escolas, ataque_especial_familia: vocab.familias };
  for (let r = 1; r < registros.length; r++) {
    const linha = linhaInicial[r]; const cel = registros[r];
    const id = cel[0] ?? '';
    const erro = (mensagem) => erros.push({ linha, id, mensagem });
    if (cel.length !== COLUNAS.length) { erro(`${cel.length} colunas (esperado ${COLUNAS.length})`); continue; }
    const row = Object.fromEntries(COLUNAS.map((c, i) => [c, cel[i]]));
    const atual = porId.get(id);
    if (!atual) { erro(`id desconhecido "${id}" (importacao so atualiza; nao cria)`); continue; }
    if (vistos.has(id)) { erro(`id repetido "${id}"`); continue; }
    vistos.add(id);
    let linhaOk = true;
    for (const c of SOMENTE_LEITURA) if (row[c] !== atual[c]) { erro(`campo somente leitura "${c}" alterado (${atual[c]} -> ${row[c]})`); linhaOk = false; }
    if (row.tipo_entidade === 'soulmon') for (const c of OBRIGATORIOS_SOULMON) if (!row[c]) { erro(`campo obrigatorio vazio: ${c}`); linhaOk = false; }
    for (const [c, lista] of Object.entries(fechadas)) if (row[c] && !lista.includes(row[c])) { erro(`valor fora da lista em ${c}: "${row[c]}"`); linhaOk = false; }
    if (!linhaOk) continue;
    const campos = {};
    for (const c of COLUNAS) if (row[c] !== atual[c]) campos[c] = { de: atual[c], para: row[c] };
    if (Object.keys(campos).length) atualizacoes.push({ id, linha, campos });
  }
  const mantidos = canonicas.filter((l) => !vistos.has(l.id)).map((l) => l.id);
  return { erros, atualizacoes, mantidos, ok: erros.length === 0 };
}
