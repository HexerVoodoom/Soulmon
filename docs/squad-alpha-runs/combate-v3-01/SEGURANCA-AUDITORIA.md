# Auditoria de segurança — Combate v3 (somente leitura)

Base: `origin/main` do repo `D:\Soulmon\repo` em 2026-10-06. Arquivos citados são de `functions/api/`. Papel: alpha-security. Nada foi alterado no código.
Padrão de referência: OWASP ASVS 4.0 (V4 controle de acesso, V5 validação, V8 dados, V11 lógica de negócio, V13 API). Nenhum padrão foi declarado no contexto: ASVS é proposta minha, o dono deve confirmar.

Nota: não existe `functions/api/duel.js`. O "duel" é `_duel.js` + as ações `duelStart`/`match` de `community.js`. O nome do especial é testado em `duel.nome.test.js`.

## Contagem

| Severidade | Qtde |
|---|---|
| Crítico | 0 |
| Alto | 3 |
| Médio | 7 |
| Baixo | 5 |

## Modelo de confiança (resumo)
- Produção em modo estrito: `wrangler.jsonc:44` define `FIREBASE_PROJECT_ID`. `_auth.js:182-186` só abre sem a variável. Se a variável sumir, tudo abaixo piora (saveId = `sha256("soulmon:"+email)[:32]`, sem sal, calculável por quem sabe o e-mail).
- Ficha de luta (level, stats, família, bônus) é derivada no servidor do save (`_duel.js:139-162`). Resultado e semente são do servidor (`community.js:643-645,680,706`).
- Limite honesto, já escrito no código: o save inteiro é escrito pelo cliente. O servidor garante forma e teto, não procedência (`_equipment.js:6-8`, `save.js:232-235`).

## ACHADOS

### ALTO-1 — Cota e semente do duelo não são atômicas (corrida em `duelStart`/`match`)
- Onde: `community.js:619-621` (lê rank), `639-646` (checa cota, incrementa, grava), `654-708` (match). Sem CAS, sem lock. KV é eventualmente consistente.
- Cenário: cliente adulterado dispara em paralelo `duelStart` contra 3 oponentes com o mesmo `id`:
  `POST /api/community?action=duelStart {"id":"<meu>","opponentId":"<pidA>"}`, idem `<pidB>`, `<pidC>`, simultâneos.
  Todos leem `matchesToday=0`, todos passam, todos devolvem `{seed, me, opp}`. Só um `pending` sobrevive (último `putRank`) e a cota cai 1 vez.
  O atacante simula os 3 duelos offline (`simulateDuel` é determinístico e o espelho é público) e tem 3 olhadas pelo preço de 1 partida. Se o `pending` que sobreviveu não era o escolhido, perde -8 e cai no caminho legado (`community.js:684-701`).
  Mesma corrida em `match` paralelo (várias `taps` para o mesmo `pending`): cada resposta traz um resultado, só uma gravação persiste. Também estoura `MATCHES_PER_DAY` (5) por leitura obsoleta de `matchesToday`.
- Bloqueado? Não. Quebra a promessa de `_duel.js:12-14` ("semente só existe depois de a partida ser gasta"): várias sementes saem por uma cota.
- Correção: serializar por `id` (Durable Object por conta) ou `rev` no registro de rank com gravação condicional. Mínimo viável: `duelStart` recusa 409 se já há `pending` recente, e a cota só sobe depois da confirmação da gravação.
- Teste que prova: `community.duel.race.test.js` — `Promise.all` de 3 `duelStart` com KV fake que atrasa o `put`; esperar exatamente 1 resposta com `seed` e 2 de 409/429. Hoje falha (3 sementes).

