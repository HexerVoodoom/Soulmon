/**
 * §373 — guarda de fonte: no App, os Bits de pacote só entram DEPOIS da resposta do servidor e são os que ELE devolveu.
 * (O handler roda dentro do App inteiro; ler a fonte é o jeito barato de travar a ordem "servidor debita → cliente credita".)
 */
import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const app = readFileSync(join(process.cwd(), 'src/App.tsx'), 'utf8');

it('handleExchangeCredits: buyBitsPack antes, noteCreditBits com r.bits depois do ok; nada de troca livre', () => {
  const ini = app.indexOf('const handleExchangeCredits');
  const fim = app.indexOf('const handleBuyEssence');
  expect(ini).toBeGreaterThan(0);
  const corpo = app.slice(ini, fim);
  const pedido = corpo.indexOf('await buyBitsPack(');
  const recusa = corpo.indexOf('if (!r.ok)');
  const credito = corpo.indexOf('noteCreditBits(prev, r.bits');
  expect(pedido).toBeGreaterThan(0);
  expect(recusa).toBeGreaterThan(pedido);
  expect(credito).toBeGreaterThan(recusa);
  expect(corpo).not.toMatch(/spendCredits\(/);
  expect(corpo).not.toMatch(/pack\.bits/); // o número local nunca credita
  expect(app).not.toMatch(/'exchange-bits'/);
});
