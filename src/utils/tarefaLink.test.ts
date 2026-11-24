import { describe, it, expect } from 'vitest';
import {
  atividadesParaAutoCheck, registrarAuto, jaFezAuto, sanitizeTarefaAuto, progressoDePassos, passosLinha, irLaLabel,
  recursoDaAtividade, gatilhoDoRecurso, autoTagText, autoTagAria, chaveAuto,
} from './tarefaLink';
import { stepsDayKey } from './steps';
import { playerDayKey } from './playerDay';

const NOW = new Date(2026, 10, 15, 10, 0, 0); // domingo 15/11/2026 10h
const DIA = '2026-11-15';
const hab = (over: Record<string, unknown> = {}) => ({ id: 'h1', name: 'Caminhar', catalogId: 'corpo-caminhar', weekDays: [0, 1, 2, 3, 4, 5, 6], completedToday: false, ...over });
const steps = (today: number, date = stepsDayKey(NOW)) => ({ date, baseline: today, today });
const passos = (today: number, over: Record<string, unknown> = {}) => ({ consent: 'granted', steps: steps(today), stepGoal: 7000, ...over }) as { consent: string | undefined; steps: ReturnType<typeof steps> | undefined; stepGoal: number | undefined };

describe('check automático por passos (A3, A4, A9, A11)', () => {
  it('meta batida + permissão + hábito adotado: marca', () => {
    expect(atividadesParaAutoCheck('steps', { activities: [hab()], now: NOW, passos: passos(7000) })).toEqual(['h1']);
  });
  it('A4: abaixo da meta NUNCA marca (só mostra o progresso)', () => {
    expect(atividadesParaAutoCheck('steps', { activities: [hab()], now: NOW, passos: passos(6999) })).toEqual([]);
    expect(progressoDePassos({ steps: steps(6999), stepGoal: 7000, consent: 'granted', now: NOW })).toEqual({ hoje: 6999, meta: 7000 });
  });
  it('A3: sem permissão ou sem registro nada muda (o check segue manual)', () => {
    for (const consent of ['declined', undefined, 'pending']) {
      expect(atividadesParaAutoCheck('steps', { activities: [hab()], now: NOW, passos: passos(20000, { consent }) })).toEqual([]);
    }
    expect(atividadesParaAutoCheck('steps', { activities: [hab()], now: NOW })).toEqual([]);
    expect(progressoDePassos({ steps: undefined, stepGoal: 7000, consent: 'declined', now: NOW })).toBeNull();
  });
  it('A9: passos de OUTRO dia (a noite anterior) não marcam o dia de hoje, nem na virada da meia-noite', () => {
    const ontem = new Date(2026, 10, 14, 23, 50);
    const p = { consent: 'granted', steps: steps(12000, stepsDayKey(ontem)), stepGoal: 7000 };
    expect(atividadesParaAutoCheck('steps', { activities: [hab()], now: NOW, passos: p })).toEqual([]);
    expect(atividadesParaAutoCheck('steps', { activities: [hab()], now: new Date(2026, 10, 15, 0, 5), passos: p })).toEqual([]);
  });
  it('Q3: a meta é a das Configurações, não os minutos do catálogo; sem meta salva, 7.000', () => {
    expect(atividadesParaAutoCheck('steps', { activities: [hab()], now: NOW, passos: passos(5000, { stepGoal: 5000 }) })).toEqual(['h1']);
    expect(atividadesParaAutoCheck('steps', { activities: [hab()], now: NOW, passos: passos(5000, { stepGoal: undefined }) })).toEqual([]);
    expect(atividadesParaAutoCheck('steps', { activities: [hab()], now: NOW, passos: passos(7000, { stepGoal: undefined }) })).toEqual(['h1']);
  });
  it('Q1: só tarefa ADOTADA com o recurso (sem catalogId ou de outro recurso não marca)', () => {
    const lista = [hab({ catalogId: undefined }), hab({ id: 'h2', catalogId: 'mente-gratidao' }), hab({ id: 'h3', catalogId: 'sono-horario-fixo' })];
    expect(atividadesParaAutoCheck('steps', { activities: lista, now: NOW, passos: passos(9000) })).toEqual([]);
  });
  it('A10: já concluída hoje não entra (o módulo só devolve quem marcar; nada desmarca)', () => {
    expect(atividadesParaAutoCheck('steps', { activities: [hab({ completedToday: true, lastCompletedDate: NOW.toDateString() })], now: NOW, passos: passos(9000) })).toEqual([]);
    expect(atividadesParaAutoCheck('steps', { activities: [hab({ completedToday: true, lastCompletedDate: new Date(2026, 10, 14).toDateString() })], now: NOW, passos: passos(9000) })).toEqual(['h1']);
  });
  it('hábito que não é devido hoje não é marcado', () => {
    expect(atividadesParaAutoCheck('steps', { activities: [hab({ weekDays: [1, 2], schedule: { kind: 'weekdays', days: [1, 2] } })], now: NOW, passos: passos(9000) })).toEqual([]); // domingo = 0
  });
});

