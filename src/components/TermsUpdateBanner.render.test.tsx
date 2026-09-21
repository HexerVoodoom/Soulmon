// @vitest-environment jsdom
/**
 * O banner de Termos atualizados (decisão #24): informativo, com os dois
 * documentos a um toque e um "Ok" que devolve o controle ao App. Nada aqui
 * bloqueia, e o texto diz isso.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { TermsUpdateBanner } from './TermsUpdateBanner';

describe('TermsUpdateBanner', () => {
  it('PT: título, os dois links em aba nova e o "Ok" chama onOk', () => {
    const onOk = vi.fn();
    renderWithCss(<TermsUpdateBanner language="pt-BR" onOk={onOk} />);
    expect(screen.getByText(/Termos e a Política de Privacidade mudaram/)).toBeTruthy();
    expect(screen.getByText(/Nada muda no seu jogo/)).toBeTruthy();
    const termos = screen.getByRole('link', { name: /Ler os Termos/ }) as HTMLAnchorElement;
    const politica = screen.getByRole('link', { name: /Ler a Política/ }) as HTMLAnchorElement;
    expect(termos.getAttribute('href')).toBe('/termos.html');
    expect(politica.getAttribute('href')).toBe('/privacidade.html');
    expect(termos.getAttribute('target')).toBe('_blank');
    fireEvent.click(screen.getByRole('button', { name: 'Ok' }));
    expect(onOk).toHaveBeenCalledTimes(1);
  });

  it('EN: o par existe e difere do PT', () => {
    renderWithCss(<TermsUpdateBanner language="en-US" onOk={() => {}} />);
    expect(screen.getByText(/Terms and the Privacy Policy changed/)).toBeTruthy();
    expect(screen.getByRole('link', { name: /Read the Terms/ })).toBeTruthy();
    expect(screen.queryByText(/mudaram/)).toBeNull();
  });

  it('não é modal: é um cartão `sm2-notice` com role="status", sem dialog', () => {
    renderWithCss(<TermsUpdateBanner language="pt-BR" onOk={() => {}} />);
    expect(screen.queryByRole('dialog')).toBeNull();
    const card = screen.getByRole('status');
    expect(card.className).toContain('sm2-notice');
    // O "Ok" é quieto: sair sem peso, e a leitura não é obrigatória.
    const ok = screen.getByRole('button', { name: 'Ok' });
    expect(ok.style.background).toBe('none');
  });
});
