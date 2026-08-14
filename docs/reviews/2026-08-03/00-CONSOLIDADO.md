# Revisão Soulmon — Relatório Consolidado

**Data:** 2026-08-03 · **Conduzido por:** Maestro do squad
**Pergunta da rodada:** O que falta para o Soulmon ser um produto de sucesso — um app que
as pessoas abrem todo dia, que efetivamente as faz executar suas tarefas, que elas amam a
ponto de não desinstalar, e que se sustenta financeiramente?

> **Nota de método — leia antes de confiar neste documento.**
> A rodada foi desenhada para 16 agentes especialistas em 4 ondas. A execução em
> subagentes foi interrompida por limite de sessão da plataforma antes que qualquer
> relatório especializado fosse concluído. Este consolidado foi produzido **diretamente
> pelo Maestro**, aplicando os roteiros de auditoria dos agentes sobre o repositório.
> Consequências que você precisa saber:
> - As análises de **código e de regras do produto** são de primeira mão e verificadas —
>   confie nelas; toda afirmação traz `arquivo:linha`.
> - As análises de **mercado e de concorrência** não puderam ser feitas com pesquisa
>   externa nesta rodada. Onde eu cito números de mercado, marco `[SEM FONTE NESTA
>   RODADA]` e você deve tratá-los como hipótese a verificar, não como dado.
> - Os relatórios individuais dos 16 agentes **não existem**. Quando o limite resetar,
>   rode `/revisao-soulmon` para tê-los — especialmente `soulmon-user-researcher`,
>   `soulmon-monetization-strategist` e `soulmon-growth-aso`, cujas conclusões dependem
>   inteiramente de pesquisa de mercado que esta rodada não fez.

---

## 1. Veredito

> **Revisado em 2026-08-03 após os relatórios de growth/ASO, monetização e o rascunho de
> pesquisa de usuário. O veredito original está preservado em §1.1 — ele estava certo nos
> fatos e errado na ordem.**

**O Soulmon não entrega hoje o único diferencial que possui.** O Oráculo promete ao
usuário, com essas palavras, "a criatura da SUA alma — única, só sua"
(`SoulmonOnboarding.tsx:160`), e então entrega um nome, um parágrafo de biografia e
**nenhuma imagem** (`SoulmonOnboarding.tsx:276-295` — o próprio comentário no código diz
`Reveal — apenas nome + descrição breve`). A criatura que a pessoa de fato vê e cuida
todos os dias é sorteada entre três linhas fixas (`App.tsx:1260`):

```js
const GENERIC_LINES = ['tapirmon', 'veemon', 'salamon'] as const;
```

Um em cada três usuários recebe exatamente a mesma criatura — e as três são Digimon. A
geração de sprites únicos existe e funciona, mas mora numa página separada
(`OraclePage.tsx:166`), atrás de um botão manual rotulado "👾 Gerar criatura e prompts":
é uma ferramenta de autoria, não parte do fluxo do usuário.

**Portanto: o produto tem o diferencial construído e não o liga.** Tudo o que o torna
diferente de Habitica ou Finch está a um fio de ligação de distância — e enquanto esse
fio não for ligado, o Soulmon é um app de tarefas com um Digimon genérico, competindo em
uma categoria onde não tem vantagem alguma.

Somado a isso, três problemas que continuam valendo: **propriedade intelectual** que não
é dívida legada mas o caminho de geração ativo — incluindo o nome do produto, que é um
personagem canônico da Bandai; uma **curva de progressão** 3 a 5 vezes longa demais para
sobreviver à primeira semana; e a **ausência de instrumentação**, que impede saber qual
deles está matando o produto.

Nada disso é falta de recursos ou de escopo. São problemas de calibragem, de ordem e de
uma conexão não feita — todos corrigíveis em semanas. O que não é corrigível em semanas é
a consequência de lançar sem corrigi-los.

**A primeira coisa a fazer é ligar a geração de sprites ao onboarding — depois de
corrigir o prompt (`oracle.ts:2230`) e a estratégia de geração (§2.0).** Nessa ordem, e
não em outra.

