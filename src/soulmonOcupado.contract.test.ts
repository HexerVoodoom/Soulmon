/**
 * O SOULMON NA MASMORRA / EM MISSÃO DO CLÃ NÃO TRANCA MAIS NADA (rodada 4, N9 — reverte o REGISTRO §36).
 *
 * Fenda (`dungeonAway`) e missão do Clã seguem rendendo (contas e recompensas intactas), mas não impedem evoluir, renascer,
 * duelar, disputar o torneio, passear nem o pesadelo. Este guard lê o FONTE e trava a ausência do bloqueio.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const app = readFileSync(join(__dirname, 'App.tsx'), 'utf-8');
const area = readFileSync(join(__dirname, 'components/nav/AreaView.tsx'), 'utf-8');

describe('nenhum ponto de entrada recusa por Soulmon ocupado', () => {
  it('App.tsx não tem mais `bloqueiaOcupado` nem passa `ocupado` ao AreaView', () => {
    expect(app).not.toContain('bloqueiaOcupado');
    expect(app).not.toMatch(/ocupado=\{\{/);
  });
  it('o pesadelo da manhã não espera a Fenda nem a missão do clã', () => {
    expect(app).toMatch(/busy: false,/);
  });
  it('AreaView não tranca duelo, torneio, passeio nem a masmorra', () => {
    expect(area).not.toContain('LOTE_OCUPA_SOULMON');
    expect(area).not.toContain('props.ocupado');
    expect(area).not.toContain('masmorra-em-missao');
  });
  it('"Retirar da Fenda" segue acertando pela conta pura (retire: true)', () => {
    expect(app).toMatch(/settleDungeonAwayNow\(gameStateRef\.current, setGameState, Date\.now\(\), true\)/);
  });
});