### ALTO-2 — Fazenda de pontos/Honra com contas próprias (conluio e Sybil)
- Onde: `community.js:602-622` (qualquer oponente `pvpEnabled`), `334-350` (+20 vitória, `lifetimePoints`), cota só por conta (`MATCHES_PER_DAY=5`).
- Cenário: atacante cria contas A e B. Em B grava no save `evolutionStage:"rookie"`, `perfectDays:0` (level 1). O portão de PvP (`bondLevelOf`, Vínculo ≥ 5) lê `totalXP` do save, que o cliente escreve: basta `totalXP:1e6` e `profile {pvpEnabled:true}`. A duela B (pelo `pid` dela) 5x/dia: +100 pontos/dia e `lifetimePoints` +100/dia sem custo; B ainda ganha +10 por derrota. Com N contas B, escala linear.
- Bloqueado? Não. O teto de 5% é irrelevante: o ganho é de ranking, não de luta. Afeta top 100/top 20 (Mestre/Grão-Mestre) e troféus de season.
- Correção: (a) emparelhar por faixa de level/Vínculo; (b) rendimento decrescente por par (mesmo oponente 2x/dia = 0 pontos); (c) pontuar só contra oponente com idade mínima (`metadata.f`); (d) o portão de PvP não pode depender só de `totalXP` forjável.
- Teste: `community.farm.test.js` — A vence B 5x seguidas; esperar `points` de A ≤ teto por par/dia (hoje +100).

### ALTO-3 — DoS amplificado: save "veneno" listado como oponente
- Onde: `community.js:370-377` (`getWithMetadata` + `JSON.parse` do save inteiro, até 5 MB), usado em `opponents` (`594-595`: até 4 parses por chamada) e `duelStart` (`636`). `save.js:76,245` aceita 5 MB.
- Cenário: conta atacante (Vínculo forjado, `pvpEnabled:true`) grava um save de ~5 MB válido (campo livre `"x":"AAAA..."`) com campos de duelo válidos. Quando um terceiro chama `opponents` e o sorteio inclui o atacante, o worker faz `JSON.parse` de 5 MB. O `catch` de `378-382` pega erro de parse, mas NÃO pega estouro de CPU do worker (a requisição inteira morre). Vários atacantes quebram a lista de oponentes para todos.
- Bloqueado? Não. O rate limit é por IP e por isolate: "amortecedor de custo, não controle de segurança" (`_rateLimit.js`).
- Correção: calcular a ficha de duelo na gravação (`save.js`) e guardar em registro pequeno `duel:<saveId>` (campos fechados, < 2 KB); o duelo lê só esse registro. Teto de tamanho por campo no save (ex.: 1 MB para tudo que não é caderno).
- Teste: `community.opponents.poison.test.js` — oponente com save de 5 MB; espiar `JSON.parse` e garantir que `opponents` não parseia o save.

### MÉDIO-1 — Build, família do especial e skills escolhidos livremente pelo cliente
- Onde: `_combate.js:401-403` (`powerPoints`/`harmonyPoints`/`benevolencePoints` livres, normalizados), `_duel.js:151-159` (`soulmonSkills[estágio].especial.familia` entre 7 fixas), `_combate.js:164` (`spdBuff` power 1,82).
- Cenário: save editado para o melhor build contra o oponente (`profile.attrs` é público em `player`) e para a família dominante. O servidor aceita qualquer das 7 e qualquer divisão de pontos (piso 15%/teto 45% limita, `_combate.js:98-118`).
- Bloqueado? Só o formato. Se algum build/família dominar, o ganho é de graça e de qualquer um.
- Correção: derivar a família do que o servidor prova, ou provar por teste de equilíbrio que nenhuma combinação passa de X% de vitórias.
- Teste: `balance.matrix.test.js` — round-robin 7 famílias × 4 builds × 15 levels × 50 sementes; falhar se alguma célula passar de 55% contra a média.

### MÉDIO-2 — Torcida ótima calculável offline (a semente é conhecida antes do `match`)
- Onde: `community.js:647-651` devolve `seed`, `me`, `opp`; `_duel.js:58-79` aceita 20 baldes × 0..16.
- Cenário: depois de `duelStart` o cliente roda `simulateDuel` varrendo `taps` e envia o vetor que vence; se nenhum vence, deixa expirar (ver MÉDIO-7). A torcida vale até 13 descargas × 2,5 de energia e decide lutas apertadas. Quem não usa bot não consegue.
- Bloqueado? O teto sim (`sanitizeTaps`); o cálculo ótimo não. É consequência do desenho: risco aceito a documentar.
- Correção: commit-reveal (servidor guarda hash dos `taps` antes de revelar eventos) ou semente final = HMAC(seed_servidor, taps), o que elimina a busca.
- Teste: `duel.tapsOracle.test.js` — em 100 duelos de nível parecido, a busca de `taps` ótimo não pode elevar a taxa de vitória mais que Y pontos sobre `taps` zero.

