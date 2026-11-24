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
import { CardFrame } from './CardFrame';
import { RankingModal } from '../RankingModal';
import { ElementModal } from '../ElementModal';
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

/** Peças de arte de moldura (ModalFrame, CardFrame, ranking): na minimal nenhuma pode existir no DOM. */
const ARTE = '[data-moldura-modal], .sm2-moldura-modal, .sm2-moldura-modal__topo, .sm2-moldura-modal__base, .sm2-moldura-modal__lado, .sm2-moldura-card__topo, .sm2-moldura-card__base, .sm2-moldura-card__lado, .sm2-cristal-chama, [data-tela-moldura]';

describe('RankingModal por pele', () => {
  const rk = (info?: string) => <RankingModal open onClose={() => {}} language="pt-BR" title="Ranking" info={info}><p>lista</p></RankingModal>;
  it('arte: moldura do ranking com X só-glifo', () => {
    pele('arte', rk());
    const d = document.querySelector('[data-ranking-modal]') as HTMLElement;
    expect(d.className).toContain('sm2-moldura-modal--ranking');
    expect(document.querySelector('.sm3-ranking-fechar')).not.toBeNull();
  });
  it('fora do provider: igual à arte', () => {
    pele(null, rk());
    expect(document.querySelector('.sm2-moldura-modal--ranking')).not.toBeNull();
  });
  it('minimal: folha lisa, sem peça de arte, título/corpo/fechar presentes e fechar chama onClose', () => {
    let fechou = 0;
    pele('minimal', <RankingModal open onClose={() => { fechou++; }} language="pt-BR" title="Ranking" info="Top 50"><p>lista</p></RankingModal>);
    expect(document.querySelector(ARTE)).toBeNull();
    expect(document.querySelector('[data-ranking-modal] img')).toBeNull();
    const d = document.querySelector('[role="dialog"]') as HTMLElement;
    expect(d.getAttribute('aria-label')).toBe('Ranking');
    expect(d.className).toContain('sm3-ranking--lisa');
    expect(d.querySelector('h2')?.textContent).toBe('Ranking');
    expect(d.textContent).toContain('lista');
    expect(d.querySelector('button[aria-label="Sobre o ranking"]')).not.toBeNull();
    (d.querySelector('[data-ranking-fechar]') as HTMLButtonElement).click();
    expect(fechou).toBe(1);
  });
  it('minimal sem info: sem botão "i"', () => {
    pele('minimal', rk());
    expect(document.querySelector('button[aria-label="Sobre o ranking"]')).toBeNull();
  });
});

describe('CardFrame por pele', () => {
  const card = <CardFrame art={<img src="x.png" alt="" />} name="Nome" description="Desc" reward="+3" />;
  it('arte (e fora do provider): topo, base e laterais', () => {
    for (const s of [null, 'arte'] as const) {
      const { container, unmount } = pele(s, card);
      for (const q of ['topo', 'base', 'lado--e', 'lado--d']) expect(container.querySelector(`.sm2-moldura-card__${q.startsWith('lado') ? 'lado.sm2-moldura-card__' + q : q}`), String(s) + q).not.toBeNull();
      expect(container.querySelector('.sm2-moldura-card--lisa')).toBeNull();
      unmount();
    }
  });
  it('minimal: cartão liso, sem peça de arte, com arte/nome/descrição/recompensa', () => {
    const { container } = pele('minimal', card);
    expect(container.querySelector(ARTE)).toBeNull();
    expect(container.querySelector('.sm2-moldura-card--lisa')).not.toBeNull();
    expect(container.querySelector('[data-moldura-arte] img')).not.toBeNull();
    expect(container.querySelector('[data-moldura-nome]')?.textContent).toBe('Nome');
    expect(container.querySelector('[data-moldura-desc]')?.textContent).toBe('Desc');
    expect(container.querySelector('[data-moldura-recompensa]')?.textContent).toBe('+3');
  });
});

describe('ElementModal por pele', () => {
  const el = <ElementModal id="fogo" unlocked={new Set(['fogo'])} isPt onClose={() => {}} />;
  it('arte: ModalFrame do ModalSheet central; minimal: folha lisa com título e fechar', () => {
    const a = pele('arte', el);
    expect(document.querySelector('[data-moldura-modal]')).not.toBeNull();
    a.unmount();
    pele('minimal', el);
    expect(document.querySelector(ARTE)).toBeNull();
    const d = document.querySelector('[role="dialog"]') as HTMLElement;
    expect(d).not.toBeNull();
    expect(d.querySelector('[data-element-detail="fogo"]')).not.toBeNull();
    expect(d.querySelector('button[aria-label="Fechar"]')).not.toBeNull();
  });
});
