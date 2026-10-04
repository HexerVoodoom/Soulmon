/**
 * O CADERNO É DADO SENSÍVEL (decisão do dono, 04/10/2026, REGISTRO §22).
 *
 * Mora em `GameState.caderno` (save na nuvem do titular) e NUNCA entra em payload de IA/chat,
 * telemetria, métricas, perfil público, guilda ou sprite. Este contrato varre, por NOME, todo
 * arquivo que monta contexto de IA, evento de telemetria ou dado público — nenhum pode citar o
 * Caderno — e prova que nenhum montador de IA serializa o estado cru.
 * Quem precisar de um caminho novo para o Caderno muda esta lista de propósito, com decisão.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const ler = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

const PROIBIDOS = [
  // Cliente: tudo que fala com IA/chat, telemetria ou sprite.
  'src/utils/aiClient.ts', 'src/components/ChatBox.tsx', 'src/components/CompanionHUD.tsx',
  'src/components/OraclePage.tsx', 'src/utils/oracle.ts', 'src/utils/personality.ts',
  'src/utils/soulProfile/pipeline.ts', 'src/utils/spriteGen.ts', 'src/utils/spriteLibrary.ts',
  'src/utils/telemetry.ts', 'src/utils/chatSafety.ts', 'src/utils/chatKeywords.ts',
  // Servidor: IA, métricas, redação, perfil público, guilda, coop, comunidade.
  'functions/api/chat.js', 'functions/api/metrics.js', 'functions/api/generate-sprite.js',
  'functions/api/suggest-tasks.js', 'functions/api/transcribe.js', 'functions/api/_redact.js',
  'functions/api/_aiGuard.js', 'functions/api/_profile.js', 'functions/api/community.js',
  'functions/api/guild.js', 'functions/api/_coop.js', 'functions/api/_bond.js',
];

describe('Caderno — nunca em payload de IA, telemetria ou dado público', () => {
  it('AUTOVERIFICAÇÃO: os arquivos varridos existem', () => {
    expect(PROIBIDOS.filter(f => !existsSync(join(ROOT, f)))).toEqual([]);
  });

  it.each(PROIBIDOS)('%s não cita o Caderno', (f) => {
    expect(ler(f)).not.toMatch(/caderno|cadernoSave|cadernoLocal|CadernoEntry/i);
  });

  it('nenhum montador de IA ou telemetria serializa o estado cru', () => {
    for (const f of ['src/utils/aiClient.ts', 'src/components/ChatBox.tsx', 'src/utils/telemetry.ts', 'src/utils/oracle.ts']) {
      expect(ler(f), f).not.toMatch(/JSON\.stringify\(\s*(gameState|state)\s*\)/);
    }
  });

  it('o servidor do save clampa o Caderno', () => {
    expect(ler('functions/api/save.js')).toMatch(/clampCaderno/);
  });
});

describe('Caderno — paridade dos tetos cliente x servidor', () => {
  it('save.js usa os mesmos tetos de cadernoSave.ts', async () => {
    const { MAX_ENTRIES, MAX_CHARS } = await import('./cadernoSave');
    const srv = ler('functions/api/save.js');
    expect(srv).toContain(`CADERNO_MAX_ENTRIES = ${MAX_ENTRIES};`);
    expect(srv).toContain(`CADERNO_MAX_CHARS = ${MAX_CHARS};`);
  });
});
