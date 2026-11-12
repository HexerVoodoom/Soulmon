import { describe, it, expect } from 'vitest';
import { atividadeEmCurso, estaOcioso, focoEmAndamento, type SinaisAtividade } from './atividadeEmCurso';

const ocioso: SinaisAtividade = { view: 'home', naMasmorra: false, foco: null, modais: 0 };

describe('atividadeEmCurso (gate ocioso da Vesca)', () => {
  it('Home, Mapa e áreas que não são atividade são ociosas', () => {
    for (const view of ['home', 'map', 'area:laboratorio', 'area:mercado', 'area:forja', 'area:hall', 'page:settings']) {
      expect(estaOcioso({ ...ocioso, view }), view).toBe(true);
    }
  });
  it('masmorra (calabouço, fenda, passeio), arena e minigames seguram a pergunta', () => {
    expect(atividadeEmCurso({ ...ocioso, view: 'area:exploracao' })).toBe('area');
    expect(atividadeEmCurso({ ...ocioso, view: 'area:arena' })).toBe('area');
    expect(atividadeEmCurso({ ...ocioso, view: 'area:jogos' })).toBe('area');
    expect(atividadeEmCurso({ ...ocioso, naMasmorra: true })).toBe('masmorra');
  });
  it('foco rodando ou pausado segura; terminado libera', () => {
    expect(atividadeEmCurso({ ...ocioso, foco: { status: 'running' } })).toBe('foco');
    expect(atividadeEmCurso({ ...ocioso, foco: { status: 'paused' } })).toBe('foco');
    expect(focoEmAndamento({ status: 'ended' })).toBe(false);
    expect(estaOcioso({ ...ocioso, foco: { status: 'ended' } })).toBe(true);
  });
  it('qualquer modal aberto (combate, celebração, folha) segura', () => {
    expect(atividadeEmCurso({ ...ocioso, modais: 1 })).toBe('modal');
  });
});
