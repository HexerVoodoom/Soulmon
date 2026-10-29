# Pedidos do dono — sessão de 27–28/10/2026 (registro mestre)

> Fonte: conversa do dono com o Claude. Este arquivo existe para que NADA do que foi pedido se perca: cada linha tem estado, onde está o trabalho e o que falta. Atualizar ao fechar cada item. Regras de jogo decididas vão também para `docs/REGISTRO-DE-DECISOES.md`; o que foi ADIADO vai para `docs/BACKLOG-PRODUTO.md`.

Legenda: ✅ na branch de versão (`versao/1.3.0-beta3`) · 🔧 em andamento (worktree) · ⏸ parado/aguardando · 🗂 backlog.

## A. Biblioteca, elementos, eficiência

| # | Pedido | Estado | Onde |
|---|---|---|---|
| A1 | Biblioteca com abas Encontrados / Selvagem / Desgarrado / Elemento; bestiário sai das Estatísticas | ✅ | `LibraryPage.tsx`, `BestiaryCollection.tsx`, `ElementDex.tsx` |
| A2 | Aba Elemento: todos os elementos, "?" sem nome, desbloqueia ao derrotar quem tem o elemento; modal com ícone grande, composição, forte/fraco contra | ✅ | `utils/elementDex.ts`, `defeatedElements` no save (começa vazio) |
| A3 | "?" trancado com círculo preto de baixa opacidade atrás | ✅ | `.sm-dex-lock` em `index.css` |
| A4 | "Forte/fraco" → "Super eficiente / Pouco eficiente" (EN: Super effective / Not very effective) | ✅ | `games/ElementAdvantageBadge.tsx`, `pveTags.ts` |
| A5 | Elemento passa a valer no dano: Arena (já valia), Combina 3 e Guerra de Guildas a ±0,5; Torneio/Duelo ranqueado neutro | ✅ | REGISTRO §177, `_duel.js`/`duel.ts` (`elementScale`) |
| A6 | Desgarrados em minigames/desafios maiores onde só havia pessoas (Arena: 1 dos 3 desafios; Torneio sem par) | ✅ | `utils/strayFoes.ts` |

## B. Telas de resultado (Fenda, Arena, minigames)

| # | Pedido | Estado | Onde |
|---|---|---|---|
| B1 | Novo padrão de resultado único, lúdico, com identidade Soulmon (Proposta D, benchmark Duolingo/gachas) | ✅ | `games/ResultScreen.tsx`, `product/resultado-padrao/` |
| B2 | Visor cresce no espaço vazio; célula Recorde some na 1ª partida; "abrem"; aba "Encontrados" inteira | ✅ | commit `3aff943fa` |
| B3 | Fenda: "Camadas limpas" grande, um ícone de escada por camada em pop-in (até 10, depois ×N); "Mais fundo até hoje" em destaque e fora da lista; energia com ícone; remover "caminho lacrado" e "corações intactos" (só se houver dano); só o texto do Vínculo 8 fica; poção de vida = ícone `item-heart` + "Item de recuperar vida" | 🔧 | worktree `E:\soulmon-wt-rewards` |
| B4 | Itens com ícone em pop-in + som; Bits com contador girando (caça-níquel) + som; padronizar no app inteiro | 🔧 | idem |
| B5 | Selo/medalha "novo recorde" gerado no ChatGPT | ⏸ | `ASSETS-A-GERAR.md` §20; dono libera o PC; provisório = troféu dourado |

## C. Home e Configurações

| # | Pedido | Estado | Onde |
|---|---|---|---|
| C1 | Ícone do mapa alinhado ao nome do avatar (regressão) | ✅ | `.sm2-hud` com `env(safe-area-inset-top)`; medido com inset simulado de 32px; falta conferir em aparelho |
| C2 | Botão "Reportar bug" embaixo do Feedback, manda e-mail | ✅ | `FeedbackLink.tsx` (`BugReportRow`), Configurações > Ajuda |

## D. Arena livre

