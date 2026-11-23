// @vitest-environment jsdom
/** O modal do dex mostra o texto aprovado só dos 20 elementos BASE (PT e EN); combinado, curado e neutro não ganham texto próprio. */
import { describe, it, expect } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { ElementDex } from './ElementDex';
import { TEXTOS_ELEMENTO_BASE } from '../utils/elementoTextos.data';
import { CLASS_ELEMENT_ORDER } from '../utils/soulProfile/types';

const abrir = (id: string) => fireEvent.click(document.querySelector(`[data-element-cell="${id}"]`)!);
const texto = () => document.querySelector('[data-element-text]')?.textContent ?? null;

describe('textos dos elementos base no dex', () => {
  it('cobre exatamente os 20 base, com PT e EN preenchidos e sem o nome do arcano', () => {
    expect(Object.keys(TEXTOS_ELEMENTO_BASE).sort()).toEqual([...CLASS_ELEMENT_ORDER].sort());
    for (const [id, t] of Object.entries(TEXTOS_ELEMENTO_BASE)) {
      expect(t.pt.length, id).toBeGreaterThan(40);
      expect(t.en.length, id).toBeGreaterThan(40);
      expect(t.pt, id).not.toMatch(/você|Sacerdotisa|Hierofante|Imperador|Imperatriz|Enforcado|Enamorados|Julgamento|Roda da Fortuna|Éon|Louco/);
      expect(t.en, id).not.toMatch(/you|Priestess|Hierophant|Emperor|Empress|Hanged Man|Lovers|Judgement|Wheel of Fortune|Aeon|Fool/i);
    }
  });
  it('PT: morte mostra o texto ditado pelo dono; EN: fogo mostra a versão em inglês', () => {
    renderWithCss(<ElementDex defeated={['morte', 'fogo']} language="pt-BR" />);
    abrir('morte');
    expect(texto()).toContain('Nas fendas, a morte é o término.');
    expect(texto()).toContain('A morte simbólica de uma identidade, crença ou condição permite que algo novo surja.');
  });
  it('EN: fogo em inglês', () => {
    renderWithCss(<ElementDex defeated={['fogo']} language="en-US" />);
    abrir('fogo');
    expect(texto()).toContain('Lantern fire keeps its flame low');
  });
  it('combinado (vapor) e curado não têm texto próprio', () => {
    renderWithCss(<ElementDex defeated={['fogo', 'agua', 'vapor']} language="pt-BR" />);
    abrir('vapor');
    expect(texto()).toBeNull();
  });
});
