import { describe, it, expect } from 'vitest';
import {
  concederFundador, registrarDiaComTarefa, concederTodosFundador, temPremioFundador, sanitizeFundadorPremios,
  FUNDADOR_PREMIOS, FUNDADOR_FUNDO_ID, FUNDADOR_MOLDURA_ID, FUNDADOR_RETRATO_ID, FUNDADOR_CRISTAL_ID, type FundadorEstado,
} from './fundador';
import type { GameState } from '../contexts/GameStateContext';
import { applyHabitCompletion } from './habitCompletionPay';
import { applyTaskCompletion } from './taskCompletionPay';

const novo = (): FundadorEstado => ({ evolutionStage: 'rookie', fundadorDias: 0, fundadorPremios: [], ownedBackgrounds: ['bg-room'], ownedFrames: [], ownedFurniture: [] });
const base = (over: Record<string, unknown>) => ({ tasks: [], completedTasks: [], activities: [], activityStats: {}, foodInventory: {}, activityLog: [], totalXP: 40, powerPoints: 10, harmonyPoints: 10, benevolencePoints: 10, habitRhythms: {}, lastResetDate: new Date(2026, 10, 3).toDateString(), fundadorDias: 0, fundadorPremios: [], ownedBackgrounds: ['bg-room'], ownedFrames: [], ownedFurniture: [], ...over }) as unknown as GameState;
const dia = (n: number, h = 12) => new Date(2026, 10, n, h, 0, 0);

describe('Conjunto Fundador — marcos por dias acumulados', () => {
  it('1 dia = Fundo, 2 = Moldura, 3 = Retrato, 5 = Cristal (dias não consecutivos contam)', () => {
    let s = novo();
    s = registrarDiaComTarefa(s, dia(1));
    expect(s.fundadorPremios).toEqual([FUNDADOR_FUNDO_ID]);
    expect(s.ownedBackgrounds).toContain(FUNDADOR_FUNDO_ID);
    s = registrarDiaComTarefa(s, dia(4));
    expect(s.fundadorPremios).toEqual([FUNDADOR_FUNDO_ID, FUNDADOR_MOLDURA_ID]);
    expect(s.ownedFrames).toContain(FUNDADOR_MOLDURA_ID);
    s = registrarDiaComTarefa(s, dia(9));
    expect(temPremioFundador(s, FUNDADOR_RETRATO_ID)).toBe(true);
    expect(s.ownedFurniture).toEqual([]);
    s = registrarDiaComTarefa(s, dia(10));
    expect(s.ownedFurniture).toEqual([]);
    s = registrarDiaComTarefa(s, dia(20));
    expect(s.fundadorDias).toBe(5);
    expect(s.fundadorPremios).toEqual([...FUNDADOR_PREMIOS]);
    expect(s.ownedFurniture).toEqual([FUNDADOR_CRISTAL_ID]);
  });

  it('mesmo dia não soma e devolve o MESMO objeto; dia novo soma', () => {
    const a = registrarDiaComTarefa(novo(), dia(1, 8));
    const b = registrarDiaComTarefa(a, dia(1, 23));
    expect(b).toBe(a);
    expect(registrarDiaComTarefa(a, dia(2, 0)).fundadorDias).toBe(2);
  });

  it('virada à meia-noite do DIA DO JOGADOR (âncora), não do aparelho', () => {
    // âncora UTC-3: 02:30 UTC de 02/11 ainda é 01/11 no jogador; 03:30 UTC já é 02/11.
    const tz = { offsetMs: -3 * 3600_000 };
    const s0 = { ...novo(), playerDayTz: tz } as FundadorEstado;
    const a = registrarDiaComTarefa(s0, new Date(Date.UTC(2026, 10, 1, 20, 0)));
    const b = registrarDiaComTarefa(a, new Date(Date.UTC(2026, 10, 2, 2, 30)));
    expect(b).toBe(a);
    const c = registrarDiaComTarefa(a, new Date(Date.UTC(2026, 10, 2, 3, 30)));
    expect(c.fundadorDias).toBe(2);
  });

  it('degeneração/Rebirth: o histórico fica; a posse perdida é curada e nada é concedido de novo', () => {
    let s = novo();
    for (const d of [1, 2, 3, 4, 5]) s = registrarDiaComTarefa(s, dia(d));
    const perdido = { ...s, ownedFrames: [], ownedBackgrounds: ['bg-room'], ownedFurniture: [] };
    const curado = concederFundador(perdido);
    expect(curado.ownedFrames).toEqual([FUNDADOR_MOLDURA_ID]);
    expect(curado.fundadorPremios).toEqual([...FUNDADOR_PREMIOS]);
    expect(curado.fundadorDias).toBe(5);
    expect(concederFundador(curado)).toBe(curado);
  });
});

