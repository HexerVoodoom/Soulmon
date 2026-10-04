// @vitest-environment jsdom
/**
 * A ARENA — a tela nova, e a razão de ela existir.
 *
 * O motor (`utils/arena.ts`) tinha 7 casos e ZERO importadores. Esta tela é a
 * primeira consumidora dele, e o risco não é o motor: é a TELA discordar do
 * motor. Os números dos especiais foram calibrados por uma simulação de 300+
 * runs por arquétipo rodando `simulateArenaRun`; se o laço da interface fizer
 * a mesma coisa em outra ORDEM, o balanceamento inteiro deixa de valer e nada
 * fica vermelho.
 *
 * Por isso o caso central deste arquivo não é "renderiza": é **a tela chama o
 * motor com os mesmos argumentos, na mesma ordem, que a simulação**.
 *
 * ⚠️ jsdom não tem `requestAnimationFrame` útil para a `TimingBar` medir
 * posição real, e não tem layout. O que se mede aqui é o EFEITO: quem tomou
 * dano, quem revida, quando o especial dispara, o que a tela diz. A precisão
 * entra pelo `onStop` da barra, que é chamado direto — exatamente o ponto onde
 * a simulação chama `sampleAcc()`.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ArenaGame } from './ArenaGame';
import {
  ARENA_ROUNDS, SPECIAL_CHARGE_TURNS, SPECIAL_EFFECTS, PERFECT_ACC,
} from '../utils/arena';
import type { StageSkills } from '../utils/soulProfile/ficha/skills';

/** Uma criatura só, determinística: o que varia nos testes é a ESCOLA e a
 *  precisão, nunca o sorteio do bestiário. */
const POOL = [{
  nome: 'irrelevante',
  elementos: ['fogo'],
  atributos: { forca: 5, inteligencia: 5, velocidade: 5, magia: 5 },
  tamanho: 'medio',
  hostilidade: 5,
}];

vi.mock('../utils/arena', async importOriginal => {
  const real = await importOriginal<typeof import('../utils/arena')>();
  return {
    ...real,
    // Este arquivo trava o caminho ANTIGO (barra de timing no ataque): a flag
    // volta a ligar só aqui. O caminho novo (pet sozinho + torcida) é de
    // `ArenaGame.torcida.render.test.tsx` (H14, 02/10/2026).
    ARENA_TIMING_ATTACK_ENABLED: true,
    loadBestiaryPool: vi.fn(async () => POOL),
    buildArenaRound: vi.fn(real.buildArenaRound),
  };
});

// Este arquivo também trava o caminho ANTIGO da esquiva (barra de timing na
// defesa): a flag volta a ligar só aqui. O caminho novo (o pet se defende
// sozinho — TORC-3, 02/10/2026) é de `ArenaGame.torcida.render.test.tsx`.
vi.mock('../utils/autoDefesa', async importOriginal => {
  const real = await importOriginal<typeof import('../utils/autoDefesa')>();
  return { ...real, TIMING_DODGE_ENABLED: true };
});

/**
 * ⚠️ A `TimingBar` é SUBSTITUÍDA, e isso é o ponto do arquivo.
 *
 * Ela mede a posição por `requestAnimationFrame`, que em jsdom não anda: um
 * `pointerdown` real devolveria sempre a MESMA precisão (0), e todo caso sobre
 * crítico, esquiva e dano ficaria verde medindo o vácuo. Aqui o dublê expõe a
 * precisão como um botão por valor, que é exatamente onde `simulateArenaRun`
 * chama `sampleAcc()` — a única diferença permitida entre a tela e a simulação.
 */
vi.mock('./pixel/TimingBar', () => ({
  TimingBar: ({ label, onStop, ariaLabel }: {
    label: string; onStop: (a: number) => void; ariaLabel?: string;
  }) => (
    <div>
      <button aria-label={ariaLabel} onClick={() => onStop(0.2)}>{label}</button>
      <button onClick={() => onStop(1)}>{`${label}::perfeito`}</button>
      <button onClick={() => onStop(0)}>{`${label}::pessimo`}</button>
    </div>
  ),
}));

