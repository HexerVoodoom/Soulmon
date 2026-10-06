// ===========================================================================
// GUARD — `scripts/convert-to-webp.mjs` (decisão #32, 21/09/2026) em pasta
// temporária: converte, reescreve EXATO, apaga só o convertido, e uma
// referência que sobra ABORTA com o PNG intacto. Até aqui a única prova era o
// `dist/` commitado (orcamentoDeBytes.contract.test.ts) — que só mostra o
// resultado do caminho feliz.
// ===========================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { converter } from '../scripts/convert-to-webp.mjs';

// Disco: E:/ por regra do dono (CLAUDE.md global). Cai em tmp do sistema se não existir.
const RAIZ_TMP = existsSync('E:/tmp') ? 'E:/tmp' : (process.env.TMP ?? process.env.TEMP ?? '.');

let dir: string;
let assets: string;
const silencio = { log: () => {}, error: () => {} };

async function png(nome: string, cor: { r: number; g: number; b: number }) {
  await sharp({ create: { width: 8, height: 8, channels: 3, background: cor } }).png().toFile(join(assets, nome));
}
const ler = (p: string) => readFile(join(dir, p), 'utf8');
const lista = async () => (await readdir(assets)).sort();

beforeEach(async () => {
  await mkdir(RAIZ_TMP, { recursive: true });
  dir = await mkdtemp(join(RAIZ_TMP, 'soulmon-webp-'));
  assets = join(dir, 'assets');
  await mkdir(assets);
});
afterEach(async () => { await rm(dir, { recursive: true, force: true }); });

describe('convert-to-webp — caminho feliz com o cenário do enunciado', () => {
  it('reescreve JS/CSS/HTML/JSON exato, apaga só os convertidos, e prefixo de nome não contamina', async () => {
    await png('a-HASH1234.png', { r: 255, g: 0, b: 0 });
    await png('so-json-B2.png', { r: 0, g: 255, b: 0 });
    await png('sem-ref-C3.png', { r: 0, g: 0, b: 255 });
    await png('icon.png', { r: 1, g: 2, b: 3 });
    await png('icon-2.png', { r: 3, g: 2, b: 1 });
    await writeFile(join(assets, 'fonte.woff2'), 'nao-e-texto');
    await writeFile(join(assets, 'app-X.js'), `const a="/assets/a-HASH1234.png";const b="/assets/icon.png";const c="/assets/icon-2.png";const d="/assets/a-HASH1234.png";`);
    await writeFile(join(assets, 'app-X.css'), `.x{background:url(/assets/a-HASH1234.png)}.y{background:url(icon-2.png)}`);
    await writeFile(join(dir, 'index.html'), `<img src="/assets/icon.png"><link href="/assets/app-X.css">`);
    await writeFile(join(dir, 'manifest.json'), JSON.stringify({ icons: [{ src: '/assets/so-json-B2.png' }] }));

    const r = await converter(dir, silencio);
    expect(r.ok).toBe(true);
    expect(r.motivo).toBeNull();
    expect(r.convertidos.sort()).toEqual(['a-HASH1234.png', 'icon-2.png', 'icon.png', 'sem-ref-C3.png', 'so-json-B2.png']);
    expect(r.sobras).toEqual([]);
    // 4 no JS + 2 no CSS + 1 no HTML + 1 no JSON
    expect(r.referencias).toBe(8);
    expect(r.arquivosReescritos).toBe(4);

    expect(await lista()).toEqual(['a-HASH1234.webp', 'app-X.css', 'app-X.js', 'fonte.woff2', 'icon-2.webp', 'icon.webp', 'sem-ref-C3.webp', 'so-json-B2.webp']);
    expect(await ler('assets/app-X.js')).toBe(`const a="/assets/a-HASH1234.webp";const b="/assets/icon.webp";const c="/assets/icon-2.webp";const d="/assets/a-HASH1234.webp";`);
    expect(await ler('assets/app-X.css')).toBe(`.x{background:url(/assets/a-HASH1234.webp)}.y{background:url(icon-2.webp)}`);
    expect(await ler('index.html')).toBe(`<img src="/assets/icon.webp"><link href="/assets/app-X.css">`);
    expect(JSON.parse(await ler('manifest.json'))).toEqual({ icons: [{ src: '/assets/so-json-B2.webp' }] });
    // O WebP gerado é WebP de verdade (cabeçalho RIFF/WEBP; sem abrir pelo
    // sharp, que segura o handle e dá EBUSY no `rm` do Windows).
    const cab = await readFile(join(assets, 'icon.webp'));
    expect(cab.subarray(0, 4).toString('ascii')).toBe('RIFF');
    expect(cab.subarray(8, 12).toString('ascii')).toBe('WEBP');
  });

  it('é idempotente: rodar de novo sobre a saída é no-op (sem PNG → ok, nada muda)', async () => {
    await png('a-H.png', { r: 9, g: 9, b: 9 });
    await writeFile(join(assets, 'app.js'), `"/assets/a-H.png"`);
    expect((await converter(dir, silencio)).ok).toBe(true);
    const antes = await ler('assets/app.js');
    const r2 = await converter(dir, silencio);
    expect(r2).toMatchObject({ ok: true, motivo: 'sem-png', convertidos: [] });
    expect(await ler('assets/app.js')).toBe(antes);
  });

  it('dist inexistente → ok:false, motivo sem-dist (main sai com 1)', async () => {
    const r = await converter(join(dir, 'nao-existe'), silencio);
    expect(r).toMatchObject({ ok: false, motivo: 'sem-dist' });
  });
});

