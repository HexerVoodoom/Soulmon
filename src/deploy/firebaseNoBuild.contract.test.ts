/**
 * O LOGIN PRECISA SOBREVIVER AO BUILD AUTOMÁTICO (07/09/2026)
 * ==========================================================
 *
 * Falha medida, não hipotética. Em 07/09/2026 o login de produção estava
 * morto, e a lista de deploys mostrou por quê:
 *
 *     19:51:16  c708bc85   ← `wrangler deploy` manual, com o `.env` local
 *     19:52:19  5612e0b2   ← build automático do push, ~1 min depois
 *
 * O push na `main` dispara um build da Cloudflare que **não enxerga o `.env`**
 * (ele é ignorado pelo git). Esse build publicava um bundle SEM as
 * `VITE_FIREBASE_*`, por cima do deploy manual. O sintoma no app era
 * indistinguível de "ainda não configuramos": `isAuthConfigured()` virava
 * false e a tela de conta simplesmente sumia, dando lugar à variante sem
 * login. Nenhum erro, nenhum alarme — e o dono só descobriu porque a conta
 * dele parou de ser reconhecida.
 *
 * A correção foi versionar `.env.production`. Estes testes existem para que
 * ninguém o remova achando que é segredo vazado: **a config web do Firebase é
 * pública por desenho** (o Vite a inlina no bundle que todo visitante baixa),
 * ela identifica o projeto e não autoriza nada. Quem autoriza é o
 * `FIREBASE_PROJECT_ID` do servidor, que NÃO mora aqui.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const RAIZ = resolve(__dirname, '../..');
const ler = (p: string) => readFileSync(resolve(RAIZ, p), 'utf8');

const OBRIGATORIAS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
];

describe('a config do Firebase sobrevive a um build sem o `.env` local', () => {
  it('`.env.production` existe e está VERSIONADO', () => {
    expect(existsSync(resolve(RAIZ, '.env.production'))).toBe(true);
    // A exceção no `.gitignore` é a metade que faz o arquivo chegar na CI.
    // Sem ela o arquivo existe só nesta máquina, que é exatamente o estado
    // que quebrou produção.
    expect(ler('.gitignore')).toContain('!.env.production');
  });

  it('traz as QUATRO variáveis, com valor', () => {
    const env = ler('.env.production');
    for (const chave of OBRIGATORIAS) {
      const m = new RegExp(`^${chave}=(.+)$`, 'm').exec(env);
      expect(m, `${chave} ausente em .env.production`).not.toBeNull();
      expect(m![1].trim().length, `${chave} sem valor`).toBeGreaterThan(0);
    }
  });

  it('NÃO carrega o que é do servidor', () => {
    // `FIREBASE_PROJECT_ID` (sem o prefixo `VITE_`) é variável de RUNTIME do
    // worker e vive no `wrangler.jsonc`. Se aparecesse aqui, alguém teria
    // confundido as duas — e uma variável de build não liga trava nenhuma no
    // servidor.
    const env = ler('.env.production');
    expect(env).not.toMatch(/^FIREBASE_PROJECT_ID=/m);
    expect(env).not.toMatch(/SERVICE_ACCOUNT|PRIVATE_KEY|VAPID_JWK|ADMIN_KEY/);
  });

  it('os quatro nomes batem com o que `auth.ts` lê', () => {
    // Uma variável com nome trocado no arquivo não falha o build: ela vira
    // `undefined`, `isAuthConfigured()` devolve false, e o app abre sem login
    // como se nada tivesse acontecido. É o mesmo silêncio de antes.
    const auth = ler('src/utils/auth.ts');
    for (const chave of OBRIGATORIAS) {
      expect(auth, `${chave} não é lido por auth.ts`).toContain(`import.meta.env.${chave}`);
    }
  });
});