### MÉDIO-3 — Procedência de Bits, equipamento e câmbio de Créditos só no cliente
- Onde: `_equipment.js:26-43,66-71` (forma e clamp), `src/App.tsx:3575-3592` (teto de 25% do câmbio), `save.js:240-243`.
- Cenário: `bitsOrigin.paidLeft`/`fromCredits` são editáveis; o 25% do câmbio não existe no servidor. `equipment:{owned:["eq-nucleo-t3","eq-carapaca-t3","eq-rastro-t3"],equipped:{...}}` é aceito sem custo e rende 4,5%. `talentPicks` com 12 picks PvP rende 4,8% (`_talents.js:17-19,79-87`), válidos para um Vínculo forjado.
- Linhas vermelhas: "teto único de 5%" OK (`combinedAttrBonus`, `_combate.js:144-155`, soma dos três canais). "Dinheiro real nunca compra vantagem" OK por construção: o máximo é gratuito para qualquer forjador. "Créditos só não-combate" e o 25% são regras de cliente, não verificáveis pelo servidor. O dono precisa saber que isso é regra de UX, não de segurança.
- Correção (se quiser verificável): mover a compra de equipamento para endpoint servidor com `ent:<saveId>`, ou declarar o risco.
- Teste: `equipment.forge.test.js` — save forjado com tudo T3 + talentos: bônus final ≤ 5% (deve passar); `bitsOrigin` forjado não altera o resultado do duelo (regressão).

### MÉDIO-4 — `rebirth-reset` não confere o portão de Renascimento (conta paga + Vínculo 12)
- Onde: `entitlements.js:208-225` confere só `state.rebirth.at/fromStage`; `_gates.js:12` (`renascimento: minBond 12`) não é usado no servidor.
- Cenário: conta grátis com `rebirth:{at:"x",fromStage:"y"}` no save → `POST /api/entitlements?action=rebirth-reset {"id":"<meu>"}` → zera `aiLifetime.sprite` (26 gerações, ~R$ 2,60 de IA segundo o comentário do código). Uma vez por conta; Sybil multiplica.
- Correção: chamar `gateFor('renascimento', bondLevelOf(...))` e exigir `tier === 'paid'` no handler.
- Teste: `entitlements.rebirthGate.test.js` — conta `free` com `state.rebirth` forjado devolve 403.

### MÉDIO-5 — `maxLevelFor` sem `f` vira level 40; `f` é barato de envelhecer
- Onde: `_duel.js:88` (sem `firstSeen` → `MAX_LEVEL`), `community.js:377`. Só `save.js:252-257` escreve `f`.
- Cenário A: save gravado antes da regra e nunca regravado luta com o teto do estágio (até 40). Janela pequena. Cenário B: contas dormentes (e-mail+1) criadas e deixadas 40 dias; depois `evolutionStage:"ultra"` → level 40 sem jogar. É o teto S1 funcionando como projetado (1 level/dia), não um furo; combina com ALTO-2.
- Correção: A: tratar `f` ausente como "agora" (piso) até a próxima gravação. B: aceitar e declarar.
- Teste: `_duel.maxLevel.test.js` — `maxLevelFor(undefined, now)` deve devolver o piso (hoje devolve 40).

### MÉDIO-6 — Corpo sem limite antes do parse e sem rate limit em `save.js`
- Onde: `save.js:118` lê o corpo todo antes de qualquer teto; `save.js:244-248` mede `serialized.length` (caracteres, não bytes). Nenhum `takeToken` em `save.js`. A regravação sem CAS segue aberta (`save.js:177-185`, ADR-004).
- Cenário: cliente autenticado envia POSTs de dezenas de MB em laço. Custo de CPU/KV, não vazamento.
- Correção: checar `Content-Length` (413 antes de `json()`), medir bytes, `takeToken('save', id, ...)` por conta.
- Teste: `save.limits.test.js` — corpo de 8 MB devolve 413 sem `kv.put`; 30 POSTs/min do mesmo id devolvem 429.

