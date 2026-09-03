# Ledger — guarda-nascimento (WP1.1–1.5)

Dono: `soulmon-guarda-nascimento`. Anexo: `../A-onboarding.md`.

| WP | O quê | Estado | Comando de verificação | Evidência |
|---|---|---|---|---|
| WP1.1 | Sprite no REVEAL | `PROPOSTO` | `awk '/step === REVEAL/,/step === REGISTER/' src/components/SoulmonOnboarding.tsx \| grep -c "<img"` → ≥1; + teste de render com sprite pronto e pendente; + `reveal_seen` emitido | hoje: 0 `<img>` no bloco (awk confirmado 02/09); `GENERATING` = `ravenMascot` + spinner + 1 linha, sem estimativa. Mobbin D1/D2 (`../mobbin/nascimento.md`): encenar (`GENERATING`) e entregar raso (texto) é "o pior quadrante" (Headway); espera atribuída à criatura (Finch) só cabe no estado sprite-pendente, quando ela já tem nome — spec 2 reescrita lá |
| WP1.2 | Reveal cerimonial + `soulGoal` ecoado | `PROPOSTO` | `grep -q "soulGoal" src/components/SoulmonOnboarding.tsx` no bloco REVEAL; screenshot Playwright com e sem `soulGoal`; `prefers-reduced-motion` pula | `creature.bio` = `richConceptPt` (`oracle.ts`) já é ORIGEM; a frase de comportamento mora em `stages[].description` (`behaviorSentence` ← `ROLE_INFO/ALIGNMENT_INFO.profile`), exibida em `PetPage.tsx` — a régua (c) aponta pra lá, não pra um `composeBio` que não existe. `essence` só no caminho longo (`setEssence(null)` no curto). `usePrefersReducedMotion` já existe em `ui/Viewport.tsx`. Mobbin D1: Tolan (epíteto), Noom (ponte), Lovi (termos em cor) |
| WP1.3 | Cartão D0 + check-in não dispara no D0 | `PROPOSTO` | `test -f src/components/FirstDayCard.tsx` + teste `needsCheckIn` no dia da criação === false | Efeito do check-in (`App.tsx`) só guarda onboarding/tutorial/`needsCheckIn`/plano não-vazio → dispara no D0 após o tutorial criar o 1º hábito (confirmado). `handleCompleteOnboarding` não grava `lastCheckInDate`. Mobbin D3: 1 CTA por vez (Peloton), feitos ficam (monday), contar feitos nunca restantes (Hatch=anti), sem oferta (Shopify=anti), dissolve na fala do pet (Preply) |
| WP1.4 | Templates de hábito do `soulGoal`/`soulStruggle` (camada 1 local) | `PROPOSTO` | `test -f src/utils/goalToCategory.ts` + `npx vitest run src/utils/goalToCategory.test.ts` (20 frases PT/EN); camada 2 (IA) `BLOQUEADO:D8` | Mobbin D1 (Noom `Next steps`): se o reveal promete usar a leitura, este WP é quem cumpre, no `TASK_STEP` do tutorial (momento Atoms). Aceite novo: categoria pré-selecionada atribuída na tela, sem rede |
| WP1.5 | Permission priming de push no D2–D3 | `PROPOSTO` | teste: nunca no D0/D1, nunca 2× | `WelcomePromptModal` 'notif': sem prévia, remetente = app, `NOTIFICATION_PROMPT_DISMISSED` é booleano sem data. As pushes reais JÁ são na voz do pet (`functions/api/_pushCopy.js`: "{name} pensou em você"). Mobbin D4 (Finch): prévia construída a partir de `pushCopy` — mesma fonte, promessa não diverge; + reversibilidade/escopo (Babbel/Tempo); Buddy (permissão por ação) já existe via Settings |
| WP1.6 | `BirthCard.tsx` reutilizável (reveal + StatsPage), sem número | `PROPOSTO` | `grep -l BirthCard src/components/SoulmonOnboarding.tsx src/components/StatsPage.tsx` → 2; `grep -cE '[0-9]+ (dias|days)' src/components/BirthCard.tsx` → 0 | Mobbin D1 (Fi) |
| WP1.7 | Rascunho persistente do ritual (`ORACLE_DRAFT`) | `PROPOSTO` | `grep -c ORACLE_DRAFT src/utils/storageKeys.ts src/components/SoulmonOnboarding.tsx` ≥ 1 cada | Mobbin D2 (ABY) |
| WP1.8 | Permissão de push ao ligar o lembrete de deitar | `PROPOSTO` | `grep -n requestNotificationPermission` chamado no caminho da janela de descanso | Mobbin D4 (Buddy); hoje só via `handleToggleNotifications` |

## Verdades deste domínio que o guarda defende
- O REVEAL hoje entrega **texto** depois de 2–5 min de investimento. É o P0 de maior impacto do plano inteiro.
- O sprite só nasce em ocioso **depois** do app montar (`useSpriteGeneration` em `App.tsx:644`); `birthBatch` já teve o bug F-1 de não ter chamador.
- `soulStruggle` é coletado e **nunca lido**. Qualquer WP que o use fecha uma dívida antiga.
- Push **nunca** é pedido antes de o app ter entregue algo (`jaConcluiuAlgo`) — isso está certo e não se mexe.
- A descrição da criatura diz **de onde ela veio**, nunca **como se comporta** (I.3.4: personalidade fechada impede projeção).
