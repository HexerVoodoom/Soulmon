# Guilda — notas da implementação do cliente, fatia A (29/09/2026)

Fatia de cliente: `src/utils/community.ts` (bloco Guilda), `src/utils/guildCopy.ts`, `src/utils/guildRules.ts`,
`src/components/guild/GuildSheet.tsx` (a tela; `CoopPanel.tsx` virou re-export), `AreaSheet.tsx` (chrome compartilhado),
NPC/lotes (`areaNpcVoice.ts`, `areaSheetCopy.ts`).

## Desvios e escolhas registradas

1. **A barra "N de M nesta semana" saiu.** `progress`/`target` chegam no corpo e `sanitizeGuildView` os descarta. Motivos: (a) não há
   string dela nas 149 chaves do `NARRATIVA-COPY-GUILDA.md`; (b) é uma meta COM estado de "não bateu" — o oposto do Bosque, que só
   cresce (02-psicologia §3.3); (c) com 5+ membros é um número ao lado da contagem, o "N de M" que o guarda vetou. Consequência: o
   pedido de `aria-valuetext` na barra ficou sem objeto (a barra não existe); há teste exigindo a ausência de `progressbar`.
   Se o dono quiser a barra de volta, é decisão de produto (nova chave de copy + parecer do guarda), não retrabalho de UI.
2. **Estado "meta ainda não cumprida" é SILÊNCIO** (linha `guild.bosque.fio.ainda`): a frase "Vale quando você cumprir a sua própria
   meta…" do CoopPanel foi removida. Sem a meta, nada é desenhado (nem título de seção).
3. **Três chaves fora das 149** (marcadas `PENDENTE` em `guildCopy.ts`; o `soulmon-narrative-critic` ainda não as viu):
   `guild.erro.tentar` ("Tentar de novo" / "Try again", botão da tela de carga que falhou), `guild.roda.alguem` ("Alguém"/"Someone" —
   já existia no CoopPanel) e `guild.roda.voce` ("· você"/"· you" — idem).
4. **`guild.erro.demo` (demo → `UnlockNudge`) NÃO foi implementada.** O `AreaView` não recebe `accountTier` na prop `guild`; o demo sem
   login cai no 401 (`guild.erro.semLogin`, sem formulário). Para o nudge é preciso passar `accountTier` + `onUnlock` até a folha
   (o `App` já os tem) e decidir o motivo de telemetria. Fica para a fatia B.
5. **Lote da Arena**: rótulo virou "Feira/Fair" e a fala do NPC é `guild.npc.feira`, mas o **id continua `'guilda'`** e a folha que
   abre continua sendo o Salão — a Feira em si é a fatia B (WPG-10 troca id, arte do lote, chave do NPC e `areaLotsNovos.test.ts`
   juntos). **Risco visível até lá:** quem toca "Feira" na Arena vê a roda, e a Marla fala de "algo que chega da névoa". Se isso
   incomodar antes da fatia B, reverter é uma linha em `areaSheetCopy.ts` e uma em `areaNpcVoice.ts`.
6. **`AreaSheet` (chrome compartilhado) foi tocado**: usa `useDialogA11y` (trap de Tab, fundo `inert`, foco devolvido ao lote, Escape) e
   o "Fechar" tem 44×44. Vale para TODAS as folhas do mapa, não só a Guilda — os testes de `nav/` continuam verdes.
7. **`OfflineSeal`** em área desce para `topOffset = 64` (baixo da barra do topo) — só o `App` mudou, o componente não.
8. **`CoopPanel.render.test.tsx` foi apagado**: a tela que ele testava é outra; a cobertura migrou para `GuildSheet.render.test.tsx`
   (52 casos). `CoopPanel.tsx` fica só como re-export porque a aba "Grupo" da `LibraryPage` ainda o importa.
9. **Salas**: `SalaBosque` (só o fio e o agregado, sem visor), `SalaRoda` e `SalaMural` (placeholder que NÃO desenha nada). Gestos,
   visor do Bosque, palco de criaturas, Mural e a Feira são a fatia B.
10. **Pet fala (`guild.retorno.pet`, `guild.bosque.fio.pet`, `guild.entrar.boasvindas.pet`)**: não plugadas — `speak()` mora no
    `App`/`CompanionHUD` e a folha não tem o canal. Fatia B (ou WPG-8 completo).

## Pedidos ao backend (nenhuma mudança de servidor foi feita por mim)

- Nenhuma obrigatória para a fatia A. Observações: (a) `guildCheckin` sem `dayKey` cai no dia UTC — o cliente sempre envia; (b) o 409
  `already in a guild` do **join** vem SEM a vista (só o do create traz) — o cliente recarrega com `getGuild`; se o servidor passar a
  mandar a vista também no join, o round-trip some; (c) `members[].id` e `pid` são iguais hoje; o cliente lê só `id`.

