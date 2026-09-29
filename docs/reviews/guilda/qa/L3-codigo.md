# L3 — Revisão de código adversarial: frontend e integração da Guilda

29/09/2026 · só leitura · branch `ccr-1aa8b7db-xk45mh`

**Portões:** `npx tsc --noEmit` saiu com código 0. `npx vitest run guild grove filaDeAvisos arena play` passou 39 arquivos e 880 testes.
**Bundle:** rodei `npx vite build` e depois `git checkout -- dist` + `git clean dist`, sem commitar nada de `dist/`.

**Contagem:** FATAL 0 · ALTO 2 · MÉDIO 5 · BAIXO 6

## ALTO

### A1 — Emblemas somem quando a resposta do resgate se perde
**Onde:** `GuildSheet.tsx` › `colher` e `community.ts` › `claimGuildReward`.

**Cenário:**
1. O servidor grava `coopClaimKey` e responde 200.
2. A resposta se perde (rede do APK caiu, timeout). A folha mostra `colherErro`.
3. A pessoa tenta de novo e recebe `409 already claimed`. O servidor manda `{receipt}` justamente para esse caso (`functions/api/guild.js`, ramo `already claimed`).
4. O cliente trata `alreadyClaimed` como SILÊNCIO (`tirar()`) e não credita nada.

A semana fica resgatada no servidor e zerada no save.

**Correção mínima:** no 409, se o `receipt` não estiver em `hasClaimedReceipt`, creditar. Para isso o 409 precisa trazer também `emblems`/`trophy`, que o servidor já tem no registro gravado. O recibo local continua barrando o segundo crédito no mesmo aparelho.

### A2 — O intersticial `groveMilestone` pode sair da fila sem nenhum teste falhar
**Onde:** `App.tsx`, `const interstitial`.

**Mutação:** troquei `grovePendente ? 'groveMilestone'` por `false ? …`. `filaDeAvisos.contract.test.ts` continuou com 16 de 16 verdes.

A posição declarada (depois do check-in, antes do sonho) não tem régua. É o mesmo padrão que o CLAUDE.md (DUAS FILAS) registra como já tendo custado caro.

**Correção mínima:** acrescentar ao contrato da fila a ordem `checkIn` → `groveMilestone` → `dream`, lida da expressão do fonte (como os outros guards de fiação fazem).

## MÉDIO

### M1 — Sem espaço no storage, a cerimônia volta a cada gesto
**Onde:** `groveLocal.ts` › `acknowledgeGroveMilestone`.

**Cenário:**
1. `writeJson` falha por quota cheia. `safeStorage` engole o erro e devolve `false`.
2. `emitGrove()` é disparado mesmo assim, o hook relê a memória e `pending` continua lá.
3. O intersticial z-300 reaparece na hora e prende a fila (relatório, sonho etc. atrás dele) enquanto a quota não for liberada.

**Correção:** manter em memória do módulo um "reconhecido nesta execução" (`Set` de `gid|index`) e consultá-lo em `grovePendente`. Outra opção: fazer `acknowledge` checar o retorno de `writeJson` e, se falhar, limpar o `pending` só em memória.

### M2 — O recibo local não segura sem storage
**Onde:** `guildClaimLocal.ts` › `rememberClaimedReceipt`.

O cabeçalho afirma: "falha de storage… pior caso o servidor recusa com 409". Mas o próprio motivo do recibo é que o KV pode devolver 200 duas vezes (sem CAS, o `selo` relido é da mesma região).

**Cenário:** em modo privado ou com quota cheia, o recibo não é gravado e dois toques em sequência podem creditar em dobro. O `busy.current` só cobre o toque concorrente, não o sequencial depois de um 200 duplicado.

**Correção:** guardar os recibos também num `Set` do módulo (vale na execução) e corrigir o comentário. Ele também contradiz o servidor, que diz "guardado no save".

### M3 — Crédito pode cair antes do save da nuvem ser adotado
**Onde:** `App.tsx` › `handleGuildClaimed` → `earnEmblems`.

**Cenário:** o crédito entra no save LOCAL. Se a pessoa resgatar logo ao abrir, antes do load/adoção do cloud save (aparelho novo), a adoção substitui o estado e os Emblemas somem. O recibo já está gravado, então não há novo crédito.

Mesma família: com dois aparelhos, o último a gravar vence (CLAUDE.md 🧮). Um crédito concedido pelo servidor não deveria depender disso.

**Correção:** desabilitar "colher" até o save da nuvem estar resolvido, ou reconciliar Emblemas da Guilda no servidor.

### M4 — O JS de entrada cresceu
**Onde:** imports estáticos de `App.tsx`: `GroveMilestoneCeremony`, `useGroveWatch`, `groveLocal`, `guildClaimLocal` (que puxa `shop`) e `guildCopy`.

