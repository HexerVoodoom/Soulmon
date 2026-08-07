import { describe, it, expect } from 'vitest';
import { minimumViableHint } from './taskSuggestions';

describe('minimumViableHint — o gargalo é Habilidade, não Motivação', () => {
  it('sugere uma versão menor quando a tarefa é grande', () => {
    expect(minimumViableHint('Correr 10km', 'pt-BR')).toContain('1 km');
    expect(minimumViableHint('Estudar 45 minutos', 'pt-BR')).toContain('5 minutos');
    expect(minimumViableHint('Ler 30 páginas', 'pt-BR')).toContain('1 página');
    expect(minimumViableHint('Read 2 chapters', 'en-US')).toContain('1 page');
    expect(minimumViableHint('Meditar 2 horas', 'pt-BR')).toContain('10 minutos');
  });

  it('fica quieto quando a tarefa já é pequena', () => {
    expect(minimumViableHint('Correr 1km', 'pt-BR')).toBeNull();
    expect(minimumViableHint('Ler 5 páginas', 'pt-BR')).toBeNull();
    expect(minimumViableHint('Estudar 10 minutos', 'pt-BR')).toBeNull();
  });

  it('fica quieto quando não há número nem unidade conhecida', () => {
    expect(minimumViableHint('Beber água', 'pt-BR')).toBeNull();
    expect(minimumViableHint('', 'pt-BR')).toBeNull();
    expect(minimumViableHint('Tomar remédio 3', 'pt-BR')).toBeNull();
    expect(minimumViableHint('Correr 5 poodles', 'pt-BR')).toBeNull();
  });

  it('lê a unidade que vem DEPOIS do número', () => {
    // "30 dias" não é a unidade da tarefa — a unidade é km.
    expect(minimumViableHint('Correr 10km', 'pt-BR')).toContain('km');
    expect(minimumViableHint('Ler 1 página por 30 dias', 'pt-BR')).toBeNull();
  });

  it('responde no idioma pedido', () => {
    expect(minimumViableHint('Run 10km', 'en-US')).toMatch(/starting with/i);
    expect(minimumViableHint('Correr 10km', 'pt-BR')).toMatch(/começar com/i);
  });
});
