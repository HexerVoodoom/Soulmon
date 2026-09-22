# Orçamento de tempo da suíte — baseline e dívida nomeada

> **Dono:** `alpha-qa` (mede) · quem conserta é o dono do teste lento · **Data:** 22/09/2026 (QA Rodada 2; primeiro baseline no repo — o anterior, 27/08/2026 com 172 arquivos, vivia em `squad-alpha-runs/soulmon-02/sweeper/orcamento-de-tempo.md`, fora do git, e `scripts/orcamento-de-tempo.mjs` ainda aponta para lá no cabeçalho) · **Estado:** vivo
> **Verificação:** `node scripts/orcamento-de-tempo.mjs --rodadas 2` em máquina ociosa — o script imprime exatamente as seções abaixo; `vitest.budget.mjs` é o dono único dos números (`TEST_TIMEOUT_MS`, `LIMIARES`). Não entra no gate de `npm test` de propósito ([manual/05-ARQUITETURA.md](manual/05-ARQUITETURA.md) §10.2)
> **Não cobre:** bytes do bundle (→ `src/deploy/orcamentoDeBytes.contract.test.ts`); flake por contenção (a medição é em máquina ociosa; sob contenção o número mede a máquina)
> **Precedência:** código > teste > `CLAUDE.md` > este documento. O número que vale é o da última execução colada aqui, com data e máquina.

---

## 1. A regra (de `scripts/orcamento-de-tempo.mjs` e `vitest.budget.mjs`)

| Símbolo | Valor | Significado |
|---|---|---|
| `TEST_TIMEOUT_MS` | 15 000 ms | Piso de robustez, não conserto de lentidão |
| `LIMIARES.atencao` | 10 % (1 500 ms) | Custo de ambiente; só se observa |
| `LIMIARES.divida` | 25 % (3 750 ms) | **Dívida NOMEADA** — sem folga para o fator de contenção de 4,4× medido em 08/2026 |
| `LIMIARES.critico` | 50 % (7 500 ms) | Conserto na ORIGEM, nunca subindo o teto |

Ranking por **pior caso** entre rodadas (a média esconde o caso que estoura). Código de saída 1
= há dívida a registrar. Subir o teto **não** é conserto.

## 2. Baseline — 22/09/2026 (máquina do dono, Windows, árvore `qa/rodada-2-2026-09-22` @ `a6c1cd8a`)

```
orçamento = 15000 ms · faixas: atenção 10% · dívida 25% · crítico 50%
  rodada 1/2 … 119.1s · 4502 testes cronometrados
  rodada 2/2 … 132.3s · 4502 testes cronometrados
Suíte verde em todas as rodadas: sim
  atenção  > 10% (1500ms): 7
  dívida   > 25% (3750ms): 4
  crítico  > 50% (7500ms): 0
EXIT=1
```

Top 8 por pior caso (`[rodada 1 / rodada 2]`):

| # | pior caso | % | teste |
|---|---|---|---|
| 1 | 5 027 ms | 33,5 % | `src/components/ShopModal.canvas.render.test.tsx` › as três moedas (Bits mono primary-ink sem ícone; Emblemas serifa gold; Créditos diamond credit-ink) `[4234 / 5027]` |
| 2 | 4 937 ms | 32,9 % | `ShopModal.canvas.render.test.tsx` › equipado = anel por fora do vidro + tag check_circle `[4108 / 4937]` |
| 3 | 4 862 ms | 32,4 % | `ShopModal.canvas.render.test.tsx` › travado = aria-disabled, fora do Tab, tracejado, véu, cadeado `[4176 / 4862]` |
| 4 | 4 451 ms | 29,7 % | `ShopModal.canvas.render.test.tsx` › sem saldo: preço esmaece por TINTA, recusa âmbar `[4451 / 4408]` |
| 5 | 2 010 ms | 13,4 % | `functions/api/generate-sprite.dedupe.test.js` › republicação: a URL do Higgsfield também é republicada |
| 6 | 1 647 ms | 11,0 % | `src/utils/cortes.contract.test.ts` › a régua dos cortes |
| 7 | 1 625 ms | 10,8 % | `src/components/SoulmonOnboarding.batismo.render.test.tsx` › apelido enquadrado e Soulmon batizado EN |
| 8 | 1 487 ms | 9,9 % | `ShopModal.canvas.render.test.tsx` › o saldo é texto num `<p>` |

Por arquivo (pior caso), os mais pesados são os `*.render.test.tsx` que montam com o `index.css`
real (`src/test/renderEnv.tsx`): `EvolutionPath.*` 3,8–4,1 s, `CompanionHUD.*` 3,4–4,0 s,
`ShopModal.canvas` 3,6 s, `PetPage.render` 3,7 s.

## 3. Dívida nomeada (aberta)

| Teste | Pior caso | Gatilho provável | Conserto na origem | Dono |
|---|---|---|---|---|
| `src/components/ShopModal.canvas.render.test.tsx` — 4 casos (as três moedas · equipado · travado · sem saldo) | 4,45–5,03 s (29,7–33,5 %) | cada caso monta o `ShopModal` inteiro com o `index.css` real e o catálogo completo (`SHOP_ITEMS` 55 itens + 28 cenários com thumbs) e mede estilo computado por item; 4 montagens × catálogo inteiro | montar uma vez por `describe` (`beforeAll`) e medir os 4 estados sobre a mesma árvore, **ou** fixture de catálogo mínimo (1 item por moeda/estado) — o que se testa é tinta/aria por estado, não o catálogo | `staff-frontend` (dono do teste) |

Regra para fechar a linha: rodar `node scripts/orcamento-de-tempo.mjs` de novo, colar a saída
nova em §2 com data, e mover a linha para §4.

## 4. Dívida paga

| Teste | Era | Ficou | Data | Como |
|---|---|---|---|---|
| — | | | | |

## 5. Histórico de baselines

| Data | Arquivos / testes | Atenção / dívida / crítico | Onde |
|---|---|---|---|
| 27/08/2026 | 172 arquivos | 1 / 0 / 0 (pior caso 1 585 ms, 10,57 %) | `squad-alpha-runs/soulmon-02/sweeper/orcamento-de-tempo.md` (fora do git) |
| 22/09/2026 | 4 502 testes cronometrados (suíte 338 arquivos) | 7 / 4 / 0 | este doc, §2 |
