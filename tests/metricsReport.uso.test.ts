import { describe, it, expect } from 'vitest';
import { renderRelatorio, renderUsoDoApp, medianaDeFaixa } from '../tools/metricsReport.mjs';

const totais: Record<string, number> = {
  'time.screen.home.users': 10, 'time.screen.home.sec_est': 10 * 90, 'time.screen.home.band_5': 6, 'time.screen.home.band_4': 4,
  'time.feature.jogos.salao.users': 4, 'time.feature.jogos.salao.sec_est': 4 * 450, 'time.feature.jogos.salao.band_8': 4,
  'minigame.match3.start': 8, 'minigame.match3.end_0': 3, 'minigame.match3.end_1': 3, 'minigame.match3.end_2': 2, 'minigame.match3.sec_est': 8 * 150, 'minigame.match3.band_7': 8,
  tasks_planned_sum: 20, tasks_done_sum: 15, completion_bucket_10: 3, completion_bucket_5: 2, 'task_done.task': 9, 'task_done.habit': 6, 'task_skipped.task': 2,
  'session.band_6': 3, 'session.band_7': 1, 'session.sec_est': 3 * 150 + 240, 'session.build_130': 4,
};
const txt = (l: string[]) => l.join('\n');

describe('relatório de tempo de uso', () => {
  it('mediana de faixa vem como rótulo e é null sem dados', () => {
    expect(medianaDeFaixa(totais, 'time.screen.home.')).toBe('<2m');
    expect(medianaDeFaixa({}, 'time.screen.home.')).toBeNull();
  });
  it('telas, features, minigames, tarefas e sessões', () => {
    const t = txt(renderUsoDoApp(totais));
    expect(t).toMatch(/home\s+10\s+1\.5min\s+<2m/);
    expect(t).toMatch(/jogos\.salao\s+4\s+7\.5min\s+<10m/);
    expect(t).toMatch(/match3\s+8\s+38%\s+38%\s+25%\s+2\.5min\s+<5m/);
    expect(t).toContain('~75.0%  (15 de 20)');
    expect(t).toContain('pessoa-dias com meta: 5');
    expect(t).toContain('sessões: 4');
    expect(t).toContain('130:4');
  });
  it('sem dados diz "sem dados" em vez de zero', () => {
    const t = txt(renderUsoDoApp({}));
    expect(t.match(/sem dados/g)?.length).toBe(6);
  });
  it('o relatório completo inclui o bloco', () => {
    const t = txt(renderRelatorio({ from: '2026-11-01', to: '2026-11-09', totals: totais }));
    expect(t).toContain('TEMPO POR TELA');
    expect(t).toContain('TAREFAS E HÁBITOS');
  });
});
