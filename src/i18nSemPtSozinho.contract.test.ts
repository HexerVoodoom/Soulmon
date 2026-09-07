/**
 * Guard: nenhuma string VISÍVEL nasce só em português.
 *
 * A regra do `CLAUDE.md` é "inglês é a base, PT-BR é localização", e ela já
 * foi quebrada pelo menos três vezes — nos `aria-label` de checkbox e editar,
 * e no título do push das 22h, que chegava em PT para quem tinha escolhido
 * inglês. As três vezes foram achadas por LEITURA, depois de já estarem no ar.
 *
 * O que torna essa família traiçoeira é onde ela se esconde. Uma frase de
 * parágrafo em português salta aos olhos de qualquer revisor; um
 * `aria-label="Fechar"` não aparece na tela de ninguém — ele aparece no
 * OUVIDO de quem usa leitor de tela, que é justamente quem menos consegue
 * relatar o problema. Por isso o guard começa exatamente por aí.
 *
 * **Ele não checa tradução, checa BIFURCAÇÃO**: a string precisa estar num
 * caminho que conheça os dois idiomas (`language === 'pt-BR' ? … : …`,
 * `isPt ? … : …`). Uma frase em PT dentro do ramo certo passa; a mesma frase
 * solta, não. Traduzir é trabalho de quem escreve — o que a máquina consegue
 * garantir é que existe um ramo em inglês para preencher.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = join(process.cwd(), 'src');

function fontes(dir: string, saida: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) fontes(p, saida);
    else if (/\.tsx?$/.test(e.name) && !e.name.includes('.test.')) saida.push(p);
  }
  return saida;
}

/**
 * Palavras que só existem em português. A lista é curta e comum de propósito:
 * o guard tem que errar para o lado de DEIXAR PASSAR. Um falso positivo aqui
 * vira um teste vermelho num texto correto — e guard que grita à toa é guard
 * que alguém desliga.
 */
const SO_EM_PT =
  /\b(você|não|atividade|tarefa|carinho|coraç(ão|ões)|configurações|hábito|criatura|amanhã|salvar|excluir|adicionar|fechar|voltar|editar|escolher)\b/i;

/** A linha sabe que existem dois idiomas? */
const TEM_BIFURCACAO = /pt-BR|isPt|\bpt\b\s*\?/;

/** Onde texto visível para o usuário costuma entrar. */
const ATRIBUTOS = /(aria-label|placeholder|title|aria-description)\s*=\s*(["'])([^"']{3,})\2/g;
const FALAS = /\b(toast\.\w+|toast|speak|speakRaw)\(\s*(['"])([^'"]{4,})\2/g;

function varrer(padrao: RegExp): string[] {
  const achados: string[] = [];
  for (const f of fontes(RAIZ)) {
    readFileSync(f, 'utf8').split('\n').forEach((linha, i) => {
      padrao.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = padrao.exec(linha))) {
        const texto = m[3];
        if (!SO_EM_PT.test(texto) || TEM_BIFURCACAO.test(linha)) continue;
        achados.push(`${f.replace(process.cwd() + '/', '')}:${i + 1} → "${texto}"`);
      }
    });
  }
  return achados;
}

describe('inglês é a base, PT-BR é localização', () => {
  it('AUTOVERIFICAÇÃO: a varredura enxerga arquivos', () => {
    // Sem isto, uma quebra no caminho faria os dois casos abaixo passarem
    // varrendo zero arquivos — o modo de falha silencioso que este
    // repositório já pagou caro (o guard que "passava por não achar ninguém").
    expect(fontes(RAIZ).length).toBeGreaterThan(100);
  });

  it('nenhum aria-label/placeholder/title só em português', () => {
    expect(varrer(ATRIBUTOS)).toEqual([]);
  });

  it('nenhum toast nem fala do pet só em português', () => {
    expect(varrer(FALAS)).toEqual([]);
  });
});