// Som e sprite não são o assunto e puxam binário para dentro do teste.
vi.mock('../utils/sounds', () => ({ playTaskComplete: vi.fn(), playFeed: vi.fn() }));
vi.mock('../utils/sprites', () => ({
  getDungeonEnemySprite: () => ({ sprite: 'x.png', name: 'x', line: 'x' }),
  getSpriteForStage: () => 'pet.png',
}));

function skillsCom(escolaEspecial: string, escolaBasica = 'combate_fisico'): Partial<Record<string, StageSkills>> {
  const mk = (tipo: 'basica' | 'especial', escola: string) => ({
    tipo,
    nome: { pt: `${tipo} pt`, en: `${tipo} en` },
    descricao: { pt: 'd', en: 'd' },
    elementoId: 'agua',
    elementoNome: { pt: 'Água', en: 'Water' },
    escolaId: escola,
    recursoId: 'furia',
    custo: tipo === 'basica' ? 'baixo' : 'alto',
  });
  const par = { basica: mk('basica', escolaBasica), especial: mk('especial', escolaEspecial) };
  return { rookie: par as unknown as StageSkills };
}

/** Monta e entra na Arena, deixando a tela na primeira barra de ATAQUE. */
async function entrar(props: Partial<Parameters<typeof ArenaGame>[0]> = {}) {
  const onEarnPoints = vi.fn();
  const onExit = vi.fn();
  renderWithCss(
    <ArenaGame
      evolutionStage="rookie"
      language="pt-BR"
      skills={skillsCom('combate_fisico')}
      onEarnPoints={onEarnPoints}
      onExit={onExit}
      {...props}
    />,
  );
  const entrarBtn = await screen.findByRole('button', { name: /Entrar na Arena/i });
  fireEvent.click(entrarBtn);
  await screen.findByText('Atacar!');
  return { onEarnPoints, onExit };
}

/** Aciona a barra visível com a precisão escolhida. */
function bater(qual: 'Atacar!' | 'Desviar!', como: 'perfeito' | 'pessimo' | 'medio' = 'medio') {
  // Consulta por TEXTO, e não por nome acessível: o botão do meio carrega o
  // `aria-label` de verdade (que outro caso afirma), então o nome dele não é
  // o rótulo.
  fireEvent.click(screen.getByText(como === 'medio' ? qual : `${qual}::${como}`));
}

const temAtaque = () => screen.queryByText('Atacar!') !== null;
const temDefesa = () => screen.queryByText('Desviar!') !== null;

/** HP atual do jogador, lido da tela. */
function hpNaTela(): number {
  const el = [...document.querySelectorAll('b')].find(b => /^\d+\/\d+$/.test(b.textContent ?? ''));
  return Number((el?.textContent ?? '0/0').split('/')[0]);
}

beforeEach(() => { vi.clearAllMocks(); });

