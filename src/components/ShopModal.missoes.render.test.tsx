// @vitest-environment jsdom
/**
 * WP4.12 (achado E4) — a aba de Missões não é um boletim.
 *
 * Ela mostrava `0/100`, `0/3`, `0/1000`, `0/30` um embaixo do outro, cada um
 * ao lado de um cadeado. Uma coluna de zeros lê como nota baixa, e o cadeado
 * já dizia "bloqueado" — o número repetia a mesma informação de um jeito pior.
 * Quem nunca entrou na masmorra não precisa saber quantos inimigos faltam;
 * precisa saber o que fazer.
 *
 * Com progresso REAL o número volta, porque aí ele descreve um caminho que já
 * começou. É essa a diferença que o teste guarda.
 */
import { describe, it, expect } from 'vitest';
import { renderWithCss } from '../test/renderEnv';
import { ShopModal } from './ShopModal';
import { MISSIONS } from '../utils/missions';

const base = {
  language: 'pt-BR' as const,
  points: 0,
  emblems: 0,
  credits: 0,
  ownedBackgrounds: [] as string[],
  equippedBackground: null,
  ownedFurniture: [] as string[],
  equippedDecor: {},
  onBuy: () => true,
  onExchangeCredits: async () => true,
  onEquip: () => {},
  onEquipFurniture: () => {},
  onClose: () => {},
};

/** Missões com alvo > 1 — as únicas que podiam imprimir "0/N". */
const COM_CONTAGEM = MISSIONS.filter(m => m.target > 1);

describe('ShopModal — a aba de Missões sem coluna de zeros', () => {
  it('AUTOVERIFICAÇÃO: existem missões com alvo maior que 1', () => {
    // Sem isto, o caso abaixo passaria porque não há o que imprimir.
    expect(COM_CONTAGEM.length).toBeGreaterThan(0);
  });

  it('sem progresso nenhum, nenhum "0/" aparece', () => {
    const zerado = Object.fromEntries(MISSIONS.map(m => [m.id, 0]));
    const { container } = renderWithCss(
      <ShopModal {...base} missionProgress={zerado} />,
    );
    expect(container.textContent ?? '', 'a coluna de zeros voltou').not.toContain('0/');
  });

  it('com progresso real, o número VOLTA — aí ele descreve um caminho', () => {
    const m = COM_CONTAGEM[0];
    const andando = Object.fromEntries(MISSIONS.map(x => [x.id, 0]));
    andando[m.id] = 1;
    const { container } = renderWithCss(
      <ShopModal {...base} missionProgress={andando} />,
    );
    expect(container.textContent).toContain(`1/${m.target}`);
  });

  it('a condição em PALAVRAS aparece de qualquer jeito', () => {
    const zerado = Object.fromEntries(MISSIONS.map(x => [x.id, 0]));
    const { container } = renderWithCss(
      <ShopModal {...base} missionProgress={zerado} />,
    );
    // É o que substitui o número: o que fazer, não quanto falta.
    expect(container.textContent).toContain(COM_CONTAGEM[0].descPt);
  });
});
