# soulmon-monetization-strategist — Revisão Soulmon

> Termos renomeados em 29/09/2026: vírus→poder, dado→harmonia, vacina→benevolência.

**Data:** 2026-08-03 · **Escopo:** modelo de receita, preço, custo marginal por usuário, e compatibilidade da monetização com a tese emocional do produto
**Evidência analisada:** `docs/squad/00-BRIEFING.md`, `docs/squad/01-RUBRICA.md`,
`docs/reviews/2026-08-03/00-CONSOLIDADO.md`, `functions/api/generate-sprite.js`,
`functions/api/chat.js`, `src/utils/spritePrompts.ts`, `src/utils/spriteGen.ts`,
`src/utils/oracle.ts`, `src/utils/shop.ts`, `src/components/CompanionHUD.tsx`,
`src/components/OraclePage.tsx` · **14 fontes externas** (11 buscas web).

## 1. Veredito em uma frase

**A primeira decisão de monetização do Soulmon não é qual preço cobrar — é parar de gerar
11 sprites por instalação, porque a US$ 1,00 de custo por instalação contra US$ 0,38 de
receita mediana por download em freemium, o produto perde dinheiro em cada usuário novo
antes de qualquer paywall existir; corrigido isso, o modelo é assinatura anual de
US$ 39,99 com trial, vendendo profundidade, memória e cosmético, e nunca progresso.**

## 2. Notas da rubrica

| Dimensão | Nota | Justificativa em uma linha |
|---|---|---|
| D11 — Monetizabilidade | **1** | Não é só ausência: a configuração atual tem custo variável adiantado (~US$ 1,00/instalação) maior que a receita mediana da categoria (US$ 0,38/download), então escalar hoje queima caixa — pior que não ter. Potencial 4 após as três correções da §6. |
| D7 — Economia e recompensas (contribuição) | **2** | A loja é bem desenhada em um ponto crítico (o único item que compra progresso, o Glitchtama, está deliberadamente fora da venda — `src/utils/shop.ts:101-102`), mas a moeda vem de minijogos e não de tarefas, e a loja vende cura de HP — que é exatamente a porta que não pode ser monetizada. |

## 3. Pontos fortes

1. **[FATO] A folha em branco é um ativo real, não uma falta.** Não há IAP, assinatura,
   anúncio ou paywall (briefing §2, "O que NÃO existe hoje"). Habitica, Finch e Pokémon
   Sleep carregam decisões de economia de 2013–2023 que não podem mais desfazer. O
   Soulmon pode desenhar o modelo antes que o design o inviabilize — e este relatório
   existe justamente porque essa janela ainda está aberta. **Competitivamente: vantagem
   temporária, e ela fecha no primeiro IAP publicado.**
2. **[FATO] O Glitchtama — o único item do jogo que literalmente compra progresso
   (`+1 dia perfeito`, `shop.ts:55-57`) — está deliberadamente fora da loja**, e o código
   diz isso em voz alta: *"Glitchtama is deliberately NOT sold — the only way to get one
   is clearing all 5 dungeon floors"* (`shop.ts:101-102`). Este é o comentário mais
   importante do repositório para o meu domínio. O instinto certo já existe no time; meu
   trabalho é dizer que ele precisa virar política escrita, não comentário.
3. **[FATO] A consciência de custo de IA já está no código.** `CompanionHUD.tsx:299-300`
   pula a chamada quando a aba está oculta, com o comentário *"skip the paid AI call"*.
   Isso corta o desperdício mais óbvio do loop de 3 minutos antes de ele existir.
4. **[FATO] A cadeia de sprites já é incremental por construção** — champion parte da
   imagem do rookie, ultimate do champion, ultra funde as três megas
   (`src/utils/spritePrompts.ts:5-11, 76-108`). Isso significa que a maior economia
   disponível no produto (gerar 1 sprite em vez de 11) é uma mudança de *quando chamar*,
   não uma refatoração. **Recomendação de maior ROI do relatório, e ela é barata.**
5. **[PARIDADE, não força] O inventário de cosméticos já existe:** 11 cenários de
   150–300 Bits (`shop.ts:104-161`) + 6 cenários exclusivos por missão. Cosmético é o
   único IAP seguro para a tese, e o conteúdo já está construído. Mas Finch, Habitica e
   Pokémon Sleep também vendem cosmético — isso é entrada no jogo, não diferencial.

## 4. Pontos fracos

- **[Gravidade: Bloqueante] Monetizar sobre conteúdo derivado transforma remoção em
  indenização.**
  - *Evidência:* `src/utils/oracle.ts:2230` instrui o gerador a produzir arte "inspirada
    em Digimon, Pokémon, ... Hello Kitty, Tamagotchi"; `src/types/evolution-lines.ts` e
    `src/types/progression.ts:31-63` carregam ~90 nomes canônicos de terceiros
    (consolidado §2.1).
  - *Consequência:* enquanto isso existir, **não há preço nenhum a discutir**. Uso não
    comercial de obra derivada tipicamente termina em pedido de remoção; uso comercial é
    o agravante que muda a natureza do pedido. Nenhuma recomendação minha é executável
    antes deste item. Este ponto é do `soulmon-ip-brand-guardian`; eu o repito porque ele
    é pré-condição da minha entrega, não porque seja meu escopo.

- **[Gravidade: Bloqueante] O custo por instalação é ~2,6× a receita mediana por
  download na categoria.**
  - *Evidência:* 11 imagens Higgsfield por usuário no fim do Oráculo
    (`spritePrompts.ts:67-108`, `OraclePage.tsx:160-183`) a US$ 0,09/geração na
    configuração real do produto (720p, batch 1 — `generate-sprite.js:28-34`; fonte [2])
    ⇒ **US$ 0,99/instalação**. Receita realizada mediana de app freemium no dia 60:
    **US$ 0,38/download** (RevenueCat 2026, fonte [4]).
  - *Consequência:* margem de **–US$ 0,68 por instalação** antes de qualquer gasto de
    aquisição. Sucesso de topo de funil vira prejuízo. Detalhamento completo em §4.A/§4.B.

