# Brief para a sessão com Mobbin Pro

Prompt autossuficiente para uma sessão Claude **com MCP do Mobbin Pro** e **sem
acesso ao repositório do Soulmon**. Ela devolve UM arquivo markdown; nada é
commitado nem salvo do lado de lá.

Mantido aqui para poder ser reusado/atualizado. O texto abaixo é o prompt.

---

Você tem acesso ao **Mobbin Pro** por MCP. Sua tarefa é levantar padrões reais de
UI/UX que vão alimentar o redesenho de um app, e devolver **um único arquivo
markdown**.

## RESTRIÇÕES — leia antes de tudo

1. **Você NÃO tem acesso ao app em questão** (código, repositório, telas). Não
   tente encontrá-lo, não procure o repositório, não presuma como ele é além do
   que está descrito aqui. Se algo do contexto não bastar para julgar
   relevância, **anote a dúvida no arquivo final** em vez de preencher com
   suposição.
2. **Não commite nada. Não crie branch, não abra PR, não escreva em repositório
   nenhum.**
3. **Não salve nada fora desta sessão** — sem upload, sem publicar artefato, sem
   mandar para serviço externo, sem gist, sem link público. O único produto é o
   texto do arquivo, entregue **dentro desta conversa**, para a pessoa copiar.
4. **Não envie imagens, screenshots, arquivos de asset ou trechos de arte.** O
   app tem regra dura de propriedade intelectual: nada de terceiro entra no
   bundle. Você entrega **descrição estruturada + URL do Mobbin**, nunca o
   pixel. Descrever "o botão ocupa a largura toda, canto 8px, ícone à esquerda"
   é o que serve; anexar a imagem, não.
5. **Não desenhe para nós e não recomende o que fazer.** Você é o levantamento,
   não o projeto. Descreva o que os apps fazem e por que funciona; a decisão é
   de quem tem o contexto do produto.

## O produto (o mínimo para você julgar relevância)

**Soulmon** — app de produtividade gamificado do gênero *v-pet* (bichinho
virtual, linhagem Tamagotchi/Digimon). React + TypeScript, PWA + APK Android +
um overlay de desktop. Textos sempre em **PT-BR e EN**. Temas claro e escuro.

**A fantasia central:** um ritual de criação ("Oráculo") transforma respostas
pessoais do usuário — 6 perguntas, opcionalmente 20 itens psicométricos, data e
hora de nascimento — numa criatura única, gerada por IA, que **evolui conforme o
usuário cumpre hábitos e tarefas**. A criatura é insubstituível e tem 11 formas
possíveis ao longo de 5 estágios.

**A tese declarada, que rege tudo:** *é um avatar que evolui COM o usuário e o
encoraja — nunca um cobrador.* Consequências que você precisa conhecer para não
trazer padrão inútil:

- **Não existe streak que zera.** A constância é "N das últimas 7 dias", e
  escudos de descanso são consumidos automaticamente quando a pessoa falha.
- **Nada pune por inatividade.** Quem some 2+ dias não perde nada e é recebido
  com acolhimento, não com cobrança.
- **Nenhum número exposto pode diminuir.** Barras de coleção e contadores só
  crescem.
- **Dinheiro nunca compra vantagem de progresso** — só cosmético e a criação da
  criatura própria.

Então: padrões de "não perca sua ofensiva!", contagem regressiva de FOMO,
paywall que bloqueia progresso e leaderboard global cru **não servem** — mas
descrevê-los como anti-padrão, dizendo qual app faz e por que é arriscado, tem
valor. Marque como `ANTI-PADRÃO` quando for o caso.

**Regras visuais que já existem e não mudam** (use para filtrar o que é
aproveitável):
- **Ícone nunca dentro de caixa.** Nada de moldura, placa ou fundo em volta de
  ícone — ele aparece grande e "pelado". Seleção na navegação é sublinhado, não
  placa preenchida.
- Estética retrô/8-bit no jogo, num invólucro limpo e minimalista.
- A área do pet fica fixa; só a lista abaixo dela rola.

## O que eu preciso: 12 dossiês

Para cada um, procure no Mobbin, escolha **os 4 a 8 exemplos mais fortes** e
descreva. Prefira **profundidade a volume**: 5 padrões dissecados valem mais que
25 listados.

1. **Revelação de resultado depois de quiz longo.** Apps que fazem 15+ telas de
   perguntas e entregam um resultado personalizado. Como é a tela do resultado?
   O que aparece primeiro? Tem animação de revelação, silhueta, contagem? Como
   ligam o resultado às respostas que a pessoa deu ("porque você disse X")?
   *(Nosso clímax hoje é só texto — é o problema mais caro do produto.)*

2. **Estado de "gerando" / espera com IA.** A tela enquanto algo é gerado por
   IA: o que mostram, quanto tempo assumem, o que fazem quando demora demais ou
   falha. Progresso real vs. teatro de progresso. Como saem do erro sem quebrar
   a expectativa.

3. **Primeiro dia guiado / checklist de ativação.** Cartão ou lista de 2–4
   gestos que o app pede na primeira sessão. Onde fica, como marca progresso,
   **como desaparece** quando termina. Diferencie do tutorial em tela cheia.

