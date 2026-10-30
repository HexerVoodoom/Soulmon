// @vitest-environment jsdom
/** UM botão só na Feira (dono, 30/10/2026): desafio quando há; senão nenhum aqui; e "quando volta" calculado da virada do dia. */
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { FeiraMisterio } from './FeiraMisterio';
import { nextPlayerDayStart } from '../../utils/feira';

afterEach(cleanup);
const botoes = () => document.querySelectorAll('[data-feira-misterio] button');

describe('FeiraMisterio: um botão', () => {
  it('chefe: exatamente UM botão, o do desafio', () => {
    render(<FeiraMisterio language="en-US" resumo={{ state: 'boss', level: 3, bossId: 'arauto-do-fim', bossHpPct: 60 }} ocupado={false} onAbrir={() => {}} />);
    expect(botoes().length).toBe(1);
    expect(botoes()[0].textContent).toBe('Face the boss');
  });
  it('trilha: um botão; descanso: nenhum (a ação, se houver, é Investigar na sala)', () => {
    render(<FeiraMisterio language="pt-BR" resumo={{ state: 'trail', level: 2, marks: 1 }} ocupado={false} onAbrir={() => {}} />);
    expect(botoes().length).toBe(1);
    cleanup();
    render(<FeiraMisterio language="pt-BR" resumo={{ state: 'rest', level: 2 }} ocupado={false} onAbrir={() => {}} />);
    expect(botoes().length).toBe(0);
  });
});

describe('nextPlayerDayStart', () => {
  it('meia-noite da âncora, não do aparelho', () => {
    const now = new Date('2026-10-30T15:00:00Z');
    expect(nextPlayerDayStart(now, { offsetMs: -3 * 3600_000 }).toISOString()).toBe('2026-10-31T03:00:00.000Z');
    expect(nextPlayerDayStart(now, { offsetMs: 0 }).toISOString()).toBe('2026-10-31T00:00:00.000Z');
  });
});
