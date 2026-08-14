# Rodada 5 — o guard de duplicação de regra, a deriva `workers/`↔`functions/`, e o veredito do loop

> Papel: `qa-sweeper`. Missão: o critério de parada que eu mesmo propus no fim da
> rodada 4. **Nada commitado, nada empurrado.** Nenhum teste existente foi
> afrouxado. `.github/` não foi tocado. Nenhum call site de storage em `src/`
> foi alterado (outro agente está migrando as 122 chamadas cruas).

---

## 0. Portões (números reais, rodados agora)

| Portão | Comando | Resultado |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | **exit 0, sem saída** |
| Testes | `npx vitest run` | **59 arquivos · 766 testes · 766 passam · 0 falham** (baseline 53/685 → **+81 casos**) |
| Build | `npm run build` | **✓ built in 3,52s**, 115/115 PNG→WebP (−7,17 MB), `✨ Compiled Worker successfully` |
| Pós-build | `npx vitest run src/deploy/ src/security/` | **33/33** (os guards de CSP e de cache leem o `dist/` recém-gerado) |

> ⚠️ Durante a sessão o `tsc` acusou 5 erros em `src/components/PlayerDetailModal.tsx`
> (`ATTR_ICON`, `BranchIcon`, `ATTR_LABEL` indefinidos). **Não são meus** — o
> arquivo foi escrito às 15:54 pelo agente que está migrando o storage, no meio
> da minha rodada. Ao fechar, o `tsc` estava limpo. Registro só para ninguém
> atribuir isso a esta rodada.

---

## 1. Veredito do loop — resposta direta

Eu propus: *"se a rodada 5 rodar o guard de duplicação, fechar a deriva
`workers/`↔`functions/` e não achar 🔴/🟠, o loop para com evidência"*.

**Cumpri as duas primeiras condições e REFUTEI a terceira. O loop NÃO para —
achei 1 🔴 e 4 🟠.**

E o dado mais importante não é o número, é a direção: **a taxa de achado SUBIU**
(3 defeitos na rodada 4 → 5 nesta). Não porque o código piorou, mas porque o
instrumento mudou. As rodadas 1–4 acharam defeito **lendo**; esta rodada achou
defeito **executando duas implementações lado a lado e comparando o número**.

> O 🔴 desta rodada não é visível na leitura de nenhum dos dois arquivos
> envolvidos. Os dois estão certos. O erro está no fato de que um deles esvazia
> a lista que o outro conta.

Os cinco achados são **da mesma classe**, e é a classe que a rodada 4 nomeou:
*fix (ou regra) aplicado por ARQUIVO, não por REGRA*. Isso é bom e ruim ao mesmo
tempo — bom porque é auditável e agora está mecanicamente travado; ruim porque
significa que a rodada 4 nomeou o padrão certo e **não estimou o tamanho dele**.

O critério de parada honesto está no §8.

---

## 2. 🔴 Quem faz o dia inteiro por tarefa avulsa **nunca ganha um dia perfeito**

**`src/utils/dailyReset.ts:216` (contava `prev.tasks`) ↔ `src/utils/careRules.ts:224` (esvazia `prev.tasks`)**

Esta é a fronteira que o guard existe para achar: **duas regras, duas fontes,
uma delas destruída pela outra.**

- `completeTask` (`careRules.ts:218-243`) **remove** a tarefa concluída de
  `state.tasks` e a move para `state.completedTasks`. Está escrito e é
  intencional: é o que torna a chamada idempotente.
- `computeDailyReset` contava as tarefas do dia como
  `prev.tasks.filter(t => t.completed).length` e o total como
  `activities + prev.tasks.length`.

Ou seja: **a tarefa concluída sumia do numerador E do denominador.** Um dia em
que a pessoa fez tudo ficava aritmeticamente idêntico a um dia em que ela não
cadastrou nada.

### Cenário concreto (medido, não deduzido)

Rookie, energia cheia, **0 atividades recorrentes disponíveis hoje**, 3 tarefas
avulsas criadas e todas concluídas.

