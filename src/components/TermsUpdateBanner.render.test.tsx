// @vitest-environment jsdom
/**
 * O banner de Termos atualizados (decisão #24): informativo, com o documento
 * que mudou a um toque e um "Entendi" que devolve o controle ao App. Nada
 * aqui bloqueia, e o texto diz isso. Achados do design-critic (rodada A,
 * 21/09/2026) A1–A6: título por documento, corpo verificável, aviso de aba
 * nova, `region` rotulada, href por idioma, rótulo "Entendi/Got it".
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { TermsUpdateBanner } from './TermsUpdateBanner';

describe('TermsUpdateBanner', () => {
  it('PT, both: título dos dois, os dois links em aba nova e o "Entendi" chama onOk', () => {
    const onOk = vi.fn();
    renderWithCss(<TermsUpdateBanner language="pt-BR" changed="both" onOk={onOk} />);
    expect(screen.getByText(/Termos e a Política de Privacidade mudaram/)).toBeTruthy();
    expect(screen.getByText(/Você continua jogando normalmente/)).toBeTruthy();
    const termos = screen.getByRole('link', { name: /Ler os Termos \(abre em nova aba\)/ }) as HTMLAnchorElement;
    const politica = screen.getByRole('link', { name: /Ler a Política \(abre em nova aba\)/ }) as HTMLAnchorElement;
    expect(termos.getAttribute('href')).toBe('/termos.html');
    expect(politica.getAttribute('href')).toBe('/privacidade.html');
    expect(termos.getAttribute('target')).toBe('_blank');
    fireEvent.click(screen.getByRole('button', { name: 'Entendi' }));
    expect(onOk).toHaveBeenCalledTimes(1);
  });

  it('changed="terms": só o título e o link dos Termos', () => {
    renderWithCss(<TermsUpdateBanner language="pt-BR" changed="terms" onOk={() => {}} />);
    expect(screen.getByText('Os Termos de Uso mudaram')).toBeTruthy();
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link', { name: /Ler os Termos/ })).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Política/ })).toBeNull();
  });

  it('changed="privacy": só o título e o link da Política', () => {
    renderWithCss(<TermsUpdateBanner language="pt-BR" changed="privacy" onOk={() => {}} />);
    expect(screen.getByText('A Política de Privacidade mudou')).toBeTruthy();
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link', { name: /Ler a Política/ })).toBeTruthy();
  });

  it('sem `changed` cai em both (compatível com o chamador antigo)', () => {
    renderWithCss(<TermsUpdateBanner language="pt-BR" onOk={() => {}} />);
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('EN: o par existe, difere do PT, e os hrefs levam à âncora #en', () => {
    renderWithCss(<TermsUpdateBanner language="en-US" changed="both" onOk={() => {}} />);
    expect(screen.getByText(/Terms and the Privacy Policy changed/)).toBeTruthy();
    expect(screen.getByText(/You keep playing as usual/)).toBeTruthy();
    const termos = screen.getByRole('link', { name: /Read the Terms \(opens in a new tab\)/ });
    const politica = screen.getByRole('link', { name: /Read the Policy \(opens in a new tab\)/ });
    expect(termos.getAttribute('href')).toBe('/termos.html#en');
    expect(politica.getAttribute('href')).toBe('/privacidade.html#en');
    expect(screen.getByRole('button', { name: 'Got it' })).toBeTruthy();
    expect(screen.queryByText(/mudaram/)).toBeNull();
  });

  it('não é modal: é um cartão `sm2-notice` role="region" rotulado pelo título, sem dialog', () => {
    renderWithCss(<TermsUpdateBanner language="pt-BR" changed="both" onOk={() => {}} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
    const card = screen.getByRole('region', { name: 'Os Termos e a Política de Privacidade mudaram' });
    expect(card.className).toContain('sm2-notice');
    const titleId = card.getAttribute('aria-labelledby')!;
    expect(document.getElementById(titleId)?.textContent).toBe('Os Termos e a Política de Privacidade mudaram');
    // O "Entendi" é quieto: sair sem peso, e a leitura não é obrigatória.
    const ok = screen.getByRole('button', { name: 'Entendi' });
    expect(ok.style.background).toBe('none');
  });
});
