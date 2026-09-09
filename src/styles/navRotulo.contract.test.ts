/**
 * O RÓTULO DA BARRA DE BAIXO cabe na célula dele — nos dois idiomas.
 *
 * ## O que aconteceu
 *
 * O `index.css` afirmava, em comentário, que `overflow: hidden` na
 * `.sm-bottom-nav-label` era "rede de segurança para um idioma futuro:
 * nenhum rótulo atual chega perto de precisar dele", e que o pior caso em
 * PT-BR media "53px numa célula de 64,7px".
 *
 * As duas medidas foram tomadas num viewport largo. Medido no navegador em
 * **320×640** (09/09/2026): a célula tem 60px, a caixa do rótulo tem 54px e
 * "ATIVIDADES" precisa de 61px. `scrollWidth > clientWidth` no elemento real.
 * A rede estava em uso, em português, todos os dias — e com
 * `text-overflow: clip`, que tirava o "S" final sem sinal nenhum: a pessoa lia
 * "ATIVIDADE", palavra completa no singular, sem como saber que faltava algo.
 *
 * Em inglês, no mesmo viewport, ZERO rótulos cortavam. É o tipo de defeito que
 * só aparece num idioma, e por isso não aparece para quem desenvolve no outro.
 *
 * ## Por que este teste existe, e o que ele NÃO é
 *
 * ⚠️ Ele não mede pixel de tela — jsdom não faz layout, e medir texto exige
 * fonte carregada. O que ele mede é o par que o defeito violou: **quantos
 * caracteres o rótulo mais largo tem** contra o teto que a própria régua do
 * CSS declara. É um limite de CONTAGEM, deliberadamente grosseiro, e a
 * justificativa está no cabeçalho: um número medido uma vez e afirmado para
 * sempre foi exatamente o que apodreceu.
 *
 * A medição fina continua sendo trabalho de navegador, e o resultado dela está
 * escrito no comentário do `index.css` com o viewport ao lado — que é o
 * formato que faltava.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const RAIZ = resolve(__dirname, '../..');
const ler = (p: string) => readFileSync(join(RAIZ, p), 'utf8');

/**
 * Teto de caracteres do rótulo. Sai da medição real: "ATIVIDADES" (10) precisa
 * de 61px numa caixa de 54px em 320px — ou seja, 10 já NÃO cabe. 9 caracteres
 * na fonte pixel de 12px ficam em ~55px, no limite. O teto é 9 e não 10 porque
 * o caso conhecido de estouro tem 10.
 */
const MAX_CARACTERES = 9;

/**
 * Os rótulos, lidos da FONTE — não copiados para cá (footgun 9).
 *
 * ⚠️ Duas versões deste helper mediram o vácuo antes desta, e as duas foram
 * pegas pela AUTOVERIFICAÇÃO abaixo — que é o motivo de ela existir:
 *   1. varria o `App.tsx`, onde os rótulos NÃO moram: achava zero e passava;
 *   2. casava `className="sm-bottom-nav-label"` e capturava a palavra "label";
 *   3. casava `label={isPt ? … : …}` solto e pegava OITO rótulos do arquivo,
 *      não os cinco da barra.
 *
 * A leitura agora é ESTREITA de propósito: os quatro destinos vêm do array
 * `items` (`label: isPt ? … : …`, com dois-pontos — a forma que só o array
 * usa), e o quinto é afirmado explicitamente. Se o botão do Menu mudar de
 * forma, o teste reclama alto em vez de silenciosamente medir menos.
 */
const MENU_NA_FONTE = "label={isPt ? 'Menu' : 'Menu'}";

function rotulosDaNav(): Array<{ pt: string; en: string }> {
  const src = ler('src/components/BottomNav.tsx');
  const pares: Array<{ pt: string; en: string }> = [];
  for (const m of src.matchAll(/label:\s*isPt\s*\?\s*'([^']{2,20})'\s*:\s*'([^']{2,20})'/g)) {
    pares.push({ pt: m[1], en: m[2] });
  }
  if (src.includes(MENU_NA_FONTE)) pares.push({ pt: 'Menu', en: 'Menu' });
  return pares;
}

