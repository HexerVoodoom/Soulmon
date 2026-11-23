// Validador/importador do CSV E2.4. NAO escreve no jogo: devolve o que a sessao operacional aplicaria.
// Regras (E2.4): e atualizacao, nao substituicao. `id` desconhecido = erro com o numero da linha; `id` ausente no CSV NAO e apagado;
// celula vazia em campo obrigatorio = erro (`nome_pt`, `estagio` e `elemento` sao obrigatorios para `soulmon`); valores fechados validados.
import { COLUNAS, COLUNAS_V1, parseCsv } from './csv.mjs';

export const ENUMS_FECHADOS = {
  tipo_entidade: ['soulmon', 'npc'],
  estagio: ['rookie', 'champion', 'ultimate', 'mega', 'ultra'],
  ramo: ['power', 'harmony', 'benevolence'],
  origem_ataque: ['ficha', 'padrao', 'sem_ataque'],
  usar_no_jogo: ['sim', 'nao'],
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
  // v2 = COLUNAS (com usar_no_jogo no fim); v1 = sem a coluna (aceito; todas as linhas contam como `sim`)
  const cab = registros[0].join(',');
  const v1 = cab === COLUNAS_V1.join(',');
  if (!v1 && cab !== COLUNAS.join(',')) {
    return { erros: [{ linha: 1, id: '', mensagem: 'cabecalho diferente do E2.4 v2 (ou v1 sem usar_no_jogo); esperado: ' + COLUNAS.join(',') }], atualizacoes, mantidos: [], ok: false };
  }
  const NCOL = v1 ? COLUNAS_V1.length : COLUNAS.length;
  const porId = new Map(canonicas.map((l) => [l.id, l]));
  const fechadas = { ...ENUMS_FECHADOS, elemento: vocab.elementos, ataque_basico: vocab.escolas, ataque_especial_escola: vocab.escolas, ataque_especial_familia: vocab.familias };
  for (let r = 1; r < registros.length; r++) {
    const linha = linhaInicial[r]; const cel = registros[r];
    const id = cel[0] ?? '';
    const erro = (mensagem) => erros.push({ linha, id, mensagem });
    if (cel.length !== NCOL) { erro(`${cel.length} colunas (esperado ${NCOL})`); continue; }
    const row = Object.fromEntries(COLUNAS.map((c, i) => [c, cel[i]]));
    if (v1) row.usar_no_jogo = 'sim';
    const atual = porId.get(id);
    if (!atual) { erro(`id desconhecido "${id}" (importacao so atualiza; nao cria)`); continue; }
    if (vistos.has(id)) { erro(`id repetido "${id}"`); continue; }
    vistos.add(id);
    let linhaOk = true;
    for (const c of SOMENTE_LEITURA) if (row[c] !== atual[c]) { erro(`campo somente leitura "${c}" alterado (${atual[c]} -> ${row[c]})`); linhaOk = false; }
    if (row.tipo_entidade === 'soulmon') for (const c of OBRIGATORIOS_SOULMON) if (!row[c]) { erro(`campo obrigatorio vazio: ${c}`); linhaOk = false; }
    if (row.usar_no_jogo === '') { erro('campo obrigatorio vazio: usar_no_jogo (sim ou nao)'); linhaOk = false; }
    for (const [c, lista] of Object.entries(fechadas)) if (row[c] && !lista.includes(row[c])) { erro(`valor fora da lista em ${c}: "${row[c]}"`); linhaOk = false; }
    if (!linhaOk) continue;
    const campos = {};
    for (const c of COLUNAS) if (row[c] !== atual[c]) campos[c] = { de: atual[c], para: row[c] };
    if (Object.keys(campos).length) atualizacoes.push({ id, linha, campos });
  }
  const mantidos = canonicas.filter((l) => !vistos.has(l.id)).map((l) => l.id);
  return { erros, atualizacoes, mantidos, ok: erros.length === 0 };
}
