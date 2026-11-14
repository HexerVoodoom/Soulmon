// Formato E2.4 (docs/BACKLOG-BETA12.md): CSV UTF-8 sem BOM, virgula, RFC 4180, fim de linha LF, cabecalho fixo.
// Modulo PURO (sem import): o gerador copia o texto das funcoes para dentro do HTML, entao o artefato e os testes usam o MESMO codigo.
export const NOME_ARQUIVO_CSV = 'soulmon-npcs-beta12-v2.csv';
export const COLUNAS = ['id', 'tipo_entidade', 'linha_id', 'estagio', 'ramo', 'nome_pt', 'nome_en', 'elemento', 'ataque_basico', 'ataque_especial_escola', 'ataque_especial_familia', 'origem_ataque', 'fonte_codigo', 'usar_no_jogo'];
/** Formato v1 (sem usar_no_jogo): o importador ainda aceita, tratando como `sim`. */
export const COLUNAS_V1 = COLUNAS.slice(0, -1);

export function celulaCsv(v) {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/** linhas: objetos com as COLUNAS. Cada registro termina em LF (inclusive o ultimo). */
export function toCsv(linhas) {
  let out = COLUNAS.join(',') + '\n';
  for (const l of linhas) out += COLUNAS.map((c) => celulaCsv(l[c])).join(',') + '\n';
  return out;
}

/** Parser RFC 4180. Devolve { registros: string[][], linhaInicial: number[] } (linhaInicial = linha do ARQUIVO onde o registro comeca, 1-based). Aceita CRLF na entrada. */
export function parseCsv(texto) {
  const t = texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto;
  const registros = []; const linhaInicial = [];
  let campo = ''; let reg = []; let aspas = false; let linha = 1; let iniReg = 1; let temConteudo = false;
  const fechaCampo = () => { reg.push(campo); campo = ''; };
  const fechaReg = () => { fechaCampo(); registros.push(reg); linhaInicial.push(iniReg); reg = []; temConteudo = false; };
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (aspas) {
      if (c === '"') { if (t[i + 1] === '"') { campo += '"'; i++; } else aspas = false; }
      else { if (c === '\n') linha++; campo += c; }
      continue;
    }
    if (c === '"') { aspas = true; temConteudo = true; }
    else if (c === ',') { fechaCampo(); temConteudo = true; }
    else if (c === '\r') { /* CRLF: o \n fecha */ }
    else if (c === '\n') { if (temConteudo || reg.length || campo) fechaReg(); linha++; iniReg = linha; }
    else { campo += c; temConteudo = true; }
  }
  if (aspas) throw new Error('aspas nao fechadas no fim do arquivo (registro iniciado na linha ' + iniReg + ')');
  if (temConteudo || reg.length || campo) fechaReg();
  return { registros, linhaInicial };
}
