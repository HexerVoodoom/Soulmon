// @vitest-environment jsdom
/**
 * A6 da revisão de psicologia: o convite de descer NUNCA mostra "descer" nem
 * "Nível 1"/"Level 1" na tela, em nenhum idioma.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { CatalogLevelInviteModal } from './CatalogLevelInviteModal';

const PALAVRAS_PROIBIDAS = /descer|n[íi]vel\s*1|level\s*1/i;

describe('CatalogLevelInviteModal — direction=down', () => {
  it('PT: nenhum texto da tela contém "descer" ou "Nível 1"', () => {
    renderWithCss(
      <CatalogLevelInviteModal isOpen direction="down" itemName="Caminhar" language="pt-BR" onAccept={vi.fn()} onDecline={vi.fn()} />,
    );
    expect(document.body.textContent).not.toMatch(PALAVRAS_PROIBIDAS);
  });

  it('EN: nenhum texto da tela contém "down" (como verbo de nível) ou "Level 1"', () => {
    renderWithCss(
      <CatalogLevelInviteModal isOpen direction="down" itemName="Walk" language="en-US" onAccept={vi.fn()} onDecline={vi.fn()} />,
    );
    expect(document.body.textContent).not.toMatch(/level\s*1/i);
  });

  it('os dois botões existem e chamam o callback certo', () => {
    const onAccept = vi.fn();
    const onDecline = vi.fn();
    renderWithCss(
      <CatalogLevelInviteModal isOpen direction="down" itemName="Caminhar" language="pt-BR" onAccept={onAccept} onDecline={onDecline} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /deixar mais leve/i }));
    expect(onAccept).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: /manter como está/i }));
    expect(onDecline).toHaveBeenCalledTimes(1);
  });
});

describe('CatalogLevelInviteModal — direction=up', () => {
  it('renderiza e aceita/recusa', () => {
    const onAccept = vi.fn();
    renderWithCss(
      <CatalogLevelInviteModal isOpen direction="up" itemName="Caminhar" language="pt-BR" onAccept={onAccept} onDecline={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /vamos/i }));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });
});
