# Enquadramento do problema — **Soulmon** (run `soulmon-01`, Fase 0)

> One-pager de `alpha-discovery` (consumido por `alpha-product-manager`).
> Enquadra o **problema**, não a solução. Toda afirmação com fonte `arquivo:linha` ou rótulo.
> **P3–P8 respondidas por default do HANDOFF, não por escolha explícita do dono.** (P1=todos os
> quatro, P2=A, respondidas pelo dono — `PROGRAMA.md:29-30`.)
> 🚫 **P4=B: não há telemetria.** Nenhum número de funil, retenção, conversão ou custo aparece
> aqui. Toda leitura de produto sai como `[hipótese]` com o experimento que a falseia.

> ## ⚠️ CORREÇÃO PÓS-GATE (2026-08-25)
>
> A frase de abertura deste documento ("o Soulmon está em produção com jogadores reais") foi
> a origem citada pelo gate como um dos dois lugares onde a premissa falsa apareceu de forma
> mais direta. **Corrigida in loco abaixo (🔧).** Soulmon tem zero usuários de terceiro; os
> únicos usuários reais de qualquer parte desta infraestrutura são os 2 do DigiApp (dono +
> namorada), que é outro app/deploy. Ver `contexto.md` §1/§3.
>
> **O que isso NÃO muda neste artefato:** a distinção demo/pago, a análise de
> `generateAllSprites`, a JTBD, as hipóteses H1–H3 e a premissa mais arriscada continuam
> válidas como estavam — elas nunca dependeram de população real existir, e a maior parte já
> se rotulava `[hipótese]` corretamente. O achado central deste documento (billing
> inexistente ⇒ "usuário pago" é população vazia) é, na verdade, **reforçado** pela correção,
> não enfraquecido.

---

## O problema, em 1 parágrafo

