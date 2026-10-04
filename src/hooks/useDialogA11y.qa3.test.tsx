// @vitest-environment jsdom
/**
 * QA3 — Esc e diálogos EMPILHADOS.
 *  · todo `useDialogA11y` ouve o Esc no `document` (captura): `stopPropagation` não
 *    impede os OUTROS ouvintes do mesmo nó — o Esc fechava a pilha INTEIRA de uma vez
 *    (ex.: lightbox do cenário + folha do item; confirmação + folha). Só o diálogo do TOPO fecha.
 *  · o `InfoTip` aberto dentro de um modal prometia "Esc fecha SÓ a dica", mas o ouvinte do
 *    modal (registrado antes, mesmo nó) rodava primeiro e fechava o modal junto.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ModalSheet } from '../components/form/FormKit';
import { InfoTip } from '../components/ui/InfoTip';

afterEach(cleanup);

describe('Esc com diálogos empilhados', () => {
  it('fecha SÓ o de cima', () => {
    const baixo = vi.fn(); const cima = vi.fn();
    render(<>
      <ModalSheet open title="Baixo" onClose={baixo} language="pt-BR">a</ModalSheet>
      <ModalSheet open title="Cima" onClose={cima} language="pt-BR">b</ModalSheet>
    </>);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(cima).toHaveBeenCalledTimes(1);
    expect(baixo).not.toHaveBeenCalled();
  });
});

describe('InfoTip dentro de um modal', () => {
  it('Esc com a dica aberta fecha só a dica; o seguinte fecha o modal', () => {
    const onClose = vi.fn();
    render(<ModalSheet open title="Folha" onClose={onClose} language="pt-BR"><InfoTip language="pt-BR" label="Ajuda">dica</InfoTip></ModalSheet>);
    fireEvent.click(screen.getByRole('button', { name: 'Ajuda' }));
    expect(screen.getByRole('note')).toBeTruthy();
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(screen.queryByRole('note')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