### 1.1 Veredito original (2026-08-03, manhã — preservado)

*O Soulmon tem um diferencial real e raro — o Oráculo, que dá a cada jogador uma linha
evolutiva única — e está prestes a ser inviabilizado por três coisas ao mesmo tempo: um
problema de propriedade intelectual (…); uma curva de progressão calibrada de 3 a 5 vezes
longa demais (…); e a ausência total de instrumentação (…).*

**O que mudou:** eu tratei o Oráculo como diferencial entregue e apenas mal aproveitado.
Ele não está entregue. Isso não invalida os três problemas — eleva um quarto acima deles.

---

## 2.0 O diferencial desligado, e o que ele custa para ligar

Este achado reconcilia uma contradição entre dois relatórios do squad, e a reconciliação
é mais útil que qualquer um dos dois isolado.

**O relatório de monetização calculou** 11 imagens geradas por instalação
(`spritePrompts.ts:67-108`) × ~US$ 0,09 = **US$ 0,99 por instalação**, contra US$ 0,38 de
receita mediana por download em freemium (RevenueCat 2026) — margem unitária negativa de
US$ 0,68 antes de qualquer gasto com aquisição, exigindo 9,3% de conversão para empatar,
acima do quartil superior da categoria.

**Mas esse custo não é incorrido hoje**, porque a geração não está no caminho da
instalação — está atrás de um botão numa página de autoria. O custo real por instalação
hoje é próximo de zero, e o diferencial entregue também.

**A síntese correta é esta:** os US$ 0,99 não são um vazamento a estancar. São **o preço
de entregar a única coisa que torna o produto diferente**, ainda não pago. A decisão não
é "cortar custo" nem "aceitar prejuízo" — é **corrigir a estratégia de geração antes de
ligá-la**, e não depois:

- Gerar **apenas a forma rookie** no Oráculo; as demais formas na hora de cada evolução.
  A cadeia image2image já é incremental, então isso não perde consistência visual — e a
  consistência entre estágios é justamente o que sustenta a emoção da evolução.
- Efeito: custo por instalação cai ~8×, o break-even sai de 9,3% para **1,6%** de
  conversão, e a margem fica saudável em ~5,3%.
- Efeito colateral valioso: cada evolução passa a **revelar uma forma inédita**, gerada
  naquele momento. Isso transforma o marco em evento e ataca de frente o problema da
  curva longa (§2.2).

Ligar a geração ao onboarding sem essa correção é o pior dos mundos: paga-se 8× mais caro
por usuário, num período em que ainda não se sabe se o produto retém.

**Ordem obrigatória:** (1) corrigir o prompt de `oracle.ts:2230`; (2) mudar a estratégia
para rookie-no-onboarding / demais-na-evolução; (3) só então ligar ao fluxo do usuário.

---

## 2. Os três achados que dominam tudo

### 2.1 BLOQUEANTE — O produto gera obra derivada por design, não por acidente

Eu esperava encontrar dívida legada da época "DigiApp". Encontrei algo pior.

**`src/utils/oracle.ts:2230`** — o prompt que gera o sprite de **toda** criatura de
**todo** usuário:

```
Generate this RPG creature inspired by Digimon, Pokémon, Monster Rancher, Yu-Gi-Oh,
Warhammer, Palworld, Legend of Mana, Final Fantasy, Hello Kitty, Tamagotchi,
Ragnarok Online and World of Warcraft.
```

Isso não é código antigo esperando limpeza. É o caminho de geração vivo do produto,
instruindo explicitamente um modelo de terceiros a produzir arte derivada de onze
franquias nomeadas — incluindo três das marcas mais litigiosas do setor. O prompt está
inclusive **coberto por teste** (`src/utils/oracle.test.ts:219`), o que significa que
está protegido contra remoção acidental.

Não para aí:

