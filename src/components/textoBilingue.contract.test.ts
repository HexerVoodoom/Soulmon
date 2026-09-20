/**
 * NENHUM texto de interface existe em um idioma só.
 *
 * O `CLAUDE.md` declara a regra em uma linha: "UI/textos do app em PT-BR e EN
 * (sempre os dois, via `language === 'pt-BR'`)". Ela vinha sendo cumprida no
 * corpo das telas e furada nas BEIRADAS — mensagem de erro, `toast`, `title`,
 * `placeholder`, `aria-label`. São justamente os textos que:
 *
 *  · aparecem no pior momento (a coisa acabou de falhar);
 *  · ninguém revisa, porque não estão na tela feliz;
 *  · e, no caso do `aria-label`, são a ÚNICA coisa que uma parte dos usuários
 *    recebe — quem usa leitor de tela não tem o texto visível para compensar.
 *
 * A varredura de 09/09/2026 achou dez ocorrências. Sete no `ChatBox`, todas em
 * caminho de erro, e uma delas com o irmão bilíngue escrito UMA LINHA ABAIXO no
 * mesmo `catch` — a prova de que isto não é descuido de quem não sabia da
 * regra, e sim o tipo de furo que só um guard pega.
 *
 * ## O que este teste considera "texto visível"
 *
 * Literal em posição que o usuário LÊ: argumento de `toast.*` e de
 * `onSendMessage`, e os atributos `aria-label`, `title`, `placeholder` e
 * `aria-description`.
 *
 * ## ⚠️ Como ele decide que já é bilíngue, e o que isso custa
 *
 * Ele olha se a linha, a anterior ou a seguinte escolhem por idioma (`isPt`,
 * `language ===`, `pt-BR`). É HEURÍSTICA, e a limitação precisa estar escrita
 * em vez de descoberta depois: um par bilíngue espalhado por mais de três
 * linhas apareceria aqui como falso positivo. Se isso acontecer, a saída certa
 * é aproximar o ternário do literal — texto e escolha de idioma juntos é o que
 * torna a regra legível — e não crescer a lista de dispensas.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const RAIZ = resolve(__dirname, '../..');
const AREAS = ['src', 'desktop/renderer/src'];
const EXTENSOES = ['.ts', '.tsx'];

/**
 * Literais que NÃO são frase para humano nenhum, e por isso não têm par.
 * Cada linha precisa de um motivo — "é curto" não é motivo.
 */
const NEUTROS: Record<string, string> = {
  ABCD2345: 'exemplo do formato do código de convite do grupo — são letras e números, iguais nos dois idiomas.',
  Soulmon: 'a MARCA — o `aria-label` do slot da chama no portão (canvas Onboarding-funil, D-O4). O nome do app é o mesmo nos dois idiomas.',
};

