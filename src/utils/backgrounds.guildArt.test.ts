import { describe, it, expect } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { GROVE_STAGES } from './guildRules';
import { PET_BACKGROUNDS } from './backgrounds';
import { portraitUrl } from './backgroundPortrait';

const dir = join(process.cwd(), 'src/assets/backgrounds');

/** D-27 (W5-L7): arte pintada nova dos cinco estágios, em WebP (paisagem 1200×648 + retrato 608×1080), ≤ 400 KB cada. */
describe('arte dos cenários do Bosque (D-27)', () => {
  it.each(GROVE_STAGES)('%s: paisagem e retrato existem, dentro do orçamento de bytes, sem o PNG pixelado antigo', (st) => {
    const land = join(dir, `bg-guild-${st}.webp`), port = join(dir, `bg-guild-${st}-portrait.webp`);
    expect(existsSync(land)).toBe(true);
    expect(existsSync(port)).toBe(true);
    expect(statSync(land).size).toBeLessThanOrEqual(400 * 1024);
    expect(statSync(port).size).toBeLessThanOrEqual(400 * 1024);
    expect(existsSync(join(dir, `bg-guild-${st}.png`))).toBe(false);
    expect(PET_BACKGROUNDS[`bg-guild-${st}`].css).toMatch(/^url\(/);
    expect(portraitUrl(`bg-guild-${st}`)).toBeTruthy();
  });
});
