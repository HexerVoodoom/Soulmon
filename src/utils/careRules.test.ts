import { describe, it, expect } from 'vitest';
import {
  feedFood, rubHeal, feedsLeft, foodForCompletedTask, completeTask,
  FOOD_LIMIT_PER_HOUR, RUB_HEAL_DAILY_CAP, type CareState, type TaskState,
} from './careRules';
import { FORM_REQUIREMENTS, getMaxEnergyForStage } from '../types/progression';

// Estas regras agora rodam nos DOIS apps (celular e desktop). Antes viviam
// dentro do App.tsx e o desktop tinha a sua própria cópia — divergir significa
// o mesmo gesto dando resultados diferentes em cada aparelho.

const HORA = 60 * 60 * 1000;

function estado(over: Partial<CareState> = {}): CareState {
  return {
    healthPoints: 1,
    maxHealthPoints: 3,
    energyPoints: 0,
    evolutionStage: 'rookie', // 4 barras de energia
    foodInventory: { '🍎': 2 },
    virusPoints: 0,
    dataPoints: 0,
    vaccinePoints: 0,
    totalXP: 0,
    attributesSinceLastEvolution: { virus: 0, data: 0, vaccine: 0 },
    ...over,
  };
}

describe('alimentar', () => {
  it('consome a comida, dá +1 energia e os atributos da categoria', () => {
    // 🍎 = Study → { virus: 0, data: 3, vaccine: 1 }
    const r = feedFood(estado(), '🍎', [], 0);
    expect(r.refused).toBeUndefined();
    expect(r.state.foodInventory['🍎']).toBe(1);
    expect(r.state.energyPoints).toBe(1);
    expect(r.state.dataPoints).toBe(3);
    expect(r.state.vaccinePoints).toBe(1);
    expect(r.state.attributesSinceLastEvolution).toEqual({ virus: 0, data: 3, vaccine: 1 });
  });

  it('remove a chave do inventário quando acaba', () => {
    const r = feedFood(estado({ foodInventory: { '🍎': 1 } }), '🍎', [], 0);
    expect('🍎' in r.state.foodInventory).toBe(false);
  });

  it('recusa sem estoque, sem gastar uma vaga da hora', () => {
    const r = feedFood(estado({ foodInventory: {} }), '🍎', [], 0);
    expect(r.refused).toBe('no-stock');
    expect(r.feedTimes).toEqual([]);
  });

  it(`recusa a partir da ${FOOD_LIMIT_PER_HOUR}ª comida na mesma hora`, () => {
    const cheio = Array.from({ length: FOOD_LIMIT_PER_HOUR }, (_, i) => i * 1000);
    const r = feedFood(estado(), '🍎', cheio, 5000);
    expect(r.refused).toBe('hourly-limit');
    expect(r.state.foodInventory['🍎']).toBe(2); // nada foi consumido
  });

  it('a janela é deslizante: comida de mais de 1h atrás não conta', () => {
    const antigas = Array.from({ length: FOOD_LIMIT_PER_HOUR }, (_, i) => i * 1000);
    const r = feedFood(estado(), '🍎', antigas, HORA + 10_000);
    expect(r.refused).toBeUndefined();
    expect(r.feedTimes).toHaveLength(1); // as velhas foram podadas
  });

  it('mesmo recusando, poda os timestamps velhos', () => {
    // Senão a lista cresceria para sempre no localStorage.
    const agora = 2 * HORA;
    const velhas = [0, 1000];                                    // > 1h atrás
    // Exatamente o teto de comidas da janela, derivado da constante (o literal
    // `5` daqui virou falso quando o teto passou a derivar do requisito máximo
    // da escada — o teste deixava de exercitar a recusa em silêncio).
    const recentes = Array.from({ length: FOOD_LIMIT_PER_HOUR }, (_, i) => agora - (i + 1) * 1000);
    const r = feedFood(estado(), '🍎', [...velhas, ...recentes], agora);
    expect(r.refused).toBe('hourly-limit');
    expect(r.feedTimes).toEqual(recentes);
  });

  it('energia para no número de barras do estágio', () => {
    // rookie exige 4 tarefas → 4 barras.
    const r = feedFood(estado({ energyPoints: 4, foodInventory: { '🍎': 5 } }), '🍎', [], 0);
    expect(r.state.energyPoints).toBe(4);
  });

  it('feedsLeft reflete a janela', () => {
    expect(feedsLeft([], 0)).toBe(FOOD_LIMIT_PER_HOUR);
    expect(feedsLeft([0, 1, 2], 3)).toBe(FOOD_LIMIT_PER_HOUR - 3);
    expect(feedsLeft([0, 1, 2], 2 * HORA)).toBe(FOOD_LIMIT_PER_HOUR);
  });

  // -------------------------------------------------------------------------
  // O que a rodada 7 (mutation testing) achou aqui: os testes acima usam SÓ a
  // 🍎 (Study = { virus: 0, data: 3, vaccine: 1 }). Como o virus dela é ZERO,
  // trocar `state.virusPoints + attrs.virus` por `-` não mudava nada — a coluna
  // virus inteira estava sem guard. E `totalXP` não era afirmado em lugar
  // nenhum: dava para trocar o `+` por `-` e o `* 10` por `* 0` sem um único
  // teste vermelho, num campo que é o progresso visível do jogador.
  // -------------------------------------------------------------------------
  it('soma nas TRÊS colunas de atributo, inclusive virus', () => {
    // 🍭 = Creativity → { virus: 3, data: 1, vaccine: 0 }
    const r = feedFood(estado({ foodInventory: { '🍭': 1 } }), '🍭', [], 0);
    expect(r.refused).toBeUndefined();
    expect(r.state.virusPoints).toBe(3);
    expect(r.state.dataPoints).toBe(1);
    expect(r.state.vaccinePoints).toBe(0);
  });

  it('soma sobre o saldo que já existia (não sobrescreve, não subtrai)', () => {
    const r = feedFood(
      estado({ foodInventory: { '🍭': 1 }, virusPoints: 10, dataPoints: 20, vaccinePoints: 30 }),
      '🍭', [], 0,
    );
    expect(r.state.virusPoints).toBe(13);
    expect(r.state.dataPoints).toBe(21);
    expect(r.state.vaccinePoints).toBe(30);
  });

  it('totalXP cresce 10 por ponto de atributo ganho', () => {
    // 🥩 = Fitness → { virus: 2, data: 1, vaccine: 1 }: as TRÊS colunas são
    // diferentes de zero de propósito. Com uma comida de vaccine 0 (como a 🍭),
    // trocar o `+` por `-` dentro da soma `virus + data + vaccine` dá o mesmo
    // resultado, e o teste passa sem enxergar nada.
    const r = feedFood(estado({ foodInventory: { '🥩': 1 }, totalXP: 100 }), '🥩', [], 0);
    expect(r.state.virusPoints).toBe(2);
    expect(r.state.dataPoints).toBe(1);
    expect(r.state.vaccinePoints).toBe(1);
    expect(r.state.totalXP).toBe(140); // 100 + (2+1+1) × 10
  });

  it('save ANTIGO sem attributesSinceLastEvolution começa do zero', () => {
    // O campo é opcional (`?.` + `?? 0`) porque saves antigos não o têm. Sem
    // este caso, tanto o `?.` quanto o padrão `0` podiam ser trocados à vontade.
    const antigo: any = estado({ foodInventory: { '🍭': 1 } });
    delete antigo.attributesSinceLastEvolution;
    const r = feedFood(antigo, '🍭', [], 0);
    expect(r.state.attributesSinceLastEvolution).toEqual({ virus: 3, data: 1, vaccine: 0 });
  });

  it('acumula em attributesSinceLastEvolution sobre o que já havia', () => {
    const r = feedFood(
      estado({ foodInventory: { '🍭': 1 }, attributesSinceLastEvolution: { virus: 2, data: 5, vaccine: 7 } }),
      '🍭', [], 0,
    );
    expect(r.state.attributesSinceLastEvolution).toEqual({ virus: 5, data: 6, vaccine: 7 });
  });

  it('Guloso põe o ponto extra no atributo que a comida JÁ favorece', () => {
    // O bloco escolhe o topo com Math.max e desempata na ordem virus→data→
    // vaccine. Trocar `Math.max` por `Math.min`, ou os `===` por `!==`, passava
    // batido porque nenhum teste olhava para QUAL coluna recebeu o bônus.
    const guloso = { petPassive: 'guloso' };

    // 🍭 Creativity { 3,1,0 } → topo é virus
    const doce = feedFood(estado({ ...guloso, foodInventory: { '🍭': 1 } }), '🍭', [], 0);
    expect(doce.state.virusPoints).toBe(4);
    expect(doce.state.dataPoints).toBe(1);
    expect(doce.state.vaccinePoints).toBe(0);

    // 🍎 Study { 0,3,1 } → topo é data
    const maca = feedFood(estado({ ...guloso, foodInventory: { '🍎': 1 } }), '🍎', [], 0);
    expect(maca.state.virusPoints).toBe(0);
    expect(maca.state.dataPoints).toBe(4);
    expect(maca.state.vaccinePoints).toBe(1);

    // 🍚 Discipline { 0,1,3 } → topo é vaccine (o ramo `else` final)
    const arroz = feedFood(estado({ ...guloso, foodInventory: { '🍚': 1 } }), '🍚', [], 0);
    expect(arroz.state.virusPoints).toBe(0);
    expect(arroz.state.dataPoints).toBe(1);
    expect(arroz.state.vaccinePoints).toBe(4);
  });

  it('sem o traço Guloso não existe ponto extra', () => {
    const r = feedFood(estado({ foodInventory: { '🍭': 1 } }), '🍭', [], 0);
    expect(r.state.virusPoints).toBe(3);
  });

  it('não mexe em campos fora da fatia de cuidado', () => {
    const comExtras = { ...estado(), perfectDays: 7, gamePoints: 42 };
    const r = feedFood(comExtras, '🍎', [], 0);
    expect(r.state.perfectDays).toBe(7);
    expect(r.state.gamePoints).toBe(42);
  });
});