- **[Gravidade: Grave] A loja vende cura de HP — a única porta que, monetizada, é dark
  pattern por definição.**
  - *Evidência:* `shop.ts:98-100`, item `heart-item`, 150 Bits, *"the ONLY buyable HP
    heal"*. O HP é perdido por não cumprir tarefas (consolidado §5).
  - *Consequência:* vender por dinheiro real a saída de uma punição que o próprio produto
    infligiu é o caso-livro de monetizar a dor. Com Bits ganhos, é uma escolha de economia
    interna defensável; com dinheiro, é o mecanismo que fará resenhas de 1 estrela e é
    exatamente o que a linha vermelha do psicólogo proíbe.

- **[Gravidade: Grave] Os chips de atributo são a porta mais perigosa, e ninguém a
  identificou ainda.**
  - *Evidência:* `shop.ts:87-95` — chips de vírus/dado/vacina, 120 Bits, `+CHIP_BOOST` no
    atributo, que é o que decide o **ramo** evolutivo.
  - *Consequência:* chips não compram *velocidade*, compram **direção** — isto é, compram
    a identidade da criatura. A tese diz "a criatura é você". Uma criatura que virou
    vacina porque o dono pagou US$ 1,99 não é o espelho de ninguém. **Isto é pior do que
    vender evolução, porque é mais barato de justificar e igualmente fatal.** Ver §6.C.

- **[Gravidade: Grave] Sem telemetria não há paywall otimizável, e sem contas reais não
  há direito de compra.**
  - *Evidência:* ausência total de analytics no repo (consolidado §2.3); identidade =
    SHA-256 do e-mail digitado, sem autenticação (`src/utils/cloudSave.ts`,
    `functions/api/save.js`).
  - *Consequência:* impossível medir conversão, escolher preço ou saber quando o paywall
    deve aparecer; e um *entitlement* amarrado a um hash de e-mail não autenticado se
    perde na troca de aparelho e é trivialmente compartilhável. Cobrar sem isso gera
    reembolso e suporte, não receita.

- **[Gravidade: Grave] A economia interna diz ao usuário que dinheiro vem de jogar, não
  de viver.** Bits vêm do Dino, do PPT e da masmorra; **nenhuma tarefa real gera moeda**
  (consolidado §4, detalhe #8).
  - *Consequência para a monetização especificamente:* se um dia se vender Bits, o produto
    estará vendendo atalho para a camada 3, que já canibaliza a camada 1. E se não se
    vender Bits, a loja permanece um sistema desconectado do que o produto quer vender.
    A economia precisa ser corrigida **antes** de decidir o que monetizar, não depois.

- **[Gravidade: Moderado] O onboarding entrega o spoiler de toda a evolução no minuto
  zero.** As 11 formas — inclusive a ultra — aparecem no fim do Oráculo
  (`OraclePage.tsx:160-183`).
  - *Consequência:* além de custar US$ 1,00, isso **queima o principal item vendável do
    produto** (a revelação da próxima forma) antes de existir algo para vender. O custo e
    o erro de design são o mesmo erro, e a mesma correção resolve os dois.

## 4.A — A CONTA: custo marginal por usuário (a peça que faltava)

### Fatos de código que definem o custo

| Fato | Evidência |
|---|---|
| O Oráculo gera **11 sprites por usuário**: 1 rookie + 3 ramos × (champion, ultimate, mega) + 1 ultra | `src/utils/spritePrompts.ts:67-108`; `src/utils/oracle.ts:2858-2993` (`stages.push` × 5 blocos, laço de 3 ramos) |
| Todos os 11 são gerados **de uma vez**, em sequência, no fim do Oráculo | `src/components/OraclePage.tsx:160-183` → `generateAllSprites` (`src/utils/spriteGen.ts:93-110`) |
| Parâmetros da chamada: Higgsfield Soul, `1536x1536`, `quality: '720p'`, `batch_size: 1` | `functions/api/generate-sprite.js:28-34` |
| Champion usa o rookie como referência (image2image), ultimate usa o champion, ultra funde as 3 megas — ou seja, a cadeia **já é naturalmente incremental** | `src/utils/spritePrompts.ts:5-11, 76-108` |
| Fallback é Gemini `gemini-2.5-flash-image` (texto puro, sem referência) | `functions/api/generate-sprite.js:17, 107-110` |
| Chat: Groq `llama-3.1-8b-instant`, `max_tokens: 120` | `functions/api/chat.js:72,77` |
| Fala espontânea a cada **180 s** com o app aberto, e há guarda de `document.hidden` que pula a chamada paga quando a aba não está visível | `src/components/CompanionHUD.tsx:298-316` |

### Preços de insumo (com fonte e data)

- **Groq `llama-3.1-8b-instant`:** US$ 0,05 / 1M tokens de entrada e US$ 0,08 / 1M de saída
  (fonte [1], acesso 2026-08-03).
- **Higgsfield Soul (imagem):** não há tabela pública oficial da API própria
  (`platform.higgsfield.ai`) — **sem dado público confiável** para o preço direto.
  Limites conhecidos:
  - *Piso* — plano da Higgsfield: ~0,25 crédito por imagem Soul; pacote avulso US$ 5 / 80
    créditos ⇒ US$ 0,0625/crédito ⇒ **≈ US$ 0,016/imagem** (fonte [3], 2026-01-23).
  - *Central* — agregadores: **US$ 0,09/geração** na configuração base (720p, batch 1),
    US$ 0,19 em 1080p (fonte [2], acesso 2026-08-03). A configuração do Soulmon é
    720p/batch 1 ⇒ o número aplicável é **US$ 0,09**.
  - *Teto* — Segmind: US$ 0,120 a US$ 0,230 por geração (fonte [3], 2026-01-23).

### O cálculo

**1) Chat (Groq) — custo recorrente, e é irrelevante.**

O system prompt montado em `chat.js:37-51` tem ≈ 400 tokens; mais a mensagem do usuário,
≈ 500 tokens de entrada. Saída limitada a 120 tokens, típica ≈ 60.

```
entrada:  500 tok × $0,05/1M = $0,000025
saída:     60 tok × $0,08/1M = $0,0000048
custo por chamada          ≈ $0,00003   (3 centavos por 1.000 chamadas)
```

Cenário de uso realista — 15 min/dia de app aberto (5 falas espontâneas) + 5 mensagens
manuais = 10 chamadas/dia = 300/mês:

```
custo de chat por usuário ativo por mês ≈ $0,009  (menos de um centavo)
```

