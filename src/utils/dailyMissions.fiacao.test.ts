import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { dailyMissionPool } from './dailyMissions';

// Guard de FIAÇÃO (como `weeklyMissions.fiacao.test.ts`): toda missão do catálogo tem de ter quem EMITA o evento dela — senão a
// pessoa recebe um convite que nunca cumpre. Lê o fonte; não testa a regra (isso é `dailyMissions.test.ts`).
const app = readFileSync('src/App.tsx', 'utf8');
const area = readFileSync('src/components/nav/AreaView.tsx', 'utf8');

describe('todo evento do catálogo diário tem emissor', () => {
  const porAreaView = ['dino', 'ppt', 'match3', 'foco', 'arena'];
  const porContarDiaria = ['masmorra', 'comida', 'sono', 'mercado'];
  const porContarMissao: Record<string, string> = { banho: 'banho', brincar: 'brincar', humor: 'humor', carinho: 'carinho', amigo: 'amigo', torneio: 'torneio' };

  for (const m of dailyMissionPool()) {
    it(`${m.event}`, () => {
      if (porAreaView.includes(m.event)) expect(area).toContain(`onDailyEvent?.('${m.event}')`);
      else if (porContarDiaria.includes(m.event)) expect(app).toContain(`contarDiaria('${m.event}')`);
      else expect(app).toMatch(new RegExp(`['"]?[\\w-]+['"]?: '${porContarMissao[m.event]}'`));
    });
  }
  it('o App passa o emissor à AreaView e o resgate à folha', () => {
    expect(app).toContain('onDailyEvent={contarDiaria}');
    expect(app).toContain('onClaim: resgatarDiaria');
  });
});
