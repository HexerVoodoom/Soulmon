// @vitest-environment jsdom
/**
 * WP1.9 (eco do "porquê") e WP1.10 (a bifurcação diz o que custa).
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
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss, installFakeStorage } from '../test/renderEnv';
import { SoulmonOnboarding } from './SoulmonOnboarding';
import { clearOracleDraft } from '../utils/oracleDraft';
import { items as SOUL_TEST_ITEMS } from '../utils/soulProfile/personality/questions';

const ECO_EN = 'Noted. Your Soulmon will remember.';
const ECO_PT = 'Anotado. Seu Soulmon vai lembrar disso.';

/** Intro → GOAL_STEP. O caminho grátis é o mais curto que passa pelo "porquê". */
function ateOPorque(pt: boolean) {
  renderWithCss(<SoulmonOnboarding onComplete={async () => {}} />);
  fireEvent.click(screen.getByText(pt ? 'Começar agora — é grátis' : 'Start now — it’s free'));
}

describe('SoulmonOnboarding — o eco do "porquê" (WP1.9)', () => {
  beforeEach(() => { installFakeStorage(); clearOracleDraft(); });

  it('quem ESCREVEU o objetivo recebe o eco no passo seguinte', () => {
    ateOPorque(false);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'voltar a estudar' } });
    expect(screen.queryByText(ECO_EN), 'o eco não pode aparecer no próprio passo').toBeNull();
    fireEvent.click(screen.getByText('Continue').closest('button')!);
    expect(screen.getByText(ECO_EN)).toBeTruthy();
    // E o passo é mesmo o da dificuldade — o eco fica ACIMA do título dele.
    expect(screen.getByText('And what gets in your way the most?')).toBeTruthy();
  });

  it('quem PULOU não recebe eco nenhum', () => {
    ateOPorque(false);
    fireEvent.click(screen.getByText('I’d rather not say right now'));
    expect(screen.getByText('And what gets in your way the most?')).toBeTruthy();
    expect(screen.queryByText(ECO_EN), 'eco para quem não escreveu é mentira').toBeNull();
  });

  it('escrever só espaço não conta como ter escrito', () => {
    ateOPorque(false);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } });
    fireEvent.click(screen.getByText('Continue').closest('button')!);
    expect(screen.queryByText(ECO_EN)).toBeNull();
  });

  it('o eco existe em português também', () => {
    localStorage.setItem('digiapp-language', 'pt-BR');
    ateOPorque(true);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'dormir melhor' } });
    fireEvent.click(screen.getByText('Continuar').closest('button')!);
    expect(screen.getByText(ECO_PT)).toBeTruthy();
  });
});

describe('SoulmonOnboarding — a bifurcação diz o que custa (WP1.10)', () => {
  const bloco = (() => {
    const fonte = readFileSync(resolve(process.cwd(), 'src/components/SoulmonOnboarding.tsx'), 'utf-8');
    const ini = fonte.indexOf('{step === REFINE_OFFER && (');
    const fim = fonte.indexOf('chooseRefine(false)', ini);
    expect(ini).toBeGreaterThan(0);
    expect(fim).toBeGreaterThan(ini);
    return fonte.slice(ini, fim);
  })();

  it('não promete criatura melhor — os dois caminhos são legítimos', () => {
    expect(bloco.toLowerCase()).not.toMatch(/melhor|better/);
  });

  it('o número de perguntas vem da CONSTANTE, nunca escrito à mão', () => {
    expect(bloco).toContain('${SOUL_TEST_ITEMS.length}');
    // O literal correspondente não pode estar cravado na frase.
    expect(bloco).not.toMatch(new RegExp(`\\b${SOUL_TEST_ITEMS.length} (perguntas|more questions)`));
  });

  it('diz o que muda, e nos dois idiomas', () => {
    expect(bloco).toContain('traços de personalidade');
    expect(bloco).toContain('personality traits');
    expect(bloco).toMatch(/~2 min/);
  });

  it('a declaração de irreversibilidade continua na tela', () => {
    expect(bloco).toMatch(/não tem volta/);
    expect(bloco).toMatch(/choice is final/);
  });
});
