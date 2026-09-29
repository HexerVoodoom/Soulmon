# Guilda — notas da implementação de backend (WPG-1 + WPG-2, 29/09/2026)

Fatia de servidor: `functions/api/guild.js`, `_coop.js`, `_profile.js`, aliases em `community.js`, exportação em `account.js`.

## Desvios e escolhas registradas (as decisões G* não foram reabertas)

1. **G6 revisto (dia do jogador).** `_coop.js` › `diaDoJogador` aceita `playerDayKey` (`Mon Sep 29 2026`) ou `YYYY-MM-DD`, a no máximo ±1 do dia UTC; sem `dayKey` vale o dia UTC (cliente antigo). Registrado como override em `PLANO-GUILDA.md` §0.1. A presença dos OUTROS membros é comparada ao dia de quem pergunta — em fusos diferentes a borda pode divergir em até 1 dia; aceito.
2. **Ação de presença** chama-se `guildCheckin` (não `guildThread`): o fio cumulativo (`coopFio`, `bosqueProgress`) é WPG-3a. Quando entrar, `guildThread` substitui/absorve esta ação.
3. **Campos legados na vista.** `members[].id`, `members[].apareceuHoje` (só com ≤4), `progress`/`target` ficam porque o `CoopPanel` atual os lê pelos aliases. `progress` é soma SEMANAL do grupo (não é contagem por pessoa nem "de hoje"), mas com 5+ membros ele é um número — o guarda da linha vermelha pode querer faixa quando o cliente migrar (WPG-8). `line` (galho do sprite) NÃO foi implementado: o perfil não guarda a linha, e mandar `stage` é vetado (D-3).
4. **`threadedToday`** segue o contrato do guarda (29/09): `true` só com ≥5 membros e ≥1 presença hoje; senão `null`. Nunca número.
5. **G17(a)** implementado em `gravarGrupo`: com `bosqueProgress > 0` o blob E os dois índices (`coopOf`, `coopCode`) são gravados sem TTL — índice que expira com blob eterno reproduziria o "modo evapora". Hoje nenhum código grava `bosqueProgress` (WPG-3a).
6. **Criação concorrente** responde 409 `already in a guild` com a vista do grupo que venceu (idempotente para o cliente).
7. **Apelido do perfil** com contato não derruba o upsert (ele vai junto do cloud save): o apelido é descartado, fica o anterior, e a resposta leva `nameRejected: true`.
8. **Mutante equivalente**: acrescentar `guildRemove` a `GUILD_ACTIONS` sem handler cai em `unknown action` — não há expulsão a testar além de "ação desconhecida e ninguém sai".
9. **Rate limit**: `/api/guild` usa `GUILD_LIGHT` (60/min/IP, bucket `guild`); os aliases `coop*` seguem o LEVE de `community.js` (120/min). Travado por comportamento em `guild.invariantes.test.js`.
10. `PLANO-COOP.md` §3.4 (apagar grupo sem check-in por 4 semanas) e §4.2 (código de uso único) continuam sem implementação — fora desta fatia; decidir doc × código.

---

# Fatia 2 — WPG-3a, WPG-3c, gestos, WPG-6 (Bosque), WPG-7 (29/09/2026)

## Contrato novo da API (`/api/guild?action=…`, todas com `Authorization` do dono do `id`)

| Ação | Método | Corpo | Resposta | Erros |
|---|---|---|---|---|
| `guildThread` | POST | `{id, dayKey, kind:'fio', goal?:{done, heart, full}}` | `{ guild }` | 404 `no guild` · 400 `invalid day` · 400 `invalid kind` · 400 `goal not met` (só se `goal` vier e não cumprir a meta de CORAÇÃO) |
| `guildGesture` | POST | `{id, dayKey, kind:'aceno'\|'luz'\|'descanso'}` | `{ guild }` | 404 `no guild` · 400 `invalid kind` · 429 `daily limit` (mesmo gesto 2× no dia) |

Campos novos em `vistaDaGuilda` (em TODA ação que devolve vista, inclusive os aliases `coop*`):