## O que a régua trava (e onde)

- `src/components/guild/guildSemCobranca.contract.test.ts` — vocabulário vetado (PT+EN), zero dígito literal, sem `{n}` no agregado,
  fonte dos componentes sem literal vetado, sem `progress/target`, sem `.sort()`, presença só de `apareceuHoje === true`.
- `src/utils/guildNoSave.contract.test.ts` — AST: nenhum campo de guilda em `GameState`, no máximo as 2 chaves de conveniência em
  `storageKeys.ts` (hoje zero), cliente da guilda sem `localStorage`/`setGameState`.
- `src/utils/guildRules.parity.test.ts` — teto 12, presença 4, nome 24, código 8 e o alfabeto lidos do fonte de `_coop.js`.

## Achados de QA fechados (números do `L1-experiencia.md` / `L1-codigo.md`)

L1-experiencia: **#4** (nome longo: `overflow-wrap: anywhere` + `min-width: 0`) · **#10** (409 já em outra mostra a roda e a saída) ·
**#14** ("· você" irmão do nome truncável) · **#15** ("Sair" visível sem rolar com 4 membros: medido, `scrollH 437` × `clientH 423`,
o botão fecha dentro da área — só a nota de baixo passa 14 px) · **#16** (falha de carga ≠ sem roda) · **#22** (selo "SEM SINAL"
desce para 64 px em área) · **#24** (`useDialogA11y` na `AreaSheet`: trap, `inert`, foco devolvido; foco não cai em `body` depois de
firmar/sair) · **#25** (fechar 44×44) · **#11 / #23** (colisão e rede têm copy própria) · **#7** não fechado (dica dos 8 caracteres).
L1-codigo: **MÉDIO-3** (401) · **MÉDIO-4** (erro de carga) · **MÉDIO-5** (erros com tradução, `no group` → volta ao começo) ·
**MÉDIO-6** (refetch no `visibilitychange`) · **BAIXO-1/2** (timer e setState após unmount) · **BAIXO-3** (região `role=status` sempre
montada) · **BAIXO-5** (campo de código só com o alfabeto) · **ALTO-2, lado cliente** (trava síncrona do duplo toque).
**BAIXO-4**: o `aria-valuetext` ficou sem objeto (a barra saiu, ver desvio 1); o "Criar" deixou de ser `<label>` de título.

## Não fechado

- **12 membros rolam** (24 nomes × 32 px passam da área de 423 px): "Sair" fica abaixo da dobra nesse tamanho. Solução possível na
  fatia B (palco/Bosque tomam o topo, a lista pode virar grade de nomes); não inventei layout novo sem wireframe GUI-07.
- **#31** (a folha termina 40 px antes do fim da tela) e o **#7** ficam com o design.
- `docs/manual/06-REFERENCIA` sem entrada para `guildCopy.ts`/`guildRules.ts`, e `00-MAPA.md` sem este arquivo: o
  `docsManual.contract.test.ts` (a, c) reprova até o `doc-mantenedor` (`/manter-docs`) rodar. Não toquei `docs/manual/`.

## Verificação visual

`docs/reviews/guilda/qa/shots-fatia-A/` (12 PNG, 390×844, `vite` dev + Playwright, `/api/guild` mockado por `page.route`, save
semeado por `addInitScript`): vazio, 4 membros anfitrião, 12 + agregado, 5 sem fio (silêncio), nome longo, erro de carga, 401,
código inválido, offline (aborta a rede), ajustes do anfitrião, e o par en-dark. Não rodei `npm run build` (o `dist/` não mudou).
Não capturei o botão "Firmar meu fio": o `metaDoDiaCumprida` vem do save do jogo e semear uma meta cumprida pelo `localStorage`
não é confiável; ele está coberto por `GuildSheet.render.test.tsx`.

## Mutação (cópia em /tmp/mut, 16 mutantes, 16 mortos)

Presença em quem não veio · agregado com `{n}` · "faltam" na copy · `guildId` no `GameState` · chave de guilda em `storageKeys` ·
`sanitize` deixando presença com 5+ · `window.confirm` ao sair · falha de carga vira "sem roda" · `AreaSheet` sem o hook de a11y ·
teto do cliente ≠ servidor · sem trava síncrona do duplo toque · roda reordenada por presença · código aceitando 0/O/1/I ·
"· você" dentro do nome truncável · timer do "copiado" sem limpeza · `dayKey` não enviado. (O M11 sobreviveu na 1ª rodada — o teste
de duplo toque disparava dois cliques que o React já tinha desabilitado; passou a usar os dois no mesmo `act`.)

## Rodada L4 (29/09/2026) — o cliente depois do loop 3

