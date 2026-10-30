/**
 * A VOZ DO CHAT — contrato da transcrição: Worker direto ao Groq, sem Supabase.
 *
 * ## O desenho
 *
 * O áudio vai do app para `/api/transcribe` (nossa própria origem). É o Worker
 * que fala com o Groq Whisper (`api.groq.com`), com a chave `GROQ_API_KEY` do
 * ambiente do servidor. Por isso:
 *
 *  1. **O cliente nunca chama o provedor** (nem a URL, nem a chave) e a CSP
 *     NÃO abre `connect-src` nem para Groq nem para qualquer Supabase. Se
 *     alguém precisar abrir a CSP para o microfone funcionar, voltou a chamar
 *     o provedor do navegador: a chave sairia no bundle e um XSS ganharia
 *     destino de exfiltração.
 *  2. **A política DECLARA áudio/microfone**, nos dois idiomas.
 *  3. **A ficha da Play declara `RECORD_AUDIO` e gravação de voz.**
 *  4. **O manifesto Android declara a permissão.**
 *
 * Ligar a funcionalidade sem (2), (3) e (4) é ficha de loja falsa.
 *
 * O caminho Supabase (Edge Function, JWT anônimo commitado) foi removido: nenhum
 * arquivo de `src/` (fora de testes) pode voltar a citá-lo.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const RAIZ = resolve(__dirname, '../..');
const EXTENSOES = ['.ts', '.tsx', '.js', '.jsx'];

/**
 * Os únicos lugares onde `supabase` ainda pode aparecer em `src/`. Vazia de
 * propósito: cada linha acrescentada é dívida medida, não permissão.
 */
const DIVIDA: Record<string, string> = {};

function arquivos(dir: string, saida: string[] = []): string[] {
  let entradas: string[];
  try { entradas = readdirSync(dir); } catch { return saida; }
  for (const nome of entradas) {
    if (nome === 'node_modules' || nome === 'dist' || nome === 'dist-renderer') continue;
    const p = join(dir, nome);
    if (statSync(p).isDirectory()) { arquivos(p, saida); continue; }
    if (!EXTENSOES.some(e => nome.endsWith(e)) || nome.includes('.test.')) continue;
    saida.push(p);
  }
  return saida;
}

const rel = (p: string) => p.slice(RAIZ.length + 1).replace(/\\/g, '/');
const ler = (p: string) => readFileSync(join(RAIZ, p), 'utf8');

const semComentarios = (txt: string) => txt
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('Supabase — saiu do app', () => {
  const achados = arquivos(join(RAIZ, 'src'))
    .filter(p => /supabase/i.test(readFileSync(p, 'utf8')) || /supabase/i.test(rel(p)))
    .map(rel)
    .sort();

  it('nenhum arquivo de src/ (fora de testes) cita supabase', () => {
    expect(achados.filter(a => !(a in DIVIDA))).toEqual([]);
  });

  it('a dívida registrada é a REAL — linha morta na lista some junto', () => {
    expect(Object.keys(DIVIDA).filter(k => !achados.includes(k))).toEqual([]);
  });

  it('a Edge Function e a chave anônima commitada SUMIRAM', () => {
    const vivos = arquivos(join(RAIZ, 'src')).map(rel)
      .filter(p => p.startsWith('src/utils/supabase/') || p.startsWith('src/supabase/'));
    expect(vivos).toEqual([]);
  });

  it('g. 🔴 nenhum JWT de verdade em lugar NENHUM do repositório — nem em docs/, nem em build velho', () => {
    // Em 09/09/2026 a SQUAD-DOCS achou o mesmo JWT anônimo da era DigiApp em
    // DOIS lugares que o caso acima não alcançava: `docs/APK-BUILD-INFO.md`
    // (texto plano) e `assets/info-*.js` (um build antigo restaurado na raiz,
    // sem consumidor). O caso acima afirmava "sumiu do repositório" varrendo
    // só `src/`. Este varre tudo que está no git, de qualquer extensão, e
    // procura o formato de um JWT HS256 REAL (cabeçalho fixo + dois segmentos
    // longos) — `'jwt-secreto'` e `eyJ...` truncado com reticências nos testes
    // não casam de propósito.
    const JWT_REAL = /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/;
    const IGNORAR = new Set(['node_modules', '.git', 'dist', 'dist-renderer', 'vendor']);
    const tudo: string[] = [];
    const walk = (dir: string) => {
      let entradas: string[];
      try { entradas = readdirSync(dir); } catch { return; }
      for (const nome of entradas) {
        if (IGNORAR.has(nome)) continue;
        const p = join(dir, nome);
        let st; try { st = statSync(p); } catch { continue; }
        if (st.isDirectory()) { walk(p); continue; }
        if (st.size > 5_000_000 || /\.(png|webp|jpg|jpeg|gif|ico|woff2?|ttf|otf|mp3|ogg|wav|zip|jar|keystore|jks|apk|aab)$/i.test(nome)) continue;
        tudo.push(p);
      }
    };
    walk(RAIZ);
    const culpados = tudo.filter(p => {
      try { return JWT_REAL.test(readFileSync(p, 'utf8')); } catch { return false; }
    }).map(rel);
    expect(culpados, 'JWT real commitado — redija e revogue').toEqual([]);
  }, 180_000); // varre o repositório INTEIRO (≈30 s com product/ e docs/ grandes); o teto padrão de 15 s é do caso típico
});