- `mine.threadToday: boolean` — o PRÓPRIO fio de hoje.
- `mine.groveScenes: boolean` — o próprio chamador já firmou fio em ≥ `STAGE_UNLOCK_DAYS` (7) dias DISTINTOS; libera os `bg-guild-*` até o estágio atual.
- `mine.gesturesSent: ('aceno'|'luz'|'descanso')[]` — o que EU mandei hoje.
- `bosque: { stage: 'clareira'|'ramagem'|'copa'|'mata'|'bosque-antigo'|null, stageIndex: 0..5, perto: boolean, tide: { key: string, size: 'petala'|'corola'|'floracao'|null }, ornaments: [{ tide, size, day }] }` — sem progresso cru, sem "faltam N", sem razão, sem nada por pessoa.
- `gestures: (...)[]` — os TIPOS recebidos hoje de OUTROS membros, em lote, sem quem nem quantos.
- `threadedToday` segue `true|null`; o fio de hoje conta como presença (`presence[].cameToday` com ≤4).

## Escolhas registradas

1. **Fechamento do Bosque na leitura**: toda ação que devolve vista chama `atualizarBosque` (relê o blob antes de gravar e aplica o fechamento SOBRE a releitura — por isso o guarda de `progressDay` é redundante e o mutante que o remove é equivalente). O dia de hoje fica aberto; fecha-se até ontem.
2. **Fios de quem sai/é excluído**: os dias ainda não fechados viram `g.fiosAvulsos[day]` (contagem anônima) e entram nos DOIS lados da razão do dia. O que já foi fechado está em `bosqueProgress`, que só soma; `fecharDiasDoBosque` termina com um `max` defensivo (é ele que torna equivalente o mutante "dia vazio desce").
3. **Viajante** sem nada gravado: referência = `coopFio.lastDay`, senão `g.desde[save]` (gravado em criar/entrar), senão ativo (grupo antigo).
4. **META_DO_FIO = 'heart'** (G1). O fio segue sendo afirmação do cliente (§10.4); `goal` é opcional e, quando vem, o servidor confere com `metaDoFioCumprida`.
5. **Marés**: maré sem crescimento não gera peça (nenhuma "falha"); a colheita é feita por dia fechado, então fio de antes da virada conta para a maré velha.
6. **`guildCheckin` continua existindo** (presença sem fio) para o cliente atual; `guildThread` não o substitui na rota.
7. **Gestos** em `coopGest:<gid>:<save>` (`{day, kinds}`, TTL 3 d), escrito só pelo dono.
8. **Telemetria**: `guild_create/join/leave/thread/raid/stage` nos dois `EVENT_SCHEMA` e na `privacidade.html` (PT+EN). A emissão é do cliente (WPG-8).
9. **Mutação** (cópia em `/tmp/mut`, 34 mutantes): 32 mortos; 2 equivalentes explicados nos itens 1 e 2.

---

# Fatia 3 — WPG-4 (Feira), WPG-5 (recompensas), WPG-9 (sem push), WPG-6 complemento (29/09/2026)

## Contrato novo da API (`/api/guild?action=…`, todas com `Authorization` do dono do `id`)

| Ação | Método | Corpo / query | Resposta | Erros |
|---|---|---|---|---|
| `guildRaidHit` | POST | `{id, dayKey}` | `{ landed: true, guild }` (NUNCA dano) | 404 `no guild` · 429 `daily limit` (2º golpe no dia do jogador) · 409 `raid closed` (semana já dissipada) · 400 `invalid day` |
| `guildRewards` | GET | `?id=&dayKey=` | `{ rewards: { pending: [{week, outcome:'dissipada'\|'recuou', emblems}], scenes: string[] ('bg-guild-*'), trophyOwned: boolean, trophyId: 'trophy-concha-mare' } }` | 400 `invalid day` (funciona sem guilda: devolve os cenários já liberados) |
| `guildClaim` | POST | `{id, dayKey, week}` (`week` = uma de `pending[].week`) | `{ claimed: { week, outcome, emblems, trophy: boolean, trophyId: string\|null } }` | 400 `invalid week` · 404 `nothing to claim` (semana aberta, sem golpe, sem guilda) · 409 `already claimed` |

Campo novo em `vistaDaGuilda` (toda ação que devolve vista, inclusive `coop*`):
`raid: { weekKey, phenomenon: 'nevoa'|'mare'|'estatica'|'enxame', state: 'aberta'|'dissipada', ferido: boolean, lastWeek: 'dissipada'|'recuou'|null, mine: { hitToday: boolean } }` — nenhuma folha numérica (há teste). Três estados visuais: `aberta && !ferido` / `aberta && ferido` (dano ≥ metade) / `dissipada`.

