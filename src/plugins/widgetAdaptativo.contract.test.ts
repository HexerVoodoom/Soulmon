import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { hungerAt, hungryFrom, HUNGER_FED_MIN } from '../utils/hunger';
import { widgetNextTask, widgetDayEndsAt, type WidgetTaskState } from './SoulmonWidgetPlugin';

// Widget redimensionável (REGISTRO §221). A escolha da frase é Kotlin e tem JUnit
// (`WidgetAdaptiveTest.kt`); aqui ficam o lado TS e o que só se confere lendo o fonte.
const NOW = new Date(2026, 10, 4, 10, 0, 0);
const base: WidgetTaskState = { evolutionStage: 'rookie', tasks: [], activities: [] };
const res = 'android/app/src/main/res';

describe('hungryFrom', () => {
  it('sem registro não há fome marcada', () => {
    expect(hungryFrom(undefined)).toBeNull();
  });
  it('abaixo da régua vale desde o registro', () => {
    expect(hungryFrom({ v: 10, at: 500 })).toBe(500);
  });
  it('acima da régua, o instante é onde hungerAt cruza HUNGER_FED_MIN', () => {
    const rec = { v: 100, at: NOW.getTime() };
    const t = hungryFrom(rec)!;
    expect(hungerAt(rec, t - 60_000)).toBeGreaterThan(HUNGER_FED_MIN);
    expect(hungerAt(rec, t)).toBeLessThanOrEqual(HUNGER_FED_MIN);
  });
});

describe('widgetNextTask', () => {
  const habito = (o: object) => ({ id: 'h', name: 'Walk', steps: [], weekDays: [0, 1, 2, 3, 4, 5, 6], ...o });
  it('meta cumprida ou sem meta: vazio, mesmo com item sobrando', () => {
    const s = { ...base, tasks: [{ id: 't', name: 'Read' }] };
    expect(widgetNextTask(s, NOW, 3, 3)).toBe('');
    expect(widgetNextTask(s, NOW, 0, 0)).toBe('');
  });
  it('ordem: foco, hábito, tarefa', () => {
    const plain = { id: 'a', name: 'Plain' };
    const focus = { id: 'b', name: 'Focus', focusDate: NOW.toDateString() };
    const activities = [habito({})];
    expect(widgetNextTask({ ...base, tasks: [plain, focus], activities }, NOW, 0, 3)).toBe('Focus');
    expect(widgetNextTask({ ...base, tasks: [plain], activities }, NOW, 0, 3)).toBe('Walk');
    expect(widgetNextTask({ ...base, tasks: [plain] }, NOW, 0, 3)).toBe('Plain');
  });
  it('pula feito, fora de lista, adiado e sem nome; limpa e corta o nome', () => {
    const tasks = [
      { id: '1', name: 'Done', completed: true },
      { id: '2', name: 'Someday', status: 'someday' as const },
      { id: '3', name: 'Later', startDate: '2026-11-20' },
      { id: '4', name: '   ' },
      { id: '5', name: `  Long\n${'x'.repeat(80)}` },
    ];
    const out = widgetNextTask({ ...base, tasks }, NOW, 0, 3);
    expect(out.startsWith('Long x')).toBe(true);
    expect(out.length).toBe(60);
  });
  it('hábito fechado hoje não aparece', () => {
    const activities = [habito({ completedToday: true, lastCompletedDate: NOW.toDateString() })];
    expect(widgetNextTask({ ...base, activities }, NOW, 0, 3)).toBe('');
  });
});

it('widgetDayEndsAt é a próxima meia-noite local', () => {
  expect(widgetDayEndsAt(NOW)).toBe(new Date(2026, 10, 5).getTime());
});

describe('fonte Android', () => {
  const manifest = readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
  const info = readFileSync(`${res}/xml/soulmon_widget_adaptive_info.xml`, 'utf8');
  const decisao = readFileSync('android/app/src/main/java/com/soulmon/widget/WidgetAdaptive.kt', 'utf8');
  const provider = readFileSync('android/app/src/main/java/com/soulmon/widget/SoulmonWidgetAdaptiveProvider.kt', 'utf8');

  it('os 5 providers antigos seguem registrados (tirar apagaria o widget colocado) e o novo entrou', () => {
    for (const p of ['Provider', 'VerticalProvider', 'PetProvider', 'ChatProvider', 'ScreenProvider', 'AdaptiveProvider']) {
      expect(manifest).toContain(`.widget.SoulmonWidget${p}"`);
    }
  });

  it('redimensiona nos dois eixos e reage ao tamanho', () => {
    expect(info).toMatch(/resizeMode="horizontal\|vertical"/);
    expect(provider).toMatch(/onAppWidgetOptionsChanged/);
  });

  it('a prioridade é a do dono', () => {
    const ordem = ['Message.HUNGRY', 'Message.POOP', 'Message.TASK', 'Message.DAY_CLOSED', 'Message.SUPPORT']
      .map(m => decisao.indexOf(`return ${m}`));
    expect(ordem.every(i => i >= 0)).toBe(true);
    expect([...ordem].sort((a, b) => a - b)).toEqual(ordem);
  });

  it('o quadrado não tem texto', () => {
    expect(readFileSync(`${res}/layout/widget_soulmon_adaptive_square.xml`, 'utf8')).not.toMatch(/<TextView/);
  });

  it('frases em EN e PT, sem emoji, sem contagem e sem cobrança', () => {
    const linhas = (xml: string) => [...xml.matchAll(/name="widget_line_[a-z_]+">([^<]*)</g)].map(x => x[1]);
    const en = linhas(readFileSync(`${res}/values/strings.xml`, 'utf8'));
    const pt = linhas(readFileSync(`${res}/values-pt/strings.xml`, 'utf8'));
    expect(en).toHaveLength(5);
    expect(pt).toHaveLength(5);
    for (const t of [...en, ...pt]) {
      expect(t).not.toMatch(/\p{Extended_Pictographic}/u);
      expect(t).not.toMatch(/\d\/|\bleft\b|falta|\bmiss|saudade|forget|esquec|\bneed|precis|\bmust\b|\bdeve\b|!/i);
    }
  });
});