describe('🔴 o desenho: cliente -> /api/transcribe -> Groq', () => {
  it('b. o CLIENTE chama /api/transcribe e nunca o provedor', () => {
    const cliente = semComentarios(ler('src/components/ChatBox.tsx'));
    expect(cliente, 'a transcrição tem que ir pela nossa origem').toContain('/api/transcribe');
    expect(cliente).not.toMatch(/api\.groq\.com/i);
    expect(cliente).not.toMatch(/GROQ/);
  });

  it('c. a rota não cita supabase e chama api.groq.com', () => {
    const rota = ler('functions/api/transcribe.js');
    expect(rota).not.toMatch(/supabase/i);
    expect(semComentarios(rota)).toContain('api.groq.com');
  });

  it('d. a CSP não abre connect-src nem para supabase nem para groq', () => {
    const connect = ler('public/_headers').match(/connect-src[^;]*/i)?.[0] ?? '';
    expect(connect.length, 'não achei `connect-src` no public/_headers').toBeGreaterThan(0);
    expect(/supabase/i.test(connect), 'CSP aberta para supabase').toBe(false);
    expect(/groq/i.test(connect), 'CSP aberta para groq: o áudio vai pelo Worker').toBe(false);
  });
});

describe('🔴 as quatro peças que têm de andar juntas', () => {
  it('e2. a política DECLARA o microfone, nos dois idiomas', () => {
    const politica = ler('public/privacidade.html');
    expect(politica, 'seção do microfone em PT').toContain('id="microfone"');
    expect(politica, 'seção do microfone em EN').toContain('id="microphone"');
    expect(politica).toMatch(/não guardamos o áudio/i);
    expect(politica).toMatch(/we do not store the audio/i);
  });

  it('e3. a ficha da Play declara gravação de voz e a permissão', () => {
    const ficha = ler('docs/PLAY-DATA-SAFETY.md');
    expect(ficha).toMatch(/Gravações de voz/i);
    expect(ficha).toContain('RECORD_AUDIO');
    // O erro clássico: responder "não coleta" porque o áudio é só de passagem.
    expect(ficha).toMatch(/processamento efêmero/i);
  });

  it('e4. o manifesto Android declara `RECORD_AUDIO`', () => {
    expect(ler('android/app/src/main/AndroidManifest.xml')).toContain('android.permission.RECORD_AUDIO');
  });

  it('e5. [confirmar no fim] a política cita o Groq e não cita o Supabase', () => {
    const politica = ler('public/privacidade.html');
    expect(politica).toMatch(/Groq/);
    expect(politica).not.toMatch(/supabase/i);
  });
});

describe('a rota não grava o áudio', () => {
  it('f. nenhum armazenamento no código da rota', () => {
    const rota = semComentarios(ler('functions/api/transcribe.js'));
    for (const proibido of ['.put(', 'DIGIAPP_SAVES', 'SOULMON_SAVES', 'caches.']) {
      expect(rota.includes(proibido), `\`${proibido}\` apareceu no código da rota`).toBe(false);
    }
    expect(rota, 'AUTOVERIFICAÇÃO: a remoção de comentários não comeu o arquivo').toContain('onRequestPost');
  });
});

describe('o botão não existe quando não pode funcionar', () => {
  it('h. `/api/config` publica `transcribeAvailable` ligado a GROQ_API_KEY, e o chat depende dele', () => {
    const config = ler('functions/api/config.js');
    expect(config).toMatch(/transcribeAvailable:\s*!!env\.GROQ_API_KEY/);
    expect(ler('src/components/ChatBox.tsx')).toContain('fetchServerConfig');
    expect(ler('src/utils/serverConfig.ts')).toContain('transcribeAvailable');
  });
});
