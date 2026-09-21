/**
 * O funil semanal (`scripts/metrics-report.mjs`, decisão #18 do QA GERAL).
 * A metade PURA — a tabela — travada como comportamento: linhas na ordem do
 * caminho, `n` em toda linha, e a razão sempre rotulada como aproximada.
 * O transporte (fetch, saída 2 sem chave) é conferido à mão; ver o cabeçalho.
 */
import { describe, it, expect } from 'vitest';
import { tabelaDoFunil, janela, LINHAS_DO_FUNIL } from '../scripts/metrics-report.mjs';

const resposta = (totals: Record<string, number>) => ({
  ok: true, from: '2026-09-15', to: '2026-09-21', days: {}, totals,
  notes: { cohort: 'nao existe', unreadable: ['retencao', 'D7'] },
});

describe('tabela do funil', () => {
  it('imprime as etapas na ordem do caminho, com o n de cada uma', () => {
    const linhas = tabelaDoFunil(resposta({
      install: 10, onboarding_step: 40, first_task_done: 6, day_active: 20,
      week_active: 3, 'retained.d1': 4, 'retained.d7': 2,
    }));
    const texto = linhas.join('\n');
    const ordem = LINHAS_DO_FUNIL.map(([r]) => texto.indexOf(r));
    expect(ordem.every(p => p >= 0)).toBe(true);
    expect([...ordem].sort((a, b) => a - b)).toEqual(ordem);
    expect(texto).toMatch(/install\s+│\s+10 │ ~100\.0%/);
    expect(texto).toMatch(/first_task_done\s+│\s+6 │ ~60\.0%/);
    expect(texto, 'etapa sem evento aparece com 0 — ausência é dado').toMatch(/retained d30\s+│\s+0 │/);
  });

  it('sem install não existe 0% — existe "sem dados"', () => {
    const texto = tabelaDoFunil(resposta({ day_active: 5 })).join('\n');
    expect(texto).toMatch(/day_active\s+│\s+5 │ sem dados/);
    expect(texto).not.toContain('NaN');
  });

  it('repete o que o servidor diz não saber e rotula a razão como aproximada', () => {
    const texto = tabelaDoFunil(resposta({ install: 2, first_task_done: 1 })).join('\n');
    expect(texto).toContain('retencao · D7');
    expect(texto).toContain('~50.0%  (1 de 2)');
    expect(texto).toMatch(/NÃO é coorte/);
  });
});

describe('janela da última semana', () => {
  it('7 dias inclusivos terminando em --to', () => {
    expect(janela('2026-09-21', 7)).toEqual({ from: '2026-09-15', to: '2026-09-21' });
    expect(janela('2026-03-01', 1)).toEqual({ from: '2026-03-01', to: '2026-03-01' });
  });
});
