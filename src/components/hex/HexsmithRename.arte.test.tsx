// @vitest-environment jsdom
/** Arte dos botões de renomear (11/11/2026): com os slots preenchidos o botão usa a imagem, não o SVG generativo. */
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { HexRenameButton } from './HexRenameButton';
import { HEXSMITH_RENAME_ART } from '../../assets/soulmon/hexsmith';

afterEach(cleanup);

describe('arte dos botões de renomear da Hexsmith', () => {
  it('os dois slots têm arquivo', () => {
    expect(HEXSMITH_RENAME_ART.lapis).toBeTruthy();
    expect(HEXSMITH_RENAME_ART.chama).toBeTruthy();
  });
  it.each([['pet'], ['especial']] as const)('%s usa a imagem e não o SVG generativo', (kind) => {
    const { container } = render(<HexRenameButton kind={kind} label="x" x={10} y={10} onClick={() => {}} />);
    expect(container.querySelector(`[data-hex-rename-art="${kind}"]`)).not.toBeNull();
    expect(container.querySelector(`[data-hex-rename-generative="${kind}"]`)).toBeNull();
  });
});
