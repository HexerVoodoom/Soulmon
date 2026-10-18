/**
 * FIAÇÃO do Mistério: concluir tarefa/hábito conta na barra coletiva do clã (D-18). Não há UM ponto de conclusão
 * no App (tarefa, hábito sem etapas, última etapa de hábito), então os TRÊS chamam `contarMisterio` — e esta régua
 * garante que nenhum caiu, que a chamada está FORA de updater (footgun 6) e que é fire-and-forget.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { countMisterioTask } from './claApi';

const app = fs.readFileSync(path.resolve(__dirname, '../App.tsx'), 'utf8');

describe('o Mistério é contado nos três caminhos de conclusão', () => {
  it('handleToggleTask, handleToggleActivityCompletion e a etapa que fecha o hábito chamam contarMisterio', () => {
    const corpo = (inicio: string) => app.slice(app.indexOf(inicio), app.indexOf(inicio) + 4500);
    expect(corpo('const handleToggleTask = (taskId: string)')).toMatch(/contarMisterio\(`t:\$\{taskId\}`\)/);
    expect(corpo('const handleToggleActivityCompletion = (activityId: string)')).toMatch(/contarMisterio\(`a:\$\{activityId\}`, true\)/);
    expect(app).toMatch(/if \(justFinishedActivity\) contarMisterio\(`a:\$\{activityId\}`, true\)/);
  });

  it('só conta com clã (a memória do Bosque neste aparelho) e com saveId', () => {
    expect(app).toMatch(/if \(!saveId \|\| !readGroveLocal\(\)\) return;/);
  });

  it('o prêmio dos prédios entra por applyClaRewards, que é idempotente por recibo', () => {
    expect(app).toMatch(/applyClaRewards\(prev, receipt, rewards,/);
  });
});

describe('countMisterioTask é fire-and-forget', () => {
  afterEach(() => vi.restoreAllMocks());

  it('sem rede não lança e não devolve promessa pendente para o chamador', () => {
    globalThis.fetch = vi.fn(async () => { throw new TypeError('offline'); }) as never;
    expect(() => countMisterioTask('s'.repeat(32), 't:abc')).not.toThrow();
    expect(countMisterioTask('s'.repeat(32), 't:abc')).toBeUndefined();
  });

  it('manda o taskId higienizado ao servidor', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ counted: true }), { status: 200 }));
    globalThis.fetch = f as never;
    countMisterioTask('s'.repeat(32), 'a:meu hábito:2026-10-18');
    await vi.waitFor(() => expect(f).toHaveBeenCalled());
    const [url, init] = f.mock.calls[0] as unknown as [string, { body: string }];
    expect(url).toContain('action=claMisterioTarefa');
    expect(JSON.parse(init.body).taskId).toBe('a:meu_h_bito:2026-10-18');
  });
});