### MÉDIO-7 — Virada de mês e pendência preguiçosa tiram o custo da desistência
- Onde: `community.js:170-176,334-364`: `pending` mora em `rank:<season>:<id>` e a derrota por desistência só é cobrada na PRÓXIMA chamada.
- Cenário: `duelStart` às 23:59 do último dia do mês, simulação offline, se perde não chama `match`; no mês novo o registro de rank é outro e a derrota nunca é cobrada. Também: ao ver que perde, o atacante desliga `pvpEnabled` e some, e o `pending` fica sem liquidar.
- Correção: guardar `pending` em chave independente da season e expirar por `DUEL_PENDING_MS` em qualquer leitura do rank.
- Teste: `community.pendingSeason.test.js` — `duelStart` em 2026-10-31T23:59Z e `match` em 2026-11-01 devem contar derrota na season do `duelStart`.

### BAIXO
- B1: `profile.attrs` aceita `+x || 0` (`community.js:456-457`); `Infinity` vira `null` no JSON. Sem efeito em luta (não é fonte de ficha desde o PR5). Teste: `attrs` com `1e999` grava número finito.
- B2: CORS `*` com `Authorization` (`save.js:19-27`, `community.js:49-55`). Sem cookie não há CSRF; aceitável.
- B3: rate limit em memória por isolate (`_rateLimit.js:1-30`), declarado como amortecedor. `duelStart`/`match` caem no teto leve de 120/min/IP, sem teto por conta.
- B4: `opponents` anônimo (sem `id`) faz varredura de 300 chaves e 3 parses de save por chamada (`community.js:565-596`), sob o teto pesado de 20/min/IP; custo, sem vazamento (devolve só `duel:{level}`).
- B5: `soulTestAnswers` (20 respostas do teste) sobe no save na nuvem (`GameStateContext.tsx:543-550`). O comentário do código diz que está declarado em `public/privacidade.html`; não li a política, fica para alpha-compliance. O `soulProfile` NÃO está no estado do save: mora em `STORAGE_KEYS.SOULMON_PROFILE` (`App.tsx:3987`) e nada em `cloudSave.ts` o menciona.

## Cenários de ataque (payloads e veredito)

| # | Ataque | Payload | Resultado | Onde |
|---|---|---|---|---|
| 1 | Forjar level/estágio | save `{"evolutionStage":"ultra-x","perfectDays":1e9}` | LIMITADO: level = min(soulLevel, 1 + dias desde `f`) | `_duel.js:87-90`, `_soulXP.js:51-53`, `community.js:377` |
| 2 | Número gigante em dias | `perfectDays:1e307` | `soulXP`=Infinity → `safe()` zera → level 1 (auto-sabotagem, sem NaN) | `_soulXP.js:23-25,43,47` |
| 3 | `talentPicks` com 100 ids/ids inventados | `["tal-pvp-01"×50,"x"]` | DESCARTADO (`[]`) na gravação e 0 no duelo | `save.js:236`, `_talents.js:38-57` |
| 4 | Equipamento tudo T3 + fragmentos 1e308 | `equipment:{owned:[...t3],fragments:1e308}` | Aceito até o teto: ≤4,5% do equipamento, ≤5% total; fragmentos viram 999 | `_equipment.js:26-57`, `_combate.js:144-155` |
| 5 | Estourar 5% somando fontes | talentos 4,8% + equip 4,5% | Normalizado para 5% (soma dos 3 canais) | `_combate.js:152-154` |
| 6 | Mandar `seed`, `winner`, `me`, `opp`, `level` no `match` | `{"id":..,"opponentId":..,"seed":1,"winner":"me","me":{...}}` | IGNORADOS: só `taps`/`cheers`/`forfeit` são lidos | `community.js:706,666,687` |
| 7 | `taps` forjado | `[1e9,-5,NaN,{},"9",...×1e5]` | Higienizado a 20 inteiros em [0,16] | `_duel.js:58-64` |
| 8 | IDOR: agir como outro `id` | `duelStart {"id":"<vítima>"}` sem token da vítima | 401/403 em modo estrito | `community.js:609,320-327`, `_auth.js:182-200` |
| 9 | Duelar com save de terceiro / ler ficha | `opponentId` = pid de outro | Só pid público resolve; `opponents` devolve `{level}`; ficha só após gastar cota e só campos derivados | `community.js:593-596,612`, `_duel.js:139-162` |
| 10 | XSS/injeção no nome do especial | `lex:{n:0,f:0}` + `elementoId:"<img onerror>"` | `lexOf` aceita só inteiros e `^[a-z][a-z_]{0,23}$`; texto do save nunca sai | `_duel.js:109,118-127` |
| 11 | Injeção em apelido/pet | `name:"@insta ... discord#1234"` | Descartado, anterior mantido | `community.js:436-450`, `_coop.js:111-130` |
| 12 | Fraude de relógio `f` | `state.f`, `metadata:{f:1}` no corpo | `f` só vem do `kv.put` do servidor, preservado na renovação | `save.js:252-257,191-195` |
| 13 | Mass assignment de dinheiro | `state.credits`, `accountTier:"paid"` | Removidos | `save.js:30,225` |
| 14 | `duelStart` duplo/paralelo | 3 POSTs simultâneos | NÃO BLOQUEADO (ALTO-1) | `community.js:619-646` |
| 15 | Conluio A×B para pontos | A duela B 5x/dia | NÃO BLOQUEADO (ALTO-2) | `community.js:602-622,334-350` |
| 16 | Save veneno de 5 MB como oponente | save 5 MB em conta `pvpEnabled` | NÃO BLOQUEADO (ALTO-3) | `community.js:370-377,594-595` |
| 17 | Replay do mesmo `match` | reenviar o corpo | `pending` é anulado; 2ª chamada abre duelo novo (gasta cota, semente nova). Exceto na corrida (ALTO-1) | `community.js:663,682` |
| 18 | `forfeit` sem duelo aberto | `forfeit:true` | 409, nada gasto | `community.js:687` |
| 19 | `soulProfile` vazando | procurar em `cloudSave`/`save.js`/`community.js` | Não está no estado da nuvem; `soulTestAnswers` sobe (B5) | `App.tsx:3987`, `GameStateContext.tsx:543-550` |

