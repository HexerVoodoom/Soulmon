/**
 * EMOJI QUE O APARELHO NÃO TEM VIRA UMA CAIXA VAZIA — e ninguém percebe.
 *
 * Achado da sessão de QA (08/09/2026), item 6. O card da aventura do relatório
 * noturno mostrava `▯` no lugar do glifo. Medido no navegador, por canvas,
 * comparando o desenho de cada emoji com o desenho de um caractere que
 * garantidamente não existe na fonte:
 *
 *   🪁 🪑 🪔 (Emoji 12.0) desenham nesta máquina
 *   🪙 (12.0) NÃO desenha — mas só existe em COMENTÁRIO, nunca chega à tela
 *   🪜 🪞 🪟 🪨 🪴 🪵 (13.0) CAIXA VAZIA, e todos SÃO exibidos
 *   🫧 (14.0) e 🫶 (14.0) CAIXA VAZIA, e também são exibidos
 *
 * ⚠️ NEM TODO GLIFO DESTE BLOCO CHEGA À TELA, e a diferença importa porque
 * decide o que precisa de ARTE e o que precisa de TROCA DE GLIFO. Conferido um
 * a um em 08/09/2026 — a lista abaixo diz caso a caso.
 *
 * O que o jogador REALMENTE vê como caixa vazia hoje: 3 das 24 cenas da
 * aventura, 5 mobílias da loja (na loja E no palco do pet), o ícone do traço
 * Carinhoso em Estatísticas, o botão de Carinho e o efeito de banho do overlay
 * de desktop — e o texto do MARCO DE 21 DIAS de hábito.
 *
 * O que NÃO chega à tela, apesar de estar no código: os quatro sonhos (o
 * DreamDex já renderiza o PNG de `dreamArt.ts`; o emoji sobrevive como glifo de
 * push, onde não existe `<img>`), o `HABIT_TIER_EMOJI.sapling` (mapa com ZERO
 * consumidores) e o 🪙 dos Bits (só em comentário).
 *
 * É a mesma família de dano da fonte de ícones subsetada que o
 * `iconInventory.contract.test.ts` guarda: **renderiza vazio, sem erro**. E
 * atinge mais gente do que parece — o bloco `Symbols and Pictographs
 * Extended-A` (U+1FA70–U+1FAFF) começa no Emoji 12.0 (Android 10, set/2019) e
 * vai até o 15; o Android só ganha cada leva na versão do ANO seguinte, e
 * fontes de sistema no Windows e no Linux ficam ainda mais atrás — como a desta
 * máquina, que não desenha nem o 12.0.
 *
 * ESTE GUARD NÃO CONSERTA O QUE JÁ EXISTE. Ele congela: a lista abaixo é a
 * dívida medida, com dono e proposta de troca, e é decisão do dono trocar (o
 * 🪙 dos Bits está documentado no `CLAUDE.md` como a cara da moeda). O que o
 * teste impede é a lista CRESCER — um emoji novo deste bloco entrando em texto
 * de interface fica vermelho aqui em vez de virar caixa vazia no aparelho de
 * alguém.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const RAIZ = resolve(__dirname, '../..');

/** Onde mora texto que um usuário lê. `dist` e os assets do Android são build. */
const AREAS = ['src', 'functions/api', 'workers', 'desktop/renderer/src'];
const EXTENSOES = ['.ts', '.tsx', '.js', '.jsx'];

/**
 * A DÍVIDA MEDIDA, congelada. Chave = codepoint; valor = onde está e o que
 * trocar. Tirar uma linha daqui só depois de trocar o emoji no código.
 */
