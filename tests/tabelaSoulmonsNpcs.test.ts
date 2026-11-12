/**
 * BETA12 E2 — Tabela de Soulmons e NPCs (fora do jogo). Critérios de aceite E2.6 do `docs/BACKLOG-BETA12.md`.
 * Gera o artefato numa pasta temporária (nunca em `docs/`) e confere JSON, CSV e o HTML (lógica de filtro e painel extraída do HTML gerado).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
// @ts-ignore — módulo .mjs sem declaração (scripts/ não entra no tsc)
import { gerarDados } from '../scripts/tabela-beta12/dados.mjs';
// @ts-ignore
import { COLUNAS, NOME_ARQUIVO_CSV, parseCsv, toCsv } from '../scripts/tabela-beta12/csv.mjs';
// @ts-ignore
import { validarImportacao } from '../scripts/tabela-beta12/importar.mjs';
import { SPRITE_ELEMENT } from '../src/utils/spriteElement';
import { NOVOS_DATA } from '../src/utils/novosSoulmonData';
import { STARTER_ELEMENT } from '../src/utils/starterElements';
import { CORVO_FORM_IDS } from '../src/utils/corvoPet';

type Linha = Record<string, string>;
const RAIZ = path.resolve(__dirname, '..');
const CABECALHO = 'id,tipo_entidade,linha_id,estagio,ramo,nome_pt,nome_en,elemento,ataque_basico,ataque_especial_escola,ataque_especial_familia,origem_ataque,fonte_codigo,usar_no_jogo';
const NL = String.fromCharCode(10);
const ORACLE_IDS = ['agua', 'fogo', 'terra', 'ar', 'sombra', 'luz', 'planta', 'industrial'];

let linhas: Linha[]; let vocab: { elementos: string[]; escolas: string[]; familias: string[] }; let contagem: Record<string, number>;
let pasta: string; let jsonGerado: { total: number; contagem: Record<string, number>; linhas: Linha[] }; let html: string;

beforeAll(async () => {
  const d = await gerarDados();
  linhas = d.linhas; vocab = d.vocab; contagem = d.contagem;
  pasta = mkdtempSync(path.join(process.env.TABELA_TMP || tmpdir(), 'tabela-b12-teste-'));
  execFileSync(process.execPath, [path.join(RAIZ, 'scripts', 'gerar-tabela-soulmons-npcs.mjs'), pasta], { cwd: RAIZ, stdio: 'pipe' });
  jsonGerado = JSON.parse(readFileSync(path.join(pasta, 'tabela-soulmons-npcs.json'), 'utf8'));
  html = readFileSync(path.join(pasta, 'tabela-soulmons-npcs.html'), 'utf8');
}, 120_000);

/**
 * A lógica do artefato (filtro e painel) é o trecho entre os marcadores LOGICA e FIM-LOGICA do HTML GERADO, junto do código do CSV embutido:
 * o teste roda o MESMO texto que o dono vai executar (jsdom não está utilizável neste node_modules compartilhado; a cola de DOM foi conferida no navegador).
 */
function logica() {
  const ini = html.indexOf('/*LOGICA*/'); const fim = html.indexOf('/*FIM-LOGICA*/');
  const csvIni = html.indexOf("'use strict';") + "'use strict';".length; const csvFim = ini;
  expect(ini).toBeGreaterThan(0); expect(fim).toBeGreaterThan(ini);
  const corpo = html.slice(csvIni, csvFim) + html.slice(ini, fim);
  const fabrica = new Function(corpo + '; return { filtrarIndices, camposDoPainel, toCsv, parseCsv, COLUNAS, NOME_ARQUIVO_CSV };');
  return fabrica() as {
    filtrarIndices: (l: Linha[], f: Record<string, string[]>, b: string) => number[];
    camposDoPainel: (l: Linha, listas: Record<string, string[]>) => { col: string; tipo: string; valor: string; opcoes?: string[] }[];
    toCsv: (l: Linha[]) => string; parseCsv: (t: string) => { registros: string[][] }; COLUNAS: string[]; NOME_ARQUIVO_CSV: string;
  };
}
const ENUMS = { estagio: ['rookie', 'champion', 'ultimate', 'mega', 'ultra'], ramo: ['power', 'harmony', 'benevolence'], origem_ataque: ['ficha', 'padrao', 'sem_ataque'], usar_no_jogo: ['sim', 'nao'] };
const listas = () => ({ ...ENUMS, elemento: vocab.elementos, ataque_basico: vocab.escolas, ataque_especial_escola: vocab.escolas, ataque_especial_familia: vocab.familias });