## Verificado e OK
- Resultado e semente só do servidor; ficha dos DOIS lados congelada em `duelStart` (`community.js:636,645,679-682`). O `match` não relê o save.
- `crypto.getRandomValues` para a semente (`community.js:643,699`).
- `sanitizeTaps`, `cleanWeights`, `clampLevel`, `combinedAttrBonus`, `cleanCheerScale` (máx 1,15) tratam NaN/Infinity/negativo (`_duel.js:58-64`, `_combate.js:92-97,73-76,141-159,178-180`).
- `hasOwnProperty` contra `__proto__`/`constructor` em talentos, equipamento, escola e família (`_talents.js:29`, `_equipment.js:20`, `_duel.js:99,129`, `_combate.js:167`).
- Vetor inválido é descartado, não corrigido (`_talents.js:55`).
- Canais `rebirth`/`commerce` do bônus não alimentam o duelo hoje: `duelSide` só passa `talent` e `equipment` (`_duel.js:145-149`). Dinheiro real não entra no combate.
- Autorização por dono do saveId em todas as ações que escrevem (`denyUnlessOwner`), com lápide. Modo estrito ligado (`wrangler.jsonc:44`).
- Corpo de `community` com teto de 64 KB e sempre objeto (`community.js:299-303`).
- Luta finita: `MAX_EVENTS` e guarda de 10× tempo (`_combate.js:204,378,385`).
- Respostas públicas não devolvem saveId; pid aleatório de 96 bits (`_profile.js:45-48`).
- Só `save.js` escreve a chave do save, então `metadata.f` não é zerado por outro caminho (varredura de `put` em `functions` e `workers`).

## Fora de escopo (risco aceito até alguém modelar)
Cliente (`src/`) inteiro, exceto o que foi lido para saber o que sobe na nuvem; `guild.js`, `chat.js`, IA/geração de sprite, push; verificação de assinatura Firebase (`verifyIdToken`/JWKS); billing Play/Steam (`_billing.js`) e reembolso; infra Cloudflare (WAF, `_headers`); cadeia de suprimentos e CI; obrigação legal de lootbox e dado de menor (alpha-compliance e dono jurídico).
Não executei payload contra produção; os veredictos vêm de leitura de código. Os testes sugeridos não foram escritos nem rodados.