describe('🔴 o rótulo da barra de baixo cabe na célula', () => {
  it('a lista de rótulos LONGOS é a medida, e não cresce sem alguém olhar', () => {
    /* ⚠️ Este caso NÃO exige que todos caibam: hoje "Atividades" (10) e
       "Activities" (10) NÃO cabem, e encurtá-los é decisão do dono (está em
       `docs/STATUS.md`). O que ele impede é a lista CRESCER — um rótulo novo
       longo entraria cortado, e com `ellipsis` isso é feio; com `clip`, que era
       o estado anterior, seria invisível. */
    const longos = rotulosDaNav()
      .flatMap(p => [p.pt, p.en])
      .filter((t, i, a) => a.indexOf(t) === i)
      .filter(t => t.length > MAX_CARACTERES)
      .sort();
    expect(
      longos,
      `Rótulo de nav com mais de ${MAX_CARACTERES} caracteres é cortado na célula em 320px (medido: "ATIVIDADES", 10 caracteres, precisa de 61px numa caixa de 54px). Encurte a palavra; NÃO conte com o \`overflow: hidden\`, que foi o que escondeu este defeito por meses.`,
    ).toEqual([]);
  });

  it('🔴 o corte é DECLARADO (`ellipsis`), nunca silencioso (`clip`)', () => {
    // Este é o caso que mais importa. Enquanto a palavra em PT-BR for longa, o
    // corte vai acontecer — e o dano não é perder um caractere, é perder um
    // caractere de um jeito que parece intencional. `clip` transformou
    // "ATIVIDADES" em "ATIVIDADE", que é uma palavra portuguesa válida.
    const css = ler('src/index.css');
    const bloco = css.slice(css.indexOf('.sm-bottom-nav-label {'));
    const regra = bloco.slice(0, bloco.indexOf('}'));
    expect(regra, 'a nav corta texto em 320px: o corte tem que aparecer').toContain('text-overflow: ellipsis');
    expect(regra).not.toContain('text-overflow: clip');
  });

  it('a afirmação falsa do comentário só existe MARCADA como falsa', () => {
    /* A frase "nenhum rótulo atual chega perto de precisar dele" é o que fez
       ninguém olhar por meses, e ela precisa continuar LEGÍVEL no arquivo — é
       a história da decisão, e apagá-la faria o próximo leitor refazer a
       análise do zero.
   
       ⚠️ A primeira versão deste caso proibia a frase, e reprovou a minha
       PRÓPRIA correção, que a cita para dizer que era falsa. É a aceitação
       autodestrutiva que o `utils/dungeon.ts` já registra ter consertado uma
       vez ("um comentário histórico que repete as frases proibidas
       reprovaria"). A regra certa não é "a frase não existe": é "onde ela
       existir, existe a correção junto". */
    const css = ler('src/index.css');
    const frase = 'nenhum rótulo atual chega perto';
    let de = css.indexOf(frase);
    while (de !== -1) {
      const vizinhanca = css.slice(Math.max(0, de - 1200), de + 1200);
      expect(
        /era FALSA|CORREÇÃO/.test(vizinhanca),
        'a frase voltou como AFIRMAÇÃO. Ela só pode aparecer marcada como corrigida.',
      ).toBe(true);
      de = css.indexOf(frase, de + 1);
    }

    // E a medição que sobrou tem que carregar o VIEWPORT junto — número sem
    // viewport é o formato exato que apodreceu.
    const i = css.indexOf('.sm-bottom-nav-label {');
    expect(css.slice(Math.max(0, i - 2200), i)).toMatch(/320px/);
  });

  it('AUTOVERIFICAÇÃO: a leitura dos pares de idioma encontra rótulos de verdade', () => {
    // Guard que não acha nada passa sempre. Este caso prova que o arquivo foi
    // lido e que o padrão `isPt ? … : …` casa.
    // Cinco destinos, e os cinco nomeados: leitura frouxa ("achou mais que
    // zero") deixaria passar um regex que casa só metade da nav — foi por uma
    // leitura frouxa que a primeira versão deste arquivo mediu o vácuo.
    const pares = rotulosDaNav();
    expect(
      ler('src/components/BottomNav.tsx'),
      `o botão do Menu mudou de forma; ajuste MENU_NA_FONTE`,
    ).toContain(MENU_NA_FONTE);
    expect(pares.map(p => p.pt).sort()).toEqual(
      ['Jogos', 'Evolução', 'Início', 'Loja', 'Menu'].sort(),
    );
    // E o par de idioma é REAL em pelo menos um deles (senão o regex casou só
    // o lado português e o teto do inglês nunca seria medido).
    // "Menu" é igual nos dois idiomas de propósito; os outros quatro diferem.
    expect(pares.filter(p => p.pt !== p.en).length).toBe(4);
  });
});