**Para o cliente (fatia B):** ao `claimed`, somar `emblems` pelo MESMO caminho do Torneio (`onEarnEmblems`); se `trophy`, conceder a decoração `trophyId` (slot `trophy`; o id precisa entrar no catálogo de decoração — mudança de `src/`, fica com o front); `scenes` são ids para `PET_BACKGROUNDS` (WPG-13). Telemetria: `guild_raid{outcome}` 0 = golpe (200 de `guildRaidHit`), 1 = viu `dissipada`, 2 = viu `recuou` — já declarado nos dois `EVENT_SCHEMA`; nenhum evento novo.

## Escolhas registradas

1. **`state` da semana corrente nunca é `recuou`**: recuar é o desfecho de semana TERMINADA e sai em `raid.lastWeek`. `lastWeek` é `null` quando ninguém golpeou (não há o que dizer).
2. **`ferido`** = dano ≥ metade do HP (booleano). `hpBand` (0..10) do §10.3/`05` §4 NÃO foi implementado: a ordem da fatia (vetos do guarda) é "nunca HP numérico; no máximo `ferido`".
3. **Dano = soma das chaves `coopHit` dos membros ATUAIS.** Quem sai antes do fechamento leva o dano dele; depois de `coopRaidOk` gravado, a semana é vencida para sempre. HP usa `membrosAtivos` no dia de referência (hoje; o domingo, para semana passada).
4. **Cliente adulterado**: `profile.stage` é declarado pelo cliente; um `ultra` falso bate 16–24 em vez de 10–14 e a Feira da PRÓPRIA guilda cai antes. O prêmio é cosmético e Emblemas (que já vivem no save editável) — sem Créditos, coração, energia, perfectDays, Glitchtama. Aceito (§10.4). O corpo não escolhe dano nem semana (teste).
5. **Resgate idempotente sem CAS**: grava `coopClaim` com selo aleatório e relê; só quem acha o próprio selo resgatou (3 resgates concorrentes → 1×200 + 2×409). Resposta perdida na rede = Emblemas perdidos daquela semana (o registro já existe); preferido a pagar em dobro.
6. **Janela de resgate**: semana corrente (só se dissipada) + as duas anteriores (o `coopHit` vive 21 d). Resgatar exige estar na guilda (as chaves `coopHit` são por `gid`); os CENÁRIOS não exigem (G12).
7. **Concha da Maré** a cada 4 Feiras dissipadas COM participação e resgatadas: `coopShell:<save>` = conjunto de semanas (união idempotente, sem TTL); `trophy` só quando o conjunto CRESCE e fecha múltiplo de 4. A 8ª, 12ª… dão `trophy:true` de novo — o cliente decide se vira segunda peça ou é no-op.
8. **Cenários**: `coopScenes:<save>` (sem TTL, só cresce), preenchido por `guildRewards` quando `distinctDays ≥ 7` — até o estágio atual. O critério "estava na virada do marco" (§7) NÃO foi implementado (fora da ordem desta fatia).
9. **Exclusão**: `coopHit` de 4 semanas (era 2; o TTL é 21 d), `coopClaim` (9 semanas), `coopShell`, `coopScenes`. `coopRaidOk` fica (é da roda, sem dado pessoal). **Exportação**: `grupo.myHitsThisWeek` (só os dias, nunca `dmg`) e `recompensas: {claimedWeeks, guildScenes, shellWeeks}`.
10. **WPG-9**: `guild.semPush.contract.test.js` varre 10 arquivos de push (workers, `_pushCopy/_pushTargets/_pushIdentity`, `subscribe`, `fcm-subscribe`, `notifications.ts`, `NotificationManager.tsx`), ignorando linhas só de comentário (`subscribe.js` cita "grupo" num comentário).
11. **Mutação** (`/tmp/mut`, 39 mutantes em `_coop.js`/`guild.js`/`account.js`/`push-scheduler.js`): 39 mortos (o da Concha em dobro morreu com o teste de registro perdido).
12. **Pendências para `src/` (front)**: decoração `trophy-concha-mare` no catálogo; `hitRaid`/`getGuildRewards`/`claimGuildReward` em `community.ts`; `sim/guilda-sim.mjs` ainda usa literais (não importa `_coop.js`).

---

# Correções da revisão L2 do backend (`L2-backend.md`, 29/09/2026)

