import { describe, it, expect } from 'vitest';
import { parseQuickAdd, quickAddHint } from './quickAdd';

// Quarta-feira, 11 de março de 2026, 10h00 local. Data fixa porque "amanhã" é
// função do relógio do chamador — o parser não pode ter relógio próprio.
const NOW = new Date(2026, 2, 11, 10, 0, 0);
const PT = { now: NOW, language: 'pt-BR' as const };
const EN = { now: NOW, language: 'en' as const };

describe('quickAdd — o caso de sobrevivência (nunca explodir, nunca perder o texto)', () => {
  it('input vazio vira tarefa vazia sem lançar', () => {
    expect(parseQuickAdd('', PT)).toEqual({ kind: 'task', name: '', tokens: [] });
    expect(parseQuickAdd('   ', PT)).toEqual({ kind: 'task', name: '', tokens: [] });
  });

  it('lixo continua sendo o nome da tarefa', () => {
    const r = parseQuickAdd('asdkj@@ ###', PT);
    expect(r.kind).toBe('task');
    expect(r.name).toBe('asdkj@@ ###');
    expect(r.tokens).toEqual([]);
  });

  it('não lança com entradas absurdas', () => {
    const junk = ['!', '#', '/', ':', '!!!!!', '99/99', 'dia 99', 'a cada dias', '0x semana', '#'.repeat(200)];
    for (const j of junk) expect(() => parseQuickAdd(j, PT)).not.toThrow();
    for (const j of junk) expect(() => parseQuickAdd(j, EN)).not.toThrow();
  });

  it('sobrevive a input não-string (chamador com any)', () => {
    // @ts-expect-error — a UI real pode passar undefined num render intermediário.
    expect(() => parseQuickAdd(undefined, PT)).not.toThrow();
  });

  it('se os tokens comerem tudo, devolve o input original como nome', () => {
    const r = parseQuickAdd('3x semana', PT);
    expect(r.name).toBe('3x semana');
    expect(r.schedule).toEqual({ kind: 'timesPerWeek', target: 3 });
  });

  it('input só de tokens (vários) também mantém nome', () => {
    const r = parseQuickAdd('!2 #trabalho amanhã 14h', PT);
    expect(r.name).toBe('!2 #trabalho amanhã 14h');
    expect(r.effort).toBe(2);
    expect(r.category).toBe('Work');
    expect(r.date).toBe('2026-03-12');
    expect(r.time).toBe('14:00');
  });
});

describe('quickAdd — esforço', () => {
  it.each([['!1', 1], ['!2', 2], ['!3', 3]] as const)('%s → %i', (tok, eff) => {
    const r = parseQuickAdd(`escrever relatório ${tok}`, PT);
    expect(r.effort).toBe(eff);
    expect(r.name).toBe('escrever relatório');
    expect(r.tokens).toContain(tok);
  });

  it('sem token não inventa esforço', () => {
    expect(parseQuickAdd('escrever relatório', PT).effort).toBeUndefined();
  });

  it('!4 e !0 não são esforço e ficam no nome', () => {
    expect(parseQuickAdd('teste !4', PT).effort).toBeUndefined();
    expect(parseQuickAdd('teste !4', PT).name).toBe('teste !4');
    expect(parseQuickAdd('teste !0', PT).effort).toBeUndefined();
  });

  it('"!" colado no meio de palavra não conta', () => {
    expect(parseQuickAdd('urgente!1coisa', PT).effort).toBeUndefined();
  });
});

