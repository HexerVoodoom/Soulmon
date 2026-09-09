/**
 * O CHAT DE VOZ — de caminho quebrado e não declarado a funcionalidade
 * declarada, e o que agora não pode regredir.
 *
 * ## O que era (achado em 09/09/2026)
 *
 * O `CLAUDE.md` afirmava que a limpeza da herança do DigiApp (07/09/2026)
 * removeu "o chat paralelo do Supabase". Não removeu. O `ChatBox` gravava
 * áudio de verdade e fazia `POST` DIRETO para
 * `https://<projectId>.supabase.co/…/transcribe`, com um JWT anônimo
 * **commitado** em `src/utils/supabase/info.tsx`, de um projeto da era DigiApp.
 *
 * Era três problemas de uma vez: não funcionava em plataforma nenhuma (a CSP
 * bloqueava; o Android não declarava `RECORD_AUDIO`), a intenção de mandar voz
 * para fora estava viva no código, e **nada disso era declarado** — nem na
 * política de privacidade, nem na ficha de Segurança de Dados da Play.
 *
 * ## O que é agora
 *
 * O dono decidiu declarar e fazer funcionar. A implementação NÃO abriu a CSP:
 * o áudio vai para `/api/transcribe`, que é a nossa própria origem, e é o
 * servidor que fala com o provedor. Isso é o coração deste arquivo.
 *
 * ## As quatro coisas que este guard prende juntas
 *
 * Elas se soltam com facilidade e cada uma sozinha parece inofensiva:
 *
 *  1. **A CSP continua BLOQUEANDO `supabase`** — e agora isso é um TESTE DE
 *     DESENHO, não uma trava contra a funcionalidade. Se alguém precisar abrir
 *     `connect-src` para o microfone funcionar, é porque voltou a chamar o
 *     provedor do navegador, e aí a chave sai no bundle e QUALQUER projeto
 *     Supabase vira destino possível de exfiltração.
 *  2. **A política DECLARA áudio/microfone**, nos dois idiomas.
 *  3. **A ficha da Play declara `RECORD_AUDIO` e gravação de voz.**
 *  4. **O manifesto Android declara a permissão.**
 *
 * Ligar a funcionalidade sem (2), (3) e (4) é ficha de loja falsa. Desligar
 * (1) é trocar um desenho seguro por um inseguro sem ninguém notar.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const RAIZ = resolve(__dirname, '../..');
const EXTENSOES = ['.ts', '.tsx', '.js', '.jsx'];

/**
 * Os únicos lugares onde `supabase` pode aparecer. Cada linha é dívida
 * medida, não permissão.
 */
const DIVIDA: Record<string, string> = {
  'src/components/ChatBox.tsx':
    'só o COMENTÁRIO histórico que explica por que a chamada deixou de ir direto do navegador. Nenhum `fetch` para supabase.co sobrou aqui — outro caso deste arquivo garante isso.',
  'src/supabase/functions/server/index.tsx':
    'a Edge Function que roda NO PROVEDOR, não no app. É o artefato que se implanta no projeto do dono; não entra no bundle.',
  'src/supabase/functions/server/kv_store.tsx':
    'helper de KV da mesma Edge Function.',
  'src/supabase/functions/server/transcribe.tsx':
    'a transcrição em si, do lado do provedor.',
  'src/vite-env.d.ts':
    'declaração de tipo do pacote `@jsr/supabase__supabase-js`, que segue no package.json.',
};

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

