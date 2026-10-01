/**
 * Checklist do dono (01/10/2026), B1/B2/B4/B5: depois da conta o onboarding
 * pergunta o NOME do jogador e as METAS — áreas, dificuldades e forças
 * (objetivas, ≥1 de cada, sem "pular") e o ponto de partida. Todo teste que
 * antes pulava o "porquê" com "I'd rather not say right now" atravessa isto,
 * num lugar só — para o dia em que a ordem mudar não virar dez testes quebrados.
 *
 * Síncrono: nenhum desses passos usa timer.
 */
import { fireEvent, screen } from '@testing-library/react';

const clicarContinuar = (pt: boolean) =>
  fireEvent.click(screen.getByRole('button', { name: pt ? 'Continuar' : 'Continue' }));

/** O passo do nome: digita e segue. Para ANTES da 1ª meta. */
export function responderNome(nome = 'Corvo Azul', pt = false): void {
  const campo = screen.getByLabelText(pt ? 'Seu nome' : 'Your name');
  fireEvent.change(campo, { target: { value: nome } });
  clicarContinuar(pt);
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

/** Nome + metas: da saída do portão até a escolha grátis/completo. */
export function atravessarPerguntasIniciais(pt = false, nome = 'Corvo Azul'): void {
  responderNome(nome, pt);
  responderMetas(pt);
}
