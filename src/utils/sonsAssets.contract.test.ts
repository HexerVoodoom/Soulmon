/**
 * A RÉGUA DOS ASSETS DE ÁUDIO — S6 (bytes, zero no bundle inicial) e S9
 * (procedência nas duas direções). Ver o cabeçalho de `sonsAssets.ts`.
 *
 * O que ela prova: que cada arquivo do manifesto EXISTE em `public/sounds/`
 * com o hash e os bytes declarados, que a soma cabe no S6, que nenhum está na
 * lista de pré-cache do service worker, que `docs/Attributions.md` cita cada
 * hash, e que o manifesto não copia alvo de loudness (footgun 9). O que ela
 * NÃO prova: originalidade — não existe `grep` por melodia (S9/S15).
 */
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ASSETS_DE_SOM, CAMADAS_DA_TRILHA, recortarSilencio } from './sonsAssets';

const raiz = join(__dirname, '..', '..');
const TODOS = [...Object.values(ASSETS_DE_SOM), ...Object.values(CAMADAS_DA_TRILHA)];
/** S6, literal: 300 KB no total. */
const TETO_S6_BYTES = 300 * 1024;

const sha256 = (b: Buffer) => createHash('sha256').update(b).digest('hex');

describe('S9 — procedência nas duas direções', () => {
  it('a amostra não é vazia (o teste não pode passar por lista vazia)', () => {
    expect(TODOS.length).toBeGreaterThanOrEqual(5);
  });

  it('todo asset do manifesto existe em public/ com o SHA-256 e os bytes declarados', () => {
    for (const a of TODOS) {
      const arq = join(raiz, 'public', a.url);
      expect(existsSync(arq), `${a.url} não existe em public/`).toBe(true);
      const b = readFileSync(arq);
      expect(sha256(b), `${a.url}: hash do disco ≠ manifesto`).toBe(a.sha256);
      expect(b.length, `${a.url}: bytes do disco ≠ manifesto`).toBe(a.bytes);
    }
  });

  it('todo arquivo em public/sounds/ está no manifesto (nada entra por fora)', () => {
    const emDisco = readdirSync(join(raiz, 'public', 'sounds')).filter(f => !f.startsWith('.'));
    const noManifesto = new Set(TODOS.map(a => a.url.replace('/sounds/', '')));
    for (const f of emDisco) expect(noManifesto.has(f), `${f} está em public/sounds/ e não no manifesto`).toBe(true);
  });

  it('docs/Attributions.md cita cada arquivo com o hash', () => {
    const attr = readFileSync(join(raiz, 'docs', 'Attributions.md'), 'utf8');
    for (const a of TODOS) {
      expect(attr, `Attributions.md não cita ${a.url}`).toContain(`public${a.url}`);
      expect(attr, `Attributions.md não cita o hash de ${a.url}`).toContain(a.sha256);
    }
  });

  it('a origem e a data são declaradas, e o prompt é referência (não texto no bundle)', () => {
    for (const a of TODOS) {
      expect(a.origem).toMatch(/^higgsfield\//);
      expect(a.geradoEm).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(a.promptRef).toMatch(/pacote-prompts\.md §2\.\d+/);
    }
  });
});

describe('S6 — 300 KB no total, zero no bundle inicial', () => {
  it('a soma dos bytes cabe no teto', () => {
    const total = TODOS.reduce((s, a) => s + a.bytes, 0);
    expect(total, `${total} bytes > ${TETO_S6_BYTES}`).toBeLessThanOrEqual(TETO_S6_BYTES);
  });

  it('nenhum asset está em PRECACHE_URLS do service worker', () => {
    const sw = readFileSync(join(raiz, 'public', 'sw.js'), 'utf8');
    const lista = sw.match(/PRECACHE_URLS\s*=\s*\[([\s\S]*?)\]/)?.[1] ?? '';
    expect(lista.length, 'não achei PRECACHE_URLS').toBeGreaterThan(0);
    for (const a of TODOS) expect(lista, `${a.url} está pré-cacheado: viola "zero no bundle inicial"`).not.toContain(a.url);
  });

  it('nenhum módulo de src/ importa um .webm (asset entra pela rede, depois do gesto)', () => {
    const varrer = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(e =>
      e.isDirectory() ? varrer(join(dir, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [join(dir, e.name)] : []);
    const arquivos = varrer(join(raiz, 'src'));
    expect(arquivos.length).toBeGreaterThan(100);
    for (const f of arquivos) {
      const src = readFileSync(f, 'utf8');
      expect(/import\s[^;]*\.webm/.test(src), `${f} importa um .webm`).toBe(false);
    }
  });
});

describe('as camadas da trilha fecham o loop no mesmo ponto (mesmo BPM, mesmo compasso)', () => {
  it('toda camada tem a mesma duracaoS, e ela é múltiplo inteiro do compasso de 100 BPM (2,4 s)', () => {
    const durs = new Set(Object.values(CAMADAS_DA_TRILHA).map(c => c.duracaoS));
    expect(durs.size).toBe(1);
    const [d] = [...durs];
    expect(Math.abs(d / 2.4 - Math.round(d / 2.4))).toBeLessThan(1e-9);
  });
});

describe('footgun 9 — o manifesto não copia alvo de loudness', () => {
  it('sonsAssets.ts não contém número de LUFS nem dBTP', () => {
    const src = readFileSync(join(__dirname, 'sonsAssets.ts'), 'utf8');
    expect(/-\s?(16|19|22|25|28)(\.0)?\s*(LUFS|dB)/i.test(src)).toBe(false);
    expect(src).not.toMatch(/ALVO_LUFS_M|OFFSET_POR_SOM_DB/);
  });
});

describe('recortarSilencio — o pré-rolo do MediaRecorder sai, o som fica', () => {
  function bufferFalso(dados: number[]) {
    const ctx = {
      createBuffer: (_c: number, n: number, sr: number) => {
        const canal = new Float32Array(n);
        return {
          numberOfChannels: 1, length: n, sampleRate: sr, duration: n / sr,
          getChannelData: () => canal,
          copyToChannel: (src: Float32Array) => canal.set(src),
        } as unknown as AudioBuffer;
      },
    } as unknown as BaseAudioContext;
    const d = new Float32Array(dados);
    const buf = {
      numberOfChannels: 1, length: d.length, sampleRate: 48000, duration: d.length / 48000,
      getChannelData: () => d,
    } as unknown as AudioBuffer;
    return { ctx, buf };
  }

  it('corta o silêncio da cabeça até o primeiro sample audível', () => {
    const { ctx, buf } = bufferFalso([0, 0, 0.0005, 0, 0.25, 0.5, 0]);
    const r = recortarSilencio(ctx, buf);
    expect(Array.from(r.getChannelData(0))).toEqual([0.25, 0.5, 0]);
  });

  it('sem pré-rolo devolve o mesmo buffer; tudo silêncio também (nunca devolve vazio)', () => {
    const a = bufferFalso([0.5, 0]);
    expect(recortarSilencio(a.ctx, a.buf)).toBe(a.buf);
    const b = bufferFalso([0, 0, 0]);
    expect(recortarSilencio(b.ctx, b.buf)).toBe(b.buf);
  });
});