describe('carinho', () => {
  const HOJE = 'Mon Aug 03 2026';

  it('cura meio coração', () => {
    const r = rubHeal(estado({ healthPoints: 1 }), null, HOJE);
    expect(r.state.healthPoints).toBe(1.5);
    expect(r.record).toEqual({ date: HOJE, healed: 0.5 });
  });

  it(`para no teto de ${RUB_HEAL_DAILY_CAP} coração por dia`, () => {
    const r = rubHeal(estado({ healthPoints: 1 }), { date: HOJE, healed: 1 }, HOJE);
    expect(r.refused).toBe('daily-cap');
    expect(r.state.healthPoints).toBe(1);
  });

  it('o teto reseta no dia seguinte', () => {
    const r = rubHeal(estado({ healthPoints: 1 }), { date: 'Sun Aug 02 2026', healed: 1 }, HOJE);
    expect(r.refused).toBeUndefined();
    expect(r.state.healthPoints).toBe(1.5);
  });

  it('não cura com o HP cheio, e não gasta o carinho do dia', () => {
    const r = rubHeal(estado({ healthPoints: 3, maxHealthPoints: 3 }), null, HOJE);
    expect(r.refused).toBe('already-full');
    expect(r.record.healed).toBe(0);
  });

  it('não passa do HP máximo com meio coração faltando', () => {
    const r = rubHeal(estado({ healthPoints: 2.75, maxHealthPoints: 3 }), null, HOJE);
    expect(r.state.healthPoints).toBe(3);
  });
});

