/**
 * LIMIARES do padrão de cuidado — `src/utils/carePattern.ts`.
 *
 * `carePattern.test.ts` já existe e testa bem o SENTIDO da regra (nenhum padrão
 * é melhor, o atributo manda, o padrão só desempata). O que ele nunca fez foi
 * chegar perto de um limiar: os casos são 10 dias seguidos (spread 0,71 /
 * concentração 0,10) e 12 tarefas num dia só (concentração 1,00). Ou seja, uma
 * TABELA DE LIMIARES sem um único teste de limiar — mover `>= 0.5` para
 * `> 0.5`, ou `<= 0.4` para `< 0.4`, não fazia nenhum teste ficar vermelho.
 *
 * Os quatro limiares que decidem o galho de evolução:
 *
 *     confiança   total       >= 5
 *     constante   spread      >= 0.5   E  concentração <= 0.4
 *     explosivo   concentração >= 0.5  OU spread       <= 0.25
 *
 * onde `spread = diasAtivos / janela` e `concentração = dia mais cheio / total`.
 *
 * Cada caso abaixo é um PAR: exatamente em cima do limiar, e um passo fora dele.
 * Os números são escritos à mão de propósito — comparar com a própria constante
 * seria a tautologia que deixou `WEEKLY_RELIEF_HEARTS` valer zero por três
 * rodadas sem ninguém ver.
 */
import { describe, it, expect } from 'vitest';
import { computeCarePattern, resolveBranch, CARE_WINDOW_DAYS } from './carePattern';

const NOW = new Date('2026-08-15T12:00:00');

/**
 * Monta um histórico a partir de "quantas conclusões em cada dia ativo".
 * `[4, 1, 1]` = 3 dias ativos, 6 conclusões, o dia mais cheio com 4.
 * Cada dia ativo é um dia de calendário distinto (d-1, d-2, …).
 */
function historico(porDia: number[]) {
  const out: Array<{ completedAt: string }> = [];
  porDia.forEach((qtd, dia) => {
    for (let i = 0; i < qtd; i++) {
      const d = new Date(NOW);
      d.setDate(d.getDate() - (dia + 1));
      d.setHours(9 + i, 0, 0, 0); // mesmo dia, horas diferentes
      out.push({ completedAt: d.toISOString() });
    }
  });
  return out;
}

const ler = (porDia: number[], janela = CARE_WINDOW_DAYS) =>
  computeCarePattern(historico(porDia), NOW, janela);

// ══════════════════════════════════════════════════ a janela é de 14 dias ══

describe('a janela vale 14 dias — e o teste sabe qual é o número', () => {
  it('CARE_WINDOW_DAYS é 14', () => {
    expect(CARE_WINDOW_DAYS).toBe(14);
  });
});

// ═════════════════════════════════════════════ limiar de CONFIANÇA (5) ══

describe('limiar de confiança: 5 conclusões', () => {
  // Abaixo de 5 a leitura não desempata galho nenhum — é a diferença entre o
  // app dizer "seu ritmo escolheu este caminho" e o app chutar.
  it('4 conclusões NÃO são confiáveis (e o padrão cai em equilibrado)', () => {
    const r = ler([4]); // tudo num dia só: pareceria explosivo
    expect(r.total).toBe(4);
    expect(r.confident).toBe(false);
    expect(r.pattern.id).toBe('equilibrado');
  });

  it('5 conclusões JÁ são confiáveis (o limiar é inclusivo)', () => {
    const r = ler([5]);
    expect(r.total).toBe(5);
    expect(r.confident).toBe(true);
    // agora sim a concentração 1,0 é lida
    expect(r.pattern.id).toBe('explosivo');
  });
});

// ═══════════════════════════════════════════ limiar de CONSTANTE: spread ══

describe('constante — spread >= 0.5 (7 dias ativos em 14)', () => {
  // Concentração mantida baixa e IGUAL nos dois casos, para isolar o spread.
  it('7 dias ativos (spread 0.50, em cima do limiar) → constante', () => {
    const r = ler([2, 2, 2, 2, 2, 2, 2]);
    expect(r.activeDays).toBe(7);
    expect(r.total).toBe(14);
    expect(r.concentration).toBeCloseTo(2 / 14, 10); // 0.143 — bem abaixo de 0.4
    expect(r.pattern.id).toBe('constante');
  });

  it('6 dias ativos (spread 0.43, um passo abaixo) → NÃO é constante', () => {
    const r = ler([2, 2, 2, 2, 2, 2]);
    expect(r.activeDays).toBe(6);
    expect(r.concentration).toBeCloseTo(2 / 12, 10); // 0.167 — mesma faixa
    expect(r.pattern.id).toBe('equilibrado');
  });
});

