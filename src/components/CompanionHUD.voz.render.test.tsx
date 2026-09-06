// @vitest-environment jsdom
/**
 * WP3.2 — a voz nos momentos mudos, e o OLHAR.
 *
 * Antes disto, o pet tinha voz para dizer "não" (recusa de comida, teto de
 * carinho) e não tinha para dizer "que bom": concluir tarefa, esfregar, dar
 * banho e terminar uma tarefa assombrada não geravam fala nenhuma.
 *
 * E o `CLAUDE.md` prometia, por escrito, que "o pet olha" a tarefa assombrada.
 * Não olhava: não havia UMA ocorrência de `haunted` neste arquivo. Este teste
 * é a régua dessas duas coisas — se ele cair, a promessa voltou a ser só texto.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { CompanionHUD } from './CompanionHUD';
import { PET_VOICE_LINES } from '../utils/petVoice';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const base = {
  companionMood: 'idle' as const,
  energyLevel: 3,
  message: '',
  currentStage: 'rookie',
  evolutionStage: 'rookie',
  healthPoints: 3,
  maxHealthPoints: 3,
  dominantBranch: 'balanced' as const,
  currentXP: 0,
  nextLevelXP: 10,
  useAI: false,
  language: 'pt-BR' as const,
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
});
afterEach(() => { vi.unstubAllGlobals(); });

/** Qualquer uma das três frases do kind serve — o sorteio é do runtime. */
function falouAlgoDe(kind: keyof typeof PET_VOICE_LINES) {
  return PET_VOICE_LINES[kind].pt.some(l => screen.queryByText(l) !== null);
}

describe('CompanionHUD — os gestos mudos ganharam voz', () => {
  for (const kind of ['task', 'haunted', 'rub', 'shower', 'milestone'] as const) {
    it(`fala ao receber o sinal '${kind}'`, () => {
      const { rerender } = renderWithCss(<CompanionHUD {...base} />);
      rerender(<CompanionHUD {...base} speakSignal={{ n: 1, kind }} />);
      expect(falouAlgoDe(kind), `nada foi dito no sinal '${kind}'`).toBe(true);
    });
  }

  it('não fala na montagem — abrir o app não é um gesto', () => {
    renderWithCss(<CompanionHUD {...base} speakSignal={{ n: 0, kind: 'task' }} />);
    expect(falouAlgoDe('task')).toBe(false);
  });

  it('a fala da assombrada é OUTRA — alívio não soa como conclusão comum', () => {
    const { rerender } = renderWithCss(<CompanionHUD {...base} />);
    rerender(<CompanionHUD {...base} speakSignal={{ n: 1, kind: 'haunted' }} />);
    expect(falouAlgoDe('haunted')).toBe(true);
    expect(falouAlgoDe('task'), 'a assombrada usou a fala genérica').toBe(false);
  });

  it('em inglês, fala em inglês', () => {
    const { rerender } = renderWithCss(<CompanionHUD {...base} language="en-US" />);
    rerender(<CompanionHUD {...base} language="en-US" speakSignal={{ n: 1, kind: 'shower' }} />);
    const falou = PET_VOICE_LINES.shower.en.some(l => screen.queryByText(l) !== null);
    expect(falou).toBe(true);
  });
});

describe('CompanionHUD — o pet OLHA a tarefa assombrada', () => {
  it('sem assombrada na lista, nada de olhar', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} hauntedWatching={false} />);
    expect(container.querySelector('.sm-pet-haunted')).toBeNull();
  });

  it('com assombrada, o sprite vira o olhar', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} hauntedWatching />);
    expect(
      container.querySelector('.sm-pet-haunted'),
      'a promessa "o pet olha" do CLAUDE.md voltou a ser só texto',
    ).not.toBeNull();
  });

  it('o olhar é GESTO, não cobrança: nenhum texto acompanha', () => {
    // A regra do produto é que a assombração esmaece e sinaliza, nunca acusa.
    // Um aviso escrito aqui transformaria o olhar em bronca.
    const { container } = renderWithCss(<CompanionHUD {...base} hauntedWatching />);
    const texto = (container.textContent ?? '').toLowerCase();
    for (const p of ['atrasad', 'pendente', 'esqueceu', 'deveria']) {
      expect(texto, `o olhar veio com texto de cobrança ("${p}")`).not.toContain(p);
    }
  });
});

describe('CompanionHUD — a sombra de contato (WP3.6)', () => {
  it('existe: sem ela o pet flutua sobre o cenário', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} />);
    expect(container.querySelector('.sm2-pet-shadow')).not.toBeNull();
  });

  it('é decorativa e não rouba o gesto de esfregar', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} />);
    const sombra = container.querySelector('.sm2-pet-shadow') as HTMLElement;
    expect(sombra.getAttribute('aria-hidden')).toBe('true');
    expect(sombra.style.pointerEvents).toBe('none');
  });
});

describe('CompanionHUD — o som de presença é resposta a GESTO (WP3.5 / D11)', () => {
  it('não toca na montagem: abrir o app não é um gesto', () => {
    // Som que sai sozinho não é presença, é alarme — foi o bipe que fez as
    // escolas banirem o Tamagotchi.
    const fonte = readFileSync(resolve(process.cwd(), 'src/components/CompanionHUD.tsx'), 'utf-8');
    const idle = fonte.slice(fonte.indexOf('getIdlePhrase'), fonte.indexOf('getIdlePhrase') + 2000);
    expect(idle).not.toContain('playPresence');
  });

  it('mora no toque, e uma vez por sessão', () => {
    const fonte = readFileSync(resolve(process.cwd(), 'src/components/CompanionHUD.tsx'), 'utf-8');
    const clique = fonte.slice(fonte.indexOf('const handlePetClick'), fonte.indexOf('const handlePetClick') + 900);
    expect(clique).toContain('playPresence');
    expect(clique, 'sem a trava, o som repete e vira ruído').toContain('presencaTocadaRef');
    expect(clique, 'aba em segundo plano é o caso em que "tem alguém aqui" vira susto')
      .toContain('document.hidden');
  });
});
