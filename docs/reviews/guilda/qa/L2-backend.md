# Guilda — revisão adversarial L2 do backend (29/09/2026)

Escopo: `functions/api/guild.js`, `_coop.js`, `_profile.js`, `community.js` (aliases `coop*` e `player`), `account.js`/`_accountTombstone.js`, `_rateLimit.js`, `metrics.js`, `workers/` (guard de push) e os testes `guild.*`, `bosque.monotonic`, `account.guild*`, `metrics`. Revisão só de leitura: nenhum código de produto foi alterado.

**Portões:** `npx tsc -p tsconfig.server.json --noEmit` saiu limpo (exit 0). `npx vitest run functions`: 67 arquivos, 992 testes passando e 1 falha esperada.

**Contagem:** FATAL 0 · ALTO 4 · MÉDIO 6 · BAIXO 7.

---

## ALTO

### A1. Um membro com `dayKey` = amanhã fecha o dia de hoje e apaga os fios que ainda vão chegar
`_coop.js` › `fecharDiasDoBosque` / `atualizarBosque` (a variável `alvo = numDia(hoje) - 1`, onde `hoje` é o dia do CHAMADOR).

O fechamento usa o dia de quem pergunta, e esse dia é aceito a ±1 do dia UTC (`diaDoJogador`). Um exemplo: numa guilda com um membro em UTC+9 e outros em UTC−3, o de UTC+9 abre o app depois da meia-noite local. Nesse momento ainda é meio-dia no Brasil. A vista dele fecha o dia D, e `progressDay` passa a ser D. Os fios que os brasileiros firmam na tarde e na noite de D são gravados em `coopFio`, mas nunca mais entram na soma, porque o laço começa em `progressDay+1`.

PoC (`/tmp/poc.mjs`, puro): A firmou D, a guilda foi fechada, e depois B e C firmaram D. O progresso ficou em **0,083**, quando deveria ser 0,25. Nada dá erro. O cliente adulterado nem é necessário: fuso legítimo basta. A nota 1 de `impl-notas.md` aceitou divergência de PRESENÇA, não perda de fio.

**Correção mínima:** fechar só dias que já terminaram em todos os fusos, com `alvo = min(numDia(hoje), numDia(utcHoje)) - 2`, ou `utcHoje - 2`. Com isso D fecha quando UTC ≥ D+2.

### A2. Sair e voltar em loop infla o Bosque até ~1,0 por dia com uma pessoa só
`_coop.js` › `coopLeave` (`fiosAvulsos`) + `guild.js` › `guildJoin`/`guildThread`.

Ao sair, o fio pendente de hoje vira `fiosAvulsos[hoje] += 1`. Ao voltar pelo código, `coopFio` foi apagado, então o mesmo dia pode ser firmado de novo, e ao sair outra vez ele vira mais um avulso. Os avulsos entram nos dois lados da razão, e a razão tende a 1.

PoC, com 12 membros ativos e só A firmando: o honesto dá 0,083. Com k=5 voltas dá 0,353, com k=20 dá 0,656 e com k=100 dá 0,902. São três requisições por volta, dentro do rate limit de 60/min. O prêmio é cosmético (os cenários `bg-guild-*`), mas isso desfaz "um fio por membro por dia" (LV-G8) e ainda aciona o A3: cada `guildJoin` custa ~26 escritas.

**Correção mínima:** guardar o conjunto de dias já firmados por `save` numa lápide curta (`coopFioDone:<gid>:<save>`, TTL 3 d) que sobrevive à saída, ou gravar em `fiosAvulsos` só os dias que ainda não estão ali para aquele save (`{day: [hash curto]}`, sem saveId cru).

### A3. Amplificação de escritas no KV: ~26 escritas por check-in de uma guilda de 12
`_coop.js` › `gravarGrupo`, chamado por `renovarPrazos` (em todo primeiro `guildCheckin` do dia), `atualizarBosque`, `guildJoin`, `coopLeave` e rename.

Cada chamada grava: o blob (1), `coopCode` (1), um `coopOf` por membro (12) e regrava o `coopFio` de cada membro que tem fio (até 12). Isso dá ~26 PUTs. Numa guilda de 12 com todos fazendo check-in, são 12×26 mais o fechamento diário, perto de **340 escritas por guilda por dia**. O free tier do KV tem 1.000 escritas/dia, então **3 guildas cheias esgotam a cota do namespace inteiro**, e junto vão o cloud save e as compras. O mesmo namespace é o `DIGIAPP_SAVES`. Com o A2, um único atacante esgota a cota em ~40 voltas, uns 2 minutos.

Há dois agravantes. Primeiro, depois de `bosqueProgress > 0` as chaves não têm prazo nenhum (G17a), então toda "renovação" regrava sem TTL e compra nada. Segundo, as leituras: uma vista de 12 membros custa ~100 GETs (ck, fio ×2, perfil, gesto, dois `resolverFeira` com fio e golpe de cada membro). Com 100k leituras/dia, isso dá ~1.000 vistas/dia.

