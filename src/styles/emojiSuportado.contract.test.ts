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
 * O que isso significa em tela, hoje: 3 das 24 cenas da aventura, 5 das
 * mobílias da loja (na loja E no palco do pet), 4 dos 30 sonhos do DreamDex,
 * um reino do Oráculo, o ícone do traço Carinhoso em Estatísticas, o botão de
 * Carinho e o efeito de banho do overlay — e o MARCO DE 21 DIAS de hábito,
 * que é um dos momentos que o produto trata como alto.
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
  'U+1FA81': '🪁 (Emoji 12.0) — utils/restWindow.ts, sonho `dream-paper-kite` (DreamDex). RENDERIZA nesta máquina; risco só em Android 9.',
  'U+1FA91': '🪑 (12.0) — utils/shop.ts, `furn-chair`. RENDERIZA nesta máquina.',
  'U+1FA94': '🪔 (12.0) — utils/restWindow.ts, sonho `dream-firefly-jar`. RENDERIZA nesta máquina.',
  'U+1FA99': '🪙 (12.0) — Bits. SÓ EM COMENTÁRIO (App.tsx, DinoGame, RPSGame, GameStateContext, dungeon): nunca chega à tela, porque a moeda é exibida sem ícone por decisão de design. Zero impacto no usuário; fica listado para o dia em que alguém colar o glifo num texto.',
  'U+1FA9C': '🪜 (13.0) — utils/adventure.ts, cena `adv-escada`. CAIXA VAZIA no card da aventura. Troca: 🧗 ou ⛏️.',
  'U+1FA9E': '🪞 (13.0) — utils/adventure.ts, cena `adv-lago-espelho`. CAIXA VAZIA. Troca: 💠 ou 🌊.',
  'U+1FA9F': '🪟 (13.0) — utils/shop.ts, `furn-window`. CAIXA VAZIA na loja E no palco do pet. Troca: 🖼️.',
  'U+1FAA8': '🪨 (13.0) — utils/adventure.ts (`adv-pedra-lisa`), utils/oracle.ts (reino Cavernas Rochosas), utils/shop.ts (`furn-rock`). CAIXA VAZIA nos três. Troca: 🗿 (já usado no mesmo catálogo) ou ⛰️.',
  'U+1FAB4': '🪴 (13.0) — o MARCO DE 21 DIAS de hábito (App.tsx, mensagem PT e EN) e o ícone do tier `sapling` na lista de atividades (types/taskModel.ts), mais `furn-plant` da loja. CAIXA VAZIA na cerimônia que o produto trata como momento alto. Troca: 🌱 (já usado no tier anterior… então 🌿).',
  'U+1FAB5': '🪵 (13.0) — utils/restWindow.ts (sonho `dream-ember-circle`) e utils/shop.ts (`furn-deck`). CAIXA VAZIA. Troca: 🍂 ou 🔥.',
  'U+1FAE7': '🫧 (14.0) — sonho `dream-sea-glass` (restWindow.ts) e o EFEITO DE BANHO do overlay (desktop/menu.ts). CAIXA VAZIA. Troca: 💧 ou 🚿 (já é o ícone da ação).',
  'U+1FAF6': '🫶 (14.0) — o ÍCONE DO TRAÇO CARINHOSO (utils/passives.ts, visível em Estatísticas) e o rótulo do botão de Carinho do overlay (desktop/menu.ts). CAIXA VAZIA nos dois. Troca: 💗 (Emoji 6.0, já usado no jogo como coraçãozinho) ou 🤲.',
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