Um commit por achado. Testes novos em `functions/api/guild.l2.test.js` (A1, A2, A4, M1, M2, M5, B1, B4, B5, orçamento A3, dois fechamentos simultâneos, limiar de `ferido`), `metrics.prototipo.test.js` (M4), `guild.simParidade.test.js` (B6) e casos novos em `guild.nome.test.js` (B3) e `guild.recompensa.test.js` (M3).

## Fechados

- **A1**: `atualizarBosque` fecha só até **UTC−2** (o dia "aberto" é `min(dia do chamador, UTC−1)`): um dia D só fecha quando terminou em todos os fusos, e `diaDoJogador` já recusa D a partir de UTC = D+2. Consequência visível: o Bosque cresce com **um dia a mais de atraso** (o fio de segunda aparece na quarta).
- **A2**: `g.fiosAvulsos[dia]` virou **conjunto de ids opacos** (`idOpacoDoMembro`, o mesmo da vista), nunca contador; `fecharDiasDoBosque` une avulsos e membros num `Set`, então a mesma pessoa conta uma vez por dia mesmo saindo e voltando. Formato antigo (número) é lido como `k` ids anônimos (`avulsosDoDia`). O teto `Math.min(1, …)` ficou redundante por construção (firmados ⊆ roda).
- **A3 (escritas)**: `gravarGrupo` escreve o blob e só o que mudou (`novosMembros`, `codigoNovo`). A renovação conjunta (código + todo `coopOf` + todo `coopFio`) acontece quando falta < 30 d para `g.prazoAte`, ou UMA vez quando o Bosque passa a sem prazo (`g.semPrazoGravado`, G17a). O blob expira exatamente em `prazoAte`; os índices em ≥ `prazoAte` — o blob nunca sobrevive aos ponteiros. `renovarPrazos` só grava se `precisaRenovar`.
- **A3 (leituras)**: **cartão do membro** `coopMem:<gid>:<save>` (TTL 120 d) — resumo DERIVADO das chaves do próprio membro (check-in, fio, gesto, golpes das semanas em volta, nome do perfil), reconstruído só pelo dono a cada ação dele (`renovarCartao`). A vista lê 1 cartão por membro; sem cartão, lê as chaves de origem (nunca grava na vista). As chaves de origem seguem sendo a verdade (exportação, exclusão, resgate). Corrida aceita: duas ações do MESMO membro em aparelhos diferentes no mesmo instante podem deixar o cartão sem uma delas até a próxima ação dele. Nome mostrado = o do perfil na última ação do membro.
- **A4**: a vista não carrega `pid` nenhum. `members[].id` e `members[].memberId` = `SHA-256(GUILD_MEMBER_SECRET | gid | save)` em 16 hex; `presence[]` = `{ memberId, cameToday }`. `GUILD_MEMBER_SECRET` é opcional (wrangler secret).
- **M1**: `progress` sai `null` com 5+ membros (o cliente novo já descartava; o `CoopPanel` antigo só existe com ≤4).
- **M2**: `guildJoin` relê o blob imediatamente antes de gravar e empurra sobre a releitura.
- **M3 (parcial, declarado)**: o selo continua resolvendo dois toques na mesma região; entre POPs os dois aparelhos podem receber 200. Todo `claimed` e todo 409 `already claimed` trazem `receipt` **determinístico** por (save, semana). Fechar no servidor exige Durable Object — fora desta fatia. O teste multi-POP prova o recibo, não a exclusão mútua.
- **M4**: `hasOwnProperty` nas props e o agregado `guild_*` itera o SCHEMA.
- **M5**: `coopHit` sai em TODA saída (não só na exclusão) — nada muda no jogo (a Feira soma os membros atuais; resgatar exige estar na guilda). O `plan` da exclusão diz a verdade: apaga a guilda atual; o das anteriores saiu na saída; sobra sem vínculo expira em ≤ 21 d.
- **B1**: golpe na semana anterior ao UTC só até **segunda 12:00 UTC** (fim do domingo em UTC−12); depois, 409 `raid closed`. O "7 dias distintos em ~5 reais" do fio (±1) **não** foi mexido: fechar exigiria tirar o ±1 de quem está em fuso legítimo.
- **B3**: `t.me/…`, `x.com/…`, `insta:`/`ig:`/`discord`, `#1234`, `arroba`, `ponto com`, domínio com TLD comum → nome recusado; corte por ponto de código.
- **B4**: `guildJoin` descarta grupo ÓRFÃO (o ponteiro do anfitrião não aponta de volta): apaga blob + código e responde 404 — o órfão some no primeiro uso em vez de reunir gente.
- **B5**: com < 3 membros `gestures` sai `[]` e o recebido vira `gestureReceived: true|null` (sem tipo). Com 3+, `gestures` como antes e `gestureReceived` junto.
- **B6**: `sim/guilda-sim.mjs` importa `RAID_HP_PER_MEMBER`, `RAID_DMG_*`, `GUILD_MIN_RAID_MEMBERS` de `_coop.js`; teste de paridade textual.
- **B7 (documentado)**: rate limit **somado** por IP e por isolate = 60/min (`/api/guild`, bucket `guild`) + 120/min (aliases `coop*`, bucket da comunidade) = **180/min**. É amortecedor, não controle; o controle de custo é o orçamento abaixo.

