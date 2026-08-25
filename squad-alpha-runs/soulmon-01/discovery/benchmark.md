# Benchmark — Soulmon (run `soulmon-01`, fase Discovery/Fase 0)

> Produzido por `alpha-benchmark`. Toda afirmação com fonte (URL) e data de consulta;
> sem fonte → `[suposição]`. Score de credibilidade 0.0–1.0 (oficial/primária ≥0.8 ·
> imprensa/blog especializado ~0.6 · blog genérico/agregador ≤0.4); afirmação sustentada
> só por fonte <0.6 é rebaixada a `[indício]`.
>
> **P3–P8 respondidas por default do HANDOFF, não por escolha explícita do dono.**
> Preço R$ 29,90 pagamento único é dado do contexto (`docs/BILLING-SETUP.md:81`) — este
> retrato **não recomenda mudança de preço** (§10 do contexto proíbe).

> ## ⚠️ CORREÇÃO PÓS-GATE (2026-08-25)
>
> Duas correções, independentes:
>
> 1. **Premissa de população:** este benchmark não afirmava "jogadores reais" diretamente,
>    mas herdava a moldura do run. Nenhum concorrente listado nem análise de preço/mercado
>    depende de o Soulmon ter usuários hoje — o valor deste documento é comparativo
>    (Soulmon vs. mercado), não dependente de população própria. **Nada aqui precisou ser
>    invalidado por essa causa.**
> 2. 🔧 **Inversão de premissa corrigida (achado do gate, citando `problem-framing.md:41-46`):**
>    a seção "Gaps" e a seção "Implicações para o run" abaixo repetiam a premissa **já
>    refutada** de que é o usuário **demo** quem recebe o avatar genérico/de terceiro. É o
>    **inverso**: o demo recebe 3 personagens ilustrados dedicados (`monetization.ts:15-44`);
>    é o usuário **pago** quem recebe o corpo sorteado por hash entre 3 linhas genéricas,
>    marcado como "provisório" no próprio código (`App.tsx:3045-3050`). Corrigido in loco
>    abaixo (🔧). O restante da análise de paridade de mercado permanece válido — só o rótulo
>    de qual perfil está subatendido estava trocado.

## Pergunta que este benchmark responde

Quem já resolve "produtividade via cuidado de uma criatura virtual" — e onde fica o
espaço que o Soulmon reivindica com "criatura gerada do perfil psicométrico do usuário"?

## Mapa de concorrentes