describe('constante — concentração <= 0.4 (dia mais cheio)', () => {
  // Spread mantido em 7/14 = 0.5 nos dois casos, para isolar a concentração.
  it('concentração exatamente 0.40 ainda é constante (limiar inclusivo)', () => {
    const r = ler([4, 1, 1, 1, 1, 1, 1]);
    expect(r.activeDays).toBe(7);
    expect(r.total).toBe(10);
    expect(r.concentration).toBe(0.4); // 4/10, exato
    expect(r.pattern.id).toBe('constante');
  });

  it('concentração 0.45 (um passo acima) já NÃO é constante', () => {
    const r = ler([5, 1, 1, 1, 1, 1, 1]);
    expect(r.activeDays).toBe(7);
    expect(r.total).toBe(11);
    expect(r.concentration).toBeCloseTo(5 / 11, 10); // 0.4545
    // acima de 0.4 (não é constante) mas abaixo de 0.5 (não é explosivo)
    expect(r.pattern.id).toBe('equilibrado');
  });
});

// ═══════════════════════════════════════════ limiar de EXPLOSIVO ══

describe('explosivo — concentração >= 0.5', () => {
  it('concentração exatamente 0.50 já é explosivo (limiar inclusivo)', () => {
    const r = ler([3, 1, 1, 1]);
    expect(r.total).toBe(6);
    expect(r.activeDays).toBe(4);
    expect(r.concentration).toBe(0.5); // 3/6, exato
    // spread = 4/14 = 0.286, ou seja, NÃO entrou por spread — foi a concentração
    expect(r.pattern.id).toBe('explosivo');
  });

  it('concentração 0.43 (um passo abaixo) NÃO é explosivo', () => {
    const r = ler([3, 1, 1, 1, 1]);
    expect(r.total).toBe(7);
    expect(r.activeDays).toBe(5);
    expect(r.concentration).toBeCloseTo(3 / 7, 10); // 0.4286
    expect(r.pattern.id).toBe('equilibrado');
  });
});

describe('explosivo — spread <= 0.25 (poucos dias, esforço concentrado)', () => {
  // 0.25 exato exige janela de 16 (4/16); com a janela padrão de 14 o valor
  // exato cairia em 3,5 dias, que não existe. A função aceita `windowDays`
  // justamente para isso.
  it('spread exatamente 0.25 já é explosivo (limiar inclusivo)', () => {
    const r = ler([2, 2, 2, 2], 16);
    expect(r.activeDays).toBe(4);
    expect(r.total).toBe(8);
    expect(r.concentration).toBe(0.25); // 2/8 — bem abaixo de 0.5
    // Só pode ter entrado pelo spread: 4/16 = 0.25.
    expect(r.pattern.id).toBe('explosivo');
  });

  it('spread 0.31 (um passo acima) NÃO é explosivo', () => {
    const r = ler([2, 2, 2, 2, 2], 16);
    expect(r.activeDays).toBe(5);
    expect(r.concentration).toBe(0.2);
    expect(r.pattern.id).toBe('equilibrado');
  });

  it('3 dias ativos na janela padrão de 14 (spread 0.21) é explosivo', () => {
    const r = ler([2, 2, 2]);
    expect(r.activeDays).toBe(3);
    expect(r.concentration).toBeCloseTo(1 / 3, 10); // 0.333, abaixo de 0.5
    expect(r.pattern.id).toBe('explosivo');
  });

  it('4 dias ativos na janela padrão (spread 0.29) NÃO é explosivo', () => {
    const r = ler([2, 2, 2, 2]);
    expect(r.activeDays).toBe(4);
    expect(r.concentration).toBe(0.25);
    expect(r.pattern.id).toBe('equilibrado');
  });
});

// ══════════════════════════════════ a ORDEM das regras (else if) ══

describe('constante ganha de explosivo quando as duas condições batem', () => {
  it('spread alto e concentração baixa não vira explosivo por acidente', () => {
    // 7 dias ativos com [4,1,1,1,1,1,1]: constante (spread 0.5, conc 0.4).
    // Nenhuma condição de explosivo bate aqui — é a checagem de que o `else if`
    // não é alcançado por engano.
    expect(ler([4, 1, 1, 1, 1, 1, 1]).pattern.id).toBe('constante');
  });
});

// ══════════════════════════════════════ as BORDAS da janela de tempo ══

