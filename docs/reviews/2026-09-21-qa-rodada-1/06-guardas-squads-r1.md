# 06 — Guardas (8) + squads temáticas (narrativa, som, arte, design) — QA rodada 1, 21/09/2026 noite

Repo `D:\Soulmon\repo`, branch `qa/rodada-a`, HEAD `5228145e`. Frente: áreas que `09-guardas.md` §3 declarou
"nunca auditadas por guarda" + o que mudou hoje (`11e9b237..HEAD`: `42b07bec`, `4a8b8049`, docs).
Método: leitura do código + réguas rodadas por comando. Somente leitura em produção; **dois arquivos de
teste novos** (permitidos pelo briefing): `src/copy.semFomo.contract.test.ts` (#15, passa) e
`functions/api/_entitlements.tierDerivado.qa.test.js` (bug confirmado, **3 reprovam / 1 controle passa**).

⚠️ Estado da árvore no momento da auditoria: `git status` mostra **modificações não commitadas de outro
agente** em `functions/api/account.js`, `functions/api/entitlements.js`, `src/utils/accountData.ts`,
`scripts/convert-to-webp.mjs` e o untracked `functions/api/entitlements.grant.qa.test.js` (skeptic). Li o
código **como está na árvore**; onde o diff não commitado importa, digo.

## 0. Réguas rodadas

| Comando | Resultado |
|---|---|
| `npx vitest run src/utils/petVoice.test.ts src/narrativa.contract.test.ts` | 2 files · **35 passed** |
| `npx vitest run` dos 22 arquivos citados em `01-VISAO.md` §7 (12 por teste) + parciais de #13/#14/#16/#18/#19/#20/#21 | 22 files · **448 passed** |
| `npx vitest run src/copy.semFomo.contract.test.ts` (NOVO, #15) | 1 file · **5 passed** — código não viola #15 hoje |
| `npx vitest run functions/api/_entitlements.tierDerivado.qa.test.js` (NOVO) | **3 failed / 1 passed** — bug confirmado (§3) |
| `npx vitest run src/components/settingsSom.render.test.tsx` | **5 passed** — mudo/trilha alcançáveis sem `SettingsModal` |
| `sha256sum public/sounds/*.webm` × `sonsAssets.ts` × `Attributions.md` | **5/5 batem** |
| `node redact-probe.mjs` (15 entradas em `minimizeForAi`) | ver §6 |

---

## 1. VÍNCULO — `src/utils/petVoice.ts` (mudado hoje em `a2ded861`, `1480b632`)

**Passa na régua que existe; a régua não alcança a matriz de traços.**

- `PET_VOICE_LINES` (15 kinds): nenhuma frase cobra; as 6 kinds novas (`full`, `healCap`, `steady`, `sleep`,
  `wake`, `residue`) obedecem L2/L3/L9/L11 pelo que li. `wake` não comenta a noite (veto #12) — teste próprio.
- **`TRAIT_LINES` (WP3.10) não passou pela mesma revisão de 21/09.** A bíblia tirou de `milestone` "Você
  repetiu tanto que virou seu" (pessoa como sujeito + histórico, L1/§5.10) e de `rare` "hoje você me parece
  diferente" (memória). Mas ficaram, no traço:
  - `teimoso.haunted`: *"Eu sabia que você ia encarar essa."* (previsão sobre a pessoa — a criatura não
    tem órgão para isso, §5.10) e *"Essa aí resistiu. Você resistiu mais."* (pessoa como sujeito, mérito
    comparativo — L1 + L12).
  - `madrugador.shower`: *"Limpo e acordado. Assim que se faz."* / *"That is how it is done."* — veredito
    de mérito sobre o gesto da pessoa (L12).
  - `guloso.task`: ok. `sortudo.rare`, `carinhoso.rub`: ok.
- **Por que o teste não pegou:** `petVoice.test.ts` › "as falas de traço também não cobram" só chama
  `petVoiceLine(gesto, isPt, 0, traco)` — **`pick = 0`, só a 1ª frase de cada traço** — e varre 6 palavras
  (`deveria/should/falhou/failed/finally/finalmente`), não `PROIBIDAS_PT/EN`. `TRAIT_LINES` não é exportado,
  então a varredura completa da 1ª `describe` não o alcança. As 2ªs frases de traço nunca foram lidas por teste.
- Borda: `task.pt[2]` *"Isso conta, viu?"* — "conta" lê como placar (L2). Não reprovo; registro.

**Régua proposta (vínculo):** exportar `TRAIT_LINES` (ou `todasAsFalas()`) e passar a matriz inteira pela
mesma `PROIBIDAS_PT/EN` + um `expect` de que nenhuma frase de traço começa com "Você"/"You" seguido de verbo
de ser/mérito. Quem revisa a copy dos traços é `soulmon-narrative-critic` (é copy da bíblia §1 que não existe
para traço — as falas de traço são anteriores à bíblia).

## 2. CONSTÂNCIA — `useDailyReset.ts` / `playerDay.ts` (fuso, virada, DST)

**Dois relógios de "dia", declarados mas não conciliados — e o manual não avisa.**

- `useDailyReset.ts` › `rolloverPendingFor` = `new Date().toDateString() !== lastResetDate` — a **virada**
  (meta diária, `perfectDays`, hábitos, `computeDailyReset` › `yesterday.toDateString()`) é o dia do
  **aparelho**, local. Meia-noite local, não UTC — correto para BR (o bug de `toISOString` está em
  `App.tsx` › `isoDay`, já documentado). DST: `setDate(-1)` + `toDateString()` em relógio de parede local
  atravessa dia de 23h/25h sem pular nem repetir dia. Ok.
- `playerDay.ts` › `playerDayKey(now, anchor)` = dia **ancorado** (IANA do onboarding ou offset congelado):
  teto de carinho, check-in, humor, `poopDrainCharge`, `playLog`, `rest.nights`, `nightmares`, e desde hoje
  `glitchtamaUse.day` (`specialItemUse.ts`).
- O próprio cabeçalho de `playerDay.ts` declara: *"Não toca em `dayKeyOf` (`habitRhythm.ts`)"* — para não
  invalidar strings gravadas. Consequência **não escrita em lugar nenhum de `docs/manual/`** (`grep -rn
  "playerDayKey\|dois relógios\|âncora" docs/manual/02-REGRAS-DE-NEGOCIO.md` → só a chave, sem o
  descasamento): quem viaja BR→Lisboa (+4h) vê a lista do dia virar às 20h de casa enquanto o check-in,
  o humor e o teto de carinho ainda são "de ontem" por 4h. BR→Tóquio: 12h de janela em que o app tem
  dois "hoje". Não é bug de código (é decisão de `9e9f679f`), é **dívida de doc + de decisão do dono**:
  o descasamento é aceitável, ou `lastResetDate` migra para a âncora (com migração de save)?
- Relógio adiantado/atrasado farmando `perfectDays`: **ainda aberto**, já listado em
  `useDailyReset.clock.test.ts` como `ACHADO` (fixado como observado, não reprovado). Não repito.
- `rolloverPendingFor(undefined)` → `true` (fail-open para rodar reset): correto e testado.

## 3. SUSTENTO — `_entitlements.js` › `grantCourtesy` / `auditRefunds`; `_aiGuard.js`

### 3.1 BUG CONFIRMADO — reembolso da Play rebaixa para `demo` com cortesia válida

- `auditRefunds`: `if (order.grantTier === 'paid') ent.tier = 'demo'` por pedido desfeito, **sem
  recomputar** a partir dos pedidos que continuam de pé. Até ontem inalcançável (1 pedido pago por conta);
  `grantCourtesy` (decisão #12, hoje) criou o 2º pedido pago e o estado incoerente
  `ent.tier === 'demo' && paidProviderOf(ent) === 'courtesy'` — o **mesmo arquivo** dá duas respostas
  para "esta conta é paga?". `publicView` propaga o `tier` errado ao cliente.
- O skeptic (`entitlements.grant.qa.test.js` › `BUG-CANDIDATO`) fixou o comportamento **como observado**
  (o teste passa). Escrevi a **régua que reprova**, independente da decisão do dono:
  `functions/api/_entitlements.tierDerivado.qa.test.js` — invariante *tier = 'paid' ⇔ paidProviderOf ≠ null*,
  nas duas ordens (Play→cortesia→reembolso; cortesia→Play→reembolso) e relendo do KV. **3 reprovam,
  o controle (sem 2º pedido) passa.** Saída, qualquer que seja a decisão: se cortesia sobrevive, recompute
  o tier no fim do laço; se não sobrevive, marque o pedido `courtesy` como `voided` também — o que não
  pode é o tier discordar do histórico.
- Não corrigi produção (briefing).

### 3.2 `_aiGuard.js` — cortesia gasta o orçamento de IA igual a pago (confirmado)

- `guardAiRequest` não lê `tier` nem `provider`: os tetos são por `saveId` (`ai:<bucket>:<saveId>:<dia>`,
  `ent.aiLifetime`, `ent.aiForms`) e globais. Conta de cortesia tem os **mesmos 26 sprites vitalícios**
  (R$ 2,63 declarado no comentário como "8,8 % de R$ 29,90" — para cortesia é 8,8 % de zero) e os mesmos
  120 chats/dia. Teto de dano: `COURTESY_DEFAULT_MAX = 25` × 26 = **650 imagens** = 81 % do
  `globalMonth: 800` — a cortesia inteira, se resgatada num mês, quase esgota o pré-pago dos pagantes.
  É consequência declarada ("Cortesia abre o portão, não paga a conta"), mas o **número** não está em
  lugar nenhum. Baixo hoje (10 testadores); vira médio se `COURTESY_MAX_ACCOUNTS` subir.
- `entitlements.js` › `handleGrant` (diff não commitado de outro agente) acrescenta `typeof saveId !==
  'string'` antes do regex — correto; o teste `grant — corpo inválido` do skeptic cobre.

## 4. PERMANÊNCIA — `achievements.ts`, `specialItemUse.ts`, `arena.ts`, `RebirthModal.tsx`

- **`dias-completos-30` via Glitchtama: BRECHA, não decisão.** `specialItemUse.ts` › `useSpecialItem`
  (ramo `glitchtama`) faz `totalPerfectDays: (prev.totalPerfectDays ?? 0) + 1` — e `achievements.ts` ›
  `unlockedAchievements` lê `'dias-completos-30': totalPerfectDays >= 30` **e** `'perfect-day':
  totalPerfectDays >= 1`. Logo: **um** Glitchtama (drop de masmorra) abre "Primeiro dia completo" sem dia
  completo nenhum, e 30 Glitchtamas (teto 1/dia → 30 dias de masmorra, zero hábito) abrem "Trinta dias
  completos". A decisão #30 trocou "contagem de tarefas" por "comportamento" — e o comportamento premiado
  pode ser "jogou masmorra 30 vezes", que é contagem de outra coisa. `grep -n -i glitchtama
  docs/plano-melhorias/ledger/vetos.md docs/REGISTRO-DE-DECISOES.md` → só P5 (nome) e "1/dia"; nada
  sobre conquista. Parecer do guarda: ou a conquista lê um contador que só a virada escreve (novo campo
  `diasCompletosReais`, ou `totalPerfectDays` deixa de ser tocado pelo item e o item soma só em
  `perfectDays`, que é a escada), ou registra-se a exceção em `vetos.md`.
- Aceite do veto #16 em `vetos.md` ("nenhuma conquista lê `.length` de tarefas") **não é verdadeiro ao
  pé da letra**: `achievements.ts` › `gatilhoAntigoTasks100` ainda lê `completedTasks.length +
  activityLog.length` — é a migração (`conquistasHerdadas`), legítima, mas o aceite precisa dizer
  "exceto a migração" ou o teste de régua proposto vai reprovar o próprio conserto.
- **`arena.ts` cabeçalho mente:** *"SEM CONSUMIDOR — nenhuma tela chama nada daqui (verificado em
  07/09/2026)"*. `grep -rln "utils/arena" src` → `src/components/ArenaGame.tsx` (montado por
  `ActivitiesPage.tsx`, commit `6fe6c73a`). A Arena **está ligada** e o arquivo diz que não. Lápide
  invertida — o padrão "parecer ligado" que o próprio cabeçalho cita, ao contrário. Guarda da permanência
  nunca auditou a Arena ligada: `ArenaGame.tsx` só tem `render.test`; regras (multiplicadores, drops) só
  via `arena.test.ts` de simulação.
- `rebirth.ts`: regras 1–5 batem com o código lido; regra 4 (nada de identidade/coleção se perde) tem
  teste. `RebirthModal.tsx` não lido linha a linha — sem achado.

## 5. NASCIMENTO — `generate-sprite.js`, `GameTutorialFlow.tsx`

- **O servidor aceita o prompt inteiro do cliente, sem teto nem `minimizeForAi`.** `generate-sprite.js` ›
  `onRequestPost`: `const { prompt, promptFallback, referenceImageUrls, id, formId } = await request.json()`
  → só `typeof prompt === 'string'`. Vai direto a Higgsfield/Gemini. A composição em `oracle.ts` ›
  `composeSpritePrompts` limita `favoriteCreature` a **2 palavras** e `petDescription` a **200 chars** —
  **no cliente**. Um pagante com `curl` gera **qualquer imagem** (26 vitalícias, 6/dia) e ela fica gravada
  em `sprite:img:<saveId>:<formId>` **sem TTL** ("é arte PAGA"). Não é prompt injection contra nós (não há
  instrução de sistema a sequestrar num prompt de imagem) — é **uso da nossa chave de provedor como
  gerador de imagem genérico** + conteúdo indesejado persistido em KV nosso. Filtro de conteúdo do
  provedor é a única trava (e `refusal` já tem tratamento). Médio. Régua: o servidor recompõe (ou valida
  por prefixo/tamanho) a partir de `{favoriteCreature, petDescription, formId, ficha}` em vez de aceitar
  texto pronto.
- #18 (texto do usuário em IA): `favoriteCreature`/`petDescription` → prompt de imagem → 3º (Higgsfield,
  Gemini). Está **declarado** hoje em `SettingsPage` › Sobre ("gerada por IA… Higgsfield e Gemini") e na
  política; `_redact.js` não passa por esse caminho (nem faria sentido: 2 palavras). Coerente com D8.
- `GameTutorialFlow.tsx` › `SHOP_AND_CURRENCY_PRIMER`: exportado, **zero consumidores** (`grep -rn
  SHOP_AND_CURRENCY_PRIMER src` → só o próprio arquivo) e com copy **desatualizada**: *"Créditos são uma
  moeda especial pra ajudas extras"* — `PLAY-FICHA.md` §1.3 diz "Créditos pagam uma nova leitura das suas
  respostas". Copy morta que, se alguém ligar, contradiz a loja. Baixo.
- Strings vivas do tutorial: sem cobrança; "cada tarefa que você cumpre… ajuda na evolução" — ok (esforço).

## 6. MEDIÇÃO — `_redact.js`, `account.js`

### 6.1 `minimizeForAi` (probe, 15 entradas)

| Entrada | Saiu como | Veredito |
|---|---|---|
| CPF `123.456.789-09` | `[documento]` | ok (`cpf`) |
| CPF `12345678909` / `123 456 789 09` | `[número]` | ok, pela regra `digits` (≥ 11 dígitos) |
| `+55 (11) 98765-4321` | `[telefone]` | ok |
| `+5511987654321` | `+[número]` | ok (sobra o `+`, irrelevante) |
| `11987654321` | `[número]` | ok |
| **`987654321` (celular sem DDD, 9 dígitos)** | **passa inteiro** | furo: `digits` exige ≥ 11 |
| `fulano+promo@gmail.com` / subdomínio / maiúsculas | `[email]` | ok (`[\w.+-]+`) |
| CNPJ sem pontos, cartão, RG | `[número]` | ok |
| **CEP `01310-100`** | passa | quase-identificador; fora do escopo declarado ("identificadores DIRETOS") |
| **data de nascimento `12/03/1990`** | passa | idem — mas `soulmon-profile` guarda nascimento; se um dia for para o chat, vaza |

Baixo: o escopo declarado é "direto"; os 3 furos são quase-identificadores. Registrar no cabeçalho.

### 6.2 `account.js` — exclusão/exportação **não alcança o sprite gerado**

- `collect()` junta save, `profile:`, `gifts:`, `rank:*`, `ent:`; `onRequest` › `delete-confirm` apaga
  esses + varre `push:`/`fcm:` (diff de hoje torna a varredura melhor-esforço com `log`). **Nenhuma linha
  toca `sprite:img:<saveId>:<formId>` nem `sprite:blob:*`** (`grep -n "sprite" functions/api/account.js`
  → 0). São as imagens da criatura da pessoa, derivadas de `favoriteCreature` + respostas do Oráculo,
  gravadas **sem TTL** por decisão ("arte paga"). Não estão na exportação, não são apagadas, e **não
  estão em `NOT_INCLUDED`** — a resposta ao titular diz "Isto é tudo que o Soulmon guarda de você nos
  servidores… o que não está aqui está em naoIncluido", e isso é falso para até 11 imagens por conta.
  **Alto** (é a promessa de completude do inventário, não a norma — nenhuma norma afirmada aqui). Dono:
  guarda da medição + `alpha-compliance` para dizer se apaga ou declara; código é do backend.
- Contadores `ai:*:<saveId>:<dia>` têm TTL 30h — não precisam entrar.

## 7. LINHA VERMELHA — as 21 proibições

- 12 por teste + parciais: **22 arquivos, 448 testes, verde** (comando em §0).
- As **5 ainda "só tese"** (das 9 do manual, 4 já tinham teste — `09-guardas.md` §2):

| # | Estado hoje | Régua (09 §2) | Feito nesta rodada |
|---|---|---|---|
| **15** FOMO | sem violação (`grep` → 0 fora de comentário) | `src/copy.semFomo.contract.test.ts` | **ESCRITA e verde**: varre `src/components/**`, `workers/*.js`, `android/.../java`, `res/values`, `i18n.ts`, `petVoice.ts`, `welcomeBack.ts`, `_pushCopy.js`, `public/*.html` (18 regex PT/EN, sem comentário) + `ALL_SHOP_ITEMS`/`SPECIAL_ITEMS` sem campo de prazo + descrições sem escassez. 5 testes passam |
| 17 nono perdão | inventário dos 8 não existe em `src/` nem no manual | `perdoes.inventario.contract.test.ts` | não — depende de escrever a lista (decisão de doc) |
| 18 cliente do chat | servidor coberto; cliente (`ChatBox` → `context`) sem teste | `ChatBox.contexto.contract.test.ts` | não |
| 19 estrutural | só copy | `notificacao.semRecompensa.contract.test.ts` | não |
| 20 chaves só acrescentam | **teste no sentido contrário** (`widgetSemCobranca.contract.test.ts` exige `remove()`) — **ainda aberto**, `vetos.md` sem parecer | snapshot + `REMOVIDAS_POR_VETO` | não — precisa do parecer primeiro |

- `.claude/agents/soulmon-guarda-linha-vermelha.md` e `vetos.md` "20 proibições / oito por tese": **ainda
  aberto** (não conferi de novo; o manual diz 21/9 e agora, com #15, 21/8).

## 8. PLATAFORMA — pulado (outro agente).

---

## 9. SQUAD-NARRATIVA — strings novas de hoje × 12 leis

`src/narrativa.contract.test.ts` verde (vocabulário §12 em `src/`). Mas o teste só varre `src/` — `docs/PLAY-FICHA.md`
e `index.html` ficam fora. Lidas à mão:

| Superfície | Veredito |
|---|---|
| `TermsUpdateBanner.tsx` ("Nada muda no seu jogo. Se quiser ler…") | ok — informativo, sem re-aceite, sem urgência |
| `FeedbackLink.tsx` ("Falar com quem faz o Soulmon"; corpo Versão/Código/Origem) | ok; `saveId` vai truncado (`SAVE_ID_PREVIEW`) — bom |
| `SettingsPage` › Sobre (4 parágrafos + IA declarada) | ok — cumpre §16 (os três limites) literalmente; L1 respeitada ("não avalia") |
| `index.html` aviso de WebView ("Precisamos de uma atualização… Android System WebView") | ok — fala do aparelho, não da pessoa; bilíngue; só EN-fallback se `navigator.language` não for pt |
| **`PLAY-FICHA.md` §1.3/§2.3 fecho: *"Ela está esperando. Ela vai se parecer com você."*** | **REPROVA L2 e L11.** L2: "a criatura é outra pessoa, não um espelho" — "vai se parecer com você" é o espelho, dito na frase que fecha a loja. L11: "esperando" é emoção da criatura causada pela ausência da pessoa — a **mesma** família de *"Tô com saudade"* que `1480b632` tirou de `lowHp` hoje. §3 "Verificação de verdade" da ficha não confere essas duas frases (só as mecânicas). |
| `PLAY-FICHA.md` "não conta os dias em que você **faltou**" / "Duas **faltas** seguidas" | borda L1 — "faltar" põe a pessoa como sujeito de ausência; `petVoice` proíbe `falhou/falha`, a ficha usa o primo. Sugestão: "dias sem marcar" |
| `PLAY-FICHA.md` "Se você se afasta, ela recua para uma forma que se sustenta com menos" | ok — L3 permite descrever a sustentação; não é "definha por abandono" |

**`WidgetRenderer.kt` — frases EN (só lista, outro agente propõe):** `"Glad you're back!"`, `"Let's tackle our
tasks together?"`, `"You're my favorite partner!"`, `"Ready to evolve today?"`, **`"I missed you!"`**,
`"You can always count on me!"`, `"Good to see you!"`, `"Together we're stronger!"`, `"I'm rooting for you!"`,
**`"I miss you..."`** (hp ≤ 20), `"Let's add a task?"`, `"We crushed it today! ✨"`, `"Whenever you're ready, I'm
here."`, **`"I've been missing you"`** (hp ≤ 20), `"Today, just five minutes?"`, `"You've been steady"`, `"One day at
a time"`, `"Complete day!"`, `"Almost there!"`, `"Keep it up!"`, `"You started — that already counts"`, e os nomes de
estágio. Em negrito: a família "saudade por ausência" (L11) que saiu do `petVoice` hoje e **continua no
widget**. `"We crushed it"`/`"You've been steady"`: L12/L1. Widget é EN-only (sem PT).

## 10. SQUAD-SOM

- `sonsAssets.ts` (5 entradas: `evolve`, `degenerate`, `task-complete`, `trilha-base`, `trilha-ritmo`) ×
  `sha256sum public/sounds/*.webm` × `Attributions.md` linhas 93–97: **5/5 iguais**.
- `SettingsModal` saiu (`4a8b8049`); mudo/trilha continuam em `SettingsPage` › grupo "Som"/"Sound";
  `settingsSom.render.test.tsx` **5 passed**. Sem achado.

## 11. SQUAD-ARTE

- `emblemArt.ts` cabeçalho já registra: `dias-completos-30.png` = arte antiga de `tasks-100` ("três lajes
  marcadas") — **"redesenhar é da squad-arte"**, mas **a fila não tem o pedido**: `docs/ASSETS-A-GERAR.md` §5
  ("Emblemas — aprovado: 8 conquistas") ainda lista **`tasks-100`** com prompt "(8) a stack of three checked
  slabs, one hundred tasks", diz **8** conquistas (código: **9**, `ACHEVEMENT_IDS`) e usa ids **`streak-7`,
  `milestone-21`** que não existem (`achievements.ts`: `habit-7`, `habit-21`, `habit-66`; arquivos em
  `src/assets/soulmon/emblems/` seguem o código). Pedido a registrar: §5 → "Falta — E1: regerar
  `dias-completos-30` (30 sóis/dias? — símbolo de dia completo, não de pilha de tarefas) + `habit-66`
  conferir; reescrever ids". `streak-7` como id é ainda pior: "streak" é a proibição #1 no nome.
- **`PLAY-FICHA.md` §6 pede 8 screenshots ×2 idiomas (1080×1920, captura do build), feature graphic
  1024×500 ×2 e ícone 512 — o `arte-gerador` NÃO tem família para isso.** `.claude/agents/arte-gerador.md`
  tabela: `cenario | criatura | fx | emblema | marca | hud`. Screenshot é **captura** (Browser pane/emulador +
  legenda), não geração — nenhuma das 6 famílias, e `arte-conferente` não tem régua para "legenda sem
  cobrança". Feature graphic é composição (wordmark `marca` + visor + criatura demo + tagline Rubik) — o mais
  perto é `marca`, que é "vetor por pixel" e só toca ícones. `ASSETS-A-GERAR.md` não tem §7 "Loja/Play".
  Dívida de squad: família `loja` (ou skill à parte) com destino `docs/loja/play/<pt|en>/`.

## 12. SQUAD-DESIGN

- **`TermsUpdateBanner`**: entra na **fila 2 do slot de avisos** como 7º (`App.tsx` › IIFE, `key: 'termos'`,
  "o ÚLTIMO da fila"). `INVENTARIO-WIREFRAMES.md` › `RIT-02` declara a ordem `firstDay → hp → semanal →
  triagem → priming → recomeco` (6) e exige "superfície nova entra numa das duas filas, **com posição
  declarada**" — o código hoje tem **8** (`sobrecarga`/`isOvercommitted` também não está lá). Visual: reusa
  `.sm2-notice` + `sm2-notice-title/body/actions` (mesmo bloco de `HOME-16` recomeço) — o canvas Sistema
  cobre o componente; **falta a linha no inventário** (posição 7 e 8), não um artboard novo. Dívida de doc
  de design, baixa.
- **Grupo "Sobre"**: `CONTA-01` diz "`SettingsPage` — **cinco grupos por intenção**"; `grep -c "Group
  title" src/components/SettingsPage.tsx` → **9** (Sua conta, Seus dados, Sua história, Som, O que o Soulmon
  te manda, Aparência, Ajuda, **Sobre**, Seu ritmo). Sobre = 4 `<p sm2Text/sm2Hint>` + `ActionRow` + `FeedbackRow`
  — componentes que o canvas Sistema já tem. É **dívida de canvas** (`CONTA-01` desatualizado em 4 grupos),
  não de componente. `FeedbackLink` (`ActionRow` com `href mailto:`) idem.

---

## 13. Tabela final

| # | Achado | Sev. | Conserto | Dono |
|---|---|---|---|---|
| 1 | `auditRefunds` rebaixa para `demo` com pedido `courtesy` válido — `tier` discorda de `paidProviderOf` (teste novo reprova 3/3) | **alto** | recomputar `tier` no fim do laço OU voidar a cortesia junto — decisão do dono; código: `_entitlements.js` › `auditRefunds` | guarda-sustento → staff-backend; decisão: dono |
| 2 | Exclusão/exportação de conta não alcança `sprite:img:*`/`sprite:blob:*` (sem TTL) e `naoIncluido` não os declara — inventário promete completude e não entrega | **alto** | apagar no `delete-confirm` (ou declarar em `NOT_INCLUDED` + exportar URLs) | guarda-medição + alpha-compliance → staff-backend |
| 3 | `PLAY-FICHA.md` fecho "Ela está esperando. Ela vai se parecer com você." viola L2 (espelho) e L11 (saudade por ausência) — vai para a loja | **alto** (é a 1ª frase pública) | trocar fecho; ex.: "Ela se assenta no visor. O resto é o seu dia." (L12) — passar por `soulmon-narrative-critic` | squad-narrativa |
| 4 | `dias-completos-30` e `perfect-day` abrem por Glitchtama (`totalPerfectDays++` em `specialItemUse.ts`) — conquista de "dia completo" sem dia completo; sem decisão registrada | médio | conquista lê contador que só `computeDailyReset` escreve; ou exceção em `vetos.md` | guarda-permanência; decisão: dono |
| 5 | `generate-sprite.js` aceita `prompt` livre do cliente sem teto nem recomposição — chave de provedor vira gerador genérico para pagante com curl; imagem fica em KV sem TTL | médio | servidor recompõe/valida o prompt a partir de campos estruturados; teto de chars | guarda-nascimento → staff-backend |
| 6 | `TRAIT_LINES` (`teimoso.haunted`, `madrugador.shower`) violam L1/L12/§5.10 e o teste só lê `pick=0` com 6 palavras | médio | reescrever 3 frases; exportar matriz e passar pela `PROIBIDAS_PT/EN` inteira | guarda-vínculo + narrative-critic |
| 7 | `WidgetRenderer.kt`: "I missed you!", "I miss you...", "I've been missing you" — a família removida de `petVoice` hoje segue no widget | médio | (outro agente propõe) | squad-narrativa / plataforma |
| 8 | `arena.ts` cabeçalho "SEM CONSUMIDOR" é falso desde `6fe6c73a` — Arena ligada sem auditoria de regra | médio | corrigir lápide; guarda-permanência auditar `ArenaGame.tsx` (drops, multiplicadores) | guarda-permanência |
| 9 | Dois relógios de dia (aparelho para virada; âncora para tetos) — declarado em `playerDay.ts`, ausente do manual e sem decisão | médio | registrar em `02-REGRAS-DE-NEGOCIO.md` + pergunta ao dono (migrar `lastResetDate` para a âncora?) | guarda-constância → doc-redator-regras; decisão: dono |
| 10 | `ASSETS-A-GERAR.md` §5 desatualizado: 8 vs 9 conquistas, ids `streak-7`/`milestone-21`/`tasks-100` inexistentes; sem pedido de rearte de `dias-completos-30` | médio | reescrever §5 com `ACHIEVEMENT_IDS` + item "E1" | squad-arte (curador) |
| 11 | `PLAY-FICHA.md` §6 pede screenshots/feature graphic e `arte-gerador` não tem família — pedido sem executor | médio | família `loja` (captura + legenda + composição) e §7 na fila | squad-arte (lead) |
| 12 | Cortesia consome IA igual a pago: 25 × 26 = 650 imagens = 81 % do `globalMonth` — número não declarado | baixo | escrever o teto de dano em `_entitlements.js` › bloco CORTESIA; ou `perAccountLifetime` menor para `provider: courtesy` | guarda-sustento; decisão: dono |
| 13 | `vetos.md` aceite de #16 "nenhuma conquista lê `.length`" — `gatilhoAntigoTasks100` lê (migração legítima) | baixo | aceite: "exceto `gatilhoAntigoTasks100` (migração)" | guarda-linha-vermelha |
| 14 | `minimizeForAi` deixa passar celular sem DDD (9 dígitos), CEP e data de nascimento | baixo | declarar no cabeçalho; opcional regra `\b9\d{8}\b` | guarda-medição |
| 15 | `INVENTARIO-WIREFRAMES.md` `RIT-02` (6 avisos; código 8) e `CONTA-01` (5 grupos; código 9) desatualizados | baixo | atualizar as duas linhas; sem artboard novo | squad-design (curador) |
| 16 | `SHOP_AND_CURRENCY_PRIMER` exportado sem consumidor, com "Créditos… ajudas extras" contradizendo a ficha | baixo | apagar ou consumir no `GuideModal` com a copy da ficha | guarda-nascimento |
| 17 | #20 com teste no sentido contrário e sem parecer em `vetos.md` — **ainda aberto** (09 §2) | médio | parecer do guarda antes de qualquer régua | guarda-linha-vermelha |
| 18 | `PLAY-FICHA.md` "faltou"/"faltas" (borda L1) | baixo | "dias sem marcar" | squad-narrativa |

**Réguas entregues:** `src/copy.semFomo.contract.test.ts` (#15, 5 verdes — sai da lista "por tese");
`functions/api/_entitlements.tierDerivado.qa.test.js` (reprova o achado 1; fica vermelho até o conserto).

## O que continua sem dono

- **Decisão "cortesia sobrevive a reembolso da Play?"** — o teste novo reprova nas duas respostas possíveis
  até que alguém escolha; hoje ninguém é dono da resposta (`PERGUNTAS-DO-DONO.md` não tem a pergunta).
- **Um "hoje" só**: migrar `lastResetDate`/`dayKeyOf` para a âncora do jogador exige migração de save e
  ninguém está designado; `playerDay.ts` diz "não faço" e para.
- **Material de loja (screenshots/feature graphic)**: `PLAY-FICHA.md` pede à `squad-arte`, a squad não tem
  família nem seção — pedido em aberto sem executor.
- **Copy do widget Android**: EN-only e com a família "saudade" — narrativa não tem régua que leia `.kt`
  (o `copy.semFomo` novo lê, mas só FOMO); ninguém revisa o widget contra as 12 leis.
- **Inventário dos 8 perdões (#17)**: sem lista escrita, "nono" segue incontável — é doc, e nenhum redator
  do manual foi apontado.