| Evidência | O que é |
|---|---|
| `src/types/evolution-lines.ts` | 43 entidades nomeadas, praticamente todas Digimon canônicos, com sprites importados: linhas completas de Veemon (Chicomon→Chibimon→Veemon→ExVeemon→Paildramon→Imperialdramon→Paladin Mode), de Salamon (YukimiBotamon→Nyaromon→Plotmon→Gatomon→Angewomon→Ophanimon), de Tapirmon, mais Flamedramon, Raidramon, Magnamon, Lilithmon, Mastemon, HolyDramon |
| `src/types/progression.ts:31-63` (`LEGACY_FORM_TIERS`) | ~50 nomes canônicos de Digimon usados como **inimigos da masmorra** — portanto **visíveis ao usuário em jogo**: agumon, greymon, garurumon, meramon, devimon, angemon, birdramon, kabuterimon, seadramon, airdramon, ogremon, kuwagamon, numemon, monzaemon, etemon, andromon, megadramon, vademon, nanimon, betamon |
| `src/guidelines/AI-Personality.md`, `Como-Configurar-IA.md` | Instruem a personalidade da IA a referenciar episódios de Digimon Adventure e a usar "digievolução" |
| `CLAUDE.md` | Documenta os sprites como derivados do repo `furudbat/wayland-vpets`, pasta `dmc/` — sprites de v-pet, cuja proveniência original é quase certamente rip de ROM |

**Por que isso domina o relatório inteiro:** enquanto isso existir, não há lançamento em
loja, não há monetização (vender conteúdo derivado é o agravante que transforma um pedido
de remoção em um pedido de indenização), não há captação, não há parceria e não há
imprensa. Todas as outras 30 recomendações deste documento são inexecutáveis até aqui.

**Nuance importante, e é uma boa notícia:** o comentário em `progression.ts:1-4` mostra que
a arquitetura nova **já resolveu o problema estrutural**. A árvore do Soulmon não usa mais
espécies fixas — cada jogador tem uma linha única gerada pelo Oráculo, e `getStageLevel`
lê o nível do prefixo do id sem precisar de tabela por espécie. Ou seja: **o motor já é
original; só o conteúdo e o prompt não são.** Isso não é uma reescrita. É uma substituição
de dados e de uma string.

### 2.2 CRÍTICO — A primeira evolução está a 10 dias perfeitos de distância

`src/types/progression.ts:5-11`:

```
rookie:    { required: 4, cap: 6,  daysToEvolve: 10  }
champion:  { required: 5, cap: 7,  daysToEvolve: 20  }
ultimate:  { required: 6, cap: 8,  daysToEvolve: 30  }
mega:      { required: 7, cap: 9,  daysToEvolve: 30  }
ultra:     { required: 8, cap: 10, daysToEvolve: 999 }
```

E um dia perfeito exige (por `CLAUDE.md`, regras do jogo) concluir o requisito do estágio
**e** terminar com a energia cheia — e as barras de energia são exatamente o requisito.
Portanto: **10 dias em que o usuário concluiu 4 tarefas cada, para ver a primeira
evolução.** Dias perfeitos, não dias corridos: um dia com 3 tarefas não conta.

Para o usuário real isso significa duas a quatro semanas de calendário até a primeira
recompensa estrutural do produto. E o caminho completo até ultra são 90 dias perfeitos —
na prática, algo entre seis meses e nunca.

Isso inverte a regra mais básica de produto de hábito: **a recompensa mais forte fica
depois do ponto onde a maioria já desistiu.** O Soulmon investiu pesado no ritual de
nascimento (o Oráculo tem 2.996 linhas — é o maior arquivo do produto depois do `App.tsx`)
e depois deixa 10 dias de silêncio estrutural antes do próximo grande momento.

`[SEM FONTE NESTA RODADA]` A retenção D7 típica de apps de produtividade e bem-estar fica
na casa de um dígito a baixa dezena de por cento. Se isso se confirmar, o Soulmon entrega
seu segundo maior momento emocional para uma fração muito pequena dos instalados. Este é
um número que a próxima rodada precisa levantar com fonte, porque ele define a magnitude
do problema — mas a direção do problema não depende do número.

