// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { MissionsLink } from './MissionsLink';
import { HomeFeedbackButton } from './HomeFeedbackButton';
import { homeFeedbackMailto, REVISOR_EMAIL } from '../FeedbackLink';

describe('Missões no Mapa (row 0)', () => {
  it('renderiza no canto (row 0) com a marca e abre a folha ao tocar', () => {
    const onClick = vi.fn();
    const { container } = render(<MissionsLink mark="available" row={0} label="Missões" markLabel="Missão disponível" onClick={onClick} />);
    const b = container.querySelector('[data-missions-link]') as HTMLButtonElement;
    expect(b.getAttribute('data-missions-row')).toBe('0');
    expect(b.getAttribute('data-mission-mark-home')).toBe('available');
    expect(b.getAttribute('aria-label')).toBe('Missões, Missão disponível');
    fireEvent.click(b);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('Feedback da Home', () => {
  it('mailto PT: destino, assunto e corpo codificados', () => {
    const url = homeFeedbackMailto({ language: 'pt-BR', platform: 'android' });
    expect(url.startsWith(`mailto:${REVISOR_EMAIL}?subject=`)).toBe(true);
    expect(REVISOR_EMAIL).toBe('soulmon.revisor@gmail.com');
    const q = new URLSearchParams(url.split('?')[1]);
    expect(q.get('subject')).toBe('Feedback e bug report');
    const body = q.get('body')!;
    expect(body).toContain('O que aconteceu:');
    expect(body).toContain('O que você esperava:');
    expect(body).toContain('Plataforma: Android');
    expect(body).toMatch(/Versão: \S+/);
    expect(url).not.toMatch(/ /);
    expect(url).toContain('Feedback%20e%20bug%20report');
  });
  it('mailto EN: assunto com & codificado', () => {
    const url = homeFeedbackMailto({ language: 'en-US', platform: 'web' });
    expect(url).toContain('subject=Feedback%20%26%20bug%20report');
    const q = new URLSearchParams(url.split('?')[1]);
    expect(q.get('body')).toContain('Platform: web');
    expect(q.get('body')).toContain('What you expected:');
  });
  it('botão só-ícone com aria-label e href mailto, sem texto visível', () => {
    const { container } = render(<HomeFeedbackButton language="pt-BR" />);
    const a = container.querySelector('[data-home-feedback]') as HTMLAnchorElement;
    expect(a.getAttribute('aria-label')).toBe('Enviar feedback ou reportar bug');
    expect(a.getAttribute('href')).toMatch(/^mailto:soulmon\.revisor@gmail\.com\?/);
    expect(a.getAttribute('target')).toBeNull();
    expect(a.textContent).toBe('');
    expect(a.querySelector('svg')).not.toBeNull();
    // Acima da cena do pet (`sm-pet-sticky`, z 5, depois no DOM): com 5 o ícone ficava invisível e sem toque.
    expect(Number(a.style.zIndex)).toBeGreaterThan(5);
  });
});

describe('Feedback da Home: ícone', () => {
  it('besouro em CONTORNO (Outlined, viewBox 960) dentro do círculo do anel de canto', () => {
    const { container } = render(<HomeFeedbackButton language="pt-BR" />);
    const a = container.querySelector('[data-home-feedback]') as HTMLAnchorElement;
    expect(a.style.borderRadius).toBe('50%');
    expect(a.style.width).toBe('44px');
    const svg = a.querySelector('svg[data-bug-outline]') as SVGElement;
    expect(svg.getAttribute('viewBox')).toBe('0 -960 960 960');
  });
});
