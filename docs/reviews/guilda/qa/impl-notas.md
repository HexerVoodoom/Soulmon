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
