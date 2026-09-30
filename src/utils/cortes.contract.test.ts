/**
 * A RÉGUA DOS 9 CORTES — run `som-01`, Fase 3 (causa-raiz do A-4).
 *
 * ## Por que este arquivo existe
 *
 * A Fase 0 decidiu 9 cortes de som (C-1..C-9) e a Fatia 1 os aplicou. A
 * auditoria da Fase 3 reauditou os 9 no código e achou todos aplicados — **e
 * achou que só o C-6 tinha trava**. Cobertura de regressão: **1 em 9**.
 *
 * Foi exatamente por isso que `ArenaGame.tsx` entrou na `main` com DOIS sons de
 * classes cortadas (`playTaskComplete` em morte de inimigo, `playFeed` no
 * especial) e **3.974 testes passaram verde**. Não foi descuido humano: foi
 * ausência de régua. Um corte sem teste é um corte que dura até o próximo
 * arquivo novo.
 *
 * ## Por que UMA régua e não nove testes soltos
 *
 * Nove testes soltos travariam os nove cortes de hoje e não travariam o décimo.
 * Aqui os cortes são **dados** (`CORTES`, abaixo) e a asserção é uma só: um
 * corte novo é uma linha na tabela, não um teste novo — e um corte que ninguém
 * escrever na tabela fica visivelmente destravado, em vez de invisivelmente.
 *
 * ## O que esta régua NÃO alcança, dito por extenso
 *
 * Ela lê **fonte**, não comportamento. Precedente literal do repo:
 * `src/plugins/widgetSemCobranca.contract.test.ts` (*"um guard que só sabe ler
 * string ainda é infinitamente melhor que nenhum, e o que ele protege é
 * vocabulário, que é justamente o que se lê"*). Consequências honestas:
 *
 * - Um corte burlado por indireção (`const f = playFeed; f()`) passa.
 * - Um corte cujo escopo é uma condição (**C-7**: dormir soa num sentido só)
 *   é travado por FORMA da linha, não por execução.
 * - **C-8** é travado como "nenhum som no módulo da virada do dia", que é mais
 *   forte que o corte pede e por isso não o mede exatamente: se a virada do dia
 *   um dia ganhar um som legítimo, o vermelho aqui é a conversa certa, não um
 *   falso positivo a contornar.
 *
 * O que ela alcança é o defeito que **de fato aconteceu**: um `play*` cortado
 * escrito de novo, à mão, num contexto cortado.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { CATEGORIA_DO_SOM } from './loudness';

/* ── Ferramentas de leitura de fonte ─────────────────────────────────────── */

/** Só o código: os comentários CITAM os cortes para explicar por que existem. */
const semComentarios = (fonte: string) =>
  fonte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

function ler(arquivo: string): string {
  return semComentarios(readFileSync(join('src', arquivo), 'utf8'));
}

/**
 * O corpo de uma função, por contagem de chaves a partir da âncora. Existe
 * porque três cortes (C-3, C-4, C-5) não são "este arquivo não toca o som" e
 * sim "este HANDLER não toca o som" — `App.tsx` legitimamente toca os dois
 * sons em outros lugares, e um guard de arquivo inteiro seria falso.
 */
function escopo(codigo: string, ancora: string): string {
  const i = codigo.indexOf(ancora);
  if (i < 0) throw new Error(`âncora não encontrada no fonte: ${ancora}`);
  const abre = codigo.indexOf('{', i);
  let nivel = 0;
  for (let k = abre; k < codigo.length; k++) {
    if (codigo[k] === '{') nivel++;
    else if (codigo[k] === '}' && --nivel === 0) return codigo.slice(i, k + 1);
  }
  throw new Error(`escopo não fechou a partir de: ${ancora}`);
}

/** Todo `.ts`/`.tsx` de produção sob `src/` (sem teste). */
function fontesDeProducao(): string[] {
  const achados: string[] = [];
  const anda = (dir: string) => {
    for (const nome of readdirSync(dir)) {
      const p = join(dir, nome);
      if (statSync(p).isDirectory()) anda(p);
      else if (/\.tsx?$/.test(nome) && !/\.(test|spec)\.tsx?$/.test(nome)) achados.push(p);
    }
  };
  anda('src');
  return achados;
}