Agravante: `champion` sobe o requisito para 5 tarefas/dia, `ultimate` para 6, `mega` para
7, `ultra` para 8 — **todo dia, com energia cheia**. O produto pede mais exatamente de
quem já está cansado, e a punição por não entregar é a regressão da criatura. Para o
público que provavelmente é o ICP real (pessoas com dificuldade de execução), isso é uma
escada projetada para terminar em fracasso.

### 2.3 CRÍTICO — Sem telemetria, os dois achados acima são teoria

Não há analytics, funil, coorte ou evento instrumentado em lugar nenhum do produto. Não
existe uma única medida de quantos usuários chegam ao fim do Oráculo, quantos cadastram a
primeira tarefa, quantos têm o primeiro dia perfeito, quantos chegam aos 10.

Isso significa que **este relatório, e qualquer outro, é opinião qualificada sobre código
— não evidência sobre comportamento.** Instrumentar não é uma tarefa de engenharia entre
outras; é a condição para que todo o resto do trabalho seja verificável.

---

## 3. O que é genuinamente forte (e precisa ser protegido)

Um relatório que só encontra problemas é um relatório mal feito. O Soulmon tem ativos
reais, e as recomendações abaixo existem para protegê-los, não para substituí-los.

1. **O Oráculo é o diferencial, e é defensável.** Uma linha evolutiva única por jogador,
   gerada a partir das respostas dele, com sprites próprios — isso é caro de copiar e vai
   direto na tese "essa criatura é minha". O parente mais próximo no gênero é o Monster
   Rancher (criatura derivada de mídia externa), e ninguém está fazendo isso em app de
   hábito. **Este é o produto.** Tudo que não serve a isso é secundário.
2. **A arquitetura de progressão já é agnóstica de espécie** (`progression.ts:22-28`).
   Isso é uma decisão de engenharia madura que torna a correção de PI barata.
3. **A infraestrutura de retenção é séria para um projeto deste porte:** Web Push VAPID
   implementado do zero, FCM nativo, alarmes via `AlarmManager`, widget Android, cron por
   horário condicionado ao progresso. Muita startup financiada não tem isso.
4. **A degeneração é o mecanismo mais corajoso do produto.** É fiel ao v-pet de 97, é
   emocionalmente potente e é o oposto do design covarde padrão da categoria. Ele precisa
   ser recalibrado — não removido. Ver §5.

---

## 4. Problemas por ordem de gravidade

| # | Problema | Gravidade | Evidência |
|---|---|---|---|
| 1 | Prompt de geração pede obra derivada de 11 franquias | Bloqueante | `src/utils/oracle.ts:2230`, teste em `oracle.test.ts:219` |
| 2 | 43 criaturas Digimon canônicas com sprites na árvore | Bloqueante | `src/types/evolution-lines.ts` |
| 3 | ~50 nomes Digimon como inimigos visíveis da masmorra | Bloqueante | `src/types/progression.ts:31-63` |
| 4 | Primeira evolução a 10 dias perfeitos | Crítico | `src/types/progression.ts:6` |
| 5 | Zero telemetria — nenhum diagnóstico é verificável | Crítico | ausência em todo o repo |
| 6 | Requisito diário crescente (4→8 tarefas) sem teto de tolerância | Crítico | `src/types/progression.ts:5-11` |
| 7 | Sem contas reais: `saveId` = SHA-256 do e-mail, sem autenticação | Grave | `src/utils/cloudSave.ts`, `functions/api/save.js` |
| 8 | Economia invertida: Bits vêm de minijogos, não de tarefas | Grave | `src/utils/shop.ts`, `dungeon.ts`, `DinoGame.tsx`, `RPSGame.tsx` |
| 9 | Vínculo abandonado após o nascimento: chat sem memória persistente | Grave | `functions/api/chat.js`, `src/components/ChatBox.tsx` |
| 10 | Zero monetização + custo variável de IA por usuário não medido | Grave | ausência; Groq + Higgsfield |
| 11 | Meta = `min(cadastradas, requisito)` premia subdeclarar tarefas | Moderado | regra em `CLAUDE.md`; `src/utils/dailyReset.ts` |
| 12 | Chave privada VAPID em texto plano no repositório | Moderado (segurança) | `CLAUDE.md`, `PROJETO.md` |
| 13 | Documentação contradiz o produto ("DigiApp", "100% completo, 0 bugs") | Moderado | `docs/00-START-HERE.md`, `PROJETO.md` |
| 14 | `App.tsx` com 1.904 linhas orquestra tudo | Moderado | `src/App.tsx` |