Cenário patológico — 2 h/dia de app aberto (40 falas) + 20 chats = 1.800 chamadas/mês:
**≈ US$ 0,054/mês**. `[FATO]` **O chat não é um problema de custo.** O intervalo de 3 min
é seguro no modelo atual, e a guarda de `document.hidden` já elimina o desperdício.

*Ressalva:* trocar o `llama-3.1-8b-instant` por um modelo de fronteira (ordem de
US$ 3/1M entrada) multiplica isso por ~60 ⇒ ≈ US$ 0,55/usuário/mês. Ainda pequeno por
usuário, mas US$ 55 mil/ano em 100k MAU. **Chat com "LLM melhor" é um bom item de plano
pago justamente porque tem custo real e visível.**

**2) Sprites (Higgsfield) — custo ÚNICO, por instalação, e é o problema.**

```
11 imagens × $0,016  = $0,18   (piso, crédito de plano)
11 imagens × $0,09   = $0,99   (central, config real do produto)
11 imagens × $0,19   = $2,09   (teto, 1080p)
```

**Custo marginal central ≈ US$ 1,00 por usuário que termina o Oráculo.** E o produto
paga isso **antes** de o usuário concluir uma única tarefa — incluindo os que somem no
dia 1.

**3) Infra.** Cloudflare Workers Paid US$ 5/mês com 10M requisições incluídas; Supabase
Pro US$ 25/mês. Em 10k MAU isso é ruído (< US$ 0,005/MAU). FCM é gratuito.

### Veredito de custo

| Linha | Valor |
|---|---|
| Custo **único** por instalação que completa o Oráculo | **US$ 0,18 – 2,09; central US$ 1,00** |
| Custo **recorrente** por usuário ativo/mês (chat + infra) | **≈ US$ 0,015 – 0,05** |

`[FATO]` A estrutura de custo do Soulmon é o inverso da de um SaaS: **quase todo o custo
é adiantado e não recorrente.** Isso não é detalhe contábil — muda o modelo de receita
inteiro (ver §4.B).

---

## 4.B — Por que essa conta, sozinha, condena o freemium puro

Benchmark de receita realizada (RevenueCat, *State of Subscription Apps 2026*,
publicado 2026-03-19, base de 115 mil apps e US$ 16 bi de receita — fonte [4]):

| Métrica | Valor |
|---|---|
| Conversão download→pago no dia 35, **freemium** | **2,1%** (mediana) |
| Conversão download→pago no dia 35, **hard paywall** | 10,7% (mediana) |
| Receita realizada por download no dia 60, **freemium** | **US$ 0,38** |
| Receita realizada por download no dia 60, **hard paywall** | US$ 3,09 |
| Conversão download→pago, América do Norte (D35) | 2,6% · Índia/SEA 1,4% |
| Apps de preço alto convertem 2× melhor que os de preço baixo | 2,8% vs 1,4% |
| LTV realizado ano 1 — apps com IA vs sem IA | US$ 30,16 vs US$ 21,37 |
| Retenção de pagante em 12 meses — apps de IA | **36% pior** que apps tradicionais |
| Churn de assinantes anuais no ano 1 | ~72% |

Confronto direto:

```
Receita freemium mediana por download (D60), líquida de 15% de loja:  $0,38 × 0,85 = $0,32
Custo de sprites por instalação (central):                                     – $1,00
─────────────────────────────────────────────────────────────────────────────────────
Margem por instalação:                                                        – $0,68
```

`[FATO]` **Com a geração de 11 sprites no onboarding e monetização freemium mediana, o
Soulmon perde dinheiro em cada instalação — antes de gastar um centavo em aquisição.**
Mesmo no piso de custo (US$ 0,18) a margem é de US$ 0,14/instalação, o que não paga
nem a UA mais barata do mundo.

Há três saídas, e elas não são excludentes:

1. **Gerar 1 sprite no onboarding, não 11** (rookie apenas). Custo cai de ~US$ 1,00 para
   ~US$ 0,09 — fator 11. A arquitetura já favorece isso: cada estágio usa a imagem do
   anterior como referência (`spritePrompts.ts:76-108`), então a geração preguiçosa é o
   caminho natural, não uma gambiarra. **E é melhor de produto:** hoje o app entrega as
   11 formas futuras no minuto zero, isto é, **entrega o spoiler da evolução inteira antes
   da primeira tarefa**. Gerar na hora da evolução transforma custo em momento.
2. **Ficar acima da mediana de conversão**, o que exige preço mais alto e paywall com
   trial (ver §6).
3. **Não depender só de B2C** (ver o modelo 7, patrocínio/B2B2C).

## 5. Benchmark de mercado

Todos os preços em USD, verificados em **2026-08-03** salvo indicação. Fontes numeradas
em §10.

| Produto | Modelo e preço | Soulmon hoje | Lacuna |
|---|---|---|---|
| **Finch: Self-Care Pet** [6] | Freemium + **Finch Plus: US$ 9,99/mês ou US$ 69,99/ano**. Grátis é utilizável; o plano dá cosméticos, temas, exercícios e histórico. | Zero | O análogo mais próximo (pet de autocuidado) e o **preço mais alto** da amostra. Prova que o público de "criatura + hábito" tolera preço premium. Soulmon não tem nem SKU. |
| **Habitica** [7] | Assinatura **US$ 4,99/mês · US$ 14,99/3m · US$ 29,99/6m · US$ 47,99/ano** + moeda premium (Gems, cap mensal que cresce com a assinatura). | Zero; moeda Bits existe mas não é vendável | Habitica é o único que vende moeda premium — e o faz com **cap mensal**, não com pacotes escalonáveis. Se o Soulmon algum dia vender moeda, é este o desenho a copiar, não o de gacha. |
| **Forest** [8] | **Compra única US$ 3,99 (iOS)**; Android grátis com moeda ganha em sessões de foco. | Zero | O teto de compra única na categoria produtividade é baixíssimo. Mata a ideia de "vitalício caro". |
| **Streaks** [11] | **Compra única US$ 5,99**, modelo inteiro. | Zero | Idem. Dois pontos de dado independentes fixando o teto de compra única em ~US$ 6. |
| **Duolingo** [9] | **Super: US$ 12,99/mês ou US$ 83,99/ano (≈US$ 7,99/mês)**; Family US$ 119,99/ano por 6 contas; grátis com anúncios. | Zero | Referência de escada de preço (mensal caro ancorando anual) e de anúncios convivendo com assinatura. |
| **Todoist Pro / TickTick** [10] | Todoist **US$ 5/mês anual (US$ 60/ano)** ou US$ 7 mensal; TickTick **US$ 3,99/mês ou US$ 35,99/ano**. | Zero | Piso de mercado para "app de tarefas sério": ~US$ 36–60/ano. |
| **Fabulous** [11] | Premium **US$ 39,99/ano** com trial de 7 dias; faixa US$ 16,99–59,99 conforme plano/promoção. | Zero | O ponto de preço mais comparável ao que recomendo, no segmento hábito+bem-estar. |
| **Pokémon Sleep** [12] | **Premium Pass US$ 10/mês ou US$ 50/6 meses.** | Zero | Confirma que jogo-de-criatura + rotina real sustenta ~US$ 10/mês numa marca forte. |

