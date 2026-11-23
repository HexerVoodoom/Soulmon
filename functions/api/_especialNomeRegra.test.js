import { describe, it, expect } from 'vitest';
import { nomeEspecialValido, temPalavrao, temContato } from './_especialNomeRegra.js';

// Filtro do nome do especial (servidor e tela usam ESTA função): homóglifos, leet, separadores e contato.
describe('nomeEspecialValido — brechas de palavrão', () => {
  const recusados = [
    'fuck', 'fuuuck', 'f u c k', 'ｆｕｃｋ', 'ƒuck', 'fυck', 'fսck', 'Бlтch', 'shіt', 's h i t', 'sh1t', 'h1tl3r', 'cаrаlho', 'a s s', 'p0rn',
  ];
  it.each(recusados)('recusa %s', (nome) => {
    expect(nomeEspecialValido(nome)).toBeNull();
  });
  it('palavra legítima passa (sem Scunthorpe; alfabeto inteiro não latino passa)', () => {
    for (const ok of ['Classic', 'Cassie', 'Fogo Com Gelo', 'Dragon 2025', 'Mk 2', 'Café Noir', 'Дракон']) {
      expect(nomeEspecialValido(ok)).toBe(ok);
    }
  });
  it('mistura latino com outro alfabeto na mesma palavra: recusa', () => {
    expect(nomeEspecialValido('Drаgon')).toBeNull(); // "а" cirílico
  });
  it('temPalavrao enxerga largura zero e largura total fora da forma do nome', () => {
    expect(temPalavrao('fu​ck')).toBe(true);
    expect(temPalavrao('ｓｈｉｔ')).toBe(true);
    expect(temPalavrao('Chama Azul')).toBe(false);
  });
});

describe('nomeEspecialValido — contato', () => {
  const recusados = [
    'joao gmail com', 'j o a o g m a i l', 'wa me 11999998888', '11 9 9999 8888', '１１９９９９９８８８８', 'insta fulano', 'd1scord fulano',
    'fulano arroba', 'ponto com', 'ｗｗｗ',
  ];
  it.each(recusados)('recusa %s', (nome) => {
    expect(nomeEspecialValido(nome)).toBeNull();
  });
  it('temContato pega URL, e-mail, @usuário e convite no texto livre', () => {
    for (const t of ['https://x.io/a', 'fulano@mail.com', '@fulano', 'x.com/fulano', 'fulano#1234']) expect(temContato(t)).toBe(true);
    expect(temContato('Chama Azul 2025')).toBe(false);
  });
  it('número curto (ano, nível) passa; telefone não', () => {
    expect(nomeEspecialValido('Nova 2026')).toBe('Nova 2026');
    expect(nomeEspecialValido('Nova 1234567')).toBeNull();
  });
  it('"www" não contamina nomes legítimos com w (colapso de letras repetidas)', () => {
    for (const n of ['Wolf', 'Shadow', 'Owen', 'Swan', 'Dawn', 'Rowan', 'Wow', 'Wawa']) {
      expect(temContato(n)).toBe(false);
      expect(nomeEspecialValido(n)).toBe(n);
    }
  });
  it('"www" e variantes continuam barradas', () => {
    for (const n of ['www.x.com', 'w w w x', 'wwwgmail', 'WWW', 'wwwx', 'ｗｗｗ', 'w.w.w', 'wwww x']) expect(temContato(n)).toBe(true);
  });
});