describe('tarefa concluída vira comida', () => {
  it('adiciona a comida da categoria', () => {
    expect(foodForCompletedTask({}, 'Study')).toEqual({ '🍎': 1 });
  });

  it('acumula sobre o que já existe', () => {
    expect(foodForCompletedTask({ '🍎': 2 }, 'Study')).toEqual({ '🍎': 3 });
  });

  it('não dá atributo — atributo vem de alimentar', () => {
    // Guarda a regra da Version B descrita no CLAUDE.md.
    const antes = estado();
    const depois = foodForCompletedTask(antes.foodInventory, 'Study');
    expect(depois).not.toBe(antes.foodInventory);
    expect(antes.dataPoints).toBe(0);
  });
});

describe('concluir tarefa', () => {
  const base = (): TaskState & { perfectDays?: number } => ({
    ...estado({ foodInventory: {} }),
    tasks: [
      { id: 't1', name: 'Estudar', category: 'Study' as const, emoji: '📚' },
      { id: 't2', name: 'Correr', category: 'Fitness' as const, emoji: '🏃' },
    ],
    completedTasks: [] as TaskState['completedTasks'],
    activityStats: {} as TaskState['activityStats'],
  });

  it('tira da lista, grava no histórico e entrega a comida da categoria', () => {
    const r = completeTask(base(), 't1', new Date('2026-08-03T10:00:00Z'))!;
    expect(r.tasks.map(t => t.id)).toEqual(['t2']);
    expect(r.completedTasks).toHaveLength(1);
    expect(r.completedTasks[0]).toMatchObject({ id: 't1', name: 'Estudar', category: 'Study' });
    expect(r.foodInventory).toEqual({ '🍎': 1 }); // Study → maçã
  });

  it('conta na estatística da atividade', () => {
    const r1 = completeTask(base(), 't1')!;
    const comSegunda = { ...r1, tasks: [...r1.tasks, { id: 't3', name: 'Estudar', category: 'Study' as const, emoji: '📚' }] };
    const r2 = completeTask(comSegunda, 't3')!;
    expect(r2.activityStats['task-Estudar-Study'].completionCount).toBe(2);
  });

  it('não dá atributo nem energia — isso vem de alimentar', () => {
    const r = completeTask(base(), 't1')!;
    expect(r.dataPoints).toBe(0);
    expect(r.energyPoints).toBe(0);
    expect(r.totalXP).toBe(0);
  });

  it('devolve null só para tarefa que não está mais na lista', () => {
    expect(completeTask(base(), 'nao-existe')).toBeNull();
    // Tarefa JÁ MARCADA não é recusada: é o fluxo normal do app, que marca no
    // clique e só chama esta função na animação de saída. Ver o bloco de
    // regressão no fim deste arquivo.
    const jaFeita = { ...base(), tasks: [{ id: 't1', name: 'X', category: 'Study' as const, emoji: '📚', completed: true }] };
    expect(completeTask(jaFeita, 't1')).not.toBeNull();
  });

  it('limita o histórico para o save não inchar sem fim', () => {
    const antigos = Array.from({ length: 200 }, (_, i) => ({
      id: `old${i}`, name: 'x', category: 'Study' as const, emoji: '📚', completedAt: '2026-01-01',
    }));
    const r = completeTask({ ...base(), completedTasks: antigos }, 't1')!;
    expect(r.completedTasks).toHaveLength(200);
    expect(r.completedTasks.at(-1)!.id).toBe('t1');   // o novo entrou
    expect(r.completedTasks[0].id).toBe('old1');      // o mais velho saiu
  });

  it('não mexe em campos fora do escopo', () => {
    const comExtras = { ...base(), perfectDays: 5 };
    expect(completeTask(comExtras, 't1')!.perfectDays).toBe(5);
  });
});

