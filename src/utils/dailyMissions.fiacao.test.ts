import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { dailyMissionPool } from './dailyMissions';

// Guard de FIAÇÃO (como `weeklyMissions.fiacao.test.ts`): toda missão do catálogo tem de ter quem EMITA o evento dela — senão a
// pessoa recebe um convite que nunca cumpre. Lê o fonte; não testa a regra (isso é `dailyMissions.test.ts`).
const app = readFileSync('src/App.tsx', 'utf8');
const area = readFileSync('src/components/nav/AreaView.tsx', 'utf8');

describe('todo evento do catálogo diário tem emissor', () => {
  const porAreaView = ['dino', 'ppt', 'match3', 'foco', 'arena', 'barrage', 'eco', 'zip', 'selo'];
  const porContarDiaria = ['masmorra', 'comida', 'sono', 'mercado'];
  const porContarMissao: Record<string, string> = { banho: 'banho', humor: 'humor', carinho: 'carinho', presente: 'presente', torneio: 'torneio' };

  it('calabouco: o App bumpa o evento ao concluir um andar (e sobe o feito vitalício)', () => {
    expect(app).toContain("'calabouco')");
    expect(app).toContain("applyFeat(prev.feats, 'rogueFloors', ganhos)");
  });

  // Missões dos NPCs (12/11/2026, REGISTRO §314): o emissor mora no utilitário dono do gesto (ramo de sucesso) ou no handler do App.
  const porUtilitario: Record<string, [string, string]> = {
    essencia: ['src/utils/essences.ts', "'essencia'"], hex: ['src/utils/hexsmith.ts', "'hex'"], melhoria: ['src/utils/forgeActions.ts', "'melhoria'"],
    prato: ['src/utils/restaurant.ts', "'prato'"], feira: ['src/utils/feiraLoja.ts', "'feira'"],
    salao: ['src/utils/dailyMissions.ts', "dino: 'salao'"], mente: ['src/utils/dailyMissions.ts', "eco: 'mente'"],
  };
  const porBumpNoApp = ['compra', 'cenario', 'cla', 'passeio', 'conquista', 'journal'];

  for (const m of dailyMissionPool().filter(x => x.event !== 'calabouco')) {
    it(`${m.event}${m.npc ? ` (${m.npc})` : ''}`, () => {
      if (porUtilitario[m.event]) expect(readFileSync(porUtilitario[m.event][0], 'utf8')).toContain(porUtilitario[m.event][1]);
      else if (porBumpNoApp.includes(m.event)) { expect(app).toContain('bumpDailyIn('); expect(app).toContain(`'${m.event}'`); }
      else if (porAreaView.includes(m.event)) expect(area).toContain(`onDailyEvent?.('${m.event}')`);
      else if (porContarDiaria.includes(m.event)) expect(app).toContain(`contarDiaria('${m.event}')`);
      else expect(app).toMatch(new RegExp(`['"]?[\\w-]+['"]?: '${porContarMissao[m.event]}'`));
    });
  }
  it('as primeiras vezes têm emissor: visita no visitarPredio, passeio no resgate, estreias pelo contarDiaria', () => {
    expect(app).toContain("markFirst(entrou.firstTimes, `visit:${id}`)");
    expect(app).toContain("markFirst(prev.firstTimes, 'first-stroll')");
    expect(app).toContain('markFirstForEvent(prev.firstTimes, evento)');
    expect(app).toContain('onClaim: resgatarPrimeira');
    expect(app).toContain('onGoBuilding={irAoDestinoDaMissao}');
  });
  it('o App passa o emissor à AreaView e o resgate à folha', () => {
    expect(app).toContain('onDailyEvent={contarDiaria}');
    expect(app).toContain('onClaim: resgatarDiaria');
  });
});
