# Rodada 2 do sweeper — atacando a causa estrutural

> Termos renomeados em 29/09/2026: vírus→poder, dado→harmonia, vacina→benevolência.

> `qa-sweeper`, run `soulmon-01`. Alvo: o diagnóstico do `investor-skeptic` —
> **"a suíte mede intenção, não efeito"** — e não mais os sintomas.
> Nada foi commitado nem enviado. Nenhum teste existente foi afrouxado.

---

## 0. Resumo em cinco linhas

A prova mecânica do skeptic era `vitest.config.ts:4` → `environment: 'node'`: **nenhum
teste montava um componente**. Isso acabou. Existe agora um ambiente de render com o
`index.css` REAL aplicado, com autoverificação, e **15 arquivos de teste novos / +187
casos** cobrindo cinco fronteiras que não tinham dono: JSX↔CSS, asset↔renderer,
rota-de-dinheiro↔HTTP, worker↔KV e save-legado↔código-novo. **600 testes verdes** (era 413).
Achei **quatro defeitos reais** — três deles em fronteiras, um deles visível em produção
hoje — e **um** deles é erro de lógica dentro de `utils/`-like. O placar da previsão do
skeptic está no §6.

---

## 1. Infra de render criada

### 1.1 `vitest.config.ts` — três mudanças, todas de fronteira

| Mudança | Por quê |
|---|---|
| `resolve: { alias }` **reusado de `vite.config.ts`** | `vitest.config.ts` era um config INDEPENDENTE. Os aliases (`figma:asset/*`, `@/*`) só existiam no config de build, então qualquer teste que importasse `CompanionHUD` morria em `Failed to resolve import "figma:asset/7e77…png"`. **Essa era uma das razões mecânicas de nunca ter existido teste de componente.** Importei a tabela do build em vez de copiá-la (footgun 9) |
| `environmentOptions: { jsdom: { url: 'http://localhost:3000/' } }` | Em origem opaca (`about:blank`) o `localStorage` do jsdom fica sem métodos. Medido em `CompanionHUD.tsx:228` (`localStorage.getItem is not a function`) |
| `include` + `coverage.exclude` ganham `workers/**/*.test.js` e `src/test/**` | `workers/` estava fora do coletor de testes — o medidor já o incluía, então marcava 0% para sempre |

**`environment: 'node'` continua sendo o padrão.** Os testes de render pedem jsdom
**por arquivo**, com `// @vitest-environment jsdom` na primeira linha. Zero risco para os
413 testes de regra pura, e o custo do DOM só é pago por quem precisa dele.

### 1.2 `src/test/renderEnv.tsx` — o ambiente

`renderWithCss(<Componente/>)` monta o componente **com o `src/index.css` de produção
dentro do documento** e permite medir o estilo **computado**. É isso que fecha a fronteira
JSX↔CSS: o checkbox de 2px não era erro de JSX nem de CSS, era uma classe usada de um lado
que não existia do outro.

Duas limitações estão escritas no cabeçalho do arquivo, não escondidas:

1. **jsdom ignora `@layer`.** Medido: `.shrink-0` (dentro de `@layer utilities`) computava
   `flex-shrink: 1` com o CSS cru. Por isso o carregador **desembrulha** os `@layer`. Isso
   altera a PRECEDÊNCIA — o ambiente responde bem a *"esta classe declara este valor?"* e
   mal a *"qual regra ganha entre duas concorrentes"*. Os testes escritos só fazem a
   primeira pergunta.
2. **Sem layout.** `getBoundingClientRect()` é sempre 0 no jsdom. Alvo de toque é verificado
   pelo `width`/`height` **declarado** (o que a regra diz), não pela caixa pintada. Isso
   pega o modo de falha real (a regra não existe → sem largura) e **não** pega
   "a regra existe mas um pai esmaga o filho". Fica declarado.

### 1.3 `src/test/renderEnv.selfcheck.test.tsx` — 7 casos que provam que o ambiente ENXERGA

Sem isto o guard passaria sempre, pelo motivo errado. Ele afirma, entre outros:

- `w-7` / `h-7` — **as classes exatas do bug de 2px** — computam `width: auto`, ou seja
  o elemento não recebe largura nenhuma;
- `w-11` (que existe) computa valor, provando que a diferença é a classe e não o detector;
- `shrink-0` computa `0` **só depois** do desembrulho de `@layer` (o caso trava a
  necessidade do desembrulho);
- uma classe inventada computa vazio (controle negativo);
- o `index.css` lido tem >50 kB e contém `.sm-px-check` (não é arquivo vazio nem mock).