describe('a Arena abre para TODO save, inclusive o sem ficha', () => {
  it('sem skills, entra com o par genérico e DIZ por quê', async () => {
    renderWithCss(<ArenaGame evolutionStage="rookie" language="pt-BR" onExit={() => {}} />);
    expect(await screen.findByRole('button', { name: /Entrar na Arena/i })).toBeTruthy();
    // O perfil do oráculo vive só no localStorage e não sobe para a nuvem: um
    // aparelho novo chega aqui sem ficha, e não pode achar que perdeu algo.
    expect(screen.getByText(/ficha ainda não está neste aparelho/i)).toBeTruthy();
  });

  it('com ficha, mostra os NOMES das duas habilidades em vez do aviso', async () => {
    renderWithCss(
      <ArenaGame evolutionStage="rookie" language="pt-BR" skills={skillsCom('benca')} onExit={() => {}} />,
    );
    await screen.findByRole('button', { name: /Entrar na Arena/i });
    expect(screen.getByText('basica pt')).toBeTruthy();
    expect(screen.getByText('especial pt')).toBeTruthy();
    expect(screen.queryByText(/ficha ainda não está/i)).toBeNull();
  });

  it('a carga do especial é ANUNCIADA com o número do motor, não um literal', async () => {
    renderWithCss(
      <ArenaGame evolutionStage="rookie" language="pt-BR" skills={skillsCom('benca')} onExit={() => {}} />,
    );
    await screen.findByRole('button', { name: /Entrar na Arena/i });
    expect(screen.getByText(new RegExp(`carrega em ${SPECIAL_CHARGE_TURNS} turnos`))).toBeTruthy();
  });

  it('o texto promete o que a regra cumpre: perder NÃO custa corações', async () => {
    // A Arena não cobra da barra de cuidado, igual à Masmorra. O texto é
    // parte da regra: prometer errado aqui é o app virando cobrador.
    renderWithCss(<ArenaGame evolutionStage="rookie" language="pt-BR" onExit={() => {}} />);
    await screen.findByRole('button', { name: /Entrar na Arena/i });
    expect(screen.getByText(/nunca os seus corações/i)).toBeTruthy();
  });
});

describe('🔴 o laço de turno é o da simulação', () => {
  it('🔴 TODO inimigo vivo revida — uma defesa por INIMIGO, não uma por turno', async () => {
    // A simulação faz `for (const e of alive())`. Uma tela que deixasse só o
    // alvo revidar seria muito mais fácil, e o balanceamento calibrado deixaria
    // de valer sem nada ficar vermelho.
    //
    // ⚠️ A rodada 1 tem UM inimigo só, então medi-la aqui não provaria nada —
    // a primeira versão deste caso passava com a regra quebrada. A rodada é
    // FORÇADA a ter três, com HP alto para ninguém morrer no meio da contagem.
    const arena = await import('../utils/arena');
    const gordo = (i: number) => ({
      namePt: `Inimigo ${i}`, nameEn: `Enemy ${i}`, elements: ['fogo'],
      hp: 9999, maxHp: 9999, atk: 1, speed: 1, points: 1,
      cls: 'weak' as const, tier: 'rookie' as const,
    });
    vi.mocked(arena.buildArenaRound).mockReturnValueOnce([gordo(1), gordo(2), gordo(3)]);

    await entrar();
    bater('Atacar!', 'pessimo');
    let defesas = 0;
    while (temDefesa() && defesas < 10) { bater('Desviar!', 'perfeito'); defesas++; }

    expect(defesas, 'três inimigos vivos = três defesas no mesmo turno').toBe(3);
    expect(temAtaque(), 'o turno tem que voltar para o ataque').toBe(true);
  });

  it('🔴 defesa PERFEITA esquiva limpo — o HP não cai um ponto', async () => {
    await entrar();
    bater('Atacar!', 'pessimo');
    const antes = hpNaTela();
    while (temDefesa()) bater('Desviar!', 'perfeito');
    expect(hpNaTela()).toBe(antes);
  });

  it('e defesa PÉSSIMA custa HP — senão o caso acima seria vácuo', async () => {
    await entrar();
    bater('Atacar!', 'pessimo');
    const antes = hpNaTela();
    while (temDefesa()) bater('Desviar!', 'pessimo');
    expect(hpNaTela()).toBeLessThan(antes);
  });

  it(`🔴 o especial dispara no turno ${SPECIAL_CHARGE_TURNS + 1}, e não antes`, async () => {
    // A carga é o que separa a Arena de "aperte o botão forte sempre". Se ela
    // contasse errado, a simulação de balanceamento estaria medindo outro jogo.
    await entrar({ skills: skillsCom('conjuracao') });
    for (let turno = 1; turno <= SPECIAL_CHARGE_TURNS; turno++) {
      expect(screen.queryByText(/Especial pronto/), `turno ${turno}`).toBeNull();
      bater('Atacar!', 'pessimo');
      while (temDefesa()) bater('Desviar!', 'perfeito');
    }
    // Depois de SPECIAL_CHARGE_TURNS básicas, a tela anuncia o especial.
    expect(screen.getByText(/Especial pronto/)).toBeTruthy();
  });

  it('o rótulo da barra de ataque NOMEIA o alvo — quem não vê a tela precisa saber', async () => {
    await entrar();
    const btn = screen.getByRole('button', { name: /Atacar .+\. Pare a barra no centro/ });
    expect(btn).toBeTruthy();
  });
});

