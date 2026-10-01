/**
 * Checklist do dono (01/10/2026), B1/B2/B4/B5 + "todas as perguntas
 * obrigatórias, fazem parte do onboarding": depois da conta o onboarding
 * pergunta o NOME do jogador, as 6 do RITUAL, os 20 itens do TESTE e as METAS
 * — áreas, dificuldades e forças (objetivas, ≥1 de cada, sem "pular") — e o
 * ponto de partida. Todo teste que atravessa o onboarding passa por aqui, num
 * lugar só — para o dia em que a ordem mudar não virar dez testes quebrados.
 *
 * As 26 perguntas avançam sozinhas 180 ms depois do toque: as funções que as
 * atravessam são ASSÍNCRONAS e exigem `vi.useFakeTimers()` no chamador. O
 * nome e as metas são síncronos.
 */
import { act, fireEvent, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { ORACLE_QUESTIONS } from '../utils/oracle';
import { items as SOUL_TEST_ITEMS } from '../utils/soulProfile/personality/questions';

const clicarContinuar = (pt: boolean) =>
  fireEvent.click(screen.getByRole('button', { name: pt ? 'Continuar' : 'Continue' }));

/** O passo do nome: digita e segue. Para na 1ª pergunta do ritual. */
export function responderNome(nome = 'Corvo Azul', pt = false): void {
  const campo = screen.getByLabelText(pt ? 'Seu nome' : 'Your name');
  fireEvent.change(campo, { target: { value: nome } });
  clicarContinuar(pt);
}

/** As 6 do ritual + os 20 itens do teste (sempre a 1ª opção). Para na 1ª
 *  meta ("o que melhorar"). `quantas` limita, para parar no meio. */
export async function responderPerguntas(quantas = ORACLE_QUESTIONS.length + SOUL_TEST_ITEMS.length): Promise<void> {
  for (let i = 0; i < quantas; i++) {
    const opcao = document.querySelector('button[aria-pressed]');
    if (!opcao) throw new Error(`perguntas: a ${i + 1}ª pergunta está sem opções na tela`);
    fireEvent.click(opcao);
    await act(async () => { await vi.advanceTimersByTimeAsync(200); });
  }
}

/** Uma tela de metas: marca a 1ª opção e segue. */
function escolherPrimeira(pt: boolean): void {
  const grupo = screen.getByRole('group');
  const opcao = grupo.querySelector('button');
  if (!opcao) throw new Error('metas: tela sem opções');
  fireEvent.click(opcao);
  clicarContinuar(pt);
}

/** Áreas → dificuldades → forças → ponto de partida, e para na ESCOLHA
 *  grátis/completo. */
export function responderMetas(pt = false): void {
  escolherPrimeira(pt); // o que melhorar
  escolherPrimeira(pt); // o que atrapalha
  escolherPrimeira(pt); // forças
  clicarContinuar(pt);  // ponto de partida (tudo vem marcado)
}

/** Nome + as 26 perguntas: da saída do portão até a 1ª meta. */
export async function ateAsMetas(pt = false, nome = 'Corvo Azul'): Promise<void> {
  responderNome(nome, pt);
  await responderPerguntas();
}

/** Nome + perguntas + metas: da saída do portão até a escolha grátis/completo. */
export async function atravessarPerguntasIniciais(pt = false, nome = 'Corvo Azul'): Promise<void> {
  await ateAsMetas(pt, nome);
  responderMetas(pt);
}