| | antes | depois do fix |
|---|---|---|
| `totalTasks` na virada | **0** | 3 |
| `dayWasPerfect` (`totalTasks > 0 && …`) | **false** | true |
| `perfectDays` | **0** | 1 |
| barra da tela (`useProgressTracking`) | **100%** | 100% |

`perfectDays` é o **único** caminho para evoluir (`MANUAL_EVOLUTION`, evolução
exige `perfectDays >= required`). Então o jogador desse perfil **fazia tudo, via
a tela em 100%, e a progressão não andava — para sempre, sem uma única mensagem
de erro.** O mesmo jogador que não fizesse nada perdia um coração; o que fazia
tudo apenas não era punido.

E não é um perfil exótico: **todo usuário com atividades só de seg–sex cai nisso
todo sábado e domingo** se resolver o fim de semana por tarefas avulsas — 0
atividades disponíveis + tarefas concluídas = `totalTasks === 0`.

Medido com `computeDailyReset` real:
`{ feitas: { perfectDays: 0, hp: 3 }, naoFeitas: { perfectDays: 0, hp: 2 } }`.

**Corrigido.** `tasksCompletedOn(state, dayKey)` (`dailyReset.ts:158-171`) conta
as tarefas do dia que já saíram da lista; `registeredForDay` e o `dailyDone` da
virada passaram a somá-las.

**Regressão travada:** `src/utils/dailyGoalSources.test.ts` (13 casos), com
**autoverificação do mecanismo** (um caso executa `completeTask` de verdade e
prova que ela REMOVE a tarefa da lista — sem ele o teste inteiro perderia a
premissa em silêncio) e **dois controles negativos** (não fazer nada continua
custando 1 coração; tarefa de outro dia não conta). Verificado nas duas pontas:
revertendo a contagem, 2 casos ficam vermelhos.

---

## 3. 🟠 A meta do dia era calculada de **duas fontes diferentes** (o alvo declarado da missão)

**`src/App.tsx:2519` e `src/App.tsx:876` (originais) vs. `src/utils/dailyReset.ts:224`**

A regra `min(cadastradas, requisito do estágio)` tem **duas** partes, e só a
primeira tinha sido corrigida:

| | teto | fonte de "cadastradas" |
|---|---|---|
| `computeDailyReset` (dono) | `FORM_REQUIREMENTS[nível].required` | atividades **do dia da semana** + tarefas |
| `NotificationManager totalRequired` (`App.tsx:2519`) | ✅ igual | ❌ `activities.length` **cru** |
| toast de ganho (`App.tsx:876`) | ✅ igual | ❌ `activities.length` **cru** |

O `STATUS.md §2` registra o bug já corrigido uma vez: *"Notificações cobravam
quem já tinha cumprido a meta. `totalRequired` era o requisito do estágio, não
`min(cadastradas, requisito)`"*. **Aquela correção consertou o TETO e deixou a
FONTE** — e a fonte devolve a cobrança falsa exatamente no fim de semana.

### Cenário concreto (é o teste, com os números)

Rookie com rotina de semana: 3 atividades seg–sex + 1 de todo dia, 0 tarefas.

- **Sábado**: `registeredForDay = 1` → meta real **1**. A pessoa faz o remédio,
  cumpre a meta, e a virada **não tira coração** (verificado rodando
  `computeDailyReset`).
- A cópia dizia `min(4, 4) = **4**`. `NotificationManager` compara
  `completedSteps < totalRequired` às 10h, às 16h e às 20h → **três cobranças no
  sábado dizendo que faltam tarefas para quem não deve nada**, e o toast
  anunciando `1/4 do dia`.
- **Numa quarta as duas concordam** — por isso o defeito nunca apareceu.

**Corrigido.** `dailyGoalFor(state, weekDay, dayKey)` (`dailyReset.ts:187-196`) é
o dono único; os dois call sites e o próprio `computeDailyReset` passaram a
chamá-lo. Ver o guard no §6.

---

## 4. 🟠 O worker de push continuava cobrando tarefa às 21h — depois de o app ter parado

**`workers/push-scheduler.js:36-46` + `workers/wrangler.toml:8` (originais)** — a
deriva `workers/`↔`functions/`↔`src/` que eu não tinha testado em nenhuma rodada.

