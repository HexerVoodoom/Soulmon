/**
 * O FIM DO RITUAL, depois do REGISTRO §81 (15/10/2026): o onboarding termina na tela do OVO-CRISTAL, no lugar da escolha
 * "Começar agora — é grátis" + reveal demo + cadastro do nome (que saíram). Todo teste que atravessa o onboarding até a
 * demo passa por aqui, num lugar só.
 */
import { fireEvent, screen } from '@testing-library/react';
import { PREMADE_CHARACTERS } from '../utils/monetization';
import { OVO_TOQUES_PARA_BOTOES } from '../components/OnboardingOvo';

/** Toca no cristal `vezes` vezes (padrão: as que fazem aparecer os dois botões). */
export function tocarOvo(vezes = OVO_TOQUES_PARA_BOTOES): void {
  for (let i = 0; i < vezes; i++) {
    fireEvent.click(document.querySelector('[data-ovo-cristal]')!);
  }
}

/** Do ovo ao "Me empreste um Soulmon guia": a grade dos 5 iniciais. */
export function abrirGuias(pt = false): void {
  tocarOvo();
  fireEvent.click(screen.getByRole('button', { name: pt ? 'Me empreste um Soulmon guia' : 'Lend me a guide Soulmon' }));
}

/** Escolhe um guia e CONFIRMA a demo ("Yes"/"Sim"): a Ambra aparece de novo. */
export function escolherGuiaEConfirmar(pt = false, indice = 0): void {
  fireEvent.click(screen.getByText(PREMADE_CHARACTERS[indice].name).closest('button')!);
  fireEvent.click(screen.getByRole('button', { name: pt ? 'Sim' : 'Yes' }));
}

/** A fala final da Ambra: tocar na tela fecha a sequência, e é aí que o app entra na demo (`onComplete`). */
export function passarDespedidaDaAmbra(): void {
  fireEvent.click(document.querySelector('[data-npc-sequence] [data-npc-advance]')!);
}

/** Do ovo até o jogo na demo (`onComplete` chamado): ovo → guia → confirmar → Ambra. */
export function entrarNaDemoPeloOvo(pt = false, indice = 0): void {
  abrirGuias(pt);
  escolherGuiaEConfirmar(pt, indice);
  passarDespedidaDaAmbra();
}