## Orçamento de KV por ação (guilda de 12, em regime) — travado em `guild.l2.test.js` › `ORCAMENTO`

| Ação | Leituras (antes → agora) | Escritas (antes → agora) |
|---|---|---|
| criar | 19 → ≤ 15 | 6 → ≤ 5 |
| entrar (12º) | 130 → ≤ 27 | 14 → ≤ 3 |
| fio | 115 → ≤ 24 | 1 → ≤ 2 (fio + cartão) |
| check-in | 128 → ≤ 25 | 27 → ≤ 2 (check-in + cartão) |
| golpe | 141 → ≤ 38 | 1 → ≤ 2 |
| gesto | 115 → ≤ 24 | 1 → ≤ 2 |
| vista de 12 | 114 → ≤ 17 (16 da Guilda + 1 lápide de exclusão) | 0 → 0 |
| fechar o dia | — | 1 (o blob), uma vez por dia por guilda; +renovação conjunta uma vez na vida (G17a) ou a cada ~90 d |

Conta diária de uma guilda de 12 em que todos firmam, fazem check-in e golpeiam: ~12×(2+2+2) + 1 ≈ **73 escritas/dia** (era ~340). O custo de uma ação do próprio membro inclui reconstruir o cartão (≈ 9 leituras).

## Migração de `pid` para o front (A4)

1. `members[].pid` **não existe mais**. `members[].id` continua existindo, mas agora é o id OPACO da guilda (16 hex), igual a `members[].memberId`. Quem usava `id` como `key` de lista e semente de sprite (`GuildSheet` › `key={m.id}`, `groveStage.ts` › `spriteForMember(m.id)`) não muda código; o sprite de cada membro muda UMA vez (a semente mudou) e fica estável daí em diante.
2. `presence[]` passou de `{ pid, cameToday }` para `{ memberId, cameToday }`. `sanitizeGuildView` hoje ignora `presence`; se passar a ler, casar por `memberId`.
3. Nenhum fluxo pode usar o id da vista para chamar `community?action=player`/amizade/PvP: ele não abre nada fora da guilda (e é por isso que existe).
4. Novo: `gestureReceived: true | null` (B5). Com < 3 membros `gestures` vem `[]` — a UI deve mostrar "um gesto chegou" pelo agregado.
5. `progress` pode vir `null` (M1, 5+ membros). `guildClaim` → `claimed.receipt` e 409 → `receipt` (M3): creditar Emblemas UMA vez por recibo, guardado no save.
6. Fixtures do front (`GuildSheet.render.test.tsx` usa `presence: [{ pid, … }]`) precisam trocar `pid` por `memberId`.

## Achado separado, NÃO corrigido nesta rodada

- **`community?action=player&id=<pid>`** devolve `stage`, `unlockedStages`, `petName`, `daysPlaying`, rank e os pids dos amigos de qualquer pid, **sem token e sem checar `pvpEnabled`/amizade**. A Guilda parou de entregar pids, mas a superfície continua aberta para quem obtiver um pid por outro caminho (amizade, PvP, logs). Correção sugerida: `found:false` para quem não tem `pvpEnabled` e não é amigo do solicitante autenticado.

## Mutantes que continuam equivalentes (explicados)

- `p += Math.min(1, firmados / n)` → `firmados / n`: com o conjunto do A2, `firmados ⊆ roda`, então a razão nunca passa de 1 — o teto é redundante por construção.
- `g.bosqueProgress = Math.max(…, p)` → `= p`: `p` parte do próprio valor gravado e só soma; a última trava do LV-G3 é defensiva.

