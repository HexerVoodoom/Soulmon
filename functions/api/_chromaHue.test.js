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
  it('e deterministico; sem penalidade de posicao (regra de 10/11/2026): a ordem de citacao nao muda a escolha', () => {
    expect(k('purple with yellow accents')).toBe(k('purple with yellow accents'));
    expect(k('violet body, tiny yellow spark')).toBe('green');
    expect(k('green leaves, then violet fur')).toBe(k('violet fur, then green leaves'));
    const r = escolherChaveDeMatiz('violet body, tiny yellow spark');
    expect(r.ranking.map(x => x.key).sort()).toEqual(['blue', 'green', 'magenta']);
  });
  it('VERDE sempre que a distancia real ate a criatura for >= 45 graus; so troca quando algo esta a < 45 do verde (75-165)', () => {
    expect(k('violet serpent with orange runes')).toBe('green'); // 90 e 155 graus: verde fica
    expect(k('olive moss golem')).toBe('magenta'); // verde na paleta: troca
    expect(k('lime and yellow gecko')).not.toBe('green'); // lime a 0 graus
    expect(k('yellow chick')).toBe('green'); // amarelo a 65 graus: verde fica
    expect(escolherChaveDeMatiz('violet and orange').ranking[0]).toEqual({ key: 'green', score: 90 });
  });
  it('acento ("X accents", "hints of X") e ignoravel: violeta com acento verde doentio mantem o VERDE (bug do Saba: ganhava azul)', () => {
    expect(coresDoTexto('royal violet, ink black, sickly green accents palette').map(c => c.accent)).toEqual([false, true]);
    expect(coresDoTexto('hints of orbiting green glyphs')[0].accent).toBe(true);
    expect(k('flat dark violet and ash-gray colors with red accents, sickly green accents')).toBe('green');
    expect(k('green frog')).toBe('magenta'); // verde como cor principal continua contando
  });
  it('chave excluida (motivo "recorte": troca o fundo) escolhe a de maior distancia entre as restantes', () => {
    const r = escolherChaveDeMatiz('purple dragon', ['green']);
    expect(['magenta', 'blue']).toContain(r.key);
    expect(r.ranking.map(x => x.key)).not.toContain('green');
    expect(escolherChaveDeMatiz('orange fox', ['green']).key).toBe('blue'); // laranja 30: azul a 150, magenta a 90
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
