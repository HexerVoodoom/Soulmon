// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SoulBarrage } from './SoulBarrage';

describe('SoulBarrage (render)', () => {
  it('abre muda, com o canvas e o botão de começar, em EN e PT', () => {
    const { container, unmount } = render(<SoulBarrage evolutionStage="rookie" language="en-US" onEarnPoints={() => {}} onExit={() => {}} />);
    expect(container.querySelector('[data-barrage-canvas]')).not.toBeNull();
    expect(screen.getByText('Start')).toBeTruthy();
    expect(container.querySelector('audio')).toBeNull();
    unmount();
    render(<SoulBarrage evolutionStage="rookie" language="pt-BR" onEarnPoints={() => {}} onExit={() => {}} />);
    expect(screen.getByText('Começar')).toBeTruthy();
  });
});
