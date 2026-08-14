# Rodada 4 — auditoria do código que as rodadas 1–3 produziram

> Papel: `qa-sweeper`. Alvo: a superfície NOVA (safeStorage/GameStateContext,
> `_rateLimit`, `_redact`, a UI pixel + Evolução reescrita, CSP + aviso de WebView)
> e os 4 pontos cegos que o `skeptic-review` deixou intocados.
> **Nada commitado, nada empurrado.** Nenhum teste existente foi afrouxado.
> `.github/` não foi tocado.

## 0. Portões (números reais, rodados agora)

| Portão | Comando | Resultado |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | **exit 0, sem saída** |
| Testes | `npx vitest run` | **53 arquivos · 685 testes · 685 passam · 0 falham** (baseline 51/662 → **+2 arquivos, +23 casos**) |
| Build | `npm run build` | **✓ built in 3,31s**, 112/112 PNG→WebP (−7,08 MB), `✨ Compiled Worker successfully` |

---

## 1. Resposta direta à pergunta do loop

**A taxa de achado NÃO caiu — mas a natureza mudou, e é isso que importa mais.**

Achei **3 defeitos reais** (1 🔴, 2 🟠). Os três estão exatamente onde o
`skeptic-review` §5 previu: **fronteiras sem dono**. E dois deles são de um
subtipo novo e desconfortável:

> **as rodadas 1–3 corrigiram o problema em UM call site e deixaram os outros.**

- O 🔴 (galho previsto ≠ galho entregue) existe porque a rodada que criou o
  `activityLog` atualizou a leitura da UI e **não** a da cerimônia de evolução.
- O 🟠 do save existe porque a rodada 3 blindou o `GameStateContext` e deixou
  **os 4 call sites que substituem o save inteiro** com `setItem` cru.

Ou seja: **o próprio ato de corrigir criou fronteira nova.** A diagnose do
skeptic ("a suíte mede intenção, não efeito") sobrevive intacta, e ganha um
corolário: *um fix aplicado por arquivo, e não por regra, é um fix que nasce
divergente.*

**O loop NÃO pode parar ainda** — mas o critério de parada mudou. Ver §7.

---

## 2. 🔴 O galho PREVISTO não é o galho ENTREGUE

**`src/App.tsx:924` (antes: `computeCarePattern(prev.completedTasks)`) vs. `src/App.tsx:2173`**

O `CLAUDE.md` e o `STATUS.md` §2 declaram a regra: o ritmo de cuidado lê
`completedTasks` **+ `activityLog`** — "sem o log, o ritmo ficava cego justamente
para o mecanismo principal de hábito". Duas chamadas da mesma regra:

| onde | histórico lido | quem usa |
|---|---|---|
| `App.tsx:128` → `carePatternReading` → `EvolutionPath forecastBranch` (`:2173`) | tarefas **+ activityLog** | o que a **tela promete** |
| `App.tsx:924`, dentro do `setGameState` da evolução | **só `prev.completedTasks`** | o galho que o jogador **recebe** |

### Cenário concreto (é o teste que escrevi, com os números)

Jogador que cumpre hábito por **atividade recorrente** (o mecanismo principal do
app): 0 tarefas avulsas, 8 dias seguidos com atividade concluída. Atributos
empatados no topo em `virus: 6, vaccine: 6` (`data: 2`, e `data` é o
`currentBranch` do save).

- Página de Evolução: leitura **confiável**, ritmo `constante` → prevê e escreve
  na tela **Harmonia (vaccine)**.
- Cerimônia: `computeCarePattern([])` → `total = 0 < MIN_TASKS_FOR_CONFIDENCE (5)`
  → `confident: false` → `resolveBranch` cai no fallback `data`, que não lidera →
  `leaders[0]` = **Vírus**.

