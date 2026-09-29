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
