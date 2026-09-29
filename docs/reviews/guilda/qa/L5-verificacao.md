# L5: verificação independente final da Guilda (QA de release)

29/09/2026 · branch `ccr-1aa8b7db-xk45mh` · HEAD verificado: `acbbbd6c` · o verificador não editou nenhum código de produto.

Este documento não se apoia nos relatórios dos agentes. Cada item foi relido no código (`arquivo` › SÍMBOLO) ou morto por mutação.

## Veredito

| Seção | Veredito |
|---|---|
| (1) Achados FATAL/ALTO/MÉDIO de L2-backend, L3-código, L3-experiência e L3-conformidade | **PRONTO COM RESSALVA**: nenhum FATAL ou ALTO está aberto. Há duas ressalvas, listadas abaixo. |
| (2) Portões | **PRONTO COM RESSALVA**: os três `tsc` estão limpos, o build está limpo e não há falha nova. O `docsManual` está vermelho e pertence a outro agente. |
| (3) Smoke real ponta a ponta | **PRONTO PARA MERGE** |
| (4) Regressões no resto do jogo | **PRONTO PARA MERGE** |
| **Geral** | **PRONTO COM RESSALVA**: não há bloqueio. |

As ressalvas:

1. **G1** (o fio usa a meta de coração) está registrado no `REGISTRO-DE-DECISOES.md` como "adotado por padrão, **aguarda o dono**". Não bloqueia, porque está registrado e é reversível por `META_DO_FIO`. O dono ainda precisa decidir.
2. **`docsManual.contract.test.ts`** reprova os itens (a) e (c): falta um doc no `00-MAPA` e faltam entradas em `06-REFERENCIA`. A correção está com o outro agente (`/manter-docs`) e precisa ficar verde antes do merge na `main`.

Há também um resíduo aceito: o chunk de entrada continua acima de 250 KB. É dívida anterior, registrada no `orcamentoDeBytes`, e a Guilda diminuiu o chunk em vez de aumentá-lo.

## (1) Achados × código × régua

### L2-backend

| Achado | Onde está fechado (código) | Teste que trava | Mutação |
|---|---|---|---|
| A1: dia fechado pelo fuso de quem chama | `_coop.js` › `atualizarBosque`: `hoje = min(hoje, utc−1)` | `guild.l2.test.js` "membro em UTC+9 …" | M3 morto |
| A2: sair e voltar infla o Bosque | `_coop.js` › `coopLeave` (`fiosAvulsos[d]` passa a ser uma lista de ids opacos) + `fecharDiasDoBosque` (`firmSet`/`roda` como `Set`) | `guild.l2.test.js` "100 voltas … valem 1/12", `guild.saida.test.js` "firmar, sair e voltar no MESMO dia" | M2 (teto `Math.min(1,…)`) **sobreviveu, e é EQUIVALENTE**: `roda ⊇ firmSet`, então `firmados ≤ n` por construção |
| A3: amplificação de escritas no KV | `_coop.js` › `gravarGrupo` (`semPrazoGravado`), `renovarPrazos`/`precisaRenovar` | `guild.l2.test.js` "nenhuma ação passa do teto medido", "o prazo … < 30 d", "vista de 12 … 1 leitura por membro" | — |
| A4: pid na vista | `guild.js` › `vistaDaGuilda` (`id: memberId`, `idOpacoDoMembro`) | `guild.l2.test.js` "nenhum pid sai; o id opaco não abre community?action=player" | M6 morto |
| M1: `progress` intradia | a vista não traz mais `progress`/`target` | `guild.l2.test.js` "progress/target não trafegam em nenhum tamanho" | — |
| M2: `guildJoin` grava um blob velho | `guild.js` › `guildJoin` (relê o grupo antes de gravar) | `guild.l2.test.js` "a cópia velha do blob … não volta" | — |
| M3: resgate entre POPs | recibo determinístico | `guild.recompensa.test.js` "dois POPs … MESMO recibo" | — |
| M4: chave de protótipo na telemetria | `metrics.js` › `sanitizeRecord` (`hasOwnProperty`) e o ramo `guild_*` (`Object.keys(regra)`) | suíte de `functions/api` | M12 morto |
| M5: `coopHit` sobrevive à exclusão | `_coop.js` › `coopLeave` apaga as 4 semanas em toda saída; o texto de `account.js` › `plan` foi corrigido | `guild.l2.test.js` "saída comum apaga coopHit …" | — |
| M6: mutantes sobreviventes | `ferido` / `Math.max` / fechamentos concorrentes | `guild.l2.test.js` "ferido exatamente na metade", "dois fechamentos simultâneos" | M1 e M10 mortos |