/** Posições em que um literal chega aos olhos (ou ao leitor de tela). */
const ALVOS: Array<{ rx: RegExp; onde: string }> = [
  { rx: /(toast\.(?:error|success|info|warning|message|loading))\s*\(\s*(['"`])([^'"`]{6,})\2/g, onde: 'toast' },
  { rx: /(onSendMessage)\s*\(\s*(['"`])([^'"`]{6,})\2/g, onde: 'mensagem no chat' },
  { rx: /(aria-label|title|placeholder|aria-description)\s*=\s*(['"])([^'"]{6,})\2/g, onde: 'atributo' },
  { rx: /(aria-label|title|placeholder)\s*=\s*\{\s*(['"])([^'"]{6,})\2\s*\}/g, onde: 'atributo' },
];

/** Identificador, caminho, URL, constante — não é frase. */
const NAO_E_FRASE = /^[a-z0-9_.\-/#]+$|^https?:|^[A-Z_]+$|^\d/;

/** A linha (ou a vizinha) escolhe por idioma? */
const ESCOLHE_IDIOMA = /\bisPt\b|\blanguage\s*===|\bpt-BR\b|\bt\(/;

function arquivos(dir: string, saida: string[] = []): string[] {
  let entradas: string[];
  try { entradas = readdirSync(dir); } catch { return saida; }
  for (const nome of entradas) {
    if (nome === 'node_modules' || nome === 'dist' || nome === 'dist-renderer') continue;
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) { arquivos(p, saida); continue; }
    if (!EXTENSOES.some(e => nome.endsWith(e)) || nome.includes('.test.')) continue;
    saida.push(p);
  }
  return saida;
}

interface Achado { arquivo: string; linha: number; onde: string; texto: string }

function varrer(): Achado[] {
  const achados: Achado[] = [];
  for (const area of AREAS) {
    for (const p of arquivos(join(RAIZ, area))) {
      const rel = p.slice(RAIZ.length + 1).replace(/\\/g, '/');
      const linhas = readFileSync(p, 'utf8').split('\n');
      linhas.forEach((l, i) => {
        const s = l.trim();
        // Comentário é onde a história mora, e ela cita texto antigo.
        if (s.startsWith('//') || s.startsWith('*') || s.startsWith('/*')) return;
        const contexto = (linhas[i - 1] ?? '') + l + (linhas[i + 1] ?? '');
        if (ESCOLHE_IDIOMA.test(contexto)) return;
        for (const { rx, onde } of ALVOS) {
          rx.lastIndex = 0;
          for (const m of l.matchAll(rx)) {
            const texto = m[3];
            if (NAO_E_FRASE.test(texto) || texto in NEUTROS) continue;
            achados.push({ arquivo: rel, linha: i + 1, onde, texto });
          }
        }
      });
    }
  }
  return achados;
}

describe('🔴 nenhum texto de interface existe em um idioma só', () => {
  it('toast, mensagem de chat e atributo acessível têm os DOIS idiomas', () => {
    const ruins = varrer().map(a => `${a.arquivo}:${a.linha}  (${a.onde})  ${a.texto.slice(0, 70)}`);
    expect(
      ruins,
      'Texto visível sem par de idioma. A regra do CLAUDE.md é "sempre os dois, via `language === \'pt-BR\'`" — e a beirada (erro, toast, aria-label) conta, porque é o texto que aparece no pior momento e o único que quem usa leitor de tela recebe.',
    ).toEqual([]);
  });

  it('AUTOVERIFICAÇÃO: a varredura ENXERGA um texto sem par', () => {
    // Sem este caso, um erro na expressão ou na leitura de arquivo deixaria o
    // caso acima verde para sempre — medindo o vácuo. Aqui o alvo é conhecido:
    // o próprio padrão que consertou os sete do `ChatBox`.
    const linha = "        toast.error('Audio transcription failed. Please try again.');";
    const rx = ALVOS[0].rx;
    rx.lastIndex = 0;
    const m = [...linha.matchAll(rx)];
    expect(m).toHaveLength(1);
    expect(m[0][3]).toBe('Audio transcription failed. Please try again.');
    expect(ESCOLHE_IDIOMA.test(linha)).toBe(false);
  });

  it('AUTOVERIFICAÇÃO: e NÃO reclama de um par bilíngue de verdade', () => {
    // O inverso importa igual: um guard que reclamasse do texto correto seria
    // desligado na primeira semana.
    const bom = "        toast.error(isPt ? 'Não deu certo.' : 'That did not work.');";
    expect(ESCOLHE_IDIOMA.test(bom)).toBe(true);
  });

  it('a lista de neutros é pequena e cada linha tem MOTIVO', () => {
    // Dispensa sem motivo escrito vira o lugar onde o texto novo se esconde.
    for (const [chave, motivo] of Object.entries(NEUTROS)) {
      expect(motivo.length, `"${chave}" precisa de um motivo, não de uma linha em branco`).toBeGreaterThan(30);
    }
    expect(Object.keys(NEUTROS).length, 'se esta lista crescer, a regra virou ficção').toBeLessThanOrEqual(5);
  });
});