describe('Conjunto Fundador — conta existente x nova', () => {
  it('conta EXISTENTE (campo ausente + Soulmon criado) recebe os 4 na carga, uma vez só', () => {
    const antigo: FundadorEstado = { evolutionStage: 'champion', ownedBackgrounds: ['bg-room'], ownedFrames: ['basico'], ownedFurniture: ['x'] };
    const a = concederFundador(antigo);
    expect(a.fundadorPremios).toEqual([...FUNDADOR_PREMIOS]);
    expect(a.ownedBackgrounds).toEqual(['bg-room', FUNDADOR_FUNDO_ID]);
    expect(a.ownedFrames).toEqual(['basico', FUNDADOR_MOLDURA_ID]);
    expect(a.ownedFurniture).toEqual(['x', FUNDADOR_CRISTAL_ID]);
    const b = concederFundador(a);
    expect(b).toBe(a); // 2 cargas = 1 concessão
  });

  it('conta NOVA (já com a lista []) não cai no critério legado', () => {
    const n = novo();
    expect(concederFundador(n)).toBe(n);
  });

  it('save sem Soulmon criado nasce com [] (nunca vira conta existente depois)', () => {
    const vazio: FundadorEstado = {};
    const r = concederFundador(vazio);
    expect(r.fundadorPremios).toEqual([]);
    expect(r.ownedFrames).toBeUndefined();
  });

  it('save antigo sem os campos carrega; lixo é saneado', () => {
    expect(sanitizeFundadorPremios(undefined)).toBeUndefined();
    expect(sanitizeFundadorPremios(['x', FUNDADOR_RETRATO_ID, 3])).toEqual([FUNDADOR_RETRATO_ID]);
  });

  it('concedente dev: os 4 de uma vez, idempotente', () => {
    const a = concederTodosFundador(novo());
    expect(a.fundadorPremios).toEqual([...FUNDADOR_PREMIOS]);
    expect(a.ownedFurniture).toEqual([FUNDADOR_CRISTAL_ID]);
    expect(concederTodosFundador(a)).toBe(a);
  });
});

describe('Conjunto Fundador — ganchos de conclusão', () => {
  it('hábito concluído soma 1 dia; segundo hábito no mesmo dia não', async () => {
    const s0 = base({ activities: [
      { id: 'a1', name: 'A', emoji: '🏃', category: 'corpo', steps: [], weekDays: [0,1,2,3,4,5,6], completedToday: false }, { id: 'a2', name: 'B', emoji: '📖', category: 'aprendizado', steps: [], weekDays: [0,1,2,3,4,5,6], completedToday: false },
    ] });
    const now = new Date(2026, 10, 3, 10);
    const s1 = applyHabitCompletion(s0, 'a1', now);
    expect(s1.fundadorDias).toBe(1);
    expect(s1.ownedBackgrounds).toContain(FUNDADOR_FUNDO_ID);
    const s2 = applyHabitCompletion(s1, 'a2', new Date(2026, 10, 3, 18));
    expect(s2.fundadorDias).toBe(1);
  });

  it('tarefa avulsa concluída soma 1 dia', async () => {
    const s0 = base({ tasks: [{ id: 't1', name: 'T', emoji: '✅', category: 'corpo', completed: false }] });
    const r = applyTaskCompletion(s0, 't1', new Date(2026, 10, 3, 10));
    expect(r.paid).toBe(true);
    expect(r.state.fundadorDias).toBe(1);
    expect(r.state.fundadorPremios).toEqual([FUNDADOR_FUNDO_ID]);
  });
});

describe('Conjunto Fundador — carga do save (hidratarNuvem)', () => {
  it('save ANTIGO sem os campos (com Soulmon): recebe os 4 e uma 2ª carga não muda nada', async () => {
    const { hidratarNuvem } = await import('../contexts/GameStateContext');
    const a = hidratarNuvem({ evolutionStage: 'champion', ownedFrames: [] } as never);
    expect(a.fundadorPremios).toEqual([...FUNDADOR_PREMIOS]);
    expect(a.ownedFrames).toContain(FUNDADOR_MOLDURA_ID);
    expect(a.ownedBackgrounds).toContain(FUNDADOR_FUNDO_ID);
    expect(a.ownedFurniture).toContain(FUNDADOR_CRISTAL_ID);
    const b = hidratarNuvem(JSON.parse(JSON.stringify(a)));
    expect(b.fundadorPremios).toEqual(a.fundadorPremios);
    expect(b.ownedFrames).toEqual(a.ownedFrames);
    expect(b.ownedFurniture).toEqual(a.ownedFurniture);
  });
  it('conta nova (lista [] gravada) NÃO recebe nada na carga; dias e último dia sobrevivem', async () => {
    const { hidratarNuvem } = await import('../contexts/GameStateContext');
    const a = hidratarNuvem({ evolutionStage: 'rookie', fundadorPremios: [], fundadorDias: 1, fundadorUltimoDia: '2026-11-03' } as never);
    expect(a.fundadorPremios).toEqual([]);
    expect(a.fundadorDias).toBe(1);
    expect(a.fundadorUltimoDia).toBe('2026-11-03');
    expect(a.ownedFrames ?? []).not.toContain(FUNDADOR_MOLDURA_ID);
  });
});
