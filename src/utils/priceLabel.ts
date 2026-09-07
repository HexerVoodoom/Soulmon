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
import { FULL_UNLOCK_SKU, FULL_UNLOCK_PRICE_LABEL } from './monetization';

/**
 * O rótulo de preço do desbloqueio completo.
 *
 * Começa na constante e TROCA quando o Play responde — nunca fica vazio nem
 * mostra um esqueleto: um preço que aparece depois é melhor que um espaço em
 * branco onde o preço deveria estar, e piscar de "R$ 29,90" para o preço local
 * é honesto (o segundo é o que será cobrado).
 */
export function useUnlockPriceLabel(): string {
  const [label, setLabel] = useState(FULL_UNLOCK_PRICE_LABEL);

  useEffect(() => {
    let vivo = true;
    // Fora do Android nativo, `getLocalizedPrice` devolve `null` e a constante
    // fica — é o caminho da PWA e do desktop, e ele não é um erro.
    getLocalizedPrice(FULL_UNLOCK_SKU)
      .then(preco => { if (vivo && preco) setLabel(preco); })
      .catch(() => { /* o fallback já está na tela */ });
    return () => { vivo = false; };
  }, []);

  return label;
}
