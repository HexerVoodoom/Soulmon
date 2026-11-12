import { describe, it, expect } from 'vitest';
import { CENAS } from './introCenas';
import { aposPular, INICIO, normalizar, proxima, quadroEm } from './introMaquina';
import { ehInterativo } from './introTipos';

describe('máquina de cenas da intro narrativa', () => {
  it('tem as 9 cenas do plano, todas com ao menos um quadro', () => {
    expect(CENAS).toHaveLength(9);
    for (const c of CENAS) expect(c.length).toBeGreaterThan(0);
  });

  it('anda quadro a quadro, atravessa cenas e termina em null', () => {
    let p: ReturnType<typeof proxima> = { ...INICIO };
    let passos = 1;
    while ((p = proxima(p!))) passos++;
    expect(passos).toBe(CENAS.reduce((n, c) => n + c.length, 0));
    expect(proxima({ cena: 9, quadro: 1 })).toBeNull();
    expect(proxima({ cena: 99, quadro: 0 })).toBeNull();
  });

  it('as etapas jogáveis são exatamente tarefa, alimentar, duelo e corda, nessa ordem', () => {
    const slots: string[] = [];
    let p: ReturnType<typeof proxima> = { ...INICIO };
    while (p) { const q = quadroEm(p)!; if (q.tipo === 'slot') slots.push(q.slot); p = proxima(p); }
    expect(slots).toEqual(['tarefa', 'alimentar', 'duelo', 'corda']);
  });

  it('Pular pula falas mas PARA em cada etapa jogável e só depois da última vai ao fim', () => {
    const paradas: string[] = [];
    let p: ReturnType<typeof aposPular> = { ...INICIO };
    while ((p = aposPular(p!))) { const q = quadroEm(p)!; expect(ehInterativo(q)).toBe(true); paradas.push((q as { slot: string }).slot); }
    expect(paradas).toEqual(['tarefa', 'alimentar', 'duelo', 'corda']);
    expect(aposPular({ cena: 6, quadro: 0 })).toBeNull();
  });

  it('normalizar nunca lança e devolve uma posição válida', () => {
    expect(normalizar(null)).toEqual(INICIO);
    expect(normalizar('lixo')).toEqual(INICIO);
    expect(normalizar({ cena: 0, quadro: 3 })).toEqual(INICIO);
    expect(normalizar({ cena: 10, quadro: 0 })).toEqual(INICIO);
    expect(normalizar({ cena: 'a', quadro: 'b' })).toEqual(INICIO);
    expect(normalizar({ cena: 2, quadro: 40 })).toEqual({ cena: 2, quadro: CENAS[1].length - 1 });
    expect(normalizar({ cena: 4, quadro: -3 })).toEqual({ cena: 4, quadro: 0 });
    expect(normalizar({ cena: 4, quadro: 2, tarefaId: 't1', alimentou: true })).toEqual({ cena: 4, quadro: 2, tarefaId: 't1', alimentou: true });
    expect(normalizar({ cena: 4, quadro: 2, tarefaId: 7, alimentou: 'sim' })).toEqual({ cena: 4, quadro: 2 });
  });
});
