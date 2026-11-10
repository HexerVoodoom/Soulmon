// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, act, waitFor } from '@testing-library/react';
import { AreaTopBar } from '../components/nav/AreaTopBar';
import { modalDepth } from './modalDepth';

function Modal({ id }: { id: string }) { return <div role="dialog" aria-modal="true" data-m={id}><button>x</button></div>; }
const back = (c: HTMLElement) => c.querySelector('[data-area-back]') as HTMLButtonElement;
afterEach(cleanup);

describe('voltar esmaece com modal aberto', () => {
  it('0, 1 e 2 modais empilhados; reabilita ao fechar; sem vazamento', async () => {
    const { container, rerender } = render(<><AreaTopBar title="T" backLabel="Voltar" onBack={() => {}} /></>);
    expect(back(container).disabled).toBe(false);
    rerender(<><AreaTopBar title="T" backLabel="Voltar" onBack={() => {}} /><Modal id="a" /></>);
    await waitFor(() => expect(back(container).disabled).toBe(true));
    expect(back(container).hasAttribute('data-modal-dimmed')).toBe(true);
    rerender(<><AreaTopBar title="T" backLabel="Voltar" onBack={() => {}} /><Modal id="a" /><Modal id="b" /></>);
    expect(modalDepth()).toBe(2);
    rerender(<><AreaTopBar title="T" backLabel="Voltar" onBack={() => {}} /><Modal id="a" /></>);
    await act(async () => {});
    expect(back(container).disabled).toBe(true);
    rerender(<><AreaTopBar title="T" backLabel="Voltar" onBack={() => {}} /></>);
    await waitFor(() => expect(back(container).disabled).toBe(false));
    expect(modalDepth()).toBe(0);
  });
});