4. **Permissão de notificação com priming.** A tela que aparece *antes* do
   diálogo do sistema. Copy literal, o que oferecem em troca, e em que momento
   da jornada aparece (é o dado mais importante: 1ª sessão? depois de uma
   ação?).

5. **Personagem/mascote como interface.** Apps em que um personagem ocupa a home
   e reage ao usuário. Onde ficam nome, título e estado; como o personagem
   "fala" (balão, banner, legenda); que estados emocionais existem e como são
   sinalizados sem texto.

6. **Celebração de marco.** Modais/overlays de conquista. Quanto tempo duram, o
   que interrompe, como se sai. Diferencie **celebração que faz pausar** de
   **toast que passa batido** — quero as duas, marcadas.

7. **Coleção / dex / álbum.** Grades de itens colecionáveis: como mostram o que
   **ainda não** foi obtido (silhueta? cadeado? vazio?), como exibem progresso
   (X de Y), agrupamento, e a tela de detalhe de um item.

8. **Prestígio puramente cosmético.** Selos, bordas douradas, auras e títulos
   que marcam consistência **sem** exibir número que desce. Como aparecem e como
   somem. *(Estamos criando um selo de "sem escudo gasto" — modelo Perfect
   Streak do Duolingo.)*

9. **Widget de tela inicial.** Widgets de apps de hábito/pet/companion nos
   vários tamanhos. Que informação cabe em cada tamanho, hierarquia, e como o
   personagem aparece num espaço tão pequeno.

10. **Retorno depois de ausência.** Telas de "welcome back" / win-back. Tom da
    copy (acolhimento vs. cobrança — marque qual), o que mostram sobre o tempo
    fora, e se pedem algo ou só recebem.

11. **Oferta dentro do app, sem bloquear.** Soft paywall, banner de upgrade em
    loja, card de oferta em relatório/resumo. **Onde no fluxo aparecem**, como
    são dispensáveis, e como comunicam valor sem ameaçar perda. Inclua também os
    `ANTI-PADRÃO` de paywall agressivo, marcados.

12. **Card compartilhável de resumo.** Estilo "Wrapped": recap pessoal
    compartilhável. Composição, o que destacam, proporção, e como o app
    apresenta a oferta de compartilhar sem constranger.

## Esquema de cada achado (siga sem variar)

```
### <App> — <nome do padrão>
- **Plataforma / data:** iOS ou Android, e a data da captura no Mobbin
- **URL Mobbin:** <link direto do flow ou screen>
- **O padrão em uma frase:**
- **Estrutura da tela, de cima para baixo:** (o que existe, em ordem, com
  tamanho/peso relativo — não é código, é descrição)
- **Copy literal:** (transcreva o texto visível; se não der para ler, diga
  "ilegível" em vez de parafrasear)
- **O mecanismo:** por que isto funciona psicologicamente ou de negócio
- **Variação entre apps:** o que este faz diferente dos outros do mesmo dossiê
- **Quando falha / risco:**
- **Classificação:** PADRÃO | ANTI-PADRÃO | LIMÍTROFE
```

E ao fim de **cada dossiê**, duas linhas que valem mais que os achados:

- **Convergência:** o que 3+ apps fazem igual (é sinal, não coincidência).
- **Divergência:** onde eles se dividem — e qual é a escolha real por trás.

## Regras de qualidade

- **Não invente URL nem app.** Se o Mobbin não tiver bom exemplo de um dossiê,
  escreva `SEM EXEMPLO FORTE NO MOBBIN` e diga o que procurou. Um dossiê vazio
  honesto é melhor que cinco entradas fracas — vou tomar decisão em cima disso.
- **Transcreva copy, não resuma.** O texto exato é metade do valor; "eles
  encorajam o usuário" não serve.
- **Prefira apps com escala comprovada** (Duolingo, Finch, Strava, Headspace,
  Pokémon GO, Widgetsmith, Habitica, Fabulous, Cal AI, Notion, Spotify) mas
  **não ignore um app pequeno** com solução melhor — só diga que é pequeno.
- Registre **datas**: um padrão de 2021 pode ter sido abandonado.
- Se um padrão aparecer nos dois sistemas (iOS e Android) com diferença
  relevante, registre as duas.

## Entregável

Um arquivo markdown chamado `MOBBIN-DOSSIE.md`, nesta ordem:

1. **Método e limites** — o que você conseguiu buscar, o que o MCP não permitiu,
   quais dossiês ficaram fracos e por quê.
2. **Os 12 dossiês**, na ordem acima.
3. **O que eu não pedi e você acha que importa** — padrões que apareceram na
   busca e que se encaixam num app de v-pet/hábito. Máximo 10, mesmo esquema.
   *(Esta seção costuma ser a mais valiosa; você viu a biblioteca, eu não.)*
4. **Perguntas em aberto** — o que você precisaria saber sobre o produto para
   ter buscado melhor.

Entregue o conteúdo **dentro desta conversa**, em bloco de código markdown, para
a pessoa copiar. Não salve, não commite, não publique.
