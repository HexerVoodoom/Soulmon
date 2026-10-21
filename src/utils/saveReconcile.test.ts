import { describe, it, expect } from 'vitest';
import { decidirReconciliacao } from './saveReconcile';
import type { LeituraNuvem } from './cloudSave';

const enc = (revision?: number): LeituraNuvem => ({ estado: 'encontrado', state: {}, ...(revision !== undefined ? { revision } : {}) });
const vazio: LeituraNuvem = { estado: 'vazio' };
const indet: LeituraNuvem = { estado: 'indeterminado' };
const excl: LeituraNuvem = { estado: 'excluida' };

describe('decidirReconciliacao (ADR-004 D2/D3)', () => {
  const tabela: Array<[string, Parameters<typeof decidirReconciliacao>[0], string]> = [
    ['409 + encontrado: a nuvem vence (com revisão)', { motivo: '409', leitura: enc(7), revisaoLocal: 3, pendente: true }, 'adotar'],
    ['409 + encontrado sem revisão (servidor antigo): ainda adota', { motivo: '409', leitura: enc(), revisaoLocal: 3, pendente: true }, 'adotar'],
    ['409 + encontrado com revisão local MAIOR: não há heurística, adota', { motivo: '409', leitura: enc(2), revisaoLocal: 9, pendente: false }, 'adotar'],
    ['409 + vazio: libera', { motivo: '409', leitura: vazio, revisaoLocal: 3, pendente: true }, 'liberar'],
    ['409 + indeterminado: espera (POST suspenso)', { motivo: '409', leitura: indet, revisaoLocal: 3, pendente: true }, 'esperar'],
    ['409 + excluida', { motivo: '409', leitura: excl, revisaoLocal: 3, pendente: true }, 'excluida'],
    ['boot: revisão da nuvem maior e sem pendência: adota', { motivo: 'boot', leitura: enc(8), revisaoLocal: 7, pendente: false }, 'adotar'],
    ['boot: revisão igual: ignora', { motivo: 'boot', leitura: enc(7), revisaoLocal: 7, pendente: false }, 'ignorar'],
    ['boot: revisão da nuvem menor: ignora', { motivo: 'boot', leitura: enc(5), revisaoLocal: 7, pendente: false }, 'ignorar'],
    ['boot: maior mas com pendência: não decide', { motivo: 'boot', leitura: enc(8), revisaoLocal: 7, pendente: true }, 'ignorar'],
    ['boot: sem revisão local: ignora', { motivo: 'boot', leitura: enc(8), revisaoLocal: null, pendente: false }, 'ignorar'],
    ['boot: nuvem sem revisão: ignora', { motivo: 'boot', leitura: enc(), revisaoLocal: 7, pendente: false }, 'ignorar'],
    ['boot: vazio: ignora (o 409 decide)', { motivo: 'boot', leitura: vazio, revisaoLocal: 7, pendente: false }, 'ignorar'],
    ['boot: indeterminado: ignora', { motivo: 'boot', leitura: indet, revisaoLocal: 7, pendente: false }, 'ignorar'],
    ['boot: excluida', { motivo: 'boot', leitura: excl, revisaoLocal: 7, pendente: false }, 'excluida'],
    ['visivel: maior e sem pendência: adota', { motivo: 'visivel', leitura: enc(9), revisaoLocal: 7, pendente: false }, 'adotar'],
    ['visivel: maior com pendência: ignora', { motivo: 'visivel', leitura: enc(9), revisaoLocal: 7, pendente: true }, 'ignorar'],
    ['visivel: revisão 0 local, nuvem 1: adota', { motivo: 'visivel', leitura: enc(1), revisaoLocal: 0, pendente: false }, 'adotar'],
  ];
  for (const [nome, entrada, esperado] of tabela) {
    it(nome, () => { expect(decidirReconciliacao(entrada)).toBe(esperado); });
  }
});
