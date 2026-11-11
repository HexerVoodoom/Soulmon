# QA rodada 1 (11/11/2026): o que entrou na main em 10-11/11

Escopo: PRs #757, #759, #761, #762, #764, #765, #766, #767, #769-#782. Base lida: `origin/main` em `b10cc131e`.

## Prova rodada (worktree em E:, relógio local 21:45 BRT = 00:45 UTC, ou seja, logo depois da virada UTC)

- `tsc --noEmit` (app), `tsc -p tsconfig.server.json`, `tsc -p desktop/tsconfig.json`: os três limpos.
- vitest em 3 lotes de 12 arquivos (tudo que os PRs do escopo criaram ou mexeram, servidor + app + render): 36 arquivos, 412 testes, verdes.
- `community.duel.qa458.test.js` com o relógio forçado em `2026-11-11T00:02Z`: 1 falha reproduzida (`expected 2 to be 1`). Corrigido no PR deste arquivo.
- CI "Android APK Build" da main: VERMELHO desde #764 (`0827056a7`) e em `b10cc131e`. Corrigido em PR próprio.

## Críticos / altos (com PR)

| # | Achado | Onde | PR |
|---|---|---|---|
| C1 | Build Android quebrado na main: `androidx.health.connect:connect-client:1.1.0` exige AGP 8.9.1 (o repo usa 8.2.1); `checkDebugAarMetadata` falha. Sem APK/AAB, o beta11 não sai. | `android/app/build.gradle:108` | #790 |
| A1 | Teste frágil: o caso "duelo que ficou aberto" recua `pending.at` em 5 min + 1 s; nos primeiros ~5 min do dia UTC esse instante cai no dia anterior e `refundOpenDuel` (corretamente) não devolve a partida. O código está certo; o teste dependia do relógio. | `functions/api/community.duel.qa458.test.js` | #789 (este) |
| A2 | Custo: `sparOpponents` (Treino) varre até 120 perfis + Vínculo (~240 leituras de KV) por GET e estava no teto LEVE (120/min/IP): ~29 mil leituras/min por IP. | `functions/api/community.js:130` | #791 |

## Médios (lista, sem PR)

1. **Feira: o servidor marca "comprado" antes de o app debitar.** `guildFeiraLojaBuy` grava a compra (`functions/api/guild.js:767`) e só depois o app tenta `applyFeiraLojaBuy`. Se o app recusar (prato com efeito de combate pago só com Bit de Crédito = `not-earned`; demo), o item some da oferta sem cobrança. A folha confere `points` (saldo total), não `earnedBits` (`src/components/guild/FeiraLojaSheet.tsx:96`). Conserto barato: pré-checar `applyFeiraLojaBuy(getState(), offer).refused` antes do `api.buy`.
2. **Feira: material no teto (`MATERIAL_CAP`) cobra e não entrega.** `src/utils/feiraLoja.ts:135` faz `Math.min(MATERIAL_CAP, had + 1)` depois de já ter debitado. Recusar com `cap` antes do servidor.
3. **Treino: dia do jogador por fuso do APARELHO, não por `playerDayTz`.** `src/utils/community.ts:242` manda `Intl` zone/offset; o resto do jogo usa a âncora `gameState.playerDayTz`. Quem viaja ou troca o fuso vê tickets/Honra de outro "dia". Além disso, `zone/off` é do cliente: alternar `off` entre +14 h e -14 h dá até 2-3 "dias" no mesmo instante (até 2-3x o teto de 20 de Honra e de tickets). O padrão é o mesmo dos presentes; fechar exige gravar o fuso no servidor.
4. **Treino: ticket extra é concedido antes de cobrar.** `sparBuyTicket` conta no servidor e o app cobra depois (`src/components/TournamentPage.tsx:558-561`); se a cobrança recusar (Bits ganhos mudaram entre o toque e a resposta) ou se a rota for chamada direto, o extra sai de graça. Impacto baixo (extra não rende Honra), mas a mensagem "Bits insuficientes" aparece com o extra já dado.
5. **Treino: desistir não custa partida e a semente já está com o cliente.** `functions/api/community.js:1250`: um cliente editado simula a luta com a semente do `sparStart` e desiste só das que perderia, fechando as 20 partidas com Honra em ~100% de vitórias. O teto de 20/dia limita o ganho (de ~15 para 20).
6. **Doação do clã: "uma por dia" só olha o último dia gravado.** `functions/api/_casa.js:105`: alternar `dayKey` entre D e D+1 (os dois aceitos pelo `diaDoJogador`, janela de +-1 dia) doa de novo a cada troca. Custa Bits do próprio jogador; infla o tesouro do clã acima do desenho do preço do Buff.
7. **Release beta11: Health Connect pede declaração no Play Console.** O AAB com `READ_STEPS` só é liberado depois da declaração aprovada (`docs/PASSOS-HEALTH-CONNECT-LANCAMENTO.md` §3) e de reenviar a justificativa de "Apps de saúde". Bloqueia a publicação, não o código.

## Baixos

1. `FeiraLojaSheet.buyOther` não tem trava de ocupado: dois toques em Confirmar fazem a 2ª chamada voltar 409 e mostrar "levaram" logo depois do sucesso.
2. `feiraEvento` e `feiraLoja` podem estar os dois preenchidos (de voltas diferentes no mesmo dia) e as duas folhas renderizam na mesma vaga (`src/App.tsx:10105` e `:10120`).
3. Card "Home" do Perfil usa o sprite PADRÃO do estágio (`src/components/SettingsPage.tsx:356`), não a arte gerada do jogador.
4. Tesouro do clã = doações dos membros ATUAIS menos o gasto (`functions/api/_buffsCla.js:70`): quem sai leva a doação dele, e o tesouro pode zerar depois de um Buff comprado com aquela doação.
5. Buff do clã fica no `localStorage` (`soulmon-clan-buffs`) até vencer; sair do clã por outro aparelho não limpa neste.
6. Testes que calculam `new Date().toISOString().slice(0,10)` antes das chamadas (`community.treino.test.js`, `community.treino.tickets.test.js`, `feiraLoja.test.js`, `review-soulmon.test.js`) ainda podem falhar se o dia UTC virar no meio do teste (janela de milissegundos).
7. `modalDepth`: qualquer `aria-modal="true"` montado e invisível deixaria o Voltar esmaecido para sempre. Hoje os 36 usos são condicionais (lido no código, não testado em tela).
8. Cliente antigo (beta10, sem a UI de tickets) que passa das 20 partidas do Treino recebe 409 e mostra o texto cru do servidor (`no tickets`).
9. Textos ainda dizem "Hall" em alguns lugares depois do #767 (só o rótulo da área foi trocado); ids e chaves não mudaram (correto).

## Não verificado

- Telas no aparelho (Treino, Feira, cards do Perfil, Voltar esmaecido, widget com Z/fundo/molduras, convite de passos): sem aparelho nem emulador nesta rodada.
- Health Connect em aparelho real (diálogo, leitura, revogação).
- Duas abas/dois aparelhos de verdade: só leitura do código (o lock do duelo é por isolate; KV não é atômico).
