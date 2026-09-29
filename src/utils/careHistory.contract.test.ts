import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { careHistory, computeCarePattern, resolveBranch } from './carePattern';

// ---------------------------------------------------------------------------
// REGRESSÃO — o galho PREVISTO tem que ser o galho ENTREGUE.
//
// Defeito real (rodada 4): `App.tsx` lia dois históricos diferentes para a
// MESMA regra. A página de Evolução previa o galho com
// `completedTasks + activityLog`; a cerimônia decidia com
// `computeCarePattern(prev.completedTasks)`, sem o log. Para quem cumpre hábito
// por ATIVIDADE RECORRENTE — o mecanismo principal do app — a previsão era
// confiável e a decisão era um chute, e o jogador recebia um galho diferente do
// que a tela prometeu.
//
// Fronteira sem dono: duas chamadas da mesma regra, uma delas atualizada.
// ---------------------------------------------------------------------------

/** N conclusões espalhadas em dias distintos, dentro da janela de 14 dias. */
function diasDistintos(n: number, now: Date): string[] {
  return Array.from({ length: n }, (_, i) =>
    new Date(now.getTime() - i * 86400000 - 3600000).toISOString());
}

describe('careHistory — previsão e cerimônia leem o MESMO histórico', () => {
  const now = new Date('2026-08-14T20:00:00.000Z');
  // Jogador que só usa atividades recorrentes: zero tarefas avulsas, 8 dias
  // seguidos de atividade concluída. É o perfil que o `activityLog` existe para
  // enxergar (STATUS §2, achado 1 da rodada de auditoria).
  const save = { completedTasks: [] as Array<{ completedAt: string }>, activityLog: diasDistintos(8, now) };

  it('sem o activityLog a leitura é um chute; com ele é confiável (a diferença que causou o bug)', () => {
    expect(computeCarePattern(save.completedTasks, now).confident).toBe(false);
    const comLog = computeCarePattern(careHistory(save), now);
    expect(comLog.confident).toBe(true);
    expect(comLog.pattern.id).toBe('constante');
  });

  it('no EMPATE de atributos os dois históricos entregavam galhos DIFERENTES', () => {
    // power == benevolence no topo; harmony (o fallback do save) não lidera.
    const pontos = { power: 6, harmony: 2, benevolence: 6 };
    const previsto = resolveBranch(pontos, computeCarePattern(careHistory(save), now), 'harmony');
    const antigo = resolveBranch(pontos, computeCarePattern(save.completedTasks, now), 'harmony');

    expect(previsto).toBe('benevolence'); // ritmo constante → benevolência
    expect(antigo).toBe('power');     // sem leitura confiável → primeiro líder
    expect(previsto).not.toBe(antigo); // ← este é o dano: promessa ≠ entrega
  });

  it('careHistory junta as duas fontes e tolera save antigo sem os campos', () => {
    expect(careHistory({ completedTasks: [{ completedAt: 'x' }], activityLog: ['y'] }))
      .toEqual([{ completedAt: 'x' }, { completedAt: 'y' }]);
    expect(careHistory({})).toEqual([]);
  });
});

describe('guard de origem — nenhum call site pode voltar a ler só as tarefas', () => {
  const appSrc = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

  // AUTOVERIFICAÇÃO do guard: ele precisa ENXERGAR a forma defeituosa. Sem este
  // caso, o teste passaria para sempre mesmo se a regex estivesse errada — foi
  // exatamente assim que dois guards nasceram passando pelo motivo errado nesta
  // sessão (STATUS §5).
  const defeituoso = /computeCarePattern\(\s*(?:prev|gameState|state)\.completedTasks/;
  it('o guard reconhece a forma defeituosa quando ela existe', () => {
    expect(defeituoso.test('const r = computeCarePattern(prev.completedTasks);')).toBe(true);
    expect(defeituoso.test('const r = computeCarePattern(careHistory(prev));')).toBe(false);
  });

  it('App.tsx não passa `completedTasks` cru para computeCarePattern', () => {
    expect(appSrc).not.toMatch(defeituoso);
  });

  it('as duas chamadas de computeCarePattern em App.tsx usam careHistory', () => {
    const chamadas = appSrc.match(/computeCarePattern\([^)]*/g) ?? [];
    expect(chamadas.length).toBeGreaterThanOrEqual(2);
    for (const c of chamadas) expect(c).toContain('careHistory');
  });
});
