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
  const credito = corpo.indexOf('creditarBitsDePacote(r.bits, r.ent, r.confirmar)');
  expect(pedido).toBeGreaterThan(0);
  expect(recusa).toBeGreaterThan(pedido);
  expect(credito).toBeGreaterThan(recusa);
  expect(corpo).not.toMatch(/spendCredits\(/);
  expect(corpo).not.toMatch(/pack\.bits/); // o número local nunca credita
  expect(app).not.toMatch(/'exchange-bits'/);
});

it('§386 A2: o crédito do pacote entra pelo updater e o `confirmar` só roda depois do commit (efeito + setTimeout), nunca no updater', () => {
  const ini = app.indexOf('const creditarBitsDePacote');
  const fim = app.indexOf('const recuperarBitsPendentes');
  expect(ini).toBeGreaterThan(0);
  const corpo = app.slice(ini, fim);
  const updater = corpo.slice(corpo.indexOf('setGameState(prev =>'), corpo.indexOf('}));') + 4);
  expect(updater).toMatch(/noteCreditBits\(prev, bits/);
  expect(updater).not.toMatch(/confirmar/);
  expect(corpo).toMatch(/bitsParaConfirmar\.current\.push\(confirmar\)/);
  const efeito = app.slice(app.indexOf('const bitsParaConfirmar'), ini);
  expect(efeito).toMatch(/useEffect\(\(\) => \{[\s\S]*setTimeout\(\(\) => \{ for \(const confirmar of fila\) confirmar\(\); \}, 0\)/);
});

it('§386 A1: o boot e o Cambista reenviam os pendentes; a recuperação credita pelo mesmo caminho pós-commit', () => {
  const corpo = app.slice(app.indexOf('const recuperarBitsPendentes'), app.indexOf('const handleExchangeCredits'));
  expect(corpo).toMatch(/recoverPendingBitsBuys\(/);
  expect(corpo).toMatch(/creditarBitsDePacote\(a\.bits, a\.ent, a\.confirmar\)/);
  expect(corpo).toMatch(/useEffect\(\(\) => \{ recuperarBitsPendentes\(\); \}, \[recuperarBitsPendentes\]\)/);
  expect(app).toMatch(/onRecoverPendingBits=\{recuperarBitsPendentes\}/);
});

it('§386 A4b: a troca não toasta no App (a ÚNICA mensagem é a da tela do Cambista); o atalho de Créditos usa o openCredits existente', () => {
  const corpo = app.slice(app.indexOf('const handleExchangeCredits'), app.indexOf('const handleBuyEssence'));
  expect(corpo).not.toMatch(/toast\(/);
  expect(app).toMatch(/onGetCredits=\{demo \? undefined : openCredits\}/);
});