`STATUS.md §2` registra: *"O aviso das 21h ('está preocupado! ainda dá tempo!')
foi removido"*. Removido **do cliente**:
`NotificationManager.tsx:156` até cancela o alarme antigo no aparelho
(`cancelAlarm({ id: 'pet-nudge-21' })`), com o motivo escrito: *"nada deve pedir
uma quarta visita ao app, e cobrar tarefa na hora de dormir é o oposto de um
companheiro."*

O worker nunca soube disso. `workers/` é **deploy manual** (`wrangler deploy`),
`src/` sobe sozinho no push da `main`, e nada no CI compara os dois. Resultado em
produção, todo dia às 21h BRT, para todo usuário com Web Push ou FCM:

> ⏰ **{pet} está preocupado!** — *Ainda dá tempo! Complete suas tarefas antes de
> dormir 🌙*

E **pior que a versão que foi removida**: o cliente pelo menos checava
`completedSteps < totalRequired`. O worker não tem estado de tarefa nenhum —
manda para **todo mundo, incondicionalmente**, inclusive para quem já fechou o
dia. É o texto que a auditoria de tom classificou como cobrança, entregue no
horário de maior fragilidade, pelo canal que alcança quem está com o app fechado.

**A mesma deriva no 10h/16h:** o worker mandava `"📋 {pet} está te lembrando! /
Suas tarefas ainda estão esperando! 🎯"` enquanto o cliente já dizia
`"{pet} passou pra dizer oi / Tem algo do seu dia que você já fez?"`. Duas vozes
do mesmo personagem, uma reescrita e a outra não.

**Corrigido.** Criei `functions/api/_pushCopy.js` — **dono único do texto e do
horário**, em JS puro para o worker poder importar (mesmo caminho que já
funcionava para `_pushTargets.js`). `push-scheduler.js` perdeu o
`getNotification` local e importa `pushCopy`; hora sem texto declarado sai
**sem tocar no KV e sem mintar token de FCM**. O cron `"0 0 * * *"` (21h BRT)
saiu do `wrangler.toml`.

> ⚠️ **Depende do dono:** `workers/` só muda em produção com
> `wrangler deploy` dentro de `workers/`. Até lá, o push das 21h continua saindo.
> Isto é a correção do código, não do que está no ar.

**Regressão travada:** `workers/pushCopy.parity.test.js` (13 casos) — ver §6.
O caso do `push-scheduler.test.js` que iterava a hora 21 **não foi afrouxado**:
a hora saiu da lista e a **ausência virou asserção** (`às 21h NADA é enviado por
nenhum dos dois canais`), com o motivo escrito no código.

---

## 5. 🟠 O banner de "1 coração" prometia um número que não salva ninguém

**`src/App.tsx:1963-1970` (original)**

O banner que aparece com HP ≤ 1 dizia:

> `1 HP restante — complete ao menos ${Math.ceil(required / 2)} item(s) hoje para
> não regredir!`

Para um rookie: **2**. A regra real (`floor((1 − feitas/meta) × maxHP)`, teto 1)
zera a perda só acima de `1 − 1/maxHP` da meta → com meta 4 e 3 corações são
**3 itens**.

