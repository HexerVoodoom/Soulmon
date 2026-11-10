import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { starvingSince, hungryFrom, maxEnergyOf, HUNGER_FED_MIN, HUNGER_FAIR_MIN } from '../utils/hunger';

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const ROOT = 'android/app/src/main';

describe('widget V-Pet: comida em 3 estados + raio de energia', () => {
  const app = read('src/App.tsx');
  const bridge = read('src/plugins/SoulmonWidgetPlugin.ts');
  const plugin = read(`${ROOT}/java/com/soulmon/plugins/SoulmonWidgetPlugin.kt`);
  const renderer = read(`${ROOT}/java/com/soulmon/widget/WidgetRenderer.kt`);

  it('o app manda os dois instantes de fome e o teto de energia', () => {
    expect(app).toContain('starvingSince(gameState.hunger)');
    expect(app).toContain('maxEnergyPoints: maxEnergyOf(gameState)');
    expect(bridge).toContain('starvingAtMs?: number');
    expect(bridge).toContain('maxEnergyPoints?: number');
  });

  it('o plugin grava e o renderer lê as mesmas chaves de prefs', () => {
    for (const k of ['starving_at', 'max_energy_points']) {
      expect(plugin).toContain(`"${k}"`);
      expect(renderer).toContain(`"${k}"`);
    }
    expect(renderer).toContain('"energy_points"');
    expect(renderer).toContain('"hungry_at"');
  });

  it('as 3 comidas e o raio existem como drawable e são usados', () => {
    for (const f of ['vpet_fome_cheio', 'vpet_fome_medio', 'vpet_fome_faminto', 'vpet_icon_energia']) {
      expect(() => readFileSync(new URL(`../../${ROOT}/res/drawable-nodpi/${f}.png`, import.meta.url))).not.toThrow();
      expect(renderer).toContain(`R.drawable.${f}`);
    }
  });

  it('as faixas do Kotlin batem com as do jogo (60 e 20)', () => {
    expect(HUNGER_FED_MIN).toBe(60);
    expect(HUNGER_FAIR_MIN).toBe(20);
    // comeu agora (100): osso só depois de 80 de 100 caídos; carne cheia até cair abaixo de 60.
    const rec = { v: 100, at: 1_000 };
    expect(hungryFrom(rec)!).toBeLessThan(starvingSince(rec)!);
    expect(starvingSince(undefined)).toBeNull();
    expect(maxEnergyOf({ evolutionStage: 'rookie' })).toBeGreaterThan(0);
  });
});
