import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import {
  readJson, writeJson, readFlag, writeFlag, readNumber,
  writeLocal, onStorageDegraded, resetStorageNotice, storageNoticeSent,
} from './safeStorage';

// ---------------------------------------------------------------------------
// GUARD — nenhuma chamada CRUA de localStorage volta para `src/`.
//
// Histórico: a rodada 3 criou o `safeStorage` porque um `QuotaExceededError`
// dentro de um efeito do React DESMONTA a árvore (tela branca, não perda
// silenciosa). O fix parou no provider: a rodada 4 mediu **122 chamadas cruas**
// restantes em `src/`, e uma delas já tinha produzido dano real (a adoção de
// save gravava a IDENTIDADE antes do DADO; com storage cheio o app trocava de
// save e sobrescrevia o do outro aparelho).
//
// O padrão do erro não é "esqueceram um arquivo" — é **fix aplicado por arquivo
// em vez de por regra**. Este guard existe para transformar a regra em algo
// mecânico: chamada crua nova = teste vermelho.
//
// Se faltar uma forma na API (`readJson`, `readNumber`, `writeFlag`…),
// **ESTENDA o safeStorage** em vez de acrescentar exceção aqui. Foi a falta de
// formas derivadas que deixou as 122 sobreviverem à primeira vez.
// ---------------------------------------------------------------------------

const SRC = resolve(__dirname, '..');

/**
 * EXCEÇÕES JUSTIFICADAS — cada uma com o motivo. A lista é curta de propósito;
 * crescer aqui é o sinal de que a API está faltando alguma coisa.
 */
const EXCECOES: Record<string, string> = {
  // O dono da regra. É o único lugar onde `localStorage` PODE ser tocado: é
  // ele quem embrulha o try/catch que todo o resto consome.
  'utils/safeStorage.ts': 'a própria camada defensiva',
};

function arquivosDeFonte(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      arquivosDeFonte(full, out);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry)) continue;
    if (/\.test\.(ts|tsx)$/.test(entry)) continue;      // testes montam storage falso de propósito
    if (full.replace(/\\/g, '/').includes('/src/test/')) continue; // utilitários de teste
    out.push(full);
  }
  return out;
}

/**
 * Tira comentários antes de procurar. Sem isto, o guard ficaria vermelho por
 * um comentário que EXPLICA o bug — e a reação natural seria apagar a
 * explicação, que é a parte que impede o bug de voltar.
 */