| Concorrente | Como resolve | Preço/modelo | Forças | Fraquezas | Fonte (URL · data) |
|---|---|---|---|---|---|
| **Habitica** | RPG de tarefas: hábitos/afazeres viram XP/gold de um personagem customizável; penalidade por falha (dano ao personagem, "party" social) | Free completo; assinante US$4,99/mês–US$47,99/ano, **puramente cosmético** (gemas/itens, sem vantagem) | Maior base madura do gênero, comunidade e "guildas" (accountability social), grátis funcional | Penaliza falha (o oposto da essência do Soulmon: "nunca um cobrador"); personagem é escolhido/customizado, não gerado de quem a pessoa é | [Habitica Wiki — Subscription](https://habitica.fandom.com/wiki/Subscription) · consultado 25/08/2026 · 0.6 (wiki de comunidade, mas espelha loja oficial) |
| **Finch (Self-Care Journey)** | Pássaro virtual cresce com tarefas de autocuidado; sem penalidade por falha | Free generoso (journaling, mood, exercícios); "Finch Plus" US$5,99–11,99/mês ou ~US$39,99–69,99/ano, cosmético | Tom sem culpa (referência citada no próprio `PLANO-EVOLUCAO.md:150`), monetização não bloqueia a função central | Pet é escolhido entre espécies fixas, não gerado por perfil; sem camada de personalidade profunda | [pcxio.com — Finch subscription price guide](https://pcxio.com/how-much-does-a-finch-app-subscription-cost-full-2026-price-guide/) · consultado 25/08/2026 · 0.4 `[indício]` (blog agregador, não é a Apple/loja oficial) |
| **Catzy** | Gato virtual + tarefas diárias de bem-estar (água, exercício, respiração, sono) viram "cat coins" | Free com IAP; mensal/anual não publicado em valor exato nas fontes checadas | Forte em wellness/mindfulness, popular em redes (TikTok/Instagram) — citado como referência de "casa que cresce" no `PLANO-EVOLUCAO.md:190-191` | Sem geração de personagem único por perfil; foco maior em bem-estar do que em produtividade/tarefas reais | [mwm.ai — Catzy na App Store](https://mwm.ai/apps/catzy-self-care-journey/6737681541) · consultado 25/08/2026 · 0.5 `[indício]` (agregador de app store, não a ficha oficial da loja) |
| **Forest** | Árvore cresce durante sessão de foco; sair do app mata a árvore | iOS: US$3,99 pagamento único; Android: free + upgrade Pro US$3,99 | Preço único (paralelo direto ao modelo do Soulmon), parceria real com ONG (Trees for the Future) dá prova social tangível | Sem avatar/criatura persistente nem progressão de longo prazo — é sessão-a-sessão, não "vida do usuário" | [Wikipedia — Forest (application)](https://en.wikipedia.org/wiki/Forest_%28application%29) · consultado 25/08/2026 · 0.6 |
| **Pokémon Sleep** (fora do setor de produtividade — job comparável: cuidar de criatura sem punir falha) | Dormir alimenta um Snorlax/coleção de Pokémon; nunca há perda, só ausência de ganho | Free + Premium Pass (assinatura), cosmético/conveniência | Maior prova de mercado de "nunca perder, só não ganhar" — US$234,9M em 3 anos (fonte já citada no `PLANO-EVOLUCAO.md:34`, não reverificada nesta rodada) | Não é produtividade nem gerado por perfil; a criatura é escolhida/capturada, não única | `docs/PLANO-EVOLUCAO.md:34` — **fonte original do dado (imprensa de jogos, ex. Sensor Tower/Niantic) não foi relocalizada nesta rodada; tratar como `[indício]` até revalidação direta** |
| **Duolingo** (fora do setor — job comparável: gamificar constância de um comportamento real, com mascote e streak) | Mascote (Duo) + streak diário + liga social; app grátis com assinatura Super (remove anúncios, vidas ilimitadas) | Free robusto; Super ~US$12,99/mês (valor de mercado amplamente divulgado, não checado nesta rodada — `[suposição]` de faixa) | Provou que mascote com personalidade gera afeto e retenção em escala; é o padrão de "personagem fixo que reage ao progresso" | Streak é punitivo por padrão (perde tudo ao quebrar) — é o padrão que o próprio `PLANO-EVOLUCAO.md` (item Constância "N das últimas 7") explicitamente recusa adotar | `[suposição]` — preço de assinatura não revalidado nesta rodada; incluído só como padrão de mascote/streak, não como dado de preço |
| **16Personalities** (fora do setor — job comparável: gerar identidade visual a partir de teste psicométrico) | Questionário de personalidade → tipo com "avatar"/personagem ilustrado associado ao resultado | Free com relatório pago (upsell de relatório detalhado) | Prova de mercado de que teste psicométrico → identidade visual funciona e viraliza | Avatar é um de ~16 tipos fixos (não gerado, é selecionado de um pool pequeno); não evolui, não tem mecânica de jogo | `[indício]` — achado por busca geral, não há URL de ficha de preço verificada nesta rodada; item mantido só como padrão de categoria, revalidar antes de citar número |
| **Bobbie — Meu Bichinho Virtual** (pt-BR) | Tamagotchi digital brasileiro, cuidar de um bichinho (comida/sono/limpeza) sem ligação a produtividade real | Free + IAP (valor não verificado) | Único achado desta rodada com apelo direto pt-BR na categoria "v-pet puro" | Sem gamificação de produtividade nem perfil — é entretenimento puro, não é comparável de job completo | [Aptoide — Meu Bichinho Virtual](https://digitaleagle-my-virtual-pet.pt.aptoide.com/app) · consultado 25/08/2026 · 0.3 `[indício]` (loja alternativa não oficial) |

**Lacuna de busca declarada:** nesta rodada **não foi localizado nenhum concorrente
pt-BR ou global** que combine as três camadas do Soulmon ao mesmo tempo — (1) perfil
psicométrico validado (Big Five/HEXACO), (2) geração de uma criatura **única e não
escolhida**, e (3) mecânica de produtividade com regras anti-cobrança. Isso é relatado
como achado, não comemorado — ver §"Gaps" abaixo.

## Paridade de mercado (o que é aposta obrigatória)

- Criatura/avatar de estimação que reage a comportamento do usuário (todos os 5
  primeiros concorrentes têm isso — Habitica, Finch, Catzy, Forest com árvore, Pokémon
  Sleep).
- App gratuito funcional + upsell cosmético (Habitica, Finch, Catzy, Duolingo — padrão
  dominante de monetização do gênero, não é diferencial).
- Onboarding curto antes de mostrar valor (todos os apps de v-pet citados abrem em
  minutos, não em rituais longos) — o ritual de 8 telas do Soulmon é o **oposto** desse
  padrão, ver §"Padrões consolidados".
- i18n/PT como localização, não como produto nativo — nenhum dos concorrentes globais
  tratados aqui nasceu em português.

## Diferencial real vs percebido

| Suposto diferencial | Alguém já faz? | Evidência | Veredito (real / percebido / paridade) |
|---|---|---|---|
| Criatura que evolui sem punir falha ("nunca um cobrador") | Parcialmente — Finch e Pokémon Sleep já não punem falha | `PLANO-EVOLUCAO.md:34-46`; Finch citado acima | **Paridade emergente**: era diferencial há alguns anos (Habitica ainda pune), hoje é o padrão de quem sobreviveu no gênero. Real diferencial é ter chegado lá **por regra documentada com teste travando** (`CLAUDE.md`), não pela ideia em si |
| Criatura **gerada** (não escolhida) do perfil psicométrico do usuário | Não encontrado nenhum concorrente direto nesta busca (ver lacuna acima) | Busca dedicada sem resultado — `[indício]` de espaço vazio, não confirmação de ausência total | **Real, condicional**: nenhuma fonte confirma concorrente fazendo isso; é a alegação central do produto e sobrevive ao teste de busca desta rodada, mas ver §"Gaps" sobre o não-problema |
| Pagamento único R$ 29,90 (sem assinatura) | Sim, parcialmente — Forest (US$3,99 único) prova o modelo em outra categoria | Ver linha Forest acima | **Paridade de modelo, não de valor**: pagamento único já é padrão aceito no gênero "utilitário simples"; o que falta comparar é se R$29,90 cobre um produto tão mais complexo (perfil + geração + pipeline de 3 repos) quanto um foco-timer de árvore — **não é este benchmark que decide isso** (§10 proíbe mexer em preço) |
| Astrologia + numerologia + Big Five/HEXACO combinados numa leitura só | Não encontrado combinação equivalente nos concorrentes de produtividade pesquisados | Nenhuma fonte | **Real, mas não testado quanto a demanda** — é comum em apps de bem-estar/espiritualidade (Co-Star, The Pattern — não pesquisados nesta rodada, `[suposição]` de existência) fora do gênero produtividade; combinação com v-pet de tarefas não tem paralelo achado |
| Dois usuários (demo com pet de terceiro / pago com ritual próprio, mas corpo sorteado) | Padrão de freemium com feature-gate é universal (Habitica, Finch, Catzy) | Tabela acima | **Paridade de estrutura, mas execução é atípica**: o comum é o grátis ter uma versão *reduzida* do mesmo pet. 🔧 O Soulmon inverte isso pela metade: o **demo** recebe personagens ilustrados dedicados (melhor do que a versão reduzida típica), e é o **pago** — quem pagou pela unicidade — que recebe o corpo genérico sorteado. Nenhum concorrente pesquisado tem essa inversão específica (cobrar por unicidade e entregar sorteio) — ver Gaps |

## Gaps (espaço em branco)

- **Nenhum concorrente encontrado combina teste psicométrico validado + geração
  automática de criatura única + regras anti-punição num único produto de
  produtividade.** Hipótese de por que está aberto: **é caro e difícil**, não "não
  funciona" — exige (a) motor de geração de imagem/IA com custo por usuário (o próprio
  contexto já lista isso como uma das 3 teses não medidas, custo de IA ≤R$8/usuário,
  `contexto.md §4`), e (b) trabalho de dados de 3 repositórios satélites
  (Class-System/Bestiário/teste-personalidade) que um app comum não tem motivo para
  montar. Não há evidência de que o mercado tenha testado e recusado por não funcionar
  — é ausência por custo de engenharia, condizente com o teste do não-problema.
- 🔧 **O usuário pago recebe o avatar genérico, não o demo** (`contexto.md §3`;
  `problem-framing.md:41-46`) — e isso é um gap **auto-infligido**, não de mercado:
  nenhum concorrente pesquisado cobra pela unicidade de um avatar e entrega um sorteio
  entre 3 linhas genéricas no lugar. O padrão de mercado observado é o oposto: quem paga
  recebe *mais* personalização, não menos. Hipótese: decisão de custo (gerar imagem por
  IA no reveal do pago seria caro e hoje só acontece por um botão manual numa página sem
  entrada na navegação, `OraclePage.tsx:259`) — mas o efeito é que o motivo de compra
  declarado (`PLANO-PRODUTO.md:63,67`) não está sendo entregue a quem pagou por ele.

## Padrões consolidados a adotar (não divergir)

- **Onboarding curto antes de qualquer valor visível** é padrão validado em todos os
  concorrentes de v-pet pesquisados (Finch, Catzy, Forest abrem em 1-3 telas). O ritual
  de 8 telas do Oráculo (`contexto.md §3`) diverge desse padrão por escolha deliberada
  de produto (profundidade > velocidade) — isso já está registrado como tensão no
  contexto, não é um achado novo deste benchmark, só a confirmação externa de que é
  uma divergência consciente, não um "ninguém pensou nisso".
- **Monetização cosmética/sem vantagem de jogo** (Habitica, Finch) é o padrão que evita
  a crítica de pay-to-win — o Soulmon já segue isso na maior parte (Bits vs. Créditos
  documentados em `CLAUDE.md`), exceto o item já sinalizado no próprio
  `PLANO-EVOLUCAO.md:269` (Cura instantânea por Créditos = "pagar para pular o
  cuidado") — candidato a ajuste **de produto**, não deste benchmark.
- **Streak que não zera** (janela deslizante, "N de últimos 7") já é a direção que
  Duolingo e o próprio Soulmon adotaram por razões diferentes; não é preciso inventar
  mecanismo novo aqui — o Soulmon já fez essa escolha (`CLAUDE.md` "Constância").

## Implicações para o run

- O diferencial central (criatura gerada de perfil) **não tem concorrente direto
  encontrado** — mas isso é achado de busca desta rodada, não prova de mercado; a
  pergunta ao dono é se vale investir em revalidação mais funda (ex.: Co-Star, The
  Pattern, apps de astrologia+gamificação) antes de tratá-lo como diferencial firme.
- 🔧 **O gap do usuário PAGO recebendo o avatar genérico** (corrigido acima) é o item de
  maior alavanca prático: nenhum concorrente do gênero cobra por unicidade e entrega
  sorteio no lugar — isso é insumo direto para `alpha-product-manager` (escopo) e
  `alpha-estrategista-negocio` (funil), sem tocar em preço. **Não é** um problema de
  "o demo não vê amostra do produto real" (o demo já tem personagens dedicados) —
  é um problema de "o pago não recebe o que pagou por".
- Monetização cosmética-only já é paridade cumprida; a única divergência aberta
  (Cura instantânea por Créditos) é pequena e já auto-identificada no repo.

## Risco competitivo do diferencial (dev solo)

Um v-pet gerado de perfil psicométrico **não é defensável por exclusividade técnica**:
os três blocos (teste psicométrico, motor de geração de imagem por IA, lore/bestiário)
são, isoladamente, replicáveis por qualquer equipe com orçamento de IA em semanas — não
há barreira de propriedade intelectual proprietária identificada nesta busca. O que um
concorrente com mais capital **não copia em 3 meses** é o acúmulo específico: a base de
regras anti-cobrança testada (`CLAUDE.md`, dezenas de testes travando comportamento),
o pipeline de 3 repositórios satélites com contrato de dados já calibrado por
simulação (`contexto.md §8`), e a voz/identidade visual fechada (`PLANO-DESIGN.md`).
Isso é **vantagem de execução acumulada**, não de ideia — defensável enquanto o dono
continuar entregando essa profundidade mais rápido do que um concorrente reconstrói do
zero, mas **frágil a um concorrente com equipe** que decida investir 6-12 meses,
porque nenhuma peça isolada tem barreira legal ou técnica alta. `[hipótese]` — não há
como testar isso sem um concorrente real entrando no mercado; não é falseável com os
dados hoje disponíveis.

## Limites deste retrato

- Amostra pequena (8 concorrentes/análogos), buscada em uma única sessão de pesquisa
  web em 25/08/2026 — não é levantamento sistemático de app stores.
- Preços de Catzy, Duolingo e 16Personalities **não foram confirmados em fonte
  primária** (loja oficial) — ficam como `[indício]`/`[suposição]`, precisam
  revalidação antes de qualquer decisão de precificação.
- Nenhum concorrente pt-BR combinando psicometria + v-pet foi encontrado; isso é
  ausência de evidência, não evidência de ausência — busca limitada a termos em
  português e inglês, sem varredura de app store por categoria.
- Dado de receita do Pokémon Sleep (US$234,9M) veio herdado de `PLANO-EVOLUCAO.md` e
  **não foi relocalizado na fonte primária** nesta rodada — tratar como `[indício]`
  até nova checagem direta (Sensor Tower/Niantic ou imprensa especializada).
- Este retrato não avalia UI/UX comparativo (nenhuma captura de tela de concorrente
  foi analisada pixel a pixel) — é comparação de modelo, mecânica e preço, não de
  design visual.
- 🔧 Este retrato não depende de população real de usuários do Soulmon para nenhuma de
  suas conclusões — é comparação com o mercado externo. A correção pós-gate deste
  documento foi de rótulo (qual perfil é subatendido), não de método.
