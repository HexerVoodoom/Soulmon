import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mirrorSprite } from './spritePose';
import { facesLeft } from '../../desktop/renderer/src/sprites';

const dsk = (f: string) => readFileSync(join(process.cwd(), 'desktop', 'renderer', 'src', f), 'utf8');

describe('overlay do desktop x pose do sprite', () => {
  it('a pose atravessa o caminho do save: snapshot -> applySnapshot -> estado -> main', () => {
    expect(dsk('cloudSync.ts').match(/spritePose: sanitizeSpritePose\(state\.spritePose\)/g)?.length).toBe(2);
    expect(dsk('menu.ts')).toContain('state.spritePose = s.spritePose');
    expect(dsk('main.ts')).toContain('mirrorSprite(');
    expect(dsk('main.ts')).toContain("classList.toggle('air'");
  });
  it('facesLeft é o MESMO dono do app (linhas de arte que olham para a esquerda)', () => {
    expect(facesLeft('rookie', 'igni')).toBe(true);
    expect(facesLeft('rookie')).toBe(false);
  });
  it('flipX inverte o espelho ao andar', () => {
    expect(mirrorSprite(false, false, false)).toBe(false);
    expect(mirrorSprite(false, false, true)).toBe(true);
  });
});
