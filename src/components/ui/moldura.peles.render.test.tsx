// @vitest-environment jsdom
/**
 * Moldura POR PELE (P7 fase 2-A): 'arte' (padrão, e fora do provider) monta as molduras; 'minimal' monta a folha lisa de antes, sem
 * nenhuma peça da moldura (sem arte, sem borda). O ✕ / voltar continua com alvo >= 44 px (a classe do botão carrega o tamanho).
 */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import type { ReactNode } from 'react';
import { installDomGlobals } from '../../test/renderEnv';
import { AreaSheet } from '../nav/AreaSheet';
import { ModalSheet } from '../form/FormKit';
import { RitualDialog } from '../ritual/RitualKit';
import { GameRoot } from '../games/GameKit';
import { TelaMoldura } from './TelaMoldura';
import { UiSkinProvider } from '../../contexts/UiSkinContext';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { molduraDaPele } from '../../utils/uiSkin';

beforeEach(() => { installDomGlobals(); localStorage.clear(); delete document.documentElement.dataset.ui; });
afterEach(() => cleanup());

const MOLDURA = '[data-moldura-modal], .sm2-moldura-modal, [data-tela-moldura]';
const pele = (skin: 'arte' | 'minimal' | null, ui: ReactNode) => {
  if (skin) localStorage.setItem(STORAGE_KEYS.UI_SKIN, skin);
  return render(skin ? <UiSkinProvider>{ui}</UiSkinProvider> : <>{ui}</>);
};

describe('molduraDaPele', () => {
  it('só a pele arte desenha moldura', () => {
    expect(molduraDaPele('arte')).toBe(true);
    expect(molduraDaPele('minimal')).toBe(false);
  });
});

describe('AreaSheet por pele', () => {
  const sheet = <AreaSheet areaId="mercado" lotId="itens" language="pt-BR" title="Itens" closeLabel="Fechar" open onClose={() => {}}>corpo</AreaSheet>;
  it('fora do provider e na pele arte: moldura com placa', () => {
    for (const s of [null, 'arte'] as const) {
      const { container, unmount } = pele(s, sheet);
      expect(container.querySelector('[data-moldura-modal]'), String(s)).not.toBeNull();
      expect(container.querySelector('[data-moldura-placa] h2')?.textContent).toBe('Itens');
      unmount();
    }
  });
  it('pele minimal: folha lisa, título em h2 próprio, sem peça de moldura, voltar presente', () => {
    const { container } = pele('minimal', sheet);
    expect(container.querySelector(MOLDURA)).toBeNull();
    expect(container.querySelector('[data-area-sheet]')).not.toBeNull();
    expect(container.querySelector('[data-area-sheet-head] h2')?.textContent).toBe('Itens');
    expect(container.querySelector('[data-area-sheet-close]')).not.toBeNull();
    expect(container.querySelector('.sm2-cristal-chama')).toBeNull();
  });
  it('pele minimal, moldura aco e titulo inline: também lisa', () => {
    for (const extra of [{ moldura: 'aco' as const }, { titulo: 'inline' as const }]) {
      const { container, unmount } = pele('minimal', <AreaSheet areaId="mercado" lotId="itens" language="pt-BR" title="Itens" closeLabel="Fechar" open onClose={() => {}} {...extra}>c</AreaSheet>);
      expect(container.querySelector(MOLDURA)).toBeNull();
      expect(container.querySelector('.sm2-moldura-aco__fechar, .sm2-popup-fechar')).toBeNull();
      expect(container.querySelector('[data-area-sheet-close]')).not.toBeNull();
      unmount();
    }
  });
});

describe('ModalSheet por pele', () => {
  for (const placement of ['bottom', 'center'] as const) {
    const folha = <ModalSheet open title="Nova tarefa" language="pt-BR" onClose={() => {}} placement={placement}>conteúdo</ModalSheet>;
    it(`${placement}: arte tem moldura, minimal não`, () => {
      const a = pele('arte', folha);
      expect(a.container.querySelector(MOLDURA) ?? document.querySelector(MOLDURA)).not.toBeNull();
      a.unmount();
      pele('minimal', folha);
      expect(document.querySelector(MOLDURA)).toBeNull();
      const dlg = document.querySelector('[role="dialog"]') as HTMLElement;
      expect(dlg).not.toBeNull();
      expect(dlg.getAttribute('aria-label')).toBe('Nova tarefa');
      expect(dlg.textContent).toContain('Nova tarefa');
    });
  }
});

describe('RitualDialog por pele', () => {
  const r = <RitualDialog onClose={() => {}} label="r" title="Fundador" closeLabel="Fechar"><p>x</p></RitualDialog>;
  it('arte: ModalFrame; minimal: cartão liso', () => {
    const a = pele('arte', r);
    expect(a.container.querySelector('[data-moldura-modal]')).not.toBeNull();
    a.unmount();
    const m = pele('minimal', r);
    expect(m.container.querySelector(MOLDURA)).toBeNull();
    expect(m.container.querySelector('[role="dialog"]')).not.toBeNull();
  });
});

describe('TelaMoldura / GameRoot por pele', () => {
  it('arte desenha a moldura da tela; minimal não', () => {
    const a = pele('arte', <GameRoot moldura={{ tela: 'calabouco', title: 'T' }}>x</GameRoot>);
    expect(a.container.querySelector('[data-tela-moldura]')).not.toBeNull();
    a.unmount();
    const m = pele('minimal', <GameRoot moldura={{ tela: 'calabouco', title: 'T' }}>x</GameRoot>);
    expect(m.container.querySelector('[data-tela-moldura]')).toBeNull();
    m.unmount();
    const t = pele('minimal', <TelaMoldura tela="calabouco" title="T" />);
    expect(t.container.querySelector('[data-tela-moldura]')).toBeNull();
  });
});
