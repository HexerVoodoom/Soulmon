// @vitest-environment jsdom
/** Início BB (dono, 17/11/2026): o grátis não tem botão de regenerar o personagem ("New Reading"/reroll). */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { CreditsModal } from './CreditsModal';

const base = { language: 'en-US' as const, credits: 500, canReroll: true, onWatchAd: async () => false, onBuyPack: async () => false, onReroll: () => {}, onClose: () => {} };

describe('CreditsModal — reroll só para conta paga', () => {
  it('free (demo): sem "New Reading", mesmo com perfil de oráculo no aparelho', () => {
    renderWithCss(<CreditsModal {...base} accountTier="demo" />);
    expect(screen.queryByText('New Reading')).toBeNull();
  });
  it('pago: "New Reading" aparece', () => {
    renderWithCss(<CreditsModal {...base} accountTier="paid" />);
    expect(screen.getByText('New Reading')).toBeTruthy();
  });
});