**O que copiar.** Três coisas. (1) **A âncora de Fabulous e Finch**: trial de 7 dias +
anual como plano padrão e mensal caro existindo só para fazer o anual parecer barato.
(2) **O cap de Habitica**: se alguma moeda for vendida algum dia, ela tem limite mensal —
é a diferença entre economia premium e caça-níquel. (3) **A honestidade do grátis do
Finch**: o app grátis do Finch é genuinamente utilizável, e é isso que sustenta a base que
converte a US$ 69,99/ano. Um grátis mutilado converteria pior, não melhor.

**O que deliberadamente NÃO copiar.** Primeiro, **a compra única de Forest/Streaks
(US$ 3,99–5,99)**: é o modelo mais confortável para o público e o mais tentador para um
projeto solo, mas o Soulmon tem custo variável de IA por instalação, e US$ 4 vitalícios
contra US$ 1,00 de geração + custo recorrente de chat é uma armadilha de caixa que só
aparece no ano 2. Segundo, **a moeda premium de Habitica**: os Gems funcionam lá porque
Habitica nunca prometeu que o avatar *é* o usuário — é um RPG de fantasia com um
personagem, e comprar equipamento para um personagem é natural. O Soulmon prometeu
espelho, e espelho não aceita compra. Terceiro, **os anúncios de Duolingo**: o Duolingo
pode interromper porque a unidade de valor dele é a lição, que tem começo e fim; a unidade
de valor do Soulmon é o vínculo, e não existe momento no vínculo em que um anúncio não
seja uma quebra de personagem.

**Faixa de conversão realista.** RevenueCat, *State of Subscription Apps 2026*
(2026-03-19, 115 mil apps, US$ 16 bi de receita — fonte [4]): freemium converte
**2,1% de download→pago no dia 35** (mediana); hard paywall, 10,7%. Apps de preço alto
convertem **2× melhor** que os de preço baixo (2,8% vs 1,4%; top quartil de preço alto:
6,1%). América do Norte: 2,6%; Índia/SEA: 1,4% — relevante porque o Soulmon é pt-BR
primeiro, e o Brasil está mais perto do segundo grupo que do primeiro. Trial-to-paid
mediano em Saúde & Fitness: 37,7% [5]. Dois alertas do mesmo relatório que valem para o
Soulmon: apps com IA têm LTV ano-1 41% **maior** (US$ 30,16 vs 21,37) mas retenção de
pagante em 12 meses **36% pior** — ou seja, o produto de IA cobra bem e segura mal, o que
é um argumento direto pelo plano **anual cobrado antecipadamente**.

---

## 6. Oportunidades e recomendações

| # | Recomendação | Problema que resolve | Impacto | Esforço | Confiança | Horizonte |
|---|---|---|---|---|---|---|
| 1 | Gerar **1 sprite (rookie)** no Oráculo; gerar cada forma seguinte só no momento em que o usuário evolui | Custo de US$ 0,99→~US$ 0,12 por instalação **e** o spoiler da evolução inteira | 5 | 1 | 5 | Agora |
| 2 | Publicar a **lista do que nunca será vendido** (§6.D) no README, na loja e no app | Trava a decisão antes que a pressão de receita a corroa; e é ativo de marketing | 4 | 1 | 5 | Agora |
| 3 | Instrumentar os 6 eventos de receita (fim do Oráculo, 1ª evolução, view de paywall, início de trial, conversão, churn) junto com os 20 do consolidado | Sem isso não há preço, só chute | 5 | 2 | 5 | Agora |
| 4 | **Fake door** de assinatura + Van Westendorp em pt-BR e en-US (§6.E) | Mede disposição a pagar antes de construir paywall | 4 | 2 | 4 | Agora |
| 5 | Assinatura **Soulmon Alma — US$ 39,99/ano (R$ 129/ano) + US$ 6,99/mês**, trial de 7 dias, paywall na 1ª evolução | O modelo primário | 5 | 4 | 4 | Próximo |
| 6 | Contas reais + *entitlement* server-side antes de qualquer cobrança | Compra perdida na troca de aparelho, compartilhamento trivial, reembolso | 5 | 4 | 5 | Próximo |
| 7 | Fazer **tarefas concluídas gerarem Bits** e capar Bits de minijogos | Corrige a economia invertida antes que ela vire economia paga | 4 | 2 | 4 | Próximo |
| 8 | SKU **"Fundador" US$ 24,99 vitalício**, edição limitada e datada, só antes do lançamento público | Captura o público avesso a assinatura e financia o desenvolvimento sem virar o modelo | 3 | 2 | 3 | Próximo |
| 9 | Estudo de viabilidade B2B2C (bem-estar corporativo, PEPM US$ 1–10) | A via mais rentável por usuário, e a mais lenta | 3 | 4 | 2 | Depois |
| 10 | **Não** implementar: passe de temporada, venda de Bits, anúncios com recompensa funcional | Preserva a tese | 5 | 0 | 5 | Sempre |

### As três melhores, detalhadas

**#1 — Geração preguiçosa de sprites.** Hoje `OraclePage.tsx:160-183` chama
`generateAllSprites` com as 11 formas. A mudança é gerar apenas `rookie` ali, e chamar
`generateSprite` da forma seguinte no evento de evolução — usando a imagem da forma atual
como referência, que é exatamente o que `spritePrompts.ts:76-108` já espera. Custo por
instalação cai de US$ 0,99 para US$ 0,09, e o custo médio ao longo do funil para
~US$ 0,12 (assumindo que ~30% dos usuários chegam à primeira evolução). *Critério de
sucesso mensurável:* custo de Higgsfield por instalação que completa o Oráculo abaixo de
**US$ 0,15** medido em uma janela de 30 dias, sem queda na taxa de conclusão do Oráculo.
Efeito colateral desejado: a revelação da próxima forma passa a ser um evento, e vira o
gancho emocional que sustenta a assinatura.