describe('completeTask — a tarefa já marcada é o fluxo NORMAL', () => {
  // Regressão: o app marca `completed: true` no clique (para o check aparecer
  // na hora) e só chama completeTask 3s depois. Enquanto a função recusava
  // tarefa já marcada, concluir tarefa não dava comida, não entrava no
  // histórico e não contava na estatística — o laço central de recompensa
  // ficava sem efeito nenhum.
  const marcada = (): TaskState => ({
    healthPoints: 3, maxHealthPoints: 3, energyPoints: 0, evolutionStage: 'rookie',
    foodInventory: {}, virusPoints: 0, dataPoints: 0, vaccinePoints: 0, totalXP: 0,
    attributesSinceLastEvolution: { virus: 0, data: 0, vaccine: 0 },
    tasks: [{ id: 't1', name: 'Estudar', category: 'Study', emoji: '📚', completed: true }],
    completedTasks: [], activityStats: {},
  });

  it('entrega a comida mesmo com a tarefa já marcada', () => {
    const r = completeTask(marcada(), 't1');
    expect(r).not.toBeNull();
    expect(r!.foodInventory).toEqual({ '🍎': 1 });
    expect(r!.completedTasks).toHaveLength(1);
    expect(r!.tasks).toHaveLength(0);
    expect(r!.activityStats['task-Estudar-Study'].completionCount).toBe(1);
  });

  it('chamar duas vezes não duplica — a remoção da lista é que protege', () => {
    const primeira = completeTask(marcada(), 't1')!;
    expect(completeTask(primeira, 't1')).toBeNull();
    expect(primeira.completedTasks).toHaveLength(1);
  });

  it('tarefa inexistente continua sendo "nada a fazer"', () => {
    expect(completeTask(marcada(), 'nao-existe')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 🍎 O TETO DE COMIDA NUNCA PODE FICAR ABAIXO DO QUE O JOGO PEDE NUM DIA
//
// Cenário do jogador que criou este teste: mega (requisito 6) que fecha as 6
// tarefas numa única sessão à noite — o padrão de quem trabalha. Cada conclusão
// rende 1 comida, e energia SÓ enche comendo; energia cheia é condição do dia
// perfeito. Com o teto em 5 ele conseguia dar 5 comidas, a 6ª barra ficava
// esperando a janela de 60 min deslizar e, se ele fechou o dia às 23h10, o dia
// perfeito não acontecia. Ele fez 100% e o jogo disse que não.
//
// Por isso a constante é DERIVADA (`MAX_STAGE_REQUIREMENT`) e não um literal:
// eram dois números que precisavam concordar, mantidos à mão, em arquivos
// diferentes — o footgun 9 do CLAUDE.md.
// ---------------------------------------------------------------------------
describe('teto de comida × requisito do estágio', () => {
  it('o teto por hora nunca é menor que o maior requisito diário da escada', () => {
    // Mensagem nomeando o nível: se a escada mudar e alguém baixar o teto, o
    // erro diz QUAL estágio ficou impossível, não só "5 < 6".
    const abaixo = Object.entries(FORM_REQUIREMENTS)
      .filter(([, req]) => FOOD_LIMIT_PER_HOUR < req.required)
      .map(([nivel, req]) => `${nivel} pede ${req.required}, teto ${FOOD_LIMIT_PER_HOUR}`);
    expect(abaixo).toEqual([]);
  });

  it('mega que fecha as 6 tarefas numa sessão só consegue encher a energia', () => {
    const agora = Date.now();
    let st = estado({
      evolutionStage: 'mega-data',           // 6 barras de energia
      energyPoints: 0,
      foodInventory: { '🍎': FORM_REQUIREMENTS.mega.required },
    });
    let times: number[] = [];
    for (let i = 0; i < FORM_REQUIREMENTS.mega.required; i++) {
      // Tudo dentro do MESMO minuto: uma sessão noturna, nada de esperar a hora.
      const r = feedFood(st, '🍎', times, agora + i * 1000);
      expect(`comida ${i + 1}: ${r.refused ?? 'aceita'}`).toBe(`comida ${i + 1}: aceita`);
      st = r.state;
      times = r.feedTimes;
    }
    expect(st.energyPoints).toBe(getMaxEnergyForStage('mega-data'));
  });

  it('AUTOVERIFICAÇÃO: o teto continua existindo — a comida seguinte é recusada', () => {
    // O limite protege contra farm de atributo. Ele só parou de barrar o
    // próprio dia do jogador; não sumiu.
    const agora = Date.now();
    const cheio = Array.from({ length: FOOD_LIMIT_PER_HOUR }, (_, i) => agora - i * 1000);
    const r = feedFood(estado({ foodInventory: { '🍎': 3 } }), '🍎', cheio, agora);
    expect(r.refused).toBe('hourly-limit');
    expect(feedsLeft(cheio, agora)).toBe(0);
  });
});
