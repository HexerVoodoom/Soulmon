/**
 * A RÉGUA DOS 7 EFEITOS DE COMBATE DE BANCO LIVRE (pedido do dono, 20/10/2026; `docs/REGISTRO-DE-DECISOES.md` §130).
 *
 * O que ela prova: que cada um dos 7 eventos tem um arquivo REAL em `public/sounds/` com o hash e os bytes declarados, que o
 * manifesto traz origem + autor + licença livre + data + hash do original para CADA arquivo e que `docs/Attributions.md` cita
 * tudo (sample sem procedência reprova), que o peso/duração/loudness/true peak medidos estão dentro da régua do projeto, que o
 * arquivo é WebM/Opus, e que o sample é de fato o que toca (com o procedural como fallback). O que ela NÃO prova: originalidade
 * nem a escuta humana (gate S8) — as medidas do manifesto foram tiradas do arquivo DECODIFICADO pelo Chrome (não há decoder Opus
 * em Node), então o teste confere o manifesto contra a régua e o arquivo contra o hash, não re-mede o áudio.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { SFX_DE_COMBATE_LIVRES, TETO_BYTES_SFX_LIVRE, esquecerAssets, prepararSfxLivres, sfxLivrePronto } from './sonsAssets';
import { NOMES_SFX_DE_COMBATE, SFX_DE_COMBATE } from './sfxCombate';
import { ALVO_LUFS_M, CATEGORIA_DO_SOM, TETO_DBTP, TOLERANCIA_LU } from './loudness';
import * as sounds from './sounds';
import { esquecerJanelaDeCoincidencia } from './audioBus';
import { prepararSfxCombate } from './sfxCombateCarga';

const raiz = join(__dirname, '..', '..');
const sha256 = (b: Buffer) => createHash('sha256').update(b).digest('hex');
const NOMES = Object.keys(SFX_DE_COMBATE_LIVRES) as (keyof typeof SFX_DE_COMBATE_LIVRES)[];
const attr = readFileSync(join(raiz, 'docs', 'Attributions.md'), 'utf8');

describe('os 7 eventos têm um sample cada', () => {
  it('são exatamente os 7 do pedido (D-86..D-92), o mesmo conjunto do fallback procedural', () => {
    expect([...NOMES].sort()).toEqual([...NOMES_SFX_DE_COMBATE].sort());
    expect(NOMES.map(n => SFX_DE_COMBATE_LIVRES[n].id).sort()).toEqual(['D-86', 'D-87', 'D-88', 'D-89', 'D-90', 'D-91', 'D-92']);
    for (const n of NOMES) expect(SFX_DE_COMBATE_LIVRES[n].id, n).toBe(SFX_DE_COMBATE[n].id);
  });

  it('evento → arquivo: cada função `play*` do combate está ligada ao seu efeito e não há dois eventos no mesmo arquivo', () => {
    const urls = NOMES.map(n => SFX_DE_COMBATE_LIVRES[n].url);
    expect(new Set(urls).size).toBe(NOMES.length);
    const mapa: Record<string, string> = {
      playAttack: 'attack', playDefend: 'defend', playAttackRanged: 'attack-ranged', playCharge: 'charge',
      playSpecial: 'special', playVictory: 'victory', playDefeat: 'defeat',
    };
    for (const n of NOMES) expect(SFX_DE_COMBATE_LIVRES[n].url, n).toBe(`/sounds/sfx-combate-${mapa[n]}.webm`);
    const fonte = readFileSync(join(__dirname, 'sounds.ts'), 'utf8');
    for (const n of NOMES) expect(fonte, n).toContain(`export function ${n}(): void { playSfx('${n}'); }`);
  });
});

describe('S9 — procedência por arquivo, nas duas direções', () => {
  it('todo sample existe em public/sounds/ com o SHA-256 e os bytes declarados, é WebM/Opus e cabe em 40 KB', () => {
    for (const n of NOMES) {
      const a = SFX_DE_COMBATE_LIVRES[n];
      const arq = join(raiz, 'public', a.url);
      expect(existsSync(arq), `${a.url} não existe`).toBe(true);
      const b = readFileSync(arq);
      expect(sha256(b), `${a.url}: hash do disco ≠ manifesto`).toBe(a.sha256);
      expect(b.length, `${a.url}: bytes do disco ≠ manifesto`).toBe(a.bytes);
      expect(b.length, `${a.url} passa de 40 KB`).toBeLessThanOrEqual(TETO_BYTES_SFX_LIVRE);
      expect(b.subarray(0, 4).toString('hex'), `${a.url}: não é EBML/WebM`).toBe('1a45dfa3');
      expect(b.subarray(0, 1024).includes(Buffer.from('A_OPUS')), `${a.url}: o codec não é Opus`).toBe(true);
    }
  });

  it('todo `sfx-combate-*` em public/sounds/ está no manifesto (nada entra por fora)', () => {
    const noManifesto = new Set(NOMES.map(n => SFX_DE_COMBATE_LIVRES[n].url.replace('/sounds/', '')));
    for (const f of readdirSync(join(raiz, 'public', 'sounds'))) if (f.startsWith('sfx-combate-')) expect(noManifesto.has(f), f).toBe(true);
  });

  it('CADA arquivo declara origem, autor, licença livre com link, data de acesso, hash do original e se exige atribuição', () => {
    for (const n of NOMES) {
      const f = SFX_DE_COMBATE_LIVRES[n].fonte;
      expect(f.arquivo.length, n).toBeGreaterThan(3);
      expect(f.pacote.length, n).toBeGreaterThan(2);
      expect(f.urlOrigem, n).toMatch(/^https:\/\/(kenney\.nl\/assets\/|opengameart\.org\/content\/)/);
      expect(f.autor.length, n).toBeGreaterThan(2);
      // Só licença que permite uso comercial sem condição: CC0. (CC-BY exigiria atribuição; NC/Sampling+ estão fora.)
      expect(f.licenca, n).toBe('CC0 1.0');
      expect(f.urlLicenca, n).toBe('https://creativecommons.org/publicdomain/zero/1.0/');
      expect(f.acessadoEm, n).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(f.sha256Original, n).toMatch(/^[0-9a-f]{64}$/);
      expect(typeof f.atribuicaoObrigatoria, n).toBe('boolean');
    }
    expect(new Set(NOMES.map(n => SFX_DE_COMBATE_LIVRES[n].fonte.sha256Original)).size).toBe(NOMES.length);
  });

  it('docs/Attributions.md cita cada arquivo instalado, o hash dele e do original, o autor, a origem e a licença', () => {
    expect(attr).toContain('creativecommons.org/publicdomain/zero/1.0');
    for (const n of NOMES) {
      const a = SFX_DE_COMBATE_LIVRES[n];
      expect(attr, `Attributions.md não cita public${a.url}`).toContain(`public${a.url}`);
      expect(attr, `${a.url}: hash`).toContain(a.sha256);
      expect(attr, `${a.url}: hash do original`).toContain(a.fonte.sha256Original);
      expect(attr, `${a.url}: arquivo original`).toContain(a.fonte.arquivo);
      expect(attr, `${a.url}: origem`).toContain(a.fonte.urlOrigem);
      expect(attr, `${a.url}: autor`).toContain(a.fonte.autor);
      expect(attr, `${a.url}: licença`).toContain(a.fonte.licenca);
    }
  });

  it('o registro de decisões tem a linha do banco livre (alternativa que perdeu + o que falsificaria)', () => {
    const reg = readFileSync(join(raiz, 'docs', 'REGISTRO-DE-DECISOES.md'), 'utf8');
    const i = reg.indexOf('## 130. SFX de combate vêm de banco gratuito livre');
    expect(i).toBeGreaterThan(0);
    const bloco = reg.slice(i, i + 4000);
    expect(bloco).toContain('**Alternativa que perdeu:**');
    expect(bloco).toContain('**O que falsificaria:**');
  });

  it('nenhum sample está em PRECACHE_URLS (zero no bundle inicial e fora do pré-cache)', () => {
    const sw = readFileSync(join(raiz, 'public', 'sw.js'), 'utf8');
    const lista = sw.match(/PRECACHE_URLS\s*=\s*\[([\s\S]*?)\]/)?.[1] ?? '';
    for (const n of NOMES) expect(lista, n).not.toContain(SFX_DE_COMBATE_LIVRES[n].url);
  });
});

describe('a régua do projeto — duração, nível e pico (medidos no arquivo decodificado)', () => {
  it.each(NOMES)('%s: duração dentro do teto do pedido, loudness no alvo `arcade` ±1 LU, true peak ≤ −1 dBTP', (n) => {
    const a = SFX_DE_COMBATE_LIVRES[n];
    const teto = n === 'playVictory' || n === 'playDefeat' ? 2 : 1.2;
    expect(a.duracaoS).toBeGreaterThan(0.1);
    expect(a.duracaoS).toBeLessThanOrEqual(teto);
    expect(a.categoria).toBe('arcade');
    expect(CATEGORIA_DO_SOM[n], 'R-CAT: o evento é combate').toBe('arcade');
    expect(Math.abs(a.medidoLufsM - ALVO_LUFS_M.arcade)).toBeLessThanOrEqual(TOLERANCIA_LU);
    expect(a.medidoTruePeakDbtp).toBeLessThanOrEqual(TETO_DBTP);
  });

  it('o manifesto não copia alvo de loudness (dono único: loudness.ts) — só medidas', () => {
    const fonte = readFileSync(join(__dirname, 'sonsAssets.ts'), 'utf8');
    const i = fonte.indexOf('export const SFX_DE_COMBATE_LIVRES');
    const bloco = fonte.slice(i, fonte.indexOf('TETO_BYTES_SFX_LIVRE', i));
    expect(bloco).not.toMatch(/alvo/i);
  });
});

describe('o sample é o PADRÃO e o procedural é o fallback', () => {
  const param = () => ({ value: 0, setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} });
  let buffersTocados: unknown[] = [];
  let decodificar: (ab: ArrayBuffer) => Promise<unknown>;
  let ctxGlobal: unknown;

  beforeEach(() => {
    buffersTocados = []; ctxGlobal = undefined;
    esquecerAssets();
    esquecerJanelaDeCoincidencia();
    const dados = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => dados.get(k) ?? null, setItem: (k: string, v: string) => { dados.set(k, String(v)); },
      removeItem: (k: string) => { dados.delete(k); }, clear: () => dados.clear(), key: () => null, length: 0,
    });
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })));
    class Ctx {
      currentTime = 0; sampleRate = 48000; destination = {}; state = 'running';
      constructor() { ctxGlobal = this; }
      decodeAudioData(ab: ArrayBuffer) { return decodificar(ab); }
      createBuffer(_c: number, length: number) { return { length, duration: length / 48000, getChannelData: () => new Float32Array(length) }; }
      createBufferSource() {
        const f = { buffer: null as unknown, connect: () => {}, start: () => { buffersTocados.push(f.buffer); }, stop: () => {} };
        return f;
      }
      createGain() { return { gain: param(), connect: () => {} }; }
      createBiquadFilter() { return { type: '', Q: { value: 0 }, frequency: param(), connect: () => {} }; }
      createOscillator() { return { type: '', frequency: param(), connect: () => {}, start: () => {}, stop: () => {} }; }
      close() { return Promise.resolve(); }
    }
    vi.stubGlobal('window', { AudioContext: Ctx });
  });
  afterEach(() => { vi.unstubAllGlobals(); esquecerAssets(); });

  const decodificado = (marca: string) => ({
    marca, numberOfChannels: 1, sampleRate: 48000, length: 100, duration: 100 / 48000,
    getChannelData: () => Float32Array.from({ length: 100 }, () => 0.5), copyToChannel: () => {},
  });

  it('com o arquivo decodificado, cada um dos 7 toca EXATAMENTE o seu buffer (e nenhum procedural)', async () => {
    decodificar = async (ab) => decodificado(`buf-${ab.byteLength}`);
    await prepararSfxCombate();
    sounds.setMuted(false);
    sounds.playAttack(); // cria o contexto; o buffer ainda não está decodificado → fallback procedural nesta vez
    await prepararSfxLivres(ctxGlobal as AudioContext);
    for (const n of NOMES) {
      esquecerJanelaDeCoincidencia();
      const pronto = sfxLivrePronto(n);
      expect(pronto, `${n}: buffer decodificado`).not.toBeNull();
      const antes = buffersTocados.length;
      (sounds as unknown as Record<string, () => void>)[n]();
      expect(buffersTocados.length - antes, n).toBe(1);
      expect(buffersTocados[buffersTocados.length - 1], `${n}: tocou o buffer do SAMPLE`).toBe(pronto);
    }
  });

  it('FALLBACK: se o arquivo não decodifica, o procedural toca (uma fonte) em vez de ficar mudo', async () => {
    decodificar = async () => { throw new Error('Opus não suportado'); };
    await prepararSfxCombate();
    sounds.setMuted(false);
    sounds.playAttack();
    await prepararSfxLivres(ctxGlobal as AudioContext);
    for (const n of NOMES) {
      esquecerJanelaDeCoincidencia();
      expect(sfxLivrePronto(n), n).toBeNull();
      const antes = buffersTocados.length;
      (sounds as unknown as Record<string, () => void>)[n]();
      expect(buffersTocados.length - antes, n).toBe(1);
    }
  });

  it('MUDO: o interruptor de Efeitos silencia o sample e não baixa nada', async () => {
    decodificar = async () => decodificado('x');
    sounds.setMuted(true);
    for (const n of NOMES) (sounds as unknown as Record<string, () => void>)[n]();
    expect(buffersTocados).toEqual([]);
    expect(ctxGlobal).toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });
});
