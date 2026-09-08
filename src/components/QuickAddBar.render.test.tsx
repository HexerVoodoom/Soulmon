// @vitest-environment jsdom
/**
 * A barra de captura de uma linha na tela inicial.
 *
 * O parser tem os próprios testes (`utils/quickAdd.test.ts`) e NÃO é
 * reexercitado aqui. O que estes testes protegem é o que só a barra pode
 * quebrar:
 *
 *  1. **A confirmação é visível ANTES de gravar.** É a regra que o
 *     `CreateModal` escreveu primeiro — parsing invisível que erra é como o app
 *     perde a confiança da pessoa.
 *  2. **Nada é gravado sem ação explícita.** Digitar não cria.
 *  3. **Quando o teto recusa, o texto NÃO é perdido.** Perder o que a pessoa
 *     acabou de digitar é a falha que a faz voltar a anotar no papel — e o
 *     app inteiro existe para ela não fazer isso.
 *  4. **PT e EN.**
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { QuickAddBar } from './QuickAddBar';

function abrir(aceita = true, language: 'pt-BR' | 'en-US' = 'pt-BR') {
  const onCommit = vi.fn(() => aceita);
  renderWithCss(<QuickAddBar language={language} onCommit={onCommit} />);
  const campo = screen.getByLabelText(
    language === 'pt-BR'
      ? 'Anotar uma tarefa ou hábito numa linha'
      : 'Capture a task or habit in one line',
  ) as HTMLInputElement;
  return { onCommit, campo };
}

describe('QuickAddBar — confirmação antes de gravar', () => {
  it('digitar NÃO grava nada', () => {
    const { onCommit, campo } = abrir();
    fireEvent.change(campo, { target: { value: 'pagar boleto amanhã !2 #trabalho' } });
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('mostra o que entendeu enquanto se digita', () => {
    const { campo } = abrir();
    fireEvent.change(campo, { target: { value: 'pagar boleto !2 #trabalho' } });
    expect(screen.getByText('Work')).toBeTruthy();
    expect(screen.getByText('esforço 2')).toBeTruthy();
  });

  it('linha que vira hábito anuncia a recorrência', () => {
    const { campo } = abrir();
    fireEvent.change(campo, { target: { value: 'correr 3x semana' } });
    expect(screen.getByText('3× por semana')).toBeTruthy();
  });

  it('linha sem nada reconhecido não mostra chip nenhum', () => {
    // Chip que aparece sempre vira ruído e a pessoa para de ler justamente
    // quando ele tiver algo importante.
    const { campo } = abrir();
    fireEvent.change(campo, { target: { value: 'comprar pão' } });
    expect(screen.queryByText(/esforço/)).toBeNull();
  });
});

describe('QuickAddBar — gravar', () => {
  it('Enter grava e limpa o campo', () => {
    const { onCommit, campo } = abrir(true);
    fireEvent.change(campo, { target: { value: 'comprar leite' } });
    fireEvent.keyDown(campo, { key: 'Enter' });
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit.mock.calls[0][0]).toMatchObject({ kind: 'task', name: 'comprar leite' });
    expect(campo.value).toBe('');
  });

  it('o botão faz o mesmo que o Enter', () => {
    const { onCommit, campo } = abrir(true);
    fireEvent.change(campo, { target: { value: 'comprar leite' } });
    fireEvent.click(screen.getByLabelText('Adicionar'));
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it('linha vazia não grava — nem por Enter', () => {
    const { onCommit, campo } = abrir(true);
    fireEvent.keyDown(campo, { key: 'Enter' });
    expect(onCommit).not.toHaveBeenCalled();
    fireEvent.change(campo, { target: { value: '   ' } });
    fireEvent.keyDown(campo, { key: 'Enter' });
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('quando o teto RECUSA, o texto continua lá e a pessoa é avisada', () => {
    // Limpar aqui apagaria o que ela acabou de escrever por causa de um limite
    // que ela não sabia que existia.
    const { campo } = abrir(false);
    fireEvent.change(campo, { target: { value: 'mais uma tarefa' } });
    fireEvent.keyDown(campo, { key: 'Enter' });
    expect(campo.value).toBe('mais uma tarefa');
    expect(screen.getByRole('alert').textContent).toMatch(/limite de itens/);
  });

  it('o aviso some quando a pessoa volta a digitar', () => {
    const { campo } = abrir(false);
    fireEvent.change(campo, { target: { value: 'x' } });
    fireEvent.keyDown(campo, { key: 'Enter' });
    expect(screen.queryByRole('alert')).toBeTruthy();
    fireEvent.change(campo, { target: { value: 'xy' } });
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('QuickAddBar — ajuda e idioma', () => {
  it('os atalhos começam RECOLHIDOS', () => {
    // Uma legenda de tokens sempre visível faz uma caixa de texto simples
    // parecer uma interface que exige estudo.
    abrir();
    expect((screen.getByText('Atalhos').closest('button'))!.getAttribute('aria-expanded')).toBe('false');
  });

  it('fala os dois idiomas', () => {
    abrir(true, 'pt-BR');
    expect(screen.getByPlaceholderText('Anotar numa linha…')).toBeTruthy();
    cleanup();
    abrir(true, 'en-US');
    expect(screen.getByPlaceholderText('Capture in one line…')).toBeTruthy();
    expect(screen.getByText('Shortcuts')).toBeTruthy();
  });
});