### Detalhe do #8 — a economia está invertida

As fontes de Bits são o Dino (`floor(score/100)`), o PPT (5/vitória) e a masmorra
(Bits/inimigo + bônus de andar). **Nenhuma tarefa real gera moeda.** Somado ao fato de que
os minijogos não têm limite diário, o produto diz ao usuário, pelo desenho da economia:
*o dinheiro vem de jogar, não de viver*. Isso viola diretamente o anti-objetivo declarado
no briefing ("não virar um jogo que a pessoa joga em vez de fazer as tarefas") e é o
caminho mais provável pelo qual a camada 3 canibaliza a camada 1.

### Detalhe do #11 — o incentivo perverso é menor do que parece, mas existe

A meta usada na perda de HP é `min(tarefas cadastradas, requisito do estágio)`. Cadastrar
1 tarefa e cumpri-la protege o HP integralmente. **O dia perfeito, porém, exige energia
cheia**, e as barras de energia equivalem ao requisito — então subdeclarar não compra
evolução. O sistema é mais bem desenhado do que aparenta à primeira leitura. Ainda assim,
o caminho ótimo para um usuário ansioso é cadastrar pouco para não perder corações — o que
degrada o app como ferramenta real de organização. Corrigível com desenho, não urgente.

---

## 5. A questão da punição — a decisão de produto mais importante depois da PI

O Soulmon pune de quatro maneiras: perda de corações proporcional ao não feito, perda de
1 coração a cada 6h com cocô não limpo, perda de 1 coração ao perder na masmorra, e
regressão da criatura em HP 0.

A literatura de mudança de comportamento é consistente em um ponto: aversão à perda
funciona bem para **prevenir** o lapso e falha para **recuperar** de um lapso já ocorrido.
Depois de quebrar a sequência, punir aumenta o abandono em vez da reparação.

E aqui há um agravante específico da tese deste produto. Quando a criatura é declaradamente
a alma do usuário, uma criatura que definha por culpa dele não comunica "você falhou numa
tarefa" — comunica "você está definhando". Isso é o gatilho de vergonha, e vergonha motiva
fuga, não reparação. O produto pode estar construindo seu mecanismo de churn no mesmo lugar
onde construiu sua promessa.

**Não recomendo remover a consequência** — sem stakes o produto perde justamente o que o
diferencia da categoria acolhedora. Recomendo três correções:

1. **Desenhar o retorno.** O fluxo mais bem feito do app deveria ser o de voltar depois de
   falhar, e hoje ele não é desenhado. A criatura deveria estar *preocupada com o usuário*,
   não sofrendo *por causa dele*. É a mesma mecânica com a atribuição invertida, e muda
   completamente o efeito psicológico.
2. **Modo pausa / hibernação.** Doença, viagem, crise. Sem isso, o produto pune com mais
   força exatamente quem mais precisa dele — e o faz no pior momento possível.
3. **Piso de dano.** A regressão deveria ser recuperável rápido (um bom dia devolve o
   estágio) em vez de custar outros 10 dias perfeitos. Punição cujo custo de reparo é
   maior que o custo de desinstalar produz desinstalação.

---

## 6. Roadmap

### Onda "Agora" — antes de qualquer lançamento (revisada em 2026-08-03)

Ordenada por **dependência**, não por importância. Os itens 1-3 são pré-requisitos dos
demais: fazer o 5 antes do 1 significa gerar conteúdo derivado; fazer o 4 depois do 2
significa renomear 90 criaturas duas vezes.