---

## 2. Testes por fronteira — o que cada um afirma

| Arquivo | Fronteira | O que AFIRMA (efeito observável) |
|---|---|---|
| `src/test/renderEnv.selfcheck.test.tsx` (7) | teste ↔ ambiente | O detector acusa classe ausente e não acusa classe presente |
| `src/components/pixel/PixelKit.render.test.tsx` (19) | JSX ↔ CSS | **Alvo do checkbox = 44×44 computados do CSS real** (o teste que teria pego o bug de 2px); o quadrado desenhado (26px) é MENOR que o alvo; `aria-checked` muda; par PT/EN; desabilitado não dispara; `PixelSegmentedBar` acende exatamente 2 de 4 e satura em vez de estourar com `value=99` e `value=-5`; `max=0` não explode; `PixelButton` tem `min-height: 48px` e injeta a arte 9-slice como variável CSS |
| `src/components/TaskCard.render.test.tsx` (9) | ação central do app | Os **dois** alvos da ficha têm ≥44px; marcar dispara com o id certo; **tarefa concluída não pode ser marcada de novo** (dupla contagem); os dois conjuntos de `aria-label` PT e EN são completos **e diferentes entre si**; nome vazio e nome de 5000 chars não removem o botão de editar |
| `src/components/StepRow.render.test.tsx` (6) | alvo de toque | Etapa = 44×44 (o relatório da UI mediu 40 e chamou de "regressão silenciosa esperando acontecer" — agora trava); só **uma** parada de teclado por etapa; rótulo acessível carrega o texto da etapa nos dois idiomas |
| `src/components/ActivityCard.render.test.tsx` (12) | progresso ↔ leitura | Barra e número concordam (2/4, dois blocos acesos); atividade com etapas **não** mostra checkbox próprio; desabilitada não move etapa; dias da semana no idioma certo e ausentes em execução única |
| `src/components/BottomNav.render.test.tsx` (9) | navegação só-ícone ↔ leitor de tela | Os 6 botões têm rótulo não-vazio; par PT/EN completo; **exatamente uma** aba acesa e é a certa (e nenhuma quando a view não é da barra); o menu abre, mostra só as ações que têm handler, e o backdrop fecha |
| `src/components/pixel/HomeHud.render.test.tsx` (7) | guardrail das 3 moedas ↔ HUD renderizado | **O HUD não escreve "Bits" nem usa `icon-coin`, e o `icon-gem` aparece exatamente uma vez**; a cápsula de Créditos é botão com alvo de 44; "SOUL CRYSTAL" não aparece; `0/0` e créditos negativos não quebram |
| `src/components/CompanionHUD.render.test.tsx` (10) | tela principal ↔ rede | **"Rede caída não emudece o pet" — agora MEDIDO** (`useAI` ligado + `fetch` rejeitando → o balão fala local, em PT e em EN). Botão "Evoluir" só existe com `canEvolve` e some dormindo — item que o relatório da UI listou como "sem verificação visual" em **duas** rodadas; `left: 50%` inline continua inline (footgun 1) |
| `src/assets/assets.contract.test.ts` (14) | **asset ↔ renderer** | §3 |
| `functions/api/billing.test.js` (26) | rota de dinheiro ↔ HTTP | §4 |
| `functions/api/entitlements.test.js` (27) | rota de dinheiro ↔ HTTP | §4 |
| `workers/push-scheduler.test.js` (11) | worker ↔ KV/FCM | §4 |
| `src/contexts/GameStateContext.legacySave.test.tsx` (16) | save legado ↔ código novo | §5.1 |
| `src/contexts/GameStateContext.hostile.test.tsx` (10) | save hostil / storage | §5.2 |
| `src/hooks/useDailyReset.clock.test.ts` (5) | regra ↔ relógio do aparelho | §5.3 |

---

## 3. Guard mecânico de asset — e o defeito que ele achou

`src/assets/assets.contract.test.ts` é o primeiro teste do projeto que **abre um PNG**.
Cobre três coisas, todas com autoverificação por imagem sintética:

| Verificação | Autoverificação |
|---|---|
| Xadrez de transparência assado nos pixels | Um xadrez sintético 8px é ACUSADO; arte limpa com contorno preto e fundo alfa **não** é (o contorno é neutro e legítimo) |
| Arquivo ilegível / 0 byte | Buffer de texto é rejeitado pelo decodificador |
| Pixel fora da paleta (magenta/roxo antigo) | `rgb(180,60,200)` é ACUSADO; teal `rgb(45,212,191)` e cobre `rgb(185,123,82)` medem **0%** |
| O escopo não está vazio | 199 assets varridos, 131 referenciados por `src/`, escopo do guard de xadrez >30 arquivos |