describe('Supabase — o que ainda fala com ele, e de onde', () => {
  const achados = arquivos(join(RAIZ, 'src'))
    .filter(p => /supabase/i.test(readFileSync(p, 'utf8')) || /supabase/i.test(rel(p)))
    .map(rel)
    .sort();

  it('nenhum arquivo NOVO passa a falar com o Supabase', () => {
    expect(
      achados.filter(a => !(a in DIVIDA)),
      'Referência nova ao Supabase. O áudio do usuário vai por `/api/transcribe` (mesma origem) de propósito — leia o cabeçalho deste arquivo antes de acrescentar.',
    ).toEqual([]);
  });

  it('a dívida registrada é a REAL — linha morta na lista some junto', () => {
    expect(
      Object.keys(DIVIDA).filter(k => !achados.includes(k)),
      'este arquivo já não fala com o Supabase; tire a linha de DIVIDA',
    ).toEqual([]);
  });

  it('🔴 o CLIENTE não chama o provedor direto — nem a URL, nem a chave', () => {
    // O que quebrou antes: `fetch('https://' + projectId + '.supabase.co/...')`
    // com o JWT no cabeçalho. Comentário pode citar; código, não.
    const semComentarios = ler('src/components/ChatBox.tsx')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1');
    expect(semComentarios).not.toMatch(/supabase\.co/);
    expect(semComentarios).not.toMatch(/publicAnonKey|SUPABASE_ANON/);
    expect(semComentarios, 'a transcrição tem que ir pela nossa origem').toContain('/api/transcribe');
  });

  it('🔴 a chave anônima commitada SUMIU do repositório', () => {
    // `src/utils/supabase/info.tsx` era um arquivo "AUTOGENERATED" com o
    // `projectId` e o JWT dentro. A credencial agora é do servidor.
    const vivos = arquivos(join(RAIZ, 'src'))
      .map(rel)
      .filter(p => p.startsWith('src/utils/supabase/'));
    expect(vivos, 'a chave do provedor não volta para o bundle').toEqual([]);
  });

  it('🔴 nenhum JWT de verdade em lugar NENHUM do repositório — nem em docs/, nem em build velho', () => {
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
  });
});

describe('🔴 as quatro peças que têm de andar juntas', () => {
  it('1. a CSP continua BLOQUEANDO supabase — e é assim que o desenho está certo', () => {
    // Isto deixou de ser "a funcionalidade está travada" e virou "a
    // funcionalidade não PRECISA disto". Se alguém tiver que abrir
    // `connect-src` para o microfone voltar a funcionar, é porque voltou a
    // chamar o provedor do navegador — o que traz a chave para o bundle e faz
    // QUALQUER projeto Supabase virar destino possível de exfiltração num XSS.
    const connect = ler('public/_headers').match(/connect-src[^;]*/i)?.[0] ?? '';
    expect(connect.length, 'não achei `connect-src` no public/_headers').toBeGreaterThan(0);
    expect(
      /supabase/i.test(connect),
      'a transcrição vai por `/api/transcribe` (mesma origem): abrir a CSP aqui significa que alguém desfez esse desenho',
    ).toBe(false);
  });

  it('2. a política DECLARA o microfone, nos dois idiomas', () => {
    const politica = ler('public/privacidade.html');
    expect(politica, 'seção do microfone em PT').toContain('id="microfone"');
    expect(politica, 'seção do microfone em EN').toContain('id="microphone"');
    // Retenção é a pergunta que a ficha da Play faz, e a resposta tem que estar
    // escrita para o usuário também.
    expect(politica).toMatch(/não guardamos o áudio/i);
    expect(politica).toMatch(/we do not store the audio/i);
  });

  it('3. a ficha da Play declara gravação de voz e a permissão', () => {
    const ficha = ler('docs/PLAY-DATA-SAFETY.md');
    expect(ficha).toMatch(/Gravações de voz/i);
    expect(ficha).toContain('RECORD_AUDIO');
    // O erro clássico: responder "não coleta" porque o áudio é só de passagem.
    expect(ficha).toMatch(/processamento efêmero/i);
  });

  it('4. o manifesto Android declara `RECORD_AUDIO`', () => {
    expect(ler('android/app/src/main/AndroidManifest.xml')).toContain('android.permission.RECORD_AUDIO');
  });

  it('e nada disso grava o áudio: a rota não escreve em armazenamento nenhum', () => {
    // A promessa "não guardamos o áudio" está escrita para o usuário na
    // política e para o Google na ficha. Ela não pode depender de alguém
    // lembrar dela ao editar a rota.
    const rota = ler('functions/api/transcribe.js')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1');
    for (const proibido of ['.put(', 'DIGIAPP_SAVES', 'SOULMON_SAVES', 'caches.']) {
      expect(rota.includes(proibido), `\`${proibido}\` apareceu no código da rota`).toBe(false);
    }
    expect(rota, 'AUTOVERIFICAÇÃO: a remoção de comentários não comeu o arquivo').toContain('onRequestPost');
  });
});

describe('o botão não existe quando não pode funcionar', () => {
  it('`/api/config` publica `transcribeAvailable`, e o chat depende dele', () => {
    // Botão que aparece e falha foi exatamente o estado em que o microfone
    // ficou meses — "Audio transcription failed" para quem clicasse.
    expect(ler('functions/api/config.js')).toContain('transcribeAvailable');
    expect(ler('src/components/ChatBox.tsx')).toContain('fetchServerConfig');
    expect(ler('src/utils/serverConfig.ts')).toContain('transcribeAvailable');
  });
});
