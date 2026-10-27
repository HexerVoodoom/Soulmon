import { describe, it, expect } from 'vitest';
import { tendGate, tendFalaLilia, tendLinhaAntes } from './groveTend';

describe('a regra de cuidar do Bosque', () => {
  it('meta cumprida: liberado', () => {
    expect(tendGate({ metaCumprida: true, goal: { done: 3, heart: 3 }, pendentes: [] })).toEqual({ liberado: true, restam: 0, nomes: [] });
  });
  it('1 e 2 restando citam as tarefas; 5 só contam', () => {
    const um = tendGate({ metaCumprida: false, goal: { done: 2, heart: 3 }, pendentes: ['Ler'] });
    expect(tendFalaLilia('pt-BR', um)).toBe('Você ainda precisa terminar Ler para cuidar do Bosque');
    const dois = tendGate({ metaCumprida: false, goal: { done: 1, heart: 3 }, pendentes: ['A', 'B', 'C'] });
    expect(tendFalaLilia('en-US', dois)).toBe('You still need to finish A and B to tend the Grove');
    expect(tendLinhaAntes('en-US', 2)).toBe("Finish today's tasks to tend the Grove (2 left)");
    const cinco = tendGate({ metaCumprida: false, goal: { done: 0, heart: 5 }, pendentes: ['a', 'b', 'c', 'd', 'e'] });
    expect(tendFalaLilia('en-US', cinco)).toBe('You still need to finish 5 tasks to tend the Grove');
    expect(tendFalaLilia('pt-BR', cinco)).toBe('Faltam 5 tarefas para você poder cuidar do Bosque');
  });
  it('sem nomes conhecidos cai na contagem, nunca em 0', () => {
    const g = tendGate({ metaCumprida: false });
    expect(g.restam).toBe(1);
    expect(tendFalaLilia('en-US', g)).toBe('You still need to finish 1 task to tend the Grove');
  });
});