### 🔴 ACHADO A-1 — `src/assets/soulmon/icons/icon-reset.png` shipava um xadrez assado

**Arquivo:** `src/assets/soulmon/icons/icon-reset.png` · usado em
`src/components/BottomNav.tsx:11,150` ("Refazer o ritual" / "Redo the ritual").

**Medição antes:** `98,2% opaco`, `26,8% de cinza de xadrez`. Os ícones irmãos medem
42–48% de opacidade e ≤1% de cinza. Visualmente: um quadrado quadriculado cinza de
128×128 atrás do ícone.

**Cenário concreto:** qualquer usuário abre o menu sanduíche da barra inferior e vê um
bloco quadriculado no lugar do fundo transparente. **Está em produção hoje.** É o mesmo
defeito que o `nest-base.png` teve, na quarta instância do padrão asset↔renderer.

**Correção aplicada** (mínima e determinística, sem repintar arte): máscara por
**saturação + dilatação de 2px** — os pixels que não estão a ≤2px de nenhum pixel saturado
(a arte, que é cobre/teal) tiveram o alfa zerado. O contorno escuro do ícone é adjacente à
arte e sobreviveu. Resultado: `48,4% opaco / 0,6% de cinza`, alinhado com `icon-home.png`
(48,0%). Verificado visualmente antes e depois.

**Regressão travada:** `assets.contract.test.ts` → *"REGRESSÃO: icon-reset.png ficou com
opacidade de ícone, não de retângulo"* (`checkerPct < 2`, `opaquePct < 70`) + o guard geral
sobre toda arte de UI importada por `src/`.

### 🟡 ACHADO A-2 — o magenta da paleta antiga TAMBÉM está na arte que está no bundle

`ui/frontend-kit-round1.md` §2a afirma que só os PNGs `hover`/`active` trazem o halo
magenta, e que por isso o `normal` foi ligado. **Medindo, o `normal` também tem:**

| Arquivo (no bundle) | Magenta |
|---|---|
| `soulmon/ui/btn-sm.png` (← `button-normal-small.png`) | **0,65%** |
| `soulmon/ui/btn-md.png` | 0,21% |
| `soulmon/ui/btn-lg.png` | 0,03% |

É uma linha de contorno ameixa (~`rgb(98,21,86)`) na borda superior da moldura. Pouco, mas
existe, contra a regra "nenhuma cor fora dos tokens" — e o `btn-sm` é justamente a fatia do
`PixelButton size="sm"`.

Não repintei: é decisão de design e o dono da arte é outro. O guard **trava o teto medido**
(pode cair, não pode subir) e tem um caso companheiro que exige que o resíduo ainda EXISTA
— teto sem prova vira licença permanente.

### ⚪ Quarentena honesta (não é lista-cemitério)

Cada entrada é verificada **duas vezes**: o defeito precisa continuar existindo (senão a
entrada tem que sair) **e** o arquivo não pode estar importado por `src/`.

- `soulmon/icons/gemini-raw/icon-star.png` — 2.565 bytes, formato não suportado. Confirmado
  ilegível e confirmado **fora do bundle**.
- `button-hover-{small,medium,large}.png` (3,45–6,07% de magenta) e
  `button-active-{small,medium,large}.png` — a decisão de não ligá-los estava num
  **comentário** do `PixelKit.tsx`. Comentário não é guard; agora é teste.

### ⚪ `nest-base.png` — medido, ainda com resíduo, **não é meu**

Está **muito melhor** que o descrito no enunciado (não é mais 100% opaco: mede **18,7%**,
o xadrez saiu). Sobrou um bloco de cinza neutro opaco em `x≈174–200, y≈38–52` — o
"resíduo atrás da fumaça" do item 8 do backlog da UI. Fica **abaixo** do limiar do guard
(5%) porque é pequeno em relação à imagem, então o guard não o acusa. **Reporto e não
corrijo**: o arquivo está no backlog de outro agente e dois agentes editando o mesmo PNG
sem git é risco maior que o defeito.

---

## 4. Contrato nas rotas de dinheiro e no worker

Modelo replicado de `desktop/renderer/src/pushCareAction.test.ts`: **ligar no handler
real**, nunca num mock que devolve 200. O único ponto falsificado é o `fetch` para a LOJA
e o KV; `_billing.js`, `_entitlements.js` e `_auth.js` rodam de verdade.