O jogador vê "Seguindo para Harmonia", toca na criatura, e evolui para Vírus.
**Evolução é irreversível pela via normal** (só a degeneração desfaz, com dupla
confirmação) — é o ato mais alto-valor do jogo entregando o oposto do que a tela
acabou de prometer. Nenhum dos 662 testes olhava para isso: `carePattern.test.ts`
testa a função pura, e a divergência vive no orquestrador.

**Corrigido.** Extraí `careHistory(state)` (`src/utils/carePattern.ts:116-134`) —
função única que junta as duas fontes — e os dois call sites passaram a usá-la.

**Regressão travada:** `src/utils/careHistory.contract.test.ts` (6 casos).
Verificado **nas duas pontas**: revertendo só a linha 924 para a forma antiga,
2 dos 6 casos ficam vermelhos (medido, não afirmado). O guard de origem tem
**caso de autoverificação** provando que a regex enxerga a forma defeituosa.

---

## 3. 🟠 Adotar save da nuvem trocava a IDENTIDADE sem o DADO

**`src/App.tsx:338`, `:1627`, `:2224`, `:2236` (linhas originais)** — os quatro
únicos lugares que **substituem o save inteiro**.

Todos faziam, com `localStorage.setItem` **cru** e nesta ordem:

```js
localStorage.setItem(STORAGE_KEYS.SAVE_ID, novoId);        // pequeno, sempre passa
localStorage.setItem(STORAGE_KEYS.GAME_STATE, gigante);    // ← lança com storage cheio
window.location.reload();                                  // ← nunca acontece
```

A rodada 3 criou o `safeStorage` justamente porque essa exceção existe — e parou
no `GameStateContext`. **Restam 122 chamadas cruas de `localStorage.*` em `src/`**
(`rg -c`, sem testes); estas 4 são as que mexem no save.

### Cenário concreto

Origem **compartilhada com o DigiApp** (`CLAUDE.md`), storage perto do teto.
Usuário abre Configurações → "entrar com e-mail" para puxar o save do celular:

1. `SAVE_ID` e `USER_EMAIL` gravam (bytes de sobra) — **a identidade já trocou**;
2. `GAME_STATE` (o save inteiro) estoura `QuotaExceededError`;
3. o `throw` sobe numa função `async` passada como prop → **rejeição não tratada**,
   sem reload, sem toast. Para o usuário, **o botão não fez nada**;
4. o `GameStateProvider` segue com o estado **local antigo** e, no próximo
   `setGameState`, o debounce de 3 s sobe **esse estado antigo para o `saveId`
   novo** — sobrescrevendo, em silêncio, o save do outro aparelho.

Perda de save é o moat. E é a mesma classe do ponto cego nº 5 do skeptic
(last-write-wins entre aparelhos), só que disparada por storage cheio em vez de
por rede.

**Segundo defeito na mesma linha:** `existing` vem do servidor como `unknown` e
ia direto para `JSON.stringify`. Um `[]` ou `"oi"` (entrada legada no KV — a
validação de escrita do `save.js:90` só existe desde a rodada anterior) é
**truthy**, apagava o save local, e o guard novo do provider transformava isso
em estado zerado. Ou seja: o guard da rodada 3 trocou "estado vazio" por "estado
vazio **depois de destruir o local**".

**Corrigido.** `adoptCloudSave(saveId, state, email?)`
(`src/utils/cloudSave.ts:87-121`): valida objeto simples, grava **o dado primeiro
e a identidade depois**, usa `writeLocal`, nunca lança, devolve
`'ok' | 'invalid' | 'storage'`. Os 4 call sites passaram a usá-la; nenhum
recarrega a página sem `'ok'`. O caminho do login em Configurações lança para o
`catch` que já existe (mostra estado de erro) em vez de recarregar num id sem
save por trás.

**Regressão travada:** `src/utils/adoptCloudSave.test.ts` (13 casos), com
**autoverificação do instrumento** (um caso prova que o storage falso realmente
lança `QuotaExceededError` no `GAME_STATE` e não no `SAVE_ID` — sem ele o teste
passaria com um storage que nunca falha) e guard de origem com autoverificação.

