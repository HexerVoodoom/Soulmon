# QA + segurança, rodada 2 (11/11/2026): o que mudou depois da rodada 1

Escopo: #792 (Feira em duas fases, Treino com `playerDayTz`/`sparTz`, ticket extra em fases, `sparStart` gasta partida), #779/#785 (Buffs do
clã e doação), #783 (custos da Hexsmith), #764/#784 (passos pelo Health Connect), #777/#782 (mix de ataques), #769/#771/#786 (Treino e
tickets). Base: `origin/main` em `3bc2a928f`. Nada testado contra produção; nenhum dado de produção tocado.

## Prova rodada

- Base, antes de qualquer mudança: 14 arquivos do escopo (servidor + app), 150 testes, verdes.
- Relógio forçado (`vi.useFakeTimers({ toFake: ['Date'] })`) em 7 instantes de 11/11 (00:00:20Z, 02:59:50Z, 09:59:50Z, 10:00:20Z,
  13:59:50Z, 14:00:20Z, 23:59:58Z) sobre `community.treino`, `community.treino.tickets`, `guild.casa`, `guild.buffs`, `feiraLoja`:
  86 testes, verdes nos 7. Os testes do #792 com fuso ±14 h não dependem da hora.
- Reprodução do R2-T1 e do R2-T2 ANTES da correção: 2 falhas (`expected 200 to be 409`; `expected 1791720000000 to be 1794398400000`).
  Saída em `test-run.log`.
- Depois da correção: `tsc` (app, servidor, desktop) limpos; suíte inteira 1313 arquivos / 15663 testes verdes e 1 vermelho fora do
  escopo (`match3Combat.test.ts` "balanço", timeout de 15 s com a suíte em paralelo; isolado passa, 34/34, mas leva 16,6 s: está no
  limite do orçamento e pode piscar no CI). Escopo + arquivos tocados: 17 arquivos, 148 testes, verdes. Tudo em `test-run.log`.

## Corrigidos neste PR (com teste nomeado)

| # | Achado | Onde | Teste |
|---|---|---|---|
| R2-T1 (médio) | **Pedido do Treino sem fuso não prendia a âncora.** `fixarTzTreino` devolvia `{}` (UTC) sem gravar; o 1º fuso explícito virava a âncora depois. Jogar as 20 partidas sem `zone`/`off` e mandar `off: +14 h` abria um 2º "dia" no mesmo instante: +20 partidas e +20 de Honra. Agora pedido sem fuso prende o UTC (o app sempre manda `off`). | `functions/api/_treino.js` `fixarTzTreino` | `community.treino.qa2.test.js` R2-T1 |
| R2-T2 (baixo) | **A âncora vencia no dia 60 em conta ativa.** O TTL de `sparTz:` só contava da gravação; quem nunca troca de fuso perdia a âncora e o truque do R2-T1 voltava. Agora a âncora com mais de 30 dias é regravada com o mesmo valor (no máximo 1 escrita por mês por conta). | idem | R2-T2 (2 casos) |
| R2-C1 (baixo) | **Ticket extra pago e perdido numa queda de rede.** A confirmação roda DEPOIS de o app cobrar os 30 Bits; uma falha de rede ali mostrava "toque em atualizar a lista", mas atualizar não confirma nada e a reserva vencia em 2 min. Agora a confirmação repete com recuo só em falha de rede (concede uma vez: a reserva é apagada no 1º sucesso) e, se falhar de vez, relê o contador. | `src/utils/community.ts` `confirmSparTicketComRetry`, `TournamentPage.tsx` | `community.sparConfirm.qa2.test.ts` |
| — | Comentário do `sparMatch` dizia "oponente sumiu: sem custo"; desde o #792 a partida já foi gasta no `sparStart`. Corrigido e explicado por que NÃO devolver (reabriria a desistência grátis com uma 2ª conta que desliga o PvP). | `functions/api/community.js` | — |

O teste antigo "GET sparOpponents não grava nada" passou a aceitar a chave `sparTz:` (gravada uma vez, a 2ª leitura não regrava), o mesmo
ajuste que o #792 já tinha feito no teste de tickets.

