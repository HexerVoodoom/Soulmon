// ---------------------------------------------------------------------------
// WP5.8 — O PREÇO QUE A LOJA VAI COBRAR DE VERDADE.
//
// ⚠️ `getLocalizedPrice` existia no `BillingPlugin.kt` e no wrapper
// `playBilling.ts`, com teste, e **nenhuma tela o consumia** (auditoria de
// 06/09/2026): as cinco superfícies de preço imprimiam a constante
// `FULL_UNLOCK_PRICE_LABEL` = 'R$ 29,90'. Quem abre o app fora do Brasil lia
// "R$ 29,90" e a folha do Play cobrava outra moeda e outro valor — o "preço
// opaco" que o dossiê condena, e um motivo clássico de review de uma estrela
// e de pedido de reembolso.
//
// O argumento aprovado no estudo é preço REGIONALIZADO como prática justa; e
// preço regionalizado que a tela não mostra não é prática nenhuma.
//
// A constante continua sendo o fallback, e continua sendo a régua do texto
// publicado (`publishedPrice.test.ts` a trava contra `termos.html`): na web,
// na PWA e enquanto o Play não responde, ela é o que existe. O que muda é que,
// quando o aparelho SABE o preço, é o preço do aparelho que aparece.
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import { getLocalizedPrice } from './playBilling';
import { CREDIT_PACKS, FULL_UNLOCK_SKU, FULL_UNLOCK_PRICE_LABEL } from './monetization';

/**
 * A moeda dos rótulos de FALLBACK deste arquivo.
 *
 * Todo `priceLabel` escrito à mão em `monetization.ts` está em real, porque é
 * a moeda em que o produto foi publicado. Quando o Play responde, o rótulo dele
 * já vem formatado na moeda do país da conta e este marcador some — é o preço
 * de verdade, e ele se apresenta sozinho.
 */
export const MOEDA_DO_FALLBACK = 'BRL';

/**
 * "R$ 29,90" não diz de que moeda é para quem está em inglês.
 *
 * O símbolo `R$` é lido como real por quem já conhece o real, e por mais
 * ninguém — e o dossiê condena exatamente o "preço opaco". Em português a
 * moeda é óbvia e o marcador seria ruído; em inglês, sobre um rótulo que é o
 * FALLBACK (ou seja, o app não conseguiu perguntar o preço à loja), ele é a
 * única coisa que separa um número de uma promessa vaga.
 *
 * ⚠️ Só sobre o fallback. Se o rótulo veio do Play, ele JÁ está na moeda de
 * quem está olhando — carimbar "BRL" ali seria transformar um preço correto
 * numa mentira.
 */
export function precoComMoeda(label: string, ehFallback: boolean, isPt: boolean): string {
  if (isPt || !ehFallback) return label;
  return `${label} ${MOEDA_DO_FALLBACK}`;
}

/**
 * O rótulo de preço do desbloqueio completo.
 *
 * Começa na constante e TROCA quando o Play responde — nunca fica vazio nem
 * mostra um esqueleto: um preço que aparece depois é melhor que um espaço em
 * branco onde o preço deveria estar, e piscar de "R$ 29,90" para o preço local
 * é honesto (o segundo é o que será cobrado).
 *
 * Recebe o idioma porque o fallback precisa se identificar em inglês (ver
 * `precoComMoeda`) — e recebê-lo por parâmetro, em vez de ler o idioma aqui
 * dentro, mantém este arquivo sem dependência de contexto de React.
 */
export function useUnlockPriceLabel(isPt: boolean): string {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    // Fora do Android nativo, `getLocalizedPrice` devolve `null` e a constante
    // fica — é o caminho da PWA e do desktop, e ele não é um erro.
    getLocalizedPrice(FULL_UNLOCK_SKU)
      .then(preco => { if (vivo && preco) setLabel(preco); })
      .catch(() => { /* o fallback já está na tela */ });
    return () => { vivo = false; };
  }, []);

  return precoComMoeda(label ?? FULL_UNLOCK_PRICE_LABEL, label === null, isPt);
}

/**
 * Os rótulos dos PACOTES DE CRÉDITO, pelo mesmo caminho.
 *
 * ⚠️ O WP5.8 consertou o preço opaco do desbloqueio e **deixou os pacotes para
 * trás**: o `CreditsModal` imprimia `pack.priceLabel` cru, ou seja, a constante
 * em real, para todo mundo do planeta. É o MESMO defeito, na mesma tela de
 * compra, um andar abaixo — achado na sessão de QA de 08/09/2026.
 *
 * Devolve um mapa `SKU → rótulo`, com a constante enquanto a loja não responde.
 */
export function useCreditPackLabels(isPt: boolean): Record<string, string> {
  const [daLoja, setDaLoja] = useState<Record<string, string>>({});

  useEffect(() => {
    let vivo = true;
    Promise.all(CREDIT_PACKS.map(async p => [p.id, await getLocalizedPrice(p.id)] as const))
      .then(pares => {
        if (!vivo) return;
        const achados: Record<string, string> = {};
        for (const [id, preco] of pares) if (preco) achados[id] = preco;
        if (Object.keys(achados).length) setDaLoja(achados);
      })
      .catch(() => { /* os fallbacks já estão na tela */ });
    return () => { vivo = false; };
  }, []);

  const saida: Record<string, string> = {};
  for (const p of CREDIT_PACKS) {
    const daLojaAqui = daLoja[p.id];
    saida[p.id] = precoComMoeda(daLojaAqui ?? p.priceLabel, !daLojaAqui, isPt);
  }
  return saida;
}