describe('E2.6-1 total e contagem', () => {
  it('linhas do artefato = linhas do JSON; contagem por tipo_entidade registrada', () => {
    const L = logica();
    expect(jsonGerado.total).toBe(jsonGerado.linhas.length);
    expect(L.filtrarIndices(jsonGerado.linhas, {}, '').length).toBe(jsonGerado.total);
    expect(html).toContain(`"id":"${jsonGerado.linhas[jsonGerado.total - 1].id}"`);
    expect(jsonGerado.linhas).toEqual(linhas);
    const soma = Object.values(jsonGerado.contagem).reduce((a, b) => a + b, 0);
    expect(soma).toBe(jsonGerado.total);
    expect(jsonGerado.contagem).toEqual(contagem);
    expect(contagem.soulmon).toBeGreaterThan(0);
    expect(contagem.npc).toBeGreaterThan(0);
    console.log('contagem por tipo_entidade:', JSON.stringify(contagem));
  });
  it('ids únicos', () => {
    expect(new Set(linhas.map((l) => l.id)).size).toBe(linhas.length);
  });
});

describe('E2.6-2 escada do corvo', () => {
  it('rookie, champion x3, ultimate x3, mega x3, ultra (11), sem id repetido, na ordem de CORVO_FORM_IDS', () => {
    const corvo = linhas.filter((l) => l.tipo_entidade === 'soulmon' && l.linha_id === 'corvo');
    expect(corvo).toHaveLength(11);
    expect(corvo.map((l) => (l.ramo ? `${l.estagio}-${l.ramo}` : l.estagio))).toEqual([...CORVO_FORM_IDS]);
    expect(corvo.map((l) => l.estagio)).toEqual(['rookie', ...Array(3).fill('champion'), ...Array(3).fill('ultimate'), ...Array(3).fill('mega'), 'ultra']);
    expect(corvo.map((l) => l.ramo)).toEqual(['', 'power', 'harmony', 'benevolence', 'power', 'harmony', 'benevolence', 'power', 'harmony', 'benevolence', '']);
    expect(corvo.map((l) => l.id)).toEqual(CORVO_FORM_IDS.map((f) => `soulmon.corvo.${f}`));
  });
});

describe('E2.6-3/4/10 dados válidos e sem invenção', () => {
  it('nenhum Soulmon sem nome_pt, estagio ou elemento', () => {
    for (const l of linhas.filter((x) => x.tipo_entidade === 'soulmon')) {
      expect(l.nome_pt, l.id).not.toBe('');
      expect(l.estagio, l.id).not.toBe('');
      expect(l.elemento, l.id).not.toBe('');
    }
  });
  it('todo elemento é um ElementId ou combinado que existe no código', () => {
    // vocabulário lido do CÓDIGO, independente do script: ElementId do oráculo + valores de SPRITE_ELEMENT (novos, combinados, chefes, iniciais, linhas, neutro)
    const codigo = new Set<string>([...ORACLE_IDS, ...Object.values(SPRITE_ELEMENT)]);
    for (const l of linhas.filter((x) => x.elemento)) expect(codigo.has(l.elemento), `${l.id}: ${l.elemento}`).toBe(true);
    expect(new Set(vocab.elementos)).toEqual(codigo);
    // os iniciais vêm do elemento de uma criatura base real
    const bases = new Set(NOVOS_DATA.map((n) => n.element));
    for (const [id, el] of Object.entries(STARTER_ELEMENT)) expect(bases.has(el) || ORACLE_IDS.includes(el), `${id}:${el}`).toBe(true);
  });
  it('valores fechados: estágio, ramo, escolas, famílias e origem', () => {
    const est = ['rookie', 'champion', 'ultimate', 'mega', 'ultra']; const ramos = ['power', 'harmony', 'benevolence'];
    for (const l of linhas) {
      expect(['soulmon', 'npc']).toContain(l.tipo_entidade);
      if (l.estagio) expect(est).toContain(l.estagio);
      if (l.ramo) expect(ramos).toContain(l.ramo);
      if (l.ataque_basico) expect(vocab.escolas).toContain(l.ataque_basico);
      if (l.ataque_especial_escola) expect(vocab.escolas).toContain(l.ataque_especial_escola);
      if (l.ataque_especial_familia) expect(vocab.familias).toContain(l.ataque_especial_familia);
      expect(['ficha', 'padrao', 'sem_ataque']).toContain(l.origem_ataque);
    }
  });
  it('toda linha tem fonte_codigo; NPC sem ataque sai sem_ataque e campos de ataque vazios; Soulmon sem ficha sai padrao', () => {
    for (const l of linhas) {
      expect(l.fonte_codigo, l.id).not.toBe('');
      if (l.tipo_entidade === 'npc') {
        expect(l.origem_ataque, l.id).toBe('sem_ataque');
        expect([l.ataque_basico, l.ataque_especial_escola, l.ataque_especial_familia], l.id).toEqual(['', '', '']);
      } else {
        expect(l.origem_ataque, l.id).toBe('padrao');
        expect(l.ataque_basico, l.id).not.toBe('');
      }
    }
  });
  it('id no padrão da E2.4', () => {
    for (const l of linhas) {
      if (l.tipo_entidade === 'soulmon') expect(l.id).toBe(`soulmon.${l.linha_id}.${l.ramo ? `${l.estagio}-${l.ramo}` : l.estagio}`);
      else expect(l.id).toMatch(/^npc\.[a-z]+\..+/);
    }
  });
});

