import { describe, expect, it } from 'vitest';
import { escolherChaveDeMatiz, coresDoTexto, hueDist, semChaveSegura, KEY_HUE } from './_chromaHue.js';

const k = t => escolherChaveDeMatiz(t).key;

describe('escolha da chave por distancia de matiz (#749)', () => {
  it('roxo/violeta (entre azul e magenta) pede VERDE, em PT e EN', () => {
    for (const t of ['purple dragon', 'violet fox with lilac mane', 'dragao roxo', 'raposa violeta', 'amethyst golem']) expect(k(t), t).toBe('green');
  });
  it('verde pede magenta; magenta/rosa-choque pede verde; sem cor pede verde', () => {
    expect(k('green frog')).toBe('magenta');
    expect(k('sapo verde')).toBe('magenta');
    expect(k('hot-pink bunny')).toBe('green');
    expect(k('coelho rosa-choque')).toBe('green');
    expect(k('gray stone golem')).toBe('green');
  });
  it('verde + magenta juntos pede AZUL; azul forte + laranja pede verde/magenta, nunca azul', () => {
    expect(k('green leaves and hot-pink petals')).toBe('blue');
    expect(k('royal blue and orange wolf')).not.toBe('blue');
  });
  it('cor escura/lavada nao colide: "dark magenta", "navy", "sky blue", "pale pink" sao ignoradas', () => {
    expect(coresDoTexto('dark magenta, navy cape, sky blue eyes, pale pink belly')).toEqual([]);
    expect(k('navy wizard with dark magenta robe')).toBe('green');
  });
  it('e deterministico e a cor dominante (1a citada) pesa mais que as acessorias', () => {
    expect(k('purple with green accents')).toBe(k('purple with green accents'));
    const r = escolherChaveDeMatiz('violet body, tiny yellow spark');
    expect(r.ranking[0].key).toBe('green');
    expect(r.ranking.map(x => x.key).sort()).toEqual(['blue', 'green', 'magenta']);
  });
  it('matematica do circulo: distancia angular e simetrica e <= 180', () => {
    expect(hueDist(350, 10)).toBe(20);
    expect(hueDist(KEY_HUE.green, KEY_HUE.magenta)).toBe(180);
  });
  it('circulo cheio (verde+magenta+azul) = sem chave segura; roxo sozinho tem', () => {
    expect(semChaveSegura('green leaves, hot-pink glitter, royal blue palette')).toBe(true);
    expect(semChaveSegura('purple dragon')).toBe(false);
  });
});