const DIVIDA_CONHECIDA: Record<string, string> = {
  'U+1FA81': '🪁 (Emoji 12.0) — utils/restWindow.ts, sonho `dream-paper-kite`. NÃO chega à tela: o DreamDex renderiza o PNG de `dreamArt.ts`. O emoji é só o glifo de push/log.',
  'U+1FA91': '🪑 (12.0) — utils/shop.ts, `furn-chair`. EXIBIDO na loja e no palco. Desenha nesta máquina; some em Android 9. Arte pendente: backlog A7.',
  'U+1FA94': '🪔 (12.0) — utils/restWindow.ts, sonho `dream-firefly-jar`. NÃO chega à tela (PNG em `dreamArt.ts`).',
  'U+1FA99': '🪙 (12.0) — Bits. SÓ EM COMENTÁRIO (App.tsx, DinoGame, RPSGame, GameStateContext, dungeon): a moeda é exibida sem ícone por decisão de design. Zero impacto.',
  'U+1FA9C': '🪜 (13.0) — utils/adventure.ts, cena `adv-escada`. CAIXA VAZIA no card do relatório e no diário. Arte pendente: backlog A20.',
  'U+1FA9E': '🪞 (13.0) — utils/adventure.ts, cena `adv-lago-espelho`. CAIXA VAZIA. Arte pendente: backlog A20.',
  'U+1FA9F': '🪟 (13.0) — utils/shop.ts, `furn-window`. CAIXA VAZIA na loja E no palco do pet. Arte pendente: backlog A7.',
  'U+1FAA8': '🪨 (13.0) — utils/adventure.ts (`adv-pedra-lisa`, CAIXA VAZIA, arte em A20), utils/shop.ts (`furn-rock`, CAIXA VAZIA, arte em A7) e utils/oracle.ts (reino Cavernas Rochosas — só na OraclePage, que é ferramenta interna sem entrada na navegação).',
  'U+1FAB4': '🪴 (13.0) — DOIS casos diferentes. (a) types/taskModel.ts, `HABIT_TIER_EMOJI.sapling`: NÃO chega à tela, o mapa tem ZERO consumidores. (b) App.tsx, o texto do MARCO DE 21 DIAS (PT e EN): CAIXA VAZIA no meio de uma frase, e arte não resolve texto inline — precisa de troca de glifo. É o único caso da lista que não tem entrada de arte possível.',
  'U+1FAB5': '🪵 (13.0) — utils/restWindow.ts (sonho `dream-ember-circle`, NÃO chega à tela: PNG em `dreamArt.ts`) e utils/shop.ts (`furn-deck`, CAIXA VAZIA, arte em A7).',
  'U+1FAE7': '🫧 (14.0) — utils/restWindow.ts (sonho `dream-sea-glass`, NÃO chega à tela) e o EFEITO DE BANHO do overlay de desktop (desktop/menu.ts): CAIXA VAZIA, e o overlay não está coberto por entrada de arte nenhuma. Ver backlog A21.',
  'U+1FAF6': '🫶 (14.0) — o traço CARINHOSO (utils/passives.ts, cartão em Estatísticas, CAIXA VAZIA, arte pendente em A15) e o rótulo do botão de Carinho do overlay (desktop/menu.ts, CAIXA VAZIA, ver A21).',
};

/** U+1FA70–U+1FAFF: o bloco inteiro é Emoji 12.0 ou mais novo. */
const NOVO_DEMAIS = (cp: number) => cp >= 0x1FA70 && cp <= 0x1FAFF;
const chave = (cp: number) => 'U+' + cp.toString(16).toUpperCase();

function arquivos(dir: string, saida: string[] = []): string[] {
  let entradas: string[];
  try { entradas = readdirSync(dir); } catch { return saida; }
  for (const nome of entradas) {
    if (nome === 'node_modules' || nome === 'dist' || nome === 'dist-renderer') continue;
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) { arquivos(p, saida); continue; }
    if (!EXTENSOES.some(e => nome.endsWith(e))) continue;
    if (nome.includes('.test.')) continue;
    saida.push(p);
  }
  return saida;
}

describe('emoji do bloco novo (U+1FA70–U+1FAFF) não entra sem passar por aqui', () => {
  const achados = new Map<string, Set<string>>();
  for (const area of AREAS) {
    for (const p of arquivos(join(RAIZ, area))) {
      const texto = readFileSync(p, 'utf8');
      for (const ch of texto) {
        const cp = Number(ch.codePointAt(0));
        if (!NOVO_DEMAIS(cp)) continue;
        const k = chave(cp);
        if (!achados.has(k)) achados.set(k, new Set());
        (achados.get(k) as Set<string>).add(p.slice(RAIZ.length + 1).replace(/\\/g, '/'));
      }
    }
  }

  it('nenhum emoji NOVO deste bloco apareceu — a dívida não cresce', () => {
    const novos = [...achados.keys()].filter(k => !(k in DIVIDA_CONHECIDA));
    expect(
      novos.map(k => k + ' em ' + [...(achados.get(k) ?? [])].join(', ')),
      'Emoji do bloco U+1FA70–U+1FAFF renderiza como CAIXA VAZIA em fonte de sistema mais velha (medido: nem o Emoji 12.0 desenha na máquina do dono). Escolha um glifo de Emoji 11.0 ou anterior — ou, se for decisão consciente, acrescente a linha em DIVIDA_CONHECIDA explicando onde está e qual é a troca.',
    ).toEqual([]);
  });

  it('a dívida registrada é a dívida REAL — nada de linha morta na lista', () => {
    // Uma lista de exceções que ninguém poda vira permissão permanente. Se um
    // emoji foi trocado no código, a linha dele tem de sair daqui junto.
    const mortas = Object.keys(DIVIDA_CONHECIDA).filter(k => !achados.has(k));
    expect(mortas, 'estes já não estão no código; tire a linha de DIVIDA_CONHECIDA').toEqual([]);
  });

  it('e o tamanho da dívida está declarado, para a conta não crescer em silêncio', () => {
    expect(achados.size).toBe(12);
  });
});
