// @vitest-environment jsdom
/**
 * A ARENA — a tela, nas fases que NÃO são a luta (a luta em grupo, no núcleo v3, é de
 * `ArenaGame.torcida.render.test.tsx`; os balanços, de `utils/arena.v3.test.ts`).
 *
 * Aqui: a Arena abre para TODO save (inclusive sem ficha), diz a verdade sobre o que custa, toma a
 * tela como as irmãs, tem estado de erro (rede) e fala os dois idiomas. A tela NÃO inventa número de
 * balanceamento: as rodadas anunciadas e o HP exibido saem do motor (`utils/arena.ts`).
 *
 * PR3b: saíram daqui os casos do laço de turno (barra de ataque/defesa em `TimingBar`, carga em turnos,
 * `getArenaPlayerStats`), que testavam o motor antigo — a lista está no PR.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ArenaGame } from './ArenaGame';
import { ARENA_ROUNDS, ESCOLA_FAMILY_PADRAO } from '../utils/arena';
import type { StageSkills } from '../utils/soulProfile/ficha/skills';
import { elementoNomeDe } from '../utils/soulProfile/ficha/elementoNome';

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
  return { ...real, loadBestiaryPool: vi.fn(async () => POOL) };
});

vi.mock('../utils/sounds', () => ({ playAttack: vi.fn(), playSpecial: vi.fn(), playVictory: vi.fn(), playTaskComplete: vi.fn(), playFeed: vi.fn() }));
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

  it('o especial é anunciado pela ENERGIA cheia (a carga em turnos saiu)', async () => {
    renderWithCss(
      <ArenaGame evolutionStage="rookie" language="pt-BR" skills={skillsCom('benca')} onExit={() => {}} />,
    );
    await screen.findByRole('button', { name: /Entrar na Arena/i });
    // 04/10/2026: a carga em turnos saiu — o especial dispara com a barra de ENERGIA cheia (REGISTRO §20.10)
    expect(screen.getByText(/com a energia cheia/)).toBeTruthy();
  });

  it('o texto promete o que a regra cumpre: perder NÃO custa corações', async () => {
    // A Arena não cobra da barra de cuidado, igual à Masmorra. O texto é
    // parte da regra: prometer errado aqui é o app virando cobrador.
    renderWithCss(<ArenaGame evolutionStage="rookie" language="pt-BR" onExit={() => {}} />);
    await screen.findByRole('button', { name: /Entrar na Arena/i });
    expect(screen.getByText(/nunca os seus corações/i)).toBeTruthy();
  });
});

describe('a tela não inventa número de balanceamento', () => {
  it('as rodadas anunciadas são as do motor', async () => {
    renderWithCss(<ArenaGame evolutionStage="rookie" language="pt-BR" onExit={() => {}} />);
    await screen.findByRole('button', { name: /Entrar na Arena/i });
    expect(screen.getByText(new RegExp(`${ARENA_ROUNDS} rodadas`))).toBeTruthy();
  });

  it('HP e poder exibidos vêm do jogador do núcleo (`soulCombatant` + a escola básica), não de um literal', async () => {
    // O HP automático é do level e a forma por escola (`ROLE_SHAPE`) o remodela: duas fichas diferentes
    // não podem ler o mesmo número.
    const { unmount } = renderWithCss(
      <ArenaGame evolutionStage="rookie" language="pt-BR" skills={skillsCom('benca', 'combate_fisico')} onExit={() => {}} />,
    );
    await screen.findByRole('button', { name: /Entrar na Arena/i });
    const fisico = screen.getByText('Vida').parentElement?.textContent ?? '';
    expect(screen.getByText('Poder')).toBeTruthy();
    unmount();

    renderWithCss(
      <ArenaGame evolutionStage="rookie" language="pt-BR" skills={skillsCom('benca', 'conjuracao')} onExit={() => {}} />,
    );
    await screen.findByRole('button', { name: /Entrar na Arena/i });
    const conjurador = screen.getByText('Vida').parentElement?.textContent ?? '';

    expect(fisico).not.toBe(conjurador);
  });

  it('cada escola de especial mapeia para uma família (o padrão; a família real vem da skill, PR9) — a tela lê, não decide', () => {
    const familias = Object.values(ESCOLA_FAMILY_PADRAO);
    expect(new Set(familias).size).toBeGreaterThan(1);
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

describe('o chip de Essência mostra o elemento da IDENTIDADE (par incluso); a vantagem segue na base', () => {
  const chip = () => screen.getByText('Essência').parentElement?.textContent ?? '';
  it('par dominante: o chip mostra o PAR (o mesmo do nome do básico), não a base do elementoId', async () => {
    const sk = skillsCom('benca');
    (sk.rookie as unknown as { elementoDominante: unknown }).elementoDominante = { id: 'vapor', nome: elementoNomeDe('vapor') };
    renderWithCss(<ArenaGame evolutionStage="rookie" language="pt-BR" skills={sk} onExit={() => {}} />);
    await screen.findByRole('button', { name: /Entrar na Arena/i });
    expect(chip()).toContain(elementoNomeDe('vapor').pt);
    expect(chip()).not.toContain('Água');
    expect(sk.rookie!.basica.elementoId).toBe('agua'); // a vantagem (Arena/COUNTERS) não mudou
  });
  it('base dominante: igual a antes (a própria base)', async () => {
    const sk = skillsCom('benca');
    (sk.rookie as unknown as { elementoDominante: unknown }).elementoDominante = { id: 'agua', nome: elementoNomeDe('agua') };
    renderWithCss(<ArenaGame evolutionStage="rookie" language="pt-BR" skills={sk} onExit={() => {}} />);
    await screen.findByRole('button', { name: /Entrar na Arena/i });
    expect(chip()).toContain('Água');
  });
});
