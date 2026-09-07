/**
 * O endpoint NUNCA declara um app que não seja o nosso.
 *
 * Ele servia o pacote e o fingerprint do DigiApp como PADRÃO, com a
 * justificativa de que o domínio era compartilhado. Não é mais — e o efeito
 * era afirmar publicamente, no nosso domínio, que outro app pode tratar os
 * nossos links.
 */
import { describe, it, expect } from 'vitest';
import { onRequest } from './assetlinks.json.js';

const ler = async (env) => (await onRequest({ env })).json();

describe('assetlinks.json', () => {
  it('sem fingerprint NÃO declara nada — vazio é a verdade', async () => {
    // Um vínculo ausente custa o App Link (o link não abre direto no app).
    // Um vínculo mentindo custa a propriedade do domínio.
    expect(await ler({})).toEqual([]);
    expect(await ler(undefined)).toEqual([]);
  });

  it('com fingerprint, declara o pacote do Soulmon', async () => {
    const [alvo] = await ler({ ASSETLINKS_SHA256: 'AA:BB' });
    expect(alvo.target.package_name).toBe('com.hexervoodoom.soulmon');
    expect(alvo.target.sha256_cert_fingerprints).toEqual(['AA:BB']);
  });

  it('nenhum pacote de terceiro sobrou como padrão', async () => {
    const { readFileSync } = await import('node:fs');
    const fonte = readFileSync('functions/.well-known/assetlinks.json.js', 'utf8');
    // O nome aparece no comentário-lápide de propósito; o que não pode voltar
    // é ele como VALOR.
    expect(fonte).not.toMatch(/=\s*'com\.digipartner/);
  });
});
