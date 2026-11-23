// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { render, screen, cleanup } from '@testing-library/react';
import { ModalSheet } from './FormKit';

/**
 * Bug do dono (23/11/2026): o Perfil (folha "Edit profile" aberta pelo menu › Configurações) ficou SEM voltar visível: a linha do ✕/voltar do `ModalSheet`
 * em folha de baixo com moldura ficava sob a arte do topo (z 2). A linha agora tem classe própria e sobe (z 4) no vão entre o cristal e a placa.
 */
const CSS = readFileSync('src/index.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

describe('ModalSheet com moldura: voltar/fechar visível', () => {
  afterEach(cleanup);
  it('folha de baixo: há Fechar e ele mora na linha `sm2-modal-fechar-linha`', () => {
    render(<ModalSheet open onClose={() => {}} language="en-US" title="Edit profile"><p>x</p></ModalSheet>);
    const fechar = screen.getByRole('button', { name: 'Close' });
    expect(fechar.closest('.sm2-modal-fechar-linha')).not.toBeNull();
    expect(document.querySelector('.sm2-moldura-sheet')).not.toBeNull();
  });
  it('com onBack, o botão é Voltar na mesma linha', () => {
    render(<ModalSheet open onClose={() => {}} onBack={() => {}} language="pt-BR" title="Perfil"><p>x</p></ModalSheet>);
    expect(screen.getByRole('button', { name: 'Voltar' }).closest('.sm2-modal-fechar-linha')).not.toBeNull();
  });
  it('CSS: a linha do ✕ da folha com moldura fica ACIMA da arte (z-index maior que o 2 da moldura)', () => {
    const regra = /\.sm2-moldura-sheet \.sm2-modal-fechar-linha\s*\{([^}]*)\}/.exec(CSS);
    expect(regra, 'regra .sm2-moldura-sheet .sm2-modal-fechar-linha ausente').not.toBeNull();
    const z = /z-index:\s*(\d+)/.exec(regra![1]);
    expect(z && Number(z[1]) > 2, 'o voltar precisa ficar sobre a arte (z > 2)').toBe(true);
    expect(regra![1]).toMatch(/position:\s*relative/);
  });
  it('closeSide none: sem linha de fechar (onboarding)', () => {
    render(<ModalSheet open onClose={() => {}} closeSide="none" dismissOnBackdrop={false} language="en-US" title="x"><p>x</p></ModalSheet>);
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });
});
