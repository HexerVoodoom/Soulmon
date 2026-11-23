// @vitest-environment jsdom
/** Plaquinha do Rift: a ação principal é IR até a Fenda; trazê-lo de volta segue possível, como ação secundária com confirmação. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { DungeonBusyModal } from './DungeonBusyModal';

const q = (s: string) => document.querySelector(s) as HTMLElement | null;
describe('DungeonBusyModal (plaquinha)', () => {
  afterEach(cleanup);
  it('"Ir à Fenda" chama onGo; não retira', () => {
    const onGo = vi.fn(), onRetire = vi.fn();
    render(<DungeonBusyModal open acao={null} language="pt-BR" onRetire={onRetire} onGo={onGo} onClose={() => {}} />);
    expect(q('[data-dungeon-busy-go]')?.textContent).toBe('Ir à Fenda');
    fireEvent.click(q('[data-dungeon-busy-go]')!);
    expect(onGo).toHaveBeenCalledTimes(1);
    expect(onRetire).not.toHaveBeenCalled();
  });
  it('en-US: "Go to the Rift"', () => {
    render(<DungeonBusyModal open acao={null} language="en-US" onRetire={() => {}} onGo={() => {}} onClose={() => {}} />);
    expect(q('[data-dungeon-busy-go]')?.textContent).toBe('Go to the Rift');
  });
  it('retirar continua possível: "Trazer de volta" pede confirmação e só então chama onRetire', () => {
    const onRetire = vi.fn();
    render(<DungeonBusyModal open acao={null} language="pt-BR" onRetire={onRetire} onGo={() => {}} onClose={() => {}} />);
    fireEvent.click(q('[data-dungeon-busy-bring]')!);
    expect(onRetire).not.toHaveBeenCalled();
    expect(q('[data-dungeon-busy-go]')).toBeNull();
    fireEvent.click(q('[data-dungeon-busy-retire]')!);
    expect(onRetire).toHaveBeenCalledTimes(1);
  });
});