### `functions/api/billing.test.js` — 26 casos (era 0% de cobertura)

A Steam é o provedor escolhido porque a verificação dela é 100% `fetch`; a Play exigiria
assinar um JWT com chave de serviço real e o teste passaria a medir criptografia.

O que trava, com **efeito no KV** (a resposta pode mentir, o KV não):

- compra verificada grava `tier: 'paid'` e o `orderId` em `ent:<saveId>`;
- **reenviar a mesma compra devolve `duplicate: true` e não concede duas vezes** (é o
  "restaurar compras" funcionando);
- **o comprovante vale para UMA conta**: a segunda leva `409 order-in-use` e fica **sem
  nada** — e o registro global aparece sob a chave `ord:`;
- **Family Sharing não herda a compra** (`steamid ≠ ownersteamid` → `family-shared`);
- não possui o app / ticket inválido / transação não paga / item desconhecido → nada
  concedido, e no caso do ticket inválido a posse **nem chega a ser consultada**;
- **microtransação de outro jogador** (`params.steamid` divergente) não credita;
- **microtransação sem ticket** é `402 missing-ticket` — o `orderid` sozinho não basta;
- 7 formas de entrada ruim (`action` ausente/desconhecida, provider desconhecido, saveId
  curto/ausente/com `../`, sem comprovante) → status certo e **KV com tamanho 0**;
- corpo não-JSON, KV não ligado (500 **antes** de falar com a loja), credencial ausente
  (503), loja lançando exceção e loja em HTTP 500 → nunca concede;
- **com `FIREBASE_PROJECT_ID` ligado e sem token: 401, e a loja nem é consultada** — a
  autorização vem antes;
- o preflight anuncia `Authorization`.

### `functions/api/entitlements.test.js` — 27 casos (era 0%)

- conta nova lê `demo/0` **sem gravar nada** no KV;
- **não vaza `consumedOrders`/`orderDetails`/`purchaseToken`** para o cliente;
- entitlement corrompido no KV degrada para conta zerada em vez de explodir;
- gasto válido debita **no KV**; saldo insuficiente é 402 e **não debita**;
- 8 formas de `amount` hostil (negativo, zero, fracionário, `NaN`, `Infinity`, objeto,
  ausente, `null`) recusadas **sem alterar o saldo** — cada uma dessas, aceita, é crédito
  criado do nada;
- anúncio recompensado **desligado por padrão** (501) e, ligado, respeita o teto diário do
  servidor (3 × 5 créditos, o 4º é 429);
- com auth ligada, **ler e gastar** saldo alheio são 401;
- **conferência de reembolso com a loja inalcançável MANTÉM o benefício** — na dúvida não
  se tira o que o jogador pagou.

> **Observado, não bug:** `entitlements.js:84` faz `Number(body?.amount)`, então
> `amount: '10'` é coagido e aceito. Não é furo (gasta-se o próprio saldo, e tudo que não
> vira inteiro positivo é recusado), mas ficou travado como **decisão registrada** em cima
> de dinheiro, e não como surpresa.

### `workers/push-scheduler.test.js` — 11 casos (era 0% em TODO o `workers/`)

A rodada 1 excluiu `workers/` dizendo que "depende de KV real, cron e credencial FCM".
Depende do KV e do FCM — **não do cron**: `scheduled()` é uma função exportada. Chaves
VAPID/ECDH/RSA são **geradas de verdade** no teste (com `p256dh` de mentira o
`sendWebPush` lança antes do `fetch`, e o teste mediria "nada enviado" por engano).

- envia para cada inscrição `push:`; sem `VAPID_JWK` não envia **e não apaga** nada;
- **endpoint fora da allowlist é APAGADO** em vez de virar `fetch` a cada cron (linhas
  anteriores à allowlist têm TTL de 1 ano — é SSRF disparado pelo nosso worker);
- 410/404 limpam a inscrição morta, 500 mantém;
- linha corrompida no KV não derruba as outras;
- **paginação: 250 inscrições são todas drenadas** (um erro aqui entregaria push só para os
  100 primeiros — e ninguém reclamaria, porque quem não recebe notificação não sabe que
  deveria ter recebido);
- **idioma**: nas 4 horas de cron (10/16/21/22), quem escolheu EN não recebe **nenhum**
  caractere acentuado — é o bug de tom das 22h travado no ponto onde ele aconteceu;
