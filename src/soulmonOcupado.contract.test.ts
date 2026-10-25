/**
 * O SOULMON OCUPADO NA MASMORRA — o mapa dos pontos de entrada (pedido do dono, 11/10/2026, REGISTRO §36).
 *
 * "Tem que tirar da dungeon para mandar para outra missão, evoluir ou qualquer outra coisa que envolva de fato o Soulmon." Este guard
 * lê o FONTE (precedente: `widgetSemCobranca.contract.test.ts`) e trava a LISTA: cada ponto de entrada que usa o Soulmon passa por
 * `bloqueiaOcupado(acao)` no `App` ou por um lote trancado no `AreaView`. Ponto novo que use o Soulmon entra na lista e no teste.
 *
 *  App.tsx  : handleEvolveRequest · handleEvolve · handleEvolveToUnlocked · handleRebirth · handleGuildMissionSend
 *  AreaView : arena.duelo · arena.torneio · exploracao.passeio (trancados) e a masmorra com o Soulmon em missão
 *  Livre    : cuidar (comer, banho, dormir, carinho), os jogos do Salão/Ateliê/Refúgio, o Pesadelo da manhã (interstício automático)
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const app = readFileSync(join(__dirname, 'App.tsx'), 'utf-8');
const area = readFileSync(join(__dirname, 'components/nav/AreaView.tsx'), 'utf-8');

/** O corpo do `useCallback`/`async` que começa em `marca` (até o próximo `useCallback(` de mesmo nível, em linhas). */
function corpo(src: string, marca: string): string {
  const i = src.indexOf(marca);
  expect(i, `não achei ${marca}`).toBeGreaterThanOrEqual(0);
  return src.slice(i, i + 700);
}

describe('pontos de entrada que usam o Soulmon (App.tsx)', () => {
  const casos: Array<[string, string, string]> = [
    ['handleEvolveRequest', 'const handleEvolveRequest = useCallback(', "bloqueiaOcupado('evolucao')"],
    ['handleEvolve', 'const handleEvolve = useCallback(', "bloqueiaOcupado('evolucao')"],
    ['handleEvolveToUnlocked', 'const handleEvolveToUnlocked = useCallback(', "bloqueiaOcupado('evolucao')"],
    ['handleRebirth', 'const handleRebirth = useCallback(', "bloqueiaOcupado('renascer')"],
    ['handleGuildMissionSend', 'const handleGuildMissionSend = useCallback(', "bloqueiaOcupado('missao')"],
  ];
  for (const [nome, marca, guarda] of casos) {
    it(`${nome} começa recusando com o aviso quando o Soulmon está na masmorra`, () => {
      expect(corpo(app, marca)).toContain(guarda);
    });
  }

  it('o critério é UM só: o registro `dungeonAway` do save (soulmonNaMasmorra)', () => {
    expect(app).toMatch(/const naMasmorra = soulmonNaMasmorra\(gameState\)/);
    expect(app).toMatch(/naMasmorraRef\.current = naMasmorra/);
  });

  it('a Home recebe a plaquinha e o aviso; o AreaView recebe o `ocupado`', () => {
    expect(app).toContain('naMasmorra={naMasmorra}');
    expect(app).toContain('onSinalMasmorra={() => abrirAvisoMasmorra(null)}');
    expect(app).toMatch(/ocupado=\{\{ naMasmorra, missaoFora: isMissionAway\(guildMission, Date\.now\(\)\), onBusy: abrirAvisoMasmorra \}\}/);
  });

  it('"Retirar da Fenda" acerta pela conta pura e é a única saída (retire: true)', () => {
    expect(app).toMatch(/settleDungeonAwayNow\(gameStateRef\.current, setGameState, Date\.now\(\), true\)/);
  });
});

describe('lotes que usam o Soulmon (AreaView.tsx)', () => {
  it('duelo, torneio e passeio estão trancados com o Soulmon na masmorra', () => {
    expect(area).toMatch(/'arena\.duelo': 'duelo'/);
    expect(area).toMatch(/'arena\.torneio': 'torneio'/);
    expect(area).toMatch(/'exploracao\.passeio': 'passeio'/);
  });
  it('a masmorra com o Soulmon em missão da guilda avisa em vez de descer', () => {
    expect(area).toMatch(/missaoFora \? props\.ocupado\.onBusy\('masmorra-em-missao'\)/);
  });
});
