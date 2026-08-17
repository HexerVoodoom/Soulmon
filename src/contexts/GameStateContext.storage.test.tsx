// NOTA (jsdom 29): os spies têm que ir em `Storage.prototype`, não na
// INSTÂNCIA `globalThis.localStorage`. O Storage do jsdom 29 é um Proxy cujo
// trap `defineProperty` grava um ITEM de storage em vez de definir a
// propriedade — `vi.spyOn(localStorage, 'setItem')` virava
// `localStorage.setItem('setItem', fn)` e o método real continuava intacto,
// então estes 6 testes NUNCA exercitavam o caminho de falha e ficaram
// vermelhos por meses, documentados como "falha de ambiente".
// @vitest-environment jsdom
/**
 * B-2 / B-3 — resiliência de storage.
 *
 * Cenário concreto: o domínio é COMPARTILHADO com o DigiApp, então o orçamento
 * de `localStorage` não é só nosso; e Safari em modo privado / WebView com
 * storage desabilitado fazem `getItem` LANÇAR. Antes desta rodada os dois casos
 * derrubavam a árvore do React — tela branca, sem caminho de recuperação.
 *
 * A garantia travada aqui: **degrada, não cai**, e o usuário é avisado UMA vez,
 * com par PT/EN.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { GameStateProvider, useGameState } from './GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';
import {
  readLocal,
  writeLocal,
  removeLocal,
  onStorageDegraded,
  resetStorageNotice,
  storageNoticeSent,
  storageDegradedMessage,
} from '../utils/safeStorage';

const avisos: string[] = [];
// As OPÇÕES do toast também são conteúdo: um aviso com `duration: 0` some da
// tela antes de ser lido, e nenhum teste notaria (medido na rodada 8 — o
// mutante `10000 -> 0` sobrevivia).
const opcoes: Array<Record<string, unknown> | undefined> = [];
vi.mock('sonner', () => ({
  toast: {
    warning: (msg: string, opts?: Record<string, unknown>) => {
      avisos.push(String(msg)); opcoes.push(opts);
    },
    error: () => {}, success: () => {}, info: () => {}, message: () => {},
  },
}));

function Espiao() {
  const { gameState, setGameState } = useGameState();
  return (
    <>
      <pre data-testid="estado">{JSON.stringify(gameState)}</pre>
      <button onClick={() => setGameState(s => ({ ...s, gamePoints: (s.gamePoints ?? 0) + 1 }))}>
        mais
      </button>
    </>
  );
}
const montar = () => {
  render(<GameStateProvider><Espiao /></GameStateProvider>);
  return JSON.parse(screen.getByTestId('estado').textContent!);
};

beforeEach(() => {
  installDomGlobals();
  localStorage.clear();
  avisos.length = 0;
  opcoes.length = 0;
  resetStorageNotice();
  onStorageDegraded(null);
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  resetStorageNotice();
  onStorageDegraded(null);
});

/** Faz `setItem` lançar o erro de cota que o navegador lança de verdade. */
function encherOStorage() {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    const err = new Error('The quota has been exceeded.');
    err.name = 'QuotaExceededError';
    throw err;
  });
}

// ── A camada, isolada ───────────────────────────────────────────────────────
describe('safeStorage: a camada nunca lança', () => {
  it('readLocal devolve null quando o storage está bloqueado', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(() => readLocal('qualquer')).not.toThrow();
    expect(readLocal('qualquer')).toBeNull();
  });

  it('writeLocal devolve false em vez de lançar, e true no caminho feliz', () => {
    expect(writeLocal('k', 'v')).toBe(true);
    expect(localStorage.getItem('k')).toBe('v');
    encherOStorage();
    expect(writeLocal('k', 'v2')).toBe(false);
  });

  it('removeLocal também não lança', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(removeLocal('k')).toBe(false);
  });

  it('o aviso ao usuário sai UMA vez, mesmo com N falhas seguidas', () => {
    const vistos: string[] = [];
    onStorageDegraded(k => vistos.push(k));
    encherOStorage();
    writeLocal('a', '1');
    writeLocal('b', '2');
    writeLocal('c', '3');
    expect(vistos).toEqual(['quota']);
    expect(storageNoticeSent()).toBe(true);
  });

  it('um listener que explode não derruba quem tentou gravar', () => {
    onStorageDegraded(() => { throw new Error('toast quebrado'); });
    encherOStorage();
    expect(() => writeLocal('a', '1')).not.toThrow();
  });

  it('a mensagem tem par PT/EN e distingue cota de storage bloqueado', () => {
    const ptQuota = storageDegradedMessage('quota', 'pt-BR');
    const enQuota = storageDegradedMessage('quota', 'en-US');
    const ptRead = storageDegradedMessage('read', 'pt-BR');
    const enRead = storageDegradedMessage('read', 'en-US');
    for (const m of [ptQuota, enQuota, ptRead, enRead]) expect(m.length).toBeGreaterThan(20);
    expect(ptQuota).not.toBe(enQuota);
    expect(ptRead).not.toBe(enRead);
    expect(ptQuota).not.toBe(ptRead);
    // EN não pode carregar acento do texto PT (o bug do push das 22h)
    expect(/[áàâãéêíóôõúç]/i.test(enQuota + enRead)).toBe(false);
  });
});

// ── O provider, montado ─────────────────────────────────────────────────────
describe('GameStateProvider com storage hostil', () => {
  it('storage CHEIO: o app monta, continua jogável e avisa o jogador uma vez', () => {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ perfectDays: 3, gamePoints: 10 }));
    encherOStorage();

    const s = montar();
    expect(s.perfectDays).toBe(3);            // leu o save antes de encher

    // Três atualizações: o estado anda em memória e o aviso não vira spam.
    const botao = screen.getByText('mais');
    act(() => { botao.click(); });
    act(() => { botao.click(); });
    act(() => { botao.click(); });

    const depois = JSON.parse(screen.getByTestId('estado').textContent!);
    expect(depois.gamePoints).toBe(13);
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toMatch(/salvo|saved/i);
    // 10s: tempo de LER. O padrão do sonner (4s) já é curto para um texto de
    // duas linhas, e 0 faria o aviso piscar e sumir.
    expect(opcoes[0]?.duration).toBe(10000);
  });

  it('storage BLOQUEADO: monta com estado novo e avisa (não é queda nem silêncio)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError: storage bloqueado');
    });
    const s = montar();
    expect(s.evolutionStage).toBe('rookie');
    expect(s.maxHealthPoints).toBeGreaterThan(0);
    expect(avisos).toHaveLength(1);
  });

  it('o aviso sai no idioma escolhido (PT) e não em inglês fixo', () => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, 'pt-BR');
    encherOStorage();
    montar();
    act(() => { screen.getByText('mais').click(); });
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toBe(storageDegradedMessage('quota', 'pt-BR'));
  });

  it('save que não é objeto (array/primitivo) não vira estado vazio em silêncio', () => {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify([1, 2, 3]));
    const s = montar();
    expect(s.evolutionStage).toBe('rookie');
    expect(Array.isArray(s)).toBe(false);
    expect(s.unlockedEvolutions).toEqual(['rookie']);
  });

  it('storage funcionando continua persistindo (o fix não desligou a gravação)', () => {
    montar();
    act(() => { screen.getByText('mais').click(); });
    const gravado = JSON.parse(localStorage.getItem(STORAGE_KEYS.GAME_STATE)!);
    expect(gravado.gamePoints).toBe(1);
    expect(avisos).toHaveLength(0);
  });
});