- inscrição sem nome de pet não manda `"undefined"` para o usuário;
- **APK antigo (`digimonName`) continua recebendo o nome certo** — se alguém "limpar" esse
  campo, quem não atualizou passa a receber "Soulmon" genérico, sem erro nenhum aparecendo.

---

## 5. Pontos cegos do skeptic — o que eu encontrei

### 5.1 Fixture de save legado (ponto cego nº 1) — ✅ existe agora, e **nada quebra**

`src/contexts/GameStateContext.legacySave.test.tsx` monta o `GameStateProvider` com um save
de jogador do DigiApp no `localStorage` (campos antigos presentes, campos novos ausentes:
`equippedFurniture`, sem `soulGoal`, sem `activityLog`, sem `petPassive`, sem `accountTier`,
`eggType: 'agumon'`).

Isso **só é possível agora**: a lógica de carga vive dentro do inicializador de `useState`
do provider (`GameStateContext.tsx:239`) — com `environment: 'node'` ela era literalmente
inalcançável por teste.

Resultado: **a migração está correta.** Estágio `mega`, 37 dias perfeitos, 4820 Bits, 55
emblemas, troféus, inventário, cenários comprados, tarefas e atividades — tudo sobrevive;
o sofá antigo vira `{'floor-left': 'furn-sofa'}` e o campo velho some do save gravado;
save sem `accountTier` é grandfathered para `paid` (nunca rebaixado); `'agumon'` vira
`'tapirmon'`; a primeira carga **não** dispara cloud save. Os dois bugs históricos do
`migrateDecor` (mapa vazio é decisão do jogador; item fora do catálogo) continuam travados.

### 5.2 🔴 ACHADO B-1 — save hostil derrubava o app permanentemente

**Arquivo:** `src/types/progression.ts:82` (`getStageLevel`) e `:89` (`getStageBranch`).

**Cenário concreto:** `/api/save` valida que `state` é um **objeto** e nada além disso — nem
a rota nem o cliente checam o tipo de cada campo. E **hoje, em produção, a autenticação
está desligada** (`FIREBASE_PROJECT_ID` ausente, STATUS §3.1), então quem souber o e-mail de
alguém consegue `POST /api/save?id=<hash>` com `{"state":{"evolutionStage":42}}`. Na
próxima carga, `stage.split('-')` lança **dentro do inicializador do
`GameStateProvider`** → a árvore inteira do React cai. E toda carga seguinte lê o mesmo
save: **tela branca permanente, sem caminho de recuperação pela UI.** É negação de serviço
sobre a conta de um usuário real, com um `curl`.

**Fix aplicado** (2 linhas, no ponto único por onde todo estágio passa):

```ts
export function getStageLevel(stage: string): EvolutionStage {
  if (typeof stage !== 'string') return 'rookie';   // ← novo
  …
export function getStageBranch(stage: string): 'virus' | 'data' | 'vaccine' | null {
  if (typeof stage !== 'string') return null;       // ← novo
```

**Regressão travada:** 5 tipos hostis (número, objeto com `toString`, array, booleano,
`null`) montam o provider e **preservam o resto do save**, mais um caso que garante que o
fix não estragou a entrada boa (`'champion-virus'`, `'gaioumon'` legado, `'rookie'`).

### 5.3 🟠 ACHADO B-2 — quota de `localStorage` derruba a árvore (ponto cego nº 6)

**Arquivo:** `src/contexts/GameStateContext.tsx:359` — `localStorage.setItem(...)` dentro
de `useEffect`, **sem `try/catch`**.

O skeptic previu "estado que não persiste, sem erro visível". **Medindo, é pior:** o
`QuotaExceededError` sobe pelo React e a árvore é desmontada (`Consider adding an error
boundary`). Não é perda silenciosa — é o app caindo. O domínio é **compartilhado com o
DigiApp** (`digiapp-a5e.pages.dev`), então o orçamento de storage não é só nosso:
`activityLog` (90) + `completedTasks` + `digiapp_state_v3` + `SOULMON_PROFILE` + inventário.

**Não corrigi**: engolir o erro troca "queda" por "perda silenciosa de progresso", que é
pior no moat. O fix certo é produto (avisar o jogador) — reporto para decisão.

### 5.4 🟠 ACHADO B-3 — o `try/catch` da carga cobre exatamente uma linha

**Arquivo:** `src/contexts/GameStateContext.tsx:243` está protegido; **`:249`, `:304`,
`:368`, `:381`, `:382` não estão.**

O comentário do provider diz *"A corrupted save must never white-screen the app"* e o
`try/catch` cobre só `getItem(GAME_STATE)`. A linha seguinte lê `EGG_TYPE` fora do bloco.