describe('a tela não inventa número de balanceamento', () => {
  it('as rodadas anunciadas são as do motor', async () => {
    renderWithCss(<ArenaGame evolutionStage="rookie" language="pt-BR" onExit={() => {}} />);
    await screen.findByRole('button', { name: /Entrar na Arena/i });
    expect(screen.getByText(new RegExp(`${ARENA_ROUNDS} rodadas`))).toBeTruthy();
  });

  it('HP e dano exibidos vêm de `getArenaPlayerStats`, por escola', async () => {
    // Escolas diferentes têm FORMAS diferentes do mesmo orçamento (hp×dmg ≈ 1).
    // Se a tela mostrasse um número fixo, duas fichas diferentes leriam igual.
    const { unmount } = renderWithCss(
      <ArenaGame evolutionStage="rookie" language="pt-BR" skills={skillsCom('benca', 'combate_fisico')} onExit={() => {}} />,
    );
    await screen.findByRole('button', { name: /Entrar na Arena/i });
    const fisico = screen.getByText('Vida').parentElement?.textContent ?? '';
    unmount();

    renderWithCss(
      <ArenaGame evolutionStage="rookie" language="pt-BR" skills={skillsCom('benca', 'conjuracao')} onExit={() => {}} />,
    );
    await screen.findByRole('button', { name: /Entrar na Arena/i });
    const conjurador = screen.getByText('Vida').parentElement?.textContent ?? '';

    expect(fisico).not.toBe(conjurador);
  });

  it('cada escola de especial tem efeito PRÓPRIO no motor — a tela lê, não decide', () => {
    // Guard de vácuo: se um dia todos os efeitos ficassem iguais, o caso acima
    // e a tela inteira passariam a medir nada.
    const mults = Object.values(SPECIAL_EFFECTS).map(e => e.mult);
    expect(new Set(mults).size).toBeGreaterThan(1);
  });
});

describe('🔴 a Arena TOMA a tela, como as irmãs', () => {
  it('a raiz é o `GameRoot` do kit (`data-game-root`) — sem ele o jogo nasce fora da dobra', () => {
    /* Medido no navegador em 320×640: a primeira versão desta tela era inline,
       montava em `top: 705` (dobra 640) e quem tocasse no cartão via a lista de
       cartões e NADA MAIS — o jogo existia 700px abaixo, sem nada rolar até
       ele. Masmorra, Dino e Pedra-Papel-Tesoura já tomavam a tela; só a Arena
       não, porque eu escrevi o contêiner do zero em vez de olhar as irmãs.

       Desde o canvas Jogos (DECISÕES §25) a raiz é o `GameRoot` de
       `games/GameKit.tsx`: `position: fixed; inset: 0` mais o respiro da barra
       de baixo, num lugar só, marcado por `data-game-root`. */
    const { container } = renderWithCss(
      <ArenaGame evolutionStage="rookie" language="pt-BR" onExit={() => {}} />,
    );
    const raiz = container.firstElementChild as HTMLElement;
    expect(raiz.hasAttribute('data-game-root')).toBe(true);
    expect(getComputedStyle(raiz).position).toBe('fixed');
  });

  it('e a MESMA peça é a que as irmãs usam — não uma cópia parecida', () => {
    // Se alguém criar um contêiner próprio com o mesmo conteúdo, o footgun 9
    // volta: duas raízes para a mesma decisão, e uma delas some no próximo
    // ajuste do respiro da barra de baixo.
    const dungeon = readFileSync(resolve(__dirname, 'DungeonGame.tsx'), 'utf8');
    expect(dungeon).toContain('<GameRoot');
    const arena = readFileSync(resolve(__dirname, 'ArenaGame.tsx'), 'utf8');
    expect(arena).toContain('<GameRoot');
  });
});