**Bônus na mesma varredura:** `cloudSave.ts:40` carimbava
`digiapp-last-cloud-sync` com `setItem` cru **dentro do próprio `try`** — com o
storage cheio, um save que o servidor **aceitou** era relatado como `false`.
Trocado por `writeLocal`.

---

## 4. 🟠 O teto por IP rodava ANTES do cache — falso positivo de graça

**`functions/api/community.js:153-178`**

A ordem era `teto → cache → handler`, e está escrita como intencional no
comentário. O efeito é o inverso do objetivo declarado do módulo:

> um **acerto de cache de borda custa ~zero leitura de KV** e mesmo assim
> consumia uma das **20 varreduras/min/IP**.

Um teto que existe **por custo** recusando requisição **sem custo** só produz
dano. E o dano cai exatamente onde a tarefa mandou olhar:

### Cenário concreto (CGNAT / escola / empresa)

30 alunos com o Soulmon atrás do NAT da escola, um `CF-Connecting-IP` único. A
aba **Torneio → ranking** (`action=rank`) e o diretório (`action=players`) são
respostas **públicas e idênticas para todos** — o caso perfeito de cache. Com
1 abertura de ranking por aluno em um minuto, **do 21º em diante todo mundo leva
429**, para uma resposta que já estava na borda e não custaria nada. O cliente
traduz isso em lista vazia. É o modo de falha que o próprio `_rateLimit.js`
declara querer evitar ("falhar fechado aqui derrubaria o app inteiro").

**Corrigido.** Ordem invertida para `cache → teto → handler`, e o teto agora é
escolhido pelo custo real: **acerto de cache paga o teto LEVE (120/min)**, e o
teto PESADO (20/min) só é cobrado de quem vai mesmo varrer o KV.

**Regressão travada:** 4 casos novos em `functions/api/costCeiling.test.js`,
incluindo **autoverificação** (o cache falso realmente responde com 0 leituras de
KV) e o **controle negativo** que impede o afrouxamento: *sem* cache, a 21ª
varredura continua 429. Verificado nas duas pontas — restaurando a ordem antiga,
o caso dos 50 acertos fica vermelho.

---

## 5. Auditado e SEM achado (registrado para não reauditar)

### 5.1 `_redact.js` — medido com corpus, não lido

Rodei 16 mensagens realistas de chat com o pet contra `minimizeForAi`. **3
mudaram**, e as 3 são inofensivas:

| entrada | saída |
|---|---|
| `consegui 100 200 300 pontos no dino` | `consegui [número] pontos no dino` |
| `perdi 1 2 3 4 5 6 tarefas` | `perdi [número] tarefas` |
| `liguei 11 98765 4321` | `liguei [telefone]` (correto) |

Causa dos dois primeiros: a regra `digits` (`\b\d[\d\s.-]{9,}\d\b`) trata espaço
como separador. **Não corrigi**: apertar a regra reabre o vazamento de cartão
`4111 1111 1111 1111`, que é o caso que ela existe para pegar, e o dano de
substituir um placar por `[número]` numa frase de chat é nulo. Registro como
observação medida, não como defeito.

Sobreviveram intactos: `tô triste hoje`, `te amo <3`, `me sinto 100% melhor`,
`hoje é 10/08/2026 e eu fiz tudo`, `estudei das 14 00 as 18 00 hoje`. **O produto
não quebra.**

**Sobre o teste de saúde:** ele prova o que afirma. `expect(text).toContain('depressão')`
sobre `'estou em depressão e não consigo levantar'` é asserção literal do texto
de saída — não é tautologia nem mock. É honesto e está corretamente rotulado
como declaração de limite, não como proteção.

### 5.2 CSP e o aviso de WebView antigo