describe('idempotência (A8)', () => {
  it('a chave <dia>|<id> impede o segundo disparo no mesmo dia, e vale por hábito', () => {
    const lista = registrarAuto(undefined, DIA, 'h1');
    expect(lista).toEqual([chaveAuto(DIA, 'h1')]);
    expect(atividadesParaAutoCheck('steps', { activities: [hab(), hab({ id: 'h2' })], now: NOW, passos: passos(9000), tarefaAuto: lista })).toEqual(['h2']);
    expect(jaFezAuto(lista, DIA, 'h1')).toBe(true);
  });
  it('registrar de novo devolve o MESMO array; outro dia solta as chaves velhas (não cresce)', () => {
    const l = registrarAuto(undefined, DIA, 'h1');
    expect(registrarAuto(l, DIA, 'h1')).toBe(l);
    expect(registrarAuto(l, '2026-11-16', 'h1')).toEqual(['2026-11-16|h1']);
  });
  it('a chave de ontem não impede o check de hoje', () => {
    expect(atividadesParaAutoCheck('steps', { activities: [hab()], now: NOW, passos: passos(9000), tarefaAuto: ['2026-11-14|h1'] })).toEqual(['h1']);
  });
  it('leitura tolerante do save', () => {
    expect(sanitizeTarefaAuto('x')).toBeUndefined();
    expect(sanitizeTarefaAuto(['2026-11-15|h1', 'lixo', 3, null])).toEqual(['2026-11-15|h1']);
  });
});

describe('caderno e foco: o evento real, só para hábito adotado (A5, A6)', () => {
  const cad = hab({ id: 'c1', catalogId: 'mente-gratidao', name: 'Gratidão' });
  const foco = hab({ id: 'f1', catalogId: 'foco-bloco-25min', name: 'Foco' });
  it('registro guardado marca o hábito de journaling adotado, uma vez por dia', () => {
    expect(atividadesParaAutoCheck('caderno', { activities: [cad, foco, hab()], now: NOW })).toEqual(['c1']);
    expect(atividadesParaAutoCheck('caderno', { activities: [cad], now: NOW, tarefaAuto: [chaveAuto(DIA, 'c1')] })).toEqual([]);
  });
  it('escrita livre também é journaling', () => {
    expect(atividadesParaAutoCheck('caderno', { activities: [hab({ id: 'e1', catalogId: 'criatividade-escrita-livre' })], now: NOW })).toEqual(['e1']);
  });
  it('Q5: sessão de foco só marca o hábito que ela USOU (somenteIds)', () => {
    const outro = hab({ id: 'f2', catalogId: 'foco-uma-tarefa-por-vez' });
    expect(atividadesParaAutoCheck('foco', { activities: [foco, outro], now: NOW, somenteIds: ['f1'] })).toEqual(['f1']);
    expect(atividadesParaAutoCheck('foco', { activities: [foco, outro], now: NOW, somenteIds: [] })).toEqual([]);
  });
  it('gatilho de passos não marca journaling', () => {
    expect(atividadesParaAutoCheck('steps', { activities: [cad], now: NOW, passos: passos(9000) })).toEqual([]);
  });
});