describe('estados que não são a luta', () => {
  it('🔴 falha ao carregar o bestiário vira ESTADO DE ERRO, não tela branca', async () => {
    // O pool é import dinâmico de ~104 KB: falhar nele é plausível (rede,
    // cache frio). Sem este caminho a Arena ficaria girando para sempre.
    const arena = await import('../utils/arena');
    vi.mocked(arena.loadBestiaryPool).mockRejectedValueOnce(new Error('rede'));
    renderWithCss(<ArenaGame evolutionStage="rookie" language="pt-BR" onExit={() => {}} />);
    expect(await screen.findByText(/Não consegui carregar os desafiantes/i)).toBeTruthy();
    // I3: sem botão "Voltar" de texto — a saída é o ✕ do topo, à ESQUERDA (ocioso).
    expect(screen.getByRole('button', { name: /Sair/i })).toBeTruthy();
  });

  it('o estado de erro OFERECE saída — beco sem saída é pior que erro', async () => {
    const arena = await import('../utils/arena');
    vi.mocked(arena.loadBestiaryPool).mockRejectedValueOnce(new Error('rede'));
    const onExit = vi.fn();
    renderWithCss(<ArenaGame evolutionStage="rookie" language="pt-BR" onExit={onExit} />);
    // Espera o ESTADO DE ERRO: a tela de carregamento também oferece a saída (✕ ocioso, à esquerda)
    // (canvas Jogos: "Go back" no loading), e clicar nele no instante em que o
    // pool rejeita acerta um nó já desmontado.
    await screen.findByText(/Não consegui carregar os desafiantes/i);
    fireEvent.click(screen.getByRole('button', { name: /Sair/i }));
    expect(onExit).toHaveBeenCalled();
  });

  it('o botão Sair funciona já na intro, sem precisar entrar na luta', async () => {
    const onExit = vi.fn();
    renderWithCss(<ArenaGame evolutionStage="rookie" language="pt-BR" onExit={onExit} />);
    await screen.findByRole('button', { name: /Entrar na Arena/i });
    fireEvent.click(screen.getByRole('button', { name: /^Sair$/i }));
    expect(onExit).toHaveBeenCalled();
  });
});

describe('os dois idiomas', () => {
  it('em inglês, nada de português vaza para a tela', async () => {
    renderWithCss(<ArenaGame evolutionStage="rookie" language="en-US" onExit={() => {}} />);
    await screen.findByRole('button', { name: /Enter the Arena/i });
    const texto = document.body.textContent ?? '';
    for (const palavra of ['rodadas', 'corações', 'Entrar', 'Vida', 'Dano']) {
      expect(texto.includes(palavra), `"${palavra}" vazou para a tela em inglês`).toBe(false);
    }
  });

  it('e o inverso: em português, nada de inglês', async () => {
    renderWithCss(<ArenaGame evolutionStage="rookie" language="pt-BR" onExit={() => {}} />);
    await screen.findByRole('button', { name: /Entrar na Arena/i });
    const texto = document.body.textContent ?? '';
    for (const palavra of ['rounds', 'hearts', 'Enter the']) {
      expect(texto.includes(palavra), `"${palavra}" vazou para a tela em português`).toBe(false);
    }
  });
});
