/**
 * CONSENTIMENTO DA MÚSICA. O loop de 2 camadas (e com ele os achados de retomada de contexto 1–4 da auditoria de
 * 11/10/2026: resume síncrono, voz presa a contexto fechado, bus em 0) saiu em 20/10/2026 (REGISTRO §136); a retomada
 * do contexto é do `audioBus`. Sobra o que este módulo ainda decide: quem dá o consentimento (D11/S2) e que `pedirFaixa`
 * é só um registro. O que se mede é o ESTADO, nunca som.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const E = vi.hoisted(() => ({ ligada: false, combate: [] as boolean[] }));

vi.mock('./audioBus', () => ({
  definirTrilhaLigada: (v: boolean) => { E.ligada = v; },
  trilhaLigada: () => E.ligada,
}));
vi.mock('./musicaDeCombate', () => ({
  consentirMusicaDeCombate: (v: boolean) => { E.combate.push(v); },
  esquecerMusicaDeCombate: () => {},
  pausarMusicaDeCombate: () => {},
  retomarMusicaDeCombate: () => {},
}));
vi.mock('./tema', () => ({ esquecerTema: () => {}, pausarTema: () => {}, retomarTema: () => {} }));

import {
  ligarTrilha, desligarTrilha, pedirFaixa, faixaPedidaAgora, trilhaConsentida, esquecerTrilha, consentirNestaSessao, aoGestoSonoro,
} from './trilha';

beforeEach(() => {
  esquecerTrilha();
  E.ligada = false; E.combate.length = 0;
});

describe('consentimento (nasce desligado nesta sessão, só por gesto)', () => {
  it('sem gesto nesta sessão não há consentimento', () => {
    expect(trilhaConsentida()).toBe(false);
    expect(E.combate).toEqual([]);
  });

  it('consentir (abrir uma superfície com a chave ligada) dá o consentimento e avisa a música de combate', () => {
    E.ligada = true;
    consentirNestaSessao();
    expect(trilhaConsentida()).toBe(true);
    expect(E.combate).toEqual([true]);
  });

  it('a chave desligada não dá consentimento; o primeiro gesto sonoro com a preferência ligada dá', () => {
    E.ligada = false;
    consentirNestaSessao();
    expect(trilhaConsentida()).toBe(false);
    E.ligada = true;
    aoGestoSonoro();
    expect(trilhaConsentida()).toBe(true);
  });

  it('ligarTrilha grava a preferência e consente; desligarTrilha desgrava e retira', () => {
    ligarTrilha();
    expect(E.ligada).toBe(true);
    expect(trilhaConsentida()).toBe(true);
    desligarTrilha();
    expect(E.ligada).toBe(false);
    expect(trilhaConsentida()).toBe(false);
    expect(E.combate).toEqual([true, false]);
  });
});

describe('pedirFaixa é no-op compatível (o loop saiu)', () => {
  it('só registra o pedido; nada passa a tocar', () => {
    expect(faixaPedidaAgora()).toBeNull();
    pedirFaixa('loop');
    expect(faixaPedidaAgora()).toBe('loop');
    pedirFaixa(null);
    expect(faixaPedidaAgora()).toBeNull();
  });
});
