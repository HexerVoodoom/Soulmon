// @vitest-environment jsdom
/**
 * PONTOS CEGOS listados pela revisão adversarial e nunca exercitados:
 * save hostil vindo da nuvem, quota de `localStorage` e o relógio do aparelho.
 *
 * O elo comum: em todos, o app recebe algo que ele mesmo não produziu (um save
 * gravado por outro cliente, um storage cheio, um relógio mentiroso) e o código
 * assume o formato feliz. Nenhum deles tinha teste porque nenhum é alcançável
 * sem montar o app.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { GameStateProvider, useGameState } from './GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { getStageLevel, getStageBranch } from '../types/progression';

function Espiao() {
  const { gameState } = useGameState();
  return <pre data-testid="estado">{JSON.stringify(gameState)}</pre>;
}
const montar = () => {
  render(<GameStateProvider><Espiao /></GameStateProvider>);
  return JSON.parse(screen.getByTestId('estado').textContent!);
};

beforeEach(() => {
  installDomGlobals();
  localStorage.clear();
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('save hostil: campo com tipo errado não pode dar tela branca', () => {
  // ACHADO desta rodada. `/api/save` valida que `state` é um OBJETO, e nada
  // além disso — nem a rota nem o cliente checam o tipo de cada campo. E hoje,
  // em produção, a autenticação está desligada (`FIREBASE_PROJECT_ID` ausente,
  // STATUS §3.1): qualquer um que conheça o e-mail de alguém consegue gravar
  // `{"state":{"evolutionStage":42}}` no save dessa pessoa. Na próxima carga,
  // `getStageLevel` fazia `stage.split(...)` e lançava DENTRO do inicializador
  // do provider — tela branca permanente, sem caminho de recuperação pela UI,
  // porque toda carga seguinte lê o mesmo save.
  //
  // Corrigido no ponto único por onde todo estágio passa (types/progression.ts).
  const hostis: Array<[string, unknown]> = [
    ['número', 42],
    ['objeto', { toString: () => 'mega' }],
    ['array', ['mega']],
    ['booleano', true],
    ['null', null],
  ];

  for (const [nome, evolutionStage] of hostis) {
    it(`evolutionStage ${nome} degrada para rookie em vez de derrubar o app`, () => {
      localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ evolutionStage, perfectDays: 5 }));
      const s = montar();
      expect(s.perfectDays).toBe(5);          // o resto do save é preservado
      expect(s.maxHealthPoints).toBeGreaterThan(0);
    });
  }

  it('as funções puras que levaram o fix continuam corretas para entrada boa', () => {
    expect(getStageLevel('champion-power')).toBe('champion');
    expect(getStageLevel('mega-power')).toBe('mega');  // id do esquema da árvore
    expect(getStageLevel('rookie')).toBe('rookie');
    expect(getStageBranch('champion-power')).toBe('power');
    // e o fix não inventa resposta para lixo
    expect(getStageLevel(42 as unknown as string)).toBe('rookie');
    expect(getStageBranch(42 as unknown as string)).toBeNull();
  });
});

describe('quota de localStorage — o storage pode estar cheio ou bloqueado', () => {
  it('QuotaExceededError na persistência NÃO derruba mais a árvore — o jogo segue em memória', () => {
    // `GameStateContext.tsx:359` faz `localStorage.setItem(...)` dentro de um
    // useEffect, SEM try/catch. Quando o storage enche — `activityLog` (90) +
    // `completedTasks` + `digiapp_state_v3` + `SOULMON_PROFILE` + inventário,
    // num domínio COMPARTILHADO COM O DIGIAPP (o mesmo `pages.dev`) —, o
    // `setItem` lança e o React desmonta a árvore ("Consider adding an error
    // boundary"). Não é "estado que não persiste em silêncio": é o app caindo.
    //
    // CORRIGIDO nesta rodada (`utils/safeStorage.ts` + `GameStateContext`):
    // a gravação passa por `writeLocal`, que nunca lança e avisa o usuário UMA
    // vez. Não é "engolir o erro": trocar queda por perda silenciosa seria pior
    // no moat, então o aviso ao jogador é parte do fix (ver
    // `GameStateContext.storage.test.tsx`).
    const real = localStorage.setItem.bind(localStorage);
    vi.spyOn(globalThis.localStorage, 'setItem').mockImplementation((k: string, v: string) => {
      if (k === STORAGE_KEYS.GAME_STATE) {
        const err = new Error('QuotaExceededError');
        err.name = 'QuotaExceededError';
        throw err;
      }
      real(k, v);
    });
    const s = montar();                        // não lança
    expect(s.evolutionStage).toBe('rookie');   // e o jogo está jogável em memória
  });

  it('storage BLOQUEADO na leitura não derruba mais o app — abre com estado novo', () => {
    // O comentário do provider diz "A corrupted save must never white-screen the
    // app" e embrulha `getItem(GAME_STATE)` num try/catch. Mas a linha seguinte
    // (`GameStateContext.tsx:250`, e a gêmea no ramo de save novo) lê
    // `EGG_TYPE` FORA do try — e o efeito de persistência lê `SAVE_ID`,
    // `USER_NAME` e `LANGUAGE` também sem proteção.
    //
    // Cenário concreto: Safari com "bloquear todos os cookies", modo anônimo em
    // alguns navegadores, ou WebView com storage desabilitado — `getItem` lança
    // `SecurityError` e o app não abria. Agora TODA leitura passa por
    // `readLocal`, que devolve null em vez de lançar.
    vi.spyOn(globalThis.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError: storage bloqueado');
    });
    const s = montar();
    expect(s.evolutionStage).toBe('rookie');
    expect(s.eggType).toBe('ignar');      // o fallback do EGG_TYPE também aguenta
  });

  it('save ilegível com storage FUNCIONANDO continua degradando bem (não regrediu)', () => {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, '{corrompido');
    expect(montar().evolutionStage).toBe('rookie');
  });
});

describe('conflito entre dois aparelhos — last-write-wins, sem versão', () => {
  it('OBSERVADO: o save não carrega NENHUM carimbo de versão ou revisão', () => {
    // O cloud save é last-write-wins puro: celular offline à tarde + desktop à
    // noite = o celular sobrescreve o desktop ao reconectar, em silêncio. Não
    // existe `rev`, `updatedAt` nem vetor de versão em lugar nenhum do estado —
    // ou seja, hoje NÃO HÁ COMO nem detectar o conflito, muito menos resolvê-lo.
    // Este caso trava o fato: no dia em que alguém acrescentar versionamento,
    // ele cai e vira o teste da regra de merge.
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ perfectDays: 10 }));
    const s = montar();
    const campos = Object.keys(s);
    expect(campos.some(k => /^(rev|version|updatedAt|savedAt|clock)$/i.test(k))).toBe(false);
  });
});
