# MOBBIN-DOSSIE.md

**Levantamento de padrões de UI/UX para o redesenho do Soulmon**

- **Fonte:** Mobbin Pro via MCP (`search_screens`, `search_flows`)
- **Levantado em:** 02/09/2026
- **Plataforma buscada:** iOS (ver limites, §1)
- **Volume:** 27 buscas · ~90 achados descritos · 13 dossiês

> **Como ler este arquivo.** Ele é um levantamento, não um projeto. Descreve o que os apps
> fazem e por que funciona; a decisão é de quem tem o contexto do produto. Não há imagens,
> screenshots ou assets — só descrição estruturada + URL do Mobbin, por exigência de
> propriedade intelectual. Cada achado é classificado como **PADRÃO**, **ANTI-PADRÃO** ou
> **LIMÍTROFE**, e cada dossiê fecha com **Convergência** (o que 3+ apps fazem igual) e
> **Divergência** (onde se dividem, e qual é a escolha real por trás).

### Índice

| § | Conteúdo |
|---|---|
| **1** | Método e limites |
| **2** | Dossiê 1 — Revelação de resultado depois de quiz longo |
| **3** | Dossiê 2 — Estado de "gerando" / espera com IA |
| **4** | Dossiê 3 — Primeiro dia guiado / checklist de ativação |
| **5** | Dossiê 4 — Permissão de notificação com priming |
| **6** | Dossiê 5 — Personagem/mascote como interface |
| **7** | Dossiê 6 — Celebração de marco |
| **8** | Dossiê 7 — Coleção / dex / álbum |
| **9** | Dossiê 8 — Prestígio puramente cosmético |
| **10** | Dossiê 9 — Widget de tela inicial |
| **11** | Dossiê 10 — Retorno depois de ausência |
| **12** | Dossiê 11 — Oferta dentro do app, sem bloquear |
| **13** | Dossiê 12 — Card compartilhável de resumo |
| **14** | Dossiê 13 — Camada social |
| **15** | Adendo: fluxos, estilos visuais, e o que faz cada app único |
| **16** | Decisões tomadas e arquitetura resultante |
| **17** | Perguntas em aberto |

---

# §1 — MÉTODO E LIMITES

## O que foi feito

27 buscas no Mobbin via MCP: 25 de tela (`search_screens`, modo `deep`) e 2 de fluxo
(`search_flows`). Todas em `platform: ios`. Cada imagem retornada foi examinada — as
descrições de estrutura e as transcrições de copy vêm da leitura da tela, não do metadado.

## Limites da ferramenta — leia antes de cobrar o que falta

**1. Não existe Android.** O parâmetro `platform` do MCP aceita apenas `ios` e `web`. O
requisito de registrar diferenças relevantes entre iOS e Android **não pôde ser cumprido**.
Nenhum achado deste arquivo é Android. Onde isso mais dói: widget (§10) e diálogo de
permissão de notificação (§5).

**2. Não existe data de captura.** O MCP devolve `id`, `image_url`, `mobbin_url`,
`app_name` e `platform` — nada mais. **Não há campo de data.** O proxy disponível são as
datas impressas dentro das próprias telas, que registrei onde apareceram: Duolingo
`DEC 6, 2025`; Weverse `Feb 16, 2026`; Me+ `Mar.18,2026`; Mindvalley `05/07/2026`; Tonal
`February 2, 2026`; Noom `JUNE 2026`; Alan `Apr 20, 2026`; Reddit `29/10/24`; Runna
`09/08/2025`; Finch `Hatched on Aug 31 2025`; Paired `February 2025`; pliability
`Mar 13, 2026`; Speak `Joined Mar 5, 2026`; Shopee `08 Oct 2026`. Isso indica um acervo
capturado em 2024–2026, mas **não prova a data de nenhuma captura individual**. Onde não vi
data, escrevi `data não exposta pelo MCP`.

**3. Não existe filtro de tamanho de app.** A marcação "app pequeno" ao longo do arquivo é
estimativa do analista, não dado da ferramenta.

**4. `mobbin_url` é o link canônico da tela**, não do fluxo. Só os dossiês 1, 13 e o adendo
(§15) trazem links de flow (`/flows/...`).

**5. O acervo não captura estados transitórios.** Confirmado em dois passes: nenhum toast de
celebração, nenhuma animação de revelação, nenhum micro-feedback de conclusão de tarefa. O
Mobbin fotografa telas em repouso. **Tudo que dura menos de um segundo está fora deste
levantamento por construção** — o que inclui boa parte de um clímax de revelação.

**6. `search_flows` é o eixo mais subutilizado.** Duas chamadas produziram a descoberta mais
consequente do arquivo (a posição da entrega dentro da sequência — §15.1). Um terceiro
passe deveria ser inteiramente de fluxos: coleção (grade → item), celebração (tarefa →
conquista → coleção), retorno (abrir depois de 5 dias → o que aparece em que ordem).

## Dossiês que ficaram fracos, e por quê

| Dossiê | Estado final | Diagnóstico |
|---|---|---|
| **8 — Prestígio cosmético** | **Resolvido no 2º passe** | A busca original devolveu contador de streak em 7 de 10 telas — o mecanismo que o Soulmon proíbe. Só a ficha de gema do Opal (`Owned by 23%`) entregou prestígio sem número decrescente. **Diagnóstico de fundo, que vale mais que os achados: o mercado quase não faz prestígio sem saldo que pode zerar.** |
| **11 — Oferta sem bloquear** | **Resolvido no 2º passe** | De 20 telas nas duas buscas, **1** é oferta genuinamente dispensável (Garmin Connect). As outras 19 são paywall de tela cheia ou faixa promocional permanente. O dossiê virou majoritariamente catálogo de anti-padrões — e é assim que tem valor. |
| **6B — Toast de celebração** | **NÃO RESOLVIDO** | Dois passes, um único toast encontrado (Alma). Limite real do acervo: celebração não-bloqueante é um estado de 100–800 ms. Precisa de captura de vídeo ou observação direta do app. |
| **9 — Widget** | **MÉDIO** | O Mobbin cataloga a galeria de widget dentro do app, não o widget instalado numa home screen real. E sem Android, metade do assunto está fora. |
| **12 — Card compartilhável** | **FORTE, com viés** | Quase todo "Wrapped" do acervo é construído sobre número que cresce **e ranking percentil** (`top 8% learner`, `Top 10% Diner`). Colide com a regra de não expor comparação crua. Registrado com a colisão marcada. |
| **13 — Social** | **Aberto no 2º passe** | Dossiê inexistente no briefing original; abriu quando a camada social foi confirmada. A primeira busca retornou só 6 resultados — o acervo é raso nesta frente para apps de hábito. |

## Correções ao longo do levantamento

| O que foi afirmado | Correção |
|---|---|
| "A tela de detalhe de um item da coleção não existe no Mobbin" | **Errado.** Existe e é excelente (Finch, Opal, Tolan) — §8 e §15.3. A primeira query buscava a grade, não o item |
| "Dossiê 8 é fraco, só 2 achados" | **Parcialmente errado.** A ficha do Opal resolve o dossiê |
| "Quase nenhum app resolve social sem comparação" | **Meio errado.** Finch resolve, por subtração — a tela de amigos não tem um número |

## O que não está aqui, por regra

Nenhuma imagem, screenshot, asset ou trecho de arte. Só descrição estruturada + URL do
Mobbin. Nada foi commitado, salvo em repositório, publicado ou enviado para fora da sessão
de levantamento.

---

# §2 — DOSSIÊ 1: REVELAÇÃO DE RESULTADO DEPOIS DE QUIZ LONGO

> O clímax do Soulmon hoje é só texto — é o problema mais caro do produto. Este dossiê é o
> mais denso do arquivo de propósito.

### Tolan — Leitura de personalidade paginada, com a criatura como âncora
- **Plataforma / data:** iOS · data não exposta pelo MCP; a tela traz a etiqueta `Nov 3` no bloco "Your Unique Voice"
- **URL Mobbin:** https://mobbin.com/screens/3050f6cb-64f0-48e0-a01e-4b20f5939616
- **O padrão em uma frase:** o resultado não é uma tela, é um **documento de várias páginas** com barra de progresso própria, aberto pela identidade da criatura.
- **Estrutura da tela, de cima para baixo:**
  1. Rótulo pequeno em caixa alta espaçada, canto superior esquerdo: `PERSONALITY READING`
  2. **Barra de progresso horizontal com selo circular "2"** no início dela — o resultado é longo e a pessoa sabe em que página está
  3. Botão `×` circular no canto superior direito (a saída existe e é óbvia)
  4. **Miniatura quadrada da arte da criatura**, ~64px, cantos arredondados, à esquerda
  5. Ao lado dela, empilhados: **nome próprio em serifada grande** (`Alex`) e, abaixo, **o epíteto em serifada média em cinza** (`The Bookwise Meadow`)
  6. Parágrafo corrido em serifada, ~5 linhas, alto conforto de leitura
  7. Subtítulo `Your Unique Voice` com pílula de data (`Nov 3`) alinhada à direita
  8. Micro-rótulo `Your communication style in one word` + a palavra isolada (`Attunement`)
  9. Novo parágrafo, cortado pelo scroll
- **Copy literal:** "PERSONALITY READING" · "Alex" · "The Bookwise Meadow" · "You refill your spirit through pages and ideas, following curiosity wherever it leads. Quiet yet steadfast, you gather understanding patiently and share it generously, making conversation softer and minds a little brighter." · "Your Unique Voice" · "Nov 3" · "Your communication style in one word" · "Attunement" · "You speak like someone who reads the room the way you read a good novel—attentively, then with a well-placed line. Your humor arrives dry and late enough to sparkle, often via a single precise phrase rather than a story. You ask small," *(cortado pelo scroll)*
- **O mecanismo:** três coisas operando juntas. (a) **Efeito Barnum administrado com especificidade** — o texto é lisonjeiro e genérico o suficiente para caber em quase qualquer pessoa, mas usa detalhe concreto ("dry and late enough to sparkle") que compra credibilidade; (b) **nomear é possuir** — o epíteto transforma um resultado em um *título* que a pessoa pode carregar; (c) a **paginação converte o clímax em consumo**: em vez de um único disparo de dopamina, há uma série, e a barra de progresso cria compromisso de conclusão (Zeigarnik).
- **Variação entre apps:** é o único do dossiê que trata o resultado como **acervo navegável** em vez de tela terminal. Todos os outros entregam um bloco e um botão.
- **Quando falha / risco:** texto gerado longo é onde a IA erra de forma mais visível. Uma frase fora de tom em 5 parágrafos contamina a leitura toda. E paginar exige ter conteúdo real para todas as páginas — página fraca no meio derruba a percepção de que o resultado é "sobre mim".
- **Classificação:** PADRÃO

### Noom — Rótulo comportamental + ponte explícita para o próximo passo
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/bf09eeb9-451b-4215-936e-7e353498b988
- **O padrão em uma frase:** o resultado é **um substantivo composto** que a pessoa passa a ser, e a tela já anuncia que ele vai ser usado adiante.
- **Estrutura da tela, de cima para baixo:**
  1. Barra de navegação: seta `←`, logotipo `NOOM` centralizado, avatar do usuário à direita
  2. **Círculo grande em rosa-claro** (~120px) com ilustração de linha de documentos
  3. Rótulo em caixa alta pequena: `YOUR BEHAVIORAL PROFILE`
  4. **O nome do arquétipo em serifada grande, branco sobre teal:** `Structure Seeker`
  5. Parágrafo de 3 linhas, centralizado, peso leve
  6. **Subtítulo `Next steps` em serifada média** — segunda seção na mesma tela
  7. Parágrafo de 2 linhas explicando o que será feito com esse perfil
  8. Botão coral de largura total, canto totalmente arredondado: `Next`
  9. Fundo teal sólido, sem imagem — a tela toda é tipografia
- **Copy literal:** "YOUR BEHAVIORAL PROFILE" · "Structure Seeker" · "You're ready to get with the program. Hungry for innovation and invigoration—you will succeed in a new, promising environment." · "Next steps" · "We'll build on your behavioral profile by understanding what a happy weight might look like for you." · "Next"
- **O mecanismo:** **rotulagem** (labeling) — dar à pessoa uma identidade nomeada aumenta a probabilidade de ela agir consistentemente com esse rótulo. E o bloco `Next steps` faz algo que quase ninguém faz: **prova que a resposta será usada**, o que retroativamente justifica o custo das perguntas ("meu esforço não foi desperdiçado").
- **Variação entre apps:** único que **antecipa o uso futuro do resultado na própria tela de revelação**. É a defesa mais direta contra a sensação de "respondi 20 perguntas para receber um parágrafo".
- **Quando falha / risco:** se o app depois **não** usar visivelmente o perfil, a promessa vira dívida e a confiança cai mais do que se nunca tivesse prometido.
- **Classificação:** PADRÃO

### Lovi — Contagem numérica como revelação (o número é o clímax)
- **Plataforma / data:** iOS · data não exposta pelo MCP · *app pequeno (skincare)*
- **URL Mobbin:** https://mobbin.com/screens/53ddcdcc-dca1-4368-8fbc-dd57136a951e
- **O padrão em uma frase:** o resultado é encenado como **um número grande que emerge de um campo de partículas**, com a frase quebrada em torno dele.
- **Estrutura da tela, de cima para baixo:**
  1. Linha de status; frase de moldura no topo em peso leve: "Your personal skincare program is ready!"
  2. **Campo de gradiente verde→azul ocupando toda a tela** (sem card, sem container)
  3. **Cluster de ~9 pontos brancos luminosos** no terço superior — leitura de "itens considerados", não de decoração
  4. **O numeral `8` em display enorme**, branco, centralizado
  5. Frase envolvendo o número, com **os termos personalizados em azul-ciano** (`you`, `post-acne spots`) contra o resto em branco
  6. Botão branco pílula de largura total: `Show My New Routine`
- **Copy literal:** "Your personal skincare program is ready!" · "8" · "out of them are the most effective choice for **you** in targeting **post-acne spots**" · "Show My New Routine"
- **O mecanismo:** **destaque cromático do dado pessoal** dentro da frase. Colorir exatamente as duas expressões que vieram do quiz é a forma mais barata de dizer *"isto foi calculado a partir das suas respostas"* — funciona sem citar as respostas literalmente. E o número grande dá ao resultado uma métrica, não só uma adjetivação.
- **Variação entre apps:** é o único que **usa cor como marcador de personalização** dentro do corpo de texto. Os outros dependem do leitor acreditar.
- **Quando falha / risco:** o número precisa ser verdadeiro e reconstruível. Se a pessoa contar os itens e não der 8, a mecânica desmonta. E número grande puxa a atenção para longe do texto — se o texto é o valor, o número o canibaliza.
- **Classificação:** PADRÃO

### Life Reset — Resultado como planilha de atributos iniciais de RPG
- **Plataforma / data:** iOS · data não exposta pelo MCP · *app pequeno*
- **URL Mobbin:** https://mobbin.com/screens/8600662f-2438-4b13-b61f-144401e944a5
- **O padrão em uma frase:** o quiz sai como **ficha de personagem** — cinco atributos com valor numérico e o anúncio de que a pessoa não começa do zero.
- **Estrutura da tela, de cima para baixo:**
  1. Seta `‹` em botão circular escuro; barra de progresso branca (~70% preenchida)
  2. **Manchete em duas cores:** texto branco com `Day 4` e `Level 5` em laranja
  3. Rótulo em caixa alta cinza: `YOUR INITIAL RATINGS`
  4. **Cinco linhas-cartão de altura igual**, cada uma com gradiente escuro de cor própria: ícone à esquerda → nome do atributo em caixa alta → **número em display grande à direita**
     - `WISDOM 65` (roxo) · `CONFIDENCE 62` (verde) · `STRENGTH 65` (vermelho) · `DISCIPLINE 63` (azul) · `FOCUS 60` (teal)
  5. Nota de rodapé em cinza pequeno, 2 linhas, com a saída para reiniciar
  6. Botão laranja pílula de largura total: `Let's do it`
- **Copy literal:** "Based on your current program, you will start on **Day 4** and **Level 5.**" · "YOUR INITIAL RATINGS" · "WISDOM 65" · "CONFIDENCE 62" · "STRENGTH 65" · "DISCIPLINE 63" · "FOCUS 60" · "If you wish to start from Day 1, you can restart your program in Settings then activate character mode." · "Let's do it"
- **O mecanismo:** **dotação de progresso** (endowed progress). Começar em "Day 4, Level 5" em vez de zero transforma a pessoa em alguém que já está no meio de algo — e abandonar algo em andamento custa mais do que não começar. Os cinco números fazem o resultado parecer *medido*, não opinado.
- **Variação entre apps:** o único que **converte respostas em vetor multidimensional visível**, e o único que oferece **a saída para recomeçar do zero** na própria revelação.
- **Quando falha / risco:** **números expostos que podem descer.** Um app que mostra `FOCUS 60` está prometendo mostrar `FOCUS 54` algum dia. Colisão frontal com "nenhum número exposto diminui" — a **forma** é aproveitável, a **mutabilidade** não.
- **Classificação:** LIMÍTROFE

### Headway — Revelação em dois tempos (porta antes do conteúdo)
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/80bbc82f-f6f0-40e5-b46e-60c2cdc32b84
- **O padrão em uma frase:** uma tela inteira **só para anunciar que o resultado existe**, antes de mostrá-lo.
- **Estrutura da tela, de cima para baixo:**
  1. `×` no canto superior esquerdo
  2. **Ilustração de mascote (cérebro rosa antropomórfico)** cercado por formas geométricas com carinhas — cada forma é um "tipo de inteligência", ou seja, a ilustração *é* a prévia do conteúdo
  3. **Manchete sans-serif em bold pesado, duas linhas, alinhada à esquerda:** "Yay, full results are unlocked!"
  4. Parágrafo de apoio, 2 linhas, cinza
  5. **Vazio deliberado** — quase metade inferior da tela é branco
  6. Botão azul de largura total, canto ~12px: `See full results`
- **Copy literal:** "Yay, full results are unlocked!" · "Now it's time to explore your intelligence types altogether to see the big picture. Go for it!" · "See full results"
- **O mecanismo:** **construção de antecipação por interstício**. Inserir uma tela entre o fim do quiz e o resultado alonga o momento e faz o resultado parecer conquistado. A palavra `unlocked` é o trabalho pesado: recodifica "você terminou de responder" como "você ganhou acesso".
- **Variação entre apps:** o único que **gasta uma tela inteira sem entregar conteúdo**. É teatro puro — e o único a usar `unlocked` como verbo do momento.
- **Quando falha / risco:** é uma fricção que só se paga se o que vem depois for substancioso. Se o resultado seguinte for um parágrafo, esta tela vira pedágio e a decepção fica maior. **Este é exatamente o risco do Soulmon hoje.**
- **Classificação:** PADRÃO

### Replika — A silhueta, e o pedágio no clímax
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin (flow de onboarding, 10 telas):** https://mobbin.com/flows/19470dcc-dbd6-48ae-a945-f708e3a1b3d2
- **URL Mobbin (flow de criação, 12 telas):** https://mobbin.com/flows/381cc18a-e9aa-41b4-8e68-bdf807f772a5
- **O padrão em uma frase:** o quiz termina numa **silhueta escura da criatura contra gradiente** — e a silhueta só se resolve depois do paywall.
- **Estrutura da tela de revelação, de cima para baixo:**
  1. `×` no canto superior direito
  2. **Silhueta em contraluz do personagem** ocupando o terço superior — forma e cabelo legíveis, rosto e detalhes não. O gradiente roxo→azul faz o recorte
  3. Manchete centralizada, sans bold: "Your personalized Replika is ready"
  4. **Card de plano com borda destacada:** `Platinum` / `Annual $89.99` à esquerda, `$7.50 per month` em pílula à direita
  5. Micro-copy central: `Cancel anytime`
  6. Botão branco pílula de largura total: `Continue`
  7. Link secundário sublinhado: `Other options`
  8. Rodapé legal em três colunas: `Terms` · `Restore purchases` · `Privacy`
- **Copy literal:** "Your personalized Replika is ready" · "Platinum" · "Annual $89.99" · "$7.50 per month" · "Cancel anytime" · "Continue" · "Other options" · "Terms" · "Restore purchases" · "Privacy"
- **Copy do quiz que alimenta o resultado (mesmo flow):** "Do you agree with the statement below?" → "I sometimes wish I had more meaningful connections in my life" → botões `NO` / `YES`. E: "Your pronouns" → "We need to know that to ensure the proper content generation." → `She / Her` · `He / Him` · `They / Them`
- **O mecanismo — e é duplo:**
  - **A técnica da silhueta funciona.** Fechamento gestáltico: o cérebro completa a forma parcialmente ocluída, e completar sozinho gera mais investimento do que receber pronto. É a solução mais forte que o Mobbin oferece para "como encenar uma revelação de criatura".
  - **A colocação do paywall é predatória.** Está no pico de investimento — depois de o usuário ter respondido item psicométrico íntimo, e no instante em que a criatura existe mas não pode ser vista. É custo irrecuperável sendo colhido com a máxima alavancagem emocional possível.
- **Variação entre apps:** é o único do acervo que **cobra na revelação**.
- **Quando falha / risco:** para o Soulmon isto é a linha vermelha. A silhueta é aproveitável; o pedágio atrás dela é o oposto da tese. **A técnica é PADRÃO, a colocação é ANTI-PADRÃO** — e é por serem separáveis que este achado vale.
- **Classificação:** LIMÍTROFE *(silhueta: PADRÃO · paywall no clímax: ANTI-PADRÃO)*

### Speak — Devolver a resposta bruta antes de entregar o resultado
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/f9aa3796-47d7-456f-93c9-30acff81da86
- **O padrão em uma frase:** o app **transcreve de volta o que ouviu** e deixa a pessoa corrigir antes de gerar qualquer coisa.
- **Estrutura da tela, de cima para baixo:**
  1. Manchete em bold pesado, duas linhas: "Let's create your personalized lessons!"
  2. **Mascote azul (forma arredondada, dois olhos) espiando por trás do card** — só a metade superior aparece, o card oclui o resto
  3. **Card branco de cantos generosos** com: micro-rótulo cinza `What I heard` no topo → parágrafo em primeira pessoa com o conteúdo da resposta → **rodapé do card com ícone de reciclagem + `Tap to start over`**
  4. Botão azul pílula de largura total: `Let's go!`
  5. Link de texto azul, centralizado, abaixo: `Delete my answers`
- **Copy literal:** "Let's create your personalized lessons!" · "What I heard" · "You like to order a croissant as your favorite type of pastry at a café, and you would enjoy having a caffé au lait to drink with your meal." · "Tap to start over" · "Let's go!" · "Delete my answers"
- **O mecanismo:** **prova de escuta.** Ao reproduzir literalmente a entrada antes de gerar, o app resolve o problema mais crítico do resultado personalizado — a suspeita de que as respostas não foram usadas. E o par `Tap to start over` / `Delete my answers` entrega **controle e reversibilidade** no momento exato em que a pessoa acabou de entregar dado pessoal, o que reduz reatância.
- **Variação entre apps:** único do dossiê com **saída de dados explícita** na tela de resultado. Para um app que coleta 20 itens psicométricos + data e hora de nascimento, isto não é detalhe de UX — é postura.
- **Quando falha / risco:** transcrição errada é pior que ausente: exibe o erro do sistema no momento de maior atenção. Exige a saída de correção para funcionar.
- **Classificação:** PADRÃO

### Tock — Resultado segmentado por dimensão, em lista rolável
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/77785fb3-7e7f-4ff2-aaad-0dab15c84f36
- **O padrão em uma frase:** o resultado é **uma pilha de sub-resultados**, cada um com ilustração própria, dentro de uma folha modal.
- **Estrutura da tela, de cima para baixo:**
  1. Barra de folha modal: `Done` à esquerda, título `Profile` centralizado
  2. Sub-barra: `Your culinary personality` à esquerda, `×` à direita
  3. **Manchete em duas linhas, serifada, centralizada:** "Your results are in! You'll be right at home on Tock."
  4. **Bloco 1:** ilustração de linha circular → título do arquétipo (`Adventurous`) → parágrafo de 3 linhas
  5. **Bloco 2:** ilustração de linha (copo de vinho) → título (`Drink Preferences`) → texto cortado pelo scroll
  6. Barra de ações inferior fixa: botão outline `‹ Back` + botão azul sólido `Done`
  7. Paginação `‹ ›` abaixo, indicando irmãos horizontais
- **Copy literal:** "Your culinary personality" · "Your results are in! You'll be right at home on Tock." · "Adventurous" · "As an adventurous diner, you like to eat to challenge yourself culturally. You enjoy seeking out new cuisines, rising chefs, and visiting pop-ups." · "Drink Preferences" · "Wine, Cocktails & B..." *(cortado)* · "Back" · "Done"
- **O mecanismo:** **segmentação em dimensões** faz o resultado parecer analítico em vez de horoscópico. Múltiplos eixos = mais superfície de reconhecimento; a chance de a pessoa achar *pelo menos um* bloco certeiro sobe, e um acerto salva a leitura toda.
- **Variação entre apps:** o único que trata a revelação como **folha modal dentro do app**. Comunica "isto é uma configuração revisável", não "este é o seu destino" — o oposto do enquadramento do Soulmon (criatura insubstituível).
- **Quando falha / risco:** enquadrar como configuração **mata a sacralidade**. Para uma criatura única e insubstituível, folha modal com `Done` é o container errado, mesmo com o conteúdo certo.
- **Classificação:** LIMÍTROFE

### MyFitnessPal — Resultado numérico + consentimentos empilhados no mesmo lugar
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/cc3afa32-4262-4b9d-b3c2-f898b59ac935
- **O padrão em uma frase:** o número calculado divide a tela com **três checkboxes pré-marcados** de permissão e marketing.
- **Estrutura da tela, de cima para baixo:**
  1. Título de barra: `Account Created`
  2. Manchete bold: "Congratulations, Alex!"
  3. Parágrafo de 2 linhas ligando o resultado ao objetivo
  4. Linha de rótulo: "Your daily net calorie goal is:"
  5. **`2,930` em display verde grande**, com uma caixa de rótulo cinza `Calories` ao lado
  6. Linha de reforço + **link azul com a projeção datada**: `1.2 kg by April 8`
  7. Link cinza com ícone de info: `How we make recommendations`
  8. Régua divisória
  9. **Três linhas com checkbox azul circular JÁ MARCADO:** reminders, passos, e-mails
  10. Botão azul de largura total: `Next`
- **Copy literal:** "Congratulations, Alex!" · "Your custom plan is ready and you're one step closer to your goal weight." · "Your daily net calorie goal is:" · "2,930" · "Calories" · "This can help you gain:" · "1.2 kg by April 8" · "How we make recommendations" · "Keep me on track with reminders." · "Use my phone to track my steps" · "Would you like to receive our emails?" · "Next"
- **O mecanismo:** o link `How we make recommendations` é a peça boa — **transparência de método sob demanda**, sem custo para quem não quer. Já os três checkboxes pré-marcados são **opt-out disfarçado de opt-in**, colocados no momento de euforia justamente porque a atenção crítica está baixa. O terceiro é uma *pergunta* já respondida com sim pelo app — consentimento fabricado.
- **Variação entre apps:** o único que **usa o clímax como veículo de captura de permissão**. Contra-exemplo perfeito do dossiê 4.
- **Quando falha / risco:** para um app cuja tese é "encoraja, nunca cobra", carregar a tela de nascimento da criatura com consentimento pré-marcado é destruir a intenção do momento por 3 pontos de opt-in. E é passivo de LGPD.
- **Classificação:** ANTI-PADRÃO *(o link de método, isolado: PADRÃO)*

### Fi — O resultado é um objeto colecionável já formatado
- **Plataforma / data:** iOS · data não exposta pelo MCP · *app pequeno (coleira de cão)*
- **URL Mobbin:** https://mobbin.com/screens/2d26ebcc-47b6-419b-8751-edbe13c3c10a
- **O padrão em uma frase:** o resultado sai já **encapsulado como card de perfil reutilizável**, não como texto de tela.
- **Estrutura da tela, de cima para baixo:**
  1. Seta `←` circular; título `Profile Setup`
  2. **Card fotográfico grande de cantos arredondados** ocupando o terço superior:
     - Sobreposto no topo esquerdo: **nome em bold branco grande** (`Tilda`) + handle em cinza (`@tildagirl`)
     - Sobreposto na base esquerda: **três linhas de atributo, cada uma com um `✓`**: `Scottish Fold` · `Age: 3 yr 4 mo` · `Female | 10 lb`
  3. Manchete bold abaixo do card: "Welcome to Fi, Tilda!"
  4. Linha de confirmação em cinza
  5. Botão preto pílula de largura total: `Next`
- **Copy literal:** "Profile Setup" · "Tilda" · "@tildagirl" · "✓ Scottish Fold" · "✓ Age: 3 yr 4 mo" · "✓ Female | 10 lb" · "Welcome to Fi, Tilda!" · "Your profile has been successfully created." · "Next"
- **O mecanismo:** **o resultado como artefato, não como mensagem.** O card é uma unidade visual autocontida que pode reaparecer no perfil, na coleção e no compartilhamento. Isso faz o momento render depois — e os `✓` transformam os atributos em "verificados", o que dá peso factual a dado autodeclarado.
- **Variação entre apps:** único que **entrega o resultado num container reutilizável**. Todos os outros produzem uma tela que só existe uma vez.
- **Quando falha / risco:** card só funciona com arte de qualidade consistente. Se a criatura gerada por IA variar de enquadramento, o mesmo template produz resultados ora bonitos, ora quebrados. Exige controle de composição na geração.
- **Classificação:** PADRÃO

### Convergência e divergência — Dossiê 1

- **Convergência (5+ apps):** **todos** nomeiam o resultado com um substantivo próprio ou arquétipo antes de explicá-lo — `Structure Seeker`, `The Bookwise Meadow`, `Adventurous`, `Level 5`, `Tilda`. **O nome vem antes do texto, sempre.** E **7 de 10** usam exatamente um botão primário de largura total, sem escolha competindo: o clímax nunca é um garfo de decisão.
- **Divergência — e qual é a escolha real:** a divisão é entre **entregar o resultado imediatamente** (Noom, Lovi, Life Reset, Fi) e **encenar a espera** (Headway com "unlocked", Replika com a silhueta, Tolan com a paginação). A escolha real não é de gosto: **é sobre quanto conteúdo você tem.** Encenação alonga o momento e o torna memorável, mas cobra um cheque que o conteúdo seguinte precisa cobrir. Entrega direta é honesta e à prova de decepção, mas desperdiça o único instante do produto em que a atenção está no máximo. Quem tem resultado raso deve entregar direto; quem tem resultado denso deve encenar. **Encenar um resultado raso é o pior dos quatro quadrantes — e é onde o Soulmon está hoje.**

---

# §3 — DOSSIÊ 2: ESTADO DE "GERANDO" / ESPERA COM IA

### Finch — A criatura como o próprio indicador de progresso
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/7719c649-c2b1-4ad7-aca6-1a232ba78c7d
- **O padrão em uma frase:** o **anel de progresso circula o pet**, e a espera passa a ser sobre ele, não sobre o sistema.
- **Estrutura da tela, de cima para baixo:**
  1. Tela inteiramente branca, sem barra de navegação, sem botão de cancelar
  2. **Anel circular grande (~180px) centralizado no terço superior**: trilha em cinza muito claro, arco preenchido em verde cobrindo cerca de 1/4 da volta
  3. **O pet (Lee) desenhado dentro do anel**, pequeno, com sombra elíptica sob os pés
  4. Abaixo do anel, **texto em bold de duas linhas centralizadas** nomeando o pet
  5. Resto da tela: vazio
- **Copy literal:** "Generating your self-care goals with Lee..."
- **O mecanismo:** **atribuição de agência ao personagem.** "com Lee" reescreve a espera de "o servidor está processando" para "meu companheiro está trabalhando junto comigo" — espera atribuída a um agente com quem existe vínculo é sentida como mais curta e menos irritante que espera atribuída a máquina. E o anel envolvendo o pet resolve o problema de composição: um só elemento carrega progresso e identidade.
- **Variação entre apps:** é o único do dossiê onde **o indicador de progresso e o personagem são o mesmo objeto visual**.
- **Quando falha / risco:** anel parcialmente preenchido **promete progresso determinado**. Se o arco travar em 25% por 20 segundos, o dano à confiança é maior que o de um spinner indeterminado — porque o spinner não fez promessa. Só use arco se você tiver etapas reais para reportar.
- **Classificação:** PADRÃO

### GoFundMe — Skeleton do resultado real + slot educativo
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/dcc555fc-4e3d-4bce-a4e6-36ce91de6dc5
- **O padrão em uma frase:** durante a geração, a tela mostra **o esqueleto da coisa que está sendo gerada**, e usa o tempo morto para ensinar algo útil.
- **Estrutura da tela, de cima para baixo:**
  1. Fundo verde-escuro sólido
  2. Marca circular pequena (rosto estilizado) centralizada
  3. Manchete parcialmente esmaecida *(ilegível na captura)*, com a linha visível abaixo
  4. **Barra de progresso horizontal fina** com trecho verde-claro cobrindo ~35%
  5. **Bloco skeleton extenso:** ~12 linhas de placeholder em verde mais claro, de **larguras variadas**, agrupadas em dois parágrafos com espaço entre eles — desenha a silhueta de um texto real, não um retângulo cinza
  6. **Card branco sobreposto na parte inferior**, cantos arredondados: título em bold `Did you know?` + duas linhas de dado
- **Copy literal:** "This may take a few moments." · "Did you know?" · "Fundraisers shared on the first day are 3x more likely to receive donations." · *(manchete principal: ilegível)*
- **O mecanismo:** (a) O **skeleton com larguras variadas prefigura a forma do resultado** — a pessoa começa a modelar mentalmente o que vem, o que encurta a percepção de espera; (b) o card `Did you know?` faz **preenchimento ativo de tempo**: uma espera com conteúdo é sentida como mais curta que uma espera vazia de igual duração, e aqui o conteúdo ainda por cima aumenta a chance de sucesso da ação seguinte.
- **Variação entre apps:** o único que combina **skeleton fiel à forma final + conteúdo útil**.
- **Quando falha / risco:** se a geração falhar, o skeleton já criou a expectativa da forma — a frustração é proporcional ao detalhe do skeleton. E o slot educativo precisa de estoque real de fatos, senão vira repetição visível em poucos usos.
- **Classificação:** PADRÃO

### Canva — Repetir a prompt de volta durante a espera
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/2dcf4365-b705-4546-a5f0-e62c7085798e
- **O padrão em uma frase:** a espera exibe **a prompt do usuário entre aspas**, com uma linha que humaniza o esforço da máquina.
- **Estrutura da tela, de cima para baixo:**
  1. Folha modal: título `Magic Media` à esquerda, ícone `ⓘ` à direita
  2. **Placeholder quadrado grande com gradiente lavanda animado** (proporção 1:1) — ocupa a área exata onde a imagem vai aparecer; seta `›` na borda direita indica carrossel
  3. **Parágrafo centralizado de 3 linhas**, com a prompt do usuário **em bold entre aspas curvas** dentro do texto corrido
  4. **Barra de progresso horizontal com gradiente azul→roxo**, ~85% preenchida
  5. **Botão `Cancel` em outline, largura total** — a saída existe e é primária
  6. Barra de ferramentas do app permanece visível na base (a espera não toma a tela)
- **Copy literal:** "Magic Media" · "It's hard work transforming those images from your head! Wait with us while we generate "Delicious, layered, moist, indulgent chocolate cake with fall decorations"" · "Cancel"
- **O mecanismo:** **eco da prompt** faz duas coisas — confirma que o pedido chegou íntegro e permite detectar erro de digitação antes de gastar o resultado. E "It's hard work" + "Wait **with us**" reconhece o custo e enquadra a espera como **colaboração**, não como fila. O `Cancel` em largura total é a decisão mais respeitosa do dossiê: o app assume que desistir é legítimo.
- **Variação entre apps:** o único que mantém a **navegação do app viva durante a geração** e o único com botão de cancelar de largura total.
- **Quando falha / risco:** eco de prompt só serve quando existe prompt textual. No Soulmon, o "input" são 6 perguntas + 20 itens + data de nascimento — o eco teria de ser uma síntese, não uma citação, e sintetizar mal é pior que não ecoar (ver Speak, dossiê 1).
- **Classificação:** PADRÃO

### Google Photos — Declarar a duração e admitir a incerteza do resultado
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/521471b1-b147-44f7-9796-90ee9de25fa6
- **O padrão em uma frase:** dá **um número de tempo** e, no subtítulo do cabeçalho, **avisa que o resultado pode não prestar**.
- **Estrutura da tela, de cima para baixo:**
  1. Seta `←`; título `Me Meme` com **subtítulo em cinza: `Results may be unexpected`**
  2. Fundo em gradiente branco→azul muito claro
  3. **Forma abstrata roxa (dois lóbulos arredondados)** centralizada no terço superior — marca de "IA", sem antropomorfismo
  4. **Barra de progresso horizontal fina, cinza, quase vazia**, com um trecho um pouco mais escuro na esquerda
  5. Grande vazio
  6. **`Generating...` em display grande**, centralizado, no terço inferior
  7. Abaixo, em cinza pequeno: `This may take about a minute.`
- **Copy literal:** "Me Meme" · "Results may be unexpected" · "Generating..." · "This may take about a minute."
- **O mecanismo:** **calibração de expectativa em dois eixos** — tempo ("about a minute") e qualidade ("Results may be unexpected"). Declarar a incerteza *antes* converte um resultado ruim de falha do produto em variação anunciada. É a defesa mais barata que existe contra decepção com output generativo.
- **Variação entre apps:** único do dossiê que **declara duração estimada em texto** e único que **pré-desculpa a qualidade**.
- **Quando falha / risco:** "about a minute" é uma promessa auditável — estourar erode confiança. E `Results may be unexpected` num produto onde a criatura é **única e insubstituível** pode ler como "você pode ficar com uma criatura ruim para sempre", o que é pior que não dizer nada. **O aviso serve para output descartável; num output permanente ele assusta.**
- **Classificação:** LIMÍTROFE

### Any Distance — Espera como convite social
- **Plataforma / data:** iOS · data não exposta pelo MCP · *app pequeno*
- **URL Mobbin:** https://mobbin.com/screens/6cf1fe28-15bf-4f5e-b1d8-b96a9503a884
- **O padrão em uma frase:** o tempo de geração é vendido para **aquisição** — a tela preenche a espera com pedido de menção e follow.
- **Estrutura da tela, de cima para baixo:**
  1. `Cancel` em texto azul, canto superior esquerdo
  2. Fundo preto quase total
  3. Centro vertical: **manchete bold `Generating your visuals`**
  4. **Barra de progresso horizontal fina em âmbar**, ~30%
  5. Imediatamente abaixo: `Tag @anydistance to get featured!`
  6. Forma esmaecida ao fundo (prévia do asset se formando)
  7. **Rodapé com dois ícones grandes e nus (Instagram, Twitter)**, sem caixa nem moldura em volta — ícone pelado
  8. `Join the community` em bold + hashtag `#AnyDistanceCounts` em cinza
- **Copy literal:** "Cancel" · "Generating your visuals" · "Tag @anydistance to get featured!" · "Join the community" · "#AnyDistanceCounts"
- **O mecanismo:** o tempo de espera é **atenção cativa e barata** — a pessoa não pode fazer mais nada. Deslocar um pedido de baixa fricção (seguir, marcar) para esse slot custa quase nada em experiência. `to get featured` oferece contrapartida em vez de apelar.
- **Variação entre apps:** o único que **monetiza a espera em distribuição**. Vale também como referência de **ícone sem caixa** — a execução mais limpa disso no arquivo inteiro.
- **Quando falha / risco:** pedir algo antes de entregar o valor inverte a ordem da reciprocidade — a pessoa ainda não recebeu nada. Se a geração falhar depois do pedido de follow, a leitura é de exploração.
- **Classificação:** LIMÍTROFE

### WhatsApp — O contra-exemplo: espera com botão morto
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/3350657d-66fc-4087-b454-3002786bee52
- **O padrão em uma frase:** progresso de etapa no topo, e a espera acontece **dentro do botão de avançar**, deixando a tela quase toda em branco.
- **Estrutura da tela, de cima para baixo:**
  1. Seta `‹`, título `Create an AI` e **subtítulo `Step 2 of 5`**
  2. **Barra de progresso de etapa** (verde, ~40%) logo abaixo do cabeçalho
  3. Manchete centralizada, peso médio: `Generating your AI's image...`
  4. **Corpo da tela vazio**, com um pequeno cluster de formas geométricas cinza no meio
  5. Na base: **botão de largura total em verde dessaturado com um spinner minúsculo dentro** — o botão está desabilitado e serve de indicador
- **Copy literal:** "Create an AI" · "Step 2 of 5" · "Generating your AI's image..." · *(botão: sem rótulo, só spinner)*
- **O mecanismo:** o `Step 2 of 5` é a única parte boa — **situa a espera dentro de um processo finito**, o que reduz ansiedade. O resto é o contra-exemplo: sem estimativa de tempo, sem cancelar, sem prévia, sem preenchimento, e com o indicador de atividade escondido num botão desabilitado na base — o ponto de menor saliência visual da tela.
- **Variação entre apps:** o único que **usa o botão primário desabilitado como spinner** e o único com contador de etapa explícito.
- **Quando falha / risco:** falha em espera longa. Sem cancelar e sem estimativa, a única ação disponível para a pessoa impaciente é matar o app — e nesse caso o estado intermediário provavelmente se perde.
- **Classificação:** ANTI-PADRÃO *(o `Step 2 of 5`, isolado: PADRÃO)*

### Snapchat / Beside / Character AI — A família do "orbe brilhante"
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URLs Mobbin:**
  - Snapchat: https://mobbin.com/screens/38af3016-6f38-4358-b34f-463138c43c85
  - Beside: https://mobbin.com/screens/5154fee2-6423-4cc8-931b-beb1579a788c
  - Character AI: https://mobbin.com/screens/c6ae55b8-fa07-4b91-9d6d-1890f75ffba1
- **O padrão em uma frase:** fundo escuro + **um objeto luminoso centralizado** + uma linha de texto — o vocabulário visual padrão de "IA trabalhando", sem qualquer progresso real.
- **Estrutura da tela (comum aos três), de cima para baixo:**
  1. Cabeçalho mínimo com seta de volta e título (`Dreams` · `Clone Voice` · `Generating Voice...`)
  2. **Fundo escuro com gradiente radial que emana do centro** — roxo (Snapchat), cinza neutro (Beside), azul-noite com pontos de estrela (Character AI)
  3. **O objeto central:** anel com ícone de brilhos (Snapchat) · esfera amarela dentro de um anel pontilhado (Beside) · **barra de equalizador de ~24 hastes verticais brancas** sobre um diagrama de constelação (Character AI)
  4. **Uma linha de texto** abaixo ou acima do objeto
  5. Linha secundária de conforto, em cinza (Beside, Character AI)
  6. Nada mais. Sem barra de progresso, sem cancelar, sem estimativa
- **Copy literal:** Snapchat: "Dreams" · "Generating Dreams with AI..." — Beside: "Clone Voice" · "Your AI voice clone is being created" · "Please wait, won't take long" — Character AI: "Generating Voice..." · "This may take a few seconds"
- **O mecanismo:** **teatro de progresso puro.** O gradiente radial pulsante sinaliza "atividade" sem afirmar quantidade — o que é, paradoxalmente, mais honesto que uma barra falsa, porque não faz promessa auditável. A escolha de Character AI é a melhor das três: a **forma de onda** liga visualmente ao domínio (voz), o que faz a animação parecer derivada do trabalho real em vez de decoração.
- **Variação entre apps:** Beside e Character AI **verbalizam a duração** ("won't take long", "a few seconds"); Snapchat não diz nada. Character AI é o único cujo motion tem relação semântica com o que está sendo gerado.
- **Quando falha / risco:** indeterminado sem cancelar é aceitável em 3 segundos e intolerável em 30. Nenhum dos três tem plano para o caso longo.
- **Classificação:** PADRÃO *(Snapchat, sem estimativa e sem saída: LIMÍTROFE)*

### O caminho de erro — o que o dossiê 2 NÃO tem, e o que existe no lugar

**Nenhuma das 10 telas de "gerando" retornadas mostra o estado de falha.** Isto é uma lacuna
do acervo: o Mobbin cataloga o estado feliz da geração. Buscando estados de erro
separadamente, o que existe é genérico, não específico de IA:

| App | URL | Copy literal | Saída oferecida |
|---|---|---|---|
| **ABY Journal** *(pequeno)* | https://mobbin.com/screens/568247e6-cd50-41f7-8ab1-0f8bc0d5afae | "ABY Noticed..." · "Oh no! Looks like something went wrong 😔 Please try again." | `Retry` (pílula amarela) + `×` — **em card sobreposto, com o input do usuário preservado e visível atrás** |
| **Chase UK** | https://mobbin.com/screens/36260299-2210-4fe6-8f64-83b025e12e25 | "OK, that didn't work" · "Want to try again? You can take your selfie manually if you like." + card de dica azul | **Duas saídas: `Try again` e `Take photo manually`** |
| **Oura** | https://mobbin.com/screens/9dbf6e35-9643-449f-9d0f-c89cc6248a49 | "Can't load chat" · "Wait a moment and try again." | `Try again`, sobre a tela anterior desfocada |
| **Clue** | https://mobbin.com/screens/eb39d007-32c8-48ec-8ad0-8dad8609e95d | "Looks like something's gone wrong" · "Please try again. If the problem continues, contact trust@helloclue.com..." | `Try again` + **`Copy error information`** |
| **PayPal** | https://mobbin.com/screens/305815a1-eb96-4544-bde7-c1342b7e15ce | "Sorry About the Wait" · "Our application is experiencing an issue. Please try it later." | `Try Again` + `Not Now` |
| **Swiggy** | https://mobbin.com/screens/25f4cc9d-9a98-4efb-87b3-58bd6fd98552 | "YOUR INTERNET IS A LITTLE WONKY" · "Try switching to a different connection or reset your internet to place an order." | `RETRY` |
| **Bolt Food** | https://mobbin.com/screens/68295fea-b87b-4e4a-bb5a-d61d18a645de | "Sorry, something went wrong" · "Please try again." | `Try again` |
| **Mimo** | https://mobbin.com/screens/619e0e7b-368d-4d34-8dde-f745918aefee | "Oops!" · "Ooops something went wrong - try again later" | **Nenhuma ação.** Só ilustração de monitor triste. `ANTI-PADRÃO` |

Os dois que importam para o Soulmon são **ABY Journal** (preserva o input do usuário atrás
do erro — ninguém reescreve 20 respostas) e **Chase UK** (oferece um **caminho
alternativo**, não só repetir o que já falhou). "OK, that didn't work" também é o único tom
de erro do arquivo que não pede desculpa nem dramatiza.

### Convergência e divergência — Dossiê 2

- **Convergência (7+ apps):** **o gerúndio na primeira pessoa do sistema.** "Generating your AI's image..." · "Generating your visuals" · "Generating Dreams with AI..." · "Generating your self-care goals with Lee..." · "Generating..." · "Generating Voice...". E **9 de 10 usam o objeto luminoso ou o anel centralizado no terço superior** com o texto abaixo — a composição é praticamente uma convenção. Só o Google Photos inverte (texto grande embaixo).
- **Divergência — e qual é a escolha real:** **barra de progresso determinada vs. animação indeterminada.** WhatsApp, Any Distance, GoFundMe, Canva e Google Photos mostram barra; Snapchat, Beside e Character AI mostram só pulsação. A escolha real é sobre **se você tem etapas de servidor reportáveis**. Barra sem etapa real é mentira que a pessoa detecta (ela vê o arco travar), e mentira detectada custa mais do que a ambiguidade honesta do orbe. **A regra que os dados sugerem: barra só quando houver marcos reais; fora disso, orbe + estimativa verbal de tempo.**

---

# §4 — DOSSIÊ 3: PRIMEIRO DIA GUIADO / CHECKLIST DE ATIVAÇÃO

### Strava — Checklist na home, dentro do feed, com contador fracionário
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/9e550f02-8d7a-4e05-be89-aae812901ec4
- **O padrão em uma frase:** o checklist é um **bloco no topo do feed da home**, com contador `0/4` e uma tarefa que aceita "não tenho".
- **Estrutura da tela, de cima para baixo:**
  1. Barra da home (avatar, busca, título `Home`, mensagens, notificações)
  2. Faixa `Suggested Goal` com card de meta e botão `Set Goal` — **um carrossel separado, acima do checklist**, com pontos de paginação
  3. **Faixa curva laranja** marcando a mudança de seção
  4. **Manchete bold de duas linhas** + linha de apoio
  5. **Barra de progresso segmentada em 4 traços** (todos vazios) com **`0/4` alinhado à direita**
  6. **Quatro linhas-cartão**, cada uma com: **círculo de rádio vazio à esquerda, fora do card** → ícone laranja em quadrado arredondado → título em bold + subtítulo em cinza → chevron `›`
  7. **A quarta linha tem dois botões inline:** `Connect` (laranja sólido) e `I don't have one` (outline)
  8. Tab bar de 5 itens
- **Copy literal:** "You've joined the world's largest team!" · "Here's how to get started using Strava:" · "0/4" · "Upload your first activity" / "You can record it right in the app." · "Follow three people (0/3)" / "Find friends and fan favorites to follow." · "Add a profile picture" / "This helps people know who you are." · "Connect a device" / "Sync a watch or fitness tracker to seamlessly upload your activities." · "Connect" · "I don't have one"
- **O mecanismo:** `0/4` mais quatro traços vazios criam uma lacuna visual que pede fechamento (Zeigarnik + efeito de progresso). O detalhe forte é `I don't have one`: sem ele, a quarta tarefa é impossível para quem não tem relógio e o checklist trava para sempre em 3/4 — **um contador travado é pior que nenhum contador, porque virou lembrete permanente de incompletude. Toda tarefa de checklist precisa ser dispensável ou satisfazível.**
- **Variação entre apps:** o único que dá **saída explícita para uma tarefa impossível**, e o único com **contador aninhado** (`Follow three people (0/3)` dentro de `0/4`).
- **Quando falha / risco:** o checklist compete com o `Suggested Goal` logo acima dele. Dois blocos de ativação empilhados dividem a atenção e nenhum vence.
- **Classificação:** PADRÃO

### monday.com — Percentual em anel + risco no item concluído
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/17658b1b-2a5e-4f8e-a4e9-dfcf1523cd7f
- **Estrutura da tela, de cima para baixo:**
  1. Cabeçalho com marca `monday work management`, busca e convite
  2. **Card branco arredondado grande:** à esquerda, saudação em duas linhas; à direita, **anel de progresso verde com `33%` e o rótulo `Completed` no centro**
  3. Dentro do card, três linhas:
     - **Linha 1 concluída: título e subtítulo em cinza com risco (strikethrough), `✓` azul à direita**
     - Linhas 2 e 3 ativas: ícone colorido + título bold + subtítulo + chevron `›`
  4. Card `Recently visited` com o primeiro board
  5. Card `Workspaces` · Tab bar de 4 itens
- **Copy literal:** "Hi Alex Smith," · "Finish setting up" · "33%" · "Completed" · "Create your first board" / "Name your board and add items" *(riscados)* · "Get started with basics" / "Learn how to create a workflow" · "Unlock the full experience" / "Try monday.com on desktop" · "Recently visited" · "Your first board"
- **O mecanismo:** **manter o item concluído visível e riscado** transforma a lista em registro de conquista, não só em fila de pendência — a pessoa vê o que já fez, o que sustenta autoeficácia. `33%` é mais motivador que `1/3` porque números maiores parecem mais progresso (efeito de magnitude numérica), mesmo sendo a mesma fração.
- **Variação entre apps:** único do dossiê que **risca em vez de remover** o item feito, e único com anel percentual em lugar de fração.
- **Quando falha / risco:** `Unlock the full experience — Try monday.com on desktop` é uma tarefa que **não pode ser cumprida no dispositivo em que está sendo exibida**. Mesmo defeito que o Strava resolveu, sem a saída que o Strava deu.
- **Classificação:** PADRÃO

### Peloton — Tela dedicada, com o item ativo expandido
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/8c49e5cf-d7c3-4262-bcab-9f223ab03494
- **Estrutura da tela, de cima para baixo:**
  1. Seta `‹` + título `Your getting started checklist`
  2. **Barra segmentada em 5 blocos:** 2 vermelhos cheios, 1 parcialmente vermelho, 2 cinza — progresso granular dentro do próprio segmento
  3. Régua divisória
  4. **Cinco linhas:** duas concluídas (**círculo cinza com `✓`** + texto em cinza) · **uma expandida (a atual): círculo vazio + título em preto + chevron `^` + parágrafo de apoio + botão vermelho pílula** · duas futuras (círculo vazio + título + chevron `v`, fechadas)
  5. Resto da tela vazio
- **Copy literal:** "Your getting started checklist" · "Complete your profile" · "Set class preferences" · "Try the class filter" / "Finding your next workout is easy - filter by length, music, difficulty, and more. Give it a try!" · "VIEW CLASSES" · "Bookmark a class" · "Take your first class"
- **O mecanismo:** **um CTA por vez.** O acordeão elimina a paralisia de escolha: existem cinco tarefas, mas só uma ação clicável. Implementa literalmente "uma coisa por vez" na interface, e é a razão pela qual esta é a execução mais legível do dossiê.
- **Variação entre apps:** o único **em tela dedicada** e o único com **acordeão de item único aberto**.
- **Quando falha / risco:** tela dedicada precisa de porta de entrada. Se nada na home levar até aqui, o checklist mais bem construído do dossiê nunca é visto — a descoberta, não a execução, é o gargalo.
- **Classificação:** PADRÃO

### Cleo AI — Passos numerados, com o próximo em destaque e o futuro apagado
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/bae4115d-f0c5-457a-bc4b-4d9abf0a6276
- **Estrutura da tela, de cima para baixo:**
  1. **Manchete em serifada marrom, coloquial:** "You're on a roll, babe"
  2. **Três linhas-cartão brancas de altura igual**, em fundo creme:
     - **Feito:** círculo verde-claro com `✓` verde + título em bold preto
     - **Atual:** **círculo marrom sólido com numeral em branco** + título em bold preto
     - **Futuro:** círculo cinza com numeral em cinza + título em **cinza claro**, e o card inteiro com opacidade reduzida
  3. Vazio · Botão marrom-escuro pílula de largura total: `Next`
- **Copy literal:** "You're on a roll, babe" · "Create your profile" · "Take a money quiz" · "Connect your bank" · "Next"
- **O mecanismo:** **três estados codificados em três formas de marcador**, legíveis sem ler o texto. E "You're on a roll, babe" faz feedback social positivo *antes* do trabalho — afirma competência com um passo cumprido, o oposto do enquadramento de dívida ("faltam 2 de 3").
- **Variação entre apps:** o único que **atenua a opacidade do card futuro inteiro**, não só do texto. Reduz a lista percebida de 3 para 2 itens.
- **Quando falha / risco:** `Connect your bank` como passo 3 pede o gesto de maior risco percebido antes de o valor ter sido demonstrado. Ordem de fricção invertida.
- **Classificação:** PADRÃO

### Shopify — Checklist longo sem desaparecimento, com oferta enxertada
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/b11c1a81-1d6a-4b9d-b948-297ebf14df50
- **Estrutura da tela, de cima para baixo:**
  1. Cabeçalho: avatar verde `MS`, título `My Store`, notificações
  2. Campo de busca `Go to...`
  3. **Faixa fina de oferta com ícone de brilhos**
  4. Título de seção `Get ready to sell` + linha de apoio + **contador `0 / 6 completed`**
  5. **Card branco com 6 linhas:** cada uma com **círculo pontilhado vazio** + título + chevron `›`. Sem subtítulo, sem ícone, sem hierarquia entre elas
  6. **Segundo card, colado abaixo:** ícone de brilhos + oferta de assinatura + botão `Select a plan`
  7. Tab bar de 4 itens
- **Copy literal:** "Select a plan to get your first month for $1." · "Get ready to sell" / "Use this guide to get your store up and running." · "0 / 6 completed" · "Add your first product" · "Add a custom domain" · "Customize your online store" · "Set your shipping rates" · "Name your store" · "Set up Shopify Payments" · "Build your dream business for $1/ month" / "Subscribe to get your first month for $1." · "Select a plan"
- **O mecanismo:** aqui o mecanismo trabalha contra o usuário. **Seis itens de peso visual idêntico** não dão ponto de entrada — sem primeiro passo óbvio, o custo cognitivo de escolher vira motivo para não começar. E `0 / 6` é o pior estado possível de um contador: máxima dívida, zero prova de capacidade.
- **Variação entre apps:** o mais longo do dossiê e o único **sem qualquer diferenciação visual entre as tarefas**. Também o único que **intercala oferta paga dentro do bloco de ativação**.
- **Quando falha / risco:** lê como trabalho pendente + cobrança. Para o Soulmon — cuja tese é encorajar, não cobrar — é o formato a evitar.
- **Classificação:** ANTI-PADRÃO

### Hatch Sleep — Checklist com contagem regressiva de restantes, não de feitos
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/1fa74fcf-3b16-43ef-bd69-cba043761086
- **Estrutura da tela, de cima para baixo:**
  1. `×` no canto superior direito
  2. **Manchete em serifada clara sobre azul-noite:** "6 steps to great rest"
  3. Parágrafo de apoio em 2 linhas
  4. **Barra segmentada em 6 traços** (todos vazios) com **`6 remaining to complete`** alinhado à direita
  5. **Cinco cards azul-escuro empilhados**, cada um com: **círculo vazio à esquerda** → **título em caixa alta pequena** → parágrafo de 2–3 linhas → **link de ação em ciano**
  6. O sexto card entra cortado pelo scroll
- **Copy literal:** "6 steps to great rest" · "Feeling sleepy yet? Follow these steps to get the most out of your Restore." · "6 remaining to complete" · "GIVE IT A SHOT" / "87% of users sleep better after building healthy habits with Restore. Get started today by tapping your Restore at bedtime." · "WHAT DO THOSE BUTTONS DO?" / "Learn what you can do phone-free, so you can trade blue light for a good night." / "Tap to learn more →" · "DISCOVER ROUTINES YOU LOVE" / "Save a few extra Unwind Routines so you can easily tap to the one that matches your mood." / "Set up now →" · "STICK TO IT" / "Set up a Cue to keep your new habit on track." / "Let's go →" · "MAKE SOME TWEAKS" / "Editing your steps can help your routine feel just right." *(cortado)*
- **O mecanismo:** cada card **justifica a tarefa antes de pedi-la**, e o primeiro usa **prova social quantificada** ("87% of users sleep better") — muda a natureza da lista: não é o app pedindo favores, é o app explicando benefício. O custo é a densidade.
- **Variação entre apps:** o único que conta **restantes em vez de concluídos**, e o único em que cada item tem **parágrafo de justificação própria**.
- **Quando falha / risco:** `6 remaining to complete` enquadra a lista como **dívida**, não como progresso — formulação exatamente inversa ao `0/4` do Strava, e a pior das duas para um produto que não quer cobrar.
- **Classificação:** LIMÍTROFE

### Turo — Acordeão de seções com contador por seção
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/c9aac5fd-b8fb-4676-94db-9b3c0896b09e
- **Estrutura da tela, de cima para baixo:**
  1. `×` no canto superior esquerdo
  2. **Ilustração em blob verde** com pessoa e prancheta marcada — ~30% da altura
  3. **Manchete bold:** "One more step" + parágrafo de 2 linhas
  4. **Cabeçalho de seção:** `✓` cinza + `GETTING STARTED` em caixa alta + **`0/1`** + chevron `v`
  5. **Card da tarefa dentro da seção:** círculo cinza + título bold + subtítulo de 2 linhas + chevron `›`
  6. **Segundo cabeçalho de seção:** **`✓` verde sólido** + `VEHICLE SETTINGS` + chevron `›` (colapsada e concluída)
- **Copy literal:** "One more step" · "Finish the steps below so guests can start booking your vehicle." · "GETTING STARTED" · "0/1" · "Attend a virtual orientation" / "Complete an online host orientation with a Turo onboarding specialist." · "VEHICLE SETTINGS"
- **O mecanismo:** **agrupamento (chunking).** Quando o setup é longo, seções transformam uma lista intimidante em duas ou três metas pequenas. O `✓` verde na seção concluída entrega fechamento de marco intermediário. E "One more step" é a moldura de escassez de esforço mais forte do dossiê.
- **Variação entre apps:** o único **hierárquico em dois níveis**, e o único cujo título promete um número de passos em vez de nomear a lista.
- **Quando falha / risco:** "One more step" mentindo é caro. Se ao concluir aparecer outra seção, a promessa quebra no exato momento em que a pessoa esperava terminar.
- **Classificação:** PADRÃO

### Preply e Future Pro — o item ativo virando conteúdo, e o checklist que fica
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URLs Mobbin:**
  - Preply: https://mobbin.com/screens/c3d369c6-c1bd-4deb-8daa-62903d11d95b
  - Future Pro: https://mobbin.com/screens/1cef4ef3-3927-49f6-88a4-c0ec63d140ca
- **Estrutura (Preply):** `Good evening, Alex` + presente + avatar → manchete `Get started on Preply` → **card com borda:** linha 1 concluída (`✓` verde em quadrado); linha 2 **ativa, com fundo rosa-claro** e, **dentro dela**: foto do tutor, menu `···`, **data e hora em bold grande**, **botão `Join lesson` com borda rosa**, e um sub-bloco `Before your lesson` com sua própria linha marcada → linha 3 futura em cinza → tab bar de 5
- **Estrutura (Future Pro):** stepper horizontal de 3 nós ciano **todos marcados** → três linhas de acordeão **todas com `✓` ciano e texto em cinza** → **card fotográfico com data de liberação e contagem regressiva `02D 19H 57M 40S`** → botão gradiente + link
- **Copy literal:** Preply: "Good evening, Alex" · "Get started on Preply" · "Find your tutor" · "Take your trial lesson" · "Monday, Dec 2 at 7:00 PM" · "Join lesson" · "Before your lesson" · "Share your learning needs" · "Set up your learning schedule" — Future Pro: "WELCOME TO FUTURE" · "Pick Your Coach" · "Account Setup" · "Kickoff Call with Aurelia" · "Workouts Available Starting" · "Mon, Oct 7 at 12:00" · "02D 19H 57M 40S" · "VIEW WORKOUT TIPS" · "TRY AN INTRO WORKOUT"
- **O mecanismo:** Preply mostra a **progressão do checklist para conteúdo** — quando o passo atual carrega o objeto real (a aula, com hora e botão de entrar), o checklist deixa de ser meta-interface e passa a ser o produto. É a resposta mais elegante a "como desaparece": ele não desaparece, ele **se transforma**.
- **Variação entre apps:** Future Pro é o contra-exemplo — **os três passos ficam na tela com `✓`, ocupando o topo**, e o valor real está travado por contagem regressiva. Checklist morto no lugar mais nobre da home.
- **Quando falha / risco:** a contagem regressiva do Future Pro é o padrão que o Soulmon proíbe: cronômetro que gera urgência sem que a pessoa possa fazer nada a respeito.
- **Classificação:** Preply — PADRÃO · Future Pro — ANTI-PADRÃO

### Como o checklist desaparece — a resposta direta

**O acervo não mostra o estado pós-conclusão de nenhum destes checklists** — todas as
capturas são de listas em andamento. Lacuna do Mobbin. O que é observável são **as três
estratégias de tratamento do item concluído**:

1. **Riscar e manter visível** — monday.com (o item feito continua no card, riscado, com `✓`)
2. **Cinza e colapsar** — Peloton, Turo, Future Pro (o item vira linha cinza, fechada)
3. **Transformar em conteúdo** — Preply (o passo cumprido some e o objeto real ocupa o lugar)

A terceira é a única que resolve o problema estrutural: as outras duas deixam resíduo de UI
que, em algum momento, o app tem de ter coragem de remover — e é justamente esse momento
que ninguém capturou.

### Tutorial em tela cheia — a distinção

**Nenhum dos 10 resultados é tutorial de tela cheia**; a busca por checklist não os traz.
A diferença estrutural observável nos achados é que **o checklist é persistente e
não-modal** (vive na home, pode ser ignorado, mantém estado entre sessões), o que é o
oposto do tutorial modal. Um dossiê de tutorial em tela cheia exigiria busca nova.

### Convergência e divergência — Dossiê 3

- **Convergência (6+ apps):** **contador fracionário ou percentual sempre presente e sempre alinhado à direita** (`0/4` · `0/6 completed` · `0/1` · `33%` · `6 remaining`), e **barra segmentada em N traços** logo abaixo do título em 5 dos 10. O marcador de estado é invariavelmente um **círculo à esquerda de cada linha** — vazio, com `✓`, ou numerado. Convenção estabelecida, não escolha de design.
- **Divergência — e qual é a escolha real:** **card na home vs. tela dedicada.** Strava, monday.com, Cleo, Shopify, Preply e Future Pro põem na home; Peloton, Turo e Hatch dão tela própria. A escolha real é entre **descoberta e foco**: na home o checklist é visto por todos mas compete com o conteúdo (e o Strava perde essa disputa contra o próprio `Suggested Goal`); em tela dedicada é legível e sem ruído, mas depende de um ponto de entrada que pode nunca ser tocado. **A resolução que o Preply demonstra é não escolher: ficar na home e ir se dissolvendo no conteúdo à medida que avança.**

---

# §5 — DOSSIÊ 4: PERMISSÃO DE NOTIFICAÇÃO COM PRIMING

> O momento da jornada é o dado mais importante. Está registrado em cada achado, e
> consolidado na tabela ao fim do dossiê.

### Finch — O pet pede, e a prévia é uma fala dele
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/3e88469e-f60a-439d-ac4d-0bd06fd8eae4
- **Momento da jornada:** onboarding, **depois de o pet existir e ter nome** — o pedido é feito por um personagem já conhecido, não pelo app
- **Estrutura da tela, de cima para baixo:**
  1. Fundo branco puro, **sem cabeçalho, sem barra de status visível, sem `×`**
  2. **Manchete bold centralizada:** "Get reminders from Lee"
  3. **Mock de notificação iOS em largura quase total:** ícone do app à esquerda, `From Lee` em bold, corpo abaixo, timestamp `now` à direita
  4. **O pet desenhado grande no centro da tela, com a mão erguida em cumprimento**, sombra elíptica
  5. Vazio
  6. **Botão verde pílula de largura total:** `Turn on notifications`
  7. **Botão cinza-claro pílula de largura total, logo abaixo:** `Maybe later`
- **Copy literal:** "Get reminders from Lee" · "From Lee" · "Remember to drink water!" · "now" · "Turn on notifications" · "Maybe later"
- **O mecanismo:** **transferência de fonte.** A permissão não é concedida ao software, é concedida ao personagem — e a relação parassocial com o pet já foi estabelecida nas telas anteriores. `Remember to drink water!` é deliberadamente inócuo e cuidador: mostra que a notificação será zelo, não cobrança. E o par de botões tem **peso visual quase igual**, o que sinaliza que recusar é aceitável.
- **Variação entre apps:** único do dossiê em que **o personagem, não a marca, é o remetente da prévia**. Modelo mais diretamente transferível para o Soulmon.
- **Quando falha / risco:** se as notificações reais não soarem como o personagem, a promessa da prévia foi quebrada — e o custo cai sobre o vínculo com a criatura, o ativo mais caro do produto.
- **Classificação:** PADRÃO

### Atoms — Priming em folha modal, sobre o hábito que a pessoa acabou de escrever
- **Plataforma / data:** iOS · data não exposta pelo MCP · *app pequeno*
- **URL Mobbin:** https://mobbin.com/screens/fdf2408a-425f-4689-8a3e-fdd4a4d20840
- **Momento da jornada:** **imediatamente após a pessoa formular seu hábito** — a tela de trás mostra a frase dela ("I will walk for 15mins, every day at 6pm so that I can become a more fit and healthy individual"), desfocada atrás da folha
- **Estrutura da tela, de cima para baixo:**
  1. **Tela de fundo visível e esmaecida:** `HABIT SETTINGS` e a frase do hábito
  2. **Folha modal creme** cobrindo ~65% inferior, com alça de arraste
  3. **Ícone de sino em quadrado arredondado escuro** — pequeno, centralizado. *(Único do dossiê com ícone dentro de caixa — contraria a regra visual do Soulmon.)*
  4. **Manchete bold centralizada:** "Allow notifications" + parágrafo de 2 linhas
  5. **Mock de notificação em card branco** — e **atrás dele, a borda de um segundo card**, sugerindo pilha
  6. **Botão preto pílula largura total:** `Allow Notifications`
  7. **Botão branco com borda, largura total:** `Maybe later`
- **Copy literal:** "Allow notifications" · "Get reminders to do your habits and support for sticking with them." · "Time to Meditate" · "You're 2 minutes away from putting your day on a completely different trajectory." · "Allow Notifications" · "Maybe later"
- **O mecanismo:** **timing de compromisso.** Pedir permissão de lembrete no segundo em que a pessoa escreveu sua intenção ancora o pedido nela — o lembrete deixa de ser interrupção do app e passa a ser instrumento do plano dela. É o melhor posicionamento de jornada do dossiê. E a prévia entrega amostra do **tom real** em vez de texto genérico.
- **Variação entre apps:** o único **não-modal-de-tela-cheia** (folha sobre o contexto) e o único que **deixa o compromisso do usuário visível atrás do pedido**.
- **Quando falha / risco:** folha modal é mais fácil de dispensar por reflexo — troca taxa de opt-in por respeito. E o ícone em caixa é incompatível com o sistema visual do Soulmon.
- **Classificação:** PADRÃO *(o container e o timing; o ícone em caixa, não)*

### Duolingo — Mascote fala, e uma seta aponta para o botão do sistema
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/817844ed-f7df-4645-b18b-a9803879821f
- **Momento da jornada:** dentro do onboarding, **com barra de progresso visível (~40%)** — antes de qualquer valor entregue
- **Estrutura da tela, de cima para baixo:**
  1. Seta `←` + **barra de progresso verde (~40%)**
  2. **Mascote (Duo) à esquerda + balão de fala com cauda apontando para ele à direita**
  3. **O diálogo nativo do iOS, renderizado esmaecido no centro:** botões `Don't Allow` | `Allow`
  4. **Seta azul grande apontando para cima**, logo abaixo de `Allow`
  5. **Botão verde pílula de largura total, em caixa alta:** `REMIND ME TO PRACTICE`
- **Copy literal:** "I'll remind you to practice so it becomes a habit!" · ""Duolingo" Would Like to Send You Notifications" · "Notifications may include alerts, sounds, and icon badges. These can be configured in Settings." · "Don't Allow" · "Allow" · "REMIND ME TO PRACTICE"
- **O mecanismo:** o balão do mascote faz o priming; a **seta faz direcionamento de olhar para uma das duas opções do diálogo do sistema**. Isso é a fronteira do padrão: instruir visualmente qual botão do OS apertar é **manipulação da escolha em uma superfície que a Apple desenhou deliberadamente como neutra**. `so it becomes a habit` é boa copy — ata o lembrete ao mecanismo real de formação de hábito.
- **Variação entre apps:** um de **três** apps do dossiê (com Liven e Tempo) que **renderizam o diálogo nativo dentro da própria composição**. Duolingo e Liven vão além e **apontam a seta para `Allow`**.
- **Quando falha / risco:** opt-in obtido por direcionamento não é o mesmo que por convicção — reaparece como desinstalação ou desativação nas Configurações do sistema, onde não há visibilidade. E pedir **antes de entregar valor** (barra em 40%) é a pior posição de jornada possível.
- **Classificação:** LIMÍTROFE *(a seta sobre o botão nativo, isolada: ANTI-PADRÃO)*

### Liven — A mesma seta, com copy mais suave e o botão que não corresponde
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/89046b2a-c06f-43cb-b0ae-738cffa0f3bb
- **Momento da jornada:** onboarding; `Maybe later` no canto superior direito
- **Estrutura:** **`Maybe later` como link de texto no canto superior direito** → fundo em gradiente pastel → **manchete bold** → parágrafo de 2 linhas → **diálogo nativo do iOS esmaecido** → **seta azul apontando para `Allow`** → **botão verde pílula de largura total**
- **Copy literal:** "Maybe later" · "Let Liven support you" · "Receive gentle nudges to guide and inspire your self-discovery daily." · ""Liven" Would Like to Send You Notifications" · "Don't Allow" · "Allow" · "Remind me to practice"
- **O mecanismo:** `gentle nudges` é a escolha lexical mais alinhada a um produto que encoraja. Mas há um defeito: o botão diz **`Remind me to practice`** num app de autodescoberta que acabou de falar em `self-discovery` — copy reaproveitada de outro contexto (idêntica à do Duolingo), e a incoerência é visível.
- **Variação entre apps:** único que **move a recusa para o canto superior** em vez de empilhá-la sob o botão primário.
- **Quando falha / risco:** recusa em link pequeno no topo + seta apontando para `Allow` é um par assimétrico deliberado. Funciona para a métrica de opt-in, contradiz a promessa de "gentle".
- **Classificação:** LIMÍTROFE

### The Outsiders — Priming com humor autodepreciativo e recusa em igualdade
- **Plataforma / data:** iOS · data não exposta pelo MCP · *app pequeno*
- **URL Mobbin:** https://mobbin.com/screens/66485262-6b44-43b2-8f43-fdb625fdee25
- **Momento da jornada:** onboarding, tela cheia dedicada
- **Estrutura da tela, de cima para baixo:**
  1. **Manchete bold grande, alinhada à esquerda:** "Stay on Track"
  2. **Parágrafo de 3 linhas** com a concessão explícita
  3. **Maquete de iPhone em perspectiva** (~50% da altura), mostrando a **home screen com ícones de app reais e uma notificação empilhada no topo** — contexto de uso, não card isolado
  4. **Dois botões lado a lado, de largura igual:** `Skip` (cinza-escuro) e `Go For It` (cinza mais claro)
- **Copy literal:** "Stay on Track" · "Set reminders for key events. Not that you need them, but still ... out of sight, out of mind. We won't spam you." · "New Workout Summary" / "Details of your last run are now available for your inspection!" · "9:41" · "Skip" · "Go For It"
- **O mecanismo:** **"Not that you need them, but still"** é reconhecimento de competência — não trata a pessoa como incapaz de lembrar, o que desarma reatância. **"We won't spam you"** endereça a objeção real, sem rodeio. E os **dois botões de largura e peso iguais** são a arquitetura de escolha mais honesta do dossiê inteiro: não há botão isca.
- **Variação entre apps:** único com **botões lado a lado em igualdade**, único com **humor autodepreciativo**, e único cuja maquete mostra a notificação **no contexto da home screen do telefone**.
- **Quando falha / risco:** paridade de botões custa taxa de opt-in — e essa taxa é a métrica pela qual esta tela normalmente é avaliada. É escolha de produto, não de design, e precisa ser defendida como tal.
- **Classificação:** PADRÃO

### 5 Minute Journal — Prévia no topo, invadindo pela borda
- **Plataforma / data:** iOS · data não exposta pelo MCP · *app pequeno*
- **URL Mobbin:** https://mobbin.com/screens/b94c8034-63e4-47ba-b030-975df4167c79
- **Momento da jornada:** onboarding, tela cheia
- **Estrutura:** **faixa superior com fotografia (folhagem monocromática)** com **o mock de notificação sobreposto flutuando sobre ela**, alinhado à esquerda → **manchete em serifada grande, duas linhas, centralizada** → parágrafo de 3 linhas → **botão âmbar sólido pílula de largura total** → **`Maybe later` como link de texto âmbar** centralizado
- **Copy literal:** "Inspiration Reminder" · "You're changing this world for the better." · "Get daily reminders and inspiration" · "Allow notifications to setup your daily journal reminders, receive inspirational quotes and get notified of new mindful content." · "Enable Notifications" · "Maybe later"
- **O mecanismo:** a prévia entrega uma **amostra do valor emocional real** — a notificação não é sobre a tarefa, é sobre como a pessoa vai se sentir ao recebê-la. Vende o conteúdo, não o canal. E o parágrafo enumera **três** coisas que serão enviadas: transparência de escopo.
- **Variação entre apps:** único que **enumera explicitamente as categorias** de notificação — o que mais se aproxima de consentimento informado.
- **Quando falha / risco:** prometer três tipos é prometer três — se o app mandar mais (promocional, por exemplo), o consentimento foi obtido sob escopo falso.
- **Classificação:** PADRÃO

### Babbel e Tempo — o mínimo viável, e o diálogo disparado cedo
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URLs Mobbin:**
  - Babbel: https://mobbin.com/screens/145362bc-bd8d-4425-9c30-34b01b7a1fd0
  - Tempo: https://mobbin.com/screens/28a98c51-2efc-4489-8d14-2f31cd4db383
- **Momento da jornada:** Babbel — folha modal, com `×`, sem indicação de etapa · Tempo — onboarding com `‹` e `Skip` no topo
- **Estrutura (Babbel):** `×` no canto superior direito → **ícone de sino nu, pequeno, sem caixa, alinhado à esquerda** → manchete bold → parágrafo de 2 linhas → botão preto largura total → botão branco com borda. **Sem prévia de notificação, sem ilustração.**
- **Estrutura (Tempo):** `‹` e `Skip` → **manchete em forma de pergunta**, duas linhas → parágrafo especificando os horários exatos → mock de notificação parcialmente **coberto pelo diálogo nativo** → diálogo nativo → botão preto largura total
- **Copy literal:** Babbel: "Stay on track" · "Get learning reminders so you don't miss a beat. You can always turn them off in Settings." · "Remind me" · "Maybe later" — Tempo: "Skip" · "Want a reminder when your live classes are about to start?" · "We'll send you a notification one hour before, and another 15 minutes before the class begins." · "Enable notifications"
- **O mecanismo:** Babbel é o **piso do padrão** — sem prévia, sem personagem, sem ilustração, e ainda assim tem a peça mais importante: **"You can always turn them off in Settings"**, reversibilidade explícita e antídoto direto ao medo de spam. Tempo faz o que ninguém mais fez: **declara a frequência e o horário exatos**, o grau máximo de escopo informado. Mas mostra o defeito: **o diálogo nativo aparece sobre a prévia, encobrindo-a** — o priming é disparado junto com o pedido, e a pessoa nunca chega a ler o argumento.
- **Variação entre apps:** Babbel é o único **sem nenhuma prévia**; Tempo é o único que **quantifica a frequência**; e Tempo é o único onde **o diálogo do sistema oclui o próprio priming** — erro de sequenciamento, não de conteúdo.
- **Quando falha / risco:** priming só funciona se for **lido antes** do diálogo. Disparar o pedido nativo no mesmo frame anula o investimento na tela.
- **Classificação:** Babbel — PADRÃO · Tempo — LIMÍTROFE *(copy PADRÃO; sequenciamento ANTI-PADRÃO)*

### Yazio e Buddy — quando o priming vira barganha
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URLs Mobbin:**
  - Yazio: https://mobbin.com/screens/da9dc22b-6aea-49c8-9acf-0127c55d1dad
  - Buddy: https://mobbin.com/screens/47f06972-3e3e-4dc3-b648-c1225df53a76
- **Momento da jornada:** Yazio — modal com `×`, **exibindo a data prevista de atingimento da meta** dentro do pedido · Buddy — **em Configurações**, disparado ao ativar um toggle
- **Estrutura (Yazio):** `×` no canto superior direito → ilustração de telefone com notificações e emblemas circulares em volta (ícones **dentro** de círculos) → manchete bold → parágrafo de 2 linhas → **linha `You'll reach your goal by`** → **seletor horizontal de datas com `2 JUN` destacado em caixa branca** → botão azul largura total. **Sem opção de recusa visível além do `×`.**
- **Estrutura (Buddy):** tela de Configurações ao fundo, desfocada, com o toggle `Activate reminders` → **maquete de telefone contendo um diálogo de permissão** → dentro dela, botão âmbar `ALLOW` e botão escuro `NOT NOW`
- **Copy literal:** Yazio: "Stay motivated!" · "To increase your success, we would like to send regular tips and reminders to you." · "You'll reach your goal by" · "2 JUN" · "Allow coach tips" — Buddy: "Daily reminders" · "The easiest way to fail with your budget is to forget about it. We can remind you to add todays expenses at a time that suits you." · "Activate reminders" · "To enable this feature we need your permission to send notifications." · "* you can change this later" · "ALLOW" · "NOT NOW" · "Tips & tricks" · "Get tips on how to get up and running and get the most out of the app."
- **O mecanismo:** Buddy tem **o melhor momento de jornada do dossiê inteiro**: a permissão é pedida **no instante em que o usuário liga o toggle de lembretes por vontade própria**. Não há priming a fazer — a pessoa já declarou o desejo, e o pedido é apenas mecânica. **Padrão-ouro: permissão pedida como consequência de uma ação do usuário, não como etapa do onboarding.** Yazio, por outro lado, **acopla a permissão à data prevista da meta**, insinuando que o resultado depende do opt-in — troca condicionada, confirmada pela ausência de recusa.
- **Variação entre apps:** Buddy é o único **fora do onboarding**; Yazio é o único que **atrela um resultado prometido ao consentimento** e o único **sem botão de recusa**.
- **Quando falha / risco:** Yazio é o modelo a não seguir — sugere que o progresso depende de aceitar notificação, colidindo com "nada pune por inatividade". E o `NOT NOW` do Buddy está **dentro de uma maquete de telefone**, o que confunde o que é interface real e o que é ilustração.
- **Classificação:** Buddy — PADRÃO *(pelo momento; a copy de perda é LIMÍTROFE)* · Yazio — ANTI-PADRÃO

### Tabela consolidada — o momento da jornada

| App | Momento exato | Recusa disponível? | Prévia? | Escopo declarado? |
|---|---|---|---|---|
| **Buddy** | **Ao ligar o toggle de lembretes, em Configurações** | `NOT NOW` | maquete | "you can change this later" |
| **Atoms** | Imediatamente após escrever o próprio hábito | `Maybe later`, peso igual | card + pilha | não |
| **Finch** | Após o pet existir e ter nome | `Maybe later`, peso igual | notificação do pet | não |
| **Tempo** | Onboarding, ligado a aulas ao vivo | `Skip` (topo) | encoberta pelo diálogo | **frequência e horário exatos** |
| **The Outsiders** | Onboarding | `Skip`, **largura igual** | maquete de home screen | "We won't spam you" |
| **5 Minute Journal** | Onboarding | `Maybe later` (link) | card sobre foto | **três categorias enumeradas** |
| **Babbel** | Onboarding (folha modal) | `Maybe later`, borda | **nenhuma** | "turn them off in Settings" |
| **Duolingo** | **Onboarding, ~40% da barra**, antes de qualquer valor | `Don't Allow` (nativo), **com seta apontando para `Allow`** | balão do mascote | não |
| **Liven** | Onboarding | `Maybe later` (link, topo) + seta para `Allow` | nenhuma | "gentle nudges" |
| **Yazio** | Onboarding, atrelado à data da meta | **só o `×`** | ilustração | não |

### Convergência e divergência — Dossiê 4

- **Convergência (7+ apps):** **prévia de notificação renderizada como card do iOS** — ícone + título em bold + corpo, exatamente no formato do sistema (Finch, Atoms, Duolingo, 5 Minute Journal, The Outsiders, Tempo, Yazio). Todos mostram *o objeto que a pessoa vai receber* antes de pedir permissão para enviá-lo. E **9 de 10 oferecem recusa explícita** — `Maybe later` aparece literalmente em 4 apps com a mesma grafia. O único sem recusa é o Yazio.
- **Divergência — e qual é a escolha real:** **onde no fluxo pedir.** Nove dos dez pedem durante o onboarding; **só o Buddy pede depois, disparado por uma ação do usuário.** A escolha real é entre **volume e qualidade de consentimento**: no onboarding você pega todo mundo, incluindo quem não sabe ainda se quer, e paga em desativação silenciosa nas Configurações do sistema — onde não há métrica. No momento da ação, você pega menos gente, mas pega gente que pediu. **Para um app cuja tese é encorajar e nunca cobrar, o custo do opt-in de baixa convicção é maior que em um app de aprendizado: a notificação indesejada de um pet vira exatamente a cobrança que o produto promete não fazer.**

---

# §6 — DOSSIÊ 5: PERSONAGEM/MASCOTE COMO INTERFACE

### BitePal — O pet como cabeçalho, com estado em corações e a lista rolando embaixo
- **Plataforma / data:** iOS · data não exposta pelo MCP · *app pequeno*
- **URL Mobbin:** https://mobbin.com/screens/c76cbee1-e8f2-443c-b542-4920622b6ed3
- **O padrão em uma frase:** **a área do pet é fixa no topo, a lista de dados rola por baixo dela** — exatamente a arquitetura já definida para o Soulmon.
- **Estrutura da tela, de cima para baixo:**
  1. Título `Today` com chevron de seletor de data, e **setas `‹ ›` de navegação de dia** à direita
  2. **Cena de fundo ilustrada** (céu azul, cerca, arbustos, abóboras de Halloween) — **decoração sazonal**
  3. **O pet (guaxinim `Caramel`) grande e centralizado** sobre a cena
  4. **Linha de estado, alinhada à esquerda:** **nome em bold escuro** e, abaixo, **quatro corações vermelhos preenchidos** · **ícone de chama + `2`** · **ícone de comida**
  5. **Folha branca de cantos superiores arredondados subindo:** `Calories eaten` com seletor, **`363` em display grande + `kcal`**, botão `+` circular escuro à direita
  6. **Três barras de macro**, cada uma com trilha fina de cor própria
  7. Segundo card `Water` entrando pelo scroll
  8. **Tab bar flutuante de 3 ícones nus** sobre a folha
- **Copy literal:** "Today" · "Caramel" · "2" · "Calories eaten" · "363" · "kcal" · "Carbs" · "31/127 g" · "Fats" · "22/45 g" · "Proteins" · "12/146 g" · "Water"
- **O mecanismo:** **o pet é a moldura afetiva; os dados são o conteúdo.** A separação estrutural (cena fixa + folha rolável) permite densidade de informação sem perder o vínculo emocional. Os **corações comunicam estado sem número** — solução direta ao requisito de "estados sinalizados sem texto".
- **Variação entre apps:** o único que **põe pet e planilha densa na mesma tela** com a divisão fixo/rolável, e o único com **decoração sazonal da cena** — mudança visual gratuita que faz o pet parecer vivo no tempo.
- **Quando falha / risco:** corações são um medidor de N estados **que pode descer**. Se representarem saúde ou energia, conflitam com "nenhum número exposto pode diminuir" — corações vazios são um número decrescente disfarçado de ícone.
- **Classificação:** LIMÍTROFE *(arquitetura fixo/rolável: PADRÃO · corações decrescentes: ANTI-PADRÃO)*

### Finch — Pet como narrador, com o progresso de evolução declarado
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin (evolução):** https://mobbin.com/screens/84e8f220-03a6-432a-8e95-9da55e87d860
- **URL Mobbin (coleção):** https://mobbin.com/screens/83509751-7c83-4eeb-ba04-f9e3c37689d3
- **O padrão em uma frase:** o pet **fala em terceira pessoa sobre si mesmo** e a tela mostra quanto falta para a próxima forma, com a meta escrita em linguagem natural.
- **Estrutura da tela de evolução, de cima para baixo:**
  1. **Cena ilustrada de fundo** — céu noturno com lua, pinheiros, gramado. Sem chrome
  2. **O pet centralizado**, pequeno em relação à cena, **com um coração vermelho flutuando ao lado** (sinal de estado, sem texto)
  3. **Linha em branco, centralizada, sobre a cena:** "Lee is growing up a little!"
  4. **Card branco arredondado:** ilustração à esquerda → **título em bold `Evolve Lee into Toddler`** → subtítulo cinza com a condição → **barra de progresso âmbar com `1 / 7` à direita**
  5. **Linha de texto abaixo do card, com o alvo em bold**
  6. Linha de convite + **botão branco pílula de largura total:** `Start Adventure!`
- **Copy literal:** "Lee is growing up a little!" · "Evolve Lee into Toddler" · "Achieve 7 full-energy days" · "1 / 7" · "6 more full-energy days to become a Toddler!" · "Lee is ready to go exploring today to learn something new!" · "Start Adventure!"
- **O mecanismo:** (a) **narração em terceira pessoa** — "Lee is growing up" faz do usuário observador benevolente do crescimento de outro, não destinatário de cobrança; (b) **a meta é uma condição nomeada** ("full-energy days"), não um número abstrato de XP; (c) **`1 / 7` só pode subir** — dias de energia acumulados nunca voltam, exatamente o modelo de contador que o Soulmon precisa.
- **Variação entre apps:** o único que **nomeia explicitamente a próxima forma** (`Toddler`) e **redunda o progresso em três formatos** — barra, fração, e frase em linguagem natural.
- **Quando falha / risco:** nomear a próxima forma revela a árvore de evolução. Com 11 formas em 5 estágios ramificados, dizer o nome do próximo estágio é impossível (ou é spoiler de um galho). **Transparência do alvo compra motivação e gasta mistério.**
- **Classificação:** PADRÃO

### Tolan — Personagem em tela cheia, com o chrome reduzido a três ícones nus
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/90722ad9-55fe-4a5d-8df2-de63dae1a2ff
- **Estrutura da tela, de cima para baixo:**
  1. **Cantos superiores com quatro affordances pequenos:** ícone de chat; **pílula com chevron `v` e badge `2`**; ícone de caixa/presente; **ícone `A` com etiqueta verde `NEW!`**
  2. **A criatura 3D verde ocupando cerca de 70% da altura**, em pé, sobre um **plano de chão sutil** com sombra de contato
  3. Fundo em **gradiente atmosférico** (lavanda → pêssego), sem cenário desenhado
  4. **Partículas luminosas** flutuando à direita
  5. **Base: três ícones grandes, brancos, completamente nus** — `+`, balão de fala, microfone. **Sem caixa, sem moldura, sem fundo, sem rótulo**
- **Copy literal:** "NEW!" · "2" · *(nenhum outro texto na tela)*
- **O mecanismo:** **presença.** Escala, sombra de contato e partículas fazem a criatura ocupar um espaço em vez de ilustrar uma tela — e a redução do chrome a três ícones nus impede que a UI compita com ela. A ausência total de texto é a decisão mais radical do dossiê: o estado é comunicado só por pose e ambiente.
- **Variação entre apps:** único que **entrega a tela inteira ao personagem sem cartão de dados, sem barra de estado e sem nome visível**. Exemplo de referência de **ícone sem caixa** em produção.
- **Quando falha / risco:** sem nome, sem estado e sem próxima ação, a home não responde "o que eu faço agora". Tolan resolve porque a resposta é sempre "conversar"; **num app de hábitos, cuja resposta é "cumpra uma tarefa", tela cheia sem lista deixa a ação principal fora de vista.**
- **Classificação:** PADRÃO *(como referência de presença e de ícone nu; não como arquitetura de home para app de hábito)*

### Abode — Pet com dois medidores e três ações coloridas
- **Plataforma / data:** iOS · data não exposta pelo MCP · *app pequeno*
- **URL Mobbin:** https://mobbin.com/screens/d450f05c-bebb-4852-a443-c8f62468ff03
- **Estrutura da tela, de cima para baixo:**
  1. Cabeçalho: avatar do usuário, título `Pet`, `···` e `×`
  2. **Duas barras de medidor lado a lado**, cada uma prefixada por um ícone nu: **coração vermelho + barra vermelha** (quase cheia) · **rosto sorridente + barra azul** (~60%). À direita, **botão quadrado escuro com ícone de lua**
  3. **Cena ilustrada** em azuis: nuvens, montanha, arbustos
  4. **O pet (blob azul translúcido com dois olhos brancos)** centralizado, com sombra elíptica
  5. **Três botões quadrados grandes de cantos arredondados, lado a lado**, cada um de cor saturada distinta com **um ícone branco nu dentro**: âmbar (petisco), verde (escova), rosa (brinquedo)
  6. **Faixa curva vermelha** separando a cena
  7. **Campo de texto `Start typing...`** com avatar à esquerda e dois ícones à direita
  8. **Dois avatares sobrepostos** centralizados na base (presença de outras pessoas)
- **Copy literal:** "Pet" · "Start typing..." · *(nenhum rótulo nos medidores nem nos botões)*
- **O mecanismo:** **ação encarnada.** Três botões correspondendo a três verbos de cuidado fazem o cuidado ser algo que se *faz*, não algo que se *reporta*. Cor saturada distinta por ação permite memória motora — a pessoa aprende a posição, não o rótulo. Os medidores identificados só por ícone são vocabulário de estado sem texto, logo sem tradução: relevante para um app bilíngue.
- **Variação entre apps:** o único com **medidor duplo simultâneo** e o único com **presença social de outros usuários** na tela do pet.
- **Quando falha / risco:** **os dois medidores podem descer** — mecânica clássica de Tamagotchi, e o coração do que o Soulmon rejeita. Um medidor de felicidade em 60% é uma acusação passiva. E ícone sem rótulo é ambíguo: coração pode ser saúde, afeto ou vida.
- **Classificação:** ANTI-PADRÃO *(pela mecânica dos medidores; os botões de ação em cor+ícone nu, isolados: PADRÃO)*

### Alan — Personagem com companheiro, e o número do dia acima do nome
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/f166c8b0-f78e-4e07-905c-28fe994db0fd
- **Estrutura da tela, de cima para baixo:**
  1. Cabeçalho: avatar pequeno, **campo de busca**, dois ícones circulares
  2. **Arco de fundo em pêssego claro** — halo atrás do personagem
  3. **A criatura (urso azul e creme) sentada ao lado de uma fogueira**, centralizada; **rótulo vertical `2 500` girado 90° na borda direita**
  4. **`600 berries today` em display bold grande**, centralizado
  5. Linha secundária em cinza: `0 steps • 1 challenge`
  6. **Card em pêssego claro:** texto de erro em duas linhas + **link `Restore access`** + **a criatura reaparecendo à direita, em outra pose**
  7. **Linha de tarefa:** ícone + `Walk` + `5 min` + **pílula com `04:22 left`**
  8. Título `Alan community` + **abas de período** com `This week` ativo
  9. **Faixa de ícones circulares** (`Today`, `Consult`, `Insurance`, `Optics`) e a criatura espiando pela borda direita
- **Copy literal:** "600 berries today" · "0 steps • 1 challenge" · "We lost track of your steps..." · "Restore access" · "Walk" · "5 min" · "04:22 left" · "Alan community" · "Today" · "This week" · "This month" · "This year" · "Consult" · "Insurance" · "Optics" · "2 500"
- **O mecanismo:** **a criatura aparece três vezes na mesma tela, em poses diferentes** — na cena principal, dentro do card de erro, e espiando pela faixa de ícones. Isso a estabelece como habitante da interface, e é barato: são variações de pose do mesmo asset. O detalhe mais forte é usar a criatura **dentro de um card de estado de erro** — o personagem absorve a má notícia e desarma a leitura de falha.
- **Variação entre apps:** o único onde **o mascote reaparece em múltiplos slots da mesma tela**, e o único que **usa o mascote para amaciar um estado de erro**.
- **Quando falha / risco:** `600 berries today` é métrica diária que **volta a zero amanhã** — número exposto que desce. E a densidade é alta: seis blocos competindo.
- **Classificação:** LIMÍTROFE *(mascote em estado de erro: PADRÃO · métrica diária que zera: ANTI-PADRÃO)*

### Yazio — O mascote em balão de fala durante o onboarding
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/528d7ee1-600a-4132-a9a4-ee364eb20b76
- **Estrutura da tela, de cima para baixo:**
  1. **Barra de progresso verde muito curta** (~5%)
  2. **Balão de fala cinza-claro**, **com a cauda apontando para baixo, à esquerda**, na direção do personagem: texto em **bold escuro, duas linhas, centralizado**
  3. Espaço vertical generoso
  4. **A criatura (monstro peludo verde-menta, chifres amarelos)** centralizada, ~35% da altura, com **sombra elíptica**
  5. Fundo branco puro. **Sem botão visível na tela**
- **Copy literal:** "Nice to meet you, Alex!"
- **O mecanismo:** **cauda do balão como vetor de atribuição.** É o que transforma texto de interface em fala de personagem — sem a cauda, é um card; com ela, é diálogo. E usar o nome próprio na primeira fala estabelece o registro relacional em uma linha.
- **Variação entre apps:** o mais **econômico** do dossiê: fundo branco, um balão, um personagem, uma frase, zero chrome. Prova que "personagem como interface" não exige cena ilustrada nem medidores.
- **Quando falha / risco:** balão + personagem sem botão pressupõe avanço automático ou por toque em qualquer lugar — affordance invisível. E fundo branco puro dá ao personagem zero contexto espacial: ele flutua, não habita.
- **Classificação:** PADRÃO

### Ahead — Personagem como cabeçalho de dados, com adereço indicando estado
- **Plataforma / data:** iOS · data não exposta pelo MCP · *app pequeno*
- **URL Mobbin:** https://mobbin.com/screens/ec7ff4d8-ecff-4305-b6d2-3fbc5d082ef9
- **Estrutura da tela, de cima para baixo:**
  1. **Faixa lavanda** no terço superior: engrenagem circular (esq.), **`Alex` em bold + `Confidence` em cinza menor, centralizados**, `×` circular (dir.)
  2. **A criatura (blob roxo, dois olhos)** centralizada na faixa, **segurando um monóculo dourado numa corrente** — o adereço é o sinal de estado
  3. **Folha branca de cantos superiores arredondados** subindo sobre a faixa
  4. Título centralizado: `Your emotion management skills`
  5. **Três cards de habilidade**, cada um com: **nome em bold** → **`X XP/2500 XP` em cinza pequeno** → **barra de progresso com nó circular na posição atual e marcadores de etapa** → **ícone temático nu no canto superior direito**
  6. Nota de rodapé em cinza pequeno
- **Copy literal:** "Alex" · "Confidence" · "Your emotion management skills" · "Self-awareness" · "210 XP/2500 XP" · "Self-control" · "150 XP/2500 XP" · "Resilience" · "0 XP/2500 XP" · "Do activities to collect XP!"
- **O mecanismo:** **adereço como estado emocional.** O monóculo não é decoração: é a forma mais escalável de sinalizar estado sem texto e sem número — troca-se o acessório, não a arte base. Onze formas × N adereços produz muita expressão a custo linear. E a **barra de XP com marcadores de etapa e nó de posição** é um medidor que só cresce.
- **Variação entre apps:** o único que usa **adereço/prop como canal de estado**, e o único cuja barra tem **marcadores de etapa intermediária visíveis**.
- **Quando falha / risco:** `0 XP/2500 XP` em `Resilience` exibe zero absoluto ao lado de duas barras que já andaram — comparação interna que lê como negligência. E "Confidence" sob o nome do usuário é ambíguo.
- **Classificação:** PADRÃO

### timespent — Personagens como widgets etiquetados, dentro do app
- **Plataforma / data:** iOS · data não exposta pelo MCP · *app pequeno*
- **URL Mobbin:** https://mobbin.com/screens/5cb0d729-fc77-417a-8509-9c110e9c9d54
- **Estrutura da tela, de cima para baixo:**
  1. Cabeçalho: `···`, título `Activities`, botão `+`
  2. **Duas linhas-cartão brancas com sombra e borda:** ícone em círculo colorido + nome em bold + **valor à direita em serifada âmbar** + rótulo `This Week`
  3. **Elemento circular de texto girado:** `ADD TALLY` repetido em círculo em volta de um **`+` grande central**
  4. Ao lado, **grade de contribuição** (estilo GitHub) em verdes
  5. **Fileira de cartões quadrados de cor sólida**, cada um com **um animal ilustrado segurando uma placa** com instrução escrita à mão
  6. **Tab bar em pílula escura flutuante** com 4 itens, o ativo em pílula branca com **rótulo de texto ao lado do ícone**
- **Copy literal:** "Activities" · "Reading" · "10h 13m" · "This Week" · "Running" · "13 mi" · "ADD TALLY" · "LONG PRESS TO EDIT" · "Can also set Default Widgets in Settings!"
- **O mecanismo:** **o personagem carrega a dica em vez de o app exibir um tooltip.** Uma placa segurada por uma raposa é lida como conselho amigável; o mesmo texto num banner cinza é lido como aviso de sistema. Resolve onde colocar dica contextual sem poluir.
- **Variação entre apps:** o único que usa personagens como **portadores de dica de descoberta**, e o único com **vários personagens diferentes** em vez de um só companheiro.
- **Quando falha / risco:** **dica escrita em arte é impossível de localizar** sem regerar o asset. Para um produto obrigatoriamente PT-BR + EN, texto dentro de ilustração significa duas versões de cada peça, para sempre. **Risco de sistema, não de tela.**
- **Classificação:** LIMÍTROFE

### Replika e Any Distance — o companheiro fotorrealista e o mascote de canto
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URLs Mobbin:**
  - Replika: https://mobbin.com/screens/48299c2c-f8e9-4c15-8481-ff575ae672f0
  - Any Distance: https://mobbin.com/screens/6841981c-d657-487d-bcfe-a37ed7d267a9
- **Estrutura (Replika):** ícone de calendário (canto sup. esq.) → **pílula central com `Sammie` em bold e `Your Friend` em cinza menor abaixo** → engrenagem (dir.) → **avatar humano 3D em pé, corpo inteiro, num quarto renderizado** com estante, planta e tapete → **campo `Talk to me`** na base
- **Estrutura (Any Distance):** fundo preto → **ícone de linha verde-limão** → **manchete bold `Great to see you!`** → **linha de contexto com dois ícones nus:** `🌡 87°F` e `☁ Cloudy` → **mascote (gato de boné e óculos) pequeno, na base, parcialmente atrás dos controles** → campo de seleção de atividade + **pílula vermelha `⏱ 1h ›`** → **botão branco pílula `Start`** → tab bar de 3 ícones nus
- **Copy literal:** Replika: "Sammie" · "Your Friend" · "Talk to me" — Any Distance: "Great to see you!" · "87°F" · "Cloudy" · "Treadmill Walk" · "1h" · "Start"
- **O mecanismo:** Replika mostra a **pílula de identidade** — nome + relação declarada (`Your Friend`), empilhados, no topo centralizado. Solução mais compacta para "onde ficam nome, título e estado": duas linhas numa pílula flutuante, sem ocupar área da cena. Any Distance mostra o inverso: **o mascote como assinatura de canto**, presença de marca sem competir com a ação.
- **Variação entre apps:** Replika é o único com **relação explicitamente nomeada em texto**; Any Distance é o único onde o personagem é **deliberadamente secundário**.
- **Quando falha / risco:** o quarto renderizado do Replika exige produção 3D pesada e cria expectativa de fidelidade que a estética retrô/8-bit não deve tentar igualar. O mascote de canto do Any Distance corre o risco oposto: tão pequeno que deixa de ser vínculo e passa a ser logotipo.
- **Classificação:** ambos PADRÃO

### Convergência e divergência — Dossiê 5

- **Convergência (6+ apps):** **três invariantes.** (a) **Sombra elíptica de contato sob o personagem** — Finch, Yazio, Abode, Tolan, BitePal. É o que faz a criatura pousar num lugar em vez de flutuar, e é o detalhe mais consistente do dossiê; (b) **o nome próprio aparece imediatamente abaixo ou acima do personagem, nunca longe dele** — `Caramel`, `Sammie`, `Alex`, `Lee`; (c) **estado sinalizado sem texto**, por coração flutuante (Finch), corações preenchidos (BitePal), barra com ícone (Abode) ou adereço (Ahead) — **nenhum app do dossiê escreve "seu pet está feliz"**.
- **Divergência — e qual é a escolha real:** **personagem em tela cheia (Tolan, Replika) vs. personagem em cabeçalho fixo com dados rolando (BitePal, Ahead, Alan).** A escolha real é **qual é a ação principal do app.** Se a ação é *conversar*, o personagem pode ser a tela toda, porque ele é a interface. Se a ação é *cumprir tarefas*, a lista tem de estar visível, e o personagem vira cabeçalho. **A arquitetura declarada do Soulmon — pet fixo, lista rolando embaixo — é o lado certo desta divisão, e o BitePal é a execução mais próxima.** O que os apps de tela cheia oferecem não é a arquitetura: é o vocabulário de presença (escala, sombra, partículas, chrome mínimo) para aplicar dentro da área fixa.

---

# §7 — DOSSIÊ 6: CELEBRAÇÃO DE MARCO

> Dividido nas duas categorias pedidas: celebração que faz **pausar** (6A) e toast que
> **passa batido** (6B).

## 6A — Celebração que faz PAUSAR (modal, bloqueia, exige gesto para sair)

### Duolingo — Emblema numerado + data + reivindicação de recompensa
- **Plataforma / data:** iOS · **data visível na tela: `DEC 6, 2025`**
- **URL Mobbin:** https://mobbin.com/screens/6e64c8e4-fabb-471b-b515-a3c87be4ba99
- **Estrutura da tela, de cima para baixo:**
  1. **`×` (esquerda) e ícone de compartilhar (direita)** — as duas saídas, ambas no topo
  2. **Ilustração de emblema grande:** o mascote em versão boxeadora, com luvas, dentro de uma **explosão radial amarela**, e **o numeral `30` em display branco muito grande sobreposto** na base do emblema
  3. **Pílula amarelo-clara com a data em caixa alta:** `DEC 6, 2025`
  4. **Duas linhas de texto bold, centralizadas**
  5. Vazio · **Botão azul pílula de largura total, caixa alta:** `CLAIM REWARD`
- **Copy literal:** "DEC 6, 2025" · "You earned the Perfect Week achievement by completing 30 Perfect Weeks!" · "CLAIM REWARD"
- **O mecanismo:** **a data transforma o evento em registro.** Estampar `DEC 6, 2025` faz da conquista um item de histórico datado, não um parabéns genérico — e é isso que a torna colecionável depois. `CLAIM REWARD` faz o trabalho de conversão: em vez de encerrar o modal (ação neutra), a pessoa executa uma ação de ganho. **`Perfect Week` é exatamente a família do selo que o Soulmon está criando.**
- **Variação entre apps:** o único que **numera a conquista dentro da própria arte do emblema** e o único cujo botão de saída é uma **reivindicação**.
- **Quando falha / risco:** `CLAIM REWARD` promete um segundo momento. Recompensa irrisória encolhe a celebração retroativamente.
- **Classificação:** PADRÃO

### Me+ — Celebração com uma segunda tela por baixo, e um anúncio atrás
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/7e18222c-0b0b-4277-83dc-c56745a3491c
- **Estrutura da tela, de cima para baixo:**
  1. **Tela anterior visível e escurecida** no topo — inclusive **um card promocional e uma linha de tarefa** ainda legíveis atrás
  2. **Raios radiais brancos** emanando do centro
  3. **O pet (galinha branca) sentado sobre uma moeda de ouro grande com uma gema no centro** — composição empilhada, com **quatro estrelas de brilho** em volta
  4. **Folha roxa de cantos superiores arredondados** subindo pela base
  5. **Manchete bold branca** + duas linhas de corpo centralizadas
  6. **Botão preto pílula de largura total:** `Collect my Gold Badge`
- **Copy literal:** "Legendary day!" · "Every task completed today is a testament to your dedication." · "Collect my Gold Badge" · *(atrás, esmaecido: "Know yourself" · "3 Min Depression Test" · "Start Now")*
- **O mecanismo:** **hierarquia de raridade nomeada.** "Legendary" importa emprestando o vocabulário de raridade de jogos — a palavra carrega uma escala implícita que o app não precisa explicar. E "Collect my Gold Badge" em primeira pessoa faz o usuário enunciar a posse.
- **Variação entre apps:** o único que **mantém a tela anterior parcialmente legível** atrás da celebração — o que preserva contexto, mas deixa **um card promocional visível durante o momento de conquista**, contaminando a celebração com oferta.
- **Quando falha / risco:** "Legendary" para "completou as tarefas de hoje" é inflação lexical. Se um dia normal é lendário, não sobra vocabulário para o marco de 5 estágios de evolução. **Escala de raridade gasta rápido se você começa no topo.**
- **Classificação:** LIMÍTROFE

### Ahead — Celebração que entrega um colecionável nomeado, com citação
- **Plataforma / data:** iOS · data não exposta pelo MCP · *app pequeno*
- **URL Mobbin:** https://mobbin.com/screens/6cac800a-3795-4460-9d1b-46931c43c838
- **Estrutura da tela, de cima para baixo:**
  1. **Tela anterior visível nas bordas** — pílula `Calm Insecurity` com `13%`, contador de chama `1`, avatar, trilha de níveis numerada
  2. **Card branco arredondado centralizado**, com `×` no canto superior direito
  3. **Confete em formas geométricas de cores variadas** — espalhado **dentro e fora** dos limites do card, inclusive sobre a tab bar
  4. Dentro do card: linha de introdução em cinza pequeno → **nome da conquista em bold grande, duas linhas** → **bloco de citação em cinza-claro** com atribuição → **ilustração do esquilo com um ovo decorado** → **link sublinhado pequeno** → **botão roxo pílula de largura total**
  5. Tab bar de 5 itens visível na base, com confete caindo sobre ela
- **Copy literal:** "You unlocked a travel buddy:" · "The confident chipmunk!" · "Robert Breault said:" · "We all have our limitations, but when we listen to our critics, we also have theirs." · "Share with loved ones" · "Let's continue together!"
- **O mecanismo:** a celebração **entrega um objeto, não um elogio.** "You unlocked a travel buddy" cria um item que vai para uma coleção — o que liga o dossiê 6 ao 7 e faz a celebração render depois do modal. `Let's continue together!` na primeira pessoa do plural é a copy mais alinhada a "avatar que evolui COM o usuário" de todo o arquivo.
- **Variação entre apps:** o único que **entrega um personagem nomeado** como recompensa, o único que **inclui uma citação de terceiro**, e o único com confete **estourando os limites do container**.
- **Quando falha / risco:** **quatro elementos competindo** (nome, citação, ilustração, dois CTAs). A citação pede leitura reflexiva no momento de pico emocional — dois modos cognitivos incompatíveis na mesma tela.
- **Classificação:** PADRÃO

### Alan — Celebração de item cosmético, sem número nenhum
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/c7d423cb-47fa-419a-835d-685e1f3d75a6
- **Estrutura da tela, de cima para baixo:**
  1. Fundo azul-noite quase preto, **sem chrome nenhum**
  2. **Linha em caixa alta pequena, centralizada, no topo**
  3. **Raios radiais claros** emanando do centro
  4. **A criatura (urso azul) usando os óculos recém-obtidos**, dentro de uma **moldura ovalada rosa** — o item já vestido, não exibido isolado
  5. **Nome do item em bold branco** + linha de corpo em cinza-claro
  6. **Botão roxo pílula de largura total:** `Continue`
- **Copy literal:** "YOU GOT A NEW BADGE, CONGRATS!" · "A Fire Look" · "Your friends will wonder where you got that beauty..." · "Continue"
- **O mecanismo:** **prova pelo uso.** Mostrar a criatura **já usando** o item entrega imediatamente o único valor que um cosmético tem: como fica. E a copy ativa **valor de sinal social** sem exigir compartilhamento — a projeção da reação alheia é o próprio prêmio. **Zero números**, o que a torna a celebração mais compatível com as regras do Soulmon em todo o dossiê.
- **Variação entre apps:** o único cuja recompensa é **puramente cosmética e já aplicada**, e o único **sem qualquer número, contador ou data**.
- **Quando falha / risco:** "badge" para o que é claramente um item de vestuário é confuso. E projetar inveja de amigos falha em quem usa o app sozinho.
- **Classificação:** PADRÃO

### Weverse e Runna — a celebração como card colecionável, e como confete puro
- **Plataforma / data:** iOS · **Weverse: data visível na tela `Feb 16, 2026`** · Runna: não exposta
- **URLs Mobbin:**
  - Weverse: https://mobbin.com/screens/1b63c5e5-3b3c-4ffe-b9e4-49331149369f
  - Runna: https://mobbin.com/screens/0e8a24e7-31ae-4657-bc16-6ace3abc70ea
- **Estrutura (Weverse):** `×` no canto superior direito → **card vertical de cantos arredondados, quase de tela cheia, em gradiente prateado** → dentro dele, no terço superior, **emblema quadrado em relevo** (arco azul-noite com avião de papel dourado) → rótulo pequeno em caixa alta, parcialmente ocluído por confete → **título em bold de duas linhas** → emoji de festa → **data em cinza pequeno** → **confete em serpentinas e formas coloridas espalhado por toda a tela, inclusive cobrindo o texto**
- **Estrutura (Runna):** **confete caindo do topo em faixa densa** sobre fundo preto → `×` em botão circular escuro (canto sup. dir.) → **dois feixes de holofote** em perspectiva convergindo no centro → **emblema hexagonal cinza-escuro com borda clara**, contendo `1K` em display bold e o logotipo abaixo → **`2:25` em display grande branco** → rótulo `Fastest 1K` em cinza
- **Copy literal:** Weverse: "KAI EYE" *(parcialmente ilegível — coberto por confete)* · "First DM with Daniela Avanzini" · "Feb 16, 2026" — Runna: "1K" · "2:25" · "Fastest 1K"
- **O mecanismo:** Weverse trata a celebração como **card de coleção com acabamento material** (relevo, gradiente prateado) — o modal *é* o item, e por isso já nasce arquivável. Runna faz o oposto: **cenografia de palco** (holofotes convergentes + confete no topo) e **zero copy explicativa** — só o número, a métrica e o emblema. A ausência de frase é uma escolha: o dado fala.
- **Variação entre apps:** Weverse é o único que celebra um **evento social relacional** ("First DM with..."), não desempenho — e o único onde **o confete prejudica a legibilidade do próprio título**. Runna é o único **sem uma única palavra de celebração**.
- **Quando falha / risco:** o confete do Weverse cobrindo o texto é erro de camada. E o minimalismo do Runna só funciona quando a métrica é autoexplicativa; o mesmo tratamento aplicado a "estágio 3 de 5" não seria.
- **Classificação:** ambos PADRÃO *(o confete oclusivo do Weverse: ANTI-PADRÃO)*

### Beli, Tonal e Mindvalley — o padrão-piso, com três saídas diferentes
- **Plataforma / data:** iOS · **Tonal: `February 2, 2026`** · **Mindvalley: `05/07/2026`** · Beli: não exposta
- **URLs Mobbin:**
  - Beli: https://mobbin.com/screens/eca70cca-c42f-4d7b-9cb2-8ba4a2b5dfd3
  - Tonal: https://mobbin.com/screens/3de14c93-eb54-44ef-838d-7e1ccdd45261
  - Mindvalley: https://mobbin.com/screens/25a769b9-2417-4369-a5c1-f6965ca9c027
- **Estrutura (comum):** `×` no topo → **emblema/ilustração centralizada no terço superior** → **título em bold ou serifada** → **1–2 linhas de corpo** → **data** (Tonal, Mindvalley) → **uma única ação**
- **A diferença — que é o achado:**
  - **Beli:** botão branco pílula `Got it!` — **reconhecimento**. Fundo azul-claro degradê, ilustração de chama em linha grossa dentro de moldura quadrada
  - **Tonal:** botão cinza-escuro `SHARE` — **distribuição**. Fundo preto, emblema de anéis concêntricos azuis, sem outra ação
  - **Mindvalley:** **apenas um `×` em botão circular** abaixo do card — **dispensa**. Fundo desfocado mostrando uma grade de outros emblemas atrás; o emblema é um **octógono iridescente com textura de mármore e esfera central**
- **Copy literal:** Beli: "125 week streak!" · "Judy has tried a new spot 125 weeks in a row." · "beli" · "Got it!" — Tonal: "Goal-setter" · "Way to set your Training Goals!" · "February 2, 2026" · "SHARE" — Mindvalley: "Day One" · "Consistency starts with one step. You've completed your first lesson today!" · "05/07/2026"
- **O mecanismo:** **três posturas sobre o que a celebração deve produzir.** `Got it!` encerra e devolve ao fluxo. `SHARE` como única ação assume que o valor é externo — arriscado, porque quem não quer compartilhar fica sem ação afirmativa. O `×` solitário do Mindvalley é o mais interessante: a celebração **não pede nada**, e o desfoque revelando a grade de emblemas atrás transforma o fechar em "voltar para a minha coleção" — a saída *é* a transição para o acervo.
- **Variação entre apps:** Beli celebra **125 semanas** — a maior magnitude do dossiê — com o tratamento mais modesto, o que sugere que a escala do número não escala o tratamento visual. Mindvalley celebra **o primeiro dia** com o emblema mais elaborado do arquivo. **Inversão deliberada: investir a arte mais bonita no marco mais fácil.**
- **Quando falha / risco:** Beli expõe `125 week streak` — número alto que, se zerar, destrói mais do que qualquer celebração construiu. **ANTI-PADRÃO central: quanto maior o número que pode zerar, maior o dano potencial.**
- **Classificação:** Mindvalley — PADRÃO · Tonal — PADRÃO · Beli — ANTI-PADRÃO *(pelo streak exposto; o tratamento visual em si é PADRÃO)*

### Deepstash — Celebração de conquista NÃO obtida
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/c3d6f620-b9e0-4778-83ff-b8c7736a7b7c
- **Estrutura da tela, de cima para baixo:**
  1. `×` (esquerda) + **título em caixa alta espaçada: `PONDER &'S ACHIEVEMENT`** *(o `&'S` parece defeito de interpolação de nome — registrado como está)*
  2. **Card branco de cantos arredondados**, com **ícone de microfone/pin** no canto superior direito
  3. **Ilustração circular em fundo verde-claro:** um arqueiro de bigode e chapéu com arco
  4. **Nome da conquista em bold** + **condição em cinza pequeno** + **linha de reforço em preto, isolada**
  5. **Fora do card, em cinza pequeno centralizado:** `You haven't unlocked this yet.`
  6. **Botão cinza-escuro pílula de largura total:** `Continue`
- **Copy literal:** "PONDER &'S ACHIEVEMENT" · "Sharpshooter" · "Get to day 7 of your reading streak" · "Now we are talking." · "You haven't unlocked this yet." · "Continue"
- **O mecanismo:** **prévia do prêmio.** Mostrar a arte completa e a copy de celebração de algo ainda não conquistado cria desejo concreto em vez de abstrato — a pessoa sabe exatamente o que ganha. Mesmo mecanismo da silhueta (dossiê 1), aplicado a conquistas.
- **Variação entre apps:** o único do dossiê que **usa o container de celebração para um estado não-conquistado**. Meio caminho para o dossiê 7, e o achado mais transferível para uma dex de 11 formas.
- **Quando falha / risco:** exibir a arte completa **queima a surpresa**. Comparar com Reddit e Withings (dossiê 7), que mostram só a silhueta: **prévia integral compra desejo e gasta revelação.**
- **Classificação:** LIMÍTROFE

## 6B — Toast que PASSA BATIDO (não bloqueia, não exige gesto)

**Achado honesto: o Mobbin tem quase nada disso.** A busca por celebração retornou 10
modais e **um único toast**.

### Alma — Toast de sistema no topo, anunciando mudança de estado
- **Plataforma / data:** iOS · data não exposta pelo MCP · *app pequeno*
- **URL Mobbin:** https://mobbin.com/screens/ea9f1fd5-652e-4cb3-afb6-7a6a30e53d78
- **Estrutura da tela, de cima para baixo:**
  1. **Faixa preta de cantos arredondados, largura quase total, colada no topo** — **cobrindo a barra de status**: **título em bold branco** + **linha de corpo em cinza claro**. Sem ícone, sem botão, sem fechar
  2. Abaixo, a home intacta: card branco com `Baby Carrot`, ícone de compartilhar, **emoji de cenoura + `3` em display marrom grande**, régua com `Today`
  3. Linha com **barra de progresso e nó circular com `✓` na ponta direita**
  4. Card de hábito com **pílula amarela `🏆 Record`**
  5. **Dois cards lado a lado:** `Vacation mode` (árvore de Natal + `Get started ›`) e `Streak saves` (boia + **`0`** + `How it works ⓘ`)
  6. Seção `Challenges` com `🎁 7-Day Challenge` entrando pelo scroll
- **Copy literal:** "Vacation Ended!" · "Your streak is now active again." · "Baby Carrot" · "3" · "Today" · "Track one item to keep your streak" · "Baby Carrot" / "3 days tracked" · "Record" · "Vacation mode" · "Get started ›" · "Streak saves" · "0" · "How it works" · "Challenges" · "7-Day Challenge"
- **O mecanismo:** **custo de interrupção zero.** O toast informa uma transição de estado sem exigir gesto, sem cobrir conteúdo útil e sem esperar resposta. Registro correto para eventos de **baixa carga afetiva mas alta necessidade de informação**.
- **Variação entre apps:** único toast do dossiê. E os dois cards `Vacation mode` / `Streak saves` são o achado paralelo: **a mecânica de descanso exposta como par de cards na home**, com contador de escudos — a expressão mais próxima do sistema de escudos do Soulmon no arquivo.
- **Quando falha / risco:** `Streak saves 0` é número exposto no zero — comunica escassez no lugar de segurança. **Se o Soulmon expõe escudos, expor "0 escudos" é criar ansiedade onde a mecânica existia para removê-la.**
- **Classificação:** PADRÃO *(o toast) · o contador `0` de escudos: LIMÍTROFE*

### O que falta em 6B — declarado

**Não encontrado no Mobbin:** toast de conquista in-line (a linha da tarefa se marcando e
soltando micro-animação), snackbar de celebração com desfazer, badge aparecendo em contador
sem modal, confete disparado sobre a lista sem bloquear. **Leitura do vazio:** o Mobbin
cataloga telas, e celebração não-bloqueante é frequentemente **um estado transitório de
100–800 ms** que a captura estática não pega. Limite do acervo, provavelmente sem solução
por esta ferramenta — captura de vídeo ou observação direta do app seria o caminho.

### Convergência e divergência — Dossiê 6

- **Convergência (7+ apps):** **a composição é uma só, repetida quase sem variação** — (1) `×` no topo, (2) **emblema/ilustração centralizado no terço superior**, (3) **nome da conquista em bold**, (4) 1–2 linhas de corpo, (5) **um botão de largura total na base**. Weverse, Duolingo, Runna, Beli, Tonal, Mindvalley, Alan, Deepstash e Ahead — todos. E **4 de 11 estampam a data literal** na peça (Duolingo, Weverse, Tonal, Mindvalley), o que converte celebração em registro arquivável.
- **Divergência — e qual é a escolha real:** **o que o botão de saída faz.** Quatro posturas, e a escolha revela o que o app acha que a celebração é: `Got it!` (Beli) = *informação*. `SHARE` (Tonal) = *distribuição*, o valor é externo. `CLAIM REWARD` (Duolingo) / `Collect my Gold Badge` (Me+) = *transação*, a conquista se converte em recurso. `Let's continue together!` (Ahead) = *relação*, a conquista reafirma o vínculo. **Para um produto cuja tese é "um avatar que evolui COM o usuário", a quarta postura é a única coerente — e o Ahead é o único app do arquivo que a executa.** As outras três tratam a conquista como dado, como conteúdo social ou como moeda.

---

# §8 — DOSSIÊ 7: COLEÇÃO / DEX / ÁLBUM

> A pergunta central deste dossiê: **como mostrar o que ainda NÃO foi obtido.** O acervo
> tem **seis técnicas distintas**, o que é incomum — ninguém convergiu.

### Finch — Dex por categoria, com `?` e número de catálogo no item obtido
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/83509751-7c83-4eeb-ba04-f9e3c37689d3
- **Estrutura da tela, de cima para baixo:**
  1. **Faixa superior esmaecida** com estado anterior legível: `9 day streak` / `Longest self-care streak ever!`
  2. Cabeçalho: menu (esq.), **`Lee` em bold centralizado** (nome do pet), compartilhar e lápis (dir.)
  3. Rótulo de seção em cinza: `Lee's collection`
  4. **Card branco com cinco "presilhas" marrons no topo** — metáfora de caderno de anéis. Dentro dele:
     - Título `Micropets` + ícone `ⓘ`
     - **Três slots quadrados em linha:** o primeiro é **card vermelho com a criatura ilustrada e `#25` em cinza no canto superior direito**; os dois seguintes são **quadrados cinza-claro vazios com um `?` cinza-médio grande centralizado**
     - **Rodapé marrom do card com `1 / 60 ›`**
  5. **Segundo card idêntico:** título `Discovery` + **grade 3×N de quadrados com ícone + nome + fração própria**
  6. **Tab bar de 6 ícones nus** com rótulo sob cada um
- **Copy literal:** "Lee" · "Lee's collection" · "Micropets" · "#25" · "?" · "1 / 60" · "Discovery" · "Food" · "2 / 114" · "Drinks" · "1 / 25" · "Books" · "1 / 52" · "Home" · "Quests" · "Shop" · "Friends" · "Bag" · "Lee"
- **O mecanismo:** (a) **`?` em vez de cadeado** — cadeado comunica *bloqueio* (algo te impede); `?` comunica *desconhecido* (algo a descobrir). Para uma coleção de criaturas, curiosidade é o motor certo, e o cadeado convoca o motor errado; (b) **`#25` no item obtido** implica um catálogo numerado maior que o visível — uma linha de texto que insinua um mundo; (c) **frações por subcategoria** criam múltiplas frentes de progresso, e é matematicamente impossível estar em zero em todas.
- **Variação entre apps:** o único que usa **`?` em vez de cadeado ou silhueta**, o único com **número de catálogo**, e o único cujo container tem **metáfora material** (caderno de presilhas).
- **Quando falha / risco:** `1 / 60` e `2 / 114` são frações **esmagadoramente desfavoráveis**. Podem ler como "você tem quase nada" em vez de "há muito por explorar" — a diferença depende do enquadramento e do ritmo de aquisição.
- **Classificação:** PADRÃO

### Reddit — Silhueta branca sem detalhe + barra de progresso só onde há progresso
- **Plataforma / data:** iOS · **datas visíveis nos itens obtidos: `29/10/24`**
- **URL Mobbin:** https://mobbin.com/screens/8b0cbabc-fd6c-4e8d-abd6-dfd8f1828714
- **Estrutura da tela, de cima para baixo:**
  1. Seta `←`, título `Exploration`, `···`
  2. **Grade de 2 colunas**, cada célula com **emblema circular grande + nome + linha de estado**:
     - **Linha 1 (obtidos):** dois emblemas **coloridos e detalhados**, cada um com **nome em bold** e **a data em cinza abaixo** (`29/10/24`)
     - **Linha 2 (em progresso / bloqueados):** **a mesma forma de emblema, agora em branco quase liso**, com apenas sombreado suave sugerindo volume — **nenhum ícone interno, nenhuma silhueta do conteúdo**. **Um deles tem barra de progresso laranja fina com `3/10 shares`; o outro não tem barra nenhuma**
     - **Linha 3:** dois emblemas brancos com nome e **nenhuma barra** — degraus futuros da mesma família
- **Copy literal:** "Exploration" · "Hometown Hero" · "29/10/24" · "New Share" · "29/10/24" · "Sharing Enthusiast" · "3/10 shares" · "Sharing Advocate" · "Sharing Pro" · "Sharing Legend"
- **O mecanismo:** **o branco sem detalhe é mais forte que a silhueta.** Ao remover *inclusive* o contorno do conteúdo, o Reddit preserva a surpresa integral e ainda comunica "existe algo aqui" pela forma do emblema. E a decisão mais sutil é a **barra de progresso seletiva**: só o item em que a pessoa já andou mostra `3/10`; os degraus seguintes não mostram `0/25` e `0/100`. **Ausência de barra evita exibir zeros em série** — e zeros em série é a maneira mais eficaz de desanimar alguém numa tela de coleção.
- **Variação entre apps:** o único que **suprime a barra nos itens em zero** (o Tripadvisor faz o oposto), e o único que **datou os obtidos** dentro da grade. A família nomeada em degraus (`Enthusiast → Advocate → Pro → Legend`) revela a escada sem revelar a arte.
- **Quando falha / risco:** branco liso demais fica indistinguível de estado de carregamento (skeleton). Com quatro células brancas iguais lado a lado, a tela pode ler como "ainda carregando".
- **Classificação:** PADRÃO

### Me+ — Selo em relevo com `Not obtained` explícito
- **Plataforma / data:** iOS · **datas visíveis nos obtidos: `Mar.18,2026`**
- **URL Mobbin:** https://mobbin.com/screens/c4485d6d-f960-41f8-89df-4bb4d8f668c5
- **Estrutura da tela, de cima para baixo:**
  1. Seta `←` e **título `Achievement Badges` em bold grande**, alinhado à esquerda
  2. **Grade de 2 colunas de cards brancos** com sombra suave:
     - **Obtidos:** **selo em relevo metálico** (um bronze arredondado, um dourado em estrela recortada) → **data em cinza pequeno** → **nome em bold preto**
     - **Não obtidos:** **o mesmo selo estampado em branco sobre fundo branco** — legível apenas pelo relevo e por uma sombra mínima → **`Not obtained` em cinza claro** → **nome em cinza médio**
- **Copy literal:** "Achievement Badges" · "Mar.18,2026" · "Weekly Winner" · "Mar.18,2026" · "Three-Peat" · "Not obtained" · "Two-Week Turn" · "Not obtained" · "Habit Starter" · "Not obtained" · "Month Master" · "Not obtained" · "Double Down"
- **O mecanismo:** **desambiguação por texto.** `Not obtained` remove toda interpretação. O custo é a repetição: a frase aparece quatro vezes na área visível, e o olho lê "não, não, não, não". **Legibilidade comprada com acúmulo de negativa** — num produto que não quer cobrar, é um preço alto.
- **Variação entre apps:** o único que **rotula verbalmente o estado bloqueado**, e o único cujo tratamento do bloqueado é **relevo em branco**.
- **Quando falha / risco:** dois problemas somados: repetição de `Not obtained` como ruído negativo, e **contraste insuficiente** — o estado bloqueado depende de sombra sutil, que desaparece em tema claro sob luz forte e não sobrevive a preferências de alto contraste. Risco real de acessibilidade.
- **Classificação:** LIMÍTROFE

### Withings Health Mate — Cadeado sobre a arte desfocada, e `Unlocked 0/30`
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/300ba4e5-c007-459c-a33c-745eb5b290de
- **Estrutura da tela, de cima para baixo:**
  1. Seta `‹` e **título `Badges` em bold grande**
  2. **Abas de categoria em pílula:** `Distance` (ativa) · `Steps` · `Elevation` · `Weight`
  3. Rótulo de seção `Distance` + **`Unlocked 0/30`** em cinza
  4. **Grade de 3 colunas de cards retangulares verticais**, cada um com: **a arte do emblema desfocada ao ponto de virar campo de cor** (cada card com paleta própria — a cor sobrevive, a forma não) → **ícone de cadeado em círculo branco no canto superior direito** → **nome do lugar em bold escuro** e **a distância em cinza** no rodapé
- **Copy literal:** "Badges" · "Distance" · "Steps" · "Elevation" · "Weight" · "Unlocked 0/30" · "Marathon" · "42.0 km" · "Loch Ness" · "100.0 km" · "Bahamas" · "170.0 km" · "Suez Canal" · "200.0 km" · "O'ahu Island" · "330.0 km" · "Galapagos" · "410.0 km" · "Lake Titicaca" · "510.0 km" · "Jamaica" · "620.0 km" · "Lake Baikal" · "720.0 km"
- **O mecanismo:** **desfoque preserva a cor e mata a forma** — o card mantém identidade visual sem revelar a arte. Tecnicamente elegante: um único asset serve aos dois estados, sem produzir versão silhueta. E **nomear o alvo em quilômetros** torna cada item uma meta concreta e ordenável.
- **Variação entre apps:** o único que usa **desfoque da arte real**, e o único que **ordena a coleção por dificuldade crescente explícita** (42 km → 720 km), transformando a grade em escada.
- **Quando falha / risco:** **`Unlocked 0/30` no topo de uma grade inteiramente cadeada** é o pior estado inicial possível de uma coleção. Somado ao cadeado (que diz *bloqueado*, não *por descobrir*) e a 30 células idênticas, o efeito é desânimo, não convite. **Comparado ao Finch — 1 obtido, um `?`, fração por categoria — a diferença de sensação é enorme com quase a mesma estrutura.**
- **Classificação:** ANTI-PADRÃO *(pelo estado zero exposto e pelo cadeado; a técnica de desfoque, isolada: PADRÃO)*

### Replika — Coleção de traços com preço na célula
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/658cff82-b075-476c-8709-3a3ff069114b
- **Estrutura da tela, de cima para baixo:**
  1. Seta `‹` em botão circular, **título `Traits`**, e **duas pílulas de saldo à direita:** `💎 36` e `🪙 535`
  2. **Grade de 3 colunas**, cada célula com: **um objeto 3D renderizado dentro de uma esfera de vidro translúcida** (geometria e cor próprias por traço) → **nome do traço em bold branco acima** → **pílula de preço no canto inferior esquerdo**
- **Copy literal:** "Traits" · "36" · "535" · "Confident" · "Shy" · "Energetic" · "Mellow" · "Caring" · "Sassy" · "Practical" · "Dreamy" · "Artistic" · "Logical" · "8" · "80"
- **O mecanismo:** **forma distinta como identidade.** Cada traço tem geometria própria (angular = `Logical`, orgânica = `Caring`, explosiva = `Energetic`), então a grade é legível sem ler os nomes — **a forma não precisa de tradução**, o que importa num produto PT-BR/EN. E encapsular tudo em esferas de vidro idênticas dá unidade de sistema a dez artes diferentes.
- **Variação entre apps:** único que **precifica cada item da coleção na própria célula** e único onde o estado "não obtido" é **"comprável"**, não "bloqueado".
- **Quando falha / risco:** coleção precificada em duas moedas é loja disfarçada de dex. Colide com "dinheiro nunca compra vantagem de progresso".
- **Classificação:** ANTI-PADRÃO *(pela precificação; a distinção por forma geométrica, isolada: PADRÃO)*

### Duolingo — Grade mensal com o não obtido em cinza monocromático
- **Plataforma / data:** iOS · data não exposta pelo MCP; a tela organiza por `2024 Badges` e `2023 Badges`
- **URL Mobbin:** https://mobbin.com/screens/c305d492-71c0-433b-99e7-71309ec14278
- **Estrutura da tela, de cima para baixo:**
  1. Seta `←` e título `Monthly Badges` (esmaecido, em transição de scroll)
  2. **Cabeçalho de seção em bold: `2024 Badges`**
  3. **Grade 3×4** — um emblema circular por mês, com **o nome do mês abaixo**:
     - **Obtidos:** círculo em **cor saturada com ícone em relevo** — **nome do mês em bold preto**
     - **Não obtidos:** **o mesmo círculo em cinza muito claro, com o ícone visível mas dessaturado** — **nome do mês em cinza médio**
  4. **Cabeçalho `2023 Badges`** e o início da grade do ano anterior
- **Copy literal:** "Monthly Badges" · "2024 Badges" · "January" … "December" · "2023 Badges"
- **O mecanismo:** **grade fechada e datada.** Doze slots por ano é conjunto finito e conhecido, o que torna a lacuna visível e permanente — o mês perdido fica cinza para sempre. Motivador para quem está no mês corrente, e **registro fossilizado de falha** para todos os anos anteriores.
- **Variação entre apps:** o único **indexado por calendário**, e o único que **mostra o ícone do item não obtido** (só dessaturado).
- **Quando falha / risco:** para o Soulmon é ANTI-PADRÃO direto. Uma grade de meses cinza é histórico permanente de ausências — a versão anual da streak que zera. Colide com "nada pune por inatividade".
- **Classificação:** ANTI-PADRÃO

### Runna, Apple Games e Tripadvisor — três formas de exibir o zero
- **Plataforma / data:** iOS · **Runna: `09/08/2025` e `09/09/2025` nos obtidos** · outras não expostas
- **URLs Mobbin:**
  - Runna: https://mobbin.com/screens/93b58dd0-6e47-425c-b6e6-afda4c52ffe4
  - Apple Games: https://mobbin.com/screens/c2089331-e1c4-4387-85aa-3a44db91c4ea
  - Tripadvisor: https://mobbin.com/screens/c697d06b-37b6-4c3b-9f2f-c28c84bdfc2d
- **Estrutura (Runna):** seta `←`, título `Achievements` → `All Trophies` em bold → **cabeçalho de grupo `Plan Runs Complete`** → **card branco com grade 3×2 de ícones circulares:** o primeiro **teal saturado com etiqueta `New` em pílula preta** e data; os cinco seguintes **o mesmo ícone em teal muito claro (fantasma)** com rótulo e **um travessão `-` no lugar da data** → segundo grupo idêntico em azul
- **Estrutura (Apple Games):** seta `←`, título `Achievements` → **cabeçalho `Locked`** → **grade 2×N de cards azul-escuros**, cada um com **um círculo escuro contendo o percentual de jogadores que já conquistaram** + **nome em bold branco** + **condição em cinza** → tab bar em pílula azul
- **Estrutura (Tripadvisor):** seta `‹`, título `Your Achievements` → **carrossel horizontal de conquistas em progresso** com fração sob cada uma e **barra de scroll visível** → **cabeçalho `Restaurants`** → **novo carrossel** com **cadeado em círculo cinza sobre disco de cor pastel** + fração + nome + condição → link `Frequently asked questions ›`
- **Copy literal:** Runna: "Achievements" · "All Trophies" · "Plan Runs Complete" · "New" · "First run" · "09/08/2025" · "10 runs" · "-" · "50 runs" · "100 runs" · "500 runs" · "1000 runs" · "Plan Strength Workouts Complete" · "First session" · "09/09/2025" — Apple Games: "Achievements" · "Locked" · "10%" · "Not So Green" · "Complete 10 missions." · "2%" · "For science" · "Knock over 1000 scientists." · "2%" · "Veteran" · "Complete 40 missions." · "2%" · "Mix 'n' match" · "Equip 50 unique gadget combos." — Tripadvisor: "Your Achievements" · "Experience Explorer" · "1/5" · "Write 5 experience reviews" · "Beach Lover" · "0/3" · "Write 3 beach reviews" · "Museum Bu..." · "0/3" · "Restaurants" · "Restaurant Explorer" · "0/5" · "Write 5 restaurant reviews" · "Fine Dining Fan" · "0/3" · "Cafe Collect..." · "0/3"
- **O mecanismo:** **três posturas sobre o zero.** Runna substitui a data por **um travessão `-`** — a lacuna existe mas é tipograficamente silenciosa, muito menos agressiva que `0/10`. Apple Games troca progresso por **raridade** (`2%`): não diz o que falta, diz quão exclusivo é — desloca o eixo de dívida para status. Tripadvisor é o contra-exemplo: **`0/3` repetido cinco vezes na área visível**, mais cadeado, mais barra vazia.
- **Variação entre apps:** Runna é o único que usa **`-` como placeholder de data**; Apple Games é o único com **percentual de raridade populacional**; Tripadvisor é o único que empilha **cadeado + fração zero + barra vazia** simultaneamente.
- **Quando falha / risco:** o `2%` do Apple Games só funciona quando o número é baixo: `2%` é prestigioso, `73%` seria humilhante — a mesma mecânica se volta contra o usuário quando o item é comum.
- **Classificação:** Runna — PADRÃO · Apple Games — PADRÃO · Tripadvisor — ANTI-PADRÃO

### GoHenry — Grade sem estado bloqueado, com a recompensa em XP na célula
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/565af667-af1d-4ec2-93b8-ab4dd478b8f7
- **Estrutura da tela, de cima para baixo:**
  1. Seta `‹`, título `Awards` centralizado, **pílula amarela `Earn XP` no canto superior direito** — o CTA fica no cabeçalho
  2. **Grade de 2 colunas**, células com: **emblema ilustrado grande em cores pastel saturadas** → **nome em bold escuro centralizado** → **`+ XX XP` em cinza abaixo**
- **Copy literal:** "Awards" · "Earn XP" · "First mission" · "+ 20 XP" · "10 missions" · "+ 20 XP" · "Reach 100 XP" · "+ 20 XP" · "Reach 250 XP" · "+ 20 XP" · "Money basics" · "+ 240 XP" · "Jobs & earning" · "+ 160 XP"
- **O mecanismo:** **remover o estado bloqueado inteiramente.** Sem cadeado, sem cinza, sem fração — a grade lê como **catálogo de oportunidades**, não como inventário de ausências. A informação exposta é o valor de cada item, o que a torna acionável: a pessoa escolhe pelo retorno. **Inversão mais radical do dossiê, e a única que não exibe nenhuma forma de zero.**
- **Variação entre apps:** o único **sem qualquer diferenciação visual entre obtido e não obtido**, e o único que **exibe a recompensa em vez do progresso**. É um app para crianças e adolescentes, o que provavelmente explica a decisão — mas o mecanismo não depende da faixa de idade.
- **Quando falha / risco:** sem estado, a pessoa **não sabe o que já tem** — a grade perde a função de troféu e vira lista de tarefas. Serve para descoberta, não para orgulho.
- **Classificação:** LIMÍTROFE

### A tela de detalhe de um item — resolvida no 2º passe

Os três detalhes de item (**Finch**, **Opal**, **Tolan**) estão descritos na §15.3 do
adendo, porque foram encontrados no segundo passe. Resumo de ponteiros:

| Achado | Por que importa | URL |
|---|---|---|
| **Finch — ficha do Micropet** | Catálogo (`#25`) + estágio (`BABY`) + pronome (`She/Her`) + temperamento (`Gentle Nature`) + lore + `Hatched on Aug 31 2025`. **Modelo de referência direto para a ficha de criatura do Soulmon** | https://mobbin.com/screens/3c4831d0-c18a-4153-ae02-1767cafbd40f |
| **Opal — ficha da gema** | `Owned by 23%` — raridade populacional, imune ao comportamento do usuário. Resolve o dossiê 8 | https://mobbin.com/screens/b71b0e4d-5c08-415f-8342-2ce95edc86ce |
| **Tolan — ficha de personalidade** | Seletor `You / Tolan` — a mesma ficha para usuário e criatura. Expressão estrutural de "evolui COM o usuário" | https://mobbin.com/screens/5c090ad4-b89d-4f66-beaf-c38217b1a4a4 |
| **Deepstash — conquista não obtida** | Proxy de como uma ficha bloqueada se pareceria: arte completa + `You haven't unlocked this yet.` | https://mobbin.com/screens/c3d6f620-b9e0-4778-83ff-b8c7736a7b7c |

Para contraste, as fichas de ativo do acervo (OpenSea, OKX, Crypto.com, Uniswap, Glow) usam
**tabela de traços com percentual de raridade** em vez de lore — ver §15.3.

### Convergência e divergência — Dossiê 7

- **Convergência (7+ apps):** **grade de 2 ou 3 colunas com célula = emblema + nome + linha de estado**, sempre nessa ordem vertical, é praticamente lei. E **o agrupamento por categoria com cabeçalho de seção** aparece em 6 dos 10 (Finch, Withings via abas, Runna, Tripadvisor, Duolingo por ano, Apple Games por estado) — ninguém apresenta uma coleção grande como lista única.
- **Divergência — e qual é a escolha real:** **como representar o não obtido.** **Seis técnicas distintas** no acervo: `?` (Finch) · branco sem detalhe (Reddit) · relevo branco + rótulo (Me+) · desfoque da arte real (Withings) · fantasma dessaturado (Runna, Duolingo) · cadeado (Withings, Tripadvisor) · **e nenhum estado (GoHenry)**. A escolha real é sobre **o que você quer que a pessoa sinta diante do vazio**: cadeado produz *bloqueio* (algo me impede), cinza produz *falta* (eu não consegui), desfoque e branco produzem *mistério* (há algo ali), `?` produz *curiosidade* (o que será?). **Para uma dex de 11 formas de criatura em que a tese proíbe punição, o eixo curiosidade (`?` do Finch, branco do Reddit) é o único coerente — e o par cadeado + `0/30` do Withings é o que ativa exatamente o afeto errado.**

---

# §9 — DOSSIÊ 8: PRESTÍGIO PURAMENTE COSMÉTICO

> **Diagnóstico de fundo, que vale mais que os achados:** de 10 telas retornadas na busca
> original, **7 eram contador de streak** — o mecanismo que o Soulmon proíbe. O mercado
> quase não faz prestígio sem número que desce. Os anti-padrões (8B) são o produto
> principal deste dossiê.

## 8A — Os padrões reais (prestígio sem número decrescente)

### Opal — `Owned by X%`: raridade populacional
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin (ficha):** https://mobbin.com/screens/b71b0e4d-5c08-415f-8342-2ce95edc86ce
- **URL Mobbin (perfil):** https://mobbin.com/screens/a4301fe8-32d4-4b09-8054-bf68100ced03
- **O padrão em uma frase:** o item de prestígio mede-se por **quantos por cento das pessoas o possuem** — um fato sobre a população, não uma pontuação do usuário.
- **Estrutura da tela, de cima para baixo:** `×` em botão circular escuro (canto sup. esq.), sobre **uma caverna/gruta renderizada em preto e cinza** → **`Pride Gem` em bold branco** centralizado → **linha de descrição em cinza-claro, duas linhas** → **pílula escura com borda sutil: ícone de duas pessoas + `Owned by 23%`** → **a gema: forma ovalada iridescente assentada sobre um pedestal de pedra escuro**, com **campo de estrelas atrás** — iluminada como peça de exposição → **`✓ Unlocked Today` em branco** → **linha de condição em cinza pequeno, duas linhas** → **botão de largura total em cinza-escuro, desabilitado, com `✓ Current Gem`** → **tab bar em pílula escura flutuante** com 3 itens
- **No perfil, a fileira de gemas aparece assim:** seção `Gemstones` com três itens lado a lado, cada um com **nome em branco + `Owned by X%` em cinza**. Acima, três métricas com ícone
- **Copy literal:** "Pride Gem" · "Celebrate love, equality and authenticity during Pride Month!" · "Owned by 23%" · "Unlocked Today" · "Unlock this MileStone when you open Opal on Pride Month" · "Current Gem" · "Home" · "My Apps" · "Timer" · "Gemstones" · "Pride" / "Owned by 23%" · "Motivated" / "Owned by 95%" · "First" / "Owned by 98%" · "-- FOCUS HOURS" · "5 DAY STREAK" · "Top 17% WORLDWIDE"
- **O mecanismo:** três propriedades que nenhum outro achado tem juntas. (a) **É imune ao comportamento do usuário** — o percentual muda com a população, não com o desempenho individual, então nunca "desce por culpa sua"; (b) **hierarquia autoexplicativa** — `98%` vs. `23%` comunica raridade sem legenda e sem ranking nominal; (c) **`Current Gem` como botão travado** resolve "como o selo aparece e como sai": o item ativo se declara pelo próprio CTA desabilitado. Detalhe estratégico: **a condição de desbloqueio é um evento de calendário** (`Pride Month`), não desempenho — uma via de conquista que não exige que a pessoa produza nada.
- **Variação entre apps:** único do acervo com **raridade populacional aplicada a cosmético em app de produtividade**, e único com **cenografia de museu** (pedestal, iluminação, gruta) para um item sem função nenhuma.
- **Quando falha / risco:** na **mesma tela de perfil** o Opal exibe **`Top 17% WORLDWIDE`** — ranking global cru. As duas mecânicas convivem e precisam ser separadas na extração: **`Owned by X%` serve; `Top X% WORLDWIDE` é exatamente o leaderboard que a tese rejeita.** E `Owned by 98%` confessa que o item não é especial — a transparência corta nos dois sentidos.
- **Classificação:** PADRÃO

### Alan — Cosmético celebrado já vestido, com zero números
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/c7d423cb-47fa-419a-835d-685e1f3d75a6
- **Estrutura da tela, de cima para baixo:** fundo azul-noite sem chrome → **`YOU GOT A NEW BADGE, CONGRATS!` em caixa alta pequena** → raios radiais claros do centro → **a criatura usando os óculos, dentro de moldura ovalada rosa** → **`A Fire Look` em bold branco** → linha de corpo em cinza-claro → **botão roxo pílula de largura total `Continue`**
- **Copy literal:** "YOU GOT A NEW BADGE, CONGRATS!" · "A Fire Look" · "Your friends will wonder where you got that beauty..." · "Continue"
- **O mecanismo:** **prova pelo uso** — a criatura já vestida entrega o único valor que um cosmético tem. E a copy ativa **valor de sinal social sem exigir compartilhamento**. **Zero números** torna esta a celebração de prestígio mais compatível com as regras do Soulmon em todo o arquivo.
- **Variação entre apps:** o único do dossiê **sem qualquer número, contador ou data**, e o único cuja recompensa de prestígio é **já aplicada** em vez de exibida num pedestal.
- **Quando falha / risco:** chamar um item de vestuário de `badge` mistura vocabulários. E a projeção de inveja de amigos falha em quem usa o app sozinho — a maioria num app de hábitos.
- **Classificação:** PADRÃO

### Duolingo — `Perfect Week`: o modelo mais próximo do selo do Soulmon
- **Plataforma / data:** iOS · **data visível na tela: `DEC 6, 2025`**
- **URL Mobbin:** https://mobbin.com/screens/6e64c8e4-fabb-471b-b515-a3c87be4ba99
- **Estrutura:** *(ver dossiê 6A para o detalhe completo)* `×` e compartilhar → **emblema com o numeral `30` sobreposto na arte** → **pílula com `DEC 6, 2025`** → duas linhas de texto bold → **botão azul `CLAIM REWARD`**
- **Copy literal:** "DEC 6, 2025" · "You earned the Perfect Week achievement by completing 30 Perfect Weeks!" · "CLAIM REWARD"
- **O mecanismo:** **`Perfect Week` é um selo de qualidade, não um contador de saldo.** A diferença é decisiva: uma semana perfeita, uma vez conquistada, **é permanentemente sua** — e o total (`30`) só pode subir. Estruturalmente diferente do `847 day streak` do mesmo app, que é um saldo vivo que pode zerar. **O Duolingo tem as duas mecânicas simultâneas, e só uma delas serve ao Soulmon.**
- **Variação entre apps:** o único que **numera a conquista dentro da própria arte do emblema** e o único cujo botão de saída é uma **reivindicação**.
- **Quando falha / risco:** `Perfect` é palavra perigosa num produto que não quer punir: se existe semana perfeita, existe semana imperfeita, e o rótulo negativo é inferido mesmo que nunca seja escrito. **Para o selo de "sem escudo gasto", vale considerar um nome que não implique o seu oposto** — comparar com o `Imperfect Meditation Challenge` do Ten Percent Happier (§16).
- **Classificação:** PADRÃO

### Noom — `One-time`: a etiqueta que garante irreversibilidade
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/91a378f3-09df-41ee-8366-1311f02b72d3
- **Estrutura da tela, de cima para baixo:** seta `‹` + `Your challenges` → **`Active challenges (2)`** → dois cards brancos com título em serifada + foto pequena do objeto à direita; abaixo do título, **cinco losangos em linha `◆◇◇◇◇`** (o primeiro verde preenchido, quatro em contorno vazio) — no segundo card, no lugar dos pips, **botão verde-escuro pílula `Did it today`** → **`Completed (2)` sobre fundo verde-claro** → dois cards com **`Completed` em verde acima do título** e **duas pílulas: `🪙 100 seeds` e `One-time`**
- **Copy literal:** "Your challenges" · "Active challenges (2)" · "Drink water first thing in the morning" · "Take a "do nothing" break" · "Did it today" · "Completed (2)" · "Completed" · "Make a go-to healthy meals list" · "100 seeds" · "One-time" · "Create a mood-boosting playlist" · "80 seeds" · "One-time"
- **O mecanismo:** (a) **Os pips `◆◇◇◇◇` são um contador que só enche** — não existe losango vermelho, riscado ou vazado por falha, então o estado "perdi progresso" é visualmente inexprimível; (b) **`One-time` é a etiqueta que torna a promessa explícita ao usuário.** Num produto onde nada decresce, dizer *qual* conquista é permanente é o que transforma uma regra interna em confiança percebida. **Ninguém mais no acervo faz isso.**
- **Variação entre apps:** o único que **rotula a natureza repetível ou não de um desafio**, e o único que separa `Active` de `Completed` **mudando a cor de fundo da seção**.
- **Quando falha / risco:** inconsistência de layout — um card mostra pips, o outro mostra botão, na mesma seção. E `Did it today` depende de autorrelato.
- **Classificação:** PADRÃO

### Mimo — `Wooden LEAGUE`: título material em vez de posição
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/b66ff1af-4bc8-4687-8404-94ebbd379e53
- **Estrutura da tela, de cima para baixo:** título `Profile` + engrenagem → **avatar circular grande em gradiente rosa/vinho com pílula `PRO` sobreposta na base** → **`Alex Smith` em bold** → link `+ Add Bio` em roxo → **três cards brancos lado a lado, de largura igual**, cada um com **ícone nu no topo → valor em bold grande → rótulo em caixa alta pequena** → botão outline roxo `⇧ Share my progress` → seção `Friends` com `+ Add friends` → **empty state: três avatares ilustrados sobrepostos + `No friends yet` + linha de apoio** → tab bar de 5
- **Copy literal:** "Profile" · "PRO" · "Alex Smith" · "+ Add Bio" · "1" · "DAY STREAK" · "230" · "XP TOTAL" · "Wooden" · "LEAGUE" · "Share my progress" · "Friends" · "+ Add friends" · "No friends yet" · "Learning is even more fun if you do it together with your friends"
- **O mecanismo:** **substituir número por substantivo.** `Wooden` ocupa a mesma posição estrutural que `230 XP TOTAL` no card ao lado, mas é lido como categoria, não como saldo — e categorias sobem sem exibir a distância que falta. Solução mais barata do acervo para dar sensação de patamar sem expor métrica.
- **Variação entre apps:** único que **põe um título material no mesmo slot visual de um número**, tratando os dois como equivalentes de UI.
- **Quando falha / risco:** `Wooden` é o degrau mais baixo de uma escada implícita (madeira → bronze → prata…), então **o título comunica "você é o mais básico"** — prestígio que começa como demérito. E o card ao lado (`1 DAY STREAK`) reintroduz o número que zera.
- **Classificação:** LIMÍTROFE

### Finch, Tolan, Alan e Replika — as duas economias de cosmético
- **URLs Mobbin:**
  - Finch (loja de roupas): https://mobbin.com/screens/9dc19213-f77f-432e-93b8-35256e7604cb
  - Replika (grade de traços): https://mobbin.com/screens/658cff82-b075-476c-8709-3a3ff069114b
  - Alan (troca por avatar): https://mobbin.com/screens/83182397-8aa0-4b18-9cbe-13ab54b60db2
  - Tolan (armário): https://mobbin.com/screens/4505d6b4-fd57-45c2-ab11-2155eb15cd1d
- **Estrutura (Finch):** `×` (esq.) + **pílula de saldo `🪙 344`** + ícones `Catalog` e `Sell` (dir.) → **faixa de seção marrom: `Everyday Collection` + `The items below are always available!`** → **grade 4×N de slots em madeira**, cada um com o item ilustrado e **preço em pílula na base** → **tab bar de 4 abas: `Outfit` (ativa) · `Furniture` · `? Color` · `? Travel`** — **as duas últimas com `?` em vez de ícone**
- **Estrutura (Tolan):** seta `‹` + **seletor `Style / Clothes`** em pílula → a criatura em fundo creme → **abas horizontais esmaecidas** → **grade de opções: primeiro slot com símbolo `⃠` (nenhum)**, depois as variações de cor do mesmo item, a selecionada com borda escura
- **Copy literal:** Finch: "344" · "Catalog" · "Sell" · "Everyday Collection" · "The items below are always available!" · "500" · "300" · "900" · "Outfit" · "Furniture" · "Color" · "Travel" — Replika: "Traits" · "36" · "535" · "Confident" · "Shy" · "Energetic" · "Mellow" · "Caring" · "Sassy" · "Practical" · "Dreamy" · "Artistic" · "Logical" · "8" · "80" — Tolan: "Style" · "Clothes" · "Scarf" · "Shoes" · "Head" · "Face" — Alan: "Exchange" · "680" · "Vouchers" · "Charities" · "Avatar" · "Outfit"
- **O mecanismo:** duas arquiteturas opostas. **Finch e Alan vendem cosmético por moeda ganha com comportamento** — `Everyday Collection / always available` remove escassez artificial, e o Alan chega a oferecer `Charities` como destino alternativo dos pontos (o cosmético compete com doação, não com progresso). **Replika vende traços de personalidade em duas moedas**, o que precifica o caráter da criatura. Tolan é o mais econômico: **`⃠` como primeiro slot** (a opção "nada") é a affordance correta para cosmético — remover é tão fácil quanto vestir.
- **Variação entre apps:** Finch é o único que declara **`always available`** (anti-FOMO explícito) e o único com **abas futuras marcadas com `?`**. Tolan é o único com **slot de "nenhum"**. Alan é o único com **destino filantrópico dos pontos**.
- **Quando falha / risco:** o modelo Replika colide de frente com a regra: se traços de personalidade são comprados, a criatura deixa de ser produto do usuário e passa a ser produto da carteira. **Cosmético (Finch, Tolan, Alan) serve; traço/personalidade (Replika) não.**
- **Classificação:** Finch — PADRÃO · Tolan — PADRÃO · Alan — PADRÃO · Replika — ANTI-PADRÃO

## 8B — Os anti-padrões (o produto principal deste dossiê)

| App | O que expõe | Copy literal | Por que é risco | URL |
|---|---|---|---|---|
| **Headway** | `1-day streak` + **fileira `S M T W T F S`** com o dia atual em pílula laranja e o resto em círculo vazio | "1-day streak" · "Learning daily keeps your streak up" · "Roll the dice" / "Get a random summary" | A fileira semanal **desenha os dias vazios**, transformando a semana num registro visual de ausências | [link](https://mobbin.com/screens/e89dc8a7-0806-4658-8918-e964a8a97863) |
| **Quizlet** | `2-day streak` + chama com `2` + **calendário semanal `24…30`** com dois dias em chama | "2-day streak" · "Study **tomorrow** to keep your streak going!" | `Study tomorrow to keep...` é cobrança preventiva — pune antes de a falha existir | [link](https://mobbin.com/screens/14867059-aaf5-48b1-8201-04777108d2f3) |
| **Calm** | `Total 2 days` · `Longest 3 days` · `Current 1 day` + **calendário mensal com 5 dias circulados** | "My Streaks" · "Total" · "Longest" · "Current" · "Share My Streaks" | **`Longest 3 days` vs. `Current 1 day` é comparação do usuário contra si mesmo** — mostra que ele já foi melhor | [link](https://mobbin.com/screens/efbc1e20-0fdd-4b59-ab04-423a9e0982a3) |
| **Duolingo** | **`FRIEND STREAKS`** com avatares e chamas: `🔥342` `458` `106` `38` + `MONTHLY BADGES` + `ACHIEVEMENTS` `30` `750` `200` `200` | "FRIEND STREAKS" · "MAX FAMILY" · "MANAGE" · "MONTHLY BADGES" · "ACHIEVEMENTS" · "NEW" | **Streak social comparado lado a lado** — `38` ao lado de `458` é humilhação por vizinhança | [link](https://mobbin.com/screens/7dc56e7a-5099-44aa-88c1-5a8cb629eab6) |
| **Speak** | `56 SENTENCES LIFETIME` · `34 min TIME STUDIED` · **`4 days LONGEST STREAK`** · `Premium Member` · `Joined Mar 5, 2026` | "Premium Member" · "Joined Mar 5, 2026" · "LONGEST STREAK" · "Streak & Calendar" / "You are on a streak!" · "Refer a Friend" / "Earn $10 per friend" | Expor **`LONGEST`** em vez de atual é menos punitivo (só cresce) — **é o único detalhe aproveitável desta linha** | [link](https://mobbin.com/screens/b1802d44-e332-4130-bbf4-f195931c7bd1) |
| **Headspace** | `Run streak 1 day` **com um ícone de olho ao lado** (ocultar) + `Joined in 2025` | "Stats" · "5 minutes / Average meditation length" · "15 minutes / Total meditation time" · "3 sessions / Sessions completed" · "Run streak" · "1 day" · "Headspace 30-Day Guest Pass" | **O ícone de olho — permitir esconder o streak — é o achado positivo escondido neste anti-padrão** | [link](https://mobbin.com/screens/9aa70f7b-071a-4879-8c2e-f8dcc3d8ef0a) |
| **Duolingo (widget)** | **Coruja vermelha com olhos brilhando e expressão raivosa**, `🔥847 days`, semana com 4 checks e um círculo vazio | "847 days" · "Save your streak!" · "847" · "Don't forget me!" | **O anti-padrão mais puro do arquivo:** ameaça + culpa + antropomorfismo hostil, na home screen do telefone | [link](https://mobbin.com/screens/7d0f39fd-a349-4ef0-9a3b-d907200515fa) |
| **Deepstash** | `Streak Started!` + **benefício pago de escudos** + fileira `12…18` com dias em escudo azul | "Streak Started!" · "Read daily to grow a healthy habit. Keep your streak to track it." · "PRO" · "Exclusive benefit" · "With Pro, you receive 2 extra freezes / week every Monday." | **Vende proteção contra uma punição que o próprio produto inventou.** Colide com "dinheiro nunca compra vantagem de progresso" | [link](https://mobbin.com/screens/b6ff9a48-6196-4bcb-9997-66807ced786c) |
| **adidas Running** | `adiclub LEVEL 1` com **barra e `950 points to reach Level 2`** + `Points to spend ⌃ 50` | "MY MEMBERSHIP" · "SHOW MORE" · "adiclub" · "LEVEL 1" · "950 points to reach Level 2" · "50 Level points" · "MY SHOES" / "Add your first shoe" · "PREMIUM" / "Premium Benefits" / "Go further with Premium" | Nível de fidelidade com pontos que expiram — patamar que **pode ser perdido por inatividade** | [link](https://mobbin.com/screens/2b12d4a6-52df-4387-aab2-4bb5fda8ebc8) |
| **Shopee** | **`Silver` com coroa** + validade e meta de gasto | "Sam Lee" · "Silver" · "Current tier is valid till 08 Oct 2026, and spend Rp1.200.000 more to upgrade to GOLD." · "View Tier Benefits" · "2 Points" | **Prestígio com data de validade** — o patamar caduca. Forma mais dura de número que desce | [link](https://mobbin.com/screens/d91b6659-ae5f-4058-ad4e-944b5e3ee778) |

### Convergência e divergência — Dossiê 8

- **Convergência (7+ apps):** **o prestígio é quase sempre um saldo, não um selo.** Sete dos dez apps expressam consistência por **um número vivo que pode zerar** (`1 day`, `2 days`, `847 days`, `Level 1`, `Silver até 08 Oct`), e **cinco desenham explicitamente os dias vazios da semana** — círculos não preenchidos numa fileira `S M T W T F S`. O padrão dominante do mercado **não é prestígio, é dívida com aparência de prestígio.**
- **Divergência — e qual é a escolha real:** existem **quatro formas de dizer "esta pessoa é consistente"**, e elas se dividem por *quem é o dono do número*:
  1. **Saldo do usuário** (`847 day streak`) — pode zerar. Máxima potência motivacional, máximo dano na quebra.
  2. **Total acumulado** (`30 Perfect Weeks`, `56 SENTENCES LIFETIME`, `LONGEST STREAK`) — só cresce. Mesma leitura de mérito, sem risco de queda.
  3. **Fato populacional** (`Owned by 23%`) — não pertence ao usuário. Imune ao comportamento dele.
  4. **Substantivo sem número** (`Wooden LEAGUE`, `A Fire Look`) — categoria, não medida.

  **A escolha real é entre potência e segurança.** O saldo vivo é comprovadamente o mais motivador — é por isso que o mercado inteiro o usa — e é justamente por isso que quebrá-lo dói tanto. **Para o selo de "sem escudo gasto", os eixos 2, 3 e 4 são todos viáveis e combináveis; o eixo 1 está fora por definição.** Achado lateral que vale mais que parece: **o ícone de olho do Headspace, que permite ocultar o streak** — única concessão do acervo à ideia de que a métrica pode ser opcional para quem ela machuca.

---

# §10 — DOSSIÊ 9: WIDGET DE TELA INICIAL

> **Limite duro:** o MCP não tem Android. **Metade deste assunto está fora** — e widget é
> justamente onde a divergência de plataforma é maior. Além disso, o Mobbin cataloga
> majoritariamente **a galeria de widget dentro do app** (variações lado a lado sobre fundo
> neutro), não o widget instalado numa home screen real.

### MD Vinyl — Degradação por remoção de função, com assinatura material preservada
- **Plataforma / data:** iOS · data não exposta pelo MCP · *app pequeno*
- **URL Mobbin:** https://mobbin.com/screens/6049f0b1-826c-41a9-bf31-fc5725cca364
- **O padrão em uma frase:** os três tamanhos como **aparelhos de áudio de plástico escuro**; do grande para o pequeno o app **remove funções inteiras** em vez de encolher o mesmo layout.
- **O que cabe em cada tamanho — a resposta direta:**

| Tamanho | O que entra | O que sai |
|---|---|---|
| **Grande** | Capa do álbum · `⏸ PAUSED` em monospace verde-fósforo · título em 2 linhas · artista · seção `RECENTLY PLAYED` com 4 slots · **4 teclas físicas rotuladas** · nervuras da grade | — |
| **Médio** | Capa pequena · `⏸ PAUSED` · **título e artista comprimidos numa linha dentro de borda fina** · as 4 teclas · nervuras | O histórico `RECENTLY PLAYED` |
| **Pequeno** | Capa · `⏸` no canto · **título truncado com reticências** · artista · nervuras | **Todas as teclas** e o histórico |

- **Copy literal:** "PAUSED" · "Is It Cold In The Water?" · "SOPHIE" · "RECENTLY PLAYED" · "LIKE" · "PLAY" · "PREVIOUS" · "NEXT" · "Is It Cold In The Water?-SOPHIE" · "Is It Cold In The W..."
- **O mecanismo:** **a identidade sobrevive à perda de função.** As nervuras da grade aparecem nos três tamanhos e são o que mantém o reconhecimento. **Regra extraível: escolha UM traço visual que sobrevive a todos os tamanhos, e sacrifique função em vez de comprimir layout.**
- **Variação entre apps:** o único do acervo que mostra **os três tamanhos com identidade material consistente** e degradação funcional declarada.
- **Quando falha / risco:** moldura esqueumórfica consome área útil de informação. E teclas desenhadas como físicas precisam **ser** interativas (App Intents) — se forem decorativas, é affordance falsa no lugar mais visível do telefone.
- **Classificação:** PADRÃO

### GitHub — A grade de contribuição como widget: informação sem números
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/20f07f1e-3e57-4dc9-b280-308098485011
- **Estrutura:** fundo cinza-claro de home screen → **widget médio: retângulo branco de cantos arredondados contendo uma grade de ~7 linhas × 25 colunas de quadrados**, cada quadrado em um de quatro tons (cinza muito claro → verde-claro → verde-médio → verde-escuro) → **widget pequeno: quadrado branco com a mesma grade, recortada em ~7×7** → **zero rótulo, zero legenda, zero valor**
- **Copy literal:** *(nenhuma — o widget não tem texto)*
- **O mecanismo:** **densidade por saturação, não por algarismo.** A grade comunica volume e ritmo sem exibir uma única cifra — logo, **não há número que possa descer, porque não há número**. E dias vazios aparecem como células claras, não como falha marcada. Expressão mais radical de "informação sem métrica" do acervo.
- **Variação entre apps:** o único widget **completamente sem texto**, e o único que representa **histórico longo** (semanas/meses) em vez de estado do dia.
- **Quando falha / risco:** ilegível para quem não conhece a convenção — sem legenda, a grade é decorativa. E células claras em série ainda leem como ausência; a diferença é que o app não *nomeia* a ausência.
- **Classificação:** PADRÃO

### timespent e "one year" — a grade de consistência como produto
- **URLs Mobbin:**
  - timespent: https://mobbin.com/screens/da0a16ba-6c7e-4eca-86f1-c0b71e35f8c3
  - one year: https://mobbin.com/screens/9323efb6-c985-4b5e-b0ef-16ad0927d838
- **Estrutura (timespent):** folha modal branca com `Add Widget` no topo e `×` circular → **`Activity Grid` em bold serifado grande** → **`Visualize your consistency.` em cinza** → **micro-nota: `also on home screen and Small or Large`** → **a prévia: rótulos de mês em caixa alta cinza sobre uma grade vazia de quadrados cinza muito claros** → **três pontos de paginação** → **botão outline `Add Widget ›`**
- **Estrutura (one year):** fundo cinza de home screen → **três widgets em preto puro:** o grande com **matriz de pontos minúsculos** (os primeiros claros, o resto esmaecido) e, na base, **`2026` à esquerda e `323 days left` em monospace à direita**; o médio com a mesma matriz achatada e os mesmos rótulos; o pequeno **só com a matriz, sem nenhum texto**
- **Copy literal:** timespent: "Add Widget" · "Activity Grid" · "Visualize your consistency." · "also on home screen and Small or Large" · "Add Widget" — one year: "2026" · "323 days left"
- **O mecanismo:** timespent entrega a **tela de instalação de widget mais bem feita do acervo** — nomeia o widget, declara o benefício em três palavras, **avisa quais outros tamanhos existem** e mostra a prévia **em estado vazio**, sem dados falsos. Honestidade de onboarding de widget que ninguém mais faz. "one year" mostra o oposto do streak: **`323 days left` conta o que resta, não o que se acumulou** — um horizonte, não um saldo.
- **Variação entre apps:** timespent é o único com **tela dedicada de instalação** com nome, benefício e prévia vazia. "one year" é o único cujo widget pequeno **não tem texto algum** e o único que expressa tempo como *restante*.
- **Quando falha / risco:** a prévia vazia do timespent é honesta mas pouco sedutora. E `323 days left` é contagem regressiva — categoria de mecânica a evitar, embora aqui seja sobre o ano, não sobre o usuário.
- **Classificação:** ambos PADRÃO

### Mimo — O mascote no widget, com o dia da semana e uma linha de elogio
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/f5333bf0-bc83-4ccc-aa63-615816678920
- **Estrutura:**
  - **Widget médio:** card branco → **linha superior com os sete dias `M T W T F S S`**, o primeiro com **check azul preenchido** e os seis restantes em círculo cinza vazio → **abaixo, à esquerda: `💧 1` e `Well done!` em bold** → **à direita, o mascote recostado num travesseiro/cadeira roxa, com uma bebida tropical ao lado** — pose de descanso
  - **Widget pequeno:** quadrado branco → **`💧 1`** → **`Well done!` em bold** → **o mesmo mascote na metade inferior**, ligeiramente cortado pela borda
- **Copy literal:** "M" "T" "W" "T" "F" "S" "S" · "1" · "Well done!"
- **O mecanismo:** **elogio no lugar de cobrança, na superfície mais agressiva do sistema.** Onde o Duolingo põe `Save your streak!` com uma coruja raivosa, o Mimo põe `Well done!` com o mascote **descansando**. Mesma posição, mesmo formato, afeto invertido. No tamanho pequeno o mascote é **cortado pela borda** em vez de reduzido — mantém escala reconhecível sacrificando área.
- **Variação entre apps:** o único widget do acervo com **personagem + copy de elogio**, e o único onde o personagem aparece **em pose de repouso**.
- **Quando falha / risco:** a fileira `M T W T F S S` com seis círculos vazios ainda desenha os dias não cumpridos — **o mesmo componente que o Duolingo e o Headway usam para cobrar.** Tom oposto, estrutura de dados idêntica. **Para o Soulmon, cuja constância é "N dos últimos 7 dias", a fileira semanal precisa ser repensada: ela naturalmente exibe ausências, mesmo com copy gentil.**
- **Classificação:** LIMÍTROFE

### Alma, GO Club e MyFitnessPal — widget com ação direta
- **URLs Mobbin:**
  - Alma: https://mobbin.com/screens/fe23c4a3-b043-432c-aa9f-9bb4db519889
  - GO Club: https://mobbin.com/screens/82d8ae48-fa82-4d35-9cfb-e4d627951666
  - MyFitnessPal: https://mobbin.com/screens/f74772bf-95d0-4a91-8e2d-56d33a77508e
- **Estrutura (Alma):** **widget grande:** anel de progresso branco com **`799` em bold e `of 3,100` em cinza** à esquerda; **três círculos de macro sobrepostos em cores** ao centro; **três botões circulares escuros em coluna à direita** (microfone, teclado, câmera) → **widget médio:** `🥕 3` + `Baby Carrot` à esquerda, **barra de progresso laranja→verde com `✓` na ponta** e **`Streak secured! Nice work.`** à direita → **widget pequeno:** só `🥕 3` + `Baby Carrot`
- **Estrutura (GO Club):** **widget médio em azul-noite:** logo `GO` no canto, **`36% Completed`** à direita, **ilustração de garrafa de água parcialmente preenchida** ao centro, **`18` em display muito grande + `OZ`** à direita, **`18oz / Water intake`** à esquerda, e **um botão circular escuro com ícone de copo e `+`** → **widget pequeno:** garrafa + `18 OZ` + o mesmo botão `+`
- **Estrutura (MyFitnessPal):** **dois widgets pequenos lado a lado:** o primeiro com `💧 Water` / **`1,000 ml`** / `Today` / **botão azul pílula `+ 250 ml`** e barra vertical de nível na borda; o segundo com **anel azul contendo `1,284` + `Remaining`** e, na base, **`🍴 1,646` e `🔥 0`**
- **Copy literal:** Alma: "799" · "of 3,100" · "45g of 92" · "13g of 78" · "126g of 236" · "3" · "Baby Carrot" · "Streak secured! Nice work." — GO Club: "36%" · "Completed" · "18oz" · "Water intake" · "18" · "OZ" — MyFitnessPal: "Water" · "1,000 ml" · "Today" · "+ 250 ml" · "1,284" · "Remaining" · "1,646" · "0"
- **O mecanismo:** **o widget como superfície de ação, não só de leitura.** Os botões interativos permitem registrar sem abrir o app — remove a fricção principal de um app de hábito. E o **`Streak secured! Nice work.` do Alma é o achado de copy deste dossiê**: aparece **depois** do cumprimento, com o `✓` na ponta da barra, e a frase é de **confirmação de segurança**, não de alerta. Compare com `Save your streak!` do Duolingo: mesma mecânica, um confirma, o outro ameaça.
- **Variação entre apps:** Alma é o único que **muda a mensagem conforme o estado cumprido**. GO Club é o único que usa **metáfora de recipiente que enche**. MyFitnessPal é o único cujo widget pequeno contém **um CTA com valor específico**.
- **Quando falha / risco:** Alma mostra **oito números simultâneos** no widget grande — densidade excessiva para uma superfície de relance. E `1,284 Remaining` é número que **decresce por design**.
- **Classificação:** Alma — PADRÃO · GO Club — PADRÃO · MyFitnessPal — LIMÍTROFE

### Vocabulary e pushr — customização e o mínimo absoluto
- **URLs Mobbin:**
  - Vocabulary: https://mobbin.com/screens/f5a69f73-a3ac-4e42-a279-ec6997fec450
  - pushr: https://mobbin.com/screens/bd1913f9-cb73-4126-9c41-fb92dfe61b97
- **Estrutura (Vocabulary):** seta `‹` + título `Widgets` + `+` → **`Set up your Home Screen widget` em cinza** → **prévia do widget dentro de uma maquete de telefone**: card com textura de papel amassado bege, **`encumber` em serifada branca**, definição e frase de exemplo → **`Your widget reflects the settings you select below.`** → **`✎ Sand theme` em bold** → **lista de configurações em cards brancos:** `Customize` (toggle **ligado**) · `Categories → Mix` · `Theme →` · `Widget border` (toggle **desligado**) · `Refresh → Hourly`
- **Estrutura (pushr):** fundo cinza de home screen → **widget médio branco-gelo:** `this week` em bold à esquerda, **`🔥 3` à direita**, e abaixo **sete pílulas verticais de dias `S M T W T F S`** — **três em preto sólido com `✓` branco**, quatro em cinza-claro → **widget pequeno:** ícone de chama preto, **`3` em bold grande**, `days` em cinza
- **Copy literal:** Vocabulary: "Widgets" · "Set up your Home Screen widget" · "encumber" · "(v.) To weigh down, burden" · "Your widget reflects the settings you select below." · "Sand theme" · "Customize" · "Categories" · "Mix" · "Theme" · "Widget border" · "Refresh" · "Hourly" — pushr: "this week" · "3" · "S M T W T F S" · "3" · "days"
- **O mecanismo:** Vocabulary entrega o **painel de configuração de widget mais completo do acervo** — tema, borda, categorias e **frequência de atualização** expostos, com prévia em tempo real e a frase explicando o vínculo. pushr é o extremo oposto: **tipografia monocromática, zero cor, zero ilustração**, e o widget pequeno reduzido a um algarismo.
- **Variação entre apps:** Vocabulary é o único que expõe **`Refresh: Hourly`** — controle sobre a frequência, raríssimo. pushr é o widget **mais minimalista do acervo**.
- **Quando falha / risco:** as pílulas do pushr em **preto sólido vs. cinza** são o contraste mais duro do dossiê — quatro pílulas cinza numa semana leem como quatro falhas. **Minimalismo não neutraliza o julgamento; às vezes o intensifica, porque não há nada mais na tela para diluí-lo.**
- **Classificação:** Vocabulary — PADRÃO · pushr — LIMÍTROFE

### Duolingo — O widget como instrumento de ameaça (ANTI-PADRÃO de referência)
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/7d0f39fd-a349-4ef0-9a3b-d907200515fa
- **Estrutura:**
  - **Widget médio:** **fundo vermelho-escuro degradê** → **`🔥❗847 days` em bold branco** (chama com badge de exclamação) → **`Save your streak!`** → **fileira `S M T W T` com quatro `✓` e um círculo escuro vazio no final** → **à direita, a coruja verde com raios de luz saindo dos olhos**, expressão de raiva
  - **Widget pequeno:** **fundo vermelho-escuro quase preto** → **`🔥❗847`** → **`Don't forget me!`** → **a coruja com os olhos vermelhos brilhantes, sobrancelhas franzidas**, ocupando a metade inferior
- **Copy literal:** "847 days" · "Save your streak!" · "847" · "Don't forget me!"
- **O mecanismo:** aversão pura. **Três camadas de ameaça sobrepostas:** (a) a cor vermelha de alerta; (b) o badge de exclamação sobre a chama; (c) **o personagem antropomorfizado como cobrador emocional** — `Don't forget me!` é culpa em primeira pessoa, dita por uma entidade com quem o usuário tem vínculo. E o número `847` maximiza a perda potencial.
- **Variação entre apps:** o único widget do acervo com **paleta de alerta e personagem hostil**. Comparação instrutiva com o Mimo (`Well done!` + mascote descansando) e o Alma (`Streak secured! Nice work.`): **três widgets, mesma estrutura de dados, três afetos completamente diferentes.**
- **Quando falha / risco:** **para o Soulmon é a definição do que não fazer.** A tese é "um avatar que evolui COM o usuário e o encoraja — nunca um cobrador", e este widget é o avatar convertido em cobrador. Benchmark negativo mais nítido de todo o levantamento.
- **Classificação:** ANTI-PADRÃO

### Convergência e divergência — Dossiê 9

- **Convergência (6+ apps):** **a fileira dos sete dias da semana é o componente universal** de widget de hábito — Mimo, pushr, Duolingo, Alma (implícito na barra) e, no app, Headway e Quizlet. Sempre `S M T W T F S`, com os dias cumpridos marcados e **os não cumpridos desenhados como vazios**. E **todos os widgets pequenos sacrificam texto antes de sacrificar o número ou o personagem** — hierarquia de descarte consistente: primeiro o histórico, depois os rótulos, depois as ações, e por último a identidade.
- **Divergência — e qual é a escolha real:** **o widget exibe estado ou exige ação.** Um grupo (GitHub, one year, timespent) mostra **histórico sem números e sem CTA** — é espelho, não cobrador. Outro (Alma, GO Club, MyFitnessPal) põe **botões de registro direto** — é ferramenta. Um terceiro (Duolingo) usa a superfície como **canal de pressão**. A escolha real é sobre **o que a home screen do telefone significa**: o lugar mais valioso e mais invasivo que um app pode ocupar, visto dezenas de vezes por dia sem ser solicitado. **A frequência de exposição multiplica o afeto do widget** — `Well done!` visto 40 vezes por dia é diferente de `Don't forget me!` visto 40 vezes por dia, e essa diferença é maior que qualquer decisão de tela dentro do app.

---

# §11 — DOSSIÊ 10: RETORNO DEPOIS DE AUSÊNCIA

> **Nota de método:** a primeira busca ("welcome back screen") retornou **9 de 10 telas de
> re-login** — que são *reconhecimento de conta*, não *win-back*. Só a segunda busca
> ("missed several days / restart gently") trouxe o padrão real. Os dois grupos estão
> registrados, porque a distinção é o achado.

## 10A — O win-back real (acolhimento após falha)

### Finch — `It's okay to miss a day.` — o modelo tonal completo
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/d6e7a7b1-4b61-40b1-8ff7-1c602badec85
- **Estrutura da tela, de cima para baixo:**
  1. Fundo bege-areia sólido, sem chrome. **Pílula de saldo `◈ 994`** no canto superior direito
  2. **Balão de fala branco de cantos arredondados, largura quase total, com cauda apontando para baixo-esquerda:** texto em bold escuro, duas linhas
  3. **O pet abaixo do balão** — e **um objeto marrom grande tombado atrás dele**, inclinado. A cena comunica queda sem palavra
  4. Espaço vazio generoso no meio da tela
  5. **`Repair your 2 day streak?` em bold escuro, centralizado**
  6. **Linha de apoio em cinza**
  7. **Botão em card claro, largura total, com etiqueta sobreposta no canto superior direito em laranja: `1ST TIME OFFER`** → dentro do botão: **`Repair for` + `◈ 2,000` RISCADO + `FREE!` em laranja bold**
  8. **Segundo botão, em tom mais claro, sem borda, largura total:** `Start over`
- **Copy literal:** "994" · "It's okay to miss a day. The important thing is you're here today, cheep!" · "Repair your 2 day streak?" · "Save your streak to keep it alive!" · "1ST TIME OFFER" · "Repair for" · "2,000" *(riscado)* · "FREE!" · "Start over"
- **O mecanismo — e há uma tensão interna importante:**
  - **A primeira linha é a peça-mestra.** `It's okay to miss a day. The important thing is you're here today` faz três coisas em quinze palavras: **absolve**, **redireciona o mérito para o presente** e **credita a pessoa por estar ali** — em vez de cobrá-la por ter faltado. O `cheep!` assina a fala como do pet, não do sistema. **Melhor exemplo de copy de acolhimento do arquivo inteiro.**
  - **A cena carrega a metáfora sem texto:** o objeto tombado diz "algo caiu", e o pet de pé ao lado diz "e está tudo bem".
  - **`Start over` como segunda opção é essencial:** dá saída para quem não quer reparar.
  - **A tensão:** as linhas 5 e 6 **contradizem a linha 2.** Primeiro o app diz que faltar é normal; três linhas abaixo diz que o streak precisa ser *salvo* para *continuar vivo*. **A copy superior é da tese, a inferior é da mecânica** — e a mecânica venceu no layout, porque ocupa o CTA. **Para o Soulmon, que não tem streak que zera, esta contradição não existe: dá para ficar só com a linha 2.**
- **Variação entre apps:** único em que **o personagem absolve o usuário explicitamente**, e único que oferece **reparo gratuito como oferta de primeira vez** em vez de vender.
- **Quando falha / risco:** `1ST TIME OFFER` com preço riscado é vocabulário de e-commerce dentro de um momento de vulnerabilidade — e implica que **a próxima vez vai custar**. Estabelece o preço do perdão futuro no momento do perdão gratuito.
- **Classificação:** PADRÃO *(a linha de absolvição e o `Start over`) · a oferta com preço riscado: LIMÍTROFE*

### Runna — O treinador oferece duas formas de seguir, e nenhuma de recuperar
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/321454f7-be6f-48af-999a-4bb5f4d2f09d
- **Estrutura da tela, de cima para baixo:**
  1. **Folha modal branca** com **chevron `v` no canto superior direito**
  2. **Manchete em bold, alinhada à esquerda:** `Let's keep your progress going`
  3. **Linha de remetente:** **foto circular pequena de uma pessoa real** + **`Coach` em laranja**
  4. **Parágrafo de 4 linhas** em preto regular
  5. **Dois cards com borda fina, empilhados**, cada um com: **ícone à esquerda** → **título em bold** → **duas linhas de explicação** → **e uma terceira linha em bold parcial declarando a consequência exata**
  6. **Botão de largura total, cinza-claro, `Confirm` DESABILITADO** — até uma escolha ser feita
- **Copy literal:** "Let's keep your progress going" · "Coach" · "Looks like you missed a few workouts - no problem, it happens! Pick an option below and let's keep moving forward. You've got this!" · "Rearrange missed workouts" · "Let's add your missed workouts to this week so you stay on track!" · "You will have 3 workouts this week." · "Skip missed workouts" · "Keep moving forward without the missed workouts." · "Your plan for this week stays the same!" · "Confirm"
- **O mecanismo:** **agência sobre a consequência.** As duas opções não são "recuperar" vs. "perder" — são **duas formas legítimas de seguir adiante**, e cada card **declara o resultado numérico exato**. A pessoa escolhe informada, e nenhuma escolha é errada. A copy do coach: `no problem, it happens!` normaliza, `let's keep moving forward` orienta ao futuro, `You've got this!` afirma capacidade. **Zero menção ao que foi perdido.** E o `Confirm` desabilitado até haver escolha protege uma decisão que altera o plano.
- **Variação entre apps:** o único que **oferece escolha em vez de reparo**, o único cujo remetente é **uma pessoa real fotografada**, e o único que **declara a consequência numérica de cada opção antes da escolha**.
- **Quando falha / risco:** `Rearrange` acumula trabalho perdido no presente — pode sobrecarregar quem já estava sobrecarregado. E "You've got this!" pode soar vazio se a pessoa parou por motivo real (doença, luto, crise) — **nenhum app do acervo pergunta por que a pessoa faltou.**
- **Classificação:** PADRÃO

### Todoist — Descanso configurado ANTES de ser necessário
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/b4b94e45-69b6-4dcd-a961-148f8d7e5982
- **Estrutura da tela, de cima para baixo:**
  1. Seta `‹` + título `Productivity`
  2. **Linha com toggle verde ligado:** `Use Karma`
  3. **Cabeçalho de grupo:** `Set Goals` → **duas linhas de valor:** `Daily Task Goal → 5` · `Weekly Task Goal → 30`
  4. **Linha com toggle verde ligado:** `Goal Celebrations` + **legenda em cinza**
  5. **Cabeçalho de grupo:** `Days Off` → **seletor horizontal de sete segmentos `M T W T F S S`**, com **`M T W T` em branco/neutro e `F S S` em vermelho sólido agrupados à direita** → **legenda**
  6. **Linha com toggle DESLIGADO:** `Vacation Mode` + **legenda de 2 linhas**
- **Copy literal:** "Productivity" · "Use Karma" · "Set Goals" · "Daily Task Goal" · "5" · "Weekly Task Goal" · "30" · "Goal Celebrations" · "Celebrate reaching daily and weekly task goals." · "Days Off" · "M T W T F S S" · "Daily Task Goal streaks are paused on your days off." · "Vacation Mode" · "When turned on, your streaks and Karma will remain intact even if you don't achieve your goals."
- **O mecanismo:** **prevenção em vez de reparo.** Todo o resto do dossiê lida com a falha *depois*; o Todoist deixa a pessoa **definir o que nem conta como falha**, antes. A mecânica se ajusta à vida da pessoa, não o contrário. E **`Goal Celebrations` como toggle** é uma concessão que ninguém mais faz: a celebração é opcional, para quem ela incomoda.
- **Variação entre apps:** o único que trata descanso como **configuração antecipada** em vez de recurso consumível, e o único que permite **desligar a comemoração**.
- **Quando falha / risco:** é uma tela de Configurações — **exige que a pessoa saiba que o recurso existe e vá procurá-lo.** Prevenção enterrada em Settings protege só quem já é organizado. **Para o Soulmon, cujos escudos são consumidos automaticamente, o modelo é superior: a proteção não depende de descoberta.**
- **Classificação:** PADRÃO

### Alma e Numo — férias explícitas e "pausar sem perder"
- **URLs Mobbin:**
  - Alma: https://mobbin.com/screens/ea9f1fd5-652e-4cb3-afb6-7a6a30e53d78
  - Numo: https://mobbin.com/screens/cae1eb96-5ca5-4496-9dc4-9aa305c289ef
- **Estrutura (Alma):** **toast preto no topo cobrindo a barra de status** → card do hábito com `🥕 3` → linha `Track one item to keep your streak` com barra e `✓` → card com pílula `🏆 Record` → **dois cards lado a lado: `Vacation mode` (árvore de Natal + `Get started ›`) e `Streak saves` (boia + `0` + `How it works ⓘ`)** → seção `Challenges`
- **Estrutura (Numo):** seta `‹` → **fundo rosa-claro** → **gota/chama vermelha grande com `4` em branco** → **`day streak` em display bold vermelho** → linha de reforço → **botão vermelho pílula largura total `SHARE ⇧`** → **faixa branca com a semana `Fr Sa Su Mo Tu We Th`**: três primeiros em círculo vazio, quatro seguintes em círculo vermelho com `✓`, o último com ícone de chama → régua → **linha com ícone de alvo: `Pause & preserve` + legenda**
- **Copy literal:** Alma: "Vacation Ended!" · "Your streak is now active again." · "Vacation mode" · "Get started ›" · "Streak saves" · "0" · "How it works" — Numo: "4" · "day streak" · "It's your longest streak, don't stop!" · "SHARE" · "Pause & preserve" · "You can skip a day without losing your streak"
- **O mecanismo:** **`Pause & preserve` é o melhor nome do acervo para a mecânica de descanso** — duas palavras que dizem a ação e a garantia. E `You can skip a day without losing your streak` é a formulação mais tranquilizadora: **afirma a permissão de falhar, não o socorro depois da falha.** No Alma, o par de cards expõe a mecânica de descanso como parte estrutural do produto, não como configuração escondida.
- **Variação entre apps:** Numo é o único que nomeia a mecânica com **verbo + garantia**; Alma é o único que **anuncia o fim das férias por toast** e o único que expõe os dois recursos **como cards na home**.
- **Quando falha / risco:** `Streak saves 0` do Alma expõe o estoque no zero — **cria ansiedade exatamente onde a mecânica existia para removê-la.** E `It's your longest streak, don't stop!` do Numo é a formulação mais perversa do dossiê: quanto maior a conquista, maior a ameaça implícita — **o app transforma o próprio recorde em alavanca de pressão.**
- **Classificação:** Numo — LIMÍTROFE *(`Pause & preserve`: PADRÃO · `don't stop!`: ANTI-PADRÃO)* · Alma — LIMÍTROFE

### Lovi — Win-back puro, sem métrica e sem pedido
- **Plataforma / data:** iOS · data não exposta pelo MCP · *app pequeno*
- **URL Mobbin:** https://mobbin.com/screens/e5c1876c-e70a-43f7-86c4-ef926523e5e8
- **Estrutura da tela, de cima para baixo:**
  1. Fundo branco-neutro, sem chrome, sem `×`
  2. **Um blob de gradiente suave (azul → rosa → lilás) num retângulo horizontal**, com **dois traços brancos como olhos fechados e uma curva branca como sorriso** — rosto mínimo, sem personagem definido
  3. **`Welcome back, Sunshine` em regular grande** (não bold), centralizado
  4. **`You've been missed!` em cinza pequeno**, centralizado
  5. Vazio generoso
  6. **Botão pílula de largura total em gradiente azul-violeta:** `Let's start!`
- **Copy literal:** "Welcome back, Sunshine" · "You've been missed!" · "Let's start!"
- **O mecanismo:** **ausência de dados como escolha.** A tela não diz quantos dias passaram, não mostra o que foi perdido, não pede nada e não oferece reparo. `You've been missed!` na voz passiva atribui o sentimento ao produto ("você fez falta"), não ao usuário ("você falhou"). O termo de tratamento `Sunshine` faz o registro afetivo em uma palavra. E `Let's start!` — não "continue", não "recupere" — **reenquadra o retorno como um novo começo**, o que apaga a dívida em vez de perdoá-la.
- **Variação entre apps:** o único que **não exibe absolutamente nenhuma métrica** sobre a ausência, e o único cujo CTA propõe **começar** em vez de retomar. Também o único cujo "personagem" é uma forma abstrata — solução mais barata possível para dar um rosto ao momento.
- **Quando falha / risco:** sem reconhecimento do tempo fora, pode soar genérico — quem sumiu três meses recebe a mesma tela de quem sumiu três dias. **Escolha oposta à do Runna.** E `Sunshine` é intraduzível sem perda: em PT-BR todas as opções mudam o registro — problema real para um produto bilíngue.
- **Classificação:** PADRÃO

### Paired — O escudo automático, com o zero exposto
- **Plataforma / data:** iOS · **data visível na tela: `February 2025`**
- **URL Mobbin:** https://mobbin.com/screens/b27cfee7-fe76-476d-b96a-1d1b53389f12
- **Estrutura da tela, de cima para baixo:** **`Streak` em bold roxo grande** (esq.) + `×` circular (dir.) → **círculo cinza-claro com ícone de chama vazada** ao lado de **`0 days` em bold roxo grande** e uma linha de instrução → **cabeçalho `Streak Freeze`** → **card branco com pílula `1 available` no topo** e **parágrafo de 3 linhas** → **cabeçalho `Conversations calendar`** → **dois cards de parceiro lado a lado**, cada um com avatar + nome + **`0 day streak`** → **calendário mensal de `February 2025`** com faixas rosa-claras
- **Copy literal:** "Streak" · "0 days" · "Answer a conversation today to keep your communication strong!" · "Streak Freeze" · "1 available" · **"The Streak Freeze is automatically applied when you lose your streak. You get one new Streak Freeze per month!"** · "Conversations calendar" · "Sam" · "0 day streak" · "Alex Smith" · "0 day streak" · "February 2025"
- **O mecanismo:** **`automatically applied` é a propriedade certa** — o escudo age sem o usuário pedir. E `You get one new Streak Freeze per month` estabelece reposição previsível, o que remove a escassez.
- **Variação entre apps:** único que declara **cadência de reposição** do escudo.
- **Quando falha / risco:** a tela expõe **`0 days` três vezes** (o próprio, e o de cada parceiro) — e a chama está *vazada*, desenhada como apagada. **A tela mais desanimadora do dossiê**, apesar de ter a melhor mecânica por baixo. Prova que **mecânica generosa não compensa exibição punitiva.**
- **Classificação:** LIMÍTROFE

## 10B — O que NÃO é win-back (e por que a distinção importa)

| App | Copy literal | O que realmente é |
|---|---|---|
| **DoorDash** | "Welcome back to DoorDash, Sam" · "Continue with the account saved on this device or use a different account" · "Continue as samlee.mobbin@gmail.com" · "Sign In or Sign Up to Another Account" | Seleção de conta salva |
| **Xbox** | "Welcome back, SamLee!" · "SamLee #1529" · "Sign in with a different account" · "Let's go" | Confirmação de identidade, com **avatar de gamertag** |
| **Wolt** | "Welcome back, Sam" · "Continue as Sam Lee" · "Use another sign-in method" | Escolha de método de login, sobre **grade de ilustrações de produtos** |
| **Beside** | "Welcome back, Alex!" · "Continue as Alex" · "Not you? Log in or Create Account" | Login, com `Not you?` como saída |
| **Spark Mail** | "Welcome back, John Smith!" · "Nice to see you again! Spark will now sync all your email accounts and settings." | Aviso de sincronização |
| **Noom** | "Accessing your Noom account..." · "Welcome back!" | **Tela de carregamento** com a marca |
| **Credit Karma** | "Welcome back" · "It looks like you have an Intuit Credit Karma account." · "Continue to my account" · "Log in with another account" | Detecção de conta existente |
| **Chase UK** | "Welcome back," · "You're just a few details away from simple and rewarding banking." · "Continue" | **Retomada de cadastro incompleto** |
| **TextNow** | "Welcome back 👋" · "You last logged in with your email alexsmith.mobbin@gmail.com" · "Forget Account" · "Log Back In" · "Log In to another account" | Login, com **`Forget Account`** como saída de privacidade |

**Por que a distinção importa:** `Welcome back` é a mesma frase para dois momentos
psicologicamente opostos. No re-login, a pessoa não sente nada — é fricção administrativa.
No retorno após ausência, ela pode sentir vergonha, e é aí que o tom decide se ela fica.
**Um app que usa a mesma tela para os dois casos desperdiça o único momento em que o tom
importa.** Chase UK é o único do grupo B que faz algo interessante: **retoma um cadastro
abandonado sem mencionar o abandono**, enquadrando a lacuna como proximidade em vez de falha.

### Convergência e divergência — Dossiê 10

- **Convergência (5+ apps):** **normalização explícita da falha.** Finch: `It's okay to miss a day.` · Runna: `no problem, it happens!` · Numo: `You can skip a day without losing your streak` · Todoist: `streaks are paused on your days off` · Alma: `Vacation mode`. Cinco apps, cinco formas de dizer que **faltar é previsto pelo sistema.** E **todos** usam CTA orientado ao futuro (`Start today`, `Let's start!`, `keep moving forward`, `Start over`) — **nenhum** usa "recupere" ou "volte ao que era".
- **Divergência — e qual é a escolha real:** **quantificar ou silenciar a ausência.** Runna quantifica, Finch quantifica, Paired quantifica brutalmente (`0 days`, três vezes). Lovi silencia completamente. Todoist torna a pergunta irrelevante ao definir a ausência como legítima de antemão. A escolha real é **se o produto precisa que a pessoa entenda a consequência.** Num app com plano de treino, sim — e o Runna está certo. Num app cuja tese diz que **nada é perdido por inatividade**, quantificar é criar uma consequência para depois anunciar que ela não existe. **Para o Soulmon, o eixo é Lovi + Todoist: silenciar a métrica e ter a proteção agindo sozinha por trás — usando a linha do Finch (`It's okay to miss a day. The important thing is you're here today`) como o tom, e descartando a segunda metade da tela dele, onde a mecânica de streak contradiz a copy.**

---

# §12 — DOSSIÊ 11: OFERTA DENTRO DO APP, SEM BLOQUEAR

> **De 20 telas retornadas nas duas buscas, 1 é oferta genuinamente dispensável.** As
> outras 19 se dividem entre paywall de tela cheia e faixa promocional permanente. Este
> dossiê é majoritariamente um catálogo de anti-padrões — e é assim que tem valor.

## 11A — O padrão que serve

### Garmin Connect — `×` no próprio card, botão de largura parcial
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/f53c9109-b2d4-4ebd-9f08-60ee9738b01f
- **Estrutura da tela, de cima para baixo:** cabeçalho escuro (avatar, sino, `+`, sincronizar) → **card de oferta:** fotografia no topo **com `×` circular escuro sobreposto no canto superior direito** → **`Nutrition made easy` em bold branco grande** → 2 linhas de corpo em cinza → **botão azul pequeno de largura parcial** → **cabeçalho `What's New`** → **segundo card, mesmo formato, conteúdo não-comercial:** ícone circular azul + título + 2 linhas + link azul + **`×` circular no canto** → **dois pontos de paginação** → cabeçalho `Today's Activity` (o conteúdo real) → tab bar de 5 com rótulo
- **Copy literal:** "Nutrition made easy" · "Set nutrition goals, track calories and macros and get personalized insights." · "Start your Free Trial" · "What's New" · "Follow your friends" · "Garmin Connect connections are now followers. Let's get you set up in a few simple steps." · "Get Started" · "Today's Activity"
- **O mecanismo — quatro decisões, todas necessárias juntas:**
  1. **`×` no próprio card** — dispensa em um toque, sem menu, sem confirmação, permanente.
  2. **Botão de largura parcial**, quando os CTAs primários do app são de largura total — a assimetria sinaliza "opcional" sem precisar dizer.
  3. **Container idêntico ao do conteúdo não-comercial** — remove o tratamento privilegiado que faz uma oferta ler como anúncio.
  4. **Acima do conteúdo, mas removível** — pega atenção uma vez e desaparece por escolha da pessoa. Troca impressão repetida por respeito.
- **Variação entre apps:** **o único das 20 telas** cuja oferta pode ser dispensada permanentemente pelo próprio card.
- **Quando falha / risco:** ainda é o primeiro conteúdo ao abrir o app. E dispensa permanente = **uma chance de conversão por usuário** — decisão de negócio, não de design.
- **Classificação:** PADRÃO

### Meetup e Character AI — as duas melhores saídas de paywall
- **URLs Mobbin:**
  - Meetup: https://mobbin.com/screens/38c5946d-da75-4e0a-b323-297ed55afcac
  - Character AI: https://mobbin.com/screens/fcc95941-3971-4a4b-ad65-07f1897bedf6
- **Estrutura (Meetup):** **cinco pontos de progresso roxos** no topo + `×` → logo circular rosa `m` → manchete com `Meetup+` em rosa → **três linhas com check roxo** listando benefícios → **e sobre tudo isso, uma folha modal branca subindo:** `×` → **ilustração de sino** → **título em bold, duas linhas** → linha de apoio → **botão preto pílula largura total** → **botão de texto `No, thanks`**
- **Estrutura (Character AI):** `×` no canto superior esquerdo + `Restore` no direito → **seis linhas-cartão azul-escuras**, cada uma com **ícone + título em bold + pílula `18+` + subtítulo em cinza** → micro-copy → **botão azul pílula largura total** → **`Skip for now` em texto branco bold, centralizado, largura total**
- **Copy literal:** Meetup: "All set! Ready to connect more with Meetup+?" · "See all event attendees and group members" · "Get high priority in waitlists" · "Send unlimited DMs to any member" · "Get in-app reminder when your trial period is ending" · "We'll remind you inside the app 2 days before the end of your trial" · "Get reminder" · "No, thanks" — Character AI: "Restore" · "Higher Limits" / "More imagine generations, streams, + more" · "Chat Styles" / "Access our latest and best models" · "Better Memory" / "Characters remember more with frequent updates" · "Exclusive Perks" / "Unlock new features first & invitation to the c.ai+ community" · "Priority Chat Access" / "Skip slowdown during busy hours" · "Voice Calls" / "Elevate your experience with real-time conversations" · "Auto renews monthly until canceled" · "Subscribe for $9.99/mo" · "Skip for now"
- **O mecanismo:** Meetup faz algo que **nenhum outro app do acervo faz**: oferece **proativamente um lembrete de fim de teste**, dois dias antes — o oposto do modelo padrão de trial, que lucra com o esquecimento. **Jogada de confiança que reduz cancelamento por ressentimento.** Character AI faz o melhor **`Skip for now`** do acervo: em bold branco, largura total, imediatamente abaixo do CTA — **visualmente forte o suficiente para não ser truque de tipografia**, e a formulação "for now" mantém a porta aberta sem pressionar.
- **Variação entre apps:** Meetup é o único que **oferece lembrete de fim de trial**; Character AI é o único cujo botão de recusa tem **peso tipográfico comparável ao do primário**.
- **Quando falha / risco:** o Meetup empilha **dois modais**, o que confunde qual é a decisão em jogo. E o Character AI marca todos os benefícios com `18+`, o que num app de companheiro sinaliza conteúdo adulto — informação relevante, colocada como se fosse benefício.
- **Classificação:** ambos PADRÃO *(pelos elementos citados; o container de paywall de tela cheia: ver 11B)*

### Alan — Cosmético competindo com doação
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/83182397-8aa0-4b18-9cbe-13ab54b60db2
- **Estrutura da tela, de cima para baixo:** seta `‹` + **pílula de saldo `🌐 680`** → **`Exchange` em bold grande** → **três abas: `Vouchers` · `Charities` · `Avatar`** (a terceira ativa, sublinhada em roxo) → **faixa lavanda com o avatar 3D de corpo inteiro** → **folha branca com `Outfit` em bold** → **grade 3×N de cards brancos com roupas ilustradas**, a selecionada com **borda roxa**
- **Copy literal:** "Exchange" · "680" · "Vouchers" · "Charities" · "Avatar" · "Outfit"
- **O mecanismo:** **`Charities` como aba irmã de `Avatar`.** Os pontos ganhos por comportamento podem virar cosmético **ou** doação — no mesmo nível hierárquico, com o mesmo peso de UI. Isso reposiciona o cosmético: ele não compete com progresso (que é o que a regra proíbe), ele compete com altruísmo. **Única estrutura de loja do acervo em que gastar em si mesmo é uma escolha moral visível, e não a única opção.**
- **Variação entre apps:** único do acervo com **destino filantrópico dos pontos** ao lado do cosmético.
- **Quando falha / risco:** pode gerar culpa em quem escolhe o cosmético — o efeito de colocar caridade como alternativa é assimétrico. E exige infraestrutura real de doação.
- **Classificação:** PADRÃO

## 11B — Os anti-padrões (paywall de tela cheia e faixa permanente)

| App | Estrutura + copy literal | Por que é ANTI-PADRÃO aqui | URL |
|---|---|---|---|
| **Vibecode** | `×` no topo → **`Upgrade and get extra free value`** (com `extra free` em magenta) → seletor de 3 planos em pílula (`Plus` `Pro` `Max`) → card com 6 benefícios em `✓` magenta → **`Upgrade to Max`** em botão magenta largura total → `Subscribe for $299.98 / month. Cancel anytime` | Tela cheia, sem `Skip`, **só o `×`** como recusa · `$299.98/mês` no plano em destaque | [link](https://mobbin.com/screens/d5c1dc7e-6661-4551-bb3e-87e6aa10ca84) |
| **Manus** | `×` → **`Upgrade your plan for instant full credits`** em serifada → card `Pro` com pílula `On free trial` → `$29.98 / month` → dropdown `4,000 credits / month` → toggle `Annual (Save $59.78)` → 7 benefícios com ícone → `Cancel anytime` → **`Upgrade now`** em preto largura total | `instant` como gatilho de impaciência · recusa só pelo `×` | [link](https://mobbin.com/screens/aaea53f2-8136-4022-90b3-e39313e215e3) |
| **Mimo** | `×` → **`max`** em lilás + **`Your developer journey starts here`** → 4 benefícios em `✓` → **dois cards de plano lado a lado:** `Yearly $24.92/mo` com pílula **`Most Popular`** e `✓` roxo · `Monthly $39.99/mo` → **`Upgrade to Max`** → `Cancel anytime on the App Store` | **Ancoragem de preço** (anual pré-selecionado, mensal 60% mais caro) · sem `Skip` | [link](https://mobbin.com/screens/4079e1ee-2739-482a-9c07-cca8835d123b) |
| **ChatGPT** | `×` → losango roxo → **`Get ChatGPT Go`** → `Keep chatting with expanded access` → seletor `Go` / `Plus` → **tabela comparativa de 3 colunas** (`Features` / `Free` / `Go`) com `✓` roxo vs. `—` cinza → **`Upgrade for S$ 10.98`** em preto → `Auto-renews monthly. Cancel anytime.` | A **tabela com `—` na coluna `Free`** é privação visualizada — desenha o que você não tem | [link](https://mobbin.com/screens/44631623-18ba-40ae-afbd-6436c459f7ae) |
| **Fixtured** | **`TRY FIXTURED+`** em display condensado → `Upgrade to Fixtured+ for smarter schedules and zero limits` → **tabela `Free` / `Plus`** com **6 linhas de `×` cinza vs. `✓` azul** → **dois cards de plano** com pílula **`38% OFF`** → `Continue` → **`Skip for now`** | **Seis `×` empilhados na coluna `Free`** — a forma mais agressiva de privação do acervo | [link](https://mobbin.com/screens/2a57e9a6-87c6-4c4c-8695-133b87b376ef) |
| **Craft** | `×` esmaecido → **`Remove all limits`** em serifada → `One full-featured account, no content limit. Ideal for individual creators.` → card `Plus Plan` com 5 benefícios em ícone + `... and much more.` → **nenhum preço, nenhum botão de compra visível** → `Restore Purchase` · `Privacy Policy` · `Terms of Use` | **Paywall sem preço e sem CTA** — a pessoa não sabe o que está sendo pedido | [link](https://mobbin.com/screens/12f695b9-7ec8-4dae-a588-f666bc7b1c17) |
| **Revolut Business** | `×` → **imagem de cartão preto em relevo, cinematográfica** → **`Upgrade to unlock`** → `Get the most out of Revolut Business with bespoke account support, higher limits and much more` → link `Terms & Conditions` → **`Upgrade now`** em branco largura total | `unlock` sem dizer o quê · sem preço · sem `Skip` | [link](https://mobbin.com/screens/0c95313b-b0a6-44db-b0fb-dede135eea70) |
| **Tinder** | `×` → imagem de multidão à noite → **`Be Seen`** → `Be a top profile in your area for 30 minutes to help get more Likes` → **folha modal subindo por cima:** `×` → **`Upgrade to Primetime Boosts`** → `Boost while you sleep! You'll automatically be` *(cortado)* → card com **`1 Primetime Boost`**, pílula **`SAVE 13%`**, **`$22.98 total` RISCADO** e `$19.98 total` → `Continue` → **`Skip Offer`** | **Upsell empilhado sobre outra oferta** · preço riscado como pressão | [link](https://mobbin.com/screens/7305caca-e98b-4b8d-a0a8-fd705aa91c65) |
| **Shopify** | Faixa fina: `Select a plan to get your first month for $1.` **acima do checklist de ativação** → e **segundo card de assinatura colado abaixo do checklist**: `Build your dream business for $1/ month` + `Subscribe to get your first month for $1.` + `Select a plan` | **Oferta enxertada dentro do bloco de ativação**, em cima e embaixo — cerca o onboarding | [link](https://mobbin.com/screens/b11c1a81-1d6a-4b9d-b948-297ebf14df50) |

**E a família de faixa promocional permanente** (e-commerce, sem qualquer affordance de
dispensa, ocupando o topo da home para sempre): Careem (`Daily Deals / Up to 50% off`) ·
talabat (`Still paying delivery fees?` / `20% - 40% off Hot Deals`) · Deliveroo (`SUMMER OF
PLUS / 6 weeks of Plus-exclusive deals until 19 July`) · Gymshark (`STUDENTS GET 10% OFF`) ·
Target (`Save $50* on a future qualifying purchase`) · DICK'S (`Winter Clearance Event! Up
to 75% Off`) · Shopee · Under Armour · Starbucks (`CONGRATS GRAD 2026` / `Send an eGift`).
**Nove apps, zero botões de dispensa.** `Classificação: ANTI-PADRÃO`

### Convergência e divergência — Dossiê 11

- **Convergência (6+ apps):** **a tabela comparativa Free vs. Pago é o padrão dominante** — ChatGPT, Fixtured, Character AI, Mimo, Vibecode, Manus. E em todas ela funciona por **privação visualizada**: a coluna gratuita é preenchida com `—` ou `×`, desenhando linha por linha o que a pessoa não tem. **Também convergem no `Cancel anytime` / `Auto renews monthly until canceled`** — presente em 5 dos 9, provavelmente por exigência de loja mais que por escolha.
- **Divergência — e qual é a escolha real:** **onde a oferta vive.** No **fluxo** (paywall de tela cheia que interrompe: 9 apps), no **feed** (card entre conteúdo: Garmin) ou no **topo permanente** (faixa que nunca sai: 9 apps de e-commerce). A escolha real é sobre **o que o app acha que é o custo de uma oferta ignorada.** Quem põe no fluxo acha que o custo é conversão perdida e paga com interrupção; quem põe no feed com `×` acha que o custo é confiança perdida e paga com alcance. **Para o Soulmon, a resposta está na própria tese: se dinheiro nunca compra vantagem de progresso, então a oferta nunca tem urgência legítima — e sem urgência legítima, o paywall interruptivo não tem justificativa funcional, só extrativa.** O modelo é Garmin (card com `×` no feed) + Alan (cosmético competindo com doação) + Finch (`always available`, anti-FOMO declarado).

---

# §13 — DOSSIÊ 12: CARD COMPARTILHÁVEL DE RESUMO

> **Viés declarado:** quase todo "Wrapped" do acervo é construído sobre **número que cresce
> + ranking percentil** (`I'm a top 8% learner`, `Top 10% Diner`, `More active than 90% of
> diners`). Colide com a regra de não expor comparação crua. Registrado com a colisão marcada.

### Duolingo — Wrapped em card 4:5, com recompensa pelo compartilhamento
- **Plataforma / data:** iOS · **data visível na tela: `Nov. 30, 2025`**
- **URL Mobbin:** https://mobbin.com/screens/81b67776-4a5d-40d9-860e-9b3b4122357a
- **Estrutura da tela, de cima para baixo:**
  1. `×` no canto superior esquerdo. **Fundo azul sólido**
  2. **Manchete em bold branco, duas linhas**
  3. **O CARD (retrato ~4:5, cantos arredondados, azul mais claro):**
     - **Cabeçalho:** `duolingo ✨` à esquerda, **`2025 YEAR IN REVIEW` em caixa alta pequena** à direita
     - **Centro: o mascote (coruja) integrado ao numeral `2025`** — a coruja *é* o zero, em display muito grande e branco, com brilhos
     - **Linha de afirmação em bold, duas linhas, centralizada**
     - **Grade 2×2 de cartões brancos**, cada um com **ícone + valor em bold + rótulo em cinza**
     - **Rodapé do card em cinza claro** com a data de corte
  4. **Botão branco pílula de largura total, em caixa alta azul, com ícone de compartilhar**
- **Copy literal:** "Share your progress and keep learning next year!" · "duolingo" · "2025 YEAR IN REVIEW" · "2025" · "I'm a top 8% learner on Duolingo!" · "French Score" · "19" · "longest streak" · "837" · "total XP" · "12949" · "minutes spent" · "1374" · "Your Duolingo stats as of Nov. 30, 2025" · "SHARE FOR A REWARD"
- **O mecanismo:** (a) **A afirmação em primeira pessoa** — o card não descreve o usuário, ele **fala pela boca dele**, o que o torna colável em rede social sem edição; (b) **grade 2×2 é o limite de legibilidade** num card visto em stories — quatro números, nunca oito; (c) **`as of Nov. 30, 2025`** dá precisão auditável e evita a leitura de número inflado; (d) **`SHARE FOR A REWARD`** — o app paga pelo compartilhamento, **convertendo o pedido em transação e removendo o constrangimento**: a pessoa não está se exibindo, está coletando um prêmio.
- **Variação entre apps:** o único que **recompensa explicitamente o compartilhamento**, e o único que **integra o mascote ao numeral do ano**.
- **Quando falha / risco:** `top 8% learner` é **ranking percentil** — precisamente o que a tese exclui. E `837 longest streak` só é compartilhável enquanto vivo. **Para o Soulmon, a estrutura (card 4:5, afirmação em 1ª pessoa, grade 2×2, data de corte, recompensa) é integralmente aproveitável trocando as quatro métricas por dados que só crescem.**
- **Classificação:** PADRÃO *(estrutura) · `top 8%`: ANTI-PADRÃO*

### Spotify — Wrapped como carrossel de cartazes, com "one more thing"
- **Plataforma / data:** iOS · data não exposta pelo MCP; o card é do ciclo `2025`
- **URL Mobbin:** https://mobbin.com/screens/6b681412-559a-4fbf-af3e-1e97b4207e84
- **Estrutura da tela, de cima para baixo:**
  1. Seta `‹` (esq.) · **logo do Spotify centralizado** · ícone de áudio (dir.)
  2. **Carrossel horizontal: cards quadrados brancos**, o ativo centralizado e os vizinhos espiando pelas bordas
  3. **Dentro do card ativo:** **numeral `2025` em tipografia display gigante ao fundo**, cortado, em amarelo e preto-e-branco quadriculado — **a arte da campanha invade as bordas do card** → **fotografia do artista** sobreposta e ligeiramente rotacionada → **duas colunas de listas numeradas** → **duas métricas na base** → **rodapé:** logo + `SPOTIFY.COM/WRAPPED`
  4. **Quatro pontos de paginação** sob o carrossel
  5. **Botão preto pílula de largura parcial:** `Share`
  6. **Abaixo: `One more thing ...` em bold** com **duas setas para baixo apontando** para uma faixa de gradiente lilás
- **Copy literal:** "2025" · "Top Artists" · "1 SZA" · "2 D.O." · "3 CODY JON" · "4 ENHYPEN" · "5 CORTIS" · "Top Songs" · "1 Nobody Gets Me" · "2 My Dear" · "3 Snooze" · "4 Loose" · "5 BMF" · "Minutes Listened" · "12,775" · "Top Genre" · "K-Pop" · "SPOTIFY.COM/WRAPPED" · "Share" · "One more thing ..."
- **O mecanismo:** (a) **Listas ordenadas em vez de agregados** — `Top Artists` com cinco nomes é infinitamente mais compartilhável que "12.775 minutos", porque **nomes próprios são identidade**, e identidade é o que se posta; (b) **a arte da campanha, não a do produto** — o `2025` quadriculado não pertence ao design system do Spotify, e é isso que faz o Wrapped parecer um evento anual em vez de um relatório; (c) **`One more thing...`** cria uma segunda descoberta *dentro* do resumo.
- **Variação entre apps:** o único **carrossel de múltiplos cards**, o único com **listas nomeadas ordenadas**, e o único com **URL da campanha impressa no card**.
- **Quando falha / risco:** depende de o usuário ter **conteúdo nomeável**. Um app de hábitos tem números, não nomes próprios — **mas o Soulmon tem: o nome da criatura, o nome da forma atual, os nomes dos estágios percorridos.** Onde o Spotify põe `Top Artists`, o Soulmon põe a linhagem da criatura.
- **Classificação:** PADRÃO

### Uxcel Go — O card feito para stories, com o pedido de menção
- **Plataforma / data:** iOS · data não exposta pelo MCP · *app pequeno*
- **URL Mobbin:** https://mobbin.com/screens/a849139b-8acf-4bd6-9046-3d9ee8381db5
- **Estrutura da tela, de cima para baixo:**
  1. Folha modal: **`Share to story` em bold** à esquerda, `×` à direita
  2. **O CARD, em proporção vertical de story (~9:16), fundo lavanda muito claro:**
     - **No topo do card: um círculo cinza e três barras cinza de larguras variadas** — **simulação do avatar e do nome de usuário do Instagram**, indicando onde a UI da plataforma vai cobrir
     - **Círculo rosa com a inicial `A`** centralizado
     - **Afirmação em bold, duas linhas, centralizada**
     - **Grade 2×2 de cards brancos** com ícone + valor + rótulo em caixa alta
     - **Rodapé:** logo hexagonal preto + `uxcel` + slogan
  3. **Botão roxo pílula de largura total** · **Abaixo, em cinza:** o pedido de menção
- **Copy literal:** "Share to story" · "I've been learning design for 2 days in a row" · "DAY STREAK" · "2" · "BEST STREAK" · "2" · "TOTAL PX" · "555" · "LEAGUE" · "Quartz" · "uxcel" · "The best way to learn UX/UI design" · "Share with" · "Tag @uxcel.app and we can repost your story"
- **O mecanismo:** **a moldura de story simulada é a decisão inteligente.** Ao desenhar o avatar e o nome de usuário falsos no topo, o app **reserva a área que a UI do Instagram vai ocupar** — garantindo que nenhum dado seja coberto. Detalhe de produção que quase todo mundo erra. E o pedido de menção oferece **contrapartida de alcance**.
- **Variação entre apps:** o único que **simula a UI da plataforma de destino dentro do próprio card**, e o único que declara o **slogan do produto** no rodapé.
- **Quando falha / risco:** `2 days in a row` e `555 TOTAL PX` são números baixos — **compartilhar conquista pequena é constrangedor**, e o app oferece isso no segundo dia. **A pergunta que ele não faz: existe um piso abaixo do qual não se deve oferecer compartilhamento?**
- **Classificação:** PADRÃO *(o card e a moldura) · o timing no dia 2: LIMÍTROFE*

### Beli — Card horizontal, com percentil populacional na terceira linha
- **Plataforma / data:** iOS · data não exposta pelo MCP · *app pequeno*
- **URL Mobbin:** https://mobbin.com/screens/b486127e-a01f-4659-9abb-74b16f1f69b5
- **Estrutura:** seta `‹` + compartilhar, sobre **fundo em gradiente lavanda suave** → **o CARD (retangular horizontal, azul-marinho sólido):** `LAST 30 DAYS` em caixa alta pequena → **título em bold branco grande** → `📍 New York` em cinza → **duas métricas lado a lado, cada uma com valor em display grande e rótulo com ícone abaixo** → **linha de contexto em cinza** → **logo `beli` em serifada, centralizado na base** → **folha branca subindo:** `Share this page` + **fileira horizontal de destinos com ícone e rótulo**
- **Copy literal:** "LAST 30 DAYS" · "Top 10% Diner" · "New York" · "20" · "Restaurants" · "18" · "Cuisines" · "More active than 90% of diners in New York" · "beli" · "Share this page" · "IG Story" · "IG Post" · "TikTok" · "Messages"
- **O mecanismo:** **`LAST 30 DAYS` em vez de "ano"** — o resumo não precisa ser anual, e uma janela de 30 dias torna o card recorrente (12 oportunidades por ano, não uma). E **`New York` como escopo** faz o percentil local parecer alcançável. A **folha de destinos com IG Story e IG Post separados** reconhece que são formatos diferentes (9:16 vs. 1:1).
- **Variação entre apps:** o único com **janela de 30 dias**, o único com **escopo geográfico**, e o único que **separa IG Story de IG Post**.
- **Quando falha / risco:** **duas afirmações de percentil no mesmo card** — a mesma informação dita duas vezes, e integralmente ranking comparativo. Aproveitável **só** na estrutura e na janela temporal.
- **Classificação:** LIMÍTROFE

### Paired e pliability — resumo relacional e resumo com foto do usuário
- **URLs Mobbin:**
  - Paired: https://mobbin.com/screens/cec9f906-0583-43e6-b6fe-3622ec26d2b2
  - pliability: https://mobbin.com/screens/7bd2568c-0959-4a9f-8375-48f6cecf0f5d
- **Estrutura (Paired):** fundo **roxo sólido vibrante** + `×` circular branco → **card branco horizontal centralizado:** **dois avatares circulares sobrepostos** com brilhos lilás → **três colunas, cada uma com ícone + rótulo em cinza pequeno + duas barras coloridas empilhadas com um valor em cada** → **logo `♥ paired`** no canto inferior direito → **dois botões brancos pílula empilhados, largura total**
- **Estrutura (pliability):** seta `‹` → **carrossel horizontal de cards verticais** → **dentro do card ativo:** logo + **data** no topo → **título em bold branco** → **fotografia do próprio usuário** ocupando o card → **sobreposto na base:** `This week` + **`1/7 days`** + fileira `M T W T F S S` com um dia em pílula amarela → `Last 30 Days` + **`3%`** → barra com marcador → `Current Streak` e `Best Streak` → **abaixo do carrossel:** `Activity` + linha de apoio → **cinco círculos de tema selecionáveis** → **botão circular de compartilhar**
- **Copy literal:** Paired: "Conversations answered" · "20" · "7" · "Current streak days" · "3" · "1" · "Couple games won" · "1" · "-" · "paired" · "Instagram stories" · "Share" — pliability: "Mar 13, 2026" · "Upper Body" · "This week" · "1/7 days" · "Last 30 Days" · "3%" · "Current Streak" · "1 week" · "Best Streak" · "1 week" · "Activity" · "Share your personalized stats and show how consistent you've been."
- **O mecanismo:** Paired é o único resumo **de duas pessoas** — as barras pareadas por métrica transformam o card em comparação íntima, e **`-` em vez de `0`** na última célula é um detalhe fino: o travessão não acusa. pliability é o único que oferece **seletor de tema do card** (cinco fundos), e o único que **põe a foto do próprio usuário** no resumo — resolve identidade visual sem produzir arte.
- **Variação entre apps:** Paired é o único **relacional**; pliability é o único **com tema customizável** e **com foto do usuário como fundo**.
- **Quando falha / risco:** as barras pareadas do Paired **expõem quem fez menos** — comparação dentro de um casal é risco social real. E pliability compartilha **`1/7 days` e `3%`** — mesmo problema de piso do Uxcel.
- **Classificação:** Paired — LIMÍTROFE · pliability — PADRÃO *(o seletor de tema)*

### Polarsteps, Goodreads, Future Pro e Marriott — quatro variações estruturais
- **URLs Mobbin:**
  - Polarsteps: https://mobbin.com/screens/cca74022-8ef8-4b95-83a6-c968b545d5e4
  - Goodreads: https://mobbin.com/screens/2aa78a42-966e-43c2-bd75-171b90280565
  - Future Pro: https://mobbin.com/screens/07ff4e2b-cb88-454c-884c-591045ca99e4
  - Marriott Bonvoy: https://mobbin.com/screens/145c73c3-669c-4b43-ace5-e617c6efb76f
- **Polarsteps — o dado como mapa:** folha com `Share your travel stats` + `×` → **card vertical azul-noite:** afirmação em bold branco no topo → **mapa-múndi em cinza-escuro com os países visitados em branco** → **avatar circular do usuário sobreposto no centro** → **duas fileiras de bandeiras circulares** na base, as das pontas esmaecidas → rodapé `polarsteps` + `mapbox` → **dois botões circulares: `Download` e `Other`**. Copy: "I've explored 3 countries". *O único que usa **visualização geográfica em vez de números** — e o único cuja ação primária é `Download`, não compartilhar direto.*
- **Goodreads — o card com estado vazio honesto:** seta `‹` + `Alex's Year in Books` → **linha esmaecida: `You read 0 books in 2025!` + botão verde `Get Your Year in Books`** → link `Go to previous year` → **o card (retrato, fundo amarelo-manteiga com estrelas e rabiscos):** `goodreads` + `2025` + **`Year in Books` em serifada grande** → **duas métricas laterais: `210 / pages read` e `1 / books read`**, com um livro ilustrado ao centro → **`Alex Smith` em serifada** → barra inferior `◀ ▶ ↻ ⇧`. *O único que **exibe o card mesmo com dados irrisórios** e o único com **controles de navegação entre anos**.*
- **Future Pro — o resumo como card empilhado, no fim da sessão:** `×` + **`Today • 11:23 AM`** + `···` → **abas `Summary` (ativa) · `Feedback` · `Exercises` (badge `1`)** → **carrossel de cards verticais brancos em gradiente suave:** cada um com **foto circular do coach + `Coach Lee`**, **duas métricas em display grande alinhadas à esquerda** (`50 / Est. Calorie Burn`, `18:51 / Duration`), e **texto girado 90° na borda direita** (`Morning Yoga Flow`, `06.30.26`) → **botão de câmera** + **botão preto pílula `⇧ Share`**. *O único que **entrega o resumo ao fim de cada sessão**, não do ano — e o único com **tipografia rotacionada** como recurso de composição.*
- **Marriott — o card com convite explícito à vaidade:** folha modal com `×` → **`Share Your Achievements` em bold grande** → **`Feel free to brag a little! Show off your Marriott Bonvoy travel journey with this quick-view card that highlights all your achievements to date.`** → **card horizontal em gradiente laranja:** `⌚ Member` + logo no topo → **grade 2×2 de métricas, todas em `0`:** `TOTAL POINTS 0` · `NIGHTS THIS YEAR 0` · `LOYALTY YEARS 0` · `TOTAL NIGHTS 0` → **botão preto pílula largura total `Share`**. *O único que **nomeia o ato de se exibir** — e, ironicamente, **o único cujo card está inteiramente em zero**.*
- **O mecanismo, comparado:** os quatro mostram que **o "Wrapped" não precisa ser anual nem numérico.** Polarsteps prova que **uma visualização pode substituir a métrica**. Future Pro prova que **a cadência pode ser por sessão**, o que multiplica as oportunidades por centenas. Goodreads e Marriott provam o oposto: **card com dado zero é pior que card nenhum.**
- **Quando falha / risco:** o `Feel free to brag a little!` do Marriott sobre um card com quatro zeros é a falha mais didática do dossiê: **a copy assume um estado de dados que o produto não verificou.** É o argumento mais forte para o piso de compartilhamento.
- **Classificação:** Polarsteps — PADRÃO · Future Pro — PADRÃO · Goodreads — LIMÍTROFE · Marriott — ANTI-PADRÃO

### Convergência e divergência — Dossiê 12

- **Convergência (6+ apps):** **a grade 2×2 de métricas é a estrutura universal** — Duolingo, Uxcel, Marriott, Goodreads (2 laterais), Beli (2), Future Pro (2). **Quatro números é o teto**; ninguém tenta seis. **Todos** põem a **marca no rodapé do card** (logo, e às vezes slogan ou URL), porque o card circula fora do app. E **5 dos 10 usam afirmação em primeira pessoa** — o card fala pela boca do usuário, não sobre ele.
- **Divergência — e qual é a escolha real:** **como o app pede o compartilhamento sem constranger.** Quatro estratégias, e elas revelam o que cada app acha que está pedindo: **pagar** (`SHARE FOR A REWARD` — Duolingo: é transação, não favor); **oferecer alcance** (`Tag @uxcel.app and we can repost your story`); **autorizar a vaidade** (`Feel free to brag a little!` — Marriott); **e não pedir nada** (`Share` seco — Spotify, Tonal, Future Pro: o card é bom o suficiente para se vender). **Para o Soulmon, a hipótese mais forte é a quarta com um ajuste: a criatura é o ativo compartilhável, não a métrica.** Um card com o nome, a forma atual e a data de eclosão da criatura é intrinsecamente postável — enquanto "N dos últimos 7 dias" não é. **E dado o problema de piso (Uxcel no dia 2, Marriott com quatro zeros), o compartilhamento provavelmente deve ser oferecido a partir de um marco de evolução — uma forma nova — e não numa cadência de calendário.**

---

# §14 — DOSSIÊ 13: CAMADA SOCIAL

> Dossiê aberto no segundo passe, depois de a camada social ser confirmada. A primeira busca
> retornou só **6 resultados** — o acervo é raso nesta frente para apps de hábito; a maior
> parte do que existe é social genérico ou e-commerce.
>
> **Resposta direta à pergunta que motivou o passe:** existe **um** app que mostra a
> criatura do outro sem produzir comparação, e ele faz isso **removendo todo número da tela
> de amigos**. Todos os outros que mostram o progresso do amigo produzem ranking, com ou
> sem leaderboard.

## 13A — O padrão que resolve

### Finch — A árvore de amigos: pets visíveis, zero métrica
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/e6c040ad-7636-4b80-9129-1e101a6483e9
- **Estrutura da tela, de cima para baixo:**
  1. **Sem cabeçalho de título.** No canto superior direito, três affordances: **ícone circular com o rosto de um pet**, **balão de fala** e **engrenagem**
  2. **Céu azul-noite** no topo, transicionando para
  3. **A copa de uma árvore ilustrada em verdes**, ocupando ~55% da tela, com o tronco descendo ao centro
  4. **Dois pets pousados na copa, em alturas diferentes:**
     - À esquerda: **pet cinza com etiqueta vermelha `New`** → abaixo, **`Pet` em bold escuro** e **`Alex` em cinza menor**
     - Ao centro-direita: **o pet do usuário** → abaixo, **`Lee` em bold** e **`Sam Lee` em cinza**
     - À direita: **uma placa de madeira com `???`** pregada num galho — **slot vazio, marcado por interrogação, não por cadeado**
  5. **Faixa verde-claro na base da árvore:** **botão branco pílula, largura parcial, centralizado: `⊕ Add friend`** → **card verde-escuro:** **rótulo em caixa alta amarela** → **título em bold branco** → **ilustração de uma vaca branca à esquerda** → **chevron `›` em círculo à direita**
  6. **Tab bar de 6 itens ilustrados com rótulo:** `Home` · `Quests` (badge `1`) · `Shop` (badge `1`) · **`Friends` (ativo, em pílula clara)** · `Bag` · `Lee`
- **Copy literal:** "New" · "Pet" · "Alex" · "Lee" · "Sam Lee" · "???" · "Add friend" · "MEET COOKIE THE COW" · "Invite friends to get this micropet!" · "Home" · "Quests" · "Shop" · "Friends" · "Bag" · "Lee"
- **O mecanismo — quatro decisões, e a primeira faz todo o trabalho:**
  1. **Nenhum número existe na tela.** Sem streak, sem nível, sem estágio nomeado, sem XP, sem data. **Não há nada para comparar** — e é por isso que a comparação não acontece. Não é que o Finch a mitigue com copy gentil; ele **remove o substrato de dados** que a tornaria possível.
  2. **A árvore é um lugar compartilhado, não uma lista.** Uma lista tem ordem, e ordem é ranking implícito. Uma árvore tem **posições sem hierarquia** — os pets estão em alturas diferentes por composição, não por mérito, e nada indica que estar mais alto é melhor.
  3. **`Pet / Alex` — o pet vem antes da pessoa.** A identidade exibida é a da criatura, com o humano como segunda linha em cinza. O social é entre pets, não entre usuários.
  4. **`???` como slot vazio**, coerente com o `?` da coleção (dossiê 7). Espaço para crescer, não ausência marcada.
  E o card de convite paga em **cosmético**, não em dinheiro nem em vantagem — mantém a regra de monetização intacta e transforma o convite em item de coleção.
- **Variação entre apps:** **é o único do acervo inteiro com tela social sem uma única métrica.** Todos os outros exibem pelo menos um número por pessoa.
- **Quando falha / risco:** com muitos amigos, a árvore não escala — 30 pets numa copa é ilegível, e a solução óbvia (paginar, listar) reintroduz a ordem que a metáfora existia para evitar. **A questão de escala é real e o acervo não a responde:** não há captura da tela de amigos do Finch com muitos amigos. E `Pet / Alex` sem nome personalizado sugere que o amigo não nomeou o próprio pet — expõe um estado degradado na tela social.
- **Classificação:** PADRÃO — **modelo de referência para a camada social do Soulmon.**

### Finch — A ficha do amigo: três ações, nenhuma métrica, e o par de pets abraçados
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/c145cb8d-3bcf-4fd6-944f-57269092f22b
- **Estrutura da tela, de cima para baixo:**
  1. **Seta `‹` em botão circular** (esq.) e **`···`** (dir.), sobre a cena
  2. **A cena do quarto do amigo, ilustrada em turquesa:** janela redonda de vidros azuis, cômoda, **porta laranja com um coração rosa no vidro**, e **o ninho de palha à esquerda** — o mesmo layout do quarto do usuário, com decoração diferente
  3. **O pet do amigo (bege claro) de pé no centro do quarto**, com sombra
  4. **`Baby Minty & Alex` em bold branco**, centralizado — **o nome do pet E o nome da pessoa, unidos por `&`**, tratados como uma dupla
  5. **Três botões brancos quadrados de cantos arredondados, lado a lado, largura igual**, cada um com **ícone nu acima e rótulo em bold abaixo:** **`Share Goal`** (prancheta com check) · **`Send Good Vibes`** (estrela/brilho) · **`Send Gift`** (presente) — **o terceiro esmaecido/desabilitado**, indicando que já foi usado hoje
  6. **Grande área vazia** em turquesa sólido
  7. **Na base, sobre a cena: os dois pets ilustrados abraçados** (o do usuário e o do amigo)
  8. **Card branco de cantos arredondados subindo:** **título em bold escuro** → **duas linhas em cinza** → **botão verde pílula de largura total**
  9. **Toast preto de cantos arredondados sobre tudo, na base**
- **Copy literal:** "Baby Minty & Alex" · "Share Goal" · "Send Good Vibes" · "Send Gift" · "Building habits is better together" · "With friends by your side, no goal is out of reach! Start your hype squad today." · "Buddy up" · "You sent a gift to Baby Minty & Alex!"
- **O mecanismo — o achado mais forte do dossiê:**
  - **As três ações são todas de dar, nenhuma de medir.** O usuário não pode *olhar* o desempenho do amigo, só *contribuir* para ele. **A ausência de uma quarta ação ("ver progresso") é a decisão de produto.**
  - **`Send Good Vibes` é um gesto de custo zero e valor puro** — não consome moeda, não exige texto, não pede nada em troca. Equivalente social do `Well done!` do widget do Mimo: afeto sem dado.
  - **`Baby Minty & Alex`** trata pet e humano como entidade única. Reforça que quem você visita é *a dupla*, o que torna a visita menos invasiva.
  - **`Send Gift` desabilitado** comunica limite diário sem cronômetro, sem contador e sem aviso de escassez.
  - **Os dois pets abraçados na base** carregam a reciprocidade sem texto — e **`hype squad`** é o vocabulário oposto a `leaderboard`.
  - **`Buddy up`** propõe um vínculo formal (parceria de hábito) — cooperação estruturada, o único mecanismo social do acervo que produz interdependência sem ranking.
- **Variação entre apps:** o único que **oferece só ações de dar**, e o único onde **a visita mostra o ambiente do amigo** (o quarto) em vez de um perfil com estatísticas. Também o único que **une pet e humano num nome composto**.
- **Quando falha / risco:** `Send Good Vibes` sem custo pode virar ruído se o app permitir spam — e o acervo não mostra o lado do recebedor. `Buddy up` cria interdependência, o que significa que **a falha de um pode decepcionar o outro** — forma nova de pressão, estruturalmente diferente do streak individual. E **não há captura do estado com muitos amigos.**
- **Classificação:** PADRÃO

### Finch — `Goal Buddy`: comparação lado a lado, feita direito
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/66ad7e4f-870b-4482-b752-3984909e178c
- **Estrutura da tela, de cima para baixo:**
  1. `×` circular → **pílula `1 DAY`** → **manchete em bold branco sobre roxo**
  2. **Os dois pets lado a lado com brilhos azuis** → curva branca separando
  3. Pergunta em cinza, centralizada
  4. **Card branco com o hábito (`💧 Drink water`) e DUAS FILEIRAS SEMANAIS EMPILHADAS**: `YOU` com avatar do próprio pet, `ALEX` com o dele, colunas `M T W T F S S`, **a coluna `W` destacada em pílula azul-escura com `✓` nas duas linhas** → chevron `›`
  5. **Botão roxo largura total:** `Send kudos`
- **Copy literal:** "1 DAY" · "Your Goal Buddy challenge with Alex has begun!" · "How many times can you and **Alex** complete this goal in one week?" · "Drink water" · "YOU" · "ALEX" · "Send kudos"
- **O mecanismo — e é a peça central para uma camada social com comparação aceita:** a pergunta é **`How many times can you AND Alex complete this goal`** — não "quem completa mais". As duas fileiras estão empilhadas, comparáveis célula por célula, e **a única ação disponível é `Send kudos`.** Não existe botão de vencer. **Comparação total, competição zero** — porque o placar é somado, não confrontado.
- **Variação entre apps:** o único do acervo com **comparação individual explícita e nenhuma mecânica competitiva**.
- **Quando falha / risco:** exige simetria de hábito (os dois precisam ter o mesmo objetivo). E se um dos dois abandonar, a fileira vazia dele fica visível para o outro — pressão sem intenção.
- **Classificação:** PADRÃO

### How We Feel — Feed de amigos por estado emocional, sem nenhuma métrica
- **Plataforma / data:** iOS · data não exposta pelo MCP · *app pequeno (sem fins de lucro)*
- **URL Mobbin:** https://mobbin.com/screens/da319329-ed00-42dd-9ee6-286a6f578a60
- **Estrutura da tela, de cima para baixo:**
  1. **`Friends` em bold branco grande** (esq.) + **`+`** (dir.), sobre fundo preto
  2. **Cards retangulares de cantos muito arredondados, empilhados**, cada um com **fotografia de fundo em tratamento escuro**:
     - **Card 1:** timestamp em cinza pequeno → **`I'm feeling` em itálico branco** + **`focused` em itálico amarelo** (a emoção colorida) → **miniatura fotográfica no canto inferior direito**
     - **Card 2:** **emoji `😢` solto acima do card** → timestamp → **`Joshua feels` em itálico branco** + **`apathetic` em itálico azul-claro** → miniatura no canto
  3. **Card 3, em estado de transação:** **pílula `Undo` no canto superior esquerdo** → **nome em itálico bold** → **estado em cinza** → **avatar circular à direita, sobre um toggle escuro**
  4. **Botão circular cinza grande com `+`** → **`Add a friend` em cinza** → linha de escopo em cinza mais escuro
  5. **Tab bar de 4 itens com ícone nu + rótulo:** `Check in` · `Tools` · **`Friends` (ativo, em verde)** · `Analyze`
- **Copy literal:** "Friends" · "23 minutes ago" · "I'm feeling" · "focused" · "5 seconds ago" · "Joshua feels" · "apathetic" · "Undo" · "Jessica" · "Friend request sent" · "Add a friend" · "Invite the people closest to you" · "Check in" · "Tools" · "Friends" · "Analyze"
- **O mecanismo:** **o social é sobre estado, não sobre desempenho.** `Joshua feels apathetic` não é comparável com `I'm feeling focused` — **estados emocionais não têm ordem**, então não há como classificar quem está melhor. Solução conceitual diferente da do Finch (que remove os números): aqui o dado exibido é **categoricamente não-ordenável**. E **`Invite the people closest to you`** define o escopo social em uma linha: não é rede, é círculo íntimo. O **`Undo` na solicitação enviada** é reversibilidade num gesto social, que quase ninguém oferece.
- **Variação entre apps:** o único cujo conteúdo social é **estado emocional** em vez de progresso, o único com **`Undo` em solicitação de amizade**, e o único que **declara o tamanho pretendido da rede** na copy.
- **Quando falha / risco:** publicar `apathetic` para amigos é exposição real. **Para o Soulmon, o análogo seria expor o estado da criatura — e se o estado da criatura reflete o comportamento do usuário, então expor o estado É expor o desempenho, só sem número.** Uma criatura visivelmente abatida na árvore de amigos é uma acusação pública sem algarismos. **Este é o risco central da camada social do Soulmon, e ele não aparece em nenhum app do acervo porque nenhum deles tem criatura cujo estado dependa do desempenho.**
- **Classificação:** PADRÃO *(o mecanismo) — com o alerta acima, específico do produto*

### Lapse — `Best friend of`: prestígio social recíproco, sem placar
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/ecb2ebd0-fb41-4327-87a3-7da55465ec0e
- **Estrutura da tela, de cima para baixo:**
  1. Seta `‹` em botão circular → **`Best friends` em bold branco** centralizado, com **subtítulo `🌙 Yours` em cinza pequeno**
  2. **Seletor segmentado de duas posições:** `Best friends` (inativo) · **`Best friend of` (ativo, em pílula cinza-clara)**
  3. **Raios radiais sutis** sobre fundo preto
  4. **Um coração grande em gradiente dourado/amarelo, com o numeral `1` vazado ao centro** — o emblema
  5. **`Best friends` em bold branco** abaixo do emblema
  6. **Rótulo de seção: `Best friend of`**
  7. **Uma linha de pessoa:** **medalha circular dourada com `1`** → **fotografia circular** → **`Sam` em bold branco** e **`samleemobbin` em cinza**
- **Copy literal:** "Best friends" · "Yours" · "Best friends" · "Best friend of" · "1" · "Best friends" · "Best friend of" · "Sam" · "samleemobbin"
- **O mecanismo:** **reciprocidade como conquista.** A aba `Best friend of` mede algo que **não depende do esforço do usuário** — depende de outra pessoa te escolher. Prestígio social genuíno sem métrica de desempenho, e o análogo social do `Owned by 23%` do Opal: um fato sobre o mundo, não uma pontuação sua.
- **Variação entre apps:** o único que **separa "quem eu escolhi" de "quem me escolheu"** em abas, e o único cujo prestígio social é **atribuído por terceiros**.
- **Quando falha / risco:** `1` best friend é número baixo em display grande — e a aba `Best friend of` **vazia** seria devastadora. O acervo não mostra esse estado. Um sistema que mede reciprocidade cria vencedores e perdedores da popularidade, mesmo sem placar.
- **Classificação:** LIMÍTROFE

### Telegram — `Hide My Name`: presente com anonimato opcional
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/b02dba91-e734-4842-9313-d14c95ff0c52
- **Estrutura da tela, de cima para baixo:**
  1. **Modal `Send a Gift`** ao fundo: `×`, texto, **`Balance 🪙 0`**, abas `All Gifts` / `Collectibles`
  2. **Segunda folha sobreposta**, verde-menta com padrão de ícones: `×` → **pílula clara centralizada** → **card verde de cantos arredondados:** **ilustração de um ursinho de pelúcia** → **título em bold branco** → **linha em branco menor** → **botão pílula translúcido `View`** → **campo de texto translúcido**
  3. **Bloco branco:** **linha com `Hide My Name` e um toggle DESLIGADO** → **legenda em cinza, duas linhas**
  4. **Botão azul pílula de largura total**
- **Copy literal:** "Send a Gift" · "Balance" · "0" · "All Gifts" · "Collectibles" · "You sent a gift for 15 Stars" · "Gift for Jane" · "Jane can add this gift to their profile or convert it to 13 Stars." · "View" · "Enter Message (Optional)" · "Hide My Name" · "Hide my name and message from visitors to Jane's profile. Jane will still see your name and message." · "Send a Gift for ★ 15"
- **O mecanismo:** **privacidade granular e honesta.** A legenda distingue com precisão cirúrgica **dois públicos**: os visitantes do perfil (que não veem) e a destinatária (que vê). Permite generosidade sem exibicionismo — e é a única implementação do acervo que reconhece que **um presente tem plateia.** Detalhe secundário: `convert it to 13 Stars` (de 15) — o presente é conversível com perda, o que preserva o valor de ter recebido sem prender o recebedor ao objeto.
- **Variação entre apps:** único com **toggle de anonimato em presente**, e único que **permite converter o presente recebido**.
- **Quando falha / risco:** presente precificado em moeda comprável transforma afeto em transação — quem gasta mais parece se importar mais. **Para o Soulmon, `Send Good Vibes` do Finch (custo zero) é o modelo certo; presente pago cria hierarquia de afeto.**
- **Classificação:** PADRÃO *(o toggle) · presente monetizado: ANTI-PADRÃO*

### Ten Percent Happier — `Imperfect Meditation Challenge`
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/3cf91140-93c2-4eed-83c8-7086b1169d03
- **Estrutura da tela, de cima para baixo:** `×` → **`Imperfect Meditation Challenge` em serifada grande, duas linhas**, com ilustração de tigela de macarrão à direita → **subtítulo em cinza** → **bloco cinza-claro com três métricas empilhadas, cada uma com valor em display e rótulo em caixa alta:** participantes, minutos, média global → **três pontos de paginação** → **`Today's Session` em bold** → **dois cards fotográficos de vídeo** lado a lado
- **Copy literal:** "Imperfect Meditation Challenge" · "Meditate for 10 of 14 days" · "60,296 PARTICIPANTS" · "2,020,564 MINDFUL MINUTES" · "15 min GLOBAL DAILY AVERAGE" · "Today's Session"
- **O mecanismo — dois achados numa tela:** (a) **`Imperfect` no nome do desafio** — a permissão de falhar está no título, não numa nota de rodapé. **Antídoto exato ao `Perfect Week` do Duolingo**, que implica o próprio oposto; (b) **`Meditate for 10 of 14 days`** é literalmente a mecânica de constância do Soulmon ("N dos últimos 7") usada como enunciado de desafio. E os números agregados são **populacionais**, não individuais — ninguém é comparado.
- **Variação entre apps:** o único que **põe a tolerância à falha no nome do produto**, e o único cujas métricas sociais são **exclusivamente agregadas**.
- **Quando falha / risco:** `15 min GLOBAL DAILY AVERAGE` é uma média contra a qual a pessoa pode se medir — comparação implícita reintroduzida pela porta dos fundos.
- **Classificação:** PADRÃO

### Strava e Commons — meta somada, participação sem ranking
- **URLs Mobbin:**
  - Strava: https://mobbin.com/screens/a2b368f1-0588-49bc-8384-2f7de6b01420
  - Commons: https://mobbin.com/screens/4021a35a-09d4-4c63-9971-eafa2774b09c
- **Estrutura (Strava):** `‹ Groups` + `Challenge` + `···` → faixa de fotos → **`Group Goal - Elevation` em bold grande** + `Let's go!` → **avatares circulares dos participantes + botão `+` laranja** → **três linhas de metadado com ícone:** período, meta (`Goal - 1,000 Meters`), atividades qualificadas → nota em cinza → linha `0 Comments` → **`Group Effort` em bold** → **card branco: `0 m / 1,000 m` à esquerda e `183 days left` à direita** → **linha individual: avatar + `You` + `Last activity: Today` + `0 m`**
- **Estrutura (Commons):** avatar + **pílula `💙 100`** → **`MAY COLLECTIVE CHALLENGE` em caixa alta** → **card laranja com fotografia de alimentos e o nome da campanha em tipografia branca sobreposta** → **pílula `⏱ 18 DAYS LEFT`** → **título em bold, duas linhas** → **barra de progresso azul com `2,000` na ponta** → parágrafo → **pílula `💙 500 BONUS`** → **avatares sobrepostos + `1,285 people have joined!`** → **botão outline largura total `JOIN CHALLENGE`**
- **Copy literal:** Strava: "Group Goal - Elevation" · "Let's go!" · "June 4 - December 4, 2026" · "Goal - 1,000 Meters" · "Qualifying Activities: Hike, Run" · "Activities must be set to Everyone or Followers Only to count toward this challenge." · "0 Comments" · "Group Effort" · "0 m / 1,000 m" · "183 days left" · "You" · "Last activity: Today" · "0 m" — Commons: "MAY COLLECTIVE CHALLENGE" · "18 DAYS LEFT" · "DON'T LET GOOD FOOD GO TO WASTE" · "2,000" · "Rescue surplus food from local restaurants with Too Good To Go." · "500 BONUS" · "1,285 people have joined!" · "JOIN CHALLENGE"
- **O mecanismo:** **`Group Effort` como número único e somado** — o Strava exibe o progresso do grupo, não de cada membro (só a própria linha do usuário aparece). Commons vai além: **`1,285 people have joined!` é contagem de participação, não de desempenho** — ninguém é ranqueado, e o número cresce com a adesão. **Meta coletiva é a estrutura que torna a comparação irrelevante: o esforço de um soma ao do outro em vez de competir.**
- **Variação entre apps:** Strava é o único que **declara as atividades qualificadas e a exigência de privacidade** antes da adesão. Commons é o único cuja meta coletiva tem **finalidade externa** (resgatar comida), não performance dos participantes.
- **Quando falha / risco:** `0 m / 1,000 m` com `183 days left` é um estado inicial sem tração. E `18 DAYS LEFT` do Commons é contagem regressiva de escassez.
- **Classificação:** ambos PADRÃO

## 13B — Os anti-padrões (a comparação, e onde ela mora)

### Mimo — O perfil do amigo é um painel de métricas dele
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/c1fa3ffb-c0fd-46e8-8d98-80c2e58ae973
- **Estrutura da tela, de cima para baixo:**
  1. **Faixa azul de confirmação no topo** (feedback enviado)
  2. **Avatar circular grande** em gradiente azul-claro
  3. **`sam` em bold escuro**, centralizado
  4. **`We don't know anything about sam` em cinza** — bio vazia, com copy autoconsciente
  5. **Botão outline roxo pílula, largura parcial: `Unfollow`**
  6. **Três cards brancos lado a lado, largura igual** — **exatamente o componente do próprio perfil (ver dossiê 8)**
  7. **Rótulo de seção `Playgrounds`** → **card com borda tracejada:** ilustração de robô saindo de caixa → linha em cinza
  8. **Tab bar de 5 com rótulo**, com **`Leaderboard` ativo**
- **Copy literal:** "Your feedback has been submitted. Thanks for making Mimo better for everyone." · "sam" · "We don't know anything about sam" · "Unfollow" · "DAY STREAK" · "1" · "XP TOTAL" · "380" · "LEAGUE" · "Wooden" · "Playgrounds" · "There are no Playgrounds on sam's profile" · "Learn" · "Practice" · "Build" · "Leaderboard" · "Profile"
- **O mecanismo:** **reuso de componente como vetor de comparação.** O Mimo não construiu um ranking nesta tela — ele **reaproveitou o card de métrica do próprio perfil**, e isso basta. Como o usuário conhece os próprios valores, ver `380 XP TOTAL` no perfil do sam é automaticamente um placar de dois. **A comparação não precisa ser desenhada; ela emerge da simetria.** E a tab bar confirma a intenção: a tela é acessada por **`Leaderboard`**.
- **Variação entre apps:** demonstração mais limpa do acervo de que **visitar um perfil com métricas É um leaderboard**, mesmo sem lista ordenada.
- **Quando falha / risco:** **para o Soulmon, esta é a armadilha exata.** Se a tela de visita à criatura do amigo reusar o componente da própria criatura — estágio, forma, progresso — ela vira placar automaticamente, sem que ninguém tenha decidido criar um. **A decisão de "não ter leaderboard" tem de ser tomada no nível do componente, não no nível da feature.**
- **Classificação:** ANTI-PADRÃO

### Duolingo — `FRIEND STREAKS`: os números dos amigos em fileira
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/7dc56e7a-5099-44aa-88c1-5a8cb629eab6
- **Estrutura da tela, de cima para baixo:**
  1. **`Sam Lee` em bold grande** (esq.) + engrenagem (dir.)
  2. Linha cortada pelo scroll: `🏆 No current` · `⚡ 128 XP`
  3. **Rótulo em caixa alta cinza: `FRIEND STREAKS`**
  4. **Fileira horizontal de quatro avatares circulares ilustrados**, e **abaixo de cada um, o valor com ícone de chama:** **`🔥 342`** (laranja, ativo) · **`🔥 458`** (cinza) · **`🔥 106`** (cinza) · **`🔥 38`** (cinza) → e um **círculo tracejado com `+`** no fim
  5. **Rótulo `MAX FAMILY`** + `MANAGE` em azul → **card cinza vazio com silhueta de pessoa e `+`**
  6. **Rótulo `MONTHLY BADGES`** + chevron → **fileira de quatro emblemas**, três coloridos e **um em cinza**
  7. **Rótulo `ACHIEVEMENTS`** + chevron → **fileira de quatro emblemas com numerais sobrepostos:** `30` (etiqueta `NEW`) · `750` · `200` · `200`
  8. **Tab bar de 6 ícones ilustrados**, sem rótulo
- **Copy literal:** "Sam Lee" · "No current" · "128 XP" · "FRIEND STREAKS" · "342" · "458" · "106" · "38" · "MAX FAMILY" · "MANAGE" · "MONTHLY BADGES" · "ACHIEVEMENTS" · "NEW"
- **O mecanismo:** **ordenação implícita por vizinhança.** `458` ao lado de `38` é um ranking, e a fileira horizontal é uma lista ordenada disfarçada de galeria. Três dos quatro estão **em cinza** (inativos), o que adiciona uma segunda camada de julgamento: além de ter menos, o amigo está *parado*. Comparação social ascendente forçada — eficaz para engajamento justamente porque é desconfortável.
- **Variação entre apps:** o único que expõe **streaks de múltiplos amigos simultaneamente em uma linha**.
- **Quando falha / risco:** anti-padrão de referência da tese. E note: **o Duolingo também tem `ACHIEVEMENTS` com totais que só crescem** (`750`, `200`) na mesma tela — o app tem as duas mecânicas e escolheu dar o slot mais alto e mais social à que pode zerar.
- **Classificação:** ANTI-PADRÃO

### Runbuds e Fitbit — a mesma feature, ordenada por desempenho
- **URLs Mobbin:**
  - Runbuds: https://mobbin.com/screens/f4349f17-72fe-4f67-ba92-a323e23128c8
  - Fitbit: https://mobbin.com/screens/e473d312-e81d-4a36-87f4-69a35e2b68a1
- **Estrutura (Runbuds):** chevron `v` + **`Let's run` centralizado** + `···`, sobre fundo vermelho-escuro → **barra com `1/6` à esquerda e `1/21` à direita** → **`CHALLENGE` em caixa alta** → **card com cinco linhas de métrica, cada uma com ícone + rótulo à esquerda e valor à direita** → **`RUNNERS (2)` em caixa alta** → **card com duas linhas de corredor:** avatar + nome + **quilometragem e contagem individuais**
- **Estrutura (Fitbit):** `‹ Back` + `···` → **faixa fotográfica com `Runners` em bold branco, pílula `🔒 Closed group`, `Admin`, e a descrição do grupo** → **campo `What are you up to?`** com três ícones → **linha `1 member`** + botão rosa de adicionar → **linha `Group Leaderboard ›`** → **linha ordenada: `1` + avatar + `You` + `7,425`** → **bloco `Welcome`** com parágrafo de boas-vindas e link
- **Copy literal:** Runbuds: "Let's run" · "1/6" · "1/21" · "CHALLENGE" · "Goal" · "113 km" · "Total distance" · "1.1 km" · "Team pace" · "4:19/km" · "Days left" · "15" · "Daily mileage" · "1.1 / 7.5 km" · "RUNNERS (2)" · "alexsmith" · "1.1 km (2)" · "samlee" · "0.0 km (0)" — Fitbit: "Runners" · "Closed group" · "Admin" · "Let's run every Friday morning!" · "What are you up to?" · "1 member" · "Group Leaderboard" · "1" · "You" · "7,425" · "Welcome" · "Welcome to your group on Fitbit, now by Google! To get started, share a post of your latest workout, or motivate someone with a little cheer. If there's no admin yet, you can report inappropriate content to Fitbit moderators until an admin joins to help manage your group." · "Learn more why"
- **O mecanismo:** ambos tomam a estrutura de meta coletiva e **a decompõem em desempenho individual ordenado**. Runbuds lista `alexsmith 1.1 km (2)` acima de `samlee 0.0 km (0)` — o zero de um membro fica visível para o grupo. Fitbit nomeia a coisa literalmente: **`Group Leaderboard`**.
- **Variação entre apps:** Runbuds mantém `Team pace` (agregado) **junto** com as linhas individuais — mostra que as duas mecânicas podem coexistir, e que a individual domina a leitura.
- **Quando falha / risco:** `0.0 km (0)` numa lista de duas pessoas é exposição direta. Para o Soulmon, é o desenho a evitar mesmo com comparação aceita.
- **Classificação:** ambos ANTI-PADRÃO

### Apple Games e Deepstash — o social vazio, e o banner de convite
- **URLs Mobbin:**
  - Apple Games: https://mobbin.com/screens/2745fde2-1edf-488e-8bbc-f5488cd18eeb
  - Deepstash: https://mobbin.com/screens/6c795c61-afdf-4b22-9ba5-8d0fb67e9208
- **Estrutura (Apple Games):** `✓` em botão circular ciano → **avatar circular com uma criatura 3D vermelha (polvo)** → **`HugeMouse4850` em bold branco grande** (nome gerado automaticamente) → **pílula `Edit Profile`** → **rótulo `Friends`** → **três linhas-cartão azul-escuras:** `👥 All Friends / 0 Total` · `👤+ Invite Friends ›` · `👤? Friend Requests ›` → **rótulo `Overview`** → **duas linhas-cartão:** `🚩 Challenges / 0 Wins` · `🛡 Achievements / 0 Completed`
- **Estrutura (Deepstash):** `×` + quatro ícones → **avatar fotográfico circular** → **`Sam Lee` em bold branco grande** → handle → **bio** → **`0 Followers · 1 Following`** → **banner azul de largura total com `×` no canto direito:** ícone de pessoas + título + **`→ Add Friends`** + ilustração de rede de avatares → **`Your Stats` + chevron** → **card `🏆 Achievements / 9 / 36 unlocked`** com fileira de emblemas → card parcial → **`1 Published Idea` / `Saved 1 Time`** → pílulas de tag
- **Copy literal:** Apple Games: "HugeMouse4850" · "Edit Profile" · "Friends" · "All Friends" · "0 Total" · "Invite Friends" · "Friend Requests" · "Overview" · "Challenges" · "0 Wins" · "Achievements" · "0 Completed" — Deepstash: "Sam Lee" · "@samlee_mobbin" · "Professional book hopper" · "0 Followers" · "1 Following" · "Deepstash is better with friends." · "Add Friends" · "Your Stats" · "Achievements" · "9 / 36 unlocked" · "1 Published Idea" · "Saved 1 Time" · "Mental Health" · "Mindfulness"
- **O mecanismo:** Apple Games mostra o **estado zero social** em toda a crueza: `0 Total`, `0 Wins`, `0 Completed` empilhados verticalmente. Três zeros em coluna é a leitura de "você não tem ninguém e não fez nada". Deepstash faz melhor: **o banner `Deepstash is better with friends.` tem um `×`** — dispensável, como o card do Garmin — e a afirmação é sobre o produto, não sobre a carência do usuário.
- **Variação entre apps:** Deepstash é o único com **banner de convite dispensável**; Apple Games é o único com **nome de usuário gerado automaticamente**, o que remove o atrito de escolher e também a identidade.
- **Quando falha / risco:** `0 Followers · 1 Following` é assimetria exposta — segue e não é seguido. Para um produto de bem-estar, contadores de seguidor são eixo de status importado de rede social sem necessidade funcional.
- **Classificação:** Apple Games — ANTI-PADRÃO *(pelos três zeros)* · Deepstash — LIMÍTROFE *(banner dispensável: PADRÃO · contadores de follower: ANTI-PADRÃO)*

### O convite: cosmético vs. dinheiro

**Buscar "convite com recompensa" retornou 8 telas, e 7 são referral financeiro** — o que é
o achado. Nenhum app de hábito ou pet aparece, exceto Numo:

| App | Copy literal | Recompensa | URL |
|---|---|---|---|
| **Finch** | "MEET COOKIE THE COW" · "Invite friends to get this micropet!" | **Cosmético colecionável** | [link](https://mobbin.com/screens/e6c040ad-7636-4b80-9129-1e101a6483e9) |
| **Numo** | "Invite friends, use Numo for free!" · "Send invites" · "When friends join, they get free 30 days, you get free lifetime" · "Rewards" · "Get free Numo when friends you invite activate trial subscription" · "Free month / 1 friend" · "Free 6 months / 3 friends" | **Assinatura grátis, em escada travada com cadeados** | [link](https://mobbin.com/screens/e4cf86fb-112d-4af5-9c88-8a0342467ba3) |
| **Instacart** | "$10 for you, $10 for a friend" · "Friends can get $10 off—you'll get $10 when they place their first order." · "Terms Apply" · "$0 earned." · "Send a text" · "Share" · "Code S44F8FC copied!" | Dinheiro | [link](https://mobbin.com/screens/803d323a-b046-4681-be4a-d058bcfaf9af) |
| **Venmo** | "Invite your friends. Earn up to $100!" · "Earn $10 for each friend who sends $5 from a linked payment method within 14 days of the invite." · "0 / 10 Referred" · "$0 Earned" · "Share link" · "Contacts" · "Earn $10" | Dinheiro, com **barra `0/10`** e **botão `Earn $10` ao lado de cada contato** | [link](https://mobbin.com/screens/3c0a90a9-01b8-45eb-ad36-ce52da9c7e6b) |
| **Klarna** | "Earn $60, give $20" · "Invite friends to Klarna" · "Your friends have 30 days to" · "Accept the invite" / "Join via the personal link" · "Sign up for the Klarna Card" · "Shop 3 times with the Klarna Card" · "Earn up to $600" · "Get rewarded for up to 10 invites" · "Share invite" | Dinheiro, com **três condições encadeadas** | [link](https://mobbin.com/screens/6826cde1-caf0-4f74-a742-09b7681a6b68) |
| **Greenlight** | "Share more, earn more" · "The first friend you refer, you'll both get a $30 bonus. Then you can keep referring and earn for every friend that joins Greenlight - up to $600 in total!" · "How it works" · "History" · "Invite Friends" · "Invites • 0" · "Total rewards • $0" · "No pending invites yet" · "Invites will appear here once your friends sign up" · "Need Help?" · "Scan" · "Share" | Dinheiro, com **escada `$30 $50 $70 $150 $300`** | [link](https://mobbin.com/screens/c7f95630-20aa-4214-8cf4-02b5e359361e) |
| **Origin** | "REFER FRIENDS" · "REFER NOW" · "$50 for your 2nd referral" · "Get another $50 Visa gift card when your 2nd friend becomes an annual member." · "Unlock lifetime access" · "Earn free lifetime access when your 3rd friend becomes an annual member." · "REFERRALS" · "Annual subscribers 0" · "Signed up 0" · "Earn rewards when friends choose an annual plan — issued within 7 days after payment." | Dinheiro | [link](https://mobbin.com/screens/a00cf8f5-505f-4189-9ad2-e47f0b793bda) |
| **Wealthsimple** | "$25 for you, $25 for them" · "Invite friends to Wealthsimple and you'll both get $25 when they fund their account." · "Activity" · "Referral bonus" · "Claim reward" · "Invite friends" | Dinheiro | [link](https://mobbin.com/screens/9e1727fc-26fe-4e5b-a232-51b1c945c7ea) |
| **Vinted** | "Invite friends and earn up to $15" · "Get $5 when a friend lists their first 3 items and $10 when they sell." · "vinted.com/invite/samlee.mobbin" · "Share invite link" · "Your referrals" · "How referrals work" | Dinheiro | [link](https://mobbin.com/screens/692de8b8-7649-4c56-8ae4-e585912d3b25) |

- **O mecanismo, comparado:** o Finch é o único que paga em **objeto de coleção**, e a diferença é estrutural. Recompensa em dinheiro ou assinatura torna o amigo **um meio** — a copy do Venmo é explícita ao ponto de pôr um botão **`Earn $10` ao lado do nome de cada contato da agenda**, o que instrumentaliza a lista de contatos. Recompensa em cosmético mantém o convite dentro da fantasia: você não lucra com o amigo, você ganha uma vaca. E **todos os 7 apps de dinheiro exibem `$0 earned` / `0 Referred`** — o estado zero como primeira coisa visível.
- **Quando falha / risco:** o cosmético do Finch tem teto — uma vez obtida a Cookie the Cow, o incentivo desaparece. Dinheiro escala indefinidamente. **Escolha entre coerência de produto e potência de aquisição**, e para o Soulmon o cosmético é a única opção coerente.
- **Classificação:** Finch — PADRÃO · Numo — LIMÍTROFE · os 7 de dinheiro — ANTI-PADRÃO *(para este produto; são padrão legítimo em fintech)*

### Convergência e divergência — Dossiê 13

- **Convergência (5+ apps):** **quase todo social exibe pelo menos uma métrica por pessoa** — Mimo (3 cards), Duolingo (streak por amigo), Deepstash (followers), Apple Games (3 zeros), Lapse (`1`), adidas (`0 FOLLOWERS | 0 FOLLOWING`), Meta Quest (`7 following · 0 followers`), Runbuds (km por corredor), Fitbit (`Group Leaderboard`). **Duas exceções em 34 telas: Finch e How We Feel.** E **todos** os apps com social têm **estado zero exposto** em algum lugar — `0 Total`, `0 Followers`, `0 Referred`, `No friends yet`, `0 Wins`.
- **Divergência — e qual é a escolha real:** **o que o social exibe do outro.** Três respostas, e não são graduações, são categorias:
  1. **Desempenho** (Mimo, Duolingo, Deepstash, Apple Games, Runbuds, Fitbit) — comparável, ordenável, produz ranking mesmo sem leaderboard.
  2. **Estado não-ordenável** (How We Feel: `focused`, `apathetic`) — visível mas incomparável, porque emoções não têm ordem.
  3. **Presença** (Finch: o pet está na árvore, e é tudo) — o outro existe, e nada mais é dito.

  **A escolha real é: o social serve para comparar ou para cuidar?** Se serve para comparar, qualquer métrica basta e o ranking é inevitável. Se serve para cuidar, **o que o outro precisa ver é apenas que você existe — e o que ele precisa poder fazer é dar algo.** Finch resolve escolhendo presença + três verbos de dar, e é por isso que é o único do acervo que satisfaz simultaneamente "tem social" e "não tem leaderboard".

  **O alerta específico do Soulmon, que nenhum app do acervo enfrenta:** no Finch, o pet do amigo na árvore não revela nada sobre o desempenho dele. **No Soulmon, a criatura evolui com o comportamento — então a forma da criatura É a métrica.** Um estágio 4 ao lado de um estágio 1 comunica desempenho relativo sem um único número, e nenhuma decisão de copy conserta isso. Ver §16 para a decisão tomada e a arquitetura resultante.

---

# §15 — ADENDO: FLUXOS, ESTILOS VISUAIS, E O QUE FAZ CADA APP ÚNICO

> Material do segundo passe. Cobre o eixo de **fluxo** (a ordem das decisões, que a captura
> de tela isolada esconde), o eixo de **estilo visual** (retrô/8-bit em invólucro limpo) e
> os gaps que o primeiro passe declarou abertos.

## §15.1 — FLUXOS

### Finch — "Onboarding" (21 telas) + "Setting up a birb" (8 telas)
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin (onboarding completo, 21 telas):** https://mobbin.com/flows/80ef83ef-f872-4825-b18d-6b193d60a9aa
- **URL Mobbin (criação do pet, 8 telas):** https://mobbin.com/flows/ab3823c2-2068-4b25-965a-c4a2f9290102
- **O fluxo em uma frase:** o pet **nasce antes de qualquer pergunta sobre hábitos**, e é ele quem entrevista o usuário.

**A sequência, na ordem em que aparece:**

| # | Tela | O que acontece |
|---|---|---|
| 1 | **Splash** | Rosto do pet cinza (ovo/silhueta) + `Finch` em bold com leve rotação. Fundo branco-neutro |
| 2 | **A eclosão** | **Raios radiais em creme/âmbar** emanando do centro, o pet no meio, sombra elíptica, e **`You hatched a birb!`** em bold escuro. Sem botão visível |
| 3 | **Nomear o pet** | Pet pequeno no topo → pergunta em bold, duas linhas → **`You can change this later.`** em cinza → campo de texto com `Lee` pré-preenchido e `⊗` para limpar → **dois botões lado a lado: `Shuffle` (cinza) e `Next` (verde)** |
| 4 | **O pet nomeia VOCÊ** | `Skip` no canto superior direito → **balão de fala com cauda apontando para baixo-esquerda** → o pet abaixo → **campo com placeholder `Name for Lee's human...`** → botão `Next` **desabilitado** |
| 5 | **Priming de notificação** | (ver dossiê 4) `Get reminders from Lee` |
| 6 | **Dia 1** | **Fundo roxo sólido inteiro** → rótulo `DAY 1` em caixa alta pequena, centralizado → **o pet sentado, com os olhos fechados** → **`Happy Satur-Yay!`** em bold branco + linha de afeto → **um raio âmbar isolado como divisor** → parágrafo de missão → botão branco pílula `Start today` |
| 7 | **Primeira home** | Cena de quarto ilustrada (janela redonda, lâmpada pendente, cômoda, porta) → **o pet DENTRO DE UM NINHO** (ainda não anda) → **card teal `⚡ 1st Adventure` com barra `0 / 15`** e frase de convite → **`📅 7 goals left for today!`** com ícones de filtro e grade → **lista de tarefas em cards brancos** com valor em energia e `✓` → **tab bar de 6 ícones nus com rótulo** |

- **Copy literal:** "You hatched a birb!" · "What do you want to name your baby birb?" · "You can change this later." · "Lee" · "Shuffle" · "Next" · "Cheep cheep, thanks for hatching me. If my name is Lee, what's your name?" · "Name for Lee's human..." · "Skip" · "DAY 1" · "Happy Satur-Yay!" · "Baby Lee has butterflies seeing you." · "Help Baby Lee gain full energy today so she can go out to explore and grow!" · "Start today" · "1st Adventure" · "0 / 15" · "Gain ⚡ energy so Lee can go discover new things today!" · "7 goals left for today!" · "Get out of bed" · "5" · "Brush teeth" · "Wash my face" · "Home" · "Quests" · "Shop" · "Friends" · "Bag" · "Lee"

- **O mecanismo — quatro decisões de sequência, não de tela:**
  1. **A criatura existe antes do compromisso.** `You hatched a birb!` acontece na tela 2 de 21 — antes de qualquer pergunta sobre hábitos, antes do paywall, antes de tudo. O usuário recebe o ativo emocional **de graça e primeiro**, e só depois é pedido algo.
  2. **Reciprocidade de nomeação.** O pet pergunta o nome do usuário *depois* de ser nomeado, e a copy explicita a troca. Converte uma coleta de dado em um gesto de reciprocidade — e estabelece que a relação é bidirecional na primeira interação.
  3. **`You can change this later.`** aparece sob o campo de nome. Remove o peso da decisão irreversível no momento em que a pessoa tem menos informação. **Nota de colisão: a criatura do Soulmon é declaradamente insubstituível — então esta linha específica não pode ser copiada, mas o princípio (baixar o custo da primeira decisão) precisa de um equivalente.**
  4. **O pet começa imóvel, dentro do ninho.** Na primeira home ele não anda. A capacidade de "sair para explorar" é o que a energia do dia desbloqueia. **A limitação inicial é o que dá sentido à primeira ação** — e é um recurso de arte (uma pose), não de engenharia.
- **Variação entre apps:** é o único fluxo do acervo em que **o personagem conduz o onboarding em vez de ser apresentado por ele.** E o único que entrega a criatura antes de cobrar qualquer coisa.
- **Quando falha / risco:** 21 telas é longo. O Finch sustenta porque a tela 2 já pagou o usuário. Um fluxo de 21 telas cuja recompensa está na tela 20 é abandono garantido — **a posição da recompensa dentro do fluxo importa mais que o comprimento do fluxo.**
- **Classificação:** PADRÃO — **fluxo de referência mais próximo do Soulmon em todo o acervo.**

### Replika — "Onboarding" (10 telas) + "Creating a Replika" (12 telas)
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URLs Mobbin:** https://mobbin.com/flows/19470dcc-dbd6-48ae-a945-f708e3a1b3d2 · https://mobbin.com/flows/381cc18a-e9aa-41b4-8e68-bdf807f772a5 · https://mobbin.com/flows/b558f09a-f3ae-422d-98c6-ad93bc0f49e5 *(seleção de tipo de personagem, 9 telas)*
- **O fluxo em uma frase:** conta **o valor prometido** em telas de venda, coleta dado sensível, e só entrega a criatura depois do paywall.

**A sequência:**

| # | Tela | O que acontece |
|---|---|---|
| 1 | Splash | `Replika` em **bold desfocado** sobre gradiente azul. Estética de sonho/memória |
| 2–3 | **Promessa** | Retratos fotorrealistas em tela cheia + manchete branca de 3–4 linhas + botão branco `Continue` |
| 4 | **Item psicométrico** | `Do you agree with the statement below?` → **a afirmação em display grande, cor azul-clara, centralizada verticalmente** → **dois botões pílula lado a lado: `NO` / `YES`** |
| 5 | Idade | `How old are you?` + justificativa + 7 faixas em botões pílula empilhados |
| 6 | Pronomes | `Your pronouns` + justificativa + `She / Her` · `He / Him` · `They / Them` **como texto centralizado, o selecionado em pílula** |
| 7 | Conta | `Create an account` — e-mail, senha, rodapé legal |
| … | Seleção de tipo | Escolha de arquétipo de personagem |
| **último** | **Silhueta + paywall** | `Your personalized Replika is ready` + silhueta em contraluz + card de plano + `Cancel anytime` + `Continue` + `Other options` |

- **Copy literal:** "With your Replika, you'll build confidence in romantic communication." · "With your Replika friend you'll explore exiting hobbies and topics like never before." *(`exiting` — erro de digitação no produto, transcrito como está)* · "Do you agree with the statement below?" · "I sometimes wish I had more meaningful connections in my life" · "NO" · "YES" · "How old are you?" · "We need this information to make your experience more relevant & safe." · "Your pronouns" · "We need to know that to ensure the proper content generation." · "Password must contain at least 8 characters." · "Already have an account? Log in" · "Your personalized Replika is ready" · "Platinum" · "Annual $89.99" · "$7.50 per month"
- **O mecanismo:** **a ordem é venda → intimidade → conta → pedágio.** Cada etapa aumenta o investimento antes da seguinte, e o item psicométrico da tela 4 é posicionado deliberadamente cedo: uma vez que a pessoa admitiu solidão, o produto que a resolve fica muito mais difícil de recusar. Note também que **cada coleta de dado vem com uma justificativa curta** — boa prática de consentimento aplicada dentro de uma arquitetura extrativa.
- **Variação entre apps:** é o **espelho invertido do Finch.** Mesma matéria-prima (companheiro, quiz, nome), sequência oposta: Finch dá primeiro e pede depois; Replika pede tudo e entrega no fim, atrás de pagamento.
- **Quando falha / risco:** o item psicométrico sem contexto terapêutico é extração de vulnerabilidade para fim comercial. **Para o Soulmon, que também usa 20 itens psicométricos opcionais, a lição prática é: a justificativa por item (que o Replika faz bem) e a entrega antes do pedágio (que o Finch faz e o Replika não) são separáveis — dá para copiar a primeira sem a segunda.**
- **Classificação:** ANTI-PADRÃO como arquitetura de fluxo · PADRÃO no detalhe da justificativa por campo

### Convergência e divergência — Fluxos

- **Convergência:** ambos os fluxos usam **balão de fala ou manchete em primeira pessoa da criatura** para conduzir, ambos **pedem o nome** e ambos posicionam a **permissão de notificação no meio do fluxo**, não no fim.
- **Divergência — a mais consequente do arquivo inteiro:** **onde fica a entrega da criatura dentro da sequência.** Finch: **tela 2 de 21**. Replika: **última tela, atrás do paywall**. Esta é a única decisão de fluxo que muda a natureza do produto.

## §15.2 — ESTILOS VISUAIS: RETRÔ/8-BIT DENTRO DE INVÓLUCRO LIMPO

### Life Reset — Pixel art numa UI de app moderno (o achado central deste eixo)
- **Plataforma / data:** iOS · data não exposta pelo MCP · *app pequeno*
- **URL Mobbin:** https://mobbin.com/screens/28db14a2-e6a1-4f49-a304-a048fa1880b4
- **O padrão em uma frase:** **o pixel art fica confinado a um retângulo**; todo o resto da tela é tipografia sans-serif limpa e cards escuros de cantos arredondados.
- **Estrutura da tela, de cima para baixo:**
  1. Seta `←` em botão arredondado claro; título `Character Profile` centralizado, sans-serif regular. **Fundo preto**
  2. **Duas colunas lado a lado:**
     - **Esquerda: card de retrato** — **arte em pixel art de um personagem sobre um fundo de cenário também pixelado**, dentro de um retângulo de cantos arredondados. **Abaixo, dentro do mesmo card, o nome `Sam Lee` em sans-serif bold** — não em fonte pixelada
     - **Direita: painel de atributos** com abas `Current` (ativa, sublinhada) · `Day 1` · `Day 66`, e **cinco linhas com ícone colorido + nome do atributo + `▲` verde + valor**
  3. **Barra de nível de largura total:** ícone de brilho → **`Level 5` em bold** + `197 XP to Lvl 6` em cinza → à direita, **`828` em bold + `XP earned`** → abaixo, **uma barra de progresso feita de blocos retangulares discretos** — o único elemento de UI que empresta a linguagem do pixel
  4. Seção `Task completion history` → **card vazio com `No tasks completed yet` centralizado em cinza**
  5. Seção `Your Equipped Items` → **seis slots vazios em quadrados de borda arredondada tracejada**, cada um com **rótulo em cinza abaixo**
  6. Seção `All Items` → **abas horizontais** dos mesmos seis tipos
  7. **Tab bar de 6 ícones nus, monocromáticos, sem rótulo**, sobre uma faixa clara
- **Copy literal:** "Character Profile" · "Sam Lee" · "Current" · "Day 1" · "Day 66" · "Wisdom" · "65" · "Confidence" · "62" · "Strength" · "65" · "Discipline" · "63" · "Focus" · "60" · "Level 5" · "197 XP to Lvl 6" · "828" · "XP earned" · "Task completion history" · "No tasks completed yet" · "Your Equipped Items" · "Weapon" · "Helmet" · "Earring" · "Armor" · "Shield" · "Shoes" · "All Items"
- **O mecanismo:** **contenção do pastiche.** O retrô não invade a interface — fica dentro de uma "janela" (o card de retrato) e a UI ao redor é contemporânea e legível. Resolve o problema real da estética 8-bit em produto: fonte pixelada é ilegível em corpo de texto e destrói acessibilidade, mas *arte* pixelada é encantadora. **A divisão é: pixel na arte, sans-serif no texto, e um único gesto de ponte (a barra de blocos) para costurar os dois.** É exatamente a formulação "retrô no jogo, limpo no invólucro".
- **Variação entre apps:** o único do acervo que **combina pixel art de personagem com UI moderna de app de produtividade**. Também o único com **slots de equipamento vazios rotulados** — modelo de empty state de coleção muito superior ao cadeado (o slot diz *o que vai ali*, não *que você não tem*).
- **Quando falha / risco:** os cinco atributos com `▲` implicam que também podem aparecer com `▼`. E `Day 1 / Day 66` como abas cria um horizonte fixo de 66 dias que, se ultrapassado ou abandonado, não tem onde ir.
- **Classificação:** PADRÃO *(pela arquitetura visual; os atributos mutáveis: ANTI-PADRÃO)*

### Babbel "Phrase Maze" — Modo de jogo com identidade visual própria, isolado do app
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/7d85cf2e-c1ea-4656-adb9-a03f65955138
- **Estrutura da tela, de cima para baixo:**
  1. Seta `‹` em botão circular vinho, canto superior esquerdo
  2. **Faixa superior marrom-escuro** com **`PHRASE MAZE` em fonte pixelada de largura larga, branca, com sombra dura** e **estrelas de 4 pontas** em volta. Abaixo, **`+Babbel` em sans-serif branca regular** — a assinatura da marca-mãe, deliberadamente discreta
  3. **Cena ilustrada em pixel art:** céu em **faixas horizontais de laranja degradê** (por-do-sol em bandas — técnica clássica de paleta limitada), **sol amarelo circular achatado**, silhuetas de pinheiros em marrom escuro, **um castelo/torre de blocos amarelos** ao centro, personagens pixelados minúsculos, e **um fantasma branco com balão de fala pixelado**
  4. **Bloco de texto sobre fundo marrom, em fonte pixelada branca, centralizado, duas frases separadas**
  5. **Botão laranja pílula de largura parcial** com o CTA **em fonte pixelada**
  6. **Dois botões circulares brancos** com ícones (alto-falante, `?`)
- **Copy literal:** "PHRASE MAZE" · "+Babbel" · "Save me!" · "Professor De Jong is trapped in a haunted castle and needs your help!" · "Rescue him by proving your Dutch knowledge to the ghosts." · "Start playing"
- **O mecanismo:** **compartimentação de marca.** Ao dar ao modo de jogo uma identidade visual completa e própria — e marcá-la como extensão (`+Babbel`) em vez de substituição — o app pode ser lúdico no jogo sem comprometer a seriedade do produto principal. **O `+Babbel` é a peça-chave: uma linha de tipo que declara "isto é um anexo".**
- **Variação entre apps:** único do acervo que **usa fonte pixelada em corpo de texto** — e mostra o custo: as duas frases são legíveis, mas seriam intoleráveis em três parágrafos. Confirma pela negativa a regra do Life Reset.
- **Quando falha / risco:** duas identidades visuais = dois design systems para manter. E fonte pixelada em corpo de texto é problema de acessibilidade real, agravado em PT-BR (palavras mais longas, acentuação — **muitas fontes pixeladas não têm `ã`, `ç`, `õ` desenhados, e o fallback quebra a estética exatamente onde ela deveria funcionar**).
- **Classificação:** LIMÍTROFE

### Co–Star e Poolsuite FM — retrô sem pixel: ASCII e monospace
- **Plataforma / data:** iOS · data não exposta pelo MCP · *ambos apps pequenos/nicho*
- **URLs Mobbin:**
  - Co–Star: https://mobbin.com/screens/981f7e86-a42e-4e37-a1b3-ef370ec2aece
  - Poolsuite FM: https://mobbin.com/screens/4476131f-9824-4eef-802b-70095c1a65e1
- **Estrutura (Co–Star), de cima para baixo:** `×` (esq.), **`CO — STAR` em monospace com espaçamento amplo** (centro), ícone de compartilhar (dir.) → **linha divisória feita de hifens `----------`** → **`--+-+--- WANT TO PLAY? +-+-+---` em monospace**, centralizado, usando caracteres como ornamento → mais uma linha de hifens → **uma "caixa" desenhada com pipes `|` e hifens `-`**, contendo `----MASH----` → **botão desenhado como retângulo de borda dupla** com `START PLAYING` em monospace caixa alta → fundo branco puro
- **Estrutura (Poolsuite FM):** **fundo preto com textura de ruído/dithering visível** → **centralizado, uma ilustração minúscula de um telefone celular antigo em traço branco** → abaixo, **`Poolsuite` / `Cellular 2.0` em monospace branca pequena**, duas linhas → na base, **ícone de nuvem do SoundCloud + `Powered by Soundcloud`** em monospace cinza
- **Copy literal:** Co–Star: "CO — STAR" · "WANT TO PLAY?" · "MASH" · "START PLAYING" — Poolsuite FM: "Poolsuite" · "Cellular 2.0" · "Powered by Soundcloud"
- **O mecanismo:** **retrô de custo zero em asset.** Nenhuma imagem, nenhum sprite, nenhuma fonte customizada além de uma monoespaçada — e o efeito nostálgico é integral. Co–Star usa **caracteres como elementos de layout** (hifens como régua, pipes como borda de caixa), que é literalmente a linguagem do terminal. Poolsuite adiciona **textura de dithering no fundo**, o único gesto raster e o que dá materialidade.
- **Variação entre apps:** são os únicos que fazem retrô **sem pixel art**. Relevante para o Soulmon como alternativa de baixo custo: **se a produção de 11 formas × 5 estágios em pixel art já é caríssima, a UI ao redor pode carregar o retrô por tipografia, liberando o orçamento de arte para as criaturas.**
- **Quando falha / risco:** monospace em corpo de texto longo é cansativo, e caracteres de desenho não escalam com Dynamic Type — a "caixa" de pipes quebra quando a fonte cresce.
- **Classificação:** ambos PADRÃO *(como vocabulário; não como sistema completo)*

### MD Vinyl — Widget esqueumórfico nos três tamanhos
Ver **§10 (Dossiê 9)** para a descrição completa. Resumo do que importa a este eixo: os três
tamanhos desenhados como **aparelhos de áudio de plástico escuro**, com nervuras de grade
gravadas, "display" com monospace verde-fosforescente e **teclas físicas em relevo**. A
degradação entre tamanhos é **por remoção de função**, preservando a assinatura material.
URL: https://mobbin.com/screens/6049f0b1-826c-41a9-bf31-fc5725cca364 · `PADRÃO`

### Glow e Uniswap — pixel art como grade de coleção
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URLs Mobbin:**
  - Glow (grade `Critters Cult`): https://mobbin.com/screens/f107b12b-e148-45f1-91df-fa1b8459ca0b
  - Glow (ficha de item): https://mobbin.com/screens/c8df7d33-1540-4ad3-bb4a-e3b17b3c210e
  - Uniswap (grade `Chain Runners`): https://mobbin.com/screens/d2418657-ea15-4d9a-8f07-71ada2025861
  - Uniswap (ficha da coleção): https://mobbin.com/screens/b6c58e19-0fe7-4577-8823-4f190bcdbbaf
- **Estrutura (Glow):** miniatura + `★` e compartilhar no topo → **`Critters Cult` em bold grande + `5.553 Items` em cinza** → **abas `Items` (ativa, sublinhada) · `Sales` · `Info`** → **filtros em pílula horizontal:** `1/1` `Background` `Creature` `Eyes` `Face` → **grade 3×N de cards quadrados**, cada um com uma criatura em pixel art **sobre um campo de cor sólida diferente** → fundo do app **preto**
- **Estrutura (Uniswap):** grade idêntica em estrutura, mas cada card traz **um preço em pílula translúcida no rodapé**, e os fundos são **cores saturadas e às vezes divididas em duas metades diagonais**
- **Copy literal:** Glow: "Critters Cult" · "5.553 Items" · "Items" · "Sales" · "Info" · "1/1" · "Background" · "Creature" · "Eyes" · "Face" — Glow (ficha): "Critter Owts" · "Critters Cult" · "5.553 Items" · "Owner" · "4zdNG…zjxue" · "Mint Address" · "8c38n…hZ5zr" · "Critters Cult is a sci-fi visual narrative heavily influenced by 80-90s aesthetics, in an eerie universe with its own logic and laws." · "Traits" · "Background 11% Clay" · "Creature 1,64% Entis" · "Eyes 31,6% Relaxed" — Uniswap: "Chain Runners" · "Items 10.0K" · "Owners 3.2K" · "Floor 0.020" · "Volume 13.4K" · "Chain Runners are Mega City renegades 100% stored and generated on chain. Visit https://chainrunners.xyz to find out" · "Read more"
- **O mecanismo:** **o fundo de cor sólida faz o trabalho de diferenciação.** Com sprites pequenos e similares, a cor do campo é o que torna cada célula reconhecível a distância — e é a variável mais barata de gerar proceduralmente. Os fundos divididos em diagonal do Uniswap mostram uma segunda camada de variação a custo quase zero. **Nota direta:** os filtros do Glow (`Background`, `Creature`, `Eyes`, `Face`) revelam a **estrutura de traços componível** por trás da arte — é assim que uma coleção grande de criaturas é gerada e navegada.
- **Variação entre apps:** são coleções de NFT, não apps de hábito — mas são o único lugar do acervo com **grade de criaturas em pixel art em escala real** (5.553 e 10.000 itens). Como referência visual de dex, valem mais que qualquer app de produtividade do arquivo.
- **Quando falha / risco:** o contexto é cripto/especulativo, e a linguagem de preço e raridade percentual que acompanha é justamente o que o Soulmon não quer. **Extraia a composição da grade e o sistema de traços; descarte a camada econômica.**
- **Classificação:** PADRÃO *(como referência visual) · a camada de preço: ANTI-PADRÃO*

### Netflix e Bump — dois detalhes menores que valem
- **Netflix — a tela de carregamento de jogo** (https://mobbin.com/screens/4b628c09-a8fa-4ec3-875b-c11286d699c2): fundo preto total → **o ícone do jogo em pixel art (uma criatura amarela de macacão azul) num quadrado de cantos arredondados, pequeno, centralizado no terço superior** → **abaixo dele, um anel de carregamento vermelho parcial** → nada mais. **Modelo mínimo de "espera com identidade":** o personagem *é* o único conteúdo, e o spinner está sob ele em vez de em volta. `PADRÃO`
- **Bump — o painel de estilos de balão** (https://mobbin.com/screens/5c72ff43-94d7-40ce-a753-e22acc8d1682): uma tela inteira de **~25 variações do mesmo balão com a palavra `Message`** — cada um com tratamento diferente: **borda pixelada com alças de seleção**, gradiente arco-íris, contorno com nós de bounding-box visíveis, sólido preto com texto verde-terminal, pílula translúcida, borda tracejada, itálico manuscrito. **Catálogo pronto de vocabulários de balão de fala** — e o Soulmon precisa decidir como a criatura "fala" (dossiê 5). `PADRÃO`

### Convergência e divergência — Estilos visuais

- **Convergência (4+ apps):** **o retrô é sempre confinado.** Life Reset o põe num card; Babbel num modo de jogo assinado `+Babbel`; Netflix num ícone; MD Vinyl num widget. **Nenhum app do acervo aplica estética retrô à interface inteira.** E em todos, **o texto de leitura é sans-serif ou monospace legível** — a fonte pixelada, quando aparece, fica em título e rótulo curto.
- **Divergência — e qual é a escolha real:** **onde traçar a fronteira do pastiche.** Life Reset traça em volta da *arte* (pixel dentro do card, UI moderna fora). Babbel traça em volta do *modo* (o jogo inteiro é retrô, o app não). Co-Star e Poolsuite traçam em volta da *tipografia* (nada de pixel; retrô por monospace e textura). A escolha real é **quanto orçamento de arte você tem**: a fronteira em volta da arte exige produzir todos os sprites; a fronteira na tipografia custa uma fonte. **Para 11 formas em 5 estágios, o modelo Life Reset é o correto — mas implica que a criatura é o único ativo pixelado do produto, e que tudo ao redor é sans-serif limpo. Decisão de escopo de produção, não de estilo.**

## §15.3 — GAPS FECHADOS: A TELA DE DETALHE DE UM ITEM

### Finch — Ficha do Micropet (o achado mais transferível de todo o levantamento)
- **Plataforma / data:** iOS · **data visível na tela: `Hatched on Aug 31 2025`**
- **URL Mobbin:** https://mobbin.com/screens/3c4831d0-c18a-4153-ae02-1767cafbd40f
- **Estrutura da tela, de cima para baixo:**
  1. **A cena de fundo escurecida**, com o pet principal ainda visível ao fundo, e no topo: `×` (esq.), **`#25` em cinza claro centralizado** (o número de catálogo), e um rótulo `Lab` (dir., esmaecido)
  2. **Folha rosa-envelhecido de cantos arredondados** subindo — a paleta da própria criatura, não a do app
  3. **O micropet ilustrado, pequeno, "sentado" na borda superior da folha** — metade dele acima do card, metade dentro. Composição que quebra o container
  4. **Botão de engrenagem circular** flutuando na borda direita da folha
  5. **Barra de energia:** ícone de raio âmbar em círculo → **trilha rosa-clara** → **`0/15` em cinza à direita**
  6. **Rótulo de estágio em caixa alta pequena, centralizado:** `BABY`
  7. **Nome próprio em bold grande, centralizado:** `Pumpkin the Piglet`
  8. **Linha de metadados em cinza, separada por ponto médio:** `She/Her · Gentle Nature`
  9. **Parágrafo de lore, 3 linhas, centralizado**
  10. **Botão branco pílula de largura total:** `Equip`
  11. **Fora da folha, em cinza pequeno centralizado:** `Hatched on Aug 31 2025`
  12. Na base, **três abas esmaecidas:** `Outfits` · `Furniture` *(com `×` sobre ela)* · `Micropets`
- **Copy literal:** "#25" · "Lab" · "0/15" · "BABY" · "Pumpkin the Piglet" · "She/Her" · "Gentle Nature" · "Pumpkin loves fall weather and rooting around in the pumpkin patch. She hopes to bring you good luck for a bountiful harvest!" · "Equip" · "Hatched on Aug 31 2025" · "Outfits" · "Furniture" · "Micropets"
- **O mecanismo — sete decisões, todas relevantes para uma dex de 11 formas:**
  1. **`#25` acima de tudo** — o item pertence a um catálogo numerado. Uma linha que estabelece escala.
  2. **`BABY` como rótulo de estágio separado do nome** — o mesmo indivíduo pode existir em múltiplos estágios sem trocar de identidade. **Exatamente o modelo de 5 estágios do Soulmon.**
  3. **Pronome declarado (`She/Her`)** — a criatura tem gênero, dito explicitamente, não inferido pela arte. Relevante duplamente: para PT-BR, onde a concordância de gênero é obrigatória em toda a copy, **é um requisito estrutural de localização**, não um detalhe estético.
  4. **`Gentle Nature` como temperamento** — atributo de personalidade nomeado, não numérico. Substitui stats por caráter.
  5. **A lore em primeira instância narrativa** dá à criatura vida independente do desempenho do usuário.
  6. **`Hatched on Aug 31 2025` fora do card** — a data de nascimento como registro histórico, no rodapé, sem competir. É o que torna a criatura *daquela pessoa*.
  7. **A paleta da folha vem da criatura**, não do design system — cada ficha se veste da cor do seu ocupante, o que dá 60 identidades visuais com um único layout.
- **Variação entre apps:** o único do acervo que combina **catálogo + estágio + pronome + temperamento + lore + data de nascimento** numa só ficha. Todos os outros detalhes de item do acervo (OpenSea, OKX, Crypto.com, Uniswap, Glow) são fichas de ativo financeiro com traços e percentuais de raridade.
- **Quando falha / risco:** `0/15` na barra de energia é um número que zera diariamente. E a quantidade de metadados exige que **cada uma das 60 criaturas tenha lore escrita** — com 11 formas × 5 estágios, e em dois idiomas, isso é um volume de redação real que precisa estar no escopo, não descoberto depois.
- **Classificação:** PADRÃO — **modelo de referência direto para a ficha de criatura do Soulmon.**

### Opal — Ficha de item cosmético com raridade populacional
Descrição completa em **§9 (Dossiê 8A)**. URL: https://mobbin.com/screens/b71b0e4d-5c08-415f-8342-2ce95edc86ce · `PADRÃO`

### Tolan — Ficha de personalidade da criatura, com alternância "você / ela"
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/5c090ad4-b89d-4f66-beaf-c38217b1a4a4
- **Estrutura da tela, de cima para baixo:**
  1. Engrenagem (esq.) → **seletor segmentado em pílula com `You` e `Tolan`**, `Tolan` ativo em branco (centro) → `×` (dir.)
  2. **Fundo azul-noite com partículas verdes luminosas** espalhadas
  3. **`Sam` em serifada branca muito grande**, centralizado — o nome, tratado como capa de livro
  4. **Três chips escuros de cantos arredondados em linha**
  5. **A criatura 3D verde**, pose casual, centralizada, ~40% da altura
  6. **Frase em itálico começando com reticências**, duas linhas, centralizada
  7. **Faixa inferior com duas colunas:** **`COMPATIBILITY` em caixa alta cinza + `92%` em display grande branco**, com **uma barra horizontal de gradiente (vermelho→verde) e um marcador triangular** na posição · **`CORE TRAIT` em caixa alta cinza + `Empathetic` em serifada grande branca**
- **Copy literal:** "You" · "Tolan" · "Sam" · "Calming" · "Inclusive" · "Understanding" · "...cares about diving into what makes you unique and revealing new things." · "COMPATIBILITY" · "92%" · "CORE TRAIT" · "Empathetic"
- **O mecanismo:** **espelho recíproco.** O seletor `You / Tolan` implica que os dois têm perfis do mesmo formato — institucionaliza a simetria da relação em vez de deixá-la como tom de copy. **Para "um avatar que evolui COM o usuário", é a expressão estrutural mais literal do acervo:** a mesma ficha, dois ocupantes. E `COMPATIBILITY 92%` é um número que **descreve a relação, não o desempenho** — não é conquistado nem perdido por comportamento.
- **Variação entre apps:** único que dá **ficha paralela ao usuário e à criatura na mesma tela**, e único cujo atributo principal é de **relação** e não de progresso.
- **Quando falha / risco:** `92%` numa barra vermelho→verde **pode descer** — se compatibilidade cair, a pessoa lê que a relação piorou, punição afetiva mais dura que qualquer streak. Barra com gradiente de semáforo é sempre um juízo.
- **Classificação:** LIMÍTROFE *(o seletor recíproco: PADRÃO · a barra de compatibilidade mutável: ANTI-PADRÃO)*

### Convergência e divergência — Detalhe de item

- **Convergência:** as três fichas seguem a **mesma espinha:** (1) identificador acima, (2) **a arte no centro, em destaque**, (3) **nome próprio em display**, (4) uma linha de metadados curtos, (5) **um parágrafo descritivo**, (6) uma ação ou estado, (7) **um registro histórico no rodapé**. Os detalhes de NFT do acervo seguem a mesma ordem, trocando a lore por tabela de traços com percentual.
- **Divergência — e qual é a escolha real:** **o que ocupa a linha de metadados.** Finch põe **caráter** (`She/Her · Gentle Nature`); Opal põe **raridade populacional**; OpenSea e OKX põem **percentual de raridade por traço**; Tolan põe **traços de personalidade** em chips. A escolha real é **se a criatura é um indivíduo ou um exemplar.** Caráter e lore fazem um indivíduo insubstituível; percentual de raridade faz um exemplar comparável, e comparável implica hierarquia entre usuários. **Dada a tese "a criatura é insubstituível", o eixo Finch é o único coerente — e o `Owned by X%` do Opal só funciona no Soulmon se aplicado a COSMÉTICO, nunca à criatura.**

## §15.4 — GAP FECHADO: OFERTA QUE NÃO BLOQUEIA
Resolvido pelo **Garmin Connect** — descrição completa em **§12 (Dossiê 11A)**.
URL: https://mobbin.com/screens/f53c9109-b2d4-4ebd-9f08-60ee9738b01f

## §15.5 — GAP FECHADO: O ESCUDO DE DESCANSO E A ECONOMIA DE RECOMPENSA

### Yazio — "1 Streak Freeze" descrito quase palavra por palavra
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/a8cc8ad0-4e3f-4a40-b772-d2c5e7b7fe30
- **Estrutura da tela, de cima para baixo:**
  1. Cabeçalho: título `Shop` centralizado, **pílula de saldo `💎 10`** à direita
  2. **Cabeçalho de seção: `Daily Diamonds`**
  3. **Três cards brancos empilhados**, cada um com **ilustração de baú à esquerda** → título em bold → linha de condição em cinza → **e uma terceira linha que muda conforme o estado:** **`Claim` em azul** (disponível) · **`Refills in 20 hours`** em cinza (em recarga) · **`Locked`** em cinza, com baú cinza e cadeado (bloqueado)
  4. **Cabeçalho de seção: `Progress Perks`**
  5. **Card:** **ilustração de cristal de gelo azul** → **`1 Streak Freeze` em bold** → **duas linhas de corpo em cinza**
  6. **Botão azul pílula de largura total, fixo na base**
- **Copy literal:** "Shop" · "10" · "Daily Diamonds" · "Evening Energy Chest" · "Track food between 6:00 PM and midnight to unlock." · "Claim" · "Morning Boost Chest" · "Track food between 6:00 AM and noon to unlock." · "Refills in 20 hours" · "Saturday Flavor Chest" · "Track food on Saturday to unlock." · "Locked" · "Progress Perks" · "1 Streak Freeze" · **"Automatically activates after a day of inactivity to keep your streak safe."** · "Keep Collecting Diamonds"
- **O mecanismo:** **a copy `Automatically activates after a day of inactivity to keep your streak safe.` é a descrição mais próxima do escudo de descanso do Soulmon que existe no acervo** — incluindo a palavra `Automatically`. E a arquitetura importa: **o escudo está numa seção separada (`Progress Perks`) dos itens diários (`Daily Diamonds`)** — não é recompensa a colecionar, é propriedade do sistema. Isso o remove da economia de esforço. Os três estados dos baús também são bom vocabulário: **`Claim` (aja) / `Refills in 20 hours` (espere) / `Locked` (condição não atendida)** — três estados, três copies, nenhuma ambígua.
- **Variação entre apps — o comparativo que importa:**

| App | Como expõe o escudo | Leitura | URL |
|---|---|---|---|
| **Yazio** | `1 Streak Freeze` · "Automatically activates after a day of inactivity to keep your streak safe." | **Positivo** — automático, em seção de propriedade do sistema | [link](https://mobbin.com/screens/a8cc8ad0-4e3f-4a40-b772-d2c5e7b7fe30) |
| **Paired** | `1 available` · "The Streak Freeze is automatically applied when you lose your streak. You get one new Streak Freeze per month!" | **Neutro** — automático + cadência de reposição, mas `0 days` exposto na mesma tela | [link](https://mobbin.com/screens/b27cfee7-fe76-476d-b96a-1d1b53389f12) |
| **Alma** | Card `Streak saves` com **`0`** + `How it works ⓘ` | **Negativo** — estoque zerado exposto na home | [link](https://mobbin.com/screens/ea9f1fd5-652e-4cb3-afb6-7a6a30e53d78) |
| **Noom** | **`NO STREAK FREEZE`** em caixa alta · "Complete a healthy habit to extend your streak and earn a Streak Freeze" | **Negativo em caixa alta** — o escudo é *ganho*, e a ausência é anunciada | [link](https://mobbin.com/screens/5c506133-1cc8-470f-b791-468980acda12) |
| **Deepstash** | `PRO` `Exclusive benefit` · "With Pro, you receive 2 extra freezes / week every Monday." | **Monetizado** — vende proteção contra punição própria | [link](https://mobbin.com/screens/b6ff9a48-6196-4bcb-9997-66807ced786c) |
| **Numo** | `Pause & preserve` · "You can skip a day without losing your streak" | **Positivo** — melhor nome do acervo (verbo + garantia) | [link](https://mobbin.com/screens/cae1eb96-5ca5-4496-9dc4-9aa305c289ef) |
| **Todoist** | `Days Off` (seletor semanal) + `Vacation Mode` (toggle) | **Preventivo** — define o que nem conta como falha | [link](https://mobbin.com/screens/b4b94e45-69b6-4dcd-a961-148f8d7e5982) |

- **Quando falha / risco:** **a lição mais direta do arquivo.** Sete apps têm a mesma mecânica, e a diferença toda está em **como o estoque é exibido**. **Expor o estoque de escudos cria ansiedade precisamente quando ele está baixo — que é o momento em que a mecânica deveria estar protegendo a pessoa.** E o Deepstash mostra o pior caminho: vender proteção contra uma punição que o próprio produto inventou.
- **Classificação:** Yazio — PADRÃO · Paired — PADRÃO · Numo — PADRÃO · Todoist — PADRÃO · Noom — ANTI-PADRÃO · Alma — LIMÍTROFE · **Deepstash — ANTI-PADRÃO**

### Finch — "Daily Quests" com risco no concluído, timer de reset e evento sazonal
- **Plataforma / data:** iOS · data não exposta pelo MCP
- **URL Mobbin:** https://mobbin.com/screens/1551b763-6c71-4543-9b33-1b9a617e0c60
- **Estrutura da tela, de cima para baixo:**
  1. **Faixa de evento sazonal ilustrada** (cena de piscina com três pets em trajes de banho, boia, polvo): **pílula escura com `⏱ 4d 22h`** e **`POOLSIDE PALS` em bold branco com contorno**, mais **pílula de saldo `2,289`** à direita
  2. **Card branco:** ícone de check verde → mensagem de recompensa reclamada → **dois botões azuis empilhados à direita**
  3. **Cabeçalho `Daily Quests`** com **`⏱ 21 hrs 3 min`** alinhado à direita (reset)
  4. **Lista vertical com uma linha-guia tracejada conectando os marcadores** à esquerda:
     - **Concluída: círculo verde com `✓` + card verde-claro com o texto RISCADO**
     - **Pendentes: círculo vazio + card branco** com ícone colorido em quadrado → título em duas linhas → **barra de progresso com `0 / 1`** → **botão `→` em quadrado cinza**
  5. **Tab bar de 6 ícones ilustrados com rótulo**
- **Copy literal:** "4d 22h" · "POOLSIDE PALS" · "2,289" · "Yay, you claimed today's rewards!" · "On now!" · "View Event" · "Daily Quests" · "21 hrs 3 min" · "Complete a goal" *(riscado)* · "Change one interior item" · "0 / 1" · "Repeat an affirmation 3 times" · "0 / 1" · "Practice Gratitude" · "Home" · "Quests" · "Shop" · "Friends" · "Bag" · "Lee"
- **O mecanismo:** **três camadas de tempo coexistindo** — o evento sazonal (`4d 22h`), o ciclo diário (`21 hrs 3 min`) e a tarefa individual (`0/1`). Cada uma dá um motivo diferente para voltar, e nenhuma pune por não voltar: o texto riscado é prova de realização, o `0/1` é um convite, e o timer é informativo. **A linha tracejada conectando os marcadores** transforma uma lista em trilha, sugerindo sequência sem impor ordem.
- **Variação entre apps:** o único que **risca a quest concluída e a mantém no topo da lista**, e o único com **evento sazonal como camada temporal de terceiro nível**.
- **Quando falha / risco:** `4d 22h` é contagem regressiva de escassez — a única mecânica desta tela que gera urgência. Para o Soulmon é o único elemento a descartar; o resto é aproveitável quase integralmente.
- **Classificação:** PADRÃO *(o `4d 22h` de evento: LIMÍTROFE)*

### Character AI, Crypto.com, Xbox e ShopBack — a economia de quest, para contraste
- **URLs Mobbin:**
  - Character AI: https://mobbin.com/screens/957ac852-abce-46f7-822d-47e0b840e7e8
  - Crypto.com: https://mobbin.com/screens/25d9e4ea-1e33-4b9f-a5b1-4d19a0f6d06d
  - Xbox: https://mobbin.com/screens/968fb0c8-2251-4eb7-af77-09a4032c675f
  - ShopBack: https://mobbin.com/screens/77ede0dd-f936-4583-b6ec-728a7477f5fe
- **Copy literal:** Character AI: "Quest claimed!" · "You earned 20 charms" · "Quests" · "Imagine a Chat Story" · "X10" · "Claim" · "Imagine a Chat Image" · "X30" · "Create a Persona" · "X70" · "Post to the feed" · "X30" · "Add an intro video to one of your characters" · "X30" — Crypto.com: "Station 1" · "Rewards Earned" · "$0.00" · "Overview" · "Missions" · "Store" · "Start your streak now" · "Check in daily for streak rewards" · "Wed" "Thu" "Fri" "Sat" "Sun" "Mon" "Tue" com `+1 +1 +1 +1 +1 +1 +2` · "Claim Daily Reward" · "Daily Reset in 14:31:00" · "Daily Missions" · "Claim Daily Reward to unlock today's missions" · "Quick Quest" · "Buy/sell $100 equivalent of cryptocurrency in a single transaction" · "0 / 1" — Xbox: "Weekly console bonus" · "+150" · "Earn more points with Game Pass Quests" · "Game Pass Ultimate and PC Game Pass members earn even more with Game Pass Quests." · "Play a Game Pass game" · "+10" · "Game Pass weekly streaks" · "Play at least 5 days a week* to earn points and unlock next week's multiplier." · "Week 1 Multiplier 1x" · "1d" · "CLAIM REWARDS" — ShopBack: "Check-in daily to earn rewards" · "Ends Jul 29 • 2:42am" · "Rewards to earn" · "See all" · "$0.10 Bonus Cashback" · "Earned rewards" · "$0.10 bonus cashback" · "Milestone 1, Streak 1" · "View" · "Next check-in resets at midnight"
- **O mecanismo:** todos os quatro usam **check-in diário com reset por meia-noite** e **recompensa escalonada por dia consecutivo** — a mecânica mais pura de streak monetizado. Crypto.com e ShopBack exibem **contagem regressiva até o reset** (`Daily Reset in 14:31:00`, `Next check-in resets at midnight`), e Xbox condiciona um **multiplicador** ao cumprimento de 5 dias por semana. **Character AI é o único do grupo cujas quests não têm prazo** — a lista é de tarefas com valor fixo em moeda, sem timer.
- **Quando falha / risco:** contagem regressiva + multiplicador que se perde é a combinação mais coercitiva do arquivo. Para o Soulmon, todos os quatro são referência de **como não** estruturar a economia diária. Character AI, sem prazo, é o único aproveitável.
- **Classificação:** Character AI — LIMÍTROFE · Crypto.com, Xbox, ShopBack — ANTI-PADRÃO

### Noom — Desafios com pips de losango e a etiqueta `One-time`
Descrição completa em **§9 (Dossiê 8A)**. URL: https://mobbin.com/screens/91a378f3-09df-41ee-8366-1311f02b72d3 · `PADRÃO`

## §15.6 — O QUE FAZ CADA APP ÚNICO

*Uma linha por app: a decisão que só ele toma, e o que ela custa. Ordenado por relevância
para o Soulmon.*

| App | O que só ele faz | O que isso custa | URL de referência |
|---|---|---|---|
| **Finch** | **Entrega a criatura na tela 2 de 21**, antes de pedir qualquer coisa — e o pet entrevista o usuário. Ficha de item com estágio + pronome + temperamento + lore + data de eclosão. Social com zero métrica | Volume de redação enorme (60 itens com lore, em 2 idiomas) e uma economia de energia diária que zera | [flow](https://mobbin.com/flows/80ef83ef-f872-4825-b18d-6b193d60a9aa) · [ficha](https://mobbin.com/screens/3c4831d0-c18a-4153-ae02-1767cafbd40f) |
| **Opal** | **`Owned by 23%`** — raridade populacional como prestígio, sem ranking e sem número próprio que desce. Item cosmético em cenografia de museu | Convive com `Top 17% WORLDWIDE` na mesma tela, que é ranking cru | [gema](https://mobbin.com/screens/b71b0e4d-5c08-415f-8342-2ce95edc86ce) |
| **Tolan** | **Seletor `You / Tolan`** — a mesma ficha de personalidade para usuário e criatura. Home de tela cheia com chrome reduzido a 3 ícones nus | `COMPATIBILITY 92%` em barra de semáforo pode descer | [ficha](https://mobbin.com/screens/5c090ad4-b89d-4f66-beaf-c38217b1a4a4) · [home](https://mobbin.com/screens/90722ad9-55fe-4a5d-8df2-de63dae1a2ff) |
| **Life Reset** | **Pixel art confinado a um card, UI moderna em volta.** Slots de equipamento vazios *rotulados* em vez de cadeados | Cinco atributos com `▲` que implicam `▼` | [perfil](https://mobbin.com/screens/28db14a2-e6a1-4f49-a304-a048fa1880b4) |
| **BitePal** | **O rosto do pet como ícone do app** — 7 variações de expressão selecionáveis, mudando o ícone na home screen. Cena com decoração sazonal | Corações que esvaziam; ícone só disponível em iOS | [ícone](https://mobbin.com/screens/7c745e26-a731-4107-9bdf-8e65b43775d7) · [home](https://mobbin.com/screens/c76cbee1-e8f2-443c-b542-4920622b6ed3) |
| **Ahead** | **Adereço como estado emocional** (o monóculo) — troca-se o acessório, não a arte base. Barra de XP com marcadores de etapa | `0 XP/2500` exibido ao lado de barras que andaram | [perfil](https://mobbin.com/screens/ec7ff4d8-ecff-4305-b6d2-3fbc5d082ef9) · [celebração](https://mobbin.com/screens/6cac800a-3795-4460-9d1b-46931c43c838) |
| **Yazio** | **`Automatically activates after a day of inactivity`** — única descrição de escudo automático do acervo, em `Progress Perks`, fora da economia de recompensa | Na tela de permissão, atrela a data da meta ao opt-in e não oferece recusa | [loja](https://mobbin.com/screens/a8cc8ad0-4e3f-4a40-b772-d2c5e7b7fe30) |
| **Ten Percent Happier** | **`Imperfect` no nome do desafio** — permissão de falhar no título. E `Meditate for 10 of 14 days`, a mecânica de constância como enunciado | `15 min GLOBAL DAILY AVERAGE` reintroduz comparação implícita | [desafio](https://mobbin.com/screens/3cf91140-93c2-4eed-83c8-7086b1169d03) |
| **Noom** | **Etiqueta `One-time`** — declara que o desafio não se repete, logo não pode ser perdido. Pips de losango que só enchem | `NO STREAK FREEZE` em caixa alta anuncia a ausência | [desafios](https://mobbin.com/screens/91a378f3-09df-41ee-8366-1311f02b72d3) |
| **Reddit** | **Não obtido = branco liso sem detalhe nenhum**, e **barra de progresso suprimida nos itens em zero** | Branco liso pode ler como skeleton de carregamento | [coleção](https://mobbin.com/screens/8b0cbabc-fd6c-4e8d-abd6-dfd8f1828714) |
| **Speak** | **`What I heard` + `Delete my answers`** — devolve a resposta bruta e oferece saída de dados na tela de resultado | Transcrição errada exibe o erro no pico de atenção | [resultado](https://mobbin.com/screens/f9aa3796-47d7-456f-93c9-30acff81da86) |
| **The Outsiders** | **`Not that you need them, but still`** + **botões `Skip` e `Go For It` de largura igual** | Paridade de botões custa taxa de opt-in | [permissão](https://mobbin.com/screens/66485262-6b44-43b2-8f43-fdb625fdee25) |
| **Buddy** | **Pede notificação ao ligar o toggle, em Configurações** — o único fora do onboarding | Copy com enquadramento de perda | [permissão](https://mobbin.com/screens/47f06972-3e3e-4dc3-b648-c1225df53a76) |
| **Garmin Connect** | **`×` no próprio card de oferta**, botão de largura parcial, mesmo container que conteúdo não-comercial | Uma única chance de conversão por usuário | [home](https://mobbin.com/screens/f53c9109-b2d4-4ebd-9f08-60ee9738b01f) |
| **MD Vinyl** | **Degradação de widget por remoção de função** — a assinatura material sobrevive nos três tamanhos | Moldura esqueumórfica come área de informação | [widgets](https://mobbin.com/screens/6049f0b1-826c-41a9-bf31-fc5725cca364) |
| **How We Feel** | **Social por estado emocional não-ordenável** + `Undo` em solicitação de amizade + `Invite the people closest to you` | Publicar `apathetic` é exposição real | [amigos](https://mobbin.com/screens/da319329-ed00-42dd-9ee6-286a6f578a60) |
| **Lapse** | **`Best friend of`** — prestígio atribuído por terceiros, não conquistado | A aba vazia seria devastadora | [amigos](https://mobbin.com/screens/ecb2ebd0-fb41-4327-87a3-7da55465ec0e) |
| **Telegram** | **`Hide My Name`** em presente — distingue os visitantes do perfil do destinatário | Presente precificado cria hierarquia de afeto | [presente](https://mobbin.com/screens/b02dba91-e734-4842-9313-d14c95ff0c52) |
| **Chase UK** | **`OK, that didn't work`** + **um caminho alternativo** (`Take photo manually`) | — | [erro](https://mobbin.com/screens/36260299-2210-4fe6-8f64-83b025e12e25) |
| **ABY Journal** | **Erro em card sobreposto com o input do usuário preservado e visível atrás** | App pequeno; copy dramatiza | [erro](https://mobbin.com/screens/568247e6-cd50-41f7-8ab1-0f8bc0d5afae) |
| **Strava** | **`I don't have one`** — saída explícita para tarefa de checklist impossível. E `Group Effort` como número único somado | O checklist compete com o `Suggested Goal` acima | [home](https://mobbin.com/screens/9e550f02-8d7a-4e05-be89-aae812901ec4) · [desafio](https://mobbin.com/screens/a2b368f1-0588-49bc-8384-2f7de6b01420) |
| **Preply** | **O passo do checklist se transforma no conteúdo real** em vez de desaparecer | — | [home](https://mobbin.com/screens/c3d369c6-c1bd-4deb-8daa-62903d11d95b) |
| **Google Photos** | **`Results may be unexpected`** — pré-desculpa a qualidade do output generativo | Num output permanente e insubstituível, o aviso assusta | [geração](https://mobbin.com/screens/521471b1-b147-44f7-9796-90ee9de25fa6) |
| **Canva** | **Eco da prompt entre aspas** + **`Cancel` de largura total** + navegação do app viva | Só serve quando existe prompt textual | [geração](https://mobbin.com/screens/2dcf4365-b705-4546-a5f0-e62c7085798e) |
| **Co–Star** | **Retrô feito só de hifens, pipes e monospace** — zero asset gráfico | Caracteres de desenho quebram com Dynamic Type | [jogo](https://mobbin.com/screens/981f7e86-a42e-4e37-a1b3-ef370ec2aece) |
| **Babbel** | **Modo de jogo com identidade visual completa e própria, assinada `+Babbel`** | Dois design systems; fonte pixelada sem `ã ç õ` em PT-BR | [Phrase Maze](https://mobbin.com/screens/7d85cf2e-c1ea-4656-adb9-a03f65955138) |
| **Glow / Uniswap** | **Grade de criaturas em pixel art em escala real** (5.553 e 10.000 itens), com **fundo de cor sólida como diferenciador** e **filtros por traço** revelando a estrutura componível | Camada de preço e especulação a descartar | [Glow](https://mobbin.com/screens/f107b12b-e148-45f1-91df-fa1b8459ca0b) · [Uniswap](https://mobbin.com/screens/d2418657-ea15-4d9a-8f07-71ada2025861) |
| **Bump** | **~25 variações de balão de fala num só painel** | É um app de mensagens, não de hábito | [balões](https://mobbin.com/screens/5c72ff43-94d7-40ce-a753-e22acc8d1682) |
| **Todoist** | **`Days Off` como seletor de dias da semana** + **`Vacation Mode`** — descanso configurado *antes* de ser necessário | Interface de configuração, não de acolhimento | [produtividade](https://mobbin.com/screens/b4b94e45-69b6-4dcd-a961-148f8d7e5982) |
| **Commons** | **`1,285 people have joined!`** — contagem de participação, não de desempenho, com finalidade externa | `18 DAYS LEFT` é escassez | [desafio](https://mobbin.com/screens/4021a35a-09d4-4c63-9971-eafa2774b09c) |
| **Duolingo** | **A referência negativa mais útil do arquivo:** widget com coruja vermelha ameaçadora, seta apontando para `Allow` no diálogo nativo, grade mensal com meses cinza permanentes, `FRIEND STREAKS` comparados. E, do lado positivo, `Perfect Week` e `SHARE FOR A REWARD` | É o modelo de tudo que a tese do Soulmon rejeita — e vale documentado exatamente por isso | [widget](https://mobbin.com/screens/7d0f39fd-a349-4ef0-9a3b-d907200515fa) · [permissão](https://mobbin.com/screens/817844ed-f7df-4645-b18b-a9803879821f) · [badges](https://mobbin.com/screens/c305d492-71c0-433b-99e7-71309ec14278) · [wrapped](https://mobbin.com/screens/81b67776-4a5d-40d9-860e-9b3b4122357a) |
| **Replika** | **Silhueta em contraluz como revelação** — e o paywall exatamente atrás dela. Justificativa curta por campo coletado | Arquitetura de fluxo extrativa: pede tudo, entrega no fim, cobra no clímax | [flow](https://mobbin.com/flows/19470dcc-dbd6-48ae-a945-f708e3a1b3d2) |
| **Deepstash** | **Celebração de conquista NÃO obtida** (arte completa + `You haven't unlocked this yet.`) | E também **vende escudos** — monetiza proteção contra punição própria | [conquista](https://mobbin.com/screens/c3d6f620-b9e0-4778-83ff-b8c7736a7b7c) · [streak](https://mobbin.com/screens/b6ff9a48-6196-4bcb-9997-66807ced786c) |
| **Mimo** | **`Wooden LEAGUE`** — título material no slot de um número. E, do lado negativo, **o perfil do amigo reusando o card de métrica do próprio perfil** | A demonstração mais limpa de que simetria de componente produz ranking | [perfil](https://mobbin.com/screens/b66ff1af-4bc8-4687-8404-94ebbd379e53) · [amigo](https://mobbin.com/screens/c1fa3ffb-c0fd-46e8-8d98-80c2e58ae973) |

---

# §16 — DECISÕES TOMADAS E ARQUITETURA RESULTANTE

> As oito perguntas em aberto do primeiro levantamento foram respondidas pelo time de
> produto em 02/09/2026. Esta seção registra as respostas, o que cada uma resolve, e as
> consequências que elas criam — inclusive as inconvenientes.

## §16.1 — As oito decisões

| # | Pergunta | Decisão |
|---|---|---|
| 1 | Onde o usuário gratuito vê uma criatura pela primeira vez? | **Criatura comum grátis, criatura própria paga** |
| 2 | A criatura tem gênero declarado? | **Neutro, resolvido por nome próprio** |
| 3 | O overlay de desktop mostra a criatura? | **Sim — a criatura É o overlay** |
| 4 | O estoque de escudos de descanso é visível? | **Invisível — age em silêncio** |
| 5 | A árvore de 11 formas / 5 estágios é linear ou ramificada? | **Ramificada por comportamento** |
| 6 | Os 20 itens psicométricos: resultado mostrado ou invisível? | **Invisível — só alimenta a criatura** |
| 7 | O que acontece com quem não responde os 20 itens? | **Criatura completa, só menos personalizada** |
| 8 | Existe camada social? | **Sim — amigos e criaturas visitáveis** |
| 8b | Na visão social, a criatura do amigo aparece em que estado? | **No estágio real (aceita comparação)** |

## §16.2 — O que as decisões resolvem

**A decisão 5 (ramificação) salva a decisão 8b (comparação aceita).** Esta é a
consequência mais importante do conjunto:

> Num sistema **linear**, estágio 4 ao lado de estágio 1 significa **"ele está na frente"**.
> Num sistema **ramificado**, significa **"ele foi por outro caminho"**.

Ramificação converte comparação **vertical** (melhor/pior) em **variedade horizontal**
(diferente) — **desde que a UI social exiba o galho, não a altura.** É o que separa o
`Wooden LEAGUE` do Mimo (uma escada, logo um lugar na escada) do `Owned by 23%` do Opal
(um fato, sem lugar). Se a árvore de amigos mostrar "estágio 4 de 5", é escada. Se mostrar
"Forma: Vigília" ao lado de "Forma: Brasa", é variedade.

**A decisão 4 (escudo invisível) está corretamente calibrada.** O §15.5 mostra sete apps
com a mesma mecânica, e a diferença toda está na exibição do estoque: `1 Streak Freeze`
(Yazio, positivo) · `1 available` (Paired, neutro) · `Streak saves 0` (Alma, negativo) ·
`NO STREAK FREEZE` (Noom, negativo em caixa alta) · `2 extra freezes com Pro` (Deepstash,
monetizado). **Não expor o estoque evita o único modo de falha da mecânica.**

**A decisão 2 (neutro por nome próprio) tem um custo declarado.** Evita o volume de
variantes de string, mas exige disciplina de redação permanente: nenhuma linha de copy sobre
a criatura pode usar adjetivo concordado. Comparar com o Finch, que declara `She/Her` na
ficha (§15.3) — e note que, num produto PT-BR, isso é **requisito estrutural de
localização**, não detalhe estético.

## §16.3 — Os dois problemas que as decisões criam

### Problema 1 — O clímax ficou sem prêmio visível

Cruzamento das decisões 6, 7 e do escopo original:

| Decisão | Efeito |
|---|---|
| Psicométrico **invisível** (6) | O usuário não recebe leitura de personalidade |
| 20 itens **opcionais** (escopo) | Ele pode pular |
| 6 perguntas **já bastam** para criatura completa (7) | Pular não custa nada visível |

**Consequência: o que a pessoa ganha por responder os 20 itens? Nada que ela veja.** O custo
é real (20 telas), o retorno é invisível. Pela mecânica de justificação de esforço, esta é
a configuração que produz a maior taxa de abandono no meio do quiz.

**O dossiê 1 tem a solução, e ela não exige reverter a decisão:** `What I heard` do Speak
(devolver a resposta bruta), destaque cromático do Lovi (`post-acne spots` em ciano),
`Next steps` do Noom (anunciar que o dado será usado). Todos os três existem para **provar
que a resposta foi usada** sem revelar um perfil. **"Invisível" precisa significar "não
devolve diagnóstico", não "não dá sinal nenhum".**

### Problema 2 — A comparação social não é consertável por copy

No Finch, o pet do amigo na árvore não revela nada sobre o desempenho dele. **No Soulmon, a
criatura evolui com o comportamento — então a forma da criatura É a métrica.** Um estágio 4
ao lado de um estágio 1 comunica desempenho relativo sem um único número, e nenhuma decisão
de copy conserta isso. A ramificação (§16.2) mitiga, não elimina: **o estágio 1 continua
sendo visivelmente o começo, em qualquer galho.**

E o Mimo (§14, 13B) mostra onde a armadilha mora na prática: ele **não desenhou um
leaderboard** — só reusou o card de métrica do próprio perfil na tela do amigo. **A
comparação emergiu da simetria de componente.**

## §16.4 — A arquitetura da camada social: 6 regras, todas com evidência

| # | Regra | De onde vem |
|---|---|---|
| **1** | **Nenhum componente de métrica reusado do próprio perfil.** A tela do amigo tem componentes próprios, sempre | Mimo: não desenhou ranking, só reusou o card — e virou placar |
| **2** | **Posição sem ordem.** Árvore/cena, nunca lista vertical nem fileira horizontal | Finch (árvore) vs. Duolingo (`FRIEND STREAKS` em fileira = ordem implícita) |
| **3** | **Exibir galho, não altura.** "Forma: Brasa", nunca "estágio 4 de 5" | Opal `Owned by 23%` (fato) vs. Mimo `Wooden LEAGUE` (escada) |
| **4** | **Só verbos de dar.** Nenhuma ação de "ver progresso do amigo" | Finch: `Share Goal` · `Send Good Vibes` · `Send Gift` — e a ausência de uma quarta |
| **5** | **Meta somada, nunca confrontada.** "Quantas vezes vocês dois conseguem" | Finch `Goal Buddy` · Strava `Group Effort 0m / 1,000m` · Commons `1,285 people have joined!` |
| **6** | **Convite pago em cosmético.** Nunca dinheiro, nunca vantagem | Finch `Invite friends to get this micropet!` vs. os 7 apps de referral financeiro |

**A regra 1 é a única que não pode ser negociada depois.** As outras cinco são decisões de
tela; essa é uma decisão de design system, e é a que o Mimo perdeu sem perceber.

## §16.5 — Consequências de produção das decisões

- **Decisão 3 + 5:** a criatura é o overlay de desktop **e** a árvore é ramificada com 11
  formas ⇒ **animação idle de desktop para 11 formas**. É o item de escopo de arte mais
  caro do conjunto, e o overlay tem as restrições mais duras de todas (área mínima, sempre
  visível, não pode incomodar). **Contexto não coberto por este levantamento** — o MCP do
  Mobbin só tem `ios` e `web`.
- **Decisão 5:** ramificação **impede nomear o próximo estágio** — o modelo `Evolve Lee
  into Toddler` do Finch (§6) não serve. A tela de evolução precisa de silhueta (Replika,
  §2), `?` (Finch, §8) ou branco liso (Reddit, §8).
- **Decisão 1:** a criatura comum grátis também ramifica por comportamento? **Pergunta
  aberta gerada pela própria decisão** (ver §17). Se sim, o pago compra só arte única. Se
  não, o gratuito tem mecânica mais pobre.
- **Decisão 8:** com social confirmado, o **compartilhamento** (§13) ganha peso — e a
  hipótese mais forte do dossiê 12 se confirma: **a criatura é o ativo compartilhável, não
  a métrica.** Um card com nome, forma atual e data de eclosão é intrinsecamente postável;
  "N dos últimos 7 dias" não é. Dado o problema de piso (Uxcel no dia 2, Marriott com
  quatro zeros), o compartilhamento deve ser oferecido **a partir de um marco de evolução**,
  não numa cadência de calendário.

---

# §17 — PERGUNTAS EM ABERTO

*Revisadas depois das decisões da §16. As três primeiras mudariam o desenho de forma
substantiva.*

1. **A criatura comum gratuita também ramifica por comportamento?** Gerada pela decisão 1
   cruzada com a 5. Se sim, o pagamento compra apenas arte única e insubstituibilidade —
   o que é coerente com a tese, mas é um valor percebido mais fino. Se não, o usuário
   gratuito tem uma mecânica de evolução mais pobre, e isso vai aparecer na árvore de
   amigos (decisão 8b) como diferença visível entre pagantes e não pagantes. **Nenhum app
   do acervo tem esse problema, porque nenhum tem criatura gratuita e criatura paga
   coexistindo socialmente.**

2. **Como o Oráculo sinaliza que os 20 itens foram usados, se o resultado é invisível?**
   O problema 1 da §16.3. Existem três modelos no acervo (Speak, Lovi, Noom) e nenhum
   exige revelar um perfil. **Sem uma decisão aqui, os 20 itens são custo sem retorno
   percebido.**

3. **O overlay de desktop: qual é a área mínima e o comportamento de repouso?** A decisão 3
   diz que a criatura é o overlay, mas **este levantamento não cobre desktop** — o MCP não
   tem a plataforma. As restrições (sempre visível, não modal, não sobre conteúdo, animação
   idle em 11 formas) precisam de levantamento próprio, por outra fonte.

4. **Existe um piso de evolução abaixo do qual o compartilhamento não é oferecido?** Uxcel
   oferece compartilhar `2 days in a row`; Marriott oferece um card com quatro zeros. Ambos
   constrangem. **Nenhum app do acervo define esse piso explicitamente.**

5. **A tela de amigos escala?** O Finch usa uma árvore, e o acervo **não tem captura com
   muitos amigos**. A metáfora de "posições sem ordem" (regra 2 da §16.4) quebra quando há
   30 criaturas para posicionar, e a solução óbvia — listar — reintroduz a ordem que a
   metáfora existia para evitar.

6. **`Buddy up` cria uma nova forma de pressão?** A parceria de hábito do Finch produz
   interdependência sem ranking, o que é desejável — mas significa que **a falha de um pode
   decepcionar o outro.** Estruturalmente diferente do streak individual, e não coberto pela
   tese atual ("nada pune por inatividade" fala do sistema, não de outra pessoa).

7. **O estado da criatura é visível socialmente?** Se a criatura reflete o comportamento e o
   amigo pode visitá-la, **expor o estado é expor o desempenho, só sem número** — o alerta
   do How We Feel (§14). Uma criatura visivelmente abatida na árvore de amigos é uma
   acusação pública. A decisão 8b resolveu o *estágio*; o *estado* segue aberto.

8. **Existe celebração não-bloqueante, e como ela se parece?** Dois passes no Mobbin não
   acharam praticamente nada (§7, 6B) — é limite do acervo, não conclusão. **Precisa de
   captura de vídeo ou observação direta de apps concorrentes.**

---

## Encerramento

- **27 buscas no Mobbin** (25 de tela, 2 de fluxo), **~90 achados descritos**, **13 dossiês**.
- Nenhuma imagem, screenshot ou asset de terceiro neste arquivo — só descrição estruturada
  + URL do Mobbin, por exigência de propriedade intelectual.
- Nada foi commitado, salvo em repositório, publicado ou enviado para serviço externo
  durante o levantamento.
- **Limites que continuam valendo:** sem Android · sem data de captura · sem estados
  transitórios · sem desktop. Ver §1.
