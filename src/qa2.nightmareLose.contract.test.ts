/**
 * QA2 (04/10/2026) — a derrota do pesadelo não pode fechar o modal.
 *
 * `NightmareBattle` muda para a fase `lost` e chama `onLose`; a tela da fase
 * ("O sonho passou — e você acorda bem", "nenhum coração, nenhum Bit") só existe
 * se o modal CONTINUA montado. Com `onLose={closeNightmare}` o App desmontava
 * tudo no mesmo instante e o jogador que perdia nunca lia que perder não custa
 * nada. Contrato de fonte (o App é grande demais para render): `onLose` só
 * grava a noite; quem fecha é o `onClose`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('pesadelo: derrota mantém a tela de derrota', () => {
  const app = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf-8');
  const bloco = app.slice(app.indexOf("interstitial === 'nightmare' && ("));
  // o bloco agora está num `<Suspense fallback={<ScreenSkeleton … />}>` (carga sob demanda): o 1º '/>' é do
  // esqueleto — corta no fechamento do `NightmareBattle` (primeiro '/>' depois do componente).
  const jsx = bloco.slice(bloco.indexOf('<NightmareBattle'), bloco.indexOf('/>', bloco.indexOf('<NightmareBattle')));

  it('onLose NÃO é o callback que fecha', () => {
    expect(jsx).toMatch(/onLose=\{markNightmareFought\}/);
    expect(jsx).not.toMatch(/onLose=\{closeNightmare\}/);
  });

  it('onClose fecha, e fechar também grava a noite', () => {
    expect(jsx).toMatch(/onClose=\{closeNightmare\}/);
    const fecha = app.slice(app.indexOf('const closeNightmare = useCallback'));
    expect(fecha.slice(0, 200)).toMatch(/markNightmareFought\(\);\s*setNightmareOpen\(false\)/);
  });
});
