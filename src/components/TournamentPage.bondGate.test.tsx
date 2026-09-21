// @vitest-environment jsdom
/**
 * O gate de PvP no CLIENTE — que é experiência, não trava.
 *
 * A trava é do servidor (`functions/api/community.js` + `_bond.js`): só ela é
 * inforjável. O que o cliente deve fazer é NÃO OFERECER o que ainda não está
 * disponível, e dizer por quê — botão que aceita o toque e some em silêncio é
 * pior que botão desligado.
 *
 * E o outro lado, que não é sobre nível nenhum: ligar o PvP põe o NICK DA
 * PESSOA numa lista pública (`action=players` devolve `name` para qualquer um).
 * Consentimento sem informação não é consentimento — o aviso precisa estar na
 * tela ANTES do gesto, não num termo que ninguém abre.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { TournamentPage } from './TournamentPage';
import { xpForLevel, BOND_PVP_MIN_LEVEL } from '../utils/bond';

const props = {
  saveId: 'a'.repeat(32),
  petStage: 'rookie',
  pvpEnabled: false,
  onTogglePvp: () => {},
  onMatchPlayed: () => {},
  trophies: [],
  language: 'pt-BR',
  emblems: 0,
  onEarnEmblems: () => {},
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
});
// Sem `globals: true` no vitest.config não há limpeza automática — e sem ela
// o DOM do teste anterior sobra e o `getByRole` acha dois interruptores.
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('o PvP só é OFERECIDO a partir do Vínculo 5', () => {
  it('abaixo do nível, o interruptor está inerte (aria-disabled, fora do Tab) e a tela diz o que falta', () => {
    // Inerte por FORMA, não por `disabled` nativo nem opacidade (canvas Jogos
    // D-J14): `aria-disabled` + `tabIndex=-1`, borda tracejada.
    render(<TournamentPage {...props} totalXP={0} />);
    const sw = screen.getByRole('switch', { name: /PvP/i });
    expect(sw.getAttribute('aria-disabled')).toBe('true');
    expect(sw.getAttribute('tabindex')).toBe('-1');
    expect(sw.style.opacity).toBe('');
    expect(screen.getByText(new RegExp(`Vínculo ${BOND_PVP_MIN_LEVEL}`))).toBeTruthy();
  });

  it('no nível 5, o interruptor está disponível', () => {
    render(<TournamentPage {...props} totalXP={xpForLevel(BOND_PVP_MIN_LEVEL)} />);
    expect(screen.getByRole('switch', { name: /PvP/i }).hasAttribute('aria-disabled')).toBe(false);
  });

  it('quem JÁ ligou continua com o interruptor disponível para desligar', () => {
    // A decisão do dono: o gate vale para LIGAR. Travar aqui prenderia a pessoa
    // dentro de uma lista pública da qual ela quer sair — o pior resultado
    // possível de um gate de consentimento.
    render(<TournamentPage {...props} pvpEnabled totalXP={0} />);
    expect(screen.getByRole('switch', { name: /PvP/i }).hasAttribute('aria-disabled')).toBe(false);
  });
});

describe('o nick vai para uma lista pública, e isso é dito', () => {
  it('o aviso do nick público aparece junto do interruptor', () => {
    render(<TournamentPage {...props} totalXP={xpForLevel(BOND_PVP_MIN_LEVEL)} />);
    expect(screen.getByText(/lista pública/i)).toBeTruthy();
  });

  it('o aviso está em inglês quando o idioma é inglês', () => {
    render(<TournamentPage {...props} language="en-US" totalXP={xpForLevel(BOND_PVP_MIN_LEVEL)} />);
    expect(screen.getByText(/public list/i)).toBeTruthy();
  });
});