describe('E2.6-5 filtro (lógica do HTML gerado)', () => {
  it('ramo=power + estagio=mega mostra só as linhas com os dois (E entre colunas)', () => {
    const L = logica();
    const idx = L.filtrarIndices(linhas, { ramo: ['power'], estagio: ['mega'] }, '');
    const esperado = linhas.filter((l) => l.ramo === 'power' && l.estagio === 'mega');
    expect(esperado.length).toBeGreaterThan(0);
    expect(idx.map((i) => linhas[i].id)).toEqual(esperado.map((l) => l.id));
  });
  it('duas opções na mesma coluna mostram a união (OU dentro da coluna)', () => {
    const L = logica();
    const idx = L.filtrarIndices(linhas, { ramo: ['power', 'harmony'] }, '');
    expect(idx.length).toBe(linhas.filter((l) => l.ramo === 'power' || l.ramo === 'harmony').length);
  });
  it('limpar tudo volta ao total; coluna sem opção marcada não filtra; a busca por nome/id é E com os filtros', () => {
    const L = logica();
    expect(L.filtrarIndices(linhas, {}, '').length).toBe(linhas.length);
    expect(L.filtrarIndices(linhas, { ramo: [] }, '').length).toBe(linhas.length);
    expect(L.filtrarIndices(linhas, { estagio: ['mega'] }, 'corvo').length).toBe(linhas.filter((l) => l.estagio === 'mega' && (l.id + l.nome_pt + l.nome_en).toLowerCase().includes('corvo')).length);
  });
  it('exporta só as linhas visíveis', () => {
    const L = logica();
    const idx = L.filtrarIndices(linhas, { tipo_entidade: ['npc'] }, '');
    expect(L.parseCsv(L.toCsv(idx.map((i) => linhas[i]))).registros.length - 1).toBe(contagem.npc);
  });
  it('os 9 filtros do E2.5 + usar_no_jogo existem no cabeçalho do HTML', () => {
    for (const c of ['usar_no_jogo', 'tipo_entidade', 'linha_id', 'estagio', 'ramo', 'elemento', 'ataque_basico', 'ataque_especial_escola', 'ataque_especial_familia', 'origem_ataque']) expect(html).toContain(`'${c}'`);
  });
});

describe('E2.6-6 painel de edição', () => {
  it('traz TODOS os campos da linha na ordem do CSV; comparação campo a campo = 0 diferença; id/tipo/fonte somente leitura; listas fechadas são seleção', () => {
    const L = logica();
    for (let i = 0; i < linhas.length; i++) {
      const campos = L.camposDoPainel(linhas[i], listas());
      expect(campos.map((c) => c.col)).toEqual(CABECALHO.split(','));
      let diferencas = 0;
      for (const c of campos) {
        if (c.valor !== linhas[i][c.col]) diferencas++;
        if (['id', 'tipo_entidade', 'fonte_codigo'].includes(c.col)) expect(c.tipo).toBe('ro');
        if (['estagio', 'ramo', 'elemento', 'ataque_basico', 'ataque_especial_escola', 'ataque_especial_familia', 'origem_ataque', 'usar_no_jogo'].includes(c.col)) {
          expect(c.tipo, c.col).toBe('select');
          expect(c.opcoes, `${linhas[i].id}:${c.col}`).toContain(linhas[i][c.col]); // o valor atual SEMPRE é uma opção (select abre nele)
        }
      }
      expect(diferencas, linhas[i].id).toBe(0);
    }
  });
});