describe('quickAdd — categoria', () => {
  it.each([
    ['#saude', 'Health'],
    ['#saúde', 'Health'],
    ['#SAUDE', 'Health'],
    ['#health', 'Health'],
    ['#trabalho', 'Work'],
    ['#work', 'Work'],
    ['#estudo', 'Study'],
    ['#study', 'Study'],
    ['#treino', 'Fitness'],
    ['#fitness', 'Fitness'],
    ['#criatividade', 'Creativity'],
    ['#creativity', 'Creativity'],
    ['#disciplina', 'Discipline'],
    ['#discipline', 'Discipline'],
    ['#social', 'Social'],
    ['#amigos', 'Social'],
    ['#bem-estar', 'Wellness'],
    ['#bemestar', 'Wellness'],
    ['#wellness', 'Wellness'],
  ] as const)('%s → %s', (tag, cat) => {
    const r = parseQuickAdd(`fazer coisa ${tag}`, PT);
    expect(r.category).toBe(cat);
    expect(r.name).toBe('fazer coisa');
  });

  it('tag desconhecida fica no nome (não some em silêncio)', () => {
    const r = parseQuickAdd('fazer coisa #jardinagem', PT);
    expect(r.category).toBeUndefined();
    expect(r.name).toBe('fazer coisa #jardinagem');
  });

  it('duas tags conhecidas: a primeira vence, as duas saem do nome', () => {
    const r = parseQuickAdd('correr #treino #saude', PT);
    expect(r.category).toBe('Fitness');
    expect(r.name).toBe('correr');
  });

  it('# no meio da palavra não é tag', () => {
    expect(parseQuickAdd('c#saude', PT).category).toBeUndefined();
  });
});

describe('quickAdd — datas', () => {
  it('hoje / today', () => {
    expect(parseQuickAdd('ligar hoje', PT).date).toBe('2026-03-11');
    expect(parseQuickAdd('call today', EN).date).toBe('2026-03-11');
  });

  it('amanhã, com e sem acento, e tomorrow', () => {
    expect(parseQuickAdd('ligar amanhã', PT).date).toBe('2026-03-12');
    expect(parseQuickAdd('ligar amanha', PT).date).toBe('2026-03-12');
    expect(parseQuickAdd('call tomorrow', EN).date).toBe('2026-03-12');
  });

  it('depois de amanhã', () => {
    expect(parseQuickAdd('ligar depois de amanhã', PT).date).toBe('2026-03-13');
    expect(parseQuickAdd('call day after tomorrow', EN).date).toBe('2026-03-13');
  });

  it('um único dia da semana vira DATA (próxima ocorrência)', () => {
    // 11/03/2026 é quarta. Sexta = 13/03.
    expect(parseQuickAdd('reunião sexta', PT).date).toBe('2026-03-13');
    expect(parseQuickAdd('meeting friday', EN).date).toBe('2026-03-13');
    // Segunda já passou nesta semana → 16/03.
    expect(parseQuickAdd('reunião segunda', PT).date).toBe('2026-03-16');
  });

  it('o próprio dia de hoje resolve para hoje', () => {
    expect(parseQuickAdd('reunião quarta', PT).date).toBe('2026-03-11');
  });

  it('dia da semana abreviado também é data quando está sozinho', () => {
    expect(parseQuickAdd('feira sab', PT).date).toBe('2026-03-14');
    expect(parseQuickAdd('market sat', EN).date).toBe('2026-03-14');
  });

  it('"dia 15" → próxima ocorrência do dia do mês', () => {
    expect(parseQuickAdd('pagar boleto dia 15', PT).date).toBe('2026-03-15');
    expect(parseQuickAdd('pagar boleto dia 5', PT).date).toBe('2026-04-05');
    expect(parseQuickAdd('pagar boleto no dia 15', PT).name).toBe('pagar boleto');
  });

  it('"the 15th" em EN', () => {
    expect(parseQuickAdd('pay bill on the 15th', EN).date).toBe('2026-03-15');
  });

  it('15/03 em PT é dia/mês', () => {
    const r = parseQuickAdd('dentista 15/03', PT);
    expect(r.date).toBe('2026-03-15');
    expect(r.name).toBe('dentista');
  });

  it('03/15 em EN é mês/dia', () => {
    expect(parseQuickAdd('dentist 03/15', EN).date).toBe('2026-03-15');
  });

  it('EN com 15/03 (mês impossível) cai no bom senso, não na regra', () => {
    expect(parseQuickAdd('dentist 15/03', EN).date).toBe('2026-03-15');
  });

  it('data sem ano que já passou vai para o ano seguinte', () => {
    expect(parseQuickAdd('aniversário 02/01', PT).date).toBe('2027-01-02');
  });

  it('data com ano explícito é respeitada', () => {
    expect(parseQuickAdd('prova 20/05/2027', PT).date).toBe('2027-05-20');
    expect(parseQuickAdd('prova 20/05/27', PT).date).toBe('2027-05-20');
  });

  it('sem token de data não inventa data', () => {
    expect(parseQuickAdd('comprar leite', PT).date).toBeUndefined();
  });
});