describe('a borda da janela: o que entra e o que fica de fora', () => {
  const em = (ms: number) => ({ completedAt: new Date(ms).toISOString() });
  const agora = NOW.getTime();
  const corte = agora - CARE_WINDOW_DAYS * 86400000;

  it('conclusão EXATAMENTE no corte entra na conta', () => {
    // `t < cutoff` descarta; no corte exato, não descarta.
    expect(computeCarePattern([em(corte)], NOW).total).toBe(1);
  });

  it('1ms antes do corte fica de fora', () => {
    expect(computeCarePattern([em(corte - 1)], NOW).total).toBe(0);
  });

  it('conclusão EXATAMENTE agora entra na conta', () => {
    expect(computeCarePattern([em(agora)], NOW).total).toBe(1);
  });

  it('1ms no futuro fica de fora (relógio adiantado não inventa histórico)', () => {
    expect(computeCarePattern([em(agora + 1)], NOW).total).toBe(0);
  });

  it('a janela tem 14 dias de 86.400.000ms — 13 dias entra, 15 não', () => {
    expect(computeCarePattern([em(agora - 13 * 86400000)], NOW).total).toBe(1);
    expect(computeCarePattern([em(agora - 15 * 86400000)], NOW).total).toBe(0);
  });
});

// ═══════════════════════════ resolveBranch — atributo inválido vale ZERO ══

describe('atributo não-finito conta como 0, não como 1', () => {
  const fraco = computeCarePattern([], NOW); // leitura não confiável

  it('NaN/ausente não pode virar um ponto de brinde', () => {
    // Se o fallback fosse 1, um `powerPoints` ausente no save daria a vitória
    // ao poder e mudaria o GALHO DE EVOLUÇÃO do jogador por causa de um campo
    // que nunca existiu. Achado irmão do fuzzing da rodada 6.
    expect(resolveBranch({ power: NaN, harmony: 0, benevolence: 0 }, fraco, 'harmony')).toBe('harmony');
    expect(resolveBranch({ harmony: 0, benevolence: 0 } as never, fraco, 'harmony')).toBe('harmony');
    expect(resolveBranch({ power: Infinity, harmony: 0, benevolence: 0 } as never, fraco, 'benevolence'))
      .toBe('benevolence');
    expect(resolveBranch({ power: 0, harmony: NaN, benevolence: 0 }, fraco, 'power')).toBe('power');
    expect(resolveBranch({ power: 0, harmony: 0, benevolence: NaN }, fraco, 'power')).toBe('power');
  });

  it('atributo ZERO com os outros NEGATIVOS ainda é "sem progresso"', () => {
    // `max <= 0` (e não `< 0`): um save com pontos negativos — que não deveria
    // existir, mas a função é defensiva — tem max 0 e nenhum progresso real.
    // Com `< 0`, o zero viraria "líder" e escolheria o galho sozinho, passando
    // por cima do ritmo e do galho atual.
    expect(resolveBranch({ power: 0, harmony: -1, benevolence: -1 }, fraco, 'harmony')).toBe('harmony');
    expect(resolveBranch({ power: -3, harmony: 0, benevolence: -2 }, fraco, 'benevolence')).toBe('benevolence');
  });

  it('UM ponto já é suficiente para o atributo mandar', () => {
    // `max <= 0` tem que ser 0 mesmo: com `<= 1`, um único ponto seria ignorado
    // e o desempate por ritmo decidiria uma disputa que não estava empatada.
    expect(resolveBranch({ power: 1, harmony: 0, benevolence: 0 }, fraco, 'harmony')).toBe('power');
    expect(resolveBranch({ power: 0, harmony: 0, benevolence: 1 }, fraco, 'harmony')).toBe('benevolence');
  });
});

// ══════════════════════════════════════════ contagem: dias vs conclusões ══

describe('diasAtivos conta DIAS, não conclusões', () => {
  it('5 conclusões no mesmo dia = 1 dia ativo e concentração 1', () => {
    const r = ler([5]);
    expect(r.activeDays).toBe(1);
    expect(r.total).toBe(5);
    expect(r.concentration).toBe(1);
  });

  it('uma conclusão só dá concentração 1 (o dia mais cheio é o único dia)', () => {
    // `total > 0` precisa ser > 0 mesmo: com `> 1`, um histórico de uma
    // conclusão devolveria concentração 0 — o oposto do que ele é.
    const r = ler([1]);
    expect(r.total).toBe(1);
    expect(r.concentration).toBe(1);
  });

  it('sem histórico, concentração é 0 e não NaN', () => {
    // `total > 0 ? busiest / total : 0` — sem o guard, 0/0 = NaN e a comparação
    // com os limiares passa a ser sempre falsa, em silêncio.
    const r = computeCarePattern([], NOW);
    expect(r.concentration).toBe(0);
    expect(Number.isNaN(r.concentration)).toBe(false);
    expect(r.activeDays).toBe(0);
  });
});