🔧 O Soulmon está em **pré-lançamento, sem base instalada de terceiro** (não "em produção com
jogadores reais" — essa era a premissa falsificada pelo gate; ver `contexto.md` §1) e
**construiu o diferencial que justifica sua existência sem entregá-lo a ninguém, nem ao
usuário grátis nem ao que paga** — e, hoje, **ninguém consegue pagar**. A geração de sprite
único (`generateAllSprites`)
tem exatamente **um chamador em todo o `src/`: `OraclePage.tsx:259`**, uma página de ferramenta
que, por decisão registrada, **não tem entrada na navegação** (`CLAUDE.md`, seção Oráculo). O
usuário que percorre o ritual do Oráculo recebe nome, bio e árvore próprios, mas o corpo que
ele vê no app é sorteado por hash da seed entre três linhas genéricas
(`src/App.tsx:3048-3050`, idem `:2317` e `:2367`) que caem em `legacySpriteForStage`
(`src/utils/sprites.ts:104-116`). O usuário grátis, por sua vez, escolhe entre **três
personagens ilustrados de verdade** (`src/utils/monetization.ts:28-44`) e é limitado a
**criar 1 atividade por dia** (`monetization.ts:101`). E a porta de saída está fechada:
**nenhum plugin de billing está instalado** (`src/utils/playBilling.ts:5-6`), logo
`isBillingAvailable()` é `false` em toda plataforma e a própria UI diz ao usuário que "no
navegador não dá para cobrar" (`src/components/UnlockAccountModal.tsx:54-55`) — num app que
**não está na Play Store** (`docs/DEPENDE-DE-VOCE.md:141-150`). O custo disso não é medível
hoje (P4=B), mas é estrutural: o produto opera sem o ativo que o diferencia e sem caixa, e
sem ninguém de terceiro para experimentar nenhum dos dois lados.

**Sintoma × causa.** Sintoma: "o demo não recebe o diferencial"
(`docs/reviews/2026-08-03/soulmon-user-researcher.md:68-69`). Causa: o diferencial **não é
entregue a perfil nenhum** — é uma ferramenta interna, não um passo do fluxo. Reenquadrar isso
como problema *do demo* é diagnosticar funil quando o defeito é de produto.

### Interrogando o achado mais citado do repo

`soulmon-user-researcher.md:68-69` — "o produto tem o diferencial construído e não o entrega".
A conclusão sobrevive; **as premissas dela não.**

| Premissa original (03/08/2026) | Estado hoje | Fonte |
|---|---|---|
| "um em cada três usuários vê a mesma criatura — e as três são Digimon" (`:61`) | **Falso hoje.** A arte da Bandai saiu do bundle; `legacySpriteForStage` resolve para arte própria | `docs/Attributions.md`; `src/utils/sprites.ts:89-95` |
| O afetado é o **demo** | **Invertido.** O demo tem 3 personagens ilustrados dedicados; quem cai no sorteio genérico é o **pago** | `monetization.ts:15-44` vs. `App.tsx:3048-3050` |
| "não há imagem da criatura na tela de revelação" | **Não reverificado neste run** — o arquivo mudou desde 03/08 | `SoulmonOnboarding.tsx` |
| A geração real mora numa página separada, por botão manual | **Continua verdade.** Único chamador: `OraclePage.tsx:259` | grep em `src/` |

⚠️ A fonte é um **rascunho**: `soulmon-user-researcher.md:5-6` se declara "em construção" e
**10 das 10 seções + 4 anexos estão `[EM ABERTO]`**. É o achado mais citado do repo e é a
única linha escrita do documento. Citar `:68-69` como diagnóstico consolidado é reciclar uma
frase de rascunho — o mesmo modo de falha que `PLANO-PRODUTO.md:22` já registrou.

**Resposta à pergunta do despacho — produto, funil ou decisão de negócio?**
É **produto**, com trava de custo consciente por baixo. Não é funil: nenhum funil está medido
(P4=B) e nenhuma tela impede a entrega. Não é decisão deliberada declarada: nenhuma fonte diz
"o demo não recebe sprite gerado de propósito"; o que existe é o comentário
`App.tsx:3045-3047` chamando a linha genérica de **"visual provisório até a Fase 2 assumir"** —
ou seja, **dívida assumida, não política**. O que É decisão de negócio deliberada e legítima:
gerar sprite custa dinheiro (`PLANO-PRODUTO.md:128`) e por isso está travado atrás de
`accountTier:'paid'`. Mas essa trava só faz sentido se alguém puder virar `paid` — e hoje
ninguém pode (`playBilling.ts:5-6`). **A trava de custo está protegendo uma porta que não abre.**

---

## JTBD — por perfil (proibido fundi-los, contexto §3)

**Demo (grátis, 4 telas + `DEMO_PICK`, `PLANO-PRODUTO.md:18`, `INVENTARIO-TELAS.md:276`)**
> Quando eu **abro mais um app de tarefas depois de já ter abandonado outros**, quero **ver em
> minutos que existe alguém do outro lado que reage ao que eu faço, sem me cobrar pelo que não
> fiz**, para **decidir se vale voltar amanhã**.

Fonte da dor: essência declarada em `CLAUDE.md:17-21` e `PLANO-PRODUTO.md:69-71` ("o jeito mais
comum de virar cobrador não é punir, é *medir*"); o padrão de abandono/"falência periódica" que o
motor de tarefas foi desenhado para quebrar está em `CLAUDE.md` (linha `💤 Algum dia / 🌙 Deixar
pra lá`). **Atrito estrutural contra esse JTBD:** `DEMO_ACTIVITY_DAILY_CAP = 1`
(`monetization.ts:101`) — o grátis não consegue montar uma rotina, só um item por dia. `[hipótese]`

**Pago (R$ 29,90, 8 telas do ritual, `PLANO-PRODUTO.md:55`, `BILLING-SETUP.md:81`)**
> Quando eu **decido que quero uma criatura que só existe porque eu existo**, quero **ver O MEU
> bicho — o corpo, não só o nome** — para **sentir que o que paguei é meu e não uma skin
> compartilhada**.

Fonte: a frase-core literal, `PLANO-PRODUTO.md:63`, e `:67` ("é o ativo defensável e o motivo de
compra. No Finch, todo mundo tem o mesmo passarinho"). **Contradição direta no código:** o
motivo de compra declarado é unicidade visual; o pago recebe corpo por hash de seed entre 3
linhas (`App.tsx:3048-3050`).

**A tensão nomeada (contexto §3):** ela existe *em tese, na arquitetura do produto* mas **não
está ativa hoje**, porque o eixo pago não tem população possível (billing indisponível) —
🔧 e o eixo demo também não tem população de terceiro hoje (zero usuários; só o dono, em
teste). Otimizar "para o pago" agora é otimizar para um conjunto vazio, e qualquer leitura
sobre "o demo" é, hoje, leitura sobre o comportamento do próprio dono usando seu app em modo
demo — não sobre uma população de usuários reais. Isto reordena prioridade e rebaixa a força
de qualquer achado quantitativo — mas não havia nenhum aqui (P4=B).

---

## Evidência

| Evidência | Fonte | Força |
|---|---|---|
| Geração de sprite único tem 1 chamador, numa página sem entrada na navegação | `src/components/OraclePage.tsx:259` + `CLAUDE.md` (Oráculo) | **forte** (código) |
| Pago recebe corpo sorteado por hash entre 3 linhas genéricas, marcado "provisório" | `src/App.tsx:3045-3050` (idem `:2317`, `:2367`) | **forte** (código) |
| Demo recebe 3 personagens com arte real dedicada | `src/utils/monetization.ts:15-44`; `src/utils/sprites.ts:118-127` | **forte** (código) |
| Demo limitado a 1 atividade criada por dia | `src/utils/monetization.ts:101,115-117` | **forte** (código) |
| **Nenhum plugin de billing instalado — ninguém pode comprar em plataforma nenhuma** | `src/utils/playBilling.ts:5-6,37-50`; `UnlockAccountModal.tsx:54-55,58` | **forte** (código) |
| Funil web é o priorizado no plano (~R$ 27 líquidos) e é justamente o que não cobra | `docs/PLANO-PRODUTO.md:129` vs. `UnlockAccountModal.tsx:54-55` | **forte** (contradição documental) |
| App não está em loja nenhuma | `docs/DEPENDE-DE-VOCE.md:141-150`; HANDOFF `:37` | forte |
| Nenhuma métrica do negócio é legível | `docs/PLANO-PRODUTO.md:88,227` | forte |
| Os saves em KV já carregam `completedTasks` e `activityLog` | `src/contexts/GameStateContext.tsx:149,274-280,613,724` | **forte** (código) |
| "o produto tem o diferencial construído e não o entrega" | `soulmon-user-researcher.md:68-69` | **anedótica** — rascunho `[EM ABERTO]` (`:5-6`) |
| Público 18–35, faixa de risco declarada | `docs/PLANO-TAREFAS.md:206` | média (declarada, não medida) |
| Autorização de save é no-op com `FIREBASE_PROJECT_ID` desligado — atinge os 2 usuários reais do DigiApp | `docs/DEPENDE-DE-VOCE.md:28-41` | forte (doc do dono) |

---

## Quem é afetado e quanto (dimensionamento)

`[a definir]` — **e é obrigatório dizer isso em vez de estimar.** 🔧 Não há usuário de
terceiro do Soulmon: o único "afetado" hoje é o próprio dono em modo de teste. Não há
DAU/MAU, base instalada, nem ICP escrito (contexto §3; a fonte que deveria respondê-lo está
`[EM ABERTO]`).

**Fórmula visível, com os insumos que faltam:**

```
afetados_pago  = nº de saves com accountTier:'paid'          → 0 por construção hoje (billing off)
afetados_demo  = nº de saves distintos com atividade nos últimos 28d
                 (fonte: chaves do KV DIGIAPP_SAVES + activityLog/completedTasks do próprio save)
                 → hoje, no melhor caso, é 1 (o dono) — o KV é compartilhado com o DigiApp (2 pessoas)
```

**O denominador já existe e ninguém contou.** O saveId é SHA-256 do e-mail e todo save vive no
KV (`CLAUDE.md`, arquitetura); o save carrega `completedTasks` e `activityLog`
(`GameStateContext.tsx:149,274-280`). **Contar as chaves do KV é um script, não um projeto de
telemetria** — não viola P4=B porque produz o dado em vez de opinar sobre ele.
⚠️ Ressalva: o KV é **compartilhado com o DigiApp** (contexto §5), então a contagem crua mistura
os dois produtos e precisa de discriminante de campo (ex.: presença de `soulmonStages`/
`demoCharacterId`) antes de valer qualquer coisa. 🔧 E, diferente do que uma versão anterior
deste raciocínio poderia sugerir, essa contagem **não vai revelar uma base de jogadores
escondida** — o teto superior conhecido é 2 pessoas (DigiApp) + o dono (Soulmon).

---

## Ligação com a métrica-norte (§4) — e a avaliação honesta que foi pedida

**Declarada:** "peso de esforço real concluído por usuário ativo por semana"
(`PLANO-PRODUTO.md:77`). **O próprio doc a chama de slogan** por não ser legível (`:88`).

**Veredito: a métrica está certa; o diagnóstico de por que ela não é legível está errado —
e agora há uma segunda razão para ela não ser legível, mais forte que a primeira.**

- **Por que está certa.** Mede o core sem proxy (`:77`), é resistente a gaming por construção —
  a meta ponderada já matou o exploit das cinco triviais (`CLAUDE.md`, ⚖️ Meta ponderada) — e
  **não viola a cláusula negativa**: é métrica *do dono sobre o produto*, não score exibido ao
  usuário. Trocá-la por "dias ativos" ou "sessões" seria regredir para métrica de vaidade e
  contradiz `PLANO-PRODUTO.md:83` ("Abrir o app não conta nada").
- **Onde ela falha de verdade.** Três falhas reais, nenhuma resolvida por telemetria nova:
  1. **Não tem denominador.** "por usuário ativo" exige uma definição de *ativo* que **nenhuma
     fonte do repo declara**. Sem isso, dois cálculos honestos dão números diferentes.
  2. **Não tem baseline nem alvo.** A tabela de `:81-86` deixa o alvo v1 da própria north star
     em branco (`—`). Métrica sem alvo não decide nada — é a definição operacional de slogan.
  3. 🔧 **Mesmo com denominador e alvo definidos, o numerador de hoje é o próprio dono.**
     Medir agora não teria valor diagnóstico (`DECISOES.md`, item 5) — não é um problema de
     instrumentação, é ausência de população.
- **Onde `:88` erra.** "Não é legível" ≠ "não é coletada". O numerador **já está gravado no
  servidor**: `effortDone` é computado pelo relatório semanal (`utils/rituals.ts`,
  `weeklyReport`) sobre `completedTasks` + `activityLog`, e ambos são persistidos e sincronizados
  para o KV. **O que falta não é instrumentação, é um leitor — e, mais fundamental ainda, é
  gente.** Isso não muda a trava P4=B (segue proibido afirmar valor), mas muda o **custo** de
  sair dela — e muda o sequenciamento do `PROGRAMA.md` (o run 03 pode começar por um script de
  leitura, não por um SDK, mas seu valor real só chega quando houver usuário de terceiro).

**O que este problema move, e por que mecanismo:**

| Problema | Métrica que move | Mecanismo declarado |
|---|---|---|
| Pago não vê o próprio corpo | **Nenhuma métrica-norte** — move conversão demo→pago (`:85`) | Unicidade é o motivo de compra declarado (`:67`); se não é entregue, o preço não tem lastro |
| Demo cria 1 item/dia | **Diretamente a north star**, pelo teto: peso semanal máximo do grátis é limitado pela criação | Menos itens cadastrados → `dailyGoalFor` menor → menos esforço possível |
| Billing indisponível | Nenhuma métrica de produto — **move receita de 0 para não-0** | Sem plugin, `purchase()` nunca é alcançado (`playBilling.ts:37-50`) |

**Se este problema é "o diferencial não é entregue", ele NÃO move a métrica-norte.** É
honesto dizer isso: unicidade visual move compra e vínculo, não peso de esforço. Quem quiser
mover a north star ataca o cap do demo e a fricção do dia 1, não o sprite. **Os dois não devem
ser priorizados pela mesma justificativa** — e hoje o repo os trata como o mesmo problema.

---

## Premissa mais arriscada

> **Existe gente disposta a pagar R$ 29,90 por uma criatura gerada de si — e essa premissa
> nunca foi testada, porque o produto nunca cobrou de ninguém nem mostrou a criatura a ninguém.**

Tudo depende dela: o modelo (`PLANO-PRODUTO.md:119-124`), a tese de conversão ≥3% (`:227`), a
unidade econômica (`:128-131`) e o próprio conceito de "usuário pago" da §3. E as duas metades
dela estão fechadas ao mesmo tempo — não há como cobrar (`playBilling.ts:5-6`) e não há o que
mostrar (`OraclePage.tsx:259` é o único chamador). **Se for falsa, o Soulmon é um v-pet de
produtividade grátis competindo com o Habitica — sem o ativo defensável de `:104`.**

O que a falsearia: expor a criatura gerada + um caminho de pagamento real a um grupo pequeno e
observar **zero** compras com intenção declarada alta. O que **não** a falsearia: baixa conversão
com o sprite genérico atual — isso testaria outra coisa.

---

## Hipóteses testáveis

Todas `[hipótese]`. P4=B proíbe número; nenhum alvo abaixo é declarado — cada linha diz o que
seria coletado *durante* o teste. 🔧 Todas dependem, adicionalmente, de existir alguém além do
dono para observar — hoje nenhuma é executável sem primeiro trazer pessoas.

| # | `[hipótese]` (com mecanismo) | Menor experimento que a falseia | Critério de sucesso | Critério de morte |
|---|---|---|---|---|
| H1 | **O pago percebe que o corpo não é dele.** Mecanismo: a promessa é literal ("única, só sua") e o corpo é sorteado (`App.tsx:3048`); a dissonância aparece na comparação com outro jogador (LibraryPage existe) | **Análise de dado existente + 5 entrevistas moderadas** (`alpha-gestor-pesquisa`) com quem passou pelo ritual, mostrando o pet e perguntando "de onde veio essa aparência?" — sem induzir | Maioria dos entrevistados verbaliza espontaneamente a expectativa de arte própria | Ninguém nota, ou notam e não se importam → o sprite é dívida técnica, não problema de produto, e desce na fila |
| H2 | **O cap de 1 atividade/dia do demo impede a formação do loop.** Mecanismo: `dailyGoalFor` soma peso cadastrado (`CLAUDE.md`, ⚖️); com 1 item/dia o grátis nunca atinge o requisito do estágio → não há dia perfeito → não há evolução | **Script de leitura do KV** contando, por save demo, itens cadastrados e conclusões por semana. Não requer telemetria nova (`GameStateContext.tsx:149,724`) | Distribuição de esforço semanal dos demos travada no teto imposto pelo cap | Demos acumulam atividades ao longo dos dias e passam do requisito → o cap não é a trava; é outra coisa |
| H3 | **Não há compra hoje porque não há como comprar, não porque não há demanda.** Mecanismo: `isBillingAvailable()` é `false` em toda plataforma (`playBilling.ts:47-50`) e a UI comunica indisponibilidade (`UnlockAccountModal.tsx:54-55`) | **Fake door honesto:** um checkout web real (não simulado) para um grupo pequeno, com a criatura gerada já visível | Alguém completa o pagamento | Caminho aberto e ninguém paga → a premissa arriscada cai, e o modelo inteiro precisa ser rediscutido |

⚠️ **H3 é a única que testa a premissa arriscada.** H1 e H2 testam sintomas. Se só houver
fôlego para uma, é H3 — mas ela depende de destravar cobrança, que é decisão do dono.

---

## Caminhos alternativos (obrigatórios — nenhum é caminho feliz)

| Caminho | O que acontece hoje | Fonte / risco |
|---|---|---|
| **Usuário quer pagar no navegador** | Mensagem "no navegador não dá para cobrar"; sem alternativa oferecida | `UnlockAccountModal.tsx:54-55` — beco sem saída no caminho de receita priorizado (`PLANO-PRODUTO.md:129`) |
| **Usuário quer pagar no APK** | `isBillingAvailable()` false (nenhum plugin) → mesma mensagem, agora **errada** (ele *está* no Android) | `playBilling.ts:5-6,37-45` |
| **Geração de sprite falha / provedor recusa** | Há fallback sem referências (`generate-sprite.js`, `isRefusal`), mas ele **nunca é exercido no fluxo do usuário** — só via `OraclePage` | `CLAUDE.md` (arte); `OraclePage.tsx:259` |
| **Estado vazio do demo depois do 1º item** | Cap atingido; `recordDemoCreation` **nunca bloqueia** (a falha "avisa e segue permitindo", `monetization.ts:123-125`) — o teto é honesto, mas o valor máximo do grátis fica indefinido | `monetization.ts:101,119-126` |
| **Save sobrescrito por terceiro** | Autorização é **no-op**: qualquer um com o e-mail lê/sobrescreve — 🔧 hoje isso atingiria os 2 usuários reais do DigiApp, não um "jogador do Soulmon" | `DEPENDE-DE-VOCE.md:28-41` — 🔴, rebaixado a dívida com prazo por `D-02` |
| **Dado parcial: save antigo sem `effort`/`lastTouchedAt`** | `normalizeEffort` devolve 1; idade 0 (não assombra em massa) — tratado | `CLAUDE.md` (⚖️, 👻) — **não é risco** |
| **Reroll pago (aleatório com dinheiro real)** | Risco ECA Digital — dono decidiu (`D-05`): mitigar com tela e seguir | `DEPENDE-DE-VOCE.md:132-137` — **não opinar sobre norma**, já escalado e resolvido pelo dono |
| **`pool.json` diverge do canônico do Bestiário** | Falha **silenciosa**: criatura errada gerada, sem erro | HANDOFF `:65-69`; repos irmãos não clonados (`PROGRAMA.md:30`) |

---

## Menor experimento recomendado

**Ordem de custo, e o produto está preso no degrau mais barato há tempo demais.**

**Passo 1 (custo ~0, faz-se sem tocar em produto): contar os saves.** Um script de leitura sobre
o KV `DIGIAPP_SAVES` que responda: quantos saves são Soulmon (discriminante `soulmonStages`/
`demoCharacterId`), quantos são `paid`, e qual o peso de esforço semanal por save
(`completedTasks` + `activityLog`).
- **Responde:** existe base instalada de terceiro? (provavelmente não — ver correção acima)
  o cap do demo trava o loop (H2)? a north star é computável de verdade? — e dá **denominador
  e baseline**, os dois que faltam à §4, mesmo que hoje o resultado esperado seja "1 (o
  dono) + 2 (DigiApp)".
- **NÃO responde:** por que alguém para de usar; se alguém pagaria (H3); se o sprite genérico
  incomoda (H1). Dado de save é comportamento passado, não intenção — e sem população de
  terceiro nem sequer há comportamento a analisar além do próprio dono.
- **Pré-requisito do dono:** acesso ao KV e aceite de que o namespace é compartilhado com o
  DigiApp. ⚠️ Ler saves de jogadores reais (do DigiApp) tem implicação LGPD — escalar, não
  decidir (P7=B).

**Passo 2 (só depois): 5 entrevistas moderadas** para H1, via `alpha-gestor-pesquisa` —
**adiado até existir alguém além do dono para entrevistar.**

**Passo 3: abrir um caminho de cobrança real** para testar H3 — decisão de negócio do dono, não
da squad.

**Explicitamente NÃO recomendado como experimento:** "implementar a geração de sprite no
onboarding". Isso é construir, tem custo de IA por usuário (`PLANO-PRODUTO.md:128`) e assume H1
verdadeira sem prova. `PLANO-PRODUTO.md:133` já aponta a versão barata (gerar **sob demanda por
estágio**) — mas isso é decisão de execução para depois de H1, não descoberta.

---

## Critérios de sucesso e de SAÍDA

**Sucesso da Discovery (o que libera a Fase 1):**
1. `ativo` tem definição escrita e aceita pelo dono — sem isso a north star não tem denominador.
2. A north star tem **baseline lido de save real** e **alvo declarado** (`PLANO-PRODUTO.md:81`
   deixa o alvo v1 em branco) — sabendo que o baseline hoje é o do próprio dono.
3. Existe contagem de saves Soulmon separada da do DigiApp.
4. H1, H2 e H3 estão cada uma com um dono e um experimento datado — ou explicitamente mortas,
   ou explicitamente adiadas até existir população de terceiro.
5. O sprite genérico está classificado: **dívida técnica** ou **defeito de produto**. Hoje ele é
   tratado como as duas coisas ao mesmo tempo, o que impede priorizar.

**Critérios de SAÍDA — quando desistir (falseáveis, sem eufemismo):**
- **Desistir da tese de monetização** se o caminho de cobrança for aberto a um grupo com
  intenção declarada alta e a criatura própria visível, e **ninguém completar o pagamento**.
  Isso mata a premissa arriscada; o produto vira grátis ou não é.
- **Desistir da narrativa "o diferencial não é entregue"** se H1 morrer: se quem passou pelo
  ritual não nota nem se importa com a origem do corpo, `soulmon-user-researcher.md:68-69` para
  de ser citável como prioridade e vira item de backlog visual.
- **Desistir do Passo 1** se o KV não permitir enumerar chaves ou se a mistura com o DigiApp for
  indistinguível por campo — então instrumentar deixa de ser opcional e o `PROGRAMA.md` deve
  puxar `soulmon-03` para a frente.
- 🔧 **Parar tudo e reordenar o programa** foi avaliado: `alpha-security` confirmou exploração
  técnica em produção, mas **contra os 2 usuários do DigiApp, não contra jogador do Soulmon**
  (que não existe). O gatilho original de `PROGRAMA.md:21-23` ("porque o app já tem jogadores
  reais") **nunca disparou** por esse enunciado — mas o risco real sobre o DigiApp levou à
  reordenação por outro caminho: ver `mapa-e-prioridades.md §3` e `DECISOES.md`.

---

## Perguntas para o dono (formato `docs/DEPENDE-DE-VOCE.md`, ordenadas por impacto)

| | Pergunta | Por que trava |
|---|---|---|
| 🔴 | **É decisão sua que ninguém possa comprar hoje, ou é dívida?** Nenhum plugin de billing está instalado (`playBilling.ts:5-6`) e o funil web — o priorizado em `PLANO-PRODUTO.md:129` — comunica que não cobra (`UnlockAccountModal.tsx:54-55`). | Enquanto isto for verdade, "usuário pago" (§3) é um perfil de projeto, não uma população. Otimizar para ele é otimizar para conjunto vazio |
| 🔴 | **Podemos ler os saves de jogadores reais (do DigiApp) no KV para contar base e esforço?** Sim/não, e sob que restrição LGPD. | É o único caminho para baseline sem construir telemetria. Sem seu ok, a Fase 1 inteira roda cega |
| 🔴 | **O sprite genérico do pago (`App.tsx:3045-3050`, "provisório até a Fase 2") é dívida aceita ou defeito a corrigir agora?** | Decide se o motivo de compra declarado (`PLANO-PRODUTO.md:67`) está ou não sendo entregue a quem paga |
| 🟠 | **Qual é a sua definição de "usuário ativo"?** A north star (`:77`) depende dela e nenhuma fonte a declara — **ainda aberta** (`D-15`). | Sem denominador, a métrica-norte não é calculável nem depois do dado |
| 🟠 | **Qual é o alvo v1 da própria north star?** `PLANO-PRODUTO.md:81` deixa `—`. **Ainda aberta.** | Métrica sem alvo não decide nada — é o que a faz soar como slogan, mais que a falta de leitura |
| 🟠 | **O cap de 1 atividade/dia do demo (`monetization.ts:101`) é o valor pretendido?** | Ele limita estruturalmente a métrica-norte do único perfil que existe hoje |
| 🟡 | **`soulmon-user-researcher.md` deve ser concluído ou aposentado?** É rascunho com 10 seções `[EM ABERTO]` (`:5-6`) e a frase mais citada do repo. | Fonte anedótica citada como diagnóstico é o modo de falha que `PLANO-PRODUTO.md:22` já registrou |
| 🟡 | **Clonar `../Besti-rio-` e `../Class-System`** — pendência material de P2=A (`PROGRAMA.md:30`). | Sem clone, nem o merge nem `npm run sync:oracle-data` são executáveis |
