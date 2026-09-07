// @vitest-environment jsdom
/**
 * Gate 18+ no caminho DEMO, percorrido de verdade.
 *
 * O buraco que este arquivo fecha: o demo salta o Oráculo inteiro
 * (intro → GOAL_STEP → STRUGGLE_STEP → CONSENT_STEP → DEMO_PICK) e **nunca**
 * chega ao passo da data de nascimento. Enquanto a única checagem era
 * `isAgeBlocked(birthDate)`, o 18+ decidido pelo dono valia só para quem
 * pagava — e nenhum teste de unidade em `consent.test.ts` conseguia ver isso,
 * porque a falha não estava na regra e sim no CAMINHO que não a chamava.
 *
 * Por isso o teste anda pela UI, clique a clique, em vez de chamar a função.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { SoulmonOnboarding } from './SoulmonOnboarding';

/** Vai da intro até a tela "Before we start", pelo caminho grátis (demo). */
function ateOConsentimento() {
  fireEvent.click(screen.getByText('Get started'));
  fireEvent.click(screen.getByText('I’d rather not say right now')); // GOAL
  fireEvent.click(screen.getByText('I’d rather not say right now')); // STRUGGLE
  expect(screen.getByText('Before we start')).toBeTruthy();
}

const caixa = () =>
  screen.getByText('I have read and agree to the Terms of Use and the Privacy Policy');
const campoIdade = () =>
  screen.getByLabelText('What month and year were you born?') as HTMLInputElement;
const continuar = () => screen.getByText('Continue').closest('button') as HTMLButtonElement;
/** Passar do consentimento agora cai na ESCOLHA grátis/completo, que desceu do
 *  passo 0 para depois do 18+ e do portão de e-mail (07/09/2026). Com a auth
 *  desligada no teste, o portão não existe e o consentimento leva direto aqui. */
const escolherGratis = () => fireEvent.click(screen.getByText('Start now — it’s free'));

describe('caminho DEMO — o 18+ existe fora do caminho pago', () => {
  beforeEach(() => {
    // O rascunho do portão (`utils/gateDraft.ts`) guarda o ACEITE, então sem
    // esta limpeza o caso seguinte abriria com a caixa já marcada e o clique
    // do teste a DESMARCARIA. Em produção isso é o comportamento certo — quem
    // já aceitou não reaceita —, mas entre casos é vazamento de estado.
    localStorage.clear();
    // 25/08/2026: a mesma data-base dos casos de `consent.test.ts`.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-25T12:00:00Z'));
  });

  it('pede mês/ano no passo comum e explica que é só para a idade', () => {
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    ateOConsentimento();
    expect(campoIdade()).toBeTruthy();
    // Coleta declarada: a tela diz a finalidade e o destino do dado.
    expect(screen.getByText(/we don't store this answer/)).toBeTruthy();
    // Mínimo necessário: a máscara é MM/AAAA, não a data cheia.
    expect(campoIdade().getAttribute('placeholder')).toContain('MM/YYYY');
  });

  it('não avança sem o mês/ano, mesmo com a caixa marcada', () => {
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    ateOConsentimento();
    fireEvent.click(caixa());
    expect(continuar().disabled).toBe(true);
    expect(screen.getByText(/Fill in the month and year/)).toBeTruthy();
  });

  it('demo com MENOS de 18 é barrado, com convite adiado e sem rejeição', () => {
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    ateOConsentimento();
    fireEvent.click(caixa());
    fireEvent.change(campoIdade(), { target: { value: '032012' } }); // 03/2012 → 14 anos
    expect(continuar().disabled).toBe(false);
    fireEvent.click(continuar());
    expect(screen.getByText('Not quite yet')).toBeTruthy();
    expect(screen.getByText(/Come back when you turn 18/)).toBeTruthy();
    // Não chegou ao demo.
    expect(screen.queryByText('Choose your Soulmon')).toBeNull();
    // A saída é o início do ritual, não um beco sem saída.
    fireEvent.click(screen.getByText('Back to start'));
    expect(screen.getByText('Get started')).toBeTruthy();
  });

  it('demo com 18 ou mais passa direto para a escolha do personagem', () => {
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    ateOConsentimento();
    fireEvent.click(caixa());
    fireEvent.change(campoIdade(), { target: { value: '012000' } }); // 01/2000 → 26 anos
    fireEvent.click(continuar());
    escolherGratis();
    expect(screen.getByText('Choose your Soulmon')).toBeTruthy();
    expect(screen.queryByText('Not quite yet')).toBeNull();
  });

  it('quem faz 18 dentro do mês declarado passa — a folga é para o lado generoso', () => {
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    ateOConsentimento();
    fireEvent.click(caixa());
    fireEvent.change(campoIdade(), { target: { value: '082008' } }); // faz 18 neste mês
    fireEvent.click(continuar());
    escolherGratis();
    expect(screen.getByText('Choose your Soulmon')).toBeTruthy();
  });

  it('o caminho do Oráculo NÃO ganha um segundo campo de idade', () => {
    // Lá a data cheia do mapa astral já confere (passo 2). Repetir a pergunta
    // aqui seria pedir duas vezes o mesmo dado.
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} mode="upgrade" />);
    expect(screen.queryByLabelText('What month and year were you born?')).toBeNull();
  });
});