describe('quickAdd — horas', () => {
  it('14h e 14h30', () => {
    expect(parseQuickAdd('reunião 14h', PT).time).toBe('14:00');
    expect(parseQuickAdd('reunião 14h30', PT).time).toBe('14:30');
    expect(parseQuickAdd('reunião 14h', PT).name).toBe('reunião');
  });

  it('14:30', () => {
    expect(parseQuickAdd('reunião 14:30', PT).time).toBe('14:30');
    expect(parseQuickAdd('meeting 09:05', EN).time).toBe('09:05');
  });

  it('am/pm', () => {
    expect(parseQuickAdd('meeting 2pm', EN).time).toBe('14:00');
    expect(parseQuickAdd('meeting 2:30pm', EN).time).toBe('14:30');
    expect(parseQuickAdd('meeting 9am', EN).time).toBe('09:00');
    expect(parseQuickAdd('meeting 12am', EN).time).toBe('00:00');
    expect(parseQuickAdd('meeting 12pm', EN).time).toBe('12:00');
    expect(parseQuickAdd('meeting 2 pm', EN).name).toBe('meeting');
  });

  it('"às 9" e "at 9"', () => {
    expect(parseQuickAdd('correr às 9', PT).time).toBe('09:00');
    expect(parseQuickAdd('correr as 9', PT).time).toBe('09:00');
    expect(parseQuickAdd('run at 9', EN).time).toBe('09:00');
    expect(parseQuickAdd('run at 9:15', EN).time).toBe('09:15');
    expect(parseQuickAdd('correr às 9', PT).name).toBe('correr');
  });

  it('número solto NÃO é hora', () => {
    const r = parseQuickAdd('comprar 9 ovos', PT);
    expect(r.time).toBeUndefined();
    expect(r.name).toBe('comprar 9 ovos');
  });

  it('hora inválida não vira hora', () => {
    expect(parseQuickAdd('coisa 25h', PT).time).toBeUndefined();
    expect(parseQuickAdd('coisa 14:75', PT).time).toBeUndefined();
  });
});