`STATUS.md §2` registra que essa promessa já foi identificada como falsa e
removida — *do aviso das 20h*: *"o das 20h parou de prometer que 'metade das
tarefas' evita a perda — o que era falso"*. O comentário em
`NotificationManager.tsx:110` até explica ("a perda zera só acima de 2/3 da
meta"). **O banner ficou com a promessa falsa**, e ele aparece justamente no
estado de maior consequência.

### Cenário concreto (medido pela própria virada)

Rookie, 3 corações de máximo, **1 coração restante**, 4 tarefas cadastradas. O
banner promete 2. O jogador faz 2, o banner **some** (a condição é
`dailyDone < 2`), ele para tranquilo. Na virada:
`heartsLost: 1` → HP 0 → `degeneratedByHP: true`. **Degenerou fazendo
exatamente o que a tela mandou fazer para não degenerar.**

**Corrigido.** `tasksToAvoidHeartLoss` (`dailyReset.ts:236-254`) responde o
número, e `rawHeartsLostFor` (`dailyReset.ts:214-217`) virou o dono único da
fórmula da perda — chamado pelo `computeDailyReset` **e** pelo cálculo do aviso.

**Detalhe que só apareceu porque o guard é diferencial e não algébrico:** minha
primeira versão fechada (`floor(meta × (1 − 1/maxHP)) + 1`) é a mesma conta no
papel e **divergiu na prática**. Em ultra (meta 5, maxHP 5) com 4 feitas, o ponto
flutuante faz `(1 − 4/5) × 5` valer `0,9999999999999998` → perda **zero**,
enquanto a álgebra exigia 5. O guard pegou (`ultra/5 (meta 5): expected 5 to be
4`) e a função passou a ser derivada **da própria fórmula da perda**, varrendo
`feitas = 0..meta`. Um guard que só comparasse as duas expressões escritas teria
aprovado as duas.

---

## 6. Os guards — o que cada um prova e como se autoverifica

Cinco arquivos novos. **Todos foram verificados NAS DUAS PONTAS**: introduzi a
duplicação sintética, medi o vermelho, restaurei e medi o verde. Números abaixo
são de execução, não de afirmação.

### 6.1 `src/utils/dailyGoal.contract.test.ts` — meta do dia (11 casos)

Três camadas, de propósito, porque só a terceira é regex e regex sozinha é fraca:

1. **DIFERENCIAL** — prova com números que as duas fontes **divergem**
   (sábado: dono `1`, cópia `4`) **e concordam na quarta** (`4` = `4`). O caso de
   autoverificação exige `[false, true]` nos sete dias: se fossem sempre iguais,
   o guard estaria proibindo uma forma sem provar que ela é ruim; se fossem
   sempre diferentes, seria um teste trivial.
2. **ACOPLAMENTO** — roda o `computeDailyReset` de verdade e exige que a meta
   anunciada seja a meta cobrada. Autoverificação: um caso prova que a virada
   **realmente tira coração** quando a meta não é cumprida (sem ele, o teste
   passaria com um `computeDailyReset` que nunca cobra nada).
3. **ORIGEM** — a forma `Math.min(…, FORM_REQUIREMENTS[…].required)` só pode
   existir no dono. Autoverificação em **quatro** direções: reconhece a
   duplicação em uma linha, reconhece a de três linhas (a formatação real do
   `App.tsx`), **não** acusa a forma correta, e prova que o *stripper* de
   comentário não come código.

> **Limite declarado dentro do próprio guard**: a forma "via variável
> intermediária" (`const req = …; Math.min(reg, req)`) **escapa da regex**, e o
> teste diz isso em voz alta em vez de fingir cobertura. É a camada 2 que pega
> essa — por resultado, não por texto.

**Âncora contra decoração:** um caso exige que o **dono** continue escrevendo a
fórmula. Sem ele, apagar a fórmula do dono deixaria o guard passando vazio para
sempre. (Foi essa âncora que me obrigou a escrever `dailyGoalFor` inline.)

**Prova de que enxerga:** injetei a fórmula antiga de volta em `App.tsx` →
**2 casos vermelhos**. Restaurado → 11/11 verdes.

> **Ele teria pegado os dois achados da rodada 4 antes de existirem?** O do
> `safeStorage` sim (mesma forma: dono + varredura de call sites). O do galho
> previsto ≠ entregue já tem guard próprio desde a rodada 4
> (`careHistory.contract.test.ts`), e a camada 1 é modelada nele.

### 6.2 `workers/pushCopy.parity.test.js` — deriva entre as três árvores (13 casos)

Prova, **por execução**, que:

- todo cron do `wrangler.toml` cai numa hora que `pushCopy` responde, e toda
  hora declarada tem um cron (`[1, 13, 19]` UTC, comparação de conjunto);
- o worker **de verdade não envia nada às 21h** — roda `worker.scheduled()` com
  KV falso, chave ECDH real e `fetch` interceptado, e conta zero envios **sem
  apagar a inscrição por engano**;
- **cada string** de `_pushCopy.js` existe **literalmente** em
  `NotificationManager.tsx` (cliente e servidor falando igual);
- o texto de cobrança removido não volta por nenhuma hora nem idioma
  (`/preocupado|worried|ainda dá tempo|still time|antes de dormir/i`);
- os prefixos de KV que o worker **lê** (`push:`/`fcm:`) são os que as functions
  **escrevem**;
- a allowlist de endpoint de push não é reescrita em nenhuma das duas árvores
  (extraída do dono e procurada nos outros arquivos).

**Autoverificações:** o parser realmente leu os crons (`length > 0` e formato); o
mesmo harness **envia** às 10h (senão o "nada às 21h" seria vazio); o extrator de
hosts achou hosts no dono; e um caso simula o cron órfão real (`"0 0 * * *"`) e
exige que ele seja apontado.

**Prova de que enxerga (duas pontas, duas direções):**
- devolvi o cron das 21h ao `wrangler.toml` → **3 casos vermelhos**;
- devolvi o texto "está preocupado! Ainda dá tempo!" ao `_pushCopy.js` →
  **5 casos vermelhos**.

### 6.3 `functions/api/saveId.parity.test.js` — a terceira cópia do `saveId` (13 casos)

O `CLAUDE.md` footgun 9 diz que `desktop/renderer/src/cloudSync.test.ts` é "o
único lugar onde as duas cópias se encontram". **São três, não duas:**
`src/utils/cloudSave.ts:18`, `desktop/renderer/src/cloudSync.ts:54` e
**`functions/api/_auth.js:95`** — e a do servidor, que estava fora do teste, é a
que decide **403**. Divergir ali tranca todo usuário autenticado para fora do
próprio save.

Guard **comportamental**: executa as três sobre 7 e-mails escolhidos pelos modos
de falha reais (caixa, espaço em volta, `+tag`, acento). Não olha nome de função
nem texto — uma reescrita que mude a forma e preserve o resultado passa.

**Autoverificação:** uma quarta implementação sintética com os quatro defeitos
que já existiram ou que uma edição descuidada produz — salt `digiapp:` (o bug
real), sem `slice(0,32)` (403 em todo mundo), sem `toLowerCase`, sem `trim` — e
o teste exige que **cada um** divergisse.

### 6.4 `desktop/renderer/src/cloudSync.test.ts` — o guard que não enxergava

**Achado sobre o aparato de QA, medido:** o bloco "tabelas copiadas continuam
iguais às do jogo" declarava uma **TERCEIRA cópia dos números dentro do próprio
teste** e comparava *ela* com o jogo. O `cloudSync.ts` real nunca era lido.

Medi: troquei `champion: 5` por `9` na tabela de energia do `cloudSync.ts` →
**15 passaram, 0 falharam**. Era o footgun 9 acontecendo **dentro do guard que
existe para pegar o footgun 9** — exatamente o que o `CLAUDE.md` conta sobre o
`simulateReset`.

**Corrigido:** as tabelas viraram `export` e o teste compara **as reais**. Mais
um caso exigindo que todo nível de `FORM_REQUIREMENTS` exista nas duas tabelas
(o `?? 3` / `?? 4` dos call sites transforma nível faltando em número plausível e
errado). **Verificado:** o mesmo drift de energia agora fica vermelho.

### 6.5 `src/deploy/swCache.contract.test.ts` — service worker vs. deploy (16 casos)

A pergunta original — *"usuário com SW antigo recebe deploy novo?"* — **continua
não sendo reproduzível daqui**: exige dois deploys reais e um navegador com o SW
anterior instalado. A rodada 4 se recusou a inventar um resultado e eu mantenho
essa recusa.

**O que dá para travar mecanicamente, e travei:** o modo de falha "JS novo preso
em cache velho" só existe se uma destas seis invariantes cair —

1. **todo asset do `dist/index.html` tem hash de conteúdo no nome** → build novo
   = URL nova = o handler cache-first nunca alcança o bundle velho (+ um caso
   que exige que cada asset referenciado **exista** em `dist/`, que é o
   white-screen oposto);
2. **`PRECACHE_URLS` não contém JS/CSS nem `/assets/`** → o precache do install
   não consegue fixar uma versão;
3. **navegação é network-first** — verificado por *posição* (`fetch` antes de
   `caches.match`) e proibindo explicitamente o padrão
   `caches.match(...).then(c => c || fetch(...))`;
4. **`activate` apaga toda chave que não seja a atual**, e o prefixo do filtro
   é comparado com o prefixo real dos nomes (senão o bump vira placebo);
5. **`skipWaiting` + `clients.claim`** → o SW novo assume na primeira carga;
6. **`_headers`: `/sw.js` e `/index.html` são `no-store`** → o navegador não
   pode servir SW nem HTML velhos do cache HTTP; e `/assets/*` **pode** ser
   `immutable` justamente por causa de (1).

**Conclusão que isto sustenta:** enquanto as seis valerem, **esquecer o bump do
`CACHE_VERSION` não prende ninguém num bundle velho.** O bump é load-bearing em
**um** caminho só, e o teste o documenta em vez de fingir que cobre: o
**fallback offline** (`caches.match('/index.html')` serve a cópia gravada no
install do SW). Sem rede, e só sem rede, o usuário vê o HTML da instalação.

**Prova de que enxerga:** degradei o `sw.js` (bundle no precache + navegação
cache-first) → **3 casos vermelhos**.

---

## 7. Auditado e SEM achado (registrado para não reauditar)

- **`computeDailyReset` não tem segunda cópia.** Varri `src/`, `desktop/` e
  `android/app/src/main/java` por `simulateReset`, `heartsLost`, `dayWasPerfect`
  e reimplementações de `perfectDay`: todos os consumidores leem
  `lastDayReport` do estado. A regra tem dono de verdade.
- **O widget Android não copia regra de jogo.** `WidgetRenderer.kt`,
  `DigiWidgetPlugin.kt` e `DigiAppWidgetScreenProvider.kt` não contêm
  `FORM_REQUIREMENTS` nem as tabelas de HP/energia — renderizam valores que
  chegam prontos por SharedPreferences.
- **`careRules.ts` é importado pelo desktop, não copiado** (confirmado no
  `cloudSync.ts:9`). O `stageLevel` local continua coberto pelo teste de
  paridade existente.
- **`isDayPerfect` (`useProgressTracking.ts:74`) é código morto** — nenhum
  consumidor. Sorte: ele é uma terceira definição de dia perfeito
  (`dailyDone === dailyTotal`, sem energia), e teria virado divergência de UI se
  alguém o tivesse plugado. **Não removi** (mexer em hook fora do meu escopo de
  fix pequeno), mas fica registrado como candidato a apagar.
- **`Math.floor(required / 2)` (desconto de degeneração) está duplicado** em
  `App.tsx:1585` e `dailyReset.ts:320`. **Não diverge hoje** — mesma fórmula,
  mesma fonte, mesmo resultado — então não subi para achado. É dívida da mesma
  família e um candidato natural ao próximo dono extraído.

---

## 8. O que continua CONSCIENTEMENTE sem cobertura

Esta lista existe para ninguém confundir "o loop parou" com "está tudo coberto".

| # | o quê | por que não foi coberto |
|---|---|---|
| 1 | **`workers/` no ar ≠ `workers/` no repo** | O guard prova que as três árvores concordam **no repositório**. Não existe nada que prove que o worker **publicado** é o do repo — `wrangler deploy` é manual e não deixa rastro versionado. Um `git push` sem `wrangler deploy` deixa o guard verde e o push das 21h vivo. Fecha com CI (fora do meu escopo) ou com um endpoint de versão no worker. |
| 2 | **Last-write-wins do cloud save entre dois aparelhos** | Aberto desde a rodada 3. Exige `savedAt`/`version` no save e política de merge no `save.js` — desenho de produto. Recomendação registrada na rodada 4 §6 (409 + save do servidor). |
| 3 | **"Usuário com SW antigo recebe deploy novo", ponta a ponta** | Exige dois deploys reais e um navegador com o SW anterior instalado. O §6.5 fecha as **invariantes**, não o experimento. O fallback offline segue dependendo do bump manual do `CACHE_VERSION`. |
| 4 | **As 122 chamadas cruas de `localStorage` em `src/`** | Fora do meu escopo nesta rodada (outro agente está migrando). Não toquei em nenhuma. |
| 5 | **`minSdkVersion = 24` vs. `oklch()` (STATUS §5)** | 🔴 já aberto e registrado, de produto/CSS. Não é fronteira de regra. |
| 6 | **Duplicação "via variável intermediária"** | O guard de origem do §6.1 declara que não pega essa forma. A camada de acoplamento pega **por resultado** — mas só para as regras que têm camada de acoplamento (meta do dia, perda de coração, saveId, push). Regras sem ela ficam só com regex. |
| 7 | **Tom/idioma do texto novo** | Os guards travam que o texto **é o mesmo nas três árvores**. Nenhum deles julga se o texto é bom. Se alguém escrever uma cobrança nova em `_pushCopy.js` e no cliente, tudo fica verde. |
| 8 | **`functions/api/save.js:75`** — `JSON.parse` do KV sem `try/catch` | Herdado da rodada 4 §7: entrada corrompida vira 500 em vez de `found: false`. Continua aberto, continua barato. |
| 9 | **`_rateLimit.js:57`** — falha aberto acima de `MAX_TRACKED` | Herdado da rodada 4 §7: comportamento declarado no código, sem teste. |

---

## 9. Arquivos tocados

```
NOVOS
  functions/api/_pushCopy.js                  (dono do texto + horário do push)
  functions/api/saveId.parity.test.js         (13 casos, 4 impls sintéticas de autoverificação)
  workers/pushCopy.parity.test.js             (13 casos, verificado nas 2 pontas ×2)
  src/utils/dailyGoal.contract.test.ts        (11 casos, verificado nas 2 pontas)
  src/utils/dailyGoalSources.test.ts          (13 casos, 2 controles negativos)
  src/deploy/swCache.contract.test.ts         (16 casos, verificado nas 2 pontas)

ALTERADOS
  src/utils/dailyReset.ts       (+ dailyGoalFor, registeredForDay, activitiesForWeekDay,
                                   tasksCompletedOn, rawHeartsLostFor, tasksToAvoidHeartLoss)
  src/App.tsx                   (3 call sites: totalRequired, toast de ganho, banner de HP)
  workers/push-scheduler.js     (getNotification → import de _pushCopy; hora sem texto = sai cedo)
  workers/wrangler.toml         (cron das 21h removido)
  workers/push-scheduler.test.js         (hora 21 saiu do loop; a AUSÊNCIA virou asserção)
  desktop/renderer/src/cloudSync.ts      (tabelas viraram export, só para paridade)
  desktop/renderer/src/cloudSync.test.ts (compara as tabelas REAIS, não uma 3ª cópia)
  dist/**                                (subproduto do `npm run build`)
```

Nenhum teste existente foi afrouxado. `.github/`, `src/index.css`, assets,
`src/components/` e todo call site de storage em `src/` ficaram intocados.

---

## 10. Critério de parada para a rodada 6 — e por que não é "mais uma leitura"

O erro do meu critério da rodada 4 foi supor que *"rodar o guard"* fosse um
evento único. Não é: o guard é um instrumento **novo**, e a primeira passagem de
um instrumento novo sempre acha o estoque acumulado. Cinco achados numa rodada
não medem a saúde do código — medem que ninguém tinha comparado antes.

**O critério que proponho agora não é sobre quantidade, é sobre quem acha:**

> A rodada 6 roda **os guards que já existem**, sem escrever guard novo, e
> **estende a camada de acoplamento** (executar as duas implementações e comparar
> o número) às regras que hoje só têm regex. Se os defeitos que ela achar forem
> achados **pelos guards** e não pela leitura de um agente, **o loop para** — não
> porque acabaram os defeitos, mas porque o achado deixou de depender de alguém
> estar olhando.

O sinal de que o loop **não** pode parar é o inverso: um agente lendo achar algo
que os guards não viram. Foi o que aconteceu hoje três vezes (§2, §4, §5) — e é
por isso que a resposta desta rodada é **não**.

Duas coisas dependem do dono e não de outra rodada:

1. **`wrangler deploy` dentro de `workers/`** — sem isso, o push das 21h continua
   saindo em produção, com o repositório verde.
2. **Decidir se o item 1 do §8 vira CI.** É a única coisa que transforma "as
   árvores concordam no repo" em "as árvores concordam no ar".