**#5 — Soulmon Alma, US$ 39,99/ano.** Posicionamento: acima de TickTick (US$ 35,99) e
Fabulous (US$ 39,99), abaixo de Habitica (US$ 47,99) e bem abaixo de Finch (US$ 69,99).
Preço alto de propósito — RevenueCat mostra que apps caros convertem 2× melhor [4], e um
produto que gera arte por IA para cada usuário não pode se posicionar como barato. Anual
como plano padrão (defesa contra os 36% de retenção pior de apps de IA), mensal de
US$ 6,99 existindo como âncora. **A frase que justifica a compra na cabeça do usuário:**
*"Eu pago para a minha criatura lembrar de mim."* — porque o que entra no plano é
**memória persistente do chat** (hoje o vínculo morre depois do nascimento — consolidado
§4, #9), **histórico longo e estatísticas**, **backup e sync entre aparelhos**,
**todos os cenários e temas**, **regeração e variações de sprite**, **chat com modelo
melhor e sem limite**, e **criaturas adicionais**. *Critério de sucesso:* ≥ 4% de
MAU→pagante em 90 dias (§6.B mostra que 1,6% é o break-even e ~5,6% é a margem saudável).

**#3 — Instrumentar os 6 eventos de receita.** Não é possível escolher entre US$ 29,99 e
US$ 49,99 sem saber quantos chegam ao paywall. Os eventos mínimos: `oracle_completed`,
`first_evolution`, `paywall_viewed`, `trial_started`, `subscription_converted`,
`subscription_churned` — mais `higgsfield_image_generated` com custo estimado, que é o
único jeito de a conta da §4.A deixar de ser estimativa e virar medição. *Critério de
sucesso:* um painel que responde "quanto custou e quanto rendeu cada coorte semanal"
sem consulta manual.

### 6.A — Veredito sobre cada um dos 8 modelos

| # | Modelo | Como funcionaria no Soulmon | Receita esperada | Risco à tese | Risco ético | Complexidade | Nota |
|---|---|---|---|---|---|---|---|
| 1 | **Assinatura** | US$ 39,99/ano · US$ 6,99/mês, trial 7d, paywall na 1ª evolução. Vende memória, histórico, cosmético, sync, chat melhor, criaturas extras | **US$ 34/pagante/ano líquido** | **Baixo** — nada do pacote toca progresso | Baixo, se o "modo gentil" ficar **fora** do plano | Alta (contas + entitlement + billing) | **5 — RECOMENDADO** |
| 2 | **Compra única / vitalício** | SKU "Fundador" US$ 24,99, edição limitada pré-lançamento | Teto de mercado é ~US$ 4–6 (Forest, Streaks [8][11]); US$ 24,99 só vende para early adopters | Baixo | Baixo | Média | **3 — complementar, nunca principal.** Não financia custo recorrente de IA nem live ops |
| 3 | **Cosméticos IAP avulso** | Vender cenários/temas/acessórios por dinheiro | Seguro, mas teto baixo: cosmético avulso raramente passa de 20–30% da receita de assinatura em apps não-jogo — **sem dado público confiável** para o número exato na categoria | **O mais baixo de todos** | Baixo | Baixa (o conteúdo já existe, `shop.ts:104-161`) | **4 em segurança, 2 em teto.** Recomendo **incluir na assinatura em vez de vender avulso**, para não construir vitrine de loja |
| 4 | **Passe de temporada** | Trilha de recompensas com prazo | Alta em jogos; irrelevante aqui | **Alto** | **Alto** — FOMO temporal para um público que já falha por sobrecarga é fabricar dívida emocional | Alta | **1 — REJEITADO** |
| 5 | **Moeda premium (vender Bits)** | Pacotes de Bits | Média | **Fatal** | Alto | Baixa (é o mais fácil de fazer, e por isso perigoso) | **0 — REJEITADO.** Ver §6.C: Bits são fungíveis, então vendê-los abre as quatro portas da loja de uma vez, inclusive a cura de HP |
| 6 | **Anúncios** | Rewarded / intersticial | eCPM rewarded US$ 16–20 nos EUA, US$ 10–22 global [13]. A 1 impressão/DAU/dia num público majoritariamente BR (eCPM realista ~US$ 4): **≈US$ 0,12/MAU/mês ≈ US$ 1,44/MAU/ano** — o que é *comparável* à receita por usuário de uma assinatura a 4% de conversão. **O número não é desprezível, e é honesto dizer isso.** | **Alto** | **Alto** | Média + complicação de menores | **1 — REJEITADO, mas pelo motivo certo:** não é o dinheiro, é que **toda recompensa viável cruza a linha**. Bits→compram corações→assistir anúncio cura a punição. A única recompensa segura é cosmética, e aí a receita é limitada pela oferta de cosméticos. Reconsiderar só como fallback, com recompensa exclusivamente cosmética e cap diário |
| 7 | **B2B2C / patrocínio institucional** | RH, escolas, terapeutas. Painel de acompanhamento, SSO, contrato | Bem-estar corporativo cobra **US$ 1–3 PEPM na faixa econômica e US$ 4–10 PEPM em enterprise** [14]; a US$ 2 PEPM, 5.000 funcionários = **US$ 120 mil/ano** — ordem de grandeza melhor por usuário que B2C | Médio (o comprador não é o usuário) | Médio — dado de hábito visível ao empregador é um problema sério de privacidade | **Muito alta**: SSO, DPA/LGPD, painel, contrato, ciclo de vendas | **3 — visão "Depois", mas com uma consequência HOJE:** nenhum comprador de RH aprova um produto que pune o funcionário por não cumprir tarefas. Isso é um argumento adicional, e independente do psicólogo, para suavizar a punição (consolidado §5) |
| 8 | **Custos a cobrir** | — | — | — | — | — | Coberto integralmente em **§4.A** |

### 6.B — Dimensionamento de receita: 1k / 10k / 100k

**Premissas declaradas.** Preço US$ 39,99/ano; taxa de loja 15% (Small Business
Program / assinatura após 12 meses) ⇒ **US$ 33,99 líquidos por pagante/ano**. Custo de
imagem **corrigido** (recomendação #1) ≈ US$ 0,12/instalação. Chat + infra ≈
US$ 0,015/MAU/mês. `[HIPÓTESE]` **3 instalações que completam o Oráculo para cada MAU
sustentado no ano** — é a suposição mais frágil deste bloco e a que a telemetria precisa
substituir primeiro. Fixo: Cloudflare Workers Paid US$ 5/mês + Supabase Pro US$ 25/mês.

| Base | Conversão | Receita líquida/ano | Custo/ano | **Margem bruta/ano** |
|---|---|---|---|---|
| **1.000 MAU** | 2% (mediana [4]) | US$ 680 | US$ 900 | **–US$ 220** |
| | 5% `[HIPÓTESE]` | US$ 1.700 | US$ 900 | +US$ 800 |
| | 8% `[HIPÓTESE]` | US$ 2.719 | US$ 900 | +US$ 1.819 |
| **10.000 MAU** | 2% | US$ 6.798 | US$ 5.760 | **+US$ 1.038** |
| | 5% | US$ 16.995 | US$ 5.760 | +US$ 11.235 |
| | 8% | US$ 27.192 | US$ 5.760 | +US$ 21.432 |
| **100.000 MAU** | 2% | US$ 67.980 | US$ 57.000 | **+US$ 10.980** |
| | 5% | US$ 169.950 | US$ 57.000 | +US$ 112.950 |
| | 8% | US$ 271.920 | US$ 57.000 | +US$ 214.920 |

**A leitura que importa: na conversão mediana da categoria, o Soulmon fica no limiar do
break-even em qualquer escala.** Isso não é ruído — é estrutural. O custo de sprite escala
com o **funil** (instalações), não com a **receita** (pagantes), então crescer não dilui o
custo como diluiria num SaaS. A viabilidade depende de estar **acima** da mediana.

**Conversão de break-even, explicitamente:**

```
Custo total por MAU/ano, COM a correção #1:
  imagens 3 × $0,12 = $0,36  +  chat/infra $0,18   =  $0,54
  break-even = $0,54 / $33,99 = 1,6% dos MAU
  margem bruta de 70% (mínimo p/ pagar desenvolvimento e UA) ≈ 5,3% dos MAU

Custo total por MAU/ano, SEM a correção #1 (11 sprites):
  imagens 3 × $0,99 = $2,97  +  chat/infra $0,18   =  $3,15
  break-even = $3,15 / $33,99 = 9,3% dos MAU
```

`[FATO]` **9,3% é acima do topo do quartil superior da categoria** (6,1% de
download→pago para apps de preço alto [4]). Ou seja: **sem a recomendação #1, o Soulmon
precisa converter melhor que 75% do mercado só para empatar.** Com ela, precisa de 1,6%
para empatar e ~5,3% para ser um negócio. Essa é a diferença entre um produto e um hobby
caro, e ela cabe numa mudança de onde a função de geração é chamada.

### 6.C — O caso difícil: monetizar a loja atual mata a tese?

O briefing trata "a loja vende itens de evolução e corações" como uma porta única. Não é.
São **quatro portas com quatro respostas diferentes**, e tratá-las como uma é o erro que
custaria o produto.

| Porta | O que é | Evidência | Vender por **Bits ganhos** | Vender por **dinheiro** |
|---|---|---|---|---|
| **Cenários / temas** (11 itens, 150–300 Bits) | Puramente cosmético, sem efeito em HP, energia ou evolução | `shop.ts:104-161` | ✅ Sim | ✅ **Sim — é o único IAP totalmente seguro** |
| **Chips de atributo** (120 Bits) | Não aceleram a evolução; **decidem o ramo** (vírus/dado/vacina) | `shop.ts:87-95` | ⚠️ Aceitável — o Bit foi ganho | ❌ **NUNCA.** Compra *identidade*, não velocidade |
| **Coraçãozinho** (150 Bits) | A única cura de HP comprável | `shop.ts:98-100` | ⚠️ Aceitável, com cap | ❌ **NUNCA.** Vende a saída da punição que o produto criou |
| **Glitchtama** (+1 dia perfeito) | Compra progresso literal | `shop.ts:55-57`, exclusão em `:101-102` | ❌ Já está fora da loja, e deve continuar | ❌ **NUNCA** |

**Resposta direta: não, a existência da loja não mata a tese — mas monetizá-la
indiscriminadamente mata, e o vetor mais provável não é o que se imagina.** O item que
parece mais inocente (o chip de 120 Bits) é o mais letal, porque comprar *direção*
evolutiva é comprar quem a criatura é. Vender velocidade quebra a promessa de que a
criatura cresceu com o usuário; vender direção quebra a promessa de que ela *é* o usuário.
A segunda é a promessa central.

**Consequência operacional, e é a recomendação de desenho mais importante deste
relatório: nunca vender Bits.** Bits são fungíveis — um único SKU de "1.000 Bits" abre as
quatro portas ao mesmo tempo, incluindo as três proibidas, e nenhuma quantidade de
mensagem de UI desfaz isso. O único desenho que preserva a tese é **manter Bits
estritamente ganhos** e vender cosmético por **dinheiro direto** (ou, melhor, incluí-lo na
assinatura), sem moeda intermediária. Isso também elimina a necessidade de uma segunda
moeda premium, que é o começo de toda economia gacha.

### 6.D — A lista do que nunca será vendido (publicável)

> **O compromisso do Soulmon.** Sua criatura cresce porque você cresce. Nada nesta lista
> estará à venda, nunca, por dinheiro nenhum:
>
> 1. **Evolução.** Nenhuma forma pode ser comprada, acelerada, desbloqueada ou pulada.
> 2. **Dias perfeitos.** Nunca haverá como comprar um dia que você não viveu.
> 3. **Conclusão de tarefa.** Só você conclui suas tarefas.
> 4. **Corações / HP.** A cura do dano não está à venda. O que o app tirou de você, ele
>    nunca vai te vender de volta.
> 5. **O ramo evolutivo (chips de atributo).** Quem sua criatura *é* nasce do que você
>    faz, não do que você paga.
> 6. **Bits.** A moeda do jogo só se ganha. Não existe, e nunca existirá, pacote de Bits.
> 7. **Perdão da punição.** O modo gentil, a pausa e a hibernação são gratuitos para
>    todos, sempre. Não se cobra por não ser machucado.
> 8. **Prioridade em rankings ou torneios.**
> 9. **Seus dados.** Nenhum dado de hábito, humor ou tarefa é vendido, alugado ou usado
>    para publicidade.

Os itens 4 e 7 são os que amarram este relatório à linha vermelha do psicólogo, e o item 7
é o que impede o erro mais tentador de todos: colocar o "modo gentil" no plano pago.
**Monetizar a mitigação de dano é monetizar a dor com um nome bonito.**

### 6.E — Momento de introduzir, e como validar antes

**Quando.** Não antes de três coisas simultâneas: (a) PI resolvida (§4, item 1);
(b) telemetria rodando há ≥ 30 dias; (c) D7 conhecido e a curva de progressão recalibrada
(consolidado, onda Agora #4). Meu palpite de calendário: **3 a 6 meses depois do
lançamento em loja**, não antes.

**Onde, dentro do produto.** `[HIPÓTESE, alta confiança]` **Na primeira evolução, não no
onboarding.** O hard paywall converte 5× melhor [4], e a tentação é colocá-lo logo. Mas o
hard paywall só funciona quando o valor é legível *antes* do uso, e o valor do Soulmon é
literalmente invisível até o Oráculo terminar. Um paywall antes do Oráculo mata a única
coisa que o produto tem de único. A primeira evolução é o pico de vínculo demonstrado, é
o momento em que o usuário já provou retenção, e — não por acaso — é onde o custo de
geração de sprite reaparece. **O paywall deve ficar exatamente onde o custo está.**

**Como validar antes de construir.** Três testes, em ordem, todos antes de uma linha de
código de billing:

1. **Fake door (2 semanas, esforço 2).** Botão "Soulmon Alma" na tela de perfil com a
   lista de benefícios e dois preços. Toque → "Ainda não disponível. Quer ser avisado?"
   com campo de e-mail. Mede intenção real, não declarada. *Critério:* ≥ 8% dos MAU tocam
   e ≥ 25% desses deixam e-mail. Abaixo disso, o pacote de benefícios está errado, não o
   preço.
2. **Van Westendorp (n ≥ 100 por idioma).** As quatro perguntas clássicas (caro demais /
   barato demais / começando a ficar caro / boa oferta), rodadas separadamente em pt-BR e
   en-US — a disposição a pagar brasileira e a norte-americana não são o mesmo número, e
   tratá-las como um só é o erro de preço mais comum em produto brasileiro que quer
   vender fora. *Critério:* faixa de preço aceitável identificada, com o ponto ótimo
   comparado ao meu chute de US$ 39,99.
3. **Pré-venda do "Fundador" (esforço 2).** SKU vitalício US$ 24,99, edição limitada e
   datada, vendida por link antes de existir paywall no app. É o único teste que mede
   dinheiro de verdade, e financia o desenvolvimento. *Critério:* qualquer venda acima de
   30 unidades já valida que existe disposição a pagar; zero vendas é o dado mais
   importante que o produto poderia receber.

---

## 7. O que falta para ser um produto de sucesso (do meu ângulo)

1. **Um número, não uma opinião: quanto custa um usuário.** Este relatório produziu o
   primeiro (US$ 0,99/instalação hoje, US$ 0,12 corrigido; US$ 0,015/MAU/mês recorrente),
   mas ele é estimado de tabelas de terceiros porque **a Higgsfield não publica preço de
   API e o produto não mede o próprio consumo.** Instrumentar `higgsfield_image_generated`
   com custo é uma tarefa de meia hora que transforma todo este documento de estimativa em
   medição.
2. **Parar de gerar 11 sprites.** É a diferença entre precisar de 1,6% e de 9,3% de
   conversão. Nenhuma outra decisão de monetização chega perto desse impacto, e ela é a
   mais barata da lista.
3. **Contas reais.** Não existe monetização sobre um `saveId` que é o SHA-256 de um e-mail
   digitado. Não é uma questão de rigor — é que a primeira pessoa que trocar de celular
   perde o que pagou, e a segunda vai postar o hash num fórum.
4. **A lista do §6.D publicada antes do primeiro SKU.** Uma vez que exista pressão de
   receita, cada item dessa lista vai parecer negociável, um de cada vez, e cada
   negociação vai parecer pequena. Publicar é a única forma de tornar a decisão cara de
   reverter — e, em um mercado onde Duolingo e Habitica têm economias que ninguém
   defenderia em voz alta, **é também o melhor material de marketing que o produto tem.**
5. **Ninguém no squad está cobrindo isto: o Soulmon é pt-BR primeiro.** O Brasil tem
   conversão de assinatura estruturalmente mais baixa que a América do Norte [4], eCPM de
   anúncio uma fração do americano [13], e sensibilidade a preço em dólar. Toda a conta
   deste relatório está em USD com premissas de mercado global. **Se a base for 90%
   brasileira, a receita por usuário é materialmente menor do que projetei**, e a
   recomendação passa a exigir preço em BRL com paridade de poder de compra
   (algo como R$ 79/ano, não R$ 129) — o que muda o break-even. Isso precisa de um dono.

## 8. Discordâncias e riscos da minha própria análise

- **Discordo do consolidado no sequenciamento.** A onda "Agora" corta monetização
  inteira, com a justificativa de que "não se monetiza antes de saber que retém". Concordo
  com o *paywall*, discordo do *corte*: a recomendação #1 (geração preguiçosa) é uma
  decisão de monetização, é a de maior impacto financeiro do produto, e adiá-la significa
  que cada usuário adquirido durante o período de aprendizado custa 8× mais do que
  precisaria. **Corte o paywall da onda Agora; não corte a economia unitária.**
- **Discordo parcialmente da própria linha vermelha em um ponto, e quero registrar.** A
  regra "nada que permita comprar progresso" é correta e eu a defendo. Mas ela não cobre o
  caso dos chips de atributo, que não são progresso e são piores. Se a regra for aplicada
  literalmente, alguém vai monetizar chips com boa-fé, argumentando corretamente que eles
  não aceleram nada. **A regra precisa ser reescrita como "nada que altere quem a criatura
  é ou o que ela viveu"**, que é mais ampla e captura os dois casos.
- **Onde minha análise é fraca.** (a) **Não achei preço oficial da API da Higgsfield** —
  a faixa que usei (US$ 0,016 a US$ 0,19) tem amplitude de 12×, e o número central de
  US$ 0,09 vem de um agregador, não do fornecedor. Se o preço real for o piso, o problema
  encolhe muito; se for o teto, é pior do que descrevi. **Este é o único número deste
  relatório que uma consulta ao painel de faturamento da Higgsfield resolveria em cinco
  minutos, e deveria ser feita antes de agir sobre a §6.B.** (b) A razão de 3 instalações
  por MAU é chute meu. (c) Não achei conversão freemium segmentada para a categoria
  "hábito/v-pet" especificamente — usei a mediana geral de freemium, que provavelmente
  subestima um produto com vínculo emocional forte. (d) Não avaliei Neko Atsume nem apps
  de v-pet menores: **sem dado público confiável** de preço ou receita para eles no
  orçamento desta rodada.
- **Risco de eu estar errado sobre anúncios.** Calculei US$ 0,12–1,08/MAU/mês, o que é
  comparável a uma assinatura em conversão baixa. Se o produto acabar com uma base grande
  e pobre em conversão — cenário plausível no Brasil — a recusa a anúncios é uma escolha
  cara, não óbvia. Mantenho a recomendação, mas ela é a mais frágil do relatório.

## 9. Perguntas abertas para o dono do produto

1. **Qual é o preço real que você paga por imagem à Higgsfield hoje?** É o único número
   que muda toda a §6.B, e só você tem acesso a ele.
2. **A base-alvo é brasileira ou global?** Isso muda o preço, a moeda, a conversão
   esperada e a viabilidade dos anúncios — e nenhuma recomendação de preço é honesta sem
   essa resposta.
3. **Você aceitaria gerar apenas o rookie no onboarding**, sabendo que o usuário não veria
   mais as formas futuras no dia 1? Se a resposta for não por razões de produto, quero
   ouvir o argumento — porque toda a economia unitária depende disso.
4. **Isto é um negócio ou um projeto pessoal excelente?** O consolidado já perguntou; eu
   repito porque a resposta define se vale construir contas, billing e telemetria — que
   somam meses de trabalho não divertido antes do primeiro dólar.
5. **Você assinaria publicamente a lista do §6.D**, incluindo o item 7 (perdão da punição
   sempre grátis), sabendo que ele fecha a porta de monetização mais lucrativa da
   categoria?

## 10. Fontes

1. Groq — preço de `llama-3.1-8b-instant` (US$ 0,05/1M entrada, US$ 0,08/1M saída):
   https://www.cloudzero.com/blog/groq-pricing/ e
   https://www.helicone.ai/llm-cost/provider/groq/model/llama-3.1-8b-instant ·
   acesso 2026-08-03. *(Agregadores; a página oficial groq.com/pricing não foi acessada
   nesta rodada.)*
2. Higgsfield Soul — preço por geração (a partir de US$ 0,09; 1080p US$ 0,19):
   https://www.eachlabs.ai/higgsfield/higgsfield/higgsfield-ai-soul · acesso 2026-08-03.
3. Higgsfield — faixa Segmind (US$ 0,120–0,230/geração), créditos (~0,25/imagem) e pacotes
   (US$ 5/80 créditos): https://blog.segmind.com/higgsfield-ai-features-pricing-guide/ ·
   publicado 2026-01-23, acesso 2026-08-03. **Preço oficial da API própria
   (`platform.higgsfield.ai`): sem dado público confiável.**
4. RevenueCat — *State of Subscription Apps 2026* (conversão freemium 2,1% D35, hard
   paywall 10,7%, RPI D60 US$ 0,38 vs 3,09, LTV IA US$ 30,16 vs 21,37, retenção de pagante
   de apps de IA 36% pior, churn anual ~72%, preço alto converte 2×):
   https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026/ ·
   publicado 2026-03-19 (atualizado 2026-04-22), acesso 2026-08-03.
5. RevenueCat — hub do relatório e recortes por categoria (trial→pago em Saúde & Fitness
   37,7%): https://www.revenuecat.com/state-of-subscription-apps · acesso 2026-08-03.
6. Finch Plus — preço (US$ 9,99/mês, US$ 69,99/ano):
   https://help.finchcare.com/hc/en-us/articles/38755205001869-Finch-Plus-Pricing ·
   acesso 2026-08-03.
7. Habitica — assinatura (US$ 4,99/mês · 14,99/3m · 29,99/6m · 47,99/ano) e cap de Gems:
   https://habitica.fandom.com/wiki/Subscription · acesso 2026-08-03.
8. Forest — compra única US$ 3,99 (iOS):
   https://apps.apple.com/us/app/forest-focus-for-productivity/id866450515 ·
   acesso 2026-08-03.
9. Duolingo Super — US$ 12,99/mês, US$ 83,99/ano, Family US$ 119,99/ano:
   https://www.dealnews.com/features/duolingo/cost/ · acesso 2026-08-03.
10. Todoist Pro (US$ 5/mês anual, US$ 7 mensal) e TickTick Premium (US$ 3,99/mês,
    US$ 35,99/ano): https://www.usecarly.com/blog/todoist-pricing/ e
    https://comparetiers.com/tools/ticktick · acesso 2026-08-03.
11. Fabulous (US$ 39,99/ano, trial 7d) e Streaks (compra única US$ 5,99):
    https://www.choosingtherapy.com/fabulous-app-review/ · acesso 2026-08-03.
12. Pokémon Sleep — Premium Pass US$ 10/mês ou US$ 50/6 meses:
    https://support.pokemon.com/hc/en-us/articles/17264929442324 · acesso 2026-08-03.
13. Anúncios rewarded — eCPM 2026 (EUA US$ 16,49 Android / US$ 19,63 iOS; global
    US$ 10–22): https://www.businessofapps.com/ads/rewarded-video/ e
    https://blog.playio.co/rewarded-ad-benchmarks-2026 · acesso 2026-08-03.
14. Bem-estar corporativo — PEPM (US$ 1–3 econômico, US$ 4–10 enterprise):
    https://avidonhealth.com/hr-people-operations/employee-wellness-program-cost/ ·
    acesso 2026-08-03.
