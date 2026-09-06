// @vitest-environment jsdom
/**
 * WP3.8 — o canal de reação do pet, que existia inteiro e estava desligado.
 *
 * O `App.tsx` calcula `getCompanionMessage()` a cada render e incrementa
 * `messageTrigger` em **treze** pontos: concluir tarefa, alimentar, limpar
 * cocô, brincar, evoluir, degenerar, editar atividade, e todo o
 * `useCareSystem`. As duas props chegavam ao `CompanionHUD`, eram
 * desestruturadas e **nenhuma era lida**. Cada uma dessas treze ações mandava o
 * pet falar, e ele não falava.
 *
 * Não é um bug de fala: é o produto. A tese do Soulmon é uma criatura que
 * responde a como você cuida de você; uma que só fala no relógio dela é papel
 * de parede animado. E o sintoma — uma prop de pulso sem consumidor — é o mesmo
 * da rodada 4 inteira.
 *
 * O teste tem DUAS metades, e a segunda importa tanto quanto a primeira:
 * o pet fala quando algo acontece, **e fica calado quando nada aconteceu**.
 * Bicho que fala a cada mudança de estado é o bipe que fez as escolas banirem o
 * Tamagotchi (transcrição B1) — por isso o efeito depende só do pulso, e o
 * texto vem de um ref.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { CompanionHUD } from './CompanionHUD';

const base = {
  companionMood: 'idle' as const,
  energyLevel: 3,
  message: 'Que tal uma comidinha?',
  currentStage: 'rookie',
  evolutionStage: 'rookie',
  healthPoints: 3,
  maxHealthPoints: 3,
  dominantBranch: 'balanced' as const,
  currentXP: 0,
  nextLevelXP: 10,
  useAI: false,
  language: 'pt-BR' as const,
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('CompanionHUD — o pet reage ao que você fez (WP3.8)', () => {
  it('não fala na montagem: abrir o app não é um evento', () => {
    renderWithCss(<CompanionHUD {...base} triggerMessage={0} />);
    expect(screen.queryByText('Que tal uma comidinha?')).toBeNull();
  });

  it('fala quando o pulso chega', () => {
    const { rerender } = renderWithCss(<CompanionHUD {...base} triggerMessage={0} />);
    rerender(<CompanionHUD {...base} triggerMessage={1} />);
    expect(screen.getByText('Que tal uma comidinha?')).toBeTruthy();
  });

  it('fala DE NOVO a cada pulso — treze ações do app mandam este sinal', () => {
    const { rerender } = renderWithCss(<CompanionHUD {...base} triggerMessage={1} />);
    rerender(<CompanionHUD {...base} message="Cocô limpo, obrigado!" triggerMessage={2} />);
    expect(screen.getByText('Cocô limpo, obrigado!')).toBeTruthy();
  });

  it('NÃO fala quando só a mensagem muda — o pulso é que autoriza', () => {
    // Esta é a metade que impede o bipe: `message` é derivado do estado (vida,
    // energia, sono, progresso) e muda o tempo todo. Se ele disparasse a fala,
    // o pet falaria sozinho a cada tick.
    const { rerender } = renderWithCss(<CompanionHUD {...base} triggerMessage={1} />);
    expect(screen.getByText('Que tal uma comidinha?')).toBeTruthy();
    rerender(<CompanionHUD {...base} message="Estou com sono…" triggerMessage={1} />);
    expect(screen.queryByText('Estou com sono…'), 'o pet falou sem ninguém ter feito nada').toBeNull();
  });

  it('a fala passa pelo `speak`: emoji não vai para o balão', () => {
    const { rerender } = renderWithCss(<CompanionHUD {...base} triggerMessage={0} />);
    rerender(<CompanionHUD {...base} message="🎈 Já brincamos hoje!" triggerMessage={1} />);
    expect(screen.getByText('Já brincamos hoje!')).toBeTruthy();
  });

  it('mensagem vazia não abre balão vazio', () => {
    const { rerender } = renderWithCss(<CompanionHUD {...base} message="" triggerMessage={0} />);
    rerender(<CompanionHUD {...base} message="" triggerMessage={1} />);
    expect(document.body.textContent).not.toContain('…');
  });
});