| # | Ação | Por quê | Esforço |
|---|---|---|---|
| 1 | Reescrever o prompt de `oracle.ts:2230` sem nomear franquia alguma; descrever o estilo por atributos visuais (paleta, silhueta, densidade de pixel), não por referência. Atualizar `oracle.test.ts:219`, que hoje protege o prompt atual | Bloqueante legal; é uma string | Muito baixo |
| 2 | **Trocar o nome do produto.** "Soulmon" é um Digimon canônico da Bandai (verbete oficial em `digimon.net`, nível Champion, tipo Ghost, ©BANDAI/©Toei) | Bloqueante legal e de ASO. Hoje custa uma tarde e zero marca perdida; com 10k instalações é reiniciar o ASO do zero | Baixo, e cresce rápido |
| 3 | Corrigir `capacitor.config.json`: `appId` (`com.digipartner.digiapp` é **imutável após o primeiro publish**), `appName`, e o `server.url` remoto — wrapper de webview é o padrão reprovado por Funcionalidade Mínima da Play | Bloqueante de loja e irreversível se publicado errado | Baixo |
| 4 | Substituir os 43 nomes/sprites de `evolution-lines.ts` e os ~50 de `LEGACY_FORM_TIERS` (inimigos da masmorra, visíveis) por conteúdo original do próprio pipeline | Bloqueante legal; a arquitetura já suporta | Médio |
| 5 | Mudar a estratégia de geração: **rookie no Oráculo, demais formas na evolução** | Corta o custo por instalação 8× e transforma cada evolução em revelação (§2.0) | Baixo |
| 6 | **Ligar a geração de sprites ao onboarding** e mostrar a criatura na tela de revelação | É o diferencial do produto, hoje desligado. Remove o `GENERIC_LINES` e o problema de PI junto | Médio |
| 7 | **Recalibrar a curva:** primeira evolução em 3 dias perfeitos, não 10. Congelar o requisito diário em 4 | Maior ganho de retenção disponível; são constantes em `progression.ts` | Muito baixo |
| 8 | Instrumentar ~20 eventos: cada etapa do Oráculo, 1ª tarefa criada, 1ª concluída, 1º dia perfeito, 1ª evolução, degeneração, retorno pós-ausência, abertura por push | Sem isso nada acima é verificável | Baixo |
| 9 | Desenhar o fluxo de retorno pós-falha e o modo pausa | O maior ponto de churn provável | Médio |
| 10 | Limpar `guidelines/*.md`, `CLAUDE.md`, `PROJETO.md`, docs e `imports/`; rotacionar a chave VAPID exposta | Bloqueante legal + segurança | Baixo |
| 11 | Contas reais + política de privacidade + exclusão de dados | Pré-requisito de loja, de monetização e de LGPD | Médio |

**Cortado desta onda, deliberadamente:** o *paywall* e a listagem de loja (não se monetiza
nem se anuncia antes de saber que retém), PvP e social real (não há backend), redesenho
visual, novos sistemas de jogo.

> **Correções que os agentes fizeram nesta lista, e eu aceitei.** Na versão da manhã eu
> cortara ASO e monetização inteiros desta onda. Estava errado nos dois casos: a troca de
> nome e o `appId` são **pré-requisitos** da limpeza de PI, não consequências dela; e o
> que deve ser adiado em monetização é o *paywall*, não a *economia unitária* — adiar o
> item 5 faz cada usuário do período de aprendizado custar 8× mais.

### Onda "Próximo" — 3 a 6 meses, guiada pelo que a telemetria mostrar

Memória persistente da criatura no chat (o vínculo hoje morre depois do nascimento) ·
Corrigir a economia para que tarefas reais gerem Bits · Revisão da escada de desbloqueio
dos sistemas de camada 3 · Escolha do modelo de monetização, provavelmente cosmético +
assinatura, nunca progresso · Compartilhamento da criatura como motor de aquisição (é o
ativo viral óbvio e não explorado) · Listagem de loja e lançamento.

### Onda "Depois"

Social e PvP com autoridade servidora · Live ops · Expansão de mercado · Cortar ou
aprofundar os sistemas de camada 3 conforme o dado.

---

