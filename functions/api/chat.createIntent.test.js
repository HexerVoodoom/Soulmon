/**
 * C8 (navegação do dono, 01/10/2026): conversa casual NÃO cria hábito.
 * A regra antiga casava "what's new?" e "I renewed my passport" e criava uma
 * atividade na lista sem a pessoa pedir.
 */
import { describe, it, expect } from 'vitest';
import { detectCreateIntent } from './chat.js';

describe('detectCreateIntent — só pedido explícito cria atividade', () => {
  it.each([
    "what's new today?",
    'I renewed my passport',
    'add some salt to the soup',
    'my address changed',
    'I know you can create anything',
    "don't add a task for reading",
    'quero ler mais todo dia',
    '',
  ])('não cria: %s', (msg) => {
    expect(detectCreateIntent(msg)).toBeNull();
  });

  it('cria com pedido explícito e usa o resto da frase como nome', () => {
    expect(detectCreateIntent('add a habit to read 10 pages')).toEqual({ name: 'read 10 pages', category: 'Study' });
    expect(detectCreateIntent('create a task called go to the gym')).toEqual({ name: 'go to the gym', category: 'Fitness' });
  });

  it('pedido sem nome não inventa "New Activity"', () => {
    expect(detectCreateIntent('add a task')).toBeNull();
  });
});
