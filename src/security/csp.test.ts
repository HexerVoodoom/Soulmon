/**
 * Guard mecânico da CSP (N-7).
 *
 * Uma CSP com hash de script inline é uma regra que **quebra em silêncio**: se
 * alguém mexer uma vírgula no `<script>` do tema dentro do `index.html`, o
 * navegador passa a bloquear aquele script e o app carrega piscando branco (ou,
 * no caso do segundo, sem service worker — offline e push param, sem erro
 * visível para ninguém). O único jeito de isso não virar dívida é recalcular o
 * hash a partir do HTML no CI.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const raiz = resolve(__dirname, '../..');
const html = readFileSync(resolve(raiz, 'index.html'), 'utf8');
const headers = readFileSync(resolve(raiz, 'public/_headers'), 'utf8');

const linhaCsp = headers
  .split('\n')
  .map(l => l.trim())
  .find(l => l.startsWith('Content-Security-Policy:'));

const csp = (linhaCsp || '').replace('Content-Security-Policy:', '').trim();

function diretiva(nome: string): string {
  const parte = csp.split(';').map(s => s.trim()).find(s => s.startsWith(`${nome} `) || s === nome);
  return parte ? parte.slice(nome.length).trim() : '';
}

/**
 * ARMADILHA MEDIDA, não teórica: o navegador hasheia o texto do script DEPOIS
 * de normalizar quebras de linha. Os arquivos deste repositório estão em CRLF,
 * então o hash do arquivo cru NÃO é o hash que o Chromium calcula — a primeira
 * versão desta CSP foi escrita assim e bloqueou os dois scripts inline no
 * navegador, com o `_headers` "correto" no papel. Daí o `.replace`.
 */
function hashesDosScriptsInline(fonte: string): string[] {
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(fonte))) {
    const texto = m[1].replace(/\r\n/g, '\n');
    out.push('sha256-' + createHash('sha256').update(texto, 'utf8').digest('base64'));
  }
  return out;
}

describe('CSP existe e não é decorativa', () => {
  it('a política está declarada em public/_headers', () => {
    expect(linhaCsp).toBeDefined();
    expect(csp.length).toBeGreaterThan(80);
  });

  it('os hashes cobrem TODOS os <script> inline — na fonte E no dist servido', () => {
    // O que a Cloudflare serve é o `dist/index.html` (que É commitado). Se só a
    // fonte fosse verificada, um deploy podia sair com hash de outro arquivo.
    const dist = readFileSync(resolve(raiz, 'dist/index.html'), 'utf8');
    const esperados = [...hashesDosScriptsInline(html), ...hashesDosScriptsInline(dist)];
    expect(esperados.length).toBeGreaterThan(0); // controle negativo do próprio teste
    const script = diretiva('script-src');
    for (const h of esperados) {
      expect(script, `hash ausente para um <script> inline: ${h}`).toContain(h);
    }
  });

  it('IGUALDADE: a política não carrega hash de script que não existe (fonte ∪ dist)', () => {
    // QA rodada 2, skeptic #12: o teste só checava INCLUSÃO, e um hash morto
    // (script que já mudou) ficava na política para sempre — é permissão
    // para um script que ninguém mais consegue apontar. Igualdade de conjunto
    // com o que existe na fonte E no dist servido: quando o dist for
    // rebuildado, o hash antigo sobra e este teste manda tirá-lo.
    const dist = readFileSync(resolve(raiz, 'dist/index.html'), 'utf8');
    const existentes = new Set([...hashesDosScriptsInline(html), ...hashesDosScriptsInline(dist)]);
    const naPolitica = (diretiva('script-src').match(/'sha256-[^']+'/g) ?? []).map(h => h.slice(1, -1));
    expect(new Set(naPolitica)).toEqual(existentes);
  });

  it('o guard enxerga: um script alterado produz hash que a política NÃO tem', () => {
    // Sem este caso, o anterior passaria por acidente se o extrator devolvesse
    // vazio ou sempre o mesmo hash.
    const alterado = hashesDosScriptsInline('<script>console.log("outra coisa")</script>');
    expect(alterado).toHaveLength(1);
    expect(diretiva('script-src')).not.toContain(alterado[0]);
  });

  it('script-src NÃO tem unsafe-inline nem unsafe-eval (seria a CSP se anulando)', () => {
    const script = diretiva('script-src');
    expect(script).not.toContain("'unsafe-inline'");
    expect(script).not.toContain("'unsafe-eval'");
    expect(script).toContain("'self'");
  });

  it('as diretivas que fecham o roubo de token estão presentes', () => {
    expect(diretiva('default-src')).toBe("'self'");
    expect(diretiva('object-src')).toBe("'none'");
    expect(diretiva('frame-ancestors')).toBe("'none'");
    expect(diretiva('base-uri')).toBe("'self'");
    expect(diretiva('form-action')).toBe("'self'");
  });

  it('o login com Google continua possível — `apis.google.com` liberado', () => {
    // FALHA MEDIDA em 07/09/2026, e ela não parece CSP nenhuma.
    //
    // `signInWithPopup` carrega `https://apis.google.com/js/api.js` para
    // orquestrar o popup. Sem essa origem em `script-src`, o navegador bloqueia
    // o script e o SDK do Firebase converte o resultado em
    // `auth/internal-error` — uma mensagem que não menciona CSP e manda quem
    // depura procurar domínio autorizado, cliente OAuth e provedor, tudo em
    // vão. O login simplesmente não acontece, sem explicação.
    //
    // Este teste existe para que "limpar a CSP" nunca mais derrube o login em
    // silêncio: se alguém remover a origem, quebra aqui, e não em produção.
    expect(diretiva('script-src')).toContain('https://apis.google.com');
    // Os frames do fluxo de popup vivem nos dois domínios.
    const frame = diretiva('frame-src');
    expect(frame).toContain('https://apis.google.com');
    expect(frame).toContain('https://accounts.google.com');
    expect(frame).toContain('firebaseapp.com');
  });

  it('connect-src permite o próprio worker e o Firebase — e não o mundo', () => {
    const connect = diretiva('connect-src');
    expect(connect).toContain("'self'");
    expect(connect).toContain('googleapis.com');
    expect(connect).not.toMatch(/(^|\s)\*($|\s)/);
    expect(connect).not.toContain('https: ');
  });

  it('o service worker e a arte gerada continuam permitidos (a CSP não pode quebrar o app)', () => {
    expect(diretiva('worker-src')).toContain("'self'");
    // O sprite do Higgsfield volta como URL externa; sem isto, o ritual do
    // oráculo entrega uma imagem quebrada para quem PAGOU.
    expect(diretiva('img-src')).toContain('https:');
    expect(diretiva('img-src')).toContain('data:');
    expect(diretiva('img-src')).toContain('blob:');
  });

  it('HSTS está declarado', () => {
    expect(headers).toMatch(/Strict-Transport-Security:\s*max-age=\d+/);
  });
});
