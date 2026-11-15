// @vitest-environment jsdom
/** BATTLE STAGE — ícone de ESTÁGIO ANTES do nome, dentro do bloco com HP e especial (dono, 09/11/2026). Bebê = sem ícone. */
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { BattleStage, type StageFighter } from './BattleStage';

afterEach(cleanup);
const me = (stageIcon?: string): StageFighter => ({ key: 'me', sprite: 'me.png', name: 'Eu', hp: 40, maxHp: 80, element: 'fogo', energy: 0.3, stageIcon });
const foe = (stage?: string): StageFighter => ({ key: 0, sprite: 'foe.png', name: 'Rival', hp: 30, maxHp: 60, element: 'agua', stage });
const base = { scene: 'url(x.png) center/cover #123', title: 'Duelo', closeLabel: 'Sair', onClose: () => {}, isPt: true };

describe('ícone de estágio no painel do combatente', () => {
  it('jogador e inimigo: o ícone está DENTRO da placa, antes do nome', () => {
    render(<BattleStage {...base} me={me('mega-power')} foes={[foe('champion')]} />);
    const placas = [...document.querySelectorAll('[data-stage-plate]')];
    expect(placas).toHaveLength(2);
    for (const placa of placas) {
      const icone = placa.querySelector('[data-estagio-icone]') as HTMLElement;
      expect(icone).toBeTruthy();
      expect(icone.style.imageRendering).toBe('pixelated');
      const nome = [...placa.querySelectorAll('span')].filter(s => s.textContent === 'Eu' || s.textContent === 'Rival').pop()!;
      expect(icone.compareDocumentPosition(nome) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    expect(document.querySelector('[data-stage-plate="me"] [data-estagio-icone]')!.getAttribute('data-estagio-icone')).toBe('mega-power');
  });
  it('bebê, estágio ausente ou id desconhecido: sem ícone, a placa não muda', () => {
    render(<BattleStage {...base} me={me('bb')} foes={[foe(undefined)]} />);
    expect(document.querySelectorAll('[data-estagio-icone]')).toHaveLength(0);
    cleanup();
    render(<BattleStage {...base} me={me(undefined)} foes={[foe('selvagem')]} />);
    expect(document.querySelectorAll('[data-estagio-icone]')).toHaveLength(0);
  });
});

describe('ícone de estágio colorido pelo CAMINHO na plaquinha (§369, dono 14/11/2026)', () => {
  const tinta = (lado: 'me' | 'foe') => document.querySelector(`[data-stage-plate="${lado}"] [data-estagio-icone] [data-estagio-tinta]`) as HTMLElement | null;
  const caminho = (lado: 'me' | 'foe') => document.querySelector(`[data-stage-plate="${lado}"] [data-estagio-icone]`)!.getAttribute('data-estagio-caminho');

  it.each([
    ['champion-power', 'power', 'rgb(76, 217, 100)'],
    ['ultimate-harmony', 'harmony', 'rgb(74, 163, 255)'],
    ['mega-benevolence', 'benevolence', 'rgb(255, 210, 63)'],
  ] as const)('jogador e oponente em %s: ícone tingido de %s', (forma, cam, cor) => {
    render(<BattleStage {...base} me={me(forma)} foes={[foe(forma)]} />);
    for (const lado of ['me', 'foe'] as const) {
      expect(caminho(lado)).toBe(cam);
      expect(tinta(lado)!.style.backgroundColor).toBe(cor);
    }
  });

  it('rookie, ultra e tier sem ramo (inimigo do mundo/chefe): ícone neutro, sem caminho inventado', () => {
    render(<BattleStage {...base} me={me('rookie')} foes={[foe('champion')]} />);
    expect(caminho('me')).toBeNull();
    expect(caminho('foe')).toBeNull();
    expect(tinta('me')).toBeNull();
    expect(document.querySelector('[data-stage-plate="me"] img[data-estagio-icone="rookie"]')).toBeTruthy();
    cleanup();
    render(<BattleStage {...base} me={me('ultra')} foes={[foe('chefe')]} />);
    expect(caminho('me')).toBeNull();
    expect(document.querySelector('[data-stage-plate="foe"] [data-estagio-icone]')).toBeNull();
  });

  it('o ícone tingido tem tamanho fixo e não encolhe; o nome continua truncando com reticências', () => {
    render(<BattleStage {...base} me={{ ...me('mega-benevolence'), name: 'Um nome comprido demais para caber na plaquinha' }} foes={[foe('rookie')]} />);
    const icone = document.querySelector('[data-stage-plate="me"] [data-estagio-icone]') as HTMLElement;
    expect(icone.style.width).toBe('16px');
    expect(icone.style.height).toBe('16px');
    expect(icone.style.flex).toMatch(/^0 0 auto$|^none$/);
    const nome = icone.nextElementSibling as HTMLElement;
    expect(nome.style.textOverflow).toBe('ellipsis');
    expect(nome.style.minWidth).toBe('0px');
    // ícone e nome ficam na linha do nome, ACIMA das barras (não as cobrem)
    const placa = document.querySelector('[data-stage-plate="me"]')!;
    const linhaDoNome = placa.firstElementChild!;
    expect(linhaDoNome.contains(icone)).toBe(true);
    expect(linhaDoNome.querySelector('[role="progressbar"]')).toBeNull();
  });
});

describe('QA r4: o ícone de estágio da plaquinha tem nome acessível (estágio · caminho), sem mudança visual', () => {
  it('PT: "Apoteose · Poder" (os nomes do JOGO, `formStageLabel`) no ícone tingido; não é mais aria-hidden', () => {
    render(<BattleStage {...base} me={me('mega-power')} foes={[foe('champion')]} />);
    const ic = document.querySelector('[data-stage-plate="me"] [data-estagio-icone]') as HTMLElement;
    expect(ic.getAttribute('role')).toBe('img');
    expect(ic.getAttribute('aria-label')).toBe('Apoteose · Poder');
    expect(ic.getAttribute('aria-hidden')).toBeNull();
    const neutro = document.querySelector('[data-stage-plate="foe"] img[data-estagio-icone]') as HTMLImageElement;
    expect(neutro.getAttribute('alt')).toBe('Ascendente');
    expect(neutro.getAttribute('aria-hidden')).toBeNull();
  });
  it('EN: "Apotheosis · Power"', () => {
    render(<BattleStage {...base} isPt={false} me={me('mega-power')} foes={[foe('rookie')]} />);
    expect(document.querySelector('[data-stage-plate="me"] [data-estagio-icone]')!.getAttribute('aria-label')).toBe('Apotheosis · Power');
    expect(document.querySelector('[data-stage-plate="foe"] img[data-estagio-icone]')!.getAttribute('alt')).toBe('Awakened');
  });
});