describe('quickAdd — recorrência (o que separa tarefa de hábito)', () => {
  it('sem recorrência é sempre task', () => {
    const r = parseQuickAdd('pagar boleto amanhã !2 #trabalho', PT);
    expect(r.kind).toBe('task');
    expect(r.schedule).toBeUndefined();
  });

  it('3x semana / 3x week / 3x per week → timesPerWeek', () => {
    for (const [txt, opts] of [
      ['academia 3x semana', PT],
      ['academia 3x por semana', PT],
      ['academia 3x na semana', PT],
      ['gym 3x week', EN],
      ['gym 3x per week', EN],
      ['gym 3x/week', EN],
    ] as const) {
      const r = parseQuickAdd(txt, opts);
      expect(r.kind, txt).toBe('activity');
      expect(r.schedule, txt).toEqual({ kind: 'timesPerWeek', target: 3 });
    }
  });

  it('target é limitado a 1..7', () => {
    expect(parseQuickAdd('x 99x semana', PT).schedule).toEqual({ kind: 'timesPerWeek', target: 7 });
  });

  it('"comprar 3x leite" NÃO vira hábito — falta semana/week', () => {
    const r = parseQuickAdd('comprar 3x leite', PT);
    expect(r.kind).toBe('task');
    expect(r.schedule).toBeUndefined();
    expect(r.name).toBe('comprar 3x leite');
  });

  it('todo dia / diariamente / every day → weekdays com os sete', () => {
    const all = { kind: 'weekdays', days: [0, 1, 2, 3, 4, 5, 6] };
    for (const [txt, opts] of [
      ['beber água todo dia', PT],
      ['beber água todos os dias', PT],
      ['beber água diariamente', PT],
      ['drink water every day', EN],
      ['drink water everyday', EN],
      ['drink water daily', EN],
    ] as const) {
      const r = parseQuickAdd(txt, opts);
      expect(r.kind, txt).toBe('activity');
      expect(r.schedule, txt).toEqual(all);
    }
  });

  it('seg qua sex / mon wed fri → weekdays específicos', () => {
    expect(parseQuickAdd('correr seg qua sex', PT).schedule).toEqual({ kind: 'weekdays', days: [1, 3, 5] });
    expect(parseQuickAdd('run mon wed fri', EN).schedule).toEqual({ kind: 'weekdays', days: [1, 3, 5] });
    expect(parseQuickAdd('correr segunda quarta sexta', PT).schedule).toEqual({ kind: 'weekdays', days: [1, 3, 5] });
    expect(parseQuickAdd('correr seg qua sex', PT).name).toBe('correr');
    expect(parseQuickAdd('correr seg qua sex', PT).kind).toBe('activity');
  });

  it('dias repetidos não duplicam e saem ordenados', () => {
    expect(parseQuickAdd('correr sex seg sex', PT).schedule).toEqual({ kind: 'weekdays', days: [1, 5] });
  });

  it('acentos são opcionais nos dias', () => {
    expect(parseQuickAdd('feira sabado domingo', PT).schedule).toEqual({ kind: 'weekdays', days: [0, 6] });
    expect(parseQuickAdd('feira sábado domingo', PT).schedule).toEqual({ kind: 'weekdays', days: [0, 6] });
    expect(parseQuickAdd('treino terça quinta', PT).schedule).toEqual({ kind: 'weekdays', days: [2, 4] });
    expect(parseQuickAdd('treino terca quinta', PT).schedule).toEqual({ kind: 'weekdays', days: [2, 4] });
  });

  it('a cada 3 dias / every 3 days → everyNDays from schedule', () => {
    for (const [txt, opts] of [
      ['regar planta a cada 3 dias', PT],
      ['water plant every 3 days', EN],
    ] as const) {
      const r = parseQuickAdd(txt, opts);
      expect(r.kind, txt).toBe('activity');
      expect(r.schedule, txt).toEqual({ kind: 'everyNDays', n: 3, from: 'schedule' });
    }
  });

  it('a variante de CONCLUSÃO nas três grafias → from completion', () => {
    const expected = { kind: 'everyNDays', n: 3, from: 'completion' };
    for (const [txt, opts] of [
      ['regar planta a cada 3 dias apos concluir', PT],
      ['regar planta a cada 3 dias após concluir', PT],
      ['regar planta a cada 3 dias depois de concluir', PT],
      ['regar planta a cada 3 dias!', PT],
      ['water plant every 3 days after completion', EN],
      ['water plant every 3 days after completing', EN],
      ['water plant every 3 days!', EN],
    ] as const) {
      const r = parseQuickAdd(txt, opts);
      expect(r.schedule, txt).toEqual(expected);
      expect(r.kind, txt).toBe('activity');
    }
  });

  it('as duas variantes de everyNDays são realmente diferentes', () => {
    const a = parseQuickAdd('regar a cada 3 dias', PT).schedule as { from: string };
    const b = parseQuickAdd('regar a cada 3 dias!', PT).schedule as { from: string };
    expect(a.from).toBe('schedule');
    expect(b.from).toBe('completion');
  });

  it('o "!" de recorrência não engole o "!2" de esforço', () => {
    const r = parseQuickAdd('regar a cada 3 dias !2', PT);
    expect(r.schedule).toEqual({ kind: 'everyNDays', n: 3, from: 'schedule' });
    expect(r.effort).toBe(2);
    expect(r.name).toBe('regar');
  });

  it('n é clampado e "a cada 1 dia" funciona', () => {
    expect(parseQuickAdd('x a cada 1 dia', PT).schedule).toEqual({ kind: 'everyNDays', n: 1, from: 'schedule' });
  });

  it('"a cada 3 dias" não é confundido com "dia 15"', () => {
    const r = parseQuickAdd('regar a cada 3 dias', PT);
    expect(r.date).toBeUndefined();
    expect(r.name).toBe('regar');
  });
});

