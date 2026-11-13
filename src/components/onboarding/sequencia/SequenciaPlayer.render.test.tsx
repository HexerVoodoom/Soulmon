// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SequenciaPlayer } from './SequenciaPlayer';
import { aposPular } from './logic';
import { ROTEIRO } from './copy';
import { SEQUENCIA_VELADO } from './cenas';
import type { Quadro } from './types';

const cena = (en: string, pt = en): Quadro => ({ tipo: 'cena', fundo: 'bg-malha-clara', fala: { en, pt } });
const Q: Quadro[] = [cena('um'), cena('dois'), { tipo: 'slot', slot: 'puzzle' }, cena('tres')];

afterEach(cleanup);

describe('SequenciaPlayer', () => {
  it('avança por toque e termina com onDone', () => {
    const onDone = vi.fn();
    render(<SequenciaPlayer quadros={[cena('a'), cena('b')]} language="en-US" onDone={onDone} />);
    expect(screen.getByTestId('sequencia-fala').textContent).toBe('a');
    fireEvent.click(screen.getByTestId('sequencia-palco'));
    expect(screen.getByTestId('sequencia-fala').textContent).toBe('b');
    fireEvent.click(screen.getByTestId('sequencia-palco'));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('mostra a fala no idioma certo', () => {
    render(<SequenciaPlayer quadros={[cena('hi', 'oi')]} language="pt-BR" onDone={() => {}} />);
    expect(screen.getByTestId('sequencia-fala').textContent).toBe('oi');
  });

  it('Pular pula a fala mas para no slot; slot só avança via onDone', () => {
    const onDone = vi.fn();
    const onSlotDone = vi.fn();
    render(<SequenciaPlayer quadros={Q} language="en-US" onDone={onDone} onSlotDone={onSlotDone} />);
    fireEvent.click(screen.getByText('Skip'));
    expect(screen.getByTestId('slot-stub-puzzle')).toBeTruthy();
    expect(screen.queryByText('Skip')).toBeNull(); // sem Pular dentro do slot
    expect(onDone).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Continue'));
    expect(onSlotDone).toHaveBeenCalledWith('puzzle', undefined);
    expect(screen.getByTestId('sequencia-fala').textContent).toBe('tres');
  });

  it('slot customizado recebe onDone', () => {
    const Puzzle = ({ onDone }: { onDone: () => void }) => <button onClick={() => onDone()}>resolvi</button>;
    render(<SequenciaPlayer quadros={[{ tipo: 'slot', slot: 'duelo' }]} language="en-US" slots={{ duelo: Puzzle as never }} onDone={() => {}} />);
    expect(screen.getByText('resolvi')).toBeTruthy();
  });

  it('escolha guarda e avança; Pular não a atravessa', () => {
    const onChoice = vi.fn();
    const q: Quadro[] = [cena('x'), { tipo: 'escolha', pergunta: { en: 'Which?', pt: 'Qual?' }, opcoes: [{ id: 'luz', rotulo: { en: 'Lit', pt: 'Luz' } }] }];
    render(<SequenciaPlayer quadros={q} language="en-US" onDone={() => {}} onChoice={onChoice} />);
    fireEvent.click(screen.getByText('Skip'));
    fireEvent.click(screen.getByText('Lit'));
    expect(onChoice).toHaveBeenCalledWith('luz');
  });
});

describe('logica e roteiro', () => {
  it('aposPular na sequencia real nunca salta slot', () => {
    let i = 0; const vistos: string[] = [];
    while (i < SEQUENCIA_VELADO.length) {
      i = aposPular(SEQUENCIA_VELADO, i);
      if (i < SEQUENCIA_VELADO.length) { const q = SEQUENCIA_VELADO[i]; vistos.push(q.tipo === 'slot' ? q.slot : q.tipo); }
    }
    expect(vistos).toEqual(['puzzle', 'escolha', 'tarefa', 'duelo']);
  });
  it('todas as falas existem em EN e PT, cenas 0-9', () => {
    for (let c = 0; c <= 9; c++) {
      expect(ROTEIRO[`c${c}`]?.length).toBeGreaterThan(0);
      for (const f of ROTEIRO[`c${c}`]) { expect(f.en.length).toBeGreaterThan(0); expect(f.pt).not.toBe(f.en); }
    }
  });
});
