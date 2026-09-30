// @vitest-environment jsdom
/**
 * QA (rodada A, 21/09/2026) — o que `TermsUpdateBanner.render.test.tsx` não
 * prende: `rel="noopener noreferrer"` nos DOIS links (aba nova sem `opener`),
 * "Ok" chamado UMA vez por clique (e não por render), EN sem vazamento de PT.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { TermsUpdateBanner } from './TermsUpdateBanner';

describe('TermsUpdateBanner — QA', () => {
  it.each(['pt-BR', 'en-US'] as const)('%s: os dois links abrem em aba nova com rel noopener noreferrer', (lang) => {
    renderWithCss(<TermsUpdateBanner language={lang} changed="both" onOk={() => {}} />);
    const links = screen.getAllByRole('link') as HTMLAnchorElement[];
    expect(links).toHaveLength(2);
    for (const a of links) {
      expect(a.getAttribute('target'), a.href).toBe('_blank');
      expect(a.getAttribute('rel'), a.href).toContain('noopener');
      expect(a.getAttribute('rel'), a.href).toContain('noreferrer');
      expect(a.getAttribute('aria-label'), a.href).toMatch(/abre em nova aba|opens in a new tab/);
    }
    const sufixo = lang === 'en-US' ? '' : '#pt';
    expect(links.map(a => a.getAttribute('href')).sort()).toEqual([`/privacidade.html${sufixo}`, `/termos.html${sufixo}`]);
  });

  it('"Entendi" não dispara no render; um clique = uma chamada; dois cliques = duas (o App decide esconder)', () => {
    const onOk = vi.fn();
    renderWithCss(<TermsUpdateBanner language="pt-BR" onOk={onOk} />);
    expect(onOk).not.toHaveBeenCalled();
    const ok = screen.getByRole('button', { name: 'Entendi' });
    fireEvent.click(ok);
    expect(onOk).toHaveBeenCalledTimes(1);
    fireEvent.click(ok);
    expect(onOk).toHaveBeenCalledTimes(2);
    expect(ok.getAttribute('type')).toBe('button');
  });

  it('EN: nenhuma palavra em PT vaza (Termos/Política/Ler)', () => {
    const { container } = renderWithCss(<TermsUpdateBanner language="en-US" onOk={() => {}} />);
    expect(container.textContent).not.toMatch(/Termos|Política|Ler |mudaram|Nada muda|Entendi|continua jogando/);
    expect(container.textContent).toMatch(/Read the Terms/);
    expect(container.textContent).toMatch(/Read the Policy/);
  });

  it('idioma desconhecido cai em inglês (base), não em PT', () => {
    const { container } = renderWithCss(<TermsUpdateBanner language={'xx' as never} onOk={() => {}} />);
    expect(container.textContent).toMatch(/The Terms and the Privacy Policy changed/);
  });
});
