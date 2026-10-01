// @vitest-environment jsdom
/**
 * WP1.9 (eco do "porquê") e WP1.10 (a bifurcação diz o que custa) — os dois
 * já ⚰️ (ver abaixo); o arquivo guarda a régua do que os substituiu.
 *
 * **WP1.9.** A primeira pergunta do app não é sobre o jogo: é "o que você quer
 * melhorar na sua vida?". A pessoa escrevia isso e a tela seguinte abria como
 * se nada tivesse sido dito. Agora quem ESCREVEU recebe uma linha de volta; quem
 * PULOU não recebe nada — o eco tem de ser verdade, e "seu Soulmon vai lembrar
 * disso" dito a quem não escreveu nada é a mentira mais barata do produto.
 *
 * **WP1.10.** A oferta do teste longo dizia que ele "afinava" a criatura — uma
 * palavra que não informa e não deixa ninguém decidir. Agora diz o que muda (a
 * leitura passa a usar traços de personalidade) e quanto custa (o número de
 * perguntas, lido da constante, e o tempo). O que ela NÃO pode dizer é que a
 * criatura fica melhor: os dois caminhos são legítimos, e as 6 respostas do
 * ritual entram na leitura nos dois.
 *
 * ⚠️ **O que este arquivo NÃO prova, e por quê.** O bloco do WP1.10 é checado
 * pela FONTE, não por render: chegar ao `REFINE_OFFER` exige o ritual pago
 * inteiro (nome, data, hora, cidade pelo `CityPicker`, criatura favorita e as 6
 * perguntas), e o passo da cidade depende da tabela real de cidades. Um teste
 * que arrastasse tudo isso mediria o `CityPicker`, não a copy. A verificação
 * visual PT/EN da tela continua sendo item de screenshot, e está registrada
 * como pendente no ledger do guarda do nascimento.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss, installFakeStorage } from '../test/renderEnv';
import { SoulmonOnboarding } from './SoulmonOnboarding';
import { clearOracleDraft } from '../utils/oracleDraft';
import { items as SOUL_TEST_ITEMS } from '../utils/soulProfile/personality/questions';
import { ateAsMetas } from '../test/metasOnboarding';

/** Portão (aceite + 18+) → GOAL_STEP.
 *  07/09/2026 — o portão de identidade passou a ser o PRIMEIRO passo e leva os
 *  Termos e a idade dentro dele; o "porquê" vem logo depois. Com a auth
 *  desligada no teste, o portão mostra só aceite, idade e "Continue". */
function ateOPorque(pt: boolean) {
  renderWithCss(<SoulmonOnboarding onComplete={async () => {}} />);
  fireEvent.click(screen.getByText(
    pt
      ? 'Li e concordo com os Termos de Uso e a Política de Privacidade'
      : 'I have read and agree to the Terms of Use and the Privacy Policy',
  ));
  fireEvent.click(screen.getByText(pt ? 'Tenho 18 anos ou mais' : 'I am 18 or older'));
  fireEvent.click(screen.getByRole('button', { name: pt ? 'Continuar' : 'Continue' }));
}

// ⚰️ WP1.9 (o eco "Noted. Your Soulmon will remember.") SAIU em 01/10/2026:
// o "porquê" deixou de ser texto livre (checklist do dono, B2) — o eco existia
// para devolver uma frase ESCRITA, e escolher opções não escreve frase
// nenhuma. A régua passa a ser: nenhum campo aberto, nenhum "pular", e o eco
// não volta a aparecer.
describe('SoulmonOnboarding — o "porquê" é objetivo (B2/B3, 01/10/2026)', () => {
  beforeEach(() => { vi.useFakeTimers(); installFakeStorage(); clearOracleDraft(); });
  afterEach(() => { vi.useRealTimers(); });

  it('EN — sem campo aberto, sem "pular", sem eco', async () => {
    ateOPorque(false);
    await ateAsMetas();
    expect(screen.getByText('What do you want to improve?')).toBeTruthy();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByText(/rather not say/)).toBeNull();
    fireEvent.click(screen.getByRole('group').querySelector('button')!);
    fireEvent.click(screen.getByText('Continue').closest('button')!);
    expect(screen.getByText('What gets in your way the most?')).toBeTruthy();
    expect(screen.queryByText(/Your Soulmon will remember/)).toBeNull();
  });

  it('PT — a mesma pergunta, objetiva', async () => {
    localStorage.setItem('soulmon-language', 'pt-BR');
    ateOPorque(true);
    await ateAsMetas(true, 'Corvo');
    expect(screen.getByText('O que você quer melhorar?')).toBeTruthy();
    expect(screen.queryByText(/Prefiro não responder/)).toBeNull();
  });
});

/* ⚰️ WP1.10 (a bifurcação diz o que custa) SAIU em 01/10/2026 junto com a
   própria bifurcação: o dono decidiu que o teste longo é parte OBRIGATÓRIA do
   onboarding, para todos ("todas as perguntas que a gente tem, todas
   obrigatórias"). Não há mais escolha a explicar — nem custo a declarar, nem
   irreversibilidade a avisar. A régua passa a ser a AUSÊNCIA dela. */
describe('SoulmonOnboarding — não existe mais bifurcação do teste longo (01/10/2026)', () => {
  const fonte = readFileSync(resolve(process.cwd(), 'src/components/SoulmonOnboarding.tsx'), 'utf-8');

  it('nenhuma porta de "pular o teste" sobrou na fonte', () => {
    expect(fonte).not.toContain('chooseRefine');
    expect(fonte).not.toContain('Want to sharpen the reading?');
    expect(fonte).not.toContain('Reveal my Soulmon now');
    expect(fonte).not.toMatch(/setRefine\(/);
  });

  it('o número de itens do teste continua vindo da CONSTANTE', () => {
    expect(SOUL_TEST_ITEMS.length).toBeGreaterThan(0);
    expect(fonte).toContain('SOUL_TEST_ITEMS.map(');
  });
});
