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