**Cenário concreto:** Safari com "bloquear todos os cookies", modo anônimo em alguns
navegadores, WebView com storage desabilitado → `getItem` lança `SecurityError` e **o app
não abre**. A proteção existente dá a impressão de cobrir o caso e cobre uma linha. Medido
e travado (o teste afirma o comportamento de HOJE; quando houver tratamento, ele cai e deve
ser reescrito para a nova garantia).

### 5.5 🟠 ACHADO B-4 — o relógio do aparelho farma `perfectDays` (ponto cego nº 4)

**Arquivo:** `src/hooks/useDailyReset.ts:57` —
`new Date().toDateString() !== gameState.lastResetDate`. É **desigualdade**, não
"passou um dia": não exige que o tempo tenha andado para frente.

Três coisas medidas em `src/hooks/useDailyReset.clock.test.ts`:

- **adiantar o relógio farma dias perfeitos**: 5 ciclos de (+1 dia → remarcar as 4 tarefas)
  = `perfectDays: 5` em ~1 minuto de relógio real, **sem custo de HP**. `perfectDays` é a
  moeda da EVOLUÇÃO e vai para o ranking da comunidade;
- **atrasar também é aceito como virada**: sem checagem de monotonicidade, o mesmo "dia"
  rende ponto mais de uma vez, e `lastResetDate` passa a registrar uma data **anterior** à
  já processada sem nada reclamar;
- o **perdão de ausência** é calculado sobre a mesma data mentirosa: pular 3 dias no
  relógio compra a isenção do dia ruim (0 corações perdidos contra o dia ruim normal).

**Contraponto que impede virar alarmismo, e está no teste:** só mexer no relógio não farma
nada — é preciso **remarcar as tarefas** a cada ciclo. A falha é de **confiança no
relógio**, não de generosidade da regra. Não corrigi: a defesa (âncora de tempo do
servidor no `/api/save`) é grande e é decisão de produto.

### 5.6 ⚪ Conflito entre dois aparelhos (ponto cego nº 5) — pior do que "sem resolução"

Travei o fato mecanicamente: **o estado não carrega nenhum campo de versão/revisão**
(`rev`, `version`, `updatedAt`, `savedAt`, `clock`). Não é só que o merge é
last-write-wins: **não há como nem DETECTAR o conflito**. Celular offline à tarde +
desktop à noite = o celular sobrescreve o desktop ao reconectar, em silêncio. O teste cai
no dia em que alguém acrescentar versionamento — e aí vira o teste da regra de merge.

---

## 6. Veredito sobre a previsão do skeptic

> "Os próximos defeitos reais **não** serão erros de regra de jogo — serão fronteiras sem
> dono […] Teste da previsão: se o próximo bug real for de lógica dentro de `utils/`,
> minha diagnose está errada e foi azar."

**CONFIRMA, com uma ressalva que preciso registrar contra mim mesmo.**

| Achado | É fronteira? | Qual |
|---|---|---|
| **A-1** `icon-reset.png` com xadrez assado, em produção | ✅ | **asset ↔ renderer** — dimensão que nenhuma das listas anteriores tinha (nem a do skeptic) |
| **A-2** magenta na arte que está no bundle | ✅ | asset ↔ paleta declarada; a decisão vivia num **comentário**, e comentário não é fronteira com dono |
| **B-1** save hostil → tela branca permanente | ✅ | **servidor ↔ cliente**: `/api/save` valida o invólucro, o cliente assume o tipo dos campos, e nada força o encontro |
| **B-2** quota derruba a árvore | ✅ | app ↔ plataforma (storage compartilhado com o DigiApp) |
| **B-3** `try/catch` que cobre uma linha | ✅ | app ↔ plataforma; e o comentário afirmava uma garantia mais larga que o código |
| **B-4** relógio do aparelho | ✅ | regra pura ↔ **clock que ela recebe** — exatamente como o skeptic escreveu |

**Zero** dos achados é erro de lógica dentro de `utils/`. A diagnose não era azar.

**Ressalva honesta, contra a previsão:** dois dos vetores previstos **não** produziram
achado quando fui olhar, e isso também é resultado:

- **"Save legado ↔ código novo"** (aposta nº 2 do skeptic): a fixture existe agora e
  **nada quebra**. As três migrações estão corretas, inclusive nos dois casos-limite que já
  tinham dado bug. O risco era real (não havia fixture) mas o código estava certo.
