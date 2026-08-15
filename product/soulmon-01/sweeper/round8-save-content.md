# Rodada 8 — O conteúdo do save carregado

**Pergunta da rodada:** os dois arquivos que leem o save do jogador
(`GameStateContext` hidratação + `cloudSync`) são vistos por alguém?
**Resposta curta:** não eram. Agora são. **22,6% → 83,3%** e **27,4% → 91,1%**, e
**nenhum dos sobreviventes restantes é cego** — todos são equivalentes,
classificados um a um abaixo. **O loop pode parar nestes dois arquivos.**

---

## 1. Linha de base (medida nesta rodada, não herdada)

Antes de escrever qualquer teste, `scripts/mutation-sweep.mjs` rodou nos dois
alvos com o repositório como estava. As duas medições **reproduziram a rodada 7
exatamente**, o que valida tanto o instrumento quanto o número anterior:

| Arquivo | Rodada 7 | **Minha base** | Mutantes |
|---|---:|---:|---:|
| `src/contexts/GameStateContext.tsx` | 22,6 % | **22,6 % (19/84)** | 65 vivos |
| `desktop/renderer/src/cloudSync.ts` | 27,4 % | **27,4 % (37/135)** | 98 vivos |

Para a base do `cloudSync` ficar honesta, o teste novo foi **retirado da árvore**
durante a medição — medir "antes" com o "depois" instalado é a mesma família de
autoengano que esta rodada foi consertar.

---

## 2. Resultado

| Arquivo | Mortos antes | **Mortos depois** | Vivos antes | **Vivos depois** | Cegos depois |
|---|---:|---:|---:|---:|---:|
| `GameStateContext.tsx` | 19/84 — 22,6 % | **70/84 — 83,3 %** | 65 | **14** | **0** |
| `cloudSync.ts` | 37/135 — 27,4 % | **123/135 — 91,1 %** | 98 | **12** | **0** |
| **Somados** | 56/219 — 25,6 % | **193/219 — 88,1 %** | **163** | **26** | **0** |

Descontando os equivalentes (§4), o score sobre o **alcançável** é **100% nos
dois arquivos**: 70/70 e 123/123.

**Testes: 863 → 981 (+118). Nenhuma linha de produção alterada. Nenhum teste
existente afrouxado** — a única mudança em teste antigo
(`GameStateContext.storage.test.tsx`) *acrescenta* uma asserção.

---

## 3. O que estava cego, em cenário de jogador

O diagnóstico da rodada 7 estava certo e é preciso repeti-lo: os testes que já
existiam (`hostile`, `hydrate.fuzz`, `legacySave`, `storage`) perguntavam
sempre a mesma coisa — *o campo é array? é número finito? o app sobreviveu?*
Nenhum perguntava **qual número**. Cobertura era 100% nessas linhas.

### 3.1 `GameStateContext` — a hidratação inteira decidia valores que ninguém lia

Sobreviviam **todos** os padrões de `hydrateSave` e **todos** de
`freshGameState`. Traduzidos para o que o jogador veria:

| Mutação que sobrevivia | O que o jogador veria |
|---|---|
| `gamePoints: num(…, 0)` → `1` | um Bit que ele não ganhou, em todo save antigo |
| `credits: … ?? 0` → `1` | um **Crédito** (dinheiro real) de graça por save |
| `digivolutionSegmentsNeeded, 999` → `0` | pet a zero passos da evolução na primeira carga |
| `degeneratedByHP ?? false` → `true` | pet marcado como degenerado ao abrir o app |
| `lastDayWasPerfect ?? false` → `true` | ontem vira "dia perfeito" para todo mundo |
| `pvpEnabled ?? false` → `true` | jogador entra no PvP **sem ter optado** |
| `healthPoints: … Math.max(0, …)` → `Math.max(1, …)` | pet degenerando "revive" com 1 coração ao recarregar |
| `attributesSinceLastEvolution` `0` → `1` | galho de evolução ganha ponto do nada, 3× |
| `parsed && typeof === 'object' && !isArray` (`&&`→`||`, 2×) | save que é array/string é **aceito** e vira `{"0":…,"1":…}` |
| `isFirstRender = useRef(true)` → `false` | toda abertura do app dispara cloud save |
| `}, 3000)` → `0` | o debounce some: cloud save a cada tecla |
| `soulmonMeta?.baseName \|\| ''` (`\|\|`→`&&`) | o ranking da comunidade perde o nome de todo pet |
| `=== 'pt-BR' ? 'Anônimo' : 'Anonymous'` → `!==` | idioma invertido no nome público |

