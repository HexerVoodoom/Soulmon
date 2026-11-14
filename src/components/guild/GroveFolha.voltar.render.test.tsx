// @vitest-environment jsdom
/**
 * REGRESSÃO (13/11/2026): no Bosque, a folha cheia do panorama (`GroveFolha`, os Soulmons do clã + as árvores plantadas)
 * abria com o VOLTAR desabilitado e o jogador ficava preso.
 *
 * Causa: a folha é um PORTAL no `<body>` aberta de DENTRO da `AreaSheet` do Salão (outro `aria-modal`). O `useBackDimmed`
 * contava como "modal por cima" todo `aria-modal` que não CONTÉM o botão — e a `AreaSheet` de BAIXO não contém o botão
 * do portal. Resultado: `disabled` no único voltar da tela de cima. Aqui a forma do DOM é a mesma da produção: a moldura
 * modal da `AreaSheet` e, como irmão no `<body>`, o portal da folha.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, waitFor, fireEvent, act } from '@testing-library/react';

vi.mock('../../utils/claApi', async (orig) => ({
  ...(await orig<typeof import('../../utils/claApi')>()),
  getPlantio: vi.fn(() => new Promise(() => {})), // carregando para sempre: a saída não pode depender da rede
}));

import { GroveFolha } from './GroveFolha';
import { closeTopBackLayer } from '../../utils/backStack';

afterEach(cleanup);

const guild = { size: 1, members: [], bosque: { stage: null, stageIndex: 0, perto: false, tide: { key: 'T1', size: null }, ornaments: [] } } as never;

function Salao({ aberta, onClose }: { aberta: boolean; onClose: () => void }) {
  return (
    <div role="dialog" aria-modal="true" aria-label="Salão" data-area-sheet-frame>
      <button type="button" data-salao-fechar>x</button>
      {aberta && <GroveFolha saveId="save-12345678" language="pt-BR" guild={guild} mySprite="" reducedMotion arvores={{}} onClose={onClose} />}
    </div>
  );
}

const voltar = () => document.querySelector('[data-grove-fechar]') as HTMLButtonElement;

describe('Bosque: o voltar da folha cheia nunca prende o jogador', () => {
  it('aberta de dentro da folha do Salão (portal sobre outro aria-modal): voltar HABILITADO e fecha', async () => {
    const onClose = vi.fn();
    render(<Salao aberta onClose={onClose} />);
    await waitFor(() => expect(voltar()).toBeTruthy());
    await act(async () => {});
    expect(voltar().disabled).toBe(false);
    expect(voltar().hasAttribute('data-modal-dimmed')).toBe(false);
    fireEvent.click(voltar());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('o voltar do sistema (Android/navegador) também fecha a folha', async () => {
    const onClose = vi.fn();
    render(<Salao aberta onClose={onClose} />);
    await waitFor(() => expect(voltar()).toBeTruthy());
    await act(async () => { closeTopBackLayer(); });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('a regra do dono continua: o voltar do Salão (de baixo) esmaece enquanto a folha do Bosque está por cima', async () => {
    render(<Salao aberta onClose={() => {}} />);
    await waitFor(() => expect(voltar()).toBeTruthy());
    const fecharSalao = document.querySelector('[data-salao-fechar]') as HTMLButtonElement;
    expect(fecharSalao).toBeTruthy();
    // `fecharSalao` não usa o hook; a conferência da regra é no próprio `modalsAbove`.
    const { modalsAbove } = await import('../../utils/modalDepth');
    expect(modalsAbove(fecharSalao)).toBe(1);
    expect(modalsAbove(voltar())).toBe(0);
  });
});