### L3-código

| Achado | Onde está fechado | Trava |
|---|---|---|
| A1: Emblemas somem quando o 409 chega depois de uma resposta perdida | `GuildSheet.tsx` › `colher`/`creditar` (`hasClaimedReceipt` + `markClaimAttempt`); `community.ts` › `sanitizeClaim` no 409 | testes de `src/components/guild` (M5 morto) e smoke §3 |
| A2: `groveMilestone` fora da fila | `App.tsx` › `const interstitial` | `filaDeAvisos.contract.test.ts` (M9 "depois do sonho" morto) |
| M1/M2: sem storage | `groveLocal` (`reconhecido`), `guildClaimLocal` (`memoria`) | testes de guild. Resíduo declarado nas notas L4 |
| M3: crédito antes da adoção do save | refutado com evidência em `impl-notas-front.md` (L4) | — |
| M4: JS de entrada | `guildCopyCore` separado | medido: `index-*.js` = **711 766 B** (era 722 087 no L3) |
| M5: consulta dupla | `useGroveWatch` pula a consulta com a folha aberta | testes de guild |

### L3-experiência

- **A1:** confirmado no preview. O 401 mostra "Entrar na conta", "Tentar de novo" e o `UnlockNudge` para o demo (`01-semconta-*`, PT claro e EN escuro).
- **M1–M6:** fechados em `521dd1cd`/`0527fa15` (Clareira no vazio, `guild.feira.ferido`, gestos no topo, "Do bosque" no topo do Background, Sair no rodapé, foco no gesto). Todos estão cobertos pelas capturas `shots-L4/`.

### L3-conformidade

| Achado | Estado |
|---|---|
| A-1: sair custa Emblemas | Fechado em `guild.js` › `direito` (a participação fica em `coopPart:<save>:<week>` e o desfecho em `coopRaidOk`). Trava: `guild.saida.test.js`. Mutação M4 morta. Smoke: sair e colher credita 2. |
| A-2: G1 sem registro | Registrado no `REGISTRO` como "aguarda o dono" (**ressalva 1**). |
| M-1: ausência no payload | Fechado: a vista só emite `cameToday: true`. Mutação M11 morta. |
| M-2: sair zera os dias | Fechado: `coopDias`. Trava: `guild.saida.test.js` "6 dias … o 7º libera". |
| M-3: progress/target | Removido. |
| M-4: docs | `STATUS` e plano foram atualizados. O `docsManual` segue vermelho (**ressalva 2**). |
| M-5: régua LV-G6 | `functions/api/guildReward.contract.test.js` existe (`20451061`). |

### Mutação (cópia em `/tmp/mut`, 12 mutantes: 11 mortos, 1 equivalente)

| Mutante | Resultado |
|---|---|
| M1: Bosque regride (`Math.max` → `p − 0.01`) | morto |
| M2: sem teto de 1/dia | sobreviveu, **equivalente** (ver A2 acima) |
| M3: fecha pelo dia de quem chama | morto |
| M4: direito exige estar na guilda | morto |
| M5: cliente credita sem checar o recibo | morto |
| M6: vista devolve o save/pid | morto |
| M7: sem limite de 1 golpe/dia | morto |
| M8: dia do jogador ±2 | morto |
| M9: `groveMilestone` depois do sonho | morto |
| M10: limiar de ferido `*3` | morto |
| M11: `cameToday: false` vaza | morto |
| M12: chave de protótipo na telemetria | morto |