/** Quantos call-sites de `simbolo` existem em produção, e onde. */
function chamadores(simbolo: string): string[] {
  const re = new RegExp(`\\b${simbolo}\\s*\\(`);
  return fontesDeProducao()
    .filter(p => relative('src', p).replace(/\\/g, '/') !== 'utils/sounds.ts')
    .filter(p => re.test(semComentarios(readFileSync(p, 'utf8'))))
    .map(p => relative('src', p).replace(/\\/g, '/'));
}

/* ── A TABELA — um corte, uma linha ──────────────────────────────────────── */

interface Corte {
  /** O id da decisão da Fase 0. Aparece no nome do teste: o vermelho NOMEIA. */
  id: string;
  /** Uma frase: o que o corte proíbe, na linguagem da decisão. */
  resumo: string;
  /** Onde a proibição vale. `ancora` estreita para um handler. */
  alvos: { arquivo: string; ancora?: string }[];
  /** Os `play*` que não podem aparecer nesses alvos. */
  proibidos: string[];
}

const CORTES: Corte[] = [
  {
    id: 'C-1',
    resumo: 'morte de inimigo perde o som de CONCLUSÃO de tarefa',
    alvos: [
      { arquivo: 'components/DungeonGame.tsx' },
      { arquivo: 'components/NightmareBattle.tsx' },
      { arquivo: 'components/ArenaGame.tsx' },
    ],
    proibidos: ['playTaskComplete'],
  },
  {
    id: 'C-2',
    resumo: 'empate no PPT perde o som — e o "OK genérico" não vai para o combate',
    alvos: [
      { arquivo: 'components/RPSGame.tsx' },
      { arquivo: 'components/ArenaGame.tsx' },
    ],
    proibidos: ['playFeed'],
  },
  {
    id: 'C-3',
    resumo: 'comprar na loja não soa como COMER',
    alvos: [{ arquivo: 'App.tsx', ancora: 'const handleShopBuy = useCallback(' }],
    proibidos: ['playFeed'],
  },
  {
    id: 'C-4',
    resumo: 'o carinho não soa como um mordisco (gesto contínuo, som pontual)',
    alvos: [{ arquivo: 'App.tsx', ancora: 'const handlePet = useCallback(' }],
    proibidos: ['playFeed'],
  },
  {
    id: 'C-5',
    resumo: 'o Glitchtama não usa o som de MARCO (evolução)',
    alvos: [{ arquivo: 'App.tsx', ancora: 'const handleFeed = useCallback(' }],
    proibidos: ['playEvolve'],
  },
  {
    id: 'C-8',
    resumo: 'a virada do dia nunca soa (classe 0 — silêncio protegido)',
    alvos: [{ arquivo: 'hooks/useDailyReset.ts' }],
    proibidos: Object.keys(CATEGORIA_DO_SOM),
  },
  {
    id: 'C-10',
    resumo: 'o Refúgio nunca soa (silêncio protegido — decisão do dono, 30/09/2026)',
    alvos: [
      { arquivo: 'components/refugio/RespiracaoGame.tsx' },
      { arquivo: 'components/refugio/RefugeInviteCard.tsx' },
      { arquivo: 'components/refugio/SupportNote.tsx' },
      { arquivo: 'components/mente/BolhasGame.tsx' },
    ],
    proibidos: Object.keys(CATEGORIA_DO_SOM),
  },
  {
    id: 'C-11',
    resumo: 'vencer minijogo não usa o som de CONCLUSÃO de tarefa (R-CAT; decisão do dono, 30/09/2026)',
    alvos: [
      { arquivo: 'components/DinoGame.tsx' },
      { arquivo: 'components/RPSGame.tsx' },
      { arquivo: 'components/mente/EcoGame.tsx' },
      { arquivo: 'components/mente/TrocaGame.tsx' },
      { arquivo: 'components/mente/PicrossGame.tsx' },
      { arquivo: 'components/mente/RevisaoGame.tsx' },
    ],
    proibidos: ['playTaskComplete'],
  },
  {
    id: 'C-9',
    resumo: 'os símbolos apagados na Fase 0 não voltam a existir',
    alvos: fontesDeProducao().map(p => ({ arquivo: relative('src', p) })),
    proibidos: ['playPoopClean', 'playPoopAlert', 'playMenuOpen'],
  },
];

