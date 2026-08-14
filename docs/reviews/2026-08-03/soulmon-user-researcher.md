# soulmon-user-researcher — Revisão Soulmon
**Data:** 2026-08-03 · **Escopo:** ICP, personas, walkthrough do produto pelos olhos do usuário, benchmark de público e plano de pesquisa primária
**Evidência analisada:** `src/components/SoulmonOnboarding.tsx`, `src/components/OraclePage.tsx`, `src/utils/oracle.ts`, `src/App.tsx`, `src/utils/dailyReset.ts`, `src/types/progression.ts`, `src/components/TaskCard.tsx`, `src/components/EnergyBar.tsx`, `src/components/CreateModal.tsx`, `src/components/ShopModal.tsx`, `src/components/DungeonGame.tsx`, `docs/reviews/2026-08-03/00-CONSOLIDADO.md` · fontes externas: em levantamento

> **Status:** rascunho em construção (gravado cedo por política anti-perda). Seções marcadas
> `[EM ABERTO]` ainda serão preenchidas nesta sessão.

## 1. Veredito em uma frase
[EM ABERTO]

## 2. Notas da rubrica
| Dimensão | Nota | Justificativa em uma linha |
|---|---|---|
| D1 — Clareza de proposta | | |
| D2 — Time-to-value | | |
| D3 — Eficácia do núcleo | | |
| D4 — Vínculo alma↔criatura | | |
| D10 — Diferenciação | | |

## 3. Pontos fortes
[EM ABERTO]

## 4. Pontos fracos
[EM ABERTO]

## 5. Benchmark de mercado
[EM ABERTO]

## 6. Oportunidades e recomendações
[EM ABERTO]

## 7. O que falta para ser um produto de sucesso
[EM ABERTO]

## 8. Discordâncias e riscos da minha própria análise
[EM ABERTO]

## 9. Perguntas abertas para o dono do produto
[EM ABERTO]

## 10. Fontes
[EM ABERTO]

---

## Anexo A — ICP

### Achado de produto que redefine o ICP (registrado antes de tudo)

`[FATO]` O ritual do Oráculo promete, na tela 0 (`SoulmonOnboarding.tsx:160`):
> "Toda alma carrega uma criatura. Responda algumas perguntas e revele a SUA — única, só sua, com todas as suas evoluções."

`[FATO]` O reveal ao final entrega **apenas um nome e um parágrafo de bio**
(`SoulmonOnboarding.tsx:276-295`) — não há imagem da criatura na tela de revelação.

`[FATO]` E o sprite que o usuário efetivamente vê depois é sorteado entre **três** linhas
genéricas por hash da seed (`App.tsx:1260-1261`):
```
const GENERIC_LINES = ['tapirmon', 'veemon', 'salamon'] as const;
```
Ou seja: um em cada três usuários vê exatamente a mesma criatura — e as três são Digimon.

`[FATO]` A geração real de sprites únicos (`generateAllSprites`) existe, mas mora numa
**página separada** (`OraclePage.tsx:166`), acionada por botão manual
(`OraclePage.tsx:685-729`), fora do onboarding.

**Consequência para pesquisa de usuário:** o momento "essa criatura sou eu" — a única
razão pela qual o ICP escolheria o Soulmon em vez de Habitica ou Finch — **não acontece
no onboarding hoje**. O produto tem o diferencial construído e não o entrega.

### ICP primário, secundário e anti-persona
[EM ABERTO]

---

## Anexo B — Personas
[EM ABERTO]

---

## Anexo C — Walkthrough por persona
[EM ABERTO]

---

## Anexo D — Plano de pesquisa primária
[EM ABERTO]