- **`connect-src`**: o app usa **só** `sendSignInLinkToEmail`/`signInWithEmailLink`
  (`src/utils/auth.ts:58,92`) — zero `signInWithPopup`. Isso importa: popup
  carregaria `https://apis.google.com/js/api.js`, que o `script-src 'self'`
  bloquearia. Não há esse caminho. `identitytoolkit`/`securetoken`/
  `fcmregistrations` estão todos sob `*.googleapis.com`. **OK.**
- **Fontes**: `rg` não achou `fonts.googleapis`/`@font-face` externo. `font-src
  'self' data:` é suficiente. **OK.**
- **Groq**: sai da nossa borda (`/api/chat`), nunca do navegador. **OK.**
- **Aviso de WebView** (`index.html:30-97`): escrito só em ES5 (`var`, `function`,
  sem template literal, sem arrow) — se ele mesmo usasse sintaxe nova, morreria no
  parse junto com o bundle, que é a armadilha óbvia desse padrão. **Não caiu
  nela.** Em navegador moderno o `CSS.supports` retorna cedo (`:53`) antes de
  tocar no DOM; se rodasse, o `createRoot().render()` substitui `#root`. Monta com
  `createElement`+`textContent`, sem concatenação de HTML. **Sem achado.**
- Os 3 hashes do `_headers:40` continuam batendo com `index.html` **e**
  `dist/index.html` depois do build (`src/security/csp.test.ts`, 33 casos verdes
  pós-build).

### 5.3 UI nova (PixelKit / HomeHud / SoulNode / nodeArt / EvolutionPath)

A regra de galho **não** foi reimplementada na página: `forecastBranch` chega
pronta de `resolveBranch` (`App.tsx:2173`) e o `EvolutionPath` só escolhe o nó a
destacar. **A regra está com dono.** Achado disso é o §2, que é do orquestrador,
não da UI.

Uma **observação** (não é defeito): `EvolutionPath.tsx:73-75` recalcula o
*empate* localmente com `topAttr > 0`. Com atributos `0/0/0` — o dia 1 de todo
jogador — `resolveBranch` **usa o ritmo** (`carePattern.ts:138`) mas a tela diz
`isTie: false` e não explica de onde veio o galho. Não há divergência de
resultado, só de explicação. Não mexi: mudar texto de UI não é meu papel aqui.

---

## 6. Pontos cegos do skeptic — status honesto

| # | ponto cego | status desta rodada |
|---|---|---|
| 5 | **Conflito entre dois aparelhos** (last-write-wins sem versão) | **Parcialmente coberto.** Fechei a rota de perda por storage cheio (§3), que era um gatilho concreto do mesmo dano. **O last-write-wins em si continua ABERTO** — exige `version`/`updatedAt` no save e uma política de merge no `save.js`. É desenho de produto, não fix pequeno. **Recomendação, não fiz:** carimbar `savedAt` no cliente e o `save.js` recusar POST cujo `savedAt` seja mais antigo que o gravado, devolvendo 409 com o save do servidor — o cliente aí pergunta ao jogador. É a menor mudança que transforma perda silenciosa em escolha. |
| 6 | **Crescimento do `localStorage`** | **MEDIDO — não é risco.** `completedTasks` (`types:187`) não tem teto, e é a única estrutura que cresce sem limite; cada entrada serializa em ~130 bytes (`id`, `name`, `category`, `emoji`, `completedAt`). Um usuário de **4 tarefas/dia → ~190 kB/ano**. `activityLog` tem teto de 90 (~2,7 kB). Contra a cota de ~5 MB por origem (dividida com o DigiApp) e o teto de 5 MB do `save.js:31`, isso dá **mais de uma década**. Fecho este ponto cego com número: não vale código. |
| — | **Service worker vs. deploy** (`CACHE_VERSION` manual, v41) | **CONTINUA ABERTO.** Não testei "usuário com SW antigo recebe deploy novo" — exige dois deploys reais e um navegador com o SW anterior instalado; não é reproduzível a partir daqui sem inventar um resultado. Não inventei. |
| — | **Deriva `workers/` ↔ `functions/`** | **CONTINUA ABERTO.** Herdado das rodadas 2 e 3 e ainda válido: deploy manual, nada no CI compara. É um guard barato de escrever (diff dos módulos duplicados) e não cabia no orçamento desta rodada sem cortar um dos três defeitos acima. **Recomendo como primeiro item da rodada 5.** |

