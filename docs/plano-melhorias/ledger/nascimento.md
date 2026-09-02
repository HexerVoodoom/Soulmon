# Ledger — guarda-nascimento (WP1.1–1.5)

Dono: `soulmon-guarda-nascimento`. Anexo: `../A-onboarding.md`.

| WP | O quê | Estado | Comando de verificação | Evidência |
|---|---|---|---|---|
| WP1.1 | Sprite no REVEAL | `PROPOSTO` | `awk '/step === REVEAL/,/step === REGISTER/' src/components/SoulmonOnboarding.tsx \| grep -c "<img"` → ≥1; + teste de render com sprite pronto e pendente; + `reveal_seen` emitido | hoje: 0 `<img>` no bloco |
| WP1.2 | Reveal cerimonial + `soulGoal` ecoado | `PROPOSTO` | `grep -q "soulGoal" src/components/SoulmonOnboarding.tsx` no bloco REVEAL; screenshot Playwright com e sem `soulGoal`; `prefers-reduced-motion` pula | — |
| WP1.3 | Cartão D0 + check-in não dispara no D0 | `PROPOSTO` | `test -f src/components/FirstDayCard.tsx` + teste `needsCheckIn` no dia da criação === false | — |
| WP1.4 | Templates de hábito do `soulGoal`/`soulStruggle` (camada 1 local) | `PROPOSTO` | `test -f src/utils/goalToCategory.ts` + `npx vitest run src/utils/goalToCategory.test.ts` (20 frases PT/EN); camada 2 (IA) `BLOQUEADO:D8` | — |
| WP1.5 | Permission priming de push no D2–D3 | `PROPOSTO` | teste: nunca no D0/D1, nunca 2× | — |

## Verdades deste domínio que o guarda defende
- O REVEAL hoje entrega **texto** depois de 2–5 min de investimento. É o P0 de maior impacto do plano inteiro.
- O sprite só nasce em ocioso **depois** do app montar (`useSpriteGeneration` em `App.tsx:644`); `birthBatch` já teve o bug F-1 de não ter chamador.
- `soulStruggle` é coletado e **nunca lido**. Qualquer WP que o use fecha uma dívida antiga.
- Push **nunca** é pedido antes de o app ter entregue algo (`jaConcluiuAlgo`) — isso está certo e não se mexe.
- A descrição da criatura diz **de onde ela veio**, nunca **como se comporta** (I.3.4: personalidade fechada impede projeção).
