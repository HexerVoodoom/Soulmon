/**
 * Guard: `docs/` não guarda documento que ensina regra MORTA.
 *
 * Onze arquivos herdados do DigiApp viveram em `docs/` até 07/09/2026 — entre
 * eles o `00-START-HERE.md`, o `README.md` e o `DOCS-INDEX.md`, ou seja, os
 * três títulos que um leitor novo abre primeiro. Eles afirmavam como fato
 * estágios (`DigiEgg`, `Baby I`), uma tabela de HP de 1 a 14, evolução
 * automática e degeneração — nada disso existe — e listavam ~20 nomes de
 * personagem da Bandai como roster.
 *
 * O `docs/squad/00-BRIEFING.md` já avisava "trate documentação antiga como
 * histórico". **Um aviso num arquivo não vence onze arquivos**: o mesmo
 * parágrafo mandava começar pelo `00-START-HERE`. Por isso o conserto foi
 * MOVER, e por isso existe este guard — mover uma vez não impede voltar.
 *
 * O que se trava é o mínimo defensável, não uma lista de palavras proibidas:
 * `docs/` no primeiro nível não pode ensinar estágio que não existe nem o
 * nome da chave de save antiga. `docs/historico-digiapp/` é isento por
 * definição (é onde essas coisas devem estar), e as subpastas de pesquisa
 * também — `guia-experiencia/` fala do Digimon a franquia, que é objeto de
 * estudo legítimo.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DOCS = join(process.cwd(), 'docs');

/** Regras mortas, com o nome do que as substituiu — o erro cita o conserto. */
const MORTAS: Array<{ padrao: RegExp; morto: string; vivo: string }> = [
  { padrao: /\bDigiEgg\b/, morto: 'estágio DigiEgg', vivo: 'a árvore nasce em rookie (src/types/progression.ts)' },
  { padrao: /\bBaby I\b|\bBaby II\b/, morto: 'estágios Baby I/II', vivo: 'a árvore nasce em rookie' },
  { padrao: /digiapp_state_v3/, morto: 'a chave de save antiga', vivo: "'soulmon_state_v1' (utils/storageKeys.ts)" },
];

/** Um doc pode CITAR uma regra morta para registrar que ela morreu. */
const MARCA_DE_LAPIDE = /⚰️|não existe mais|NÃO EXISTE MAIS|era `|dizia|herdad|histórico|aposentad|legado|LEGACY/i;

/**
 * Um documento inteiro pode ser registro (um changelog), e aí a isenção é do
 * ARQUIVO, não da linha — mas ele tem que **declarar isso**, com esta marca
 * exata, dentro do cabeçalho, onde o leitor vê antes de acreditar em qualquer
 * coisa.
 *
 * A marca é literal de propósito. A primeira versão deste guard tentava
 * reconhecer a isenção por VOCABULÁRIO ("histórico", "legado", "não existe
 * mais") e acusou o próprio aviso escrito minutos antes, porque ele dizia
 * "não são mais as regras" e a lista esperava "não existe mais". Regra que
 * depende de adivinhar sinônimo é regra que falha na primeira frase nova —
 * e o custo de errar aqui é um doc mentiroso passando batido, não um teste
 * vermelho. **Escrever a marca é um gesto deliberado; escolher a palavra
 * certa por acaso, não.**
 */
const MARCA_DE_REGISTRO = '<!-- doc-historico -->';
const CABECALHO = 40;
const seDeclaraRegistro = (linhas: string[]) =>
  linhas.slice(0, CABECALHO).some(l => l.includes(MARCA_DE_REGISTRO));

const docsDeTopo = () =>
  readdirSync(DOCS, { withFileTypes: true })
    .filter(e => e.isFile() && e.name.endsWith('.md'))
    .map(e => e.name);

describe('docs/ não ensina regra morta', () => {
  it('AUTOVERIFICAÇÃO: há documentos de topo para varrer', () => {
    // Sem isto o teste passaria varrendo uma pasta vazia.
    expect(docsDeTopo().length).toBeGreaterThan(10);
  });

  it('nenhum doc de topo afirma uma regra que o código não tem', () => {
    const culpados: string[] = [];
    for (const nome of docsDeTopo()) {
      const linhas = readFileSync(join(DOCS, nome), 'utf8').split('\n');
      if (seDeclaraRegistro(linhas)) continue;
      linhas.forEach((linha, i) => {
        for (const { padrao, morto, vivo } of MORTAS) {
          if (!padrao.test(linha)) continue;
          // Citar para enterrar é permitido; afirmar não é.
          if (MARCA_DE_LAPIDE.test(linha)) continue;
          culpados.push(`docs/${nome}:${i + 1} cita ${morto} sem marcá-lo como morto — hoje é ${vivo}`);
        }
      });
    }
    expect(culpados).toEqual([]);
  });

  it('a pasta de histórico existe e se declara morta logo no começo', () => {
    // Se alguém apagar o LEIA-ANTES, os onze documentos voltam a parecer
    // documentação normal para quem navegar pelo diretório.
    const aviso = readFileSync(join(DOCS, 'historico-digiapp', 'LEIA-ANTES.md'), 'utf8');
    expect(aviso.slice(0, 400)).toMatch(/NUNCA verdade|Nada nesta pasta descreve o Soulmon de hoje/);
  });
});
