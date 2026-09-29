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
