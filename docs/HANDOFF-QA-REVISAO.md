# Handoff — sessão de QA e revisão do app inteiro

> **Escrito em 08/09/2026**, ao fim de duas sessões que mudaram muita coisa em
> pouco tempo. Esta página existe para a sessão de QA **não gastar o turno
> redescobrindo o terreno** — e, principalmente, para ela saber **onde eu
> provavelmente errei**.
>
> Leia `CLAUDE.md` e `docs/STATUS.md` primeiro. Esta página não os substitui:
> ela diz o que mudou POR ÚLTIMO e o que merece desconfiança.

---

## 1. Antes de rodar qualquer coisa — o ambiente engana

| Armadilha | O que acontece se ignorar |
|---|---|
| **Node.** A máquina roda Node 25; o projeto declara 22. O Node 25 cria um `localStorage` global vazio que sombreia o do jsdom e **derruba 7 testes** que não têm nada de errado. | A suíte mente. Use `E:/tools/node/node-v22.23.2-win-x64` (`export PATH="/e/tools/node/node-v22.23.2-win-x64:$PATH"`). |
| **`dist/` é COMMITADO.** | Mudou código de UI e não rodou `npm run build`? O que está no ar continua sendo o bundle antigo. |
| **`.env.production` é commitado de propósito** (`!.env.production` no `.gitignore`). | Apagar "por segurança" **mata o login em produção no push seguinte** — as `VITE_*` são inlinadas em BUILD e o CI rebuilda sem o `.env` da máquina. Já aconteceu (07/09). Guardado por `src/deploy/firebaseNoBuild.contract.test.ts`. |
| **CRLF.** Os arquivos são CRLF no working copy. | Script de edição que escreve LF gera diff de arquivo inteiro. |
| **Fonte de ícones subsetada.** | Um `<Icon name="...">` fora do inventário de `src/styles/tokens.md` renderiza **vazio, sem erro**. `src/styles/iconInventory.contract.test.ts` guarda isso — ele já pegou dois casos reais (`balance`, `account_tree`). |

**O gate, na ordem:**

```bash
npx tsc --noEmit
npx tsc -p desktop/tsconfig.json --noEmit
npx vitest run
npm run build
```

Estado em 08/09/2026: **252 arquivos, 3631 testes passando, 1 pulado.**

---

## 2. O que mudou nas últimas 48h (é aqui que os bugs novos moram)

Em ordem cronológica. Cada item traz **o que eu conferiria primeiro**.

### 2.1 Portão de conta — a primeira tela do app
`23cc6844`, `a9029a2d`, `d19ddda8`, `340ccef0`

Três telas antes de qualquer coisa: `IDENTITY_STEP` (Google / ou / Novo usuário)
→ `CHOICE_STEP` → `EMAIL_STEP`/`GOOGLE_STEP`. O `CONSENT_STEP` e o passo 0 de
intro **foram apagados**. A verificação de idade virou **caixa de declaração** —
`ageOnMonth`, `isAgeBlockedByMonth` e `monthYearFromText` saíram de
`utils/consent.ts`.

**Confira:** o caminho de quem **bloqueia popup** (cai em `signInWithRedirect` e
volta — `utils/gateDraft.ts` guarda `soulGoal`/`soulStruggle`/`consent` na ida e
volta, e **nunca** o e-mail); o que acontece com quem chega **sem `.env`**
(build de contribuidor: o portão tem de degradar, não trancar o app); e se
alguma tela de onboarding ficou órfã depois da remoção dos dois passos.

### 2.2 Balanceamento — P1, P2, P5
`44b7a7c3`

Três mudanças de REGRA no mesmo commit, e é o commit mais arriscado do lote:

- **P1** — a perda de coração passa a medir contra `heartGoalFor` (60% da meta,
  `HEART_GOAL_RATIO`). O **dia completo continua exigindo a meta inteira**.
- **P2** — uma folga por semana, gasta sozinha na virada (`REST_DAYS_PER_WEEK`,
  campos `restDaysLeft`/`restWeekKey` no save).
- **P5** — "dia perfeito" virou "dia completo" **nos textos**; `perfectDays`,
  `wasPerfect` e `dayWasPerfect` seguem com o nome antigo no código.

**Confira, nesta ordem:**
1. **Oito arquivos de teste precisaram declarar `restDaysLeft: 0`** para não
   medirem a folga em vez da regra. Se algum ficou de fora, ele está passando
   por acidente. Procure por `restWeekKey` nos testes e confirme que cada um usa
   a semana do dia JULGADO — semana que não bate é lida como "folga inteira".
2. O **efeito combinado**: com P1+P2, um mega pode fazer 4 de 6 em seis dias e 0
   no sétimo sem perder coração. É intencional e está documentado, mas vale
   simular alguns cenários de duas semanas e ver se a degeneração ainda é
   alcançável por negligência real.
