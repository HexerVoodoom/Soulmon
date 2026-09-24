/**
 * WP5.1 — OS DOIS CANAIS, e o aceite que não sabia contar.
 *
 * ⚠️ Este pacote ficou `VERIFICADO` com METADE faltando, e a culpa foi do
 * comando: `grep -q "UnlockNudge" ShopModal.tsx DailyReportModal.tsx` é **OR**,
 * não AND — sai 0 se QUALQUER um casar. O card da Loja nunca existiu e o
 * aceite passou verde. Um comando que não falha com o pacote pela metade é
 * pior que aceite nenhum, porque ninguém volta a olhar.
 *
 * Este arquivo é o aceite refeito, e ele verifica os DOIS canais separados:
 *
 *  · **PASSIVO** (Loja) — permanente, fora do cap semanal, sobrevive ao `×`.
 *    A pessoa ABRE. É a única porta de descoberta voluntária: sem ela, quem
 *    não faz um dia perfeito na semana só vê oferta como RECUSA (bateu o teto).
 *  · **PROATIVO** (relatório) — aparece sozinho, 1×/semana, só no 1º dia
 *    perfeito, e o `×` é terminal.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { shouldOfferAtValueMoment } from '../utils/offerMoment';

// minimal-ui F5: a `ShopModal` saiu; o card passivo mora na lojinha de Itens
// do Mercado, aba de Créditos.
const shop = readFileSync('src/components/mercado/MercadoSheets.tsx', 'utf8');
const report = readFileSync('src/components/DailyReportModal.tsx', 'utf8');
const app = readFileSync('src/App.tsx', 'utf8');

describe('canal PASSIVO — a Loja', () => {
  it('o card existe, e é do motivo `shop`', () => {
    // Cada asserção é sua, e falha sozinha. Era exatamente isto que o `grep -q`
    // com dois arquivos não conseguia fazer.
    expect(shop).toContain('<UnlockNudge');
    expect(shop).toMatch(/reason="shop"/);
  });

  it('só para quem NÃO comprou', () => {
    expect(shop).toMatch(/accountTier === 'demo'/);
  });

  it('fica na aba de Créditos (dinheiro real), nunca na de Emblemas', () => {
    // O Torneio cobra em Emblemas, que são cosméticos por regra; misturar o
    // convite de dinheiro real ali embaralharia as três moedas.
    expect(shop).toMatch(/cur === 'credits' && accountTier === 'demo'/);
    const torneio = readFileSync('src/components/TournamentPage.tsx', 'utf8');
    expect(torneio).not.toContain('<UnlockNudge');
  });

  it('está fiado no App', () => {
    expect(app).toMatch(/accountTier=\{gameState\.accountTier\}/);
    expect(app).toMatch(/onUnlock=\{\(\) => setUnlockReason\('shop'\)\}/);
  });
});

describe('canal PROATIVO — o relatório diário', () => {
  it('o card existe, com o motivo `report`', () => {
    expect(report).toContain('<UnlockNudge');
    expect(report).toMatch(/reason="report"/);
  });

  it('tem o `×` — o único padrão positivo que o dossiê achou', () => {
    expect(report).toMatch(/onDismissOffer/);
    expect(report).toMatch(/aria-label=\{isPt \? 'Não mostrar de novo'/);
  });

  it('o botão é de largura PARCIAL, contra os CTAs de largura total', () => {
    // Com a mesma largura do "Começar o dia", o convite compete com a ação
    // que fecha o ritual do dia.
    expect(report).toMatch(/maxWidth: 260/);
  });

  it('a telemetria diz `report`, e não `evolution`', () => {
    // O funil por origem nascia mentindo: o clique no card do relatório era
    // gravado como se viesse da página de Evolução.
    expect(app).toMatch(/setUnlockReason\('report'\)/);
  });
});

describe('o × é terminal, e só para o canal proativo', () => {
  const base = {
    tier: 'demo' as const,
    wasPerfect: true,
    welcomeBack: false,
    daysWithPet: 10,
    currentWeek: '2026-W37',
  };

  it('sem dispensar, o convite proativo aparece', () => {
    expect(shouldOfferAtValueMoment(base)).toBe(true);
  });

  it('dispensado, ele NUNCA mais aparece', () => {
    // Um "não" que o app repergunta na semana seguinte não era um não.
    expect(shouldOfferAtValueMoment({ ...base, dismissed: true })).toBe(false);
    expect(shouldOfferAtValueMoment({ ...base, dismissed: true, currentWeek: '2026-W52' })).toBe(false);
  });

  it('mas o card da Loja NÃO depende disso', () => {
    // Dispensar o que te interrompe não é dizer que você nunca mais quer
    // procurar. O card passivo não lê `offerDismissed` em lugar nenhum.
    const bloco = shop.slice(shop.indexOf("cur === 'credits' && accountTier"), shop.indexOf('</section>', shop.indexOf("cur === 'credits' && accountTier")));
    expect(bloco).toContain('<UnlockNudge');
    expect(bloco).not.toContain('offerDismissed');
  });
});
