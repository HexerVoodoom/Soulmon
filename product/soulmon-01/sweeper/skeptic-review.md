# Revisão adversarial — fase sweeper (Soulmon)

> `investor-skeptic`, run `soulmon-01`. Ataque aos artefatos `release-readiness.md`
> e `security-verification.md` antes do gate humano.

## 1. Veredito em uma linha

**Os dois artefatos sobrevivem como auditoria de código e falham como julgamento de
prontidão** — a fase declarou um exit bar comportamental ("a demo sobrevive a input ruim
e rede intermitente") e o verificou inteiramente por leitura estática: `vitest.config.ts:4`
fixa `environment: 'node'`, ou seja **nenhum dos 407 testes renderiza um componente**, e
nenhum artefato desta fase abriu o app.

## 2. Objeções ranqueadas

**O-1 · Fase inteira (exit bar) · FATAL para a tese da fase.** O exit bar é comportamental;
a verificação foi estática. `vitest.config.ts:4` é `environment: 'node'` — **não existe um
único teste que monte um componente**, nem hoje nem antes. Logo o checkbox de 2px era, por
construção, incapturável pela suíte, e continua sendo. O `qa-sweeper` dispensou Playwright
em §6 argumentando que "a verificação mecânica é mais forte que o olho aqui" — é mais forte
para *contar* classes ausentes e mais fraca para *saber se a tela funciona*, que é
literalmente o exit bar. 🟢 exigiria: uma passada real (Playwright ou aparelho) nas ~15
telas do achado #4 + os 4 modais do #7, com screenshot, semeando `localStorage` por
`addInitScript`.

**O-2 · `release-readiness` achado #4 · FATAL para o julgamento de release.** 130
ocorrências foram **contadas**; zero foram **observadas**. As consequências afirmadas
("todo ícone pode ser espremido a zero", "o modal cresce sem teto e o botão de salvar sai
da tela", "o balão de fala não centraliza") são **predições derivadas do contrato CSS, não
medições** — e o §6 admite que a confirmação visual "fica para o fix". Se 5 das 130 degradam
a tela, é higiene 🟡; se 60 degradam, o app está visualmente quebrado hoje. Essa diferença é
a diferença entre lançar e não lançar. 🟢 exigiria: `getBoundingClientRect` ou screenshot por
classe, convertendo "130 ocorrências" em "N telas degradadas".

**O-3 · Ranking entre os dois artefatos · FATAL (o achado real não foi nomeado).** O
`release-readiness` abre com o achado #1 (desktop nunca gravou), que afeta **zero usuários
vivos** — pré-lançamento, sem App ID Steam (`STATUS` §3.3). O `security-verification` abre
com N-1: takeover total de conta a partir de um e-mail, **explorável agora, no PWA que está
no ar**. Os artefatos não foram reconciliados e o mais grave está no segundo. Pior: o #1
prova que **ninguém nunca usou o overlay**, e mesmo assim `STATUS` §2 o registra como
"overlay funcional" e existe um `docs/PLANO-DESKTOP-STEAM.md`. O bug é de 1 linha; o problema
é o registro vivo do projeto afirmando algo falso sem que nada detectasse. 🟢 exigiria:
ranking único cross-artefato por (explorável hoje × usuários afetados × custo) + correção do
`STATUS` §2.

**O-4 · `release-readiness` §4 (cobertura) · sobrevivível, custa as notas 6 e 8.** Seleção
de amostra. O número real é **16,01% de statements em `src/`**, descartado como "enganoso"
em uma frase, seguido de uma tabela onde as superfícies escolhidas marcam 94%/100%/95,5%. As
superfícies fora da tabela são as que já quebraram o produto: `App.tsx` (~1500 linhas, todos
os handlers), `GameStateContext.tsx`, `CompanionHUD.tsx`. Precedente no próprio `STATUS` §2:
**"concluir tarefa não dava nada"** — `careRules` estava coberta e correta; o laço central
estava morto porque o defeito vivia no orquestrador. Essa classe segue em 0%. 🟢 exigiria:
cobertura declarada por *caminho de usuário* ("concluir tarefa da UI ao save": sim/não).
Hoje: não.

**O-5 · achado #6 · sobrevivível, indefensável.** O relatório afirma que `functions/**` é "o
mais alto risco do produto" e **não mediu** — declarando "fora do meu escopo desta rodada"
uma mudança de **uma linha** (`vitest.config.ts:15`), numa rodada em que escreveu 4 arquivos
de teste. Medir custava menos que qualquer outra coisa que ele fez, e mediria a tese central
do documento. É o furo mais direto na autonota 🟢 da dimensão 8: a afirmação mais forte do
relatório é a única sem número.

**O-6 · os 9 testes vermelhos · sobrevivível.** "Trava a regressão depois do fix" é
**hipótese não verificada**. Um teste vermelho só trava regressão se for verde *com* o fix e
vermelho *sem*, e nenhum dos 9 foi validado nas duas pontas. Exceções honrosas e explícitas:
`index.css.contract.test.ts` (4 casos de autoverificação) e `pushCareAction.test.ts` (liga no
`onRequest` real). Os outros 5 podem estar vermelhos por erro do próprio teste, e o artefato
não distingue os casos.

**O-7 · `security-verification` N-3 · sobrevivível (achado válido, prova incorreta).** A
cadeia confunde dois campos. `soulGoal` (`GameStateContext.tsx:194`) **vai** ao KV — provado.
Mas a perna "→ Groq (EUA)" cita `GameTutorialFlow.tsx:149` → `taskSuggestions.ts`, e o que é
enviado ali é `goalText`, estado local do tutorial (`GameTutorialFlow.tsx:108,149`);
**`soulGoal`/`soulStruggle` não aparecem em `taskSuggestions.ts`** (grep: zero ocorrências).
O achado LGPD sobrevive (é texto livre indo a processador nos EUA, e a correção é a mesma),
mas o achado mais caro do relatório tem a evidência mais frouxa. São dois achados, não um.

**O-8 · `security-verification` R-8 · fatal como dimensão 4, e ninguém marcou a dimensão 4.**
"Aceitável e explicitamente registrado" para rate limit é a resposta certa em segurança e a
**errada em economia**. `action=players` faz até 300 leituras de KV por chamada sem custo
para o chamador; `subscribe` grava sem teto. Isso é **o modelo de custo do produto sendo
definido por um estranho**. "Reavaliar quando houver usuário real" inverte a ordem: o dano
acontece no primeiro dia de tráfego. Nenhum artefato calculou custo por DAU (KV + Groq no
idle de 3 min do `CompanionHUD`).

**O-9 · autoavaliação dim 6 · nota certa, argumento inválido.** A evidência "a favor" inclui
**"398 testes verdes"** — no mesmo documento cuja tese é que a suíte verde não detectou três
defeitos reais. Não se pode contabilizar como ativo o instrumento que você acabou de
demonstrar ser cego.

**O-10 · autoavaliação dim 1 · cosmético, mas é regra do loop.** 🟢 atribuído com o texto
"**Fora do meu escopo**". Grade fora de escopo é grade lavada mesmo quando generosa por
acidente; a régua manda ⚪ (o autor fez isso corretamente em 2, 4 e 7).

**O-11 · R-4 / N-6 · sobrevivível hoje, fatal no lançamento com dinheiro.** "Aceitável
enquanto o DigiApp for do mesmo dono e não receber deploy de terceiro" é risco aceito **sem
gatilho de reavaliação** — ao contrário do R-5, que o próprio artefato elogia justamente por
ter um teste que dispara. R-4 depende de alguém lembrar. Qualquer deploy no Pages do DigiApp,
produto **fora deste repositório e sem CI compartilhado**, lê o `SOULMON_PROFILE` inteiro e o
ID token do Firebase.

**O-12 · ambos, seções "fora de escopo" · sobrevivível com divulgação obrigatória.** Três
superfícies excluídas pelo **mesmo motivo** ("não dá pra exercitar honestamente aqui"):
`android/`, `workers/`, Playwright. São, juntas, a plataforma de lançamento nº 1, o canal de
retenção e a camada de UI. A honestidade da exclusão é real; a consequência precisa estar no
resumo executivo, não no §6: "este relatório não cobre APK, push, nem UI renderizada".

## 3. Correção da autoavaliação

| Dim | Dada | Veredito | Por quê |
|---|---|---|---|
| 1 | 🟢 | **Errada → ⚪** | Dada com "fora do meu escopo" no mesmo campo (O-10). |
| 2 | ⚪ | Certa | — |
| 3 | 🟡 | **Certa** | Wedge web/PWA funciona; extensão desktop/Steam não. Não é 🔴 porque o wedge principal não depende do desktop. |
| 4 | ⚪ | **Baixa → 🟡 com achado** | R-8 põe na mesa um fato de unit economics e o classifica como segurança aceitável. ⚪ conjunto numa dimensão onde a fase produziu evidência é omissão (O-8). |
| 5 | 🟡 | **Alta → 🔴** | O moat é switching cost sobre a criatura e o histórico; ambos vivem no save. N-1: hoje, em produção, qualquer um com o e-mail sobrescreve esse save. #2/#3: o app declara "sincronizado" sem ter sincronizado, e substitui o save inteiro por `{}`. O próprio texto do autor ("moat que depende de dado que pode sumir não compõe") argumenta 🔴 e conclui 🟡. |
| **6** | **🟡** | **Nota certa, justificativa inválida** | Sustenta 🟡: os 5 defeitos são baratos e nenhum é arquitetural; `careRules`/`dailyReset` são engenharia real; o Electron é a superfície mais bem configurada do projeto. Contra 🟢, decisivo: um recurso de plataforma anunciado como pronto no registro vivo nunca funcionou. Retire "398 testes verdes" da evidência (O-9) e absorva O-1 — não se alega credibilidade de execução sobre um exit bar comportamental sem nunca executar. |
| 7 | ⚪ | Certa | — |
| **8** | **🟢** | **Alta → 🟡 forte** | Mérito acima da média: `arquivo:linha` em todo achado, teste do desktop ligado no `onRequest` real em vez de mock 200, 4 casos de autoverificação do guard, paridade PT/EN rastreada de 115 candidatos até a causa de cada falso positivo. Impedem 🟢: (a) #4 é contagem sem observação, com predição em linguagem de medição; (b) #6 declara o maior risco e não mede quando medir custava uma linha; (c) "trava a regressão" é hipótese não verificada. |

**Agregado corrigido: 🟡 com 5 em 🔴** (contra o 🟡 declarado). A diferença não é cosmética:
🔴 na 5 muda a conclusão de "bloqueia o lançamento do desktop" para "bloqueia qualquer
lançamento com dinheiro".

**Nota de honestidade, nos dois sentidos: não há lavagem de nota nesses artefatos.** O
`qa-sweeper` documentou o próprio ponto cego (#6), publicou os 16% globais em vez de
escondê-los, separou o que não conseguiu provar e recusou inflar `rubHeal` e o spam de cloud
save a achados. O `security-architect` derrubou a própria afirmação anterior do `STATUS` §1.3
sobre PII. Isso é o oposto de rubber stamp e o oposto de autoflagelo. As correções acima são
de calibração, não de integridade.

## 4. Pontos cegos da fase (além dos dois já declarados)

1. **Migração de save legado.** Fork do DigiApp, usuários com saves antigos, três caminhos de
   migração (`equippedFurniture`→`equippedDecor`, `LEGACY_FORM_TIERS`, `legacySpriteForStage`)
   e **nenhuma fixture de save real de produção em teste**. Dano: o primeiro APK novo quebra o
   save de quem já joga — guardrail nº 5 violado no lançamento.
2. **O APK.** Plataforma nº 1, ninguém compilou nem abriu. A ponte Capacitor↔web
   (`DigiWidgetPlugin`, SharedPreferences, canal `digiapp_push`) é fronteira entre duas
   linguagens sem um único teste cruzando — a assinatura exata dos três defeitos desta fase.
3. **Deploy do Service Worker.** `CACHE_VERSION` é bump manual e o `CLAUDE.md` diz v24 contra
   v39 (achado #14) — a deriva já é sintoma. Ninguém testou "usuário com SW antigo recebe
   deploy novo". Dano: base instalada presa em bundle velho, sem receber as correções desta lista.
4. **Relógio do dispositivo.** Um v-pet cujo laço é a virada do dia, e ninguém testou mudar a
   data: adiantar para farmar `perfectDays`, atrasar para evitar o dreno de cocô.
   `computeDailyReset` é pura e testada — contra o relógio que ela recebe.
5. **Conflito entre dois aparelhos.** Cloud save é last-write-wins sem versão. Celular offline
   à tarde + desktop à noite = o celular sobrescreve o desktop ao reconectar. Perda silenciosa,
   direto no moat.
6. **Quota de `localStorage`.** `activityLog` (90) + `completedTasks` + `digiapp_state_v3` +
   `SOULMON_PROFILE` + inventário, num domínio compartilhado com o DigiApp (N-6). Nenhuma
   medição de crescimento, nenhum teste de `QuotaExceededError` — que em `setGameState` é
   estado que não persiste, sem erro visível.
7. **Custo por usuário** (O-8).
8. **Desempenho em aparelho real.** A única métrica é o tamanho do bundle: zero FPS do pet
   animado, zero tempo até interativo em 3G, zero bateria.
9. **Deriva Pages Functions ↔ worker.** O `security-verification` §4 nomeia o mecanismo
   (deploy manual, nada no CI avisa) e não o transforma em achado. `_pushTargets.js` corrigido
   nas Functions e velho na borda é o estado *default*.

## 5. Falha estrutural: azar ou processo?

**É processo, e tem nome: "cobertura de unidade sem cobertura de contrato"** — mais curto:
**a suíte mede intenção, não efeito.**

| Defeito | Fronteira | Dono |
|---|---|---|
| Checkbox de 2px (`w-7`/`h-7`) | JSX ↔ CSS pré-compilado | ninguém |
| Overlay que nunca gravou | cliente desktop ↔ handler HTTP | ninguém |
| `save.js` sem teste | código de função ↔ medidor de cobertura | ninguém |

Nenhum é erro de lógica. Todos são um lado da fronteira assumindo algo sobre o outro, sem
nada que force o encontro. E o teste, escrito pelo mesmo autor com o mesmo modelo mental do
código, **concorda com o código** em vez de confrontá-lo com a realidade.

A prova mecânica cabe em uma linha: `vitest.config.ts:4` → `environment: 'node'`. **Não
existe um único teste que monte um componente.** Não é que a suíte deixou o checkbox passar —
ela era estruturalmente incapaz de vê-lo, e continua sendo. O mesmo vale para `functions/` no
medidor (`:15`) e valia para o contrato HTTP do desktop até agora. Três instâncias, uma causa.

Reforço: toda fase deste projeto exclui, com boa justificativa individual, exatamente as
verificações onde intenção e efeito divergem — "Playwright fica pro fix", "Android sem
toolchain", "worker precisa de KV real", "coverage é config, fora de escopo". Cada exclusão é
defensável sozinha. Juntas, elas *são* a falha.

### O que a diagnose prevê (falsificável)

Os próximos defeitos reais **não** serão erros de regra de jogo — serão fronteiras sem dono,
nesta ordem:

1. **APK / ponte Capacitor** — widget com dado velho ou push nativo não chegando, com o web
   perfeito. *É onde eu apostaria.*
2. **Save legado ↔ código novo** — usuário do DigiApp perde decoração, estágio ou inventário
   na primeira carga pós-lançamento.
3. **Service Worker ↔ deploy** — base instalada presa em bundle velho.
4. **Worker ↔ Pages Functions** — correção de segurança nas Functions e ausente na borda por
   semanas.
5. **Mais classes fantasma** fora do alcance do guard novo (ele cobre componentes de tela em
   `src/`; o renderer do desktop tem CSS próprio e nenhum guard equivalente).

Teste da previsão: se o próximo bug real for de lógica dentro de `utils/`, minha diagnose está
errada e foi azar. Registrem e cobrem.

**A contramedida não é "mais testes"** — é um teste por fronteira, com dono: `jsdom` + um
render por tela crítica; um teste de contrato por endpoint (o `pushCareAction.test.ts` desta
rodada é o modelo certo, replique-o); uma fixture de save de produção no CI; um smoke do APK
no `android-build.yml`.

## 6. Julgamento de release

**NÃO VAI.** Nem Play Store nem Steam — e por motivos que não são o achado #1.

- **Steam:** bloqueado antes da técnica (sem App ID/Depot, `STATUS` §3.3) e, ainda assim, o
  cliente faria uma promessa falsa: as três ações do overlay não gravam (#1).
- **Play Store:** bloqueado pelo formulário de Segurança de Dados — política de privacidade é
  🔴 (`STATUS` §3.2) e há texto livre do usuário indo a processador nos EUA sem base legal nem
  aviso de transferência (N-3, corrigido por O-7). Some-se N-1: hoje, em produção, um e-mail é
  um takeover.

### Lista mínima (a ordem do `security-verification` §7 está certa)

1. **N-2** — `Authorization` no `Access-Control-Allow-Headers` de `save.js`, `entitlements.js`,
   `community.js`. 4 linhas. **Antes** do item 3, ou o rollout quebra o desktop em silêncio e
   alguém desliga a autenticação.
2. **#1** — `?id=${saveId}` no POST de `cloudSync.ts:240`. 1 linha, teste já escrito. E
   corrigir `STATUS` §2.
3. **N-1** — ligar `FIREBASE_PROJECT_ID`. Nada com dinheiro sai antes.
4. **#2 + #3** — `res.ok` antes do carimbo; `typeof state === 'object' && !Array.isArray(state)`
   + teto de tamanho. São as duas rotas de **perda de save**, e save é o moat.
5. **N-5** — `allowBackup="false"`. Uma linha, e é o que torna verdadeira a frase "a PII do
   oráculo não sai do cliente".
6. **N-3** — política publicada + parar de mandar texto livre ao Groq + rota de exclusão de
   conta. Único item com prazo externo e o mais lento: comece em paralelo.
7. **SEC-3** — D1 `order_claims` + `PLAY_REQUIRE_ACCOUNT_BINDING=true` **antes** de qualquer
   chave de billing. Promover o D1 de 🟡 para 🔴, amarrado ao mesmo checklist.
8. **O-1/O-2** — passada visual real nas 15 telas do #4 e nos 4 modais do #7, com screenshot.
   Sem isso o exit bar da fase segue sem resposta.
9. **Fixture de save legado** no CI antes de publicar APK novo (ponto cego 1).
10. **Teto por IP em `/api/community` e `/api/subscribe`** — por custo, não por segurança
    (O-8). O dano começa no primeiro dia de tráfego.

### Honestamente adiável

#9 (chunking do oracle; 385 kB não mata ninguém), #11/#12 (`sw.js`, impacto contido e fallback
existe), #13 (`'Anônimo'`), #14 (doc), #8 (bloco `guide` morto), N-4 (custo, com teto), N-7
(CSP deve ir, não trava loja), contraste das telas não migradas, cobertura de
`dungeon.ts`/`monetization.ts`.

**#10 (TTL de 365 dias) não é adiável como decisão, só como código:** colide de frente com o
guardrail nº 1 ("quem volta encontra saudade") e precisa de um "sim, é isso mesmo" escrito,
não de um efeito colateral.

**N-6 é adiável só enquanto ninguém de fora tocar no Pages do DigiApp — e vira bloqueante no
minuto em que houver Créditos comprados com dinheiro real na mesma origem.**
