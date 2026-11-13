import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { demoEvolucaoAtiva } from './demoEvolucao';

const ROOT = join(__dirname, '..', '..');

describe('modo demo de evolução (só para gravar vídeo)', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('está desligado por padrão', () => {
    expect(demoEvolucaoAtiva()).toBe(false);
  });

  it('liga só com a variável E o modo de build demo', () => {
    vi.stubEnv('VITE_DEMO_EVOLUCAO', '1');
    vi.stubEnv('MODE', 'demo');
    expect(demoEvolucaoAtiva()).toBe(true);
  });

  it('RELEASE: desligado mesmo se a variável vazar para o build de produção', () => {
    vi.stubEnv('VITE_DEMO_EVOLUCAO', '1');
    vi.stubEnv('MODE', 'production');
    expect(demoEvolucaoAtiva()).toBe(false);
  });

  it('o modo demo sem a variável também fica desligado', () => {
    vi.stubEnv('MODE', 'demo');
    expect(demoEvolucaoAtiva()).toBe(false);
  });

  it('nada versionado define a variável (env, scripts, workflows)', () => {
    const files = ['package.json', 'vite.config.ts', 'capacitor.config.json', 'wrangler.jsonc'];
    for (const f of readdirSync(ROOT)) if (f.startsWith('.env')) files.push(f);
    const wf = join(ROOT, '.github', 'workflows');
    if (existsSync(wf)) for (const f of readdirSync(wf)) files.push(join('.github', 'workflows', f));
    for (const f of files) {
      const p = join(ROOT, f);
      if (existsSync(p)) expect(readFileSync(p, 'utf8'), f).not.toContain('VITE_DEMO_EVOLUCAO');
    }
  });
});