describe('quickAdd — combinações (o caso real da caixa de captura)', () => {
  it('o exemplo do plano, em PT', () => {
    const r = parseQuickAdd('pagar boleto amanhã 14h !2 #trabalho', PT);
    expect(r).toMatchObject({
      kind: 'task',
      name: 'pagar boleto',
      category: 'Work',
      effort: 2,
      date: '2026-03-12',
      time: '14:00',
    });
    expect(r.schedule).toBeUndefined();
    expect(r.tokens.length).toBe(4);
  });

  it('o mesmo caso em EN', () => {
    const r = parseQuickAdd('pay the bill tomorrow 2pm !2 #work', EN);
    expect(r).toMatchObject({
      kind: 'task',
      name: 'pay the bill',
      category: 'Work',
      effort: 2,
      date: '2026-03-12',
      time: '14:00',
    });
  });

  it('hábito completo em PT', () => {
    const r = parseQuickAdd('academia 3x semana às 7 #treino !3', PT);
    expect(r).toMatchObject({
      kind: 'activity',
      name: 'academia',
      category: 'Fitness',
      effort: 3,
      time: '07:00',
      schedule: { kind: 'timesPerWeek', target: 3 },
    });
  });

  it('hábito completo em EN, variante de conclusão', () => {
    const r = parseQuickAdd('deep clean every 5 days after completion !3 #wellness', EN);
    expect(r).toMatchObject({
      kind: 'activity',
      name: 'deep clean',
      category: 'Wellness',
      effort: 3,
      schedule: { kind: 'everyNDays', n: 5, from: 'completion' },
    });
  });

  it('ordem dos tokens não importa', () => {
    const a = parseQuickAdd('#trabalho !2 amanhã 14h pagar boleto', PT);
    const b = parseQuickAdd('pagar boleto amanhã 14h !2 #trabalho', PT);
    expect(a.name).toBe('pagar boleto');
    expect({ ...a, tokens: [] }).toEqual({ ...b, tokens: [] });
  });

  it('preposições órfãs saem das pontas', () => {
    expect(parseQuickAdd('reunião no sábado', PT).name).toBe('reunião');
    expect(parseQuickAdd('meeting on friday', EN).name).toBe('meeting');
    expect(parseQuickAdd('ligar para o médico amanhã', PT).name).toBe('ligar para o médico');
  });

  it('espaços são normalizados', () => {
    expect(parseQuickAdd('   comprar    leite   amanhã  ', PT).name).toBe('comprar leite');
  });

  it('tokens reconhecidos são devolvidos para os chips', () => {
    const r = parseQuickAdd('correr seg qua sex às 7 !1 #treino', PT);
    expect(r.tokens).toEqual(expect.arrayContaining(['#treino', 'seg', 'qua', 'sex', '!1', 'às 7']));
  });
});

describe('quickAdd — determinismo', () => {
  it('o mesmo input com o mesmo now dá o mesmo resultado', () => {
    const a = parseQuickAdd('reunião sexta 14h #trabalho', PT);
    const b = parseQuickAdd('reunião sexta 14h #trabalho', { now: new Date(NOW), language: 'pt-BR' });
    expect(a).toEqual(b);
  });

  it('mudar o now muda "amanhã" (e nada mais)', () => {
    const later = new Date(2026, 11, 31, 23, 59);
    expect(parseQuickAdd('x amanhã', { now: later, language: 'pt-BR' }).date).toBe('2027-01-01');
  });
});

describe('quickAddHint', () => {
  it('devolve exemplo nos dois idiomas e eles se parseiam', () => {
    const ptHint = quickAddHint('pt-BR');
    const enHint = quickAddHint('en');
    expect(ptHint).not.toBe(enHint);
    expect(parseQuickAdd(ptHint, PT)).toMatchObject({ category: 'Work', effort: 2, time: '14:00' });
    expect(parseQuickAdd(enHint, EN)).toMatchObject({ category: 'Work', effort: 2, time: '14:00' });
  });
});