describe('a régua dos cortes — nenhum `play*` cortado volta ao contexto cortado', () => {
  for (const corte of CORTES) {
    it(`${corte.id} — ${corte.resumo}`, () => {
      for (const alvo of corte.alvos) {
        const codigo = alvo.ancora ? escopo(ler(alvo.arquivo), alvo.ancora) : ler(alvo.arquivo);
        for (const simbolo of corte.proibidos) {
          const onde = `src/${alvo.arquivo.replace(/\\/g, '/')}`
            + (alvo.ancora ? ` (escopo \`${alvo.ancora}\`)` : '');
          expect(
            new RegExp(`\\b${simbolo}\\s*\\(`).test(codigo),
            `${corte.id} REINTRODUZIDO: \`${simbolo}()\` reapareceu em ${onde}. `
            + `O corte ${corte.id} diz: ${corte.resumo}. `
            + 'Se a decisão mudou, mude a tabela CORTES deste arquivo junto com o registro '
            + 'da nova decisão — não apague a linha para o teste ficar verde.',
          ).toBe(false);
        }
      }
    });
  }

  /**
   * C-6 e C-7 não cabem na tabela porque não são "o som sumiu daqui": são
   * "o som ficou, com contexto estreito". Travá-los pelo mesmo molde os
   * afrouxaria — e afrouxar um corte que já tem trava (C-6) seria regressão.
   */
  it('C-6 — `playDegenerate` tem UM chamador, e é a degeneração VOLUNTÁRIA', () => {
    const cs = chamadores('playDegenerate');
    expect(
      cs,
      'C-6 REINTRODUZIDO: `playDegenerate()` deve ter exatamente um chamador '
      + `(o gesto de degenerar, atrás de dupla confirmação). Encontrados: ${cs.join(', ')}. `
      + 'Derrota de minijogo NÃO cobra da barra que representa o cuidado.',
    ).toEqual(['App.tsx']);
  });

  it('C-7 — o toggle de dormir soa num sentido só (adormecer, nunca acordar)', () => {
    const corpo = escopo(ler('App.tsx'), 'const handleSleep = useCallback(');
    const disparos = corpo.match(/\bplaySleep\s*\(/g) ?? [];
    expect(
      disparos.length,
      `C-7 REINTRODUZIDO: \`playSleep()\` aparece ${disparos.length}x em \`handleSleep\`. `
      + 'O corte C-7 exige UM disparo, no ramo de adormecer.',
    ).toBe(1);
    expect(
      /if\s*\(\s*next\s*\)\s*playSleep\s*\(\s*\)/.test(corpo),
      'C-7 REINTRODUZIDO: o único `playSleep()` de `handleSleep` deixou de estar '
      + 'guardado por `if (next)` — acordar voltou a soar.',
    ).toBe(true);
  });

  /**
   * O ponto cego que produziu tudo isto: a Arena existia e o inventário não
   * sabia. Esta asserção falha se uma superfície nova aparecer chamando `play*`
   * sem que alguém a tenha classificado — que é a forma genérica do A-3.
   */
  it('A-3 — nenhuma superfície toca `play*` sem estar declarada no inventário', () => {
    const DECLARADOS: Record<string, string[]> = {
      playPresence: ['components/CompanionHUD.tsx'],
      // C-11 (30/09/2026): Dino e PPT saíram — vencer minijogo não é concluir tarefa.
      playTaskComplete: ['App.tsx'],
      playFeed: ['App.tsx', 'components/DungeonGame.tsx', 'components/NightmareBattle.tsx'],
      playShower: ['components/CompanionHUD.tsx'],
      playSleep: ['App.tsx'],
      playEvolve: ['App.tsx'],
      playDegenerate: ['App.tsx'],
      playVisorTune: ['components/CompanionHUD.tsx', 'components/EvolutionPath.tsx'],
    };
    for (const simbolo of Object.keys(CATEGORIA_DO_SOM)) {
      expect(
        chamadores(simbolo).sort(),
        `PONTO CEGO DE INVENTÁRIO: os chamadores de \`${simbolo}()\` mudaram. `
        + 'Toda superfície que toca um som tem de estar no §1 do '
        + '`squad-alpha-runs/som-01/discovery/inventario-sonoro.md` E nesta tabela — '
        + 'foi a ausência disso que deixou `ArenaGame.tsx` entrar com dois cortes '
        + 'reintroduzidos e 3.974 testes passando verde.',
      ).toEqual((DECLARADOS[simbolo] ?? []).sort());
    }
  });
});