**Medida:**
- O chunk de entrada `index-*.js` tem 722 087 B.
- `guild.feira`, `guild.marco`, `soulmon:grove` e `guildClaim` estão NELE.
- O dicionário `guildCopy.ts` inteiro (20,7 KB de fonte, incluindo toda a copy da Feira e do Salão) entra no primeiro carregamento, mesmo a folha sendo `lazy` em `AreaView.tsx`.

**Correção:** separar as poucas chaves `guild.marco.*` usadas pela Home e pela cerimônia num módulo pequeno. `GroveMilestoneCeremony` pode virar `lazy` (ele só monta com `pending`).

### M5 — Duas consultas `getGuild` por volta ao app com a folha aberta
**Onde:** `useGroveWatch` e `GuildSheet` (efeito `aoVoltar`).

Com a folha aberta, cada `visibilitychange` visível dispara `getGuild` duas vezes. Com o fecho da Feira, dispara também `getGuildRewards`. Não é loop, mas é o dobro de requisições.

Os dois caminhos também escrevem `observeGuildView` em ordem não determinística. É idempotente, então não corrompe nada.

**Correção:** o hook pula a consulta enquanto a folha estiver montada (flag de módulo), ou a folha emite o evento e o hook não consulta.

## BAIXO

- **B1 — cenários vindos de um valor editável.** `useGroveWatch`, efeito `[scenes]`, com `groveSceneIds(scenes)`: `scenes` vem do localStorage (editável até 5) e entrega `bg-guild-*` ao save sem o servidor confirmar. É cosmético, igual à postura dos Emblemas. Mesmo assim o caminho da folha filtra pelo servidor (`grantGuildScenes`) e o do hook não. Os ids são conhecidos e não duplicam (`grantGroveScenes` deduplica), então não há id desconhecido no save.
- **B2 — `grantGroveScenes` não filtra id por conta própria.** Hoje ele confia no chamador. Um filtro `id in PET_BACKGROUNDS` interno fecharia o caso.
- **B3 — a cerimônia tem duas saídas.** `RitualDialog onClose={onDone}` faz Esc ou toque no véu reconhecerem o marco, e o "espera o gesto" vira qualquer gesto. Isso é consistente com `MilestoneCeremony`, mas vale conferir se é a intenção.
- **B4 — `reducedMotion` lido no render.** No `App.tsx` ele é lido por `window.matchMedia` direto, não por `usePrefersReducedMotion`, e não reage a mudança durante a cerimônia. A folha já usa o hook.
- **B5 — `track` depois do unmount.** Em `useGroveWatch.olhar`, se o hook desmontar entre `getGuild` e `observeGuildView`, o `vivo` segura. Mas `observeGuildView` na folha roda num efeito de `[load]` e pode disparar `track('guild_stage')` em dobro (hook e folha na mesma volta), porque `tracked` só é persistido depois. A telemetria duplica, o jogo não.
- **B6 — `GameState` sem campo novo.** Verificado: a Guilda não acrescenta campo; só usa `ownedBackgrounds`, `ownedFurniture` e `emblems`, e a memória fica no localStorage. Desktop e widget não leem nada da Guilda, então nada quebra lá.

## Itens verificados que estão corretos

- Nenhum updater de `setGameState` tem efeito colateral. `grantGroveScenes`, `grantGuildTrophy` e `grantGuildScenes` são puros e idempotentes, e `onClaimed` é chamado fora de updater.
- A trava síncrona `busy.current` em `agir`/`colher` impede duplo toque em golpe, fio e resgate.
- `vivo`/`seq` evitam setState depois do unmount e resposta velha sobrescrevendo a nova.
- Os listeners têm cleanup, e não há timer em loop.
- `bg-guild-*` fica fora de `SHOP_BG_ACCENTS`: não é vendido, não entra no sorteio da masmorra e permanece no save ao sair (`forgetGrove` só apaga a memória do aparelho).
- A Concha só entra em `ownedFurniture` se `isGuildReward`.
- Nenhuma lambda nova foi passada a `CompanionHUD`.

## Invariantes sem teste (mutações feitas no fonte e revertidas na hora)

| Mutação | Resultado |
|---|---|
| Tirar `groveMilestone` da fila (`App.tsx`) | **SOBREVIVE** (A2) |
| `novo = true` no `colher` (sem dedupe de recibo) | morre (2 falhas) |
| Tirar `i > local.base` de `groveAvisoFor` | morre (2) |
| Tirar o filtro `isGuildReward` de `grantGuildTrophy` | morre (1) |
| Tirar a trava "só consulta com memória" do `useGroveWatch` | morre (4) |

**Sem teste nenhum:**
- crédito no 409 com recibo desconhecido (A1);
- reconhecimento da cerimônia com storage cheio (M1);
- recibo com storage indisponível (M2);
- a composição do chunk de entrada (M4).