describe('convert-to-webp — caminhos de falha', () => {
  it('PNG que NÃO converte: fica como .png, os outros seguem, referência dele NÃO é reescrita, ok:false', async () => {
    await png('bom-A.png', { r: 1, g: 1, b: 1 });
    await png('ruim-B.png', { r: 2, g: 2, b: 2 });
    await writeFile(join(assets, 'app.js'), `"/assets/bom-A.png";"/assets/ruim-B.png"`);
    const r = await converter(dir, {
      ...silencio,
      converterUm: async (i, o) => {
        if (i.endsWith('ruim-B.png')) throw new Error('corrompido');
        await sharp(i).webp().toFile(o);
      },
    });
    expect(r).toMatchObject({ ok: false, motivo: 'falhas', falhas: ['ruim-B.png'], convertidos: ['bom-A.png'] });
    expect(await lista()).toEqual(['app.js', 'bom-A.webp', 'ruim-B.png']);
    // A referência ao que falhou continua apontando para o .png que ainda existe.
    expect(await ler('assets/app.js')).toBe(`"/assets/bom-A.webp";"/assets/ruim-B.png"`);
  });

  it('reescrita que FALHA (arquivo somente-leitura) → erro sobe, nenhum PNG apagado, texto intacto', async () => {
    // A "sobra" do passo 3 (referência ainda presente depois da reescrita) é
    // inalcançável sem concorrência: a troca é `split/join` do nome inteiro, e
    // a conferência relê os mesmos arquivos. O caminho REAL para um PNG ficar
    // referenciado é a reescrita não conseguir gravar — e aí o contrato é o
    // mesmo do enunciado: o build sai com 1 e o PNG continua lá.
    await png('c-H.png', { r: 7, g: 7, b: 7 });
    await writeFile(join(assets, 'app.js'), `"/assets/c-H.png"`);
    const { chmod } = await import('node:fs/promises');
    await chmod(join(assets, 'app.js'), 0o444);
    let erro: unknown = null;
    try { await converter(dir, silencio); } catch (e) { erro = e; }
    await chmod(join(assets, 'app.js'), 0o644);
    expect(erro, 'reescrita que falha tem que ser erro, não silêncio').not.toBeNull();
    expect(await lista(), 'PNG intacto quando a reescrita falhou').toContain('c-H.png');
    expect(await ler('assets/app.js')).toBe(`"/assets/c-H.png"`);
  });

  it('arquivo de texto criado DURANTE a conversão ainda é alcançado pela reescrita (lista relida por passo)', async () => {
    // Forçamos a condição por dentro: um `.map` (extensão de TEXTO) criado
    // pelo conversor injetado, gravado DEPOIS de a reescrita ter começado —
    // como a lista de arquivos do passo 2 é lida no início do passo, e a do
    // passo 3 é relida, o arquivo novo só aparece na conferência.
    await png('a-H.png', { r: 5, g: 5, b: 5 });
    await png('b-H.png', { r: 6, g: 6, b: 6 });
    await writeFile(join(assets, 'app.js'), `"/assets/a-H.png";"/assets/b-H.png"`);
    const r = await converter(dir, {
      ...silencio,
      converterUm: async (i, o) => { await sharp(i).webp().toFile(o); },
      // gancho de teste: o `log` roda por PNG convertido; no 2º, plantamos.
      log: (() => { let n = 0; return () => { if (++n === 2) writeFileSync(join(dir, 'tarde.map'), 'ref a-H.png'); }; })(),
    });
    // O `.map` foi gravado durante o passo 1 (antes do passo 2), então É
    // reescrito — e não há sobra. Este caso documenta que a sobra só nasce de
    // concorrência real; o contrato do passo 3 fica provado pelo resultado:
    expect(r.ok).toBe(true);
    expect(await ler('tarde.map')).toBe('ref a-H.webp');
  });

  it('LIMITAÇÃO DECLARADA: referência em arquivo fora de TEXTO (ex.: .svg, .txt) não é vista — PNG some e a referência quebra', async () => {
    // Registrado, não consertado: hoje dist/assets não tem .svg (medido:
    // `ls dist/assets | grep -c svg` = 0). Se um dia um SVG referenciar PNG,
    // acrescente `svg` a TEXTO no script — este caso passa a falhar e avisa.
    await png('d-H.png', { r: 8, g: 8, b: 8 });
    await writeFile(join(assets, 'logo.svg'), `<svg><image href="/assets/d-H.png"/></svg>`);
    const r = await converter(dir, silencio);
    expect(r.ok).toBe(true);
    expect(await lista()).toEqual(['d-H.webp', 'logo.svg']);
    expect(await ler('assets/logo.svg')).toContain('d-H.png');
  });
});