Fecha `L3-codigo.md` (A1, A2, M1–M5, B1–B5), `L3-experiencia.md` (A1, M1–M6, B1–B9, L1 #7/#31) e `L3-copy-critica.md`.
Capturas em `shots-L4/` (13 PNG, 390×844, `vite preview` + Playwright, `/api/guild` mockado).

- **A1 (código):** `claimGuildReward` devolve `error.claim` no 409 (`sanitizeClaim`); `colher` credita por ele quando o recibo NÃO está
  em `hasClaimedReceipt` **e** este aparelho tentou antes (`markClaimAttempt`, marca `~semana` na mesma chave `soulmon-guild-claimed`).
  A exigência da tentativa é o que impede um aparelho B com tela velha de creditar em dobro. O direito é da pessoa: sem guilda, a folha
  pergunta `guildRewards` (`chaveDaFeira = 'sem-roda'`) e o cartão aparece no Salão e na Feira (e depois de sair).
- **A2:** `filaDeAvisos.contract.test.ts` lê a expressão `interstitial` do fonte e prova a ordem (3 mutantes: tirar, antes do check-in,
  depois do sonho — 3 mortos).
- **M1/M2 (fallback em memória):** só quando `writeJson` devolve `false` (quota/modo privado) — `groveLocal` (`reconhecido`) e
  `guildClaimLocal` (`memoria`). Com storage saudável nada muda. Resíduo declarado: sem storage, fechar e reabrir o app repete UMA cerimônia
  e esquece os recibos; dois aparelhos da mesma conta têm listas separadas e cada um credita o SEU save (o cloud save é último-a-gravar-vence).
- **M3 (Emblemas colhidos antes da adoção do save da nuvem): NÃO é real como descrito.** Evidência: `adoptCloudSave` só roda nos fluxos
  EXPLÍCITOS de login/restauração (`App.tsx`: link de login, `handleProtectProgress`, `onLoginWithEmail`, `onRestoreFromCloud`), sempre
  com `window.location.reload()` logo depois; não existe pull da nuvem no boot. Sem login a Guilda responde 401 (nada a colher), e o login
  re-deriva o `saveId` e adota o save ANTES de a folha poder colher. O que resta é o que já vale para todo progresso local (a adoção troca o
  save inteiro, por decisão de produto) e a janela de 3 s do debounce do cloud save numa restauração do mesmo id. Testes: crédito por recibo
  uma vez, 409 de outro aparelho não credita, storage cheio não duplica.
- **M4:** `guildCopyCore.ts` (novo) leva só o que a entrada usa (nomes dos estágios, `guild.marco.*`, nome/descrição da Concha);
  `guildCopy.ts` o espalha em `GUILD_COPY` (uma tabela só). `index-*.js`: 722 489 → 711 766 B. Ficam na entrada, e por quê: `groveLocal`
  (o App lê o marco pendente) e o cliente de `/api/guild` em `community.ts` (`App`/`GameStateContext` já importam o arquivo para
  presentes/perfil; separá-lo exigiria trocar o alvo de ~10 mocks).
- **M5:** `setGuildSheetOpen` (a folha se declara aberta) e o hook não consulta enquanto ela está montada.
- **B1/B2/B5:** cenário só com `mine.groveScenes` da vista que chegou (hook e folha); `grantGroveScenes` filtra `bg-guild-<estágio>` por conta
  própria; `trackGuildStageOnce`.
- **B3 (decidido, não mudado):** Escape e o botão fecham a cerimônia — ambos são gestos; o véu não tem `onClick`. **B4:** `usePrefersReducedMotion`
  dentro da cerimônia (a preferência acompanha a mudança). **B6:** a cerimônia é camada do `backStack`.
- **L1 #31:** a cena do lote passou a terminar no fim da tela (`AreaScene`: +40 px de altura e -40 px de margem; o `scrollHeight` do
  `<main>` não muda). **L1 #7:** dica escrita do tamanho do código e `aria-describedby` no Criar inerte.
- **Convite do 401:** o `UnlockNudge` da Guilda usa o motivo `shop` (o convite passivo). Um motivo próprio precisa de `reason` novo no
  `EVENT_SCHEMA` de `functions/api/metrics.js` (hoje 0..4) — é do servidor, fica para o dono.
- **Chaves PENDENTE (6):** `guild.criar.nome.dica`, `guild.entrar.codigo.dica`, `guild.erro.entrar`, `guild.feira.semroda`,
  `guild.aria.feira.ferido`, `guild.aria.feira.dissipado` (no `NARRATIVA-COPY-GUILDA.md`, total 165). `guild.erro.demo` já era do documento.
- **Mutação (`/tmp/mut`):** 35 mutantes nos pontos desta rodada, 35 mortos.