describe('recurso e textos (A2, A12)', () => {
  it('mapeia catalogId → recurso → gatilho; sono e água não têm', () => {
    expect(recursoDaAtividade({ catalogId: 'corpo-caminhar' })).toBe('steps');
    expect(gatilhoDoRecurso(recursoDaAtividade({ catalogId: 'mente-gratidao' }))).toBe('caderno');
    expect(gatilhoDoRecurso(recursoDaAtividade({ catalogId: 'foco-bloco-25min' }))).toBe('foco');
    for (const id of ['sono-horario-fixo', 'sono-telas-fora', 'sono-preparar-quarto', 'corpo-beber-agua', undefined]) expect(recursoDaAtividade({ catalogId: id })).toBeUndefined();
  });
  it('linha de passos e links em PT-BR e EN', () => {
    expect(passosLinha(3400, 7000, 'pt-BR').replace(/\s/g, ' ')).toMatch(/^3\.?400 de 7\.?000 passos$/);
    expect(passosLinha(3400, 7000, 'en-US')).toBe('3,400 of 7,000 steps');
    expect(irLaLabel('building:forja.caderno', 'pt-BR')).toBe('Ir ao Caderno');
    expect(irLaLabel('building:forja.caderno', 'en-US')).toBe('Go to the Journal');
    expect(irLaLabel('steps', 'pt-BR')).toBeNull();
  });
  it('tag e anúncio de leitor de tela', () => {
    expect(autoTagText('pt-BR')).toBe('Tarefa');
    expect(autoTagText('en-US')).toBe('Task');
    expect(autoTagText('pt-BR', 'Escrever no jornal de gratidão')).toBe('Escrever no jornal de gratidão');
    expect(autoTagText('en-US', '  ')).toBe('Task');
    expect(autoTagAria('Caminhar', 'pt-BR')).toBe('Tarefa concluída automaticamente: Caminhar');
    expect(autoTagAria('Walk', 'en-US')).toBe('Task completed automatically: Walk');
  });
});

describe('BUG-04: "feita hoje" e a chave de idempotência usam o MESMO dia (o do jogador)', () => {
  const HORA = 3_600_000;
  it('concluída no dia do JOGADOR (âncora ≠ fuso do aparelho) não é marcada de novo', () => {
    for (const offsetMs of [14 * HORA, -12 * HORA]) {
      const tz = { offsetMs };
      const feita = hab({ completedToday: true, lastCompletedDate: playerDayKey(NOW, tz) });
      expect(atividadesParaAutoCheck('steps', { activities: [feita], now: NOW, tz, passos: passos(9000) }), 'offset ' + offsetMs).toEqual([]);
    }
  });
  it('conclusão do dia do APARELHO que já é "ontem" para o jogador volta a valer hoje', () => {
    for (const offsetMs of [14 * HORA, -12 * HORA]) {
      const tz = { offsetMs };
      if (playerDayKey(NOW, tz) === NOW.toDateString()) continue;
      const velha = hab({ completedToday: true, lastCompletedDate: NOW.toDateString() });
      expect(atividadesParaAutoCheck('steps', { activities: [velha], now: NOW, tz, passos: passos(9000) }), 'offset ' + offsetMs).toEqual(['h1']);
    }
  });
});

describe("hábito refletir (proposito-refletir-valores) vinculado ao Jornal", () => {
  const refletir = hab({ id: "r1", name: "Refletir sobre o que importa hoje", catalogId: "proposito-refletir-valores" });
  it("tem recurso do Caderno, gatilho caderno e setinha PT/EN", () => {
    expect(gatilhoDoRecurso(recursoDaAtividade(refletir))).toBe("caderno");
    expect(irLaLabel(recursoDaAtividade(refletir), "pt-BR")).toBe("Ir ao Caderno");
    expect(irLaLabel(recursoDaAtividade(refletir), "en-US")).toBe("Go to the Journal");
  });
  it("salvar 2x no dia marca 1x (idempotente pela chave dia|id)", () => {
    const ids1 = atividadesParaAutoCheck("caderno", { activities: [refletir], now: NOW });
    expect(ids1).toEqual(["r1"]);
    const lista = registrarAuto(undefined, DIA, "r1");
    expect(atividadesParaAutoCheck("caderno", { activities: [refletir], now: NOW, tarefaAuto: lista })).toEqual([]);
    expect(registrarAuto(lista, DIA, "r1")).toBe(lista);
  });
});
