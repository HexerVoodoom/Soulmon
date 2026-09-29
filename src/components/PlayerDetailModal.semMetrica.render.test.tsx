// @vitest-environment jsdom
/**
 * WP4.11 — o perfil do amigo para de exibir desempenho alheio (exposição E3).
 *
 * A **proibição #21** nasceu na rodada 3, escrita pelo próprio dono, e o código
 * a violava em dois lugares ao mesmo tempo: a linha do diretório e o cartão do
 * amigo mostravam `rank N`, e o cartão desenhava a ESCADA inteira
 * (Rookie→Mega) com o estágio atual preenchido.
 *
 * A distinção que decide tudo aqui: **galho é identidade, altura é placar.**
 * Que caminho aquela criatura seguiu diz quem ela é; quão longe ela chegou diz
 * quem está ganhando. A decisão 8b do dono (mostrar a criatura do amigo no
 * estágio real) foi ratificada em D13 com essa condição exata, e é ela que este
 * teste guarda.
 *
 * O sprite continua inteiro no cartão — ele já diz quem a criatura é, sem
 * ranquear ninguém.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { screen } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { PlayerDetailModal } from './PlayerDetailModal';

const amigo = {
  id: 'abc', name: 'Rita', petName: 'Lumo', stage: 'champion-power',
  unlockedStages: ['rookie', 'champion-power'], pvpEnabled: true, daysPlaying: 47,
};

const abrir = (pt = true) => {
  renderWithCss(
    <PlayerDetailModal player={amigo} language={pt ? 'pt-BR' : 'en-US'} onClose={() => {}} />,
  );
  return document.body.textContent ?? '';
};

describe('PlayerDetailModal — nenhuma métrica de desempenho alheio (WP4.11)', () => {
  it('não mostra rank', () => {
    expect(abrir().toLowerCase()).not.toContain('rank');
  });

  it('não desenha a escada de estágios — altura é placar', () => {
    const texto = abrir();
    for (const degrau of ['Rookie', 'Champion', 'Ultimate', 'Mega', 'Ultra']) {
      expect(texto, `a escada voltou (${degrau})`).not.toContain(degrau);
    }
    expect(texto, 'o marcador de posição na escada voltou').not.toMatch(/· atual|· current/);
  });

  it('mostra o que É presença: nome, criatura e tempo de jogo', () => {
    const texto = abrir();
    expect(texto).toContain('Rita');
    expect(texto).toContain('47 dias jogando');
    // O sprite da criatura continua lá — é ele que diz quem ela é.
    expect(document.querySelector('img')).toBeTruthy();
  });

  it('mostra o GALHO como palavra, que é identidade e não altura', () => {
    // `champion-power` → o caminho do Poder (`ATTR_LABEL`, que fala em
    // qualidade e não em atributo cru). Diz que criatura é aquela, não quão
    // longe a pessoa chegou.
    expect(abrir(true)).toContain('Poder');
    document.body.innerHTML = '';
    expect(abrir(false)).toContain('Power');
  });

  it('o corte é no SERVIDOR: os campos não trafegam', () => {
    // Esconder na UI não basta — o campo volta no dia em que alguém desenhar um
    // cartão novo. `publicProfile` é onde a decisão mora.
    const api = readFileSync(resolve(process.cwd(), 'functions/api/community.js'), 'utf-8');
    const perfil = api.slice(api.indexOf('async function publicProfile'), api.indexOf('async function getProfile'));
    expect(perfil.replace(/\/\/.*$/gm, ''), 'tasksDone voltou ao fio').not.toMatch(/tasksDone:/);
  });

  it('o diretório não é ordenado por desempenho', () => {
    // Mesmo sem o número na tela, ordenar por rank faz da lista um placar:
    // quem está no topo é "o melhor", e a leitura acontece sozinha.
    const api = readFileSync(resolve(process.cwd(), 'functions/api/community.js'), 'utf-8');
    const acao = api.slice(api.indexOf("action === 'players'"), api.indexOf('return json({ players })'));
    expect(acao).not.toMatch(/sort\(.*rankPoints/);
    expect(acao, 'a ordem por nome sumiu').toMatch(/localeCompare/);
  });
});

describe('WP4.14 — visitar é OLHAR: sem estado e sem número', () => {
  it('a criatura aparece grande — é a única coisa interessante da comunidade', () => {
    const fonte = readFileSync(resolve(process.cwd(), 'src/components/PlayerDetailModal.tsx'), 'utf-8');
    // 48px de sprite num modal inteiro era uma ficha, não uma visita.
    expect(fonte).toMatch(/scale=\{3\}/);
  });

  it('nenhuma AÇÃO sobre a criatura do outro', () => {
    // Cutucar, presentear, curtir ou comparar transformam a visita num loop
    // de engajamento social — o oposto do que a saída do `rank` daqui
    // estabeleceu (WP4.11, proibição #21).
    const fonte = readFileSync(resolve(process.cwd(), 'src/components/PlayerDetailModal.tsx'), 'utf-8');
    for (const proibido of ['cutuc', 'poke', 'curtir', 'like', 'presente', 'gift', 'desafiar', 'challenge']) {
      expect(fonte.toLowerCase(), `a visita ganhou ação ("${proibido}")`).not.toMatch(
        new RegExp(`onclick[^\\n]*${proibido}`, 'i'),
      );
    }
  });
});
