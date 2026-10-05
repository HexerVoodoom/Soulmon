# Gate — fase `discovery` (run `combate-v3-01`)

## Veredito
**CONCERNS.** Os 4 exemplos do dono fecham exatamente (provado por execução). Mas a régua de paridade como está escrita (§3) e o crescimento como definido (§2.3 + Q1 + Q4) não fecham. Duas objeções FATAIS dependem de decisão do dono, não de correção da squad.

## Agentes usados (6) e por quê
curador (o modo validar exige isso) · benchmark (nunca pular) · qa (execução do modelo, princípio 6) · skeptic · compliance leve · security leve. Ficaram de fora discovery/PM/sizing/pesquisa: o problema é dado pelo dono, não há usuários e não há negócio a dimensionar.

## Artefatos
- `contexto.md`: bloco de contexto com Q1/Q2/Q4/Q5 registradas.
- `discovery/dossie-codigo.md`: código real contra o handoff §5 (todos os símbolos existem; 10 contradições; 17 fontes de não-linearidade; 3 motores paralelos).
- `discovery/benchmark.md`: 9 referências com fonte (só resumos de busca, nenhuma página aberta).
- `discovery/sim-modelo.md`: simulação executada, com saída real e prova de vermelho. Script em `E:\tmp\...\scratchpad\cv3-sim.mjs`.
- `E:\soulmon-cv3\docs\PLANO-COMBATE-V3.md` + linha no 00-MAPA (commit `3390eb6b`, branch `combate-v3/plano`, sem PR). docsManual verde no worktree.

## Self-grade
| Dimensão | Nota | Evidência |
|---|---|---|
| Evidência | 🟢 | dossiê símbolo a símbolo; simulação executada com N=300 |
| Risco nomeado | 🟢 | F1/F2 com o teste que as falsearia |
| Decisão | 🟡 | métrica de paridade, piso/teto e amortecimento estão com o dono |
| Mensurabilidade | 🟡 | a régua de ±5% existe, mas não serve para 5 das 6 famílias |
| Caminhos de falha | 🟡 | empate, piso com especial que não dispara, camadas por cima (anel, esquiva) não simuladas |
| Executabilidade | 🟡 | Fase 4 subestimada (3 motores); ordem do §6 invertida |

## Objeções
| # | Objeção | Sev. | Cenário | Estado |
|---|---|---|---|---|
| F1 | "Mesmo tempo" é a métrica errada para cura, escudo, buff e debuff (18/32 casos reprovam) | FATAL | a Fase 2 nunca fica verde, ou a régua é afrouxada às escondidas | aberta → dono |
| F2 | ATK puro domina: piso de 1 golpe a partir do dia 7–17; ×1,5 dá um degrau de −3 golpes; SPD é sublinear; DEF/SPD puros perdem sempre | FATAL | jogador Poder vence tudo em 1–3 golpes no dia 14, e o especial nem dispara | aberta → dono (Q3 + amortecimento) |
| X1 | o galho do dia não existe no dado; dois desempates já divergem | FIXÁVEL | terceira fonte de verdade | aberta → spec Fase 1 |
| X2 | `perfectDays` é inflado por Glitchtama e cai com degeneração; o gatilho certo é `dayWasPerfect` na virada (`completeDayReached`) | FIXÁVEL | item dá atributo; dia ruim "tira" ponto | resolvida na recomendação, falta confirmar Glitchtama |
| X3 | 3 motores (Masmorra/Arena/PvP) → Fase 4 precisa virar 4a/4b/4c | FIXÁVEL | PR gigante, paridade com `_duel.js` quebra | aberta → replanejar |
| X4 | anel, esquiva, bloqueio e ×3/×2 multiplicam o golpe; SPD carrega energia em dobro | FIXÁVEL | paridade some no jogo real | aberta → dono decide se é "habilidade fora da régua" |
| X5 | empate no espelho sem regra; +1 SPD vence 300/300 | FIXÁVEL | PvP decidido por desempate | aberta |
| X6 | §6 grava save antes de provar o modelo | FIXÁVEL | campo migrado vira dívida | aberta → reordenar |
| S1 | stats forjados no PvP: `save.js` não clampa | FIXÁVEL (alta) | atk 1e9 vence todo duelo | requisito Fase 3 |
| S2 | soulProfile no prompt do Groq contradiz a promessa de privacidade (`account.js`) | FIXÁVEL (alta) | quebra a promessa publicada | pesa contra IA no Q8 |
| C1 | ponto sem streak, sem contagem de tarefas, nunca desce; nome passa no contrato de vocabulário em TODO o espaço de combinações | requisito | — | registrado |
| R | "simples demais", nome do especial, sem telemetria | RUÍDO | — | descartadas |

## Re-grade
Nenhum passe de revisão feito: F1 e F2 são decisões do dono, e revisar sem elas seria a IA decidir pelo gate.

## Verificação executável
`node cv3-sim.mjs` → exit=1, 14 PASS / 18 FAIL. `--red` → "REPROVA: familia=dotCurto", 11/21. Saída completa em `discovery/sim-modelo.md`. Também `npx vitest run src/docsManual.contract.test.ts` no worktree → 7/7 verdes.

## Maior risco sobrevivente
O jogo vira "quem cuida de Poder vence em 1 golpe" antes da segunda semana, e a régua de paridade não tem como ficar verde para cura e buff. As duas coisas exigem decisão de design antes de qualquer código.

## Pendências escaladas (dono do Soulmon)
| Pendência | Pedido | Prazo |
|---|---|---|
| Métrica de paridade (F1) | escolher a métrica | antes da Fase 1 |
| Piso/teto e amortecimento (F2/Q3) | escolher a regra | antes da Fase 1 |
| Camadas por cima (X4) | dentro ou fora da régua | antes da Fase 2 |
| Glitchtama dá ponto? | sim/não | Fase 3 |
| Q6, Q7, Q8, Q9 | ver o pacote de checkpoint | Q8/Q9 antes da Fase 3; Q6/Q7 antes da 5 |
| docs/squad-alpha-runs faz o docsManual falhar no checkout D:\ (lido, não executado) | exceção no guard ou mover o workdir | quando quiser |

## Decisão do checkpoint (04/10/2026): CONTINUAR
F1 → win rate no espelho ±5pp · F2 → piso 3 + HP por rodízio (a cada 4º dia) · X4 → fora da régua, ±25% · Q8 regra sem IA · Q9 retroativo por `totalPerfectDays`. Defaults: Q6/Q7/Glitchtama/desempate (ver contexto §2.3).
