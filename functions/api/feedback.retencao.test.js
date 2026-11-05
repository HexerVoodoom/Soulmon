import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { FEEDBACK_TTL_SECONDS } from './feedback.js';

// Retenção do feedback: decisão do dono (05/11/2026, trocou os 90 de 04/11) = 30 dias. O servidor expira sozinho (TTL da KV); a política diz o prazo.
describe('retenção do feedback: 30 dias', () => {
  it('o TTL da KV é exatamente 30 dias', () => {
    expect(FEEDBACK_TTL_SECONDS).toBe(30 * 24 * 60 * 60);
  });
  it('a política declara os 30 dias nas duas línguas, a data, e que o e-mail entregue fica com o dono', () => {
    const html = readFileSync(new URL('../../public/privacidade.html', import.meta.url), 'utf8');
    expect(html).toMatch(/keeps a copy for up to <strong>30 days<\/strong>/);
    expect(html).toMatch(/guarda uma cópia por até <strong>30 dias<\/strong>/);
    expect(html).toContain('Last updated: November 4, 2026');
    expect(html).toContain('Última atualização: 4 de novembro de 2026');
    expect(html).toMatch(/review mailbox until we delete it/);
    expect(html).toMatch(/caixa de revisão até ser apagada por nós/);
  });
});
