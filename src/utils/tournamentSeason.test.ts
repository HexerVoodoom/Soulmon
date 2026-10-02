import { describe, it, expect } from 'vitest';
import {
  getTournamentWindow, tournamentWindowLabel, ROUND_START_DAY, ROUND_LENGTH_DAYS,
} from './tournamentSeason';

// Agosto/2026: 7 = sexta, 8 = sábado, 9 = domingo, 10 = segunda.
const at = (day: number, hour = 12) => new Date(2026, 7, day, hour, 0, 0);

describe('rodada do torneio', () => {
  it('abre na sexta e vai até domingo', () => {
    expect(at(7).getDay()).toBe(ROUND_START_DAY);
    expect(getTournamentWindow(at(7)).isOpen).toBe(true);
    expect(getTournamentWindow(at(8)).isOpen).toBe(true);
    expect(getTournamentWindow(at(9)).isOpen).toBe(true);
  });

  it('fica fechada de segunda a quinta', () => {
    for (const d of [10, 11, 12, 13]) {
      expect(getTournamentWindow(at(d)).isOpen).toBe(false);
    }
  });

  it('conta os dias que faltam da rodada', () => {
    expect(getTournamentWindow(at(7)).daysLeft).toBe(ROUND_LENGTH_DAYS);
    expect(getTournamentWindow(at(9)).daysLeft).toBe(1);
  });

  it('conta os dias até a próxima', () => {
    expect(getTournamentWindow(at(10)).daysUntilNext).toBe(4); // segunda → sexta
    expect(getTournamentWindow(at(13)).daysUntilNext).toBe(1); // quinta → sexta
  });

  it('a janela é de DIAS, nunca de horas — a hora do dia não muda nada', () => {
    // Evento de poucas horas exclui quem trabalha; foi uma das queixas mais
    // citadas contra o Pokémon GO.
    for (const h of [0, 6, 13, 23]) {
      expect(getTournamentWindow(at(8, h)).isOpen).toBe(true);
      expect(getTournamentWindow(at(11, h)).isOpen).toBe(false);
    }
  });

  it('o texto é MÍNIMO: "Dias restantes: N" na rodada, "Próxima rodada: N dias" fora', () => {
    expect(tournamentWindowLabel(getTournamentWindow(at(7)), 'pt-BR')).toBe('Dias restantes: 3');
    expect(tournamentWindowLabel(getTournamentWindow(at(7)), 'en-US')).toBe('Remaining days: 3');
    expect(tournamentWindowLabel(getTournamentWindow(at(9)), 'pt-BR')).toBe('Dia restante: 1');
    expect(tournamentWindowLabel(getTournamentWindow(at(9)), 'en-US')).toBe('Remaining day: 1');
    expect(tournamentWindowLabel(getTournamentWindow(at(10)), 'pt-BR')).toBe('Próxima rodada: 4 dias');
    expect(tournamentWindowLabel(getTournamentWindow(at(13)), 'pt-BR')).toBe('Próxima rodada: 1 dia');
    expect(tournamentWindowLabel(getTournamentWindow(at(13)), 'en-US')).toBe('Next round: 1 day');
    expect(tournamentWindowLabel(getTournamentWindow(at(10)), 'en-US')).toBe('Next round: 4 days');
  });

  it('o convite nunca cobra presença', () => {
    for (const d of [7, 8, 9, 10, 11, 12, 13]) {
      const label = tournamentWindowLabel(getTournamentWindow(at(d)), 'pt-BR');
      expect(label).not.toMatch(/você precisa|não perca|última chance|corra|urgente/i);
    }
  });
});
