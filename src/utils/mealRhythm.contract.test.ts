import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * A RÉGUA DO RITMO DAS REFEIÇÕES — o que a feature NÃO pode virar.
 *
 * O pedido do dono foi "incentivos para entrar depois das refeições". A linha
 * entre incentivo e cobrança é fina e invisível a olho nu, então ela é travada
 * em FONTE (comentário ignorado: um comentário precisa poder dizer o que é
 * proibido). Cada caso abaixo fecha uma forma específica de a feature degenerar.
 */
const ler = (p: string) => readFileSync(p, 'utf8');
const semComentario = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');

const modulo = semComentario(ler('src/utils/mealRhythm.ts'));
const app = ler('src/App.tsx');
const nm = semComentario(ler('src/components/NotificationManager.tsx'));
const care = semComentario(ler('src/hooks/useCareSystem.ts'));

describe('NÃO COBRA: o módulo não lê desempenho nenhum', () => {
  it.each([
    'healthPoints', 'maxHealthPoints', 'energyPoints', 'gamePoints', 'emblems', 'totalXP',
    'perfectDays', 'completedTasks', 'dailyGoalFor', 'registeredForDay', 'habitRhythms',
    'moodLog', 'streak', 'credits',
  ])('mealRhythm.ts não menciona `%s`', campo => {
    expect(modulo).not.toContain(campo);
  });

  it('não importa nenhum módulo de regra de jogo (cuidado, meta, moeda, XP, humor)', () => {
    const imports = [...modulo.matchAll(/from\s+'([^']+)'/g)].map(m => m[1]);
    expect([...new Set(imports)].sort()).toEqual(['./playerDay', '../../functions/api/_mealRhythm.js', '../../functions/api/_pushCopy.js'].sort());
  });


});

describe('FILA: o cartão-convite saiu do app (dono, 18/10/2026)', () => {
  it('nenhum `refeicao` na fila de avisos e nenhum MealInviteCard no App', () => {
    expect(app).not.toContain("key: 'refeicao',");
    expect(app).not.toContain('MealInviteCard');
  });
});

describe('NÃO SOMA: o ritmo de push SUBSTITUI, não empilha', () => {
  it('com o push das refeições ligado, o aviso das 20h e os convites de 10h/16h cedem', () => {
    expect(nm).toMatch(/if \(mealPushRef\.current\) return;/);
    expect(nm).toMatch(/hh === 10 && !mealPushRef\.current/);
    expect(nm).toMatch(/hh === 16 && !mealPushRef\.current/);
    expect(nm).toMatch(/hh === 22 && !\(mealPushRef\.current && restWindowRef\.current\)/);
  });
  it('o alarme nativo lê o MESMO texto e a MESMA tag do push (é a tag que impede a duplicata)', () => {
    expect(nm).toContain('mealInviteCopy(meal, mealPushKind(meal, dia)');
    expect(nm).toContain('id: copia.tag');
  });
  it('o alarme não é agendado dentro da janela de descanso', () => {
    expect(nm).toContain('dentroDoDescanso');
    expect(nm).toMatch(/mealPushRef\.current && hhmm && !dentroDoDescanso/);
  });
  it('o poll da web NÃO dispara notificação de refeição (com o app aberto o cartão já é o convite)', () => {
    expect(nm).not.toMatch(/showNotification\([^)]*meal/i);
  });
  it('o push é OPT-IN: sem `push: true` nada do ritmo vai ao servidor', () => {
    expect(nm).toContain("const mealPush = enabled && mealRhythm?.push === true;");
    expect(nm).toContain('mealPush ? serverMeals(mealRhythm, restWindow, new Date()) : null');
  });
});

describe('COCÔ: dreno e teto não mudaram; a AGENDA agora garante 2 acordado (REGISTRO §114)', () => {
  it('o 1º continua sorteado entre earliest (07h / Madrugador) e 15h', () => {
    expect(care).toContain('earliestPoopHour(gameState.petPassive, 7)');
    expect(care).toContain('latest: 15,');
    expect(care).toContain('planDailyPoops(Math.random,');
  });
  it('os DOIS cocôs saem agendados de uma vez; save antigo (1 só) ganha o 2º clampado ao dia acordado', () => {
    expect(care).toContain('poopEventsScheduled: [startOfDay + h1 * 3600000, startOfDay + h2 * 3600000]');
    expect(care).toContain('awakeSecondGapHours(');
    expect(care).not.toContain('8 + Math.random() * 2'); // o caminho que caía no sono morreu
  });
  it('o hook não ganhou NENHUMA regra nova de dreno/teto (isso é de poopDrain.ts)', () => {
    expect(care).not.toMatch(/MAX_HEARTS_LOST|heartLossCap|applyPoopDrain|remainingDrainToday/);
  });
});

describe('RECOMPENSA: nada de moeda, energia, HP ou XP pelo convite', () => {
  it('os atendedores de gesto só escrevem `mealRitual` (a regra de cada gesto continua no dono dele)', () => {
    const i = app.indexOf('const atenderRefeicao = useCallback');
    const trecho = app.slice(i, i + 400);
    expect(trecho).toContain('markMealDone(prev, new Date(), kind, isSleepingRefeicao.current)');
    expect(trecho).not.toMatch(/gamePoints|emblems|totalXP|healthPoints|energyPoints/);
  });

});
