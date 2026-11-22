// @vitest-environment jsdom
/**
 * "Files"/"Arquivos" + convenção `.exe` (16/11/2026, dono, corrigida no mesmo dia): COMIDAS, PRATOS e CHIPS aparecem como `<nome>.exe`;
 * os ESPECIAIS (coraçãozinho, Glitchtama, Faísca...) NÃO. Só apresentação: as chaves do inventário (ids) continuam as mesmas.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { Mochila, mochilaTabs } from './Mochila';
import { getFileName, isExeItem, getFoodName } from '../ItemsWindow';
import { SPECIAL_ITEMS } from '../../utils/shop';
import { dishKey } from '../../utils/dishItems';

afterEach(cleanup);

const firstOf = (kind: string) => Object.entries(SPECIAL_ITEMS).find(([, v]) => v.kind === kind)?.[0] as string;

describe('convenção .exe', () => {
  it('comida, prato e chip levam .exe; coração, Glitchtama, Faísca e poção NÃO', () => {
    for (const k of ['🍎', dishKey('cha-de-orvalho'), firstOf('chip')]) expect(isExeItem(k), k).toBe(true);
    for (const kind of ['heart', 'glitchtama', 'spark', 'potion']) {
      const k = firstOf(kind);
      if (!k) continue;
      expect(isExeItem(k), kind).toBe(false);
      expect(getFileName(k, 'en-US')).toBe(getFoodName(k, 'en-US'));
    }
  });
  it('nome dos pratos PT/EN e ids intactos', () => {
    expect(getFileName(dishKey('cha-de-orvalho'), 'en-US')).toBe('Dew Tea.exe');
    expect(getFileName(dishKey('cha-de-orvalho'), 'pt-BR')).toBe('Chá de Orvalho.exe');
    expect(dishKey('cha-de-orvalho')).toBe('dish:cha-de-orvalho');
  });
  it('chave desconhecida não ganha .exe (devolve a própria chave)', () => {
    expect(getFileName('zzz-desconhecido', 'en-US')).toBe('zzz-desconhecido');
  });
});

describe('aba Files', () => {
  const inv: Record<string, number> = { '🍎': 2, [dishKey('cha-de-orvalho')]: 1 };
  const chip = firstOf('chip'); const heart = firstOf('heart');
  inv[chip] = 1; inv[heart] = 1;
  it('título Files/Arquivos; comida, prato e chip com .exe na grade; id (data-item) intacto', () => {
    for (const [lang, titulo] of [['en-US', 'Files'], ['pt-BR', 'Arquivos']] as const) {
      renderWithCss(<Mochila open onClose={() => {}} foodInventory={inv} language={lang} onUse={() => {}} petTargetRef={{ current: null }} />);
      expect(document.querySelector('.sm3-mochila-titulo')!.textContent).toBe(titulo);
      const nomes = [...document.querySelectorAll('.sm3-item')].map(e => e.querySelector('.sm3-item-nome')!.textContent);
      expect(nomes.length).toBe(mochilaTabs(inv).comida.length);
      for (const n of nomes) expect(n!.endsWith('.exe'), n!).toBe(true);
      expect(document.querySelector(`[data-item="${dishKey('cha-de-orvalho')}"]`)).toBeTruthy();
      cleanup();
    }
  });
});
