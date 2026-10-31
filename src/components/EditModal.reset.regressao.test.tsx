// @vitest-environment jsdom
/** QA-20: objeto novo do MESMO hábito (virada do dia, nuvem) não apaga o que se digitava. */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { EditModal } from './EditModal';

beforeEach(() => {
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
});
afterEach(() => cleanup());

const item = (id: string, name: string) => ({ id, name, category: 'Health', emoji: '💪' }) as never;
const input = () => document.querySelector('input[type="text"], input:not([type])') as HTMLInputElement;

describe('EditModal: reset chaveado por id', () => {
  it('mantém o texto digitado quando chega um objeto novo do mesmo item', () => {
    const { rerender } = render(<EditModal isOpen onClose={() => {}} onSave={() => {}} initialData={item('a', 'Correr')} />);
    fireEvent.change(input(), { target: { value: 'Correr mais' } });
    rerender(<EditModal isOpen onClose={() => {}} onSave={() => {}} initialData={item('a', 'Correr')} />);
    expect(input().value).toBe('Correr mais');
  });
  it('reseta ao trocar de item', () => {
    const { rerender } = render(<EditModal isOpen onClose={() => {}} onSave={() => {}} initialData={item('a', 'Correr')} />);
    fireEvent.change(input(), { target: { value: 'x' } });
    rerender(<EditModal isOpen onClose={() => {}} onSave={() => {}} initialData={item('b', 'Ler')} />);
    expect(input().value).toBe('Ler');
  });
});