- **"Worker ↔ Pages Functions"** (aposta nº 4): `workers/push-scheduler.js:17` **importa**
  `functions/api/_pushTargets.js` — não é cópia. O vetor de deriva por duplicação está
  fechado nesse ponto. O que continua aberto é a deriva de **deploy** (o worker sobe por
  `wrangler deploy` manual), que nenhum teste pega.

E a aposta principal — **APK / ponte Capacitor** — segue sem ser exercitada por ninguém.
Não é confirmação nem refutação: é o vetor mais provável e continua o mais intocado.

---

## 7. Portões (números reais, rodados agora)

| Portão | Comando | Resultado |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | **exit 0, limpo** |
| Testes | `npx vitest run` | **44 arquivos · 600 testes · 600 passam · 0 falham** (baseline recebido: 29 / 413 / 413 / 0). **+15 arquivos, +187 casos, nenhum teste existente alterado ou afrouxado** |
| Build | `npm run build` | **✓ built in 3.33s**, 112/112 PNG→WebP (−7,08 MB), worker compilado |
| Bundle | — | `index-*.js` **389,30 kB** (gzip 129,38) · `vendor` 141,72 kB inalterado · `index-*.css` **86,44 kB** (gzip 16,08). Variação vs. a rodada de UI: +0,55 kB de JS, +3,35 kB de CSS — **nenhuma vem daqui** (não toquei em `index.css` nem em componente) |

### Cobertura medida (`npx vitest run --coverage`)

| Superfície | Antes | Agora |
|---|---|---|
| `functions/api/billing.js` | **0%** | **97,14% stmts / 100% funcs** |
| `functions/api/entitlements.js` | **0%** | **95,45% / 100%** |
| `functions/api/_entitlements.js` | — | **96,87% / 100%** |
| `functions/api/_billing.js` | 48,2% / 38,9% funcs | **60,30% / 61,11%** |
| `workers/` (tudo) | **0%** | **91,72% stmts / 95,23% funcs** (`webpush.js` 100%, `fcm.js` 87,87%, `push-scheduler.js`) |
| `src/types/progression.ts` | — | **100% stmts** |
| `src/contexts/` | ~0% | **78,26%** |
| `src/components/` (agregado) | ~0% | 33,39% — `TaskCard` e `PixelKit` em **100%**, `ActivityCard` 93%, `BottomNav` 74%, `StepRow` 75%, `CompanionHUD` 40,87% |

> **Aviso de honestidade sobre o agregado:** o "All files" saiu **52,49% stmts**, contra os
> 16,01% da rodada 1. **Os dois números não são comparáveis.** O v8 só relata arquivos que
> a suíte carregou (58 aqui, contra bem menos antes), então o denominador mudou junto com o
> numerador. As linhas por superfície acima são as que significam alguma coisa; o agregado
> não é.

---

## 8. Código de produção alterado (3 arquivos, todos explicados)

| Arquivo | Mudança | Por quê | Regressão travada por |
|---|---|---|---|
| `src/types/progression.ts:82,89` | 2 linhas: `if (typeof stage !== 'string')` em `getStageLevel` e `getStageBranch` | ACHADO B-1 — tela branca permanente a partir de um save hostil, explorável hoje | `GameStateContext.hostile.test.tsx` (6 casos) |
| `src/assets/soulmon/icons/icon-reset.png` | Alfa do fundo zerado por máscara de saturação + dilatação 2px | ACHADO A-1 — xadrez assado visível em produção | `assets.contract.test.ts` (2 casos + o guard geral) |
| `vitest.config.ts` | `resolve.alias` do build, `environmentOptions.jsdom.url`, `workers/**/*.test.js` no `include`, `src/test/**` no `exclude` de cobertura | Sem isso não existe teste de componente nem de worker | Os próprios arquivos novos |

Nada mais foi tocado. **`src/index.css`, `src/components/pixel/` e os componentes de UI
não foram alterados** — só lidos e testados.

---

## 9. O que continua sem dono

Em ordem de dano esperado:

1. **APK / ponte Capacitor.** Plataforma nº 1, aposta nº 1 do skeptic, **ninguém compilou
   nem abriu**. `DigiWidgetPlugin` ↔ SharedPreferences ↔ canal `digiapp_push` é fronteira
   entre duas linguagens sem um teste cruzando. Não tenho toolchain Android aqui; auditar
   sem compilar produziria asserção. **Segue sendo o buraco maior desta fase.**
2. **Deploy do worker (`wrangler deploy` manual).** A duplicação de `_pushTargets` está
   fechada por import, mas nada no CI avisa que a borda está velha. Não é testável por
   teste — é item de processo.
