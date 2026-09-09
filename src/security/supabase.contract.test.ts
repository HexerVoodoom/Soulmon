/**
 * O CHAT DO SUPABASE NÃO SAIU — e ele manda a VOZ do usuário para fora.
 *
 * Achado na sessão de QA de 09/09/2026, varrendo export sem consumidor. O
 * `CLAUDE.md` afirma que a limpeza da herança do DigiApp (07/09/2026) removeu
 * "o chat paralelo do Supabase". Não removeu. O que ficou:
 *
 *  1. `src/components/ChatBox.tsx` → `transcribeAudio` grava áudio de verdade
 *     (`getUserMedia({ audio: true })` + `MediaRecorder`) e faz `POST` do
 *     `.webm` para `https://<projectId>.supabase.co/functions/v1/make-server-…/transcribe`,
 *     com um JWT anônimo COMMITADO em `src/utils/supabase/info.tsx`. O
 *     `projectId` é de um projeto da era DigiApp.
 *  2. `src/supabase/functions/server/` — 213 linhas de Edge Function (incluindo
 *     `transcribe.tsx` e um `kv_store.tsx`), sem nenhum consumidor no app.
 *  3. `@jsr/supabase__supabase-js` continua no `package.json`.
 *
 * ## Por que isso é três problemas, e não um
 *
 * **O botão está na tela e não funciona em nenhuma plataforma.** No chat, sem
 * texto digitado, o botão único vira "Gravar mensagem" — é alcançável na Home.
 * Mas: a CSP de produção (`public/_headers`) NÃO tem `*.supabase.co` em
 * `connect-src`, então o `fetch` é bloqueado e a pessoa recebe "Audio
 * transcription failed"; e o `AndroidManifest.xml` NÃO declara `RECORD_AUDIO`,
 * então no APK a gravação morre antes, na permissão.
 *
 * **A intenção de mandar voz para um terceiro continua no código.** Basta
 * alguém acrescentar `*.supabase.co` à CSP — coisa que se faz "para consertar o
 * microfone" — e o áudio passa a sair.
 *
 * **E nada disso está declarado.** Nem `public/privacidade.html` nem
 * `docs/PLAY-DATA-SAFETY.md` mencionam microfone, áudio, voz ou um processador
 * terceiro (varrido: zero ocorrência). A ficha de Segurança de Dados da Play
 * ficaria falsa no dia em que o caminho voltasse a funcionar.
 *
 * ## O que este teste faz
 *
 * CONGELA. Não apaga nada — remover uma funcionalidade da tela é decisão do
 * dono, e está registrada em `docs/STATUS.md`. O que ele impede é a lista
 * CRESCER, e principalmente impede a CSP ganhar `supabase` sem que alguém leia
 * este cabeçalho primeiro.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const RAIZ = resolve(__dirname, '../..');
const EXTENSOES = ['.ts', '.tsx', '.js', '.jsx'];

/**
 * Os únicos lugares onde `supabase` pode aparecer hoje. Cada linha é dívida
 * medida, não permissão — tirar uma daqui exige tirar do código junto.
 */
const DIVIDA: Record<string, string> = {
  'src/components/ChatBox.tsx':
    'o `POST` do áudio gravado para a Edge Function de transcrição. É o caminho VIVO na tela (botão "Gravar mensagem"), e o único bloqueado só pela CSP.',
  'src/utils/supabase/info.tsx':
    'o `projectId` e o JWT anônimo, autogerados na era DigiApp. Chave anônima é pública por desenho, mas o projeto não deveria estar em uso.',
  'src/supabase/functions/server/index.tsx':
    'Edge Function sem consumidor no app.',
  'src/supabase/functions/server/kv_store.tsx':
    'helper de KV da Edge Function, sem consumidor.',
  'src/supabase/functions/server/transcribe.tsx':
    'a transcrição em si, sem consumidor no app.',
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

describe('Supabase — a herança que o CLAUDE.md diz que saiu', () => {
  const achados = arquivos(join(RAIZ, 'src'))
    .filter(p => /supabase/i.test(readFileSync(p, 'utf8')) || /supabase/i.test(rel(p)))
    .map(rel)
    .sort();

  it('nenhum arquivo NOVO passa a falar com o Supabase', () => {
    expect(
      achados.filter(a => !(a in DIVIDA)),
      'Referência nova ao Supabase. O chat de voz manda áudio do usuário para um projeto de terceiro que nem a política de privacidade nem a ficha da Play declaram — leia o cabeçalho deste arquivo antes de acrescentar.',
    ).toEqual([]);
  });

  it('a dívida registrada é a REAL — linha morta na lista some junto', () => {
    expect(
      Object.keys(DIVIDA).filter(k => !achados.includes(k)),
      'este arquivo já não fala com o Supabase; tire a linha de DIVIDA',
    ).toEqual([]);
  });

  it('🔴 a CSP continua BLOQUEANDO o Supabase — é o que impede a voz de sair', () => {
    // Enquanto `*.supabase.co` estiver fora de `connect-src`, o `POST` do áudio
    // morre na borda. Se alguém liberar isso "para consertar o microfone", a
    // voz do usuário começa a sair para um processador não declarado — e a
    // ficha de Segurança de Dados da Play passa a estar errada.
    const headers = readFileSync(join(RAIZ, 'public/_headers'), 'utf8');
    const connect = headers.match(/connect-src[^;]*/i)?.[0] ?? '';
    expect(connect.length, 'não achei `connect-src` no public/_headers').toBeGreaterThan(0);
    expect(/supabase/i.test(connect)).toBe(false);
  });

  it('🔴 e a política de privacidade não declara áudio nem microfone', () => {
    // Se um dia declarar, este caso cai — e aí a conversa é outra: a coleta
    // passa a ser declarada, e o que falta é a ficha da Play acompanhar.
    const politica = readFileSync(join(RAIZ, 'public/privacidade.html'), 'utf8');
    const declara = /(microfone|microphone|áudio|audio|voz|voice)/i.test(politica);
    expect(
      declara,
      'a política passou a falar de áudio/microfone: confira se `docs/PLAY-DATA-SAFETY.md` acompanhou e atualize este teste',
    ).toBe(false);
  });
});