## 7. Os 5 experimentos que mais reduzem incerteza pelo menor custo

1. **Teste de usabilidade moderado com 5 pessoas no Oráculo + primeiros 3 dias.** Custo
   quase zero, e responde a pergunta que nenhum código responde: a criatura gerada faz a
   pessoa dizer "essa sou eu"? Se a resposta for não, o diferencial do produto não existe
   e o roadmap muda inteiro.
2. **Recalibrar a curva para 3 dias e comparar coortes.** Depende do item 5 da onda Agora.
3. **Entrevista com 5 pessoas que abandonaram** depois do primeiro dia ruim.
4. **Fake door de assinatura** para medir disposição a pagar antes de construir paywall.
5. **Teste cego dos sprites gerados:** mostrar as formas bebê e adulta de uma mesma linha
   a pessoas de fora e perguntar se são a mesma criatura. Se a consistência entre estágios
   não se sustentar, a evolução não emociona — e isso é invisível para quem construiu.

---

## 8. Decisões que só você pode tomar

1. **Apetite de risco de PI.** Eu recomendo tolerância zero e correção antes de qualquer
   passo público. Você pode discordar; mas monetizar sobre conteúdo derivado é o cenário
   em que o custo deixa de ser remoção e passa a ser indenização.
2. **Público-alvo.** Pessoas com dificuldade executiva são o público mais provável e o
   mais mal servido do mercado — e são exatamente quem a curva atual e a punição atual
   machucam mais. Servir esse público exige um produto mais gentil do que o atual. É uma
   decisão de posicionamento, não de ajuste.
3. **Ambição.** Projeto pessoal excelente e negócio são caminhos diferentes. O segundo
   exige contas, telemetria, monetização e operação contínua — trabalho que não é o
   divertido. Vale saber qual você quer antes de gastar seis meses.
4. **O que cortar.** O produto tem mais sistemas do que evidência de que o núcleo retém.
   Minha recomendação é congelar toda a camada 3 até a telemetria mostrar que a camada 1
   funciona. Isso significa não construir nada novo e divertido por alguns meses.

---

## 9. Estado da rodada — o que existe e o que falta

### Concluído

| Relatório | Estado |
|---|---|
| `00-CONSOLIDADO.md` (este) | Completo, revisado 2026-08-03 |
| `soulmon-growth-aso.md` | Completo — nome, posicionamento, categoria, listagem pt-BR e en-US, canais |
| `soulmon-monetization-strategist.md` | Completo — modelo, preço, custo por usuário, 4 portas da loja |
| `soulmon-user-researcher.md` | **Rascunho interrompido** por limite de sessão. Contém só o Anexo A parcial — mas esse trecho traz o achado que redefiniu o veredito (§2.0). O resto está `[EM ABERTO]` |

### Ainda descoberto

- **ICP e personas** — todas as afirmações sobre "o público provável" neste documento são
  hipótese a partir do produto, não pesquisa. É a maior lacuna restante.
- **Psicologia comportamental** — a análise de punição vs. vergonha (§5) foi feita por mim
  sem a literatura; merece o agente com as fontes.
- **Monster taming** — ninguém avaliou a força do vínculo (D4) com o repertório do gênero.
- **Game design, produtividade, gamificação, design de produto, retenção, viabilidade
  técnica, companheiro de IA** — nenhum rodou.
- **Acessibilidade** — nenhuma auditoria de contraste, alvo de toque ou leitor de tela.
- **Pre-mortem do advogado do diabo.**

### Nota de método sobre a interrupção

Três agentes morreram por limite de sessão nesta rodada. Os dois primeiros não deixaram
nada; o terceiro deixou um rascunho parcial que continha o achado mais importante de toda
a revisão. A diferença foi uma instrução para gravar o arquivo cedo e enriquecê-lo
depois. **Toda rodada futura deve exigir isso de cada agente** — está registrado como
regra em `docs/squad/02-SQUAD.md`.

Rode `/revisao-soulmon` quando o limite resetar. Os 16 agentes estão em `.claude/agents/`.
</content>