**Correção mínima:**
- (a) Em `gravarGrupo`, pular índices e fios quando `semPrazo` e o grupo já estava sem prazo. Registrar `g.ttlAte` e só renovar quando faltar menos de 30 d.
- (b) `renovarPrazos` no máximo uma vez por semana por grupo.
- (c) Na vista, reaproveitar os fios que `atualizarBosque` já leu, passando-os adiante, e ler a semana passada só às segundas ou guardar o desfecho em `coopRaidOk`/`coopRaidDone`.

### A4. A vista entrega o pid de todos os membros, e `community?action=player&id=<pid>` devolve o estágio deles sem autenticação e sem consentimento
`guild.js` › `vistaDaGuilda` (`members[].pid`/`id`) × `community.js` › action `player` › `publicProfile`.

`player` não exige `pvpEnabled` nem token. Com o pid que a Guilda entrega, qualquer membro, ou quem receber um print ou log da vista, lê de cada outro membro: `stage`, `unlockedStages`, `petName`, `daysPlaying`, `rankPoints/wins/losses` e os pids dos amigos. Isso viola LV-G10/D-3 ("estágio de criatura alheia nunca sai") e o consentimento N-4. Antes da Guilda, o pid só circulava para quem ligou o PvP ou para amigos.

**Correção mínima:** a vista não devolve o pid dos outros. Usar um id opaco por guilda, como `HMAC(gid, pid)` ou o índice estável `m0..m11`. Como alternativa, `player` passa a responder `found:false` para quem não tem `pvpEnabled` e não é amigo do solicitante.

---

## MÉDIO

### M1. `progress` intradia reconstrói "N de M vieram" com 5+ membros
`guild.js` › `vistaDaGuilda` (`progress: Math.min(feitos, target)`).

`progress` é a soma semanal. Quem abre de manhã e à noite lê o delta, que é exatamente o número de presenças de hoje, e `size` está ao lado. Isso é o que o `threadedToday: true|null` foi desenhado para impedir (LV-G2). A nota 3 do `impl-notas` já sinaliza o problema, mas ele não está travado.

**Correção:** com `size > PRESENCA_NOMINAL_MAX`, devolver `progress` em faixa (0..4) ou `null`, e manter o número cru só para ≤4.

### M2. `guildJoin` grava cópia velha do blob: ressuscita quem acabou de sair ou foi excluído, e faz o Bosque regredir por um momento
`guild.js` › `guildJoin` (`lerGrupo` → `push` → `gravarGrupo(g)`, sem reler antes de gravar).

Uma entrada concorrente com `coopLeave` (inclusive a da exclusão de conta) regrava `members` com o save que saiu. `gravarGrupo` recria o `coopOf:<saveExcluído>`, e o fantasma volta, agora com índice sem TTL se houver Bosque. Concorrente com `atualizarBosque`, a entrada regrava `bosqueProgress`/`progressDay`/`ornaments` antigos. O próximo fechamento recompõe, mas a vista intermediária mostra estágio menor ("nunca regride", visível).

**Correção:** reler e mesclar como `coopLeave`/rename já fazem, ou seja, `fresco = lerGrupo()` imediatamente antes do `put` com `push(id)` sobre o fresco. Nunca reescrever `bosqueProgress`, `progressDay`, `ornaments` ou `tide*` fora de `atualizarBosque`.

### M3. `guildClaim` com selo não é atômico entre POPs
`guild.js` › `guildClaim` (`selo`/releitura).

O KV é eventualmente consistente, com até 60 s entre localidades. Dois aparelhos em redes diferentes gravam e releem cada um o próprio selo, e os dois recebem 200 com `emblems`. O teste "3 concorrentes → 1×200" roda sobre um mock consistente. O impacto é Emblemas em dobro (cosmético, no save) e o `trophy` fica idempotente pelo conjunto.

**Correção:** aceitar o risco com registro explícito ou mover o resgate para um Durable Object. No mínimo, documentar que o teste não prova o caso multi-POP.

### M4. Telemetria: `props` com nome de membro do protótipo passa pela allowlist, e o laço da Guilda cria contadores ilimitados
`metrics.js` › `sanitizeRecord` (`const rule = schema[key]`) + `applyAggregate` (ramo `guild_*`).

PoC (`/tmp/met.mjs`): `{e:'guild_join', p:{size:5, constructor:987654, toString:-42}}` é aceito, e o agregado ganha `guild_join.constructor_987654` e `guild_join.toString_-42`. Qualquer inteiro vira chave nova. O ramo da Guilda itera todas as props, o que abre um sumidouro de chaves.

**Correção:** `Object.prototype.hasOwnProperty.call(schema, key)` em `sanitizeRecord`, e iterar `Object.keys(EVENT_SCHEMA[record.e])` no ramo `guild_*`.