Os testes novos (`GameStateContext.saveContent.test.tsx`, 52 casos) afirmam o
**conteúdo**: um save mínimo vindo da nuvem hidrata para **estes valores
exatos**, com número **cru** na expectativa — nada de
`toBe(FORM_REQUIREMENTS.rookie.cap)`, que é a tautologia que fez
`WEEKLY_RELIEF_HEARTS` valer zero por três rodadas sem ninguém ver. O teto de
atividades por estágio virou tabela de 5 linhas com os números escritos à mão
(6/7/8/9/10), e o de corações idem (3/3/3/4/5).

Também entrou o que nunca tinha sido tocado: a **gravação** (localStorage a cada
mudança, nuvem só depois de 3s e só depois da primeira mudança, rajada vira um
envio só, o perfil público leva os campos certos com par PT/EN).

### 3.2 `cloudSync` — o overlay do desktop nunca tinha visto uma resposta HTTP

`cloudSync.test.ts` trancava as tabelas copiadas (e faz isso bem), e
`pushCareAction.test.ts` trancava o contrato do POST. Mas
**`fetchRemoteSnapshot`, `fetchWallet` e `isAuthRequired` nunca haviam sido
chamados com um status de resposta nas mãos.** Sobreviviam:

| Mutação que sobrevivia | O que o jogador veria |
|---|---|
| `res.status === 401 \|\| 403` (`\|\|`→`&&`, e cada literal → `0`) — **3 lugares** | "sem conexão" para quem só precisava logar de novo |
| `!data?.found \|\| !data.state` (`\|\|`→`&&`) | resposta "não achei" tratada como save encontrado |
| `{ ok: false, reason: … }` → `ok: true` — **8 lugares** | erro devolvido como sucesso, com um snapshot inexistente |
| `hearts: … : 1` → `0` | save sem HP mostra **pet morto** para quem está bem |
| `rawLine === 'veemon' \|\| …` (5 mutantes) | linha de sprite legada/errada desenhada no overlay |
| `stageId.split('-')[1]` → `[0]` | nome da forma some; todo mundo vira o nome-base |
| `match?.name` → `.name` | overlay **quebra** em quem está num nível fora da árvore |
| `Number(state.virusPoints) \|\| 0` (`\|\|`→`&&`, 4×) | atributos zerados na escrita de volta — perda de progresso |
| `n < 0` → `<= 0` e `healthPoints >= 0` → `> 0` | a rede de segurança da escrita passa a **recusar estado válido** (item zerado, pet em degeneração) e o carinho do overlay para de funcionar |

`cloudSync.snapshot.test.ts` (66 casos) cobre isso por cenário: *"save de mega
com 2,5 corações aparece como 2,5/4 e 3/6"*, *"401 pede login, 500 é rede"*,
*"a regra gerou NaN → nada é gravado e o save do jogador fica intacto"*.

Um detalhe que valia teste próprio: `snapshotOf` (usado na **escrita**) é uma
**segunda montagem** do mesmo snapshot que `fetchRemoteSnapshot` monta na
leitura — footgun 9 dormindo dentro do arquivo. As duas cópias agora são
afirmadas separadamente, com os mesmos cenários.

---

## 4. Equivalentes — separados de propósito, não contam como vitória

