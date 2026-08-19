import { describe, it, expect } from 'vitest';
import {
  DEFAULT_STEP_GOAL,
  stepsDayKey,
  stepsDeltaFrom,
  updateStepBaseline,
  stepsGoalProgress,
  stepsConsentCopy,
  isStepsAvailable,
  hasStepsPermission,
  requestStepsPermission,
  readStepsToday,
  type StepsRecord,
} from './steps';

const DAY = (n: number) => new Date(2026, 7, n).toDateString();

describe('stepsDeltaFrom — leitura crua → passos novos', () => {
  it('caminhada normal é a diferença contra a última leitura', () => {
    expect(stepsDeltaFrom(1000, 1500)).toBe(500);
  });

  it('leitura igual à anterior não acrescenta nada', () => {
    expect(stepsDeltaFrom(1000, 1000)).toBe(0);
  });

  it('REBOOT: leitura menor que o baseline vale o próprio acumulado novo', () => {
    // o aparelho reiniciou (ou a sessão do plugin recomeçou): os 120 passos
    // lidos são TODOS novos, e não -8880.
    expect(stepsDeltaFrom(9000, 120)).toBe(120);
  });

  it('reboot com leitura zerada não acrescenta nem tira nada', () => {
    expect(stepsDeltaFrom(9000, 0)).toBe(0);
  });

  it('NUNCA devolve negativo, em nenhuma combinação', () => {
    const values = [0, 1, 7, 999, 12345, -5, Number.NaN, Number.POSITIVE_INFINITY];
    for (const b of values) {
      for (const r of values) {
        expect(stepsDeltaFrom(b as number, r as number)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('entrada inválida vira 0 em vez de contaminar o total', () => {
    expect(stepsDeltaFrom(Number.NaN, 500)).toBe(500);
    expect(stepsDeltaFrom(100, Number.NaN)).toBe(0);
    expect(stepsDeltaFrom(100, -50)).toBe(0);
  });

  it('trunca leitura fracionada (o contador é inteiro)', () => {
    expect(stepsDeltaFrom(100, 150.9)).toBe(50);
  });
});

describe('updateStepBaseline — baseline do dia', () => {
  it('sem registro nenhum ancora o baseline e começa o dia em zero', () => {
    const rec = updateStepBaseline(undefined, 4321, DAY(10));
    expect(rec).toEqual({ date: DAY(10), baseline: 4321, today: 0 });
  });

  it('null é tratado como ausência de registro', () => {
    expect(updateStepBaseline(null, 10, DAY(10)).today).toBe(0);
  });

  it('leituras seguidas no mesmo dia acumulam', () => {
    let rec = updateStepBaseline(undefined, 1000, DAY(10));
    rec = updateStepBaseline(rec, 1400, DAY(10));
    rec = updateStepBaseline(rec, 2000, DAY(10));
    expect(rec.today).toBe(1000);
    expect(rec.baseline).toBe(2000);
  });

  it('REBOOT no meio do dia preserva o que já tinha sido andado', () => {
    let rec = updateStepBaseline(undefined, 5000, DAY(10));
    rec = updateStepBaseline(rec, 5800, DAY(10)); // +800
    expect(rec.today).toBe(800);
    // aparelho reinicia: o contador volta a contar do zero
    rec = updateStepBaseline(rec, 0, DAY(10));
    expect(rec.today).toBe(800); // não perdeu, não ganhou
    expect(rec.baseline).toBe(0);
    rec = updateStepBaseline(rec, 300, DAY(10)); // +300 depois do reboot
    expect(rec.today).toBe(1100);
  });

  it('reboot detectado sem passar por uma leitura 0 também soma certo', () => {
    let rec = updateStepBaseline(undefined, 9000, DAY(10));
    rec = updateStepBaseline(rec, 9500, DAY(10)); // +500
    rec = updateStepBaseline(rec, 42, DAY(10));   // reboot, já com 42 passos
    expect(rec.today).toBe(542);
  });

  it('VIRADA DE DIA zera o total e reancora, sem herdar passo de ontem', () => {
    let rec = updateStepBaseline(undefined, 1000, DAY(10));
    rec = updateStepBaseline(rec, 8000, DAY(10));
    expect(rec.today).toBe(7000);

    const hoje = updateStepBaseline(rec, 8200, DAY(11));
    expect(hoje.date).toBe(DAY(11));
    expect(hoje.today).toBe(0);
    expect(hoje.baseline).toBe(8200);

    // e o dia novo continua contando normalmente a partir dali
    expect(updateStepBaseline(hoje, 8500, DAY(11)).today).toBe(300);
  });

  it('virada de dia COM reboot junto também começa em zero', () => {
    const ontem: StepsRecord = { date: DAY(10), baseline: 12000, today: 9000 };
    const rec = updateStepBaseline(ontem, 15, DAY(11));
    expect(rec).toEqual({ date: DAY(11), baseline: 15, today: 0 });
  });

  it('o total do dia NUNCA é negativo, nem partindo de registro corrompido', () => {
    const podre = { date: DAY(10), baseline: -1, today: -999 } as StepsRecord;
    const rec = updateStepBaseline(podre, 50, DAY(10));
    expect(rec.today).toBeGreaterThanOrEqual(0);
  });

  it('é imutável — não altera o registro recebido', () => {
    const antes: StepsRecord = { date: DAY(10), baseline: 100, today: 40 };
    updateStepBaseline(antes, 900, DAY(10));
    expect(antes).toEqual({ date: DAY(10), baseline: 100, today: 40 });
  });

  it('dentro do mesmo dia o total só cresce (fuzz de leituras caóticas)', () => {
    let rec = updateStepBaseline(undefined, 0, DAY(10));
    let previous = rec.today;
    const leituras = [10, 50, 49, 300, 0, 5, 4, 4, 900, 12, 1200];
    for (const raw of leituras) {
      rec = updateStepBaseline(rec, raw, DAY(10));
      expect(rec.today).toBeGreaterThanOrEqual(previous);
      previous = rec.today;
    }
  });

  it('stepsDayKey usa a convenção de dayKey do repo', () => {
    expect(stepsDayKey(new Date(2026, 7, 10, 23, 59))).toBe(DAY(10));
  });
});

describe('stepsGoalProgress', () => {
  it('meta padrão são 7000 passos', () => {
    expect(DEFAULT_STEP_GOAL).toBe(7000);
  });

  it('progresso é a razão simples até a meta', () => {
    expect(stepsGoalProgress(3500, 7000)).toBe(0.5);
    expect(stepsGoalProgress(7000, 7000)).toBe(1);
  });

  it('usa a meta padrão quando nenhuma é passada', () => {
    expect(stepsGoalProgress(DEFAULT_STEP_GOAL)).toBe(1);
  });

  it('nunca passa de 1 nem cai abaixo de 0', () => {
    expect(stepsGoalProgress(999999, 7000)).toBe(1);
    expect(stepsGoalProgress(-100, 7000)).toBe(0);
    expect(stepsGoalProgress(Number.NaN, 7000)).toBe(0);
  });

  it('meta zerada ou inválida devolve 0, e não 100% por divisão por zero', () => {
    expect(stepsGoalProgress(500, 0)).toBe(0);
    expect(stepsGoalProgress(500, -1)).toBe(0);
    expect(stepsGoalProgress(500, Number.NaN)).toBe(0);
  });
});

describe('consentimento', () => {
  it('existe nos dois idiomas e nenhum campo vem vazio', () => {
    for (const lang of ['en-US', 'pt-BR'] as const) {
      const copy = stepsConsentCopy(lang);
      for (const value of Object.values(copy)) {
        expect(typeof value).toBe('string');
        expect(value.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('os textos são de fato diferentes entre EN e PT-BR', () => {
    expect(stepsConsentCopy('pt-BR').title).not.toBe(stepsConsentCopy('en-US').title);
  });

  it('deixa claro que passos não pontuam sozinhos (regra de produto)', () => {
    expect(stepsConsentCopy('pt-BR').why.toLowerCase()).toContain('nunca valem ponto sozinhos');
    expect(stepsConsentCopy('en-US').why.toLowerCase()).toContain('never score on their own');
  });

  it('declara que só o total do dia é guardado', () => {
    expect(stepsConsentCopy('pt-BR').privacy.toLowerCase()).toContain('total do dia');
    expect(stepsConsentCopy('en-US').privacy.toLowerCase()).toContain('daily total');
  });
});

describe('degradação graciosa na web (sem plugin, sem sensor)', () => {
  // Em jsdom `Capacitor.isNativePlatform()` é false, então o import dinâmico do
  // plugin nunca acontece — é exatamente o caminho da PWA. Não testamos o
  // plugin em si, só a promessa de que a ausência dele não quebra nada.
  it('isStepsAvailable responde false', async () => {
    await expect(isStepsAvailable()).resolves.toBe(false);
  });

  it('permissão nunca é concedida nem pedida', async () => {
    await expect(hasStepsPermission()).resolves.toBe(false);
    await expect(requestStepsPermission()).resolves.toBe(false);
  });

  it('readStepsToday devolve null — e null NÃO é zero', async () => {
    const anterior: StepsRecord = { date: DAY(10), baseline: 100, today: 4200 };
    await expect(readStepsToday(new Date(2026, 7, 10, 12), anterior)).resolves.toBeNull();
    // o chamador mantém o registro que tinha: nada foi apagado
    expect(anterior.today).toBe(4200);
  });
});