| # | Pedido | Estado | Onde |
|---|---|---|---|
| D1 | Só aparecia Sombra: sorteio geral sem tema (causa: filtro do tema de 27/10) | 🔧 | worktree `E:\soulmon-wt-arena` |
| D2 | Reroll dos 3 cards: 3 grátis/dia, depois Bits (nunca Créditos) | 🔧 | idem |
| D3 | Cenário sempre de arena (2 arenas do Torneio, sorteio por run); §19 sai da fila | 🔧 | idem |

## E. Feira: Mistério, chefe do clã, desafio

Plano: `docs/PLANO-FEIRA-CHEFE.md` (decisões do dono no §11). Entra na `main` DESLIGADO; o dono manda ligar.

| # | Item | Estado |
|---|---|---|
| E1 | Servidor do chefe, ataque, resgate, trilha/desafio, vista segura (F-01..F-07) | 🔧 `E:\soulmon-wt-feira-srv` |
| E2 | Modo chefe no `BattleStage` + tela do chefe + resultado (F-08, parte de F-09) | 🔧 `E:\soulmon-wt-feira-ui` |
| E3 | Cliente (efeito de volta, sheet, replay), trilha no cliente, i18n, REGISTRO/CLAUDE.md (F-09..F-13) | 🗂 depende de E1/E2 |
| E4 | Verificação final + calibração em produção (F-14) | 🗂 |

## F. Backlog (ditado, nada construído)

| # | Item | Estado | Onde |
|---|---|---|---|
| F1 | Essências dos elementos: todo inimigo derrotado dropa a essência do próprio elemento (Pesadelo = essência de pesadelo; chefes da Feira dropam mais), só coletar; Laboratório > Arquivo, seção abaixo dos Sonhos, só quantidade > 0, toque = tooltip com nome | 🗂 | `BACKLOG-PRODUTO.md`; perguntas abertas lá |
| F2 | Gerar no ChatGPT quando o dono liberar o PC: selo de recorde e demais itens de `ASSETS-A-GERAR.md` | ⏸ | memória `selo-recorde-chatgpt-pausado` |

## G. Regras de trabalho pedidas nesta sessão

- Planejar primeiro, dúvidas SEMPRE em modal, executar em Sonnet/Haiku (Opus só orquestra).
- Fazer em paralelo o que não colide; o que estiver pronto, commit + merge na `main`.
- A `main` é produção com testadores reais: tudo novo de regra vai desligado/testado; portões antes de mergear.
- Sons desta sessão não foram ouvidos (o Claude não escuta): o dono precisa testar.

## 29/10/2026

Legenda igual à da sessão anterior.

| # | Pedido | Estado | Onde |
|---|---|---|---|
| H1 | Zona da Forja no Mapa: gerada no ChatGPT e instalada | ✅ | commit `4eb0131d5` |
| H2 | D-03 textos longos: encurtar textos que estouravam a tela | 🔧 | commit `9b35501c7`: 61 textos encurtados em 21 arquivos. Faltam: Guia/Ajuda, focoTecnicas, i18n, BetaClosedScreen, StepsCard, EvolutionPath, TalentTree |
| H3 | Fundo do Hall refeito com temas trocados: sol/Clan Hall no lote grande de baixo, feira no lote de cima à esquerda | ✅ | commit `5fb7ab409` |
| H4 | Pesadelo no sono automático: sono auto passa a contar desde o início da janela | ✅ | commit `723b2fd9c`. Pendente decisão do dono: noite com app fechado a noite toda não registra (sem pesadelo) |
| H5 | Especial: DoT não é mais bloqueado por escudo levantado depois do cast | ✅ | commit `063a69237` |
| H6 | Recompensas visíveis antes/depois de toda ação (RewardPreview). Regra: valor fixo = "+N", faixa = "até N" | 🔧 | commits `a50ccd02a`, `a6ff9e601`, `087dc2def` |
| H7 | APK alfa conflita com a versão da Play instalada | ⏸ | dono aprova por prints |
