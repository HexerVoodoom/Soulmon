import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PET_BACKGROUNDS } from '../utils/backgrounds';

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const ROOT = 'android/app/src/main';

describe('widget V-Pet: Z de sono e fundo do jogador (chaves novas e aditivas)', () => {
  const app = read('src/App.tsx');
  const bridge = read('src/plugins/SoulmonWidgetPlugin.ts');
  const plugin = read(`${ROOT}/java/com/soulmon/plugins/SoulmonWidgetPlugin.kt`);
  const renderer = read(`${ROOT}/java/com/soulmon/widget/WidgetRenderer.kt`);
  const vpet = read(`${ROOT}/java/com/soulmon/widget/WidgetVpet.kt`);

  it('o app manda o sono REAL e o cenario equipado; o bridge declara as duas chaves como opcionais', () => {
    expect(app).toContain('petSleeping: isSleeping');
    expect(app).toContain('vpetBg: widgetBgId(gameState.equippedBackground)');
    expect(bridge).toContain('visibleBackground(equipped)');
    expect(bridge).toContain('petSleeping?: boolean');
    expect(bridge).toContain('vpetBg?: string');
  });

  it('o efeito do widget reage a mudar o sono e o cenario', () => {
    expect(app).toContain('widgetSpriteUrl, isSleeping, gameState.equippedBackground]);');
  });

  it('plugin grava e renderer le as mesmas chaves; ausente = acordado / sem fundo', () => {
    for (const k of ['pet_sleeping', 'vpet_bg']) {
      expect(plugin).toContain(`"${k}"`);
      expect(renderer).toContain(`"${k}"`);
    }
    expect(plugin).toContain('optBoolean("petSleeping", false)');
    expect(plugin).toContain('editor.remove("vpet_bg")');
  });

  it('o Z e desenhado nos dois estados (aceso e apagado) dentro do bitmap do V-Pet', () => {
    expect(renderer).toContain('drawText("Z"');
    expect(renderer).toContain('if (sleeping)');
    expect(vpet).toContain('val sleepZ');
  });

  it('o Z nao cobra: so estado binario, sem contagem, horario ou texto', () => {
    expect(renderer).not.toMatch(/sleep.*(horas|hours|\$\{)/i);
  });

  it('todo cenario pintado tem miniatura empacotada com o nome que o Kotlin procura', () => {
    expect(vpet).toContain('"vpet_bg_" + id.replace(\'-\', \'_\')');
    let n = 0;
    for (const [id, bg] of Object.entries(PET_BACKGROUNDS)) {
      if (!bg.css.includes('url(')) continue;
      n++;
      const f = `${ROOT}/res/drawable-nodpi/vpet_bg_${id.replace(/-/g, '_')}.webp`;
      expect(existsSync(new URL(`../../${f}`, import.meta.url)), f).toBe(true);
    }
    expect(n).toBeGreaterThan(0);
  });
});