Os 26 sobreviventes restantes. **Nenhum é teste cego**; cada um está justificado.

### 4.1 `GameStateContext.tsx` — 14

- **8 em ANOTAÇÃO DE TIPO** (`place: 1 | 2 | 3`, `mood: 1 | 2 | 3 | 4 | 5`).
  **Já eram conhecidos** — a rodada 7 os declarou. Tipo é apagado no build;
  limitação do script, que não distingue posição de tipo de posição de valor.
- **1** — `:256` `num()` `&&`→`||`: só diverge para `NaN`/`Infinity`, que
  `JSON.parse` **não consegue produzir**, e o único chamador de `hydrateSave` é
  alimentado por `JSON.parse`. Inalcançável.
- **3** — `:435/:444/:445` `?.` no erro capturado: o valor lançado ali é sempre
  um `Error` (`SyntaxError` do parse, ou o throw de dentro do `hydrateSave`).
- **2** — `:488` `completedTasks?.length ?? 0`: depois do fix da rodada 6,
  `hydrateSave` **garante** que `completedTasks` é array. Os dois guards são
  inalcançáveis — e por um bom motivo.

### 4.2 `cloudSync.ts` — 12

- **4 em ANOTAÇÃO DE TIPO** (`{ ok: true }` / `{ ok: false }` dentro das uniões
  `SyncResult` e `PushResult`, linhas 79/80/198/199). Mesma classe dos 8 acima.
- **5** — `MAX_HP_BY_LEVEL[level] ?? 3` e `ENERGY_BY_LEVEL[level] ?? 4`
  (`:142/:144/:280/:312/:314`): `stageLevel()` só devolve uma das 5 chaves, e
  `cloudSync.test.ts` já tranca que toda chave existe nas duas tabelas. O
  fallback é seguro morto — de propósito.
- **2** — `:311/:313` em `snapshotOf`: `isSaneCareState` roda **antes** e exige
  que `healthPoints`/`energyPoints` sejam números finitos. Inalcançável.
- **1** — `:51` `data?.authRequired !== false`: com corpo `null`, o mutante
  lança e cai no `catch`, que responde `true` — **o mesmo** que o original.

---

## 5. Achados de produção

**Nada foi alterado em código de produção nesta rodada.** Um ponto merece
ticket, não correção às cegas:

- **`freshGameState()` nasce com `healthPoints: 1, maxHealthPoints: 1`**
  (`GameStateContext.tsx:359–360`), enquanto rookie vale **3**. O estado é
  gravado no localStorage já no mount, então quem fecha o app no meio do
  onboarding e volta encontra **1/3 corações** (o `hydrateSave` recalcula o
  teto pelo estágio, mas não o HP). O ritual de nascimento corrige para 3/3 ao
  terminar (`App.tsx`), e a virada do dia não cobra nada de quem tem 0
  atividades — então **não há dano hoje**. É inconsistência, não bug.
  *Recomendação:* `freshGameState` usar `getMaxHPForStage('rookie')` nos dois
  campos, como o onboarding já faz. Os valores atuais ficaram **travados por
  teste** para que mudá-los seja uma decisão, não um acidente.

---

## 6. Higiene do instrumento

O aviso da rodada 7 (mutante esquecido no fonte após um kill) foi verificado
**na largada e no fim**:

- largada: `git status` limpo em `src/`, `desktop/`, `functions/`, `workers/`;
  nenhum `.mutation-bak` órfão;
- fim: **nenhum** `.mutation-bak` no repositório; `git status` nas mesmas pastas
  mostra apenas **arquivos de teste** e `scripts/mutation-sweep.mjs`.

`scripts/mutation-sweep.mjs` mudou só nos **subsets** dos dois alvos, para
incluir os arquivos de teste novos. Sem isso, todo mutante morto pelos testes
novos era classificado por uma suíte COMPLETA (16 s cada em vez de 3 s) —
resultado idêntico, custo 5×.