## Mutação (cópia em `/tmp/mut`, 28 mutantes nos arquivos tocados)

26 mortos, 2 equivalentes (acima). Os 4 sobreviventes da L2: `ferido` e a guarda de dois fechamentos simultâneos agora morrem; o teto de 1,0 e o `max` final são equivalentes por construção. O mutante "semana futura do cartão → ler a chave" morreu com o teste de cartão velho.

## Rodada L3 — mudanças de contrato para o front (29/09/2026)

Correções de servidor dos achados de `L3-conformidade.md` (A-1, M-1, M-2, M-3, M-5, B-2) e `L3-codigo.md` (A1, lado servidor).

1. **Ausência não é mais chave (M-1, LV-G2).** Em `members[]`, `presence[]`, `mine` e `raid.mine`, as marcas só EXISTEM quando são `true`: `members[].apareceuHoje`, `presence[].cameToday`, `mine.cameToday`, `mine.threadToday`, `mine.groveScenes`, `raid.mine.hitToday`. "Não veio"/"não firmou"/"não golpeou" = a chave ausente (`presence[]` vira `{ memberId }`; `raid.mine` pode vir `{}`). O cliente já lia com `=== true` (`sanitizeGuildView`), então nada quebra; fixtures que usam `false` explícito continuam válidas no cliente, mas não refletem mais o servidor.
2. **`progress` e `target` não trafegam mais (M-3)** — nem na vista de guilda, nem pelos aliases `coop*`. Os aliases `coop`/`coopCreate`/`coopJoin`/`coopCheckin`/`coopLeave` ficam: nenhum cliente os chama (`grep` em `src/` e `desktop/`: `CoopPanel` é reexport do `GuildSheet`, que usa `guild*`), mas ~5 arquivos de teste de servidor os usam como harness; removê-los é limpeza sem efeito de produto.
3. **`threadedToday` (5+) só acende com FIO firmado (B-2)**, nunca com check-in.
4. **409 `already claimed` agora traz o resgate (A1):** `{ error: 'already claimed', receipt, claimed: { week, outcome, emblems, trophy, trophyId, receipt } }` — a MESMA forma do `claimed` do 200, lida do registro gravado (`coopClaim`), nunca recalculada; `trophy` passou a ser gravado no registro. **Cliente:** no 409, se `claimed.receipt` não estiver em `hasClaimedReceipt`, creditar `claimed.emblems` (e a Concha se `trophy`) e guardar o recibo — exatamente como no 200. `claimed` pode vir `null` só se o registro sumiu entre as duas leituras.
5. **O direito não exige guilda (A-1, LV-G5):** `guildRewards`/`guildClaim` funcionam sem guilda atual para quem golpeou. Chave nova do titular `coopPart:<save>:<week>` = `{ gid, day }` (TTL 60 d), gravada a cada golpe e, para golpes anteriores, na saída; a saída também resolve a Feira com a pessoa ainda dentro (se o dano dela fechou o fenômeno, `coopRaidOk` fica gravado). Guilda que esvaziou paga pelo `coopRaidOk`. A folha pode (deve) oferecer "colher" também para quem saiu.
6. **Dias distintos de fio sobrevivem à saída (M-2):** na saída, `coopDias:<save>` = `{ n, days[] }` (sem TTL); o primeiro fio na guilda seguinte herda só o CONTADOR (`fioInicialHerdado`), nunca os dias — um dia de outra guilda não entra no fechamento do Bosque desta — e o dia já firmado não conta duas vezes. `mine.groveScenes` reflete isso depois do primeiro fio na guilda nova.
7. **Exclusão/exportação:** `apagarClaims` apaga `coopPart:*` (9 semanas) e `coopDias`; a saída da exclusão (`coopLeave({exclusao:true})`) não grava nenhuma das duas. A exportação ganhou `recompensas.raidWeeks` e `recompensas.carriedThreadDays`.
8. **Orçamento KV:** golpe +1 escrita (`coopPart`), primeiro fio numa guilda +1 leitura (`coopDias`); `ORCAMENTO` em `guild.l2.test.js` atualizado.
9. **Régua LV-G6 (M-5):** `functions/api/guildReward.contract.test.js` (comportamento + fonte + catálogo).

Mutação (`/tmp/mut`): 21 mutantes nos pontos desta rodada, 21 mortos.