describe('E2.6-7/8 CSV: round trip e diff de edição', () => {
  it('cabeçalho idêntico ao E2.4; UTF-8 sem BOM; LF; dois exports idênticos; o CSV de base gravado = export', () => {
    const L = logica();
    const a = L.toCsv(linhas); const b = L.toCsv(linhas.map((l) => ({ ...l })));
    expect(a).toBe(b);
    expect(a.split('\n')[0]).toBe(CABECALHO);
    expect((COLUNAS as string[]).join(',')).toBe(CABECALHO);
    expect(L.COLUNAS.join(',')).toBe(CABECALHO);
    expect(a.charCodeAt(0)).not.toBe(0xfeff);
    expect(a.includes(String.fromCharCode(13))).toBe(false);
    expect(a).toBe(toCsv(linhas)); // o código embutido no HTML = o código do script
    expect(readFileSync(path.join(pasta, NOME_ARQUIVO_CSV), 'utf8')).toBe(a);
    expect(L.NOME_ARQUIVO_CSV).toBe('soulmon-npcs-beta12-v2.csv');
    // reler o CSV e exportar de novo dá o mesmo texto (round trip byte a byte)
    const reg = L.parseCsv(a).registros; const volta = reg.slice(1).map((r) => Object.fromEntries(L.COLUNAS.map((c, i) => [c, r[i]])) as Linha);
    expect(L.toCsv(volta)).toBe(a);
  });
  it('parse(toCsv(x)) = x, inclusive vírgula, aspas e quebra de linha na célula', () => {
    const esquisitas: Linha[] = [{ ...Object.fromEntries((COLUNAS as string[]).map((c) => [c, ''])), id: 'a', nome_pt: 'Um, dois', nome_en: 'say "hi"', fonte_codigo: 'x\ny' }];
    const { registros } = parseCsv(toCsv(esquisitas));
    expect(registros[1][5]).toBe('Um, dois'); expect(registros[1][6]).toBe('say "hi"'); expect(registros[1][12]).toBe('x\ny');
    expect(registros).toHaveLength(2);
  });
  it('editar um campo e exportar muda só essa linha e só essa coluna', () => {
    const L = logica();
    const base = L.parseCsv(L.toCsv(linhas)).registros;
    const editadas = linhas.map((l) => ({ ...l })); editadas[3].nome_pt = 'Nome, editado'; editadas[3].origem_ataque = 'ficha';
    const novo = L.parseCsv(L.toCsv(editadas)).registros;
    expect(novo.length).toBe(base.length);
    const difs: string[] = [];
    novo.forEach((reg, r) => reg.forEach((v, c) => { if (v !== base[r][c]) difs.push(`${r}:${L.COLUNAS[c]}`); }));
    expect(difs.sort()).toEqual([`4:nome_pt`, `4:origem_ataque`].sort());
  });
});

describe('E2.6-9 importação (validador)', () => {
  it('CSV exportado sem edição valida sem erro e sem atualização; ausentes são mantidos', () => {
    const r = validarImportacao(toCsv(linhas.slice(0, 10)), linhas, vocab);
    expect(r.erros).toEqual([]); expect(r.atualizacoes).toEqual([]); expect(r.ok).toBe(true);
    expect(r.mantidos).toHaveLength(linhas.length - 10);
  });
  it('id desconhecido é recusado com o número da linha', () => {
    const csv = toCsv(linhas.slice(0, 3)).trimEnd().split('\n');
    csv.splice(2, 0, 'soulmon.fantasma.rookie,soulmon,fantasma,rookie,,X,X,fogo,conjuracao,conjuracao,direct,padrao,teste,sim');
    const r = validarImportacao(csv.join('\n') + '\n', linhas, vocab);
    expect(r.ok).toBe(false);
    expect(r.erros).toHaveLength(1);
    expect(r.erros[0].linha).toBe(3);
    expect(r.erros[0].mensagem).toContain('soulmon.fantasma.rookie');
  });
  it('campo obrigatório vazio e valor fora da lista são erros com a linha; edição válida vira atualização', () => {
    const l0 = { ...linhas[0], nome_pt: '' }; const l1 = { ...linhas[1], elemento: 'inexistente' }; const l2 = { ...linhas[2], nome_pt: 'Novo nome' };
    const r = validarImportacao(toCsv([l0, l1, l2]), linhas, vocab);
    expect(r.erros.map((e: { linha: number }) => e.linha).sort()).toEqual([2, 3]);
    expect(r.atualizacoes).toHaveLength(1);
    expect(r.atualizacoes[0].id).toBe(linhas[2].id);
    expect(Object.keys(r.atualizacoes[0].campos)).toEqual(['nome_pt']);
  });
  it('cabeçalho errado é recusado na linha 1; campo somente leitura alterado é erro', () => {
    expect(validarImportacao('a,b\n1,2\n', linhas, vocab).erros[0].linha).toBe(1);
    const r = validarImportacao(toCsv([{ ...linhas[0], fonte_codigo: 'outra' }]), linhas, vocab);
    expect(r.ok).toBe(false); expect(r.erros[0].linha).toBe(2);
  });
});