3. **Service Worker ↔ deploy.** `CACHE_VERSION` é bump manual; ninguém testou "usuário com
   SW antigo recebe deploy novo".
4. **Âncora de tempo do servidor** (achado B-4) e **versionamento de save** (§5.6): as duas
   correções são grandes e são decisão de produto, não de QA.
5. **Tratamento de `QuotaExceededError`** (B-2) e do `SecurityError` de storage (B-3).
6. **`nest-base.png`** — resíduo medido, corrigir é do dono da arte (item 8 do backlog da
   UI). O mesmo para o magenta do `btn-sm` (A-2).
7. **Layout de verdade.** O ambiente de render mede a regra CSS, não a caixa pintada.
   "A classe existe mas um pai esmaga o filho" continua invisível aqui — isso pede
   Playwright, que segue fora desta rodada.
8. **`src/hooks/` em 0%** de cobertura e `App.tsx` (~1500 linhas) idem. O caminho
   "concluir tarefa da UI ao save" ainda não tem um teste ponta a ponta — a pergunta do
   O-4 do skeptic continua respondida com **não**.
9. **`fcm-subscribe.js`, `chat.js`, `suggest-tasks.js`, `generate-sprite.js`, `config.js`**
   em 0%, e `src/utils/entitlements.ts` (cliente) em 0%.

---

## 10. Autoavaliação na régua do investidor

| # | Dimensão | Nota | Evidência |
|---|---|---|---|
| 1 | Problema & insight | ⚪ | Não é minha dimensão nesta rodada e não produzi evidência nova sobre ela |
| 2 | Mercado & timing | ⚪ | — |
| 3 | Produto & wedge | ⚪ | Não medi wedge; a única leitura nova (o menu com um quadrado quadriculado) é qualidade, não posicionamento |
| 4 | Unit economics | ⚪ | Não medi custo por DAU. Registro que o O-8 do skeptic segue sem resposta |
| 5 | Moat | 🟡 | O moat vive no save. A rodada **fechou** três formas de perdê-lo (tela branca permanente por save hostil, comprovante clonado entre contas, entitlement lido/gasto por terceiro — os três agora com teste no efeito persistido) e **abriu** duas que ninguém tinha medido: quota derruba o app, e não existe versionamento para detectar conflito entre aparelhos. 🟡 e não 🟢 porque as duas que sobraram são de perda de dado |
| **6** | **Credibilidade de execução** | **🟡** | **Minha.** A favor: a causa estrutural apontada pelo skeptic foi atacada na raiz (o `environment: 'node'` acabou), 187 casos novos, `tsc` limpo, build verde, e a suíte agora falha por motivos que o produto sente. Contra: **quatro defeitos reais em uma varredura de um dia**, um deles VISÍVEL EM PRODUÇÃO num ícone da navegação principal, e outro explorável hoje com um `curl` contra qualquer conta. E a plataforma nº 1 (APK) continua sem ninguém ter aberto. Não é 🔴 porque todos os achados são baratos e nenhum é arquitetural; não é 🟢 porque a régua de "estava tudo bem, só faltava teste" não sobreviveu ao primeiro teste |
| 7 | Narrativa | ⚪ | — |
| **8** | **Evidência sobre asserção** | **🟡 forte** | **Minha.** A favor: todo achado tem `arquivo:linha` + cenário + medição numérica (98,2%→48,4% de opacidade; 0,65% de magenta; `perfectDays: 5` em 5 saltos de relógio); os dois guards novos têm **autoverificação** (7 casos no ambiente de render, 5 no de asset, incluindo controles negativos); as rotas de dinheiro são exercitadas no handler REAL e afirmam o efeito **no KV**, não na resposta; e derrubei uma afirmação escrita de outro artefato com medição (A-2, o magenta no `normal`). Impedem 🟢, e são meus: (a) o ambiente de render **não faz layout** — meço a regra declarada, não a caixa pintada, e a diferença importa; (b) B-4 (relógio) é medido na função pura com relógio injetado, **não** num aparelho com a data mexida; (c) o achado A-1 foi confirmado por inspeção visual de imagem, mas não abri o app depois do fix — o `BottomNav` corrigido não foi fotografado; (d) o agregado de cobertura mudou de denominador e eu não consigo dar o número comparável honesto |

**Agregado: 🟡.** Não bloqueia a próxima fase. A lista de bloqueio de lançamento do
`security-verification` §7 continua valendo inteira — **mais** o achado B-1, que é uma
linha, é explorável hoje, e já está corrigido com regressão travada.