## (2) Portões

| Portão | Resultado |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npx tsc -p tsconfig.server.json --noEmit` | exit 0 |
| `npx tsc -p desktop/tsconfig.json --noEmit` | exit 0 |
| `npx vitest run` | 423 arquivos, **5 falhas em 4 arquivos**: `orcamentoDeBytes` (conhecida), `convertToWebp` (conhecida), `docsManual` (a) e (c) (do outro agente), `SoulmonOnboarding.portao` (**flake**: isolado, passa 353/353) |
| `npm run build` | exit 0, em cópia `git archive HEAD` → `/tmp/l5build`. O repo não tocou `dist/`. Entrada `index-BwmI80DS.js` = 711 766 B |

Não há nenhuma falha nova ligada à Guilda.

Houve um alarme transitório. Durante a verificação, `guildSemCobranca.contract.test.ts` (L4, "chaves PENDENTE") ficou vermelho numa cópia intermediária. Isso aconteceu porque outro agente commitava `acbbbd6c` (6 chaves viraram FINAL) ao mesmo tempo. No HEAD `acbbbd6c`, a folha passa (2 arquivos, 353 testes verdes).

`git status` no fim: só este relatório e `shots-L5/`.

## (3) Smoke real

**Como foi rodado:** `vite preview` da cópia, com `xdg-open` falso e Playwright em 390×844. O save foi semeado por `addInitScript` e `/api/guild` foi mockado por `page.route`. Capturas (12 PNG) em `shots-L5/`.

| Passo | Resultado |
|---|---|
| Sem conta (401, demo) | Não é beco: "Entrar na conta", "Tentar de novo" e `UnlockNudge` (PT claro e EN escuro) |
| Criar | "Criar uma roda" faz `POST guildCreate` e a Clareira aparece (`02`) |
| Fio | O botão aparece com a meta cumprida e faz `POST guildThread`. A linha "fio de hoje" aparece (`03`) |
| Marco com check-in pendente | O **check-in abre primeiro** e a cerimônia espera (`04`). Sem check-in, a cerimônia "O bosque fechou copa." abre com a data e o gesto de continuar (`05`). O voltar do Android fecha a cerimônia |
| Feira | 1 golpe; o botão fica desabilitado; um 2º toque não gera um 2º `guildRaidHit` (`06`, PT e EN) |
| Resgate com a rede caindo | O 1º toque aborta a rede, aparece o erro e os Emblemas ficam em 10. O 2º toque credita +4 (fica em 14). Um 3º toque não credita de novo (14). **Os 4 Emblemas entram UMA vez** (`07`, `08`) |
| Sair e ainda colher | `guildLeave` roda e os Emblemas ficam intactos (5). Na Feira sem guilda, o cartão continua lá e colher dá 7 (`09`) |
| Voltar do Android | folha → cena → mapa → Home, uma camada por toque, sem sair do app |
| Erros de console/página | nenhum |

## (4) Regressões

**Testes:** nav/AreaView/AreaSheet, `filaDeAvisos`, guild (front e servidor) e shop: 26 arquivos, 740/740. Home, mercado e `ShopModal`: 3 arquivos, 46/46.

**Preview (PT claro e EN escuro):** todas as folhas das 6 áreas abrem, com `aria-modal`, fecham com Esc e devolvem o foco ao próprio lote. Nenhuma quebrou com a mudança de a11y do `AreaSheet`:

- Jogos: ppt
- Mercado: itens, decoração, background, conquistas
- Arena: torneio, duelo, feira
- Exploração: masmorra, dino
- Laboratório: evolução, pet, stats
- Hall: biblioteca, amigos, guilda

**Linhas vermelhas conferidas no código e no smoke:** o Bosque não regride; nada sai por pessoa (saveId, pid, dano, HP, contagem); não há estado de ausência; sair não custa nada; a recompensa é só Emblemas ou cosmético; não há push.
