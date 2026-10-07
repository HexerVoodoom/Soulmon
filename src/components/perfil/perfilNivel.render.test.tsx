// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { ProfileAvatarButton } from './ProfileAvatarButton';
import { BondXpBar } from './BondXpBar';
import { bondProgress, bondLevelFor, xpForLevel, BOND_MAX_LEVEL } from '../../utils/bond';

describe('Perfil — nível do usuário (Vínculo)', () => {
  it('o selo "Lv N" vem de bondLevelFor e fica no canto inferior direito', () => {
    const xp = xpForLevel(7) + 3;
    const r = renderWithCss(<ProfileAvatarButton language="en-US" seed="s" level={bondLevelFor(xp)} onClick={() => {}} />);
    const badge = r.container.querySelector('[data-profile-level]') as HTMLElement;
    expect(badge.textContent).toBe('Lv 7');
    expect(badge.style.right).not.toBe('');
    expect(badge.style.bottom).not.toBe('');
    expect(screen.getByRole('button').getAttribute('aria-label')).toBe('Settings and profile, level 7');
  });
  it('PT usa "Nv" e sem level não há selo', () => {
    const a = renderWithCss(<ProfileAvatarButton language="pt-BR" seed="s" level={3} onClick={() => {}} />);
    expect(a.container.querySelector('[data-profile-level]')?.textContent).toBe('Nv 3');
    a.unmount();
    const b = renderWithCss(<ProfileAvatarButton language="pt-BR" seed="s" onClick={() => {}} />);
    expect(b.container.querySelector('[data-profile-level]')).toBeNull();
  });
});

describe('Perfil — barra de XP', () => {
  it('progressbar acessível com o progresso dentro do nível', () => {
    const xp = xpForLevel(4) + 5;
    const p = bondProgress(xp);
    renderWithCss(<BondXpBar totalXP={xp} language="en-US" />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-label')).toBe('Level 4 experience');
    expect(bar.getAttribute('aria-valuenow')).toBe(String(Math.round(p.ratio * 100)));
    expect(bar.getAttribute('aria-valuetext')).toBe(`${p.into} / ${p.need} XP`);
  });
  it('PT tem rótulo próprio; no nível máximo fica cheia e diz Max', () => {
    renderWithCss(<BondXpBar totalXP={xpForLevel(BOND_MAX_LEVEL) + 10} language="pt-BR" />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-label')).toBe(`Experiência do nível ${BOND_MAX_LEVEL}`);
    expect(bar.getAttribute('aria-valuenow')).toBe('100');
    expect(screen.getByText('Max')).toBeTruthy();
  });
});