function semComentarios(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

/** A forma proibida: qualquer acesso direto ao objeto `localStorage`. */
const CRU = /\blocalStorage\s*[.?[]/;

describe('guard — localStorage cru não volta para src/', () => {
  // AUTOVERIFICAÇÃO. Um guard sem isto passa pelo motivo errado; já aconteceu
  // duas vezes nesta sessão. Aqui ele é obrigado a provar que ENXERGA.
  describe('o instrumento enxerga', () => {
    it('reconhece as três formas cruas', () => {
      expect(CRU.test("localStorage.setItem(K, v);")).toBe(true);
      expect(CRU.test("const x = localStorage.getItem(K);")).toBe(true);
      expect(CRU.test("localStorage.removeItem(K);")).toBe(true);
      expect(CRU.test("window.localStorage.setItem(K, v);")).toBe(true);
      expect(CRU.test("localStorage?.getItem(K)")).toBe(true);
      expect(CRU.test("localStorage['x']")).toBe(true);
    });

    it('não acusa a forma correta nem a camada defensiva', () => {
      expect(CRU.test("writeLocal(STORAGE_KEYS.THEME, next);")).toBe(false);
      expect(CRU.test("readJson<number[]>(STORAGE_KEYS.FOOD_FEED_TIMES, []);")).toBe(false);
      // `globalThis.localStorage` TAMBÉM conta: se não contasse, bastaria
      // prefixar para escapar do guard.
      expect(CRU.test("globalThis.localStorage?.setItem(key, value);")).toBe(true);
    });

    it('ignora comentários, mas NÃO código depois de um comentário', () => {
      expect(CRU.test(semComentarios('// localStorage.setItem(K, v) era assim'))).toBe(false);
      expect(CRU.test(semComentarios('/* localStorage.getItem(K) */'))).toBe(false);
      expect(CRU.test(semComentarios('// nota\nlocalStorage.setItem(K, v);'))).toBe(true);
    });

    it('o varredor realmente lê arquivos de verdade (e acha o safeStorage)', () => {
      const arquivos = arquivosDeFonte(SRC);
      expect(arquivos.length).toBeGreaterThan(50);
      const rels = arquivos.map(f => relative(SRC, f).replace(/\\/g, '/'));
      expect(rels).toContain('utils/safeStorage.ts');
      expect(rels).toContain('App.tsx');
      // Controle negativo do varredor: se ele NÃO excluísse a própria camada,
      // o guard estaria vermelho. Prova que a exceção é necessária e suficiente.
      expect(CRU.test(semComentarios(readFileSync(resolve(SRC, 'utils/safeStorage.ts'), 'utf8'))))
        .toBe(true);
    });
  });

  it('nenhum arquivo de src/ chama localStorage direto', () => {
    const infratores: string[] = [];
    for (const full of arquivosDeFonte(SRC)) {
      const rel = relative(SRC, full).replace(/\\/g, '/');
      if (rel in EXCECOES) continue;
      const code = semComentarios(readFileSync(full, 'utf8'));
      code.split('\n').forEach((linha, i) => {
        if (CRU.test(linha)) infratores.push(`${rel}:${i + 1}  ${linha.trim()}`);
      });
    }
    expect(infratores, `use safeStorage (ou ESTENDA a API) em vez de localStorage cru:\n${infratores.join('\n')}`)
      .toEqual([]);
  });

  it('a lista de exceções fica pequena — crescer aqui é sinal de API faltando', () => {
    expect(Object.keys(EXCECOES)).toEqual(['utils/safeStorage.ts']);
  });
});

// ---------------------------------------------------------------------------
// As formas derivadas que a migração exigiu. Sem elas cada call site
// reimplementaria o try/catch em volta do JSON.parse — que foi exatamente o
// motivo de 122 chamadas cruas sobreviverem à criação da camada.
// ---------------------------------------------------------------------------

describe('safeStorage — formas derivadas', () => {
  const original = globalThis.localStorage;

  beforeEach(() => resetStorageNotice());
  afterEach(() => {
    Object.defineProperty(globalThis, 'localStorage', { value: original, configurable: true });
    onStorageDegraded(null);
    resetStorageNotice();
  });

  function storageFalso(over: Partial<Storage> = {}): void {
    const mapa = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: (k: string) => mapa.get(k) ?? null,
        setItem: (k: string, v: string) => { mapa.set(k, v); },
        removeItem: (k: string) => { mapa.delete(k); },
        ...over,
      },
      configurable: true,
    });
  }

  it('readJson devolve o fallback com chave ausente, JSON torto ou "null"', () => {
    storageFalso();
    expect(readJson('ausente', { a: 1 })).toEqual({ a: 1 });
    globalThis.localStorage.setItem('torto', '{{{');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(readJson('torto', [])).toEqual([]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    globalThis.localStorage.setItem('nulo', 'null');
    expect(readJson('nulo', 7)).toBe(7);
  });

  it('JSON torto NÃO gasta o aviso ao usuário (não é falha de plataforma)', () => {
    storageFalso();
    globalThis.localStorage.setItem('torto', 'nope');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    readJson('torto', null);
    warn.mockRestore();
    expect(storageNoticeSent()).toBe(false);
  });

  it('readFlag/writeFlag e readNumber mantêm o formato que o app já grava', () => {
    storageFalso();
    writeFlag('f', true);
    expect(globalThis.localStorage.getItem('f')).toBe('true');
    expect(readFlag('f')).toBe(true);
    writeFlag('f', false);
    expect(readFlag('f')).toBe(false);
    expect(readNumber('nao-existe', 3)).toBe(3);
    globalThis.localStorage.setItem('n', 'abc');
    expect(readNumber('n', 3)).toBe(3);
    globalThis.localStorage.setItem('n', '42');
    expect(readNumber('n')).toBe(42);
  });

  it('writeJson devolve false com quota estourada, sem lançar', () => {
    const quota = () => { const e = new Error('cheio'); e.name = 'QuotaExceededError'; throw e; };
    storageFalso({ setItem: quota });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // AUTOVERIFICAÇÃO do instrumento: o storage falso REALMENTE lança. Sem isto
    // o caso passaria com um storage que nunca falha.
    expect(() => globalThis.localStorage.setItem('x', 'y')).toThrow(/cheio/);
    expect(writeJson('k', { grande: true })).toBe(false);
    warn.mockRestore();
  });

  it('silent registra no console mas NÃO gasta o aviso único do usuário', () => {
    const quota = () => { const e = new Error('cheio'); e.name = 'QuotaExceededError'; throw e; };
    storageFalso({ setItem: quota });
    const avisos: string[] = [];
    onStorageDegraded(k => avisos.push(k));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Preferência cosmética (tema, idioma, mudo): degrada configuração.
    expect(writeLocal('tema', 'dark', { silent: true })).toBe(false);
    expect(avisos).toEqual([]);
    expect(storageNoticeSent()).toBe(false);
    expect(warn).toHaveBeenCalled(); // quem depura continua vendo

    // Progresso (save, identidade, limite diário): o usuário PRECISA saber.
    expect(writeLocal('save', '{}')).toBe(false);
    expect(avisos).toEqual(['quota']);
    expect(storageNoticeSent()).toBe(true);
    warn.mockRestore();
  });

  it('o aviso continua sendo UM só — falha cosmética depois não repete toast', () => {
    const quota = () => { const e = new Error('cheio'); e.name = 'QuotaExceededError'; throw e; };
    storageFalso({ setItem: quota });
    const avisos: string[] = [];
    onStorageDegraded(k => avisos.push(k));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    writeLocal('save', '{}');
    writeLocal('save2', '{}');
    writeLocal('tema', 'dark', { silent: true });
    warn.mockRestore();
    expect(avisos).toEqual(['quota']);
  });
});