**Ordem importa:** as quatro varreduras rodaram em **série**. Duas em paralelo
se contaminam, porque a reconfirmação de sobrevivente roda a suíte inteira e
leria o outro arquivo mutado.

---

## 7. Portões

| Portão | Resultado |
|---|---|
| `npx tsc --noEmit` | **exit 0**, limpo |
| `npx vitest run` | **981 testes, 62 arquivos, 0 falhas** (base da rodada: 863) |
| `npm run build` | **exit 0** — vite build + 115/115 PNG→WebP (−7,18 MB) + `✨ Compiled Worker successfully` |
| `git status` (src/desktop/functions/workers/scripts) | 2 arquivos de teste novos, 1 teste modificado (só adição), `mutation-sweep.mjs` |
| `.mutation-bak` órfão | **nenhum** |

Arquivos novos:
- `src/contexts/GameStateContext.saveContent.test.tsx` — 52 casos
- `desktop/renderer/src/cloudSync.snapshot.test.ts` — 66 casos

---

## 8. Veredito do loop

> **Nos dois arquivos de maior dano, o loop PARA — com evidência.**

O critério proposto nas rodadas anteriores era: *se os módulos de maior dano não
tiverem mutante sobrevivente cego, para*. Ele foi **atingido** aqui:

- `GameStateContext.tsx`: **83,3%**, 14 vivos, **14 equivalentes, 0 cegos**;
- `cloudSync.ts`: **91,1%**, 12 vivos, **12 equivalentes, 0 cegos**.

O caminho que lê e grava o save do jogador — que três rodadas seguidas
devolveram um guard cego — deixou de ter um. E a razão de fundo foi nomeada e
resolvida: *montar não é afirmar; carregar não é conter*.

### Onde ainda há cego, e qual o próximo instrumento

O loop **não acabou no repositório**; ele acabou **nestes dois arquivos**. Pela
rodada 7, continuam abertos, em ordem de dano:

1. **`functions/api/_billing.js` — 40,0%, ~78 vivos.** É o pior que sobrou e é
   **dinheiro**: `:150` `purchase.purchaseState !== 0` (com `===`, **compra
   PENDENTE vira compra válida**) e `:215/:216` (`isVoided` deixa de reconhecer
   estorno). Quase tudo está atrás de um `fetch` para Play/Steam.
   **Instrumento certo:** não é mais mutação — é um **fake do endpoint da loja**,
   nos moldes do que `pushCareAction.test.ts` já faz com `functions/api/save.js`
   (ligar o `fetch` no handler real em vez de imitá-lo). Com o fake no lugar, a
   varredura de mutação passa a medir alguma coisa; sem ele, mede o mock.
2. **`src/utils/carePattern.ts` — 51,1%.** Uma tabela de limiares
   (`spread >= 0.5`, `concentration <= 0.4`, `<= 0.25`,
   `total >= MIN_TASKS_FOR_CONFIDENCE`) **sem um único teste de limiar**. Dano
   menor (desempate de galho), custo baixo: é teste de fronteira puro.
3. **`functions/api/save.js` — 63,9%.** Códigos de status, `expirationTtl` e a
   fronteira `> MAX_STATE_BYTES`.
4. **`dailyReset.ts:358–386`** — o bloco de evolução automática que
   `MANUAL_EVOLUTION` torna inalcançável (**12 mutantes, já conhecidos da
   rodada 7**). Continua valendo o ticket: ou a flag vira configuração testável,
   ou o bloco sai. Regra viva guardada em código que não roda é dívida, não teste
   cego.

---

## 9. Como repetir

```bash
node scripts/mutation-sweep.mjs GameStateContext   # esperado: 70/84 (83,3%)
node scripts/mutation-sweep.mjs cloudSync          # esperado: 123/135 (91,1%)
```

Um alvo por vez, em série, com o repositório limpo. Se o processo morrer no
meio, **rode de novo**: a recuperação pelo `.mutation-bak` restaura o arquivo
antes de começar.