## Decisão de design (só relato)

1. **O ticket extra em duas fases não protege contra cliente editado.** O contrato antigo (sem `phase`) continua concedendo direto, e
   `reserve` → `confirm` também não exige cobrança nenhuma no servidor. As duas fases consertam o caso honesto (recusa local depois do
   ok), não o abuso. Como o APK carrega o app do servidor (`server.url`), não existe cliente antigo de verdade; aposentar o caminho sem
   `phase` é seguro, mas é escolha do dono (o #792 manteve de propósito). Limite real hoje: 3 extras/dia, sem Honra.
2. **`coopBuffs:<gid>` vence e devolve o tesouro já gasto.** O registro dos Buffs (`gasto`) tem TTL de 120 dias contado da última
   COMPRA (`_buffsCla.js`), enquanto as doações (`coopCasa:<gid>:<save>`) são regravadas a cada doação. Um clã que compra um Buff e
   fica 120 dias sem comprar outro volta a ter `gasto = 0`: tudo o que já foi gasto reaparece no tesouro. Conserto possível: sem TTL na
   chave dos Buffs, ou renovar o TTL na vista; os dois mexem em escrita de chave do clã (corrida com a compra do anfitrião) e por isso
   ficaram para decisão.
3. **Doação com `dayKey` adiantado (#785).** Com "dia estritamente mais novo", mandar D+1 logo depois de D doa 2x UMA vez; depois o
   jogador fica preso no D+1 (o dia real seguinte é recusado). Sem ganho contínuo. Efeito colateral honesto: quem viaja para oeste e
   "volta" um dia perde a doação desse dia.
4. **A semente do Treino está com o cliente e os toques (`taps`) mexem na luta.** Desistir agora custa partida (#792), mas um cliente
   editado ainda pode simular com a semente e escolher o ritmo de toques que vence (limitado por `CHEER.tapsCapPerBucket`). Mesmo
   desenho do duelo ranqueado; fechar exige a semente só depois dos toques.
5. **Contadores sem compare-and-set** (`spendSparMatch` no `sparStart`, `buySparTicket` no `confirm`, `doarBits`, `comprarBuff`): a M6
   da rodada 1 segue valendo. O `withDuelLock` só serializa dentro do isolate; duas confirmações por colos diferentes dão 2 extras.

## Lido e sem achado

- `guildBuffBuy`: só o anfitrião, preço/saldo/duração do servidor, `opId` idempotente; compra paralela perde uma das duas inteira
  (último escritor), sem duplicar Buff nem desconto.
- `doarBits` #785: comparação ISO em `YYYY-MM-DD` (o `diaDoJogador` normaliza o formato `toDateString`, então não dá para alternar
  formatos e furar a ordem).
- Hexsmith #783: custo novo no servidor (`HEX_COSTS`) e paridade com o app; a forja lê o save GRAVADO.
- Mix de ataques #782: `escolaDoSimulado` muda só a forma; a família do especial do simulado continua `direct` (conferido em
  `_duel.js` `loadDuelSide`), então o resultado da luta não muda.
- Health Connect #764/#784: só leitura do total do dia no aparelho; nada vai ao servidor; passo não pontua sozinho.
- Autorização das rotas novas (`sparBuyTicket`, `sparStart`, `sparMatch`, `guildDonate`, `guildBuffBuy`, `hexFair`): todas exigem o dono
  do `id`; nenhuma age por outro jogador.

## Baixos (sem PR)

1. `FeiraLojaSheet.appRecusa` traduz toda recusa que não é `cap` como "Bits insuficientes"; `already-owned` deveria ser `loja.taken`.
2. `sparMatch` quando o oponente sai do PvP entre a abertura e o resultado: 404, a partida fica gasta (correto, ver acima), mas a tela
   mostra só o erro.

## Não verificado

- Telas no aparelho (Treino com ticket extra, Feira, Buffs), Health Connect em aparelho real.
- Corrida real entre colos/isolates (só leitura do código; o fake KV é síncrono).
