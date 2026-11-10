// @vitest-environment jsdom
/** A entrada do Soulsmith: texto curto + botão primário EN/PT que abre a Forja de Alma (ForgeCard). */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import SoulsmithSheet from './SoulsmithSheet';

vi.mock('./ForgeCard', () => ({ default: () => <div data-testid="forge" /> }));
installDomGlobals();
afterEach(cleanup);

describe('SoulsmithSheet', () => {
  it('EN: botão abre a forja', async () => {
    render(<SoulsmithSheet language="en-US" />);
    fireEvent.click(screen.getByRole('button', { name: 'Go to the Soul Forge' }));
    expect(await screen.findByTestId('forge')).toBeTruthy();
  });
  it('PT: rótulo localizado', () => {
    render(<SoulsmithSheet language="pt-BR" />);
    expect(screen.getByRole('button', { name: 'Ir para a Forja de Alma' })).toBeTruthy();
  });
});

describe('SoulsmithSheet com onGo', () => {
  it('o botão chama onGo (mapa em tela cheia) em vez de montar a lista', () => {
    const onGo = vi.fn();
    render(<SoulsmithSheet language="en-US" onGo={onGo} />);
    fireEvent.click(screen.getByRole('button', { name: 'Go to the Soul Forge' }));
    expect(onGo).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('forge')).toBeNull();
  });
});