### M5. A exclusão promete apagar `coopHit:*` ligados à conta, mas só alcança a guilda atual
`_coop.js` › `coopLeave({exclusao})` + `account.js` › `plan` ("rodadas da Feira (coopHit:*) ligados à sua conta").

Uma saída comum não apaga `coopHit:<gidAntigo>:<week>:<saveId>` (TTL 21 d). Se a conta é excluída depois, essas chaves, com o saveId na chave, seguem vivas, e o inventário da exclusão diz o contrário. Vale o mesmo para quem excluiu sem ponteiro `coopOf` (expirado ou órfão), porque aí `coopLeave` retorna cedo e nada do grupo é apagado.

**Correção:** apagar `coopHit` também na saída comum (o dano sai com a pessoa, igual a hoje) ou corrigir o texto do `plan`.

### M6. Invariantes sem teste (mutantes sobreviventes em `/tmp/mut`)
Foram rodados 32 mutantes; 28 morreram e **4 sobreviveram**:
- `p += Math.min(1, firmados/n)` → `p += firmados/n`. O teto de 1,0/dia só é testado num caso em que a razão já é 1.
- `g.bosqueProgress = Math.max(...)` → `= p`. Equivalente hoje, mas é a última trava do LV-G3.
- `ferido: dmg*2 >= hp` → `dmg*3`. O limiar de "ferido" não é testado.
- o guarda `fresco.progressDay >= teste.progressDay` → `false`. Equivalente (nota 1 da fatia 2), mas sem teste de dois fechamentos concorrentes sobre o KV.

Faltam ainda testes para A1 (fechamento com `dayKey` +1), A2 (sair/voltar), M2 (entrada com blob velho), A4 (pid → `player`), M4 (chave de protótipo) e um orçamento de escritas por check-in (A3).

---

## BAIXO

- **B1. `dayKey` na borda da semana:** na segunda UTC, `guildRaidHit` com `dayKey` = domingo grava na semana ANTERIOR, que já terminou, e pode virar `recuou` em `dissipada` antes do resgate (+2 Emblemas). O mesmo `±1` deixa firmar ontem, hoje e amanhã no mesmo dia real, e os 7 dias distintos (LV-G9) chegam em ~5 dias reais. Aceitar ou recusar golpe e fio em semana/dia diferente do dia UTC ±0 fora de uma janela de 12 h. `guild.js` › `guildRaidHit`, `_coop.js` › `diaDoJogador`.
- **B2. Solo farm de Emblemas:** guilda de 1 tem HP 135. Um `ultra` declarado (20±20% × 7) derruba sozinho, e qualquer um ganha 2 Emblemas/semana com 1 golpe (`recuou`). O risco é cosmético e já aceito na nota 4 da fatia 3, mas a combinação "1 golpe = 2 Emblemas" não está registrada. `guild.js` › `direito`.
- **B3. Sanitizador deixa passar handles e URLs sem `www`/esquema:** `t.me/fulano`, `x.com/fulano`, `insta: fulano_xyz`, `discord fulano#1234` e `joao arroba gmail ponto com` passam. Também corta por unidade UTF-16 (`slice(0, 24)`), o que pode deixar surrogate solto. `_coop.js` › `sanitizarNomeDeGuilda`. HTML não é problema, porque o React escapa.
- **B4. Criação dupla com intercalação A-grava/A-relê/B-grava/B-relê** deixa o grupo de A órfão (blob + `coopCode`, 120 d) sem nenhum ponteiro. `guild.js` › `guildCreate`.
- **B5. Gestos "anônimos" com 2 membros** identificam o remetente. É inerente, mas o texto de privacidade poderia dizer isso. `vistaDaGuilda` › `gestures`.
- **B6. `sim/guilda-sim.mjs` repete literais** (`K=45`, `DMG`, `JITTER`, `MIN_HP_MEMBERS`) apesar do comentário "importa, nunca repete" (footgun 9). Já registrado na nota 12 da fatia 3, mas sem teste de paridade. `src/utils/guildRules.ts` está em paridade (tem teste).
- **B7. Rate limit somado:** aliases `coop*` (bucket da comunidade, 120/min) + `/api/guild` (60/min) = 180/min por IP e por isolate. É amortecedor, não controle (já declarado em `_rateLimit.js`).

---

## Verificado e OK
- Autorização: toda ação passa por `authorizeSaveAccess(id)` antes de ler o grupo, e o grupo sai sempre de `grupoDe(id)`. Não achei IDOR (`groupId` do corpo é ignorado, a entrada é só por código).
- A vista não carrega saveId nem `hostSave` (só `isHost`), nem dano, HP ou quantidade de golpes. Os erros não vazam identificador.
- 12 golpes concorrentes: chaves por pessoa, soma correta, `coopRaidOk` idempotente.
- Toque duplo no fio/golpe: a mesma gravação, sem soma dupla.
- Guard de push: textual, cobre 10 arquivos. A rota não importa push.
- `guildRules.ts` está em paridade com `_coop.js` (teste).
- Exportação: só os dados do titular. Não sai nada de outro membro.