3. `tasksToAvoidHeartLoss` (o número que a UI promete) e `computeDailyReset` (o
   número que o jogo cobra) **têm de usar a mesma régua**. Há fuzz test
   (`gameRules.fuzz.test.ts`), mas ele foi ajustado por mim junto com a mudança
   — é exatamente o caso em que o guard pode ter sido afrouxado sem intenção.

### 2.3 Modo cooperativo
`51a28bb6` — rotas `coop*` em `functions/api/community.js`

2 a 4 pessoas, meta semanal, entrada só por código de convite. A trava central:
**nenhuma contagem individual sai do servidor** — só o progresso do grupo e
"apareceu hoje: sim/não". `vistaDoGrupo` é a única montagem de resposta.

**Confira:** que nenhuma rota nova devolve `saveId`; o rate limit das ações
novas; o caso de **corrida** (duas pessoas entrando no mesmo grupo cheio ao
mesmo tempo — o KV não tem transação, e eu não tratei isso); e o que acontece
com um `coopOf:` apontando para grupo apagado.

⚠️ **Fronteira de confiança declarada:** o check-in é uma AFIRMAÇÃO do cliente,
não verificação. Está documentado no código e é deliberado — mas confirme que
não há nada de econômico dependendo dele (não deve haver: o modo não paga nada).

### 2.4 Quick Add na tela inicial
`8894a512` — `src/components/QuickAddBar.tsx`

O parser **já existia** (`utils/quickAdd.ts`) e alimentava o `CreateModal`. O
que entrou foi a barra na home. A gravação reusa `commitTaskCreate` /
`commitHabitCreate`.

**Confira:** que a barra **não fura o teto do modo grátis** (é a razão de ela
não gravar sozinha); e que a MESMA linha digitada produz a mesma coisa nas duas
telas — data solta vira `startDate`, não prazo, nos dois caminhos.

### 2.5 Aventura da noite
`b29f3523` — `utils/adventure.ts`, card no `DailyReportModal`, `AdventureDiary`

24 cenas, sorteio determinístico pelo dia. **Não paga nada.**

**Confira:** que o card aparece no relatório do dia ruim, do dia que degenerou e
do retorno depois de ausência (há testes, mas confirme na tela); e o
`useEffect` que grava no diário ao ABRIR o relatório — ele depende de
`showDailyReport` e de `gameState.adventures`, e é o tipo de efeito que pode
disparar mais vezes do que o esperado.

### 2.6 Loja e política
`dbb6fd2f`

Política de privacidade atualizada (login Google/senha, modo cooperativo,
**passos** e **humor**), `docs/PLAY-DATA-SAFETY.md` novo, e o CI ganhou o passo
do bundle assinado — **inerte** até existirem os quatro secrets.

**Confira:** que o YAML do workflow é válido e que o passo é mesmo pulado sem
secrets (`steps.keystore.outputs.ready`); e se a política ainda bate com o
código — foi ela que estava mentindo antes, e é o tipo de arquivo que envelhece
sozinho.

---

## 3. Onde eu mais provavelmente errei

Escrito sem eufemismo, porque é o que torna a revisão útil.

1. **Ajustei guards junto com as mudanças que eles deveriam vigiar** (P1/P2 no
   `gameRules.fuzz.test.ts` e no `dailyGoalSources.test.ts`). Toda vez que o
   autor da regra mexe no teste da regra, existe a chance de ele ter ensinado o
   teste a concordar. **Vale reler esses dois diffs com má vontade.**
2. **Escrevi por cima de um arquivo que já existia** (`utils/quickAdd.ts`) por
   ter acreditado num doc desatualizado em vez de conferir o código. Recuperei
   do git e nada se perdeu, mas o padrão de erro é meu e pode ter acontecido em
   escala menor noutro lugar: **desconfie de qualquer coisa que eu tenha
   descrito como "não existia"**.
3. **A folga semanal (P2) interage com tudo que cobra HP** — passivo Teimoso,
   perdão de ausência, carência de save novo, alívio de segunda, degeneração.
   Cobri os que os testes encontraram; não afirmo ter pensado em todos.
4. **Nada do modo cooperativo foi exercitado com duas pessoas de verdade** —
   só com KV falso em teste.
5. **O relatório noturno ganhou dois blocos novos** (folga usada + aventura) e
   ficou mais longo. Ninguém olhou essa tela cheia, com todos os blocos
   possíveis ao mesmo tempo, num aparelho pequeno.

---

## 4. O que NÃO tocar

