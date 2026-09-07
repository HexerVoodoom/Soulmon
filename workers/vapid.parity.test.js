/**
 * As TRÊS cópias da chave pública VAPID têm que concordar.
 *
 * Uma inscrição de Web Push é criada CONTRA uma chave pública: o navegador
 * guarda a que o cliente passou em `applicationServerKey`, e o servidor de
 * push só aceita uma notificação assinada pela privada correspondente. Se a
 * cópia do cliente divergir da do worker, **as inscrições continuam sendo
 * criadas normalmente e nenhuma notificação chega** — sem erro em lugar
 * nenhum, porque cada lado está internamente coerente.
 *
 * São três lugares, em três ciclos de deploy diferentes (bundle do app, deploy
 * manual do worker, config do wrangler), que é o footgun 9 na sua forma mais
 * cara: divergir não dá erro, dá silêncio.
 *
 * Contexto: em 07/09/2026 descobriu-se que o `VAPID_JWK` (a PRIVADA) nunca
 * tinha sido configurado no worker — os pushes eram pulados com log desde
 * sempre. Ao gerar o par novo (`node scripts/gerar-vapid.mjs`), a pública
 * precisa ser trocada nos três, e é isso que este teste garante.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = join(process.cwd());
const ler = (p) => readFileSync(join(RAIZ, p), 'utf8');

/** Extrai a chave de um `... = '...'` / `... = "..."`, seja TS, JS ou TOML. */
function chaveDe(texto, arquivo) {
  const m = texto.match(/VAPID_PUBLIC_KEY\s*=\s*['"]([A-Za-z0-9_-]+)['"]/);
  if (!m) throw new Error(`VAPID_PUBLIC_KEY não encontrada em ${arquivo}`);
  return m[1];
}

const FONTES = [
  'src/utils/vapid.ts',
  'workers/push-scheduler.js',
  'workers/wrangler.toml',
];

describe('chave pública VAPID', () => {
  it('é a MESMA nos três lugares que a fixam', () => {
    const achadas = FONTES.map(f => [f, chaveDe(ler(f), f)]);
    const distintas = new Set(achadas.map(([, k]) => k));
    // A mensagem lista arquivo por arquivo: quando isto quebra, o que a
    // pessoa precisa saber é QUAL das três ficou para trás.
    expect(
      distintas.size === 1 ? [] : achadas.map(([f, k]) => `${f} → ${k.slice(0, 24)}…`),
    ).toEqual([]);
  });

  it('tem cara de ponto P-256 não comprimido (65 bytes em base64url)', () => {
    // 65 bytes (0x04 || X || Y) → 87 chars em base64url sem padding. Uma chave
    // truncada num copy-paste passaria pelo teste de igualdade acima se
    // truncassem as três — este caso pega isso.
    const k = chaveDe(ler(FONTES[0]), FONTES[0]);
    expect(k).toHaveLength(87);
    expect(k.startsWith('B')).toBe(true);   // 0x04 em base64url começa com 'B'
  });
});