describe('v2: coluna usar_no_jogo', () => {
  it('default sim em todas as linhas; é a última coluna do cabeçalho', () => {
    expect(linhas.every((l) => l.usar_no_jogo === 'sim')).toBe(true);
    expect((COLUNAS as string[])[COLUNAS.length - 1]).toBe('usar_no_jogo');
    expect(jsonGerado.linhas.every((l) => l.usar_no_jogo === 'sim')).toBe(true);
  });
  it('filtro por usar_no_jogo: nao mostra só as marcadas; painel o trata como seleção sem opção vazia', () => {
    const L = logica();
    const ed = linhas.map((l) => ({ ...l })); ed[1].usar_no_jogo = 'nao'; ed[5].usar_no_jogo = 'nao';
    expect(L.filtrarIndices(ed, { usar_no_jogo: ['nao'] }, '')).toEqual([1, 5]);
    expect(L.filtrarIndices(ed, { usar_no_jogo: ['sim', 'nao'] }, '').length).toBe(ed.length);
    const campo = L.camposDoPainel(ed[1], listas()).find((c) => c.col === 'usar_no_jogo')!;
    expect(campo.tipo).toBe('select'); expect(campo.opcoes).toEqual(['sim', 'nao']); expect(campo.valor).toBe('nao');
  });
  it('round trip v2 preserva usar_no_jogo; editar muda só essa coluna', () => {
    const L = logica();
    const ed = linhas.map((l) => ({ ...l })); ed[2].usar_no_jogo = 'nao';
    const csv = L.toCsv(ed);
    const reg = L.parseCsv(csv).registros;
    expect(reg[0].at(-1)).toBe('usar_no_jogo'); expect(reg[3].at(-1)).toBe('nao');
    const volta = reg.slice(1).map((r) => Object.fromEntries(L.COLUNAS.map((c, i) => [c, r[i]])) as Linha);
    expect(L.toCsv(volta)).toBe(csv);
    const r = validarImportacao(csv, linhas, vocab);
    expect(r.ok).toBe(true);
    expect(r.atualizacoes).toHaveLength(1);
    expect(r.atualizacoes[0].campos).toEqual({ usar_no_jogo: { de: 'sim', para: 'nao' } });
  });
  it('importador aceita v1 (sem a coluna) como sim e v2; valor inválido é erro com a linha', () => {
    const v1 = toCsv(linhas.slice(0, 4)).trimEnd().split(NL).map((ln: string) => ln.replace(/,[^,]*$/, '')); // tira a última coluna
    const csv1 = v1.join(NL) + NL;
    expect(csv1.split(NL)[0]).toBe(CABECALHO.replace(',usar_no_jogo', ''));
    const r1 = validarImportacao(csv1, linhas, vocab);
    expect(r1.erros).toEqual([]); expect(r1.atualizacoes).toEqual([]); expect(r1.ok).toBe(true);
    const ruim = validarImportacao(toCsv([linhas[0], { ...linhas[1], usar_no_jogo: 'talvez' }, { ...linhas[2], usar_no_jogo: '' }]), linhas, vocab);
    expect(ruim.ok).toBe(false);
    expect(ruim.erros.map((e: { linha: number }) => e.linha)).toEqual([3, 4]);
  });
});

describe('E2.6-11 fora do jogo e peso', () => {
  it('HTML autocontido (sem recurso externo) e abaixo de 10 MB', () => {
    expect(html.length).toBeLessThan(10 * 1024 * 1024);
    expect(html).not.toMatch(/<(script|link|img)[^>]+(src|href)="https?:/);
  });
});