- **Não apague `.env.production`** nem tire o `!.env.production` do `.gitignore`.
- **Não ligue `PLAY_REQUIRE_ACCOUNT_BINDING`** antes de o APK novo ser publicado.
- **Não apague o KV `DIGIAPP_SAVES`** (`aed229e069fd40d8a141fb1124763d9d`).
- **Não reescreva histórico do git** sem instrução explícita no momento.
- **Não "conserte" a folga semanal removendo-a dos testes** — leia a §2.2.
- **Não mexa nos números de balanceamento** (`HEART_GOAL_RATIO`,
  `REST_DAYS_PER_WEEK`, `COOP_CHECKINS_POR_MEMBRO`): são decisões do dono,
  tomadas em 07-08/09/2026 e registradas em
  `product/soulmon-01/balance/carga-diaria.md` e `docs/PLANO-COOP.md`.

---

## 5. O que está deliberadamente em aberto (não é bug)

| Item | Estado |
|---|---|
| **P3** (alívio adaptativo) | ⏸️ adiada — o porquê e o gatilho para reabrir estão em `carga-diaria.md` |
| **Arte** (A20, 24 cenas + 5.1 decoração) | ⏸️ adiada para uma sessão dedicada — `docs/BACKLOG-ARTE-GERAR.md` |
| **Selo de "verificado" + missões corporais** | ⬜ Fase 4a, camada de cima. Só aparece no Android com sensor, e o APK depende do keystore |
| **Keystore → Play Console → App Links** | 🔒 depende do dono. É a corrente inteira do lançamento (`docs/DEPENDE-DE-VOCE.md`) |
| **Ninguém nunca usou o app em produção** | Nenhum número de retenção foi observado. Toda régua de D1/D7/D30 é hipótese |

---

## 6. O prompt para abrir a sessão de QA

Copie daqui para baixo.

---

Você vai fazer **QA e revisão do Soulmon inteiro**. Não vai implementar features
novas — o objetivo é achar o que está quebrado, o que está mentindo e o que vai
quebrar.

**Leia primeiro, nesta ordem:** `CLAUDE.md`, `docs/HANDOFF-QA-REVISAO.md`
(escrito para você) e `docs/STATUS.md`.

**Ambiente:** use o Node 22 portátil de `E:/tools/node/node-v22.23.2-win-x64` —
com o Node 25 da máquina a suíte mente. `dist/` é commitado; se mexer em código
de UI, rode `npm run build`.

**O que eu quero, em ordem de prioridade:**

1. **Ataque os guards, não só o código.** As últimas 48h mudaram regras de HP e
   de meta, e a MESMA sessão que mudou a regra ajustou os testes dela. Releia
   com má vontade os diffs de `gameRules.fuzz.test.ts`, `dailyGoalSources.test.ts`
   e `habitEligibility.regression.test.ts` nos commits `44b7a7c3` e `4d69721f`, e
   me diga se algum guard foi ensinado a concordar. **Mutação é o método**:
   quebre a regra de propósito e confirme que algum teste cai.
2. **A interação da folga semanal (P2) com tudo que cobra HP** — passivo
   Teimoso, perdão de ausência, carência de save novo, alívio de segunda,
   degeneração, poop drain. Simule duas semanas de cenários e me diga se a
   degeneração ainda é alcançável por negligência real.
3. **As rotas `coop*` de `functions/api/community.js`**: vazamento de `saveId`,
   autorização, rate limit, e o caso de corrida de duas pessoas entrando ao
   mesmo tempo num grupo com uma vaga.
4. **A tela do relatório noturno cheia** — folga usada + aventura + memória de
   marco + convite de compra + humor, todos ao mesmo tempo, em viewport de
   celular. Ninguém olhou isso junto.
5. **O portão de conta**: popup bloqueado, build sem `.env`, e se sobrou tela
   órfã depois de os passos de consentimento e de intro serem removidos.
6. **Varredura geral**: acessibilidade (contraste medido no PIXEL renderizado,
   alvo de toque, leitor de tela), estados vazios e de erro, e qualquer texto
   que exista em um idioma só.

**Como me responder:** cada achado com **severidade** (quebra em produção /
quebra em caso de borda / dívida), o **arquivo e o símbolo** (não o número da
linha — ele apodrece), e **como reproduzir**. Se não conseguir reproduzir, diga
que é hipótese. Não conserte nada sem me dizer antes o que vai mudar, exceto
quando for defeito óbvio e isolado.

**Não toque em:** `.env.production`, `PLAY_REQUIRE_ACCOUNT_BINDING`, o KV
`DIGIAPP_SAVES`, o histórico do git, e os números de balanceamento
(`HEART_GOAL_RATIO`, `REST_DAYS_PER_WEEK`, `COOP_CHECKINS_POR_MEMBRO`) — são
decisões minhas, já tomadas.

Comece pelo item 1 e me mostre o resultado antes de seguir.