---

## 7. Observações menores (não são achados — sem cenário de dano)

- `functions/api/_rateLimit.test.js:56-63` — o caso "IPs rotativos não viram
  vazamento" assere só `not.toThrow()`. Não mede o `Map`. O comportamento real
  (`_rateLimit.js:57`: acima de `MAX_TRACKED` **falha aberto**, deixando passar
  chave nova) está declarado no código mas **não tem teste**. É teto de custo por
  desenho, então não subo a severidade — mas o teste afirma menos do que o nome
  promete.
- `functions/api/save.js:75` — `JSON.parse(raw)` do KV sem `try/catch`: uma
  entrada corrompida vira 500 em vez de `found: false`.
- `src/components/SettingsPage.tsx:358-362` — `localStorage.setItem` dentro de um
  updater do `setState` (footgun nº 6). Inócuo aqui porque o valor gravado é
  idêntico nas duas invocações do StrictMode, mas é o padrão que o `CLAUDE.md`
  proíbe.
- 122 chamadas cruas de `localStorage.*` continuam em `src/` fora de testes. As 4
  que mexiam no save foram fechadas; as demais gravam preferências (tema, idioma,
  horários) — falha ali degrada configuração, não progresso.

---

## 8. Arquivos tocados

```
NOVOS
  src/utils/careHistory.contract.test.ts        (6 casos, verificado nas 2 pontas)
  src/utils/adoptCloudSave.test.ts              (13 casos, com autoverificação)

ALTERADOS
  src/utils/carePattern.ts                      (+ careHistory)
  src/utils/cloudSave.ts                        (+ adoptCloudSave; writeLocal no carimbo)
  src/App.tsx                                   (2 call sites do ritmo, 4 da adoção)
  functions/api/community.js                    (ordem cache → teto)
  functions/api/costCeiling.test.js             (+4 casos, com controle negativo)
  dist/**                                       (subproduto do `npm run build`)
```

Nenhum teste existente foi afrouxado. `.github/`, `src/index.css`, assets e
`src/components/` não foram tocados.

---

## 9. Veredito: o loop pode parar?

**Não nesta rodada. Provavelmente na próxima, e com um critério diferente.**

O argumento honesto, dos dois lados:

**A favor de parar:** os defeitos estão ficando mais baratos. Nenhum dos três
desta rodada é arquitetural; os três somam ~40 linhas de fix. Nenhum é erro de
regra de jogo — a diagnose do skeptic segue 3/3 correta, e regra de jogo em
`utils/` continua sendo a parte mais sólida do projeto.

**Contra parar:** a rodada 4 achou **1 🔴 em cima do código da rodada anterior**.
Isso é o sinal que importa: enquanto cada rodada de correção continuar produzindo
fronteira nova, uma rodada a mais continua tendo retorno. E o padrão dos dois
achados novos é específico e verificável — **fix aplicado por arquivo em vez de
por regra**. Não é aleatório; é auditável.

### O critério de parada que proponho para a rodada 5

Não é "achar pouco". É: **rodar um guard de duplicação de regra** — para cada
regra com dono declarado (`careRules`, `carePattern`, `dailyReset`,
`safeStorage`, `storageKeys`, o `saveId` do desktop), listar TODOS os call sites
e provar que nenhum reimplementa nem lê uma fonte diferente. Os dois achados
desta rodada teriam caído nesse guard **antes de existirem**, e o footgun nº 9 do
`CLAUDE.md` já diz que essa é a classe de erro cara do projeto.

Se a rodada 5 rodar esse guard, fechar a deriva `workers/`↔`functions/` e não
achar 🔴/🟠, **aí o loop para com evidência**, e não por cansaço.
