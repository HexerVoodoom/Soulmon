// @vitest-environment jsdom
/**
 * A PLAQUINHA da Home e o aviso "Ele está na masmorra" (pedido do dono, 11/10/2026, REGISTRO §36).
 *
 * Com o Soulmon na masmorra o pet some do palco e no lugar dele fica a plaquinha "Estou na masmorra, volto logo" / "I'm in the
 * dungeon, back soon" (componente de CSS com a porta da masmorra de `DUNGEON_PROP_ART`; nenhuma imagem nova). Tocar nela abre o
 * aviso; "Retirar da masmorra" restaura o pet. O aviso também é o que as ações bloqueadas mostram, com o que o jogador queria fazer.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { CompanionHUD } from '../CompanionHUD';
import { DungeonBusyModal, ocupadoMensagem, type OcupadoAcao } from '../DungeonBusyModal';

const base = {
  companionMood: 'idle' as const, energyLevel: 3, message: 'Oi!', currentStage: 'rookie', evolutionStage: 'rookie',
  healthPoints: 3, maxHealthPoints: 3, dominantBranch: 'balanced' as const, currentXP: 0, nextLevelXP: 10, useAI: false,
  language: 'pt-BR' as const,
};
beforeEach(() => { vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste')))); });
afterEach(() => { vi.unstubAllGlobals(); });

describe('plaquinha na Home', () => {
  it('na masmorra: a plaquinha aparece no lugar do pet (sprite escondido e fora do leitor de tela), em PT', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} naMasmorra />);
    const placa = container.querySelector('[data-dungeon-sign]') as HTMLElement;
    expect(placa).not.toBeNull();
    expect(placa.textContent).toBe('Estou na masmorra, volto logo');
    const sprite = container.querySelector('img[data-pet-altitude]') as HTMLElement;
    expect(sprite.style.visibility).toBe('hidden');
    expect(sprite.getAttribute('aria-hidden')).toBe('true');
  });

  it('em EN: "I’m in the dungeon, back soon"', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} language="en-US" naMasmorra />);
    expect((container.querySelector('[data-dungeon-sign]') as HTMLElement).textContent).toBe('I’m in the dungeon, back soon');
  });

  it('a arte é a porta da masmorra que já existe (nenhuma imagem nova) e é um botão acessível', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} naMasmorra />);
    const placa = container.querySelector('[data-dungeon-sign]') as HTMLButtonElement;
    expect(placa.tagName).toBe('BUTTON');
    expect(placa.getAttribute('aria-label')).toMatch(/Estou na masmorra, volto logo/);
    const img = placa.querySelector('img')!;
    expect(img.getAttribute('src')).toMatch(/masmorra-porta/);
    expect(img.getAttribute('alt')).toBe('');
  });

  it('tocar na plaquinha chama o aviso', () => {
    const onSinal = vi.fn();
    const { container } = renderWithCss(<CompanionHUD {...base} naMasmorra onSinalMasmorra={onSinal} />);
    fireEvent.click(container.querySelector('[data-dungeon-sign]')!);
    expect(onSinal).toHaveBeenCalledTimes(1);
  });

  it('em casa (retirado ou sem descida): sem plaquinha, o pet está lá, visível', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} />);
    expect(container.querySelector('[data-dungeon-sign]')).toBeNull();
    const sprite = screen.getByAltText('rookie') as HTMLElement;
    expect(sprite.style.visibility).not.toBe('hidden');
  });

  it('a texto da plaquinha não cobra nem culpa', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} naMasmorra />);
    expect(container.querySelector('[data-dungeon-sign]')!.textContent).not.toMatch(/cadê|abandon|volte|culpa|falt/i);
  });
});

describe('aviso "Ele está na masmorra"', () => {
  const abrir = (acao: OcupadoAcao | null, lang: 'pt-BR' | 'en-US' = 'pt-BR') => {
    const onRetire = vi.fn();
    const onClose = vi.fn();
    renderWithCss(<DungeonBusyModal open acao={acao} language={lang} onRetire={onRetire} onClose={onClose} />);
    return { onRetire, onClose };
  };

  it('diz o que o jogador queria fazer e oferece "Retirar da masmorra" / "Deixar lá"', () => {
    const { onRetire, onClose } = abrir('evolucao');
    expect(document.querySelector('[data-dungeon-busy-msg]')!.textContent).toMatch(/Para evoluir, é só retirá-lo de lá primeiro/);
    fireEvent.click(document.querySelector('[data-dungeon-busy-retire]')!);
    expect(onRetire).toHaveBeenCalled();
    fireEvent.click(document.querySelector('[data-dungeon-busy-keep]')!);
    expect(onClose).toHaveBeenCalled();
  });

  it('cobre todas as ações, em PT e EN, sempre com o caminho de saída e sem culpa', () => {
    const acoes: OcupadoAcao[] = ['evolucao', 'renascer', 'missao', 'passeio', 'duelo', 'torneio'];
    for (const a of acoes) {
      for (const isPt of [true, false]) {
        const m = ocupadoMensagem(a, isPt);
        expect(m).toMatch(isPt ? /retirá-lo/ : /take him out/);
        expect(m).not.toMatch(/erro|error|failed|proibid|não pode/i);
      }
    }
  });

  it('tocar na plaquinha (sem ação) pergunta se quer trazê-lo de volta', () => {
    abrir(null);
    expect(document.querySelector('[data-dungeon-busy-msg]')!.textContent).toMatch(/Quer trazê-lo de volta\?/);
  });

  it('Soulmon em missão: aviso próprio, só "Entendi" (sem Retirar — a missão não é a masmorra)', () => {
    abrir('masmorra-em-missao');
    expect(document.querySelector('[data-dungeon-busy-retire]')).toBeNull();
    expect(document.querySelector('[data-dungeon-busy-ok]')).not.toBeNull();
    expect(document.querySelector('[data-dungeon-busy-msg]')!.textContent).toMatch(/missão da guilda/);
  });

  it('EN: título e botões', () => {
    abrir('missao', 'en-US');
    expect(screen.getByRole('dialog', { name: 'He is in the dungeon' })).toBeTruthy();
    expect(document.querySelector('[data-dungeon-busy-retire]')!.textContent).toBe('Take him out');
    expect(document.querySelector('[data-dungeon-busy-keep]')!.textContent).toBe('Leave him there');
  });
});
