# Objetivo anual + motivação + revisões — insumos

Origem: pedido do dono em 12/11/2026, junto com a resposta do ChatGPT que ele colou para ajudar a estruturar. O texto está preservado como veio. Só foram retirados o CSS do diagrama mermaid e os links de imagem ilustrativa sem conteúdo; as relações do diagrama estão transcritas em texto.

## 1. Pedido do dono (transcrição de voz)

> coisa que a gente tem que fazer, que é muito importante, tem que ser muito bem feito, então vamos gastar energia nisso, é que no onboarding eu quero que o usuário tenha um momento lá, deixa eu ver, antes de definir as tarefas que ele quer pegar, os hábitos, eu quero que seja perguntado pro usuário qual o objetivo dele pra daqui um ano. Onde ele quer chegar, onde ele quer estar daqui um ano. E aí ele vai escrever lá. E aí vai ser perguntado pra ele depois: pra que você cumpra isso, quais dessas tarefas você precisa fazer? E aí dá a lista, né, pra ele escolher e pra ele criar mais, que é o que já tem. Aí cai na parte que já tem. Mas antes pergunta: onde você quer estar daqui um ano? Aí ele vai escolher. E esse vai ser o objetivo dele. E aí vai perguntar também o que que motiva ele. Aí vai falar, dá algumas opções, mas deixa ele, espaço pra ele pôr as próprias. Mas da opção lá é alguém, enfim, pensa em várias possíveis motivações lá pra ele escolher ou então ele põe a dele lá. Mas ele vai escolher uma motivação, a principal. E aí a gente vai usar isso de tempo em tempo. Então, aí depois, no final, a gente vai mostrar pra ele, no final do mês, vai falar, ó, você cumpriu esse hábito tantas vezes. Você tá mais próximo do seu objetivo? Sim. Ou reajusta. Desenvolve essa ideia, faz pesquisa em analise do comportamento, paicologia, neuropsicologia, sobre como usar o método de todo dia rever o objetivo e analisar se ta cumprindo com as tarefas, de fazer pacotes mensaos, semestrais de metas parciais..

Instrução de processo do dono: "é uma mudança muito importante para nosso objetivo, então essa sessão deverá usar a squad_alpha na análise e me fazer todas as perguntas que precisar para traçarmos um ótimo plano antes de começar a execução."

## 2. Resposta do ChatGPT (colada pelo dono; o trecho começa na seção 1.5)

### 1.5. Formação de hábitos: não prometer transformações em 21 dias

Uma revisão sistemática e meta-análise publicada em 2024 analisou 20 estudos e 2.601 participantes. Os resultados mostram uma variação considerável no tempo de formação de hábitos:

- Medianas próximas de 59 a 66 dias nos estudos que mediram esse tempo.
- Médias entre 106 e 154 dias em alguns estudos.
- Variação individual muito grande, de poucos dias a vários meses.

A frequência, a estabilidade do contexto, a escolha pessoal do comportamento e o prazer associado à atividade influenciam a formação do hábito.

Aplicação: nossos ciclos mensais e semestrais fazem sentido, mas precisamos distinguir três coisas:

- Repetição: quantas vezes a pessoa realizou a atividade.
- Consistência: com que regularidade conseguiu realizá-la.
- Automaticidade: quanto o comportamento passou a acontecer sem exigir tanto esforço consciente.

Um usuário pode completar um hábito 30 vezes e ainda não tê-lo automatizado. Não devemos confundir frequência com consolidação comportamental. (Fonte citada: PubMed Central.)

### 1.6. Neuropsicologia e funções executivas

Planejar uma ação futura envolve processos como:

- Memória prospectiva: lembrar de executar algo no momento adequado.
- Controle inibitório: resistir a distrações e respostas concorrentes.
- Memória de trabalho: manter a intenção ativa enquanto realizamos outras atividades.
- Flexibilidade cognitiva: adaptar o plano quando as condições mudam.

É por isso que uma intenção abstrata como "vou estudar todos os dias" é frágil. O usuário precisa de pistas contextuais, ações pequenas e planos alternativos.

O estudo de intenções de implementação de Gollwitzer e Sheeran é especialmente relevante aqui: os planos no formato "quando X acontecer, farei Y" ajudam a transformar uma intenção em uma resposta mais acessível diante da situação correspondente. (Fonte citada: DOI.)

Minha recomendação é que o Soulmon não seja apenas um lembrete de metas. Ele deve funcionar como uma estrutura externa de apoio à autorregulação.

## 2. A arquitetura psicológica que proponho

Vamos separar o sistema em quatro escalas temporais.

#### O ciclo de evolução do Soulmon

1. Diariamente: lembrar e agir. Relembrar o propósito de forma breve, executar as tarefas e registrar comportamentos. (Ação)
2. Semanalmente: observar padrões. Identificar consistência, obstáculos e pequenas vitórias. Ajustar a estratégia quando necessário. (Consciência)
3. Mensalmente: avaliar resultados. Revisar os hábitos, avaliar a aproximação do objetivo anual e estabelecer a próxima meta parcial. (Recalibração)
4. Semestralmente: avaliar transformação. Verificar se o usuário está no caminho desejado, se as prioridades continuam válidas e se a direção precisa mudar. (Direção)

Uma distinção essencial: não precisamos pedir que o usuário faça uma reflexão profunda quatro vezes ao dia. Isso pode transformar uma ferramenta de apoio em mais uma obrigação.

O objetivo anual deve permanecer acessível diariamente, mas a reflexão deve ter profundidade proporcional ao intervalo.

## 3. Onboarding: estabelecer o destino antes de escolher os hábitos

Esta é a parte que eu trataria com maior cuidado de UX.

Quero que o usuário tenha a sensação de que está estabelecendo um compromisso consigo mesmo, não preenchendo um formulário de cadastro.

**ETAPA 01 · O DESTINO**

# Um ano a partir de agora...

## Onde você quer estar?

Imagine que um ano se passou. Você olha para sua vida e percebe que algo importante mudou.

O que aconteceu? O que você conquistou? Quem você se tornou?

Não precisa ser perfeito. Escreva o que realmente importa para você.

[Registrar meu objetivo]

Decisão de UX: não começar perguntando sobre dinheiro, saúde, carreira ou relacionamentos. Isso direcionaria a resposta. A pergunta precisa ser aberta.

Podemos oferecer exemplos secundários, sem transformá-los em respostas pré-selecionadas:

- Quero conquistar independência financeira.
- Quero mudar de carreira.
- Quero desenvolver meu corpo e minha saúde.
- Quero construir algo de que me orgulho.
- Quero aprender uma nova habilidade.
- Quero ter mais tempo para minha família.
- Quero recuperar minha confiança.
- Quero viver com mais tranquilidade.

Mas o campo de texto deve ser o protagonista.

### Etapa 02. A motivação principal

Aqui temos que diferenciar o objetivo da razão pela qual ele importa.

Por exemplo:

- Objetivo: conseguir uma oportunidade profissional no exterior.
- Motivação: proporcionar uma vida melhor para meus filhos.

São coisas diferentes, e essa diferença será muito valiosa nas revisões futuras.

**ETAPA 02 · A MOTIVAÇÃO**

# Por que isso importa para você?

Todo grande objetivo tem algo por trás dele. O que faz você querer chegar lá?

- Minha família e as pessoas que amo
- Minha liberdade e independência
- Minha saúde e bem-estar
- Meu desejo de aprender e evoluir
- Minha segurança financeira
- Meu sonho de construir algo importante
- Quero provar para mim mesmo que sou capaz
- Quero superar uma fase difícil
- Quero encontrar meu propósito
- Quero ter mais controle sobre minha própria vida
- Quero contribuir com outras pessoas
- Outro motivo

[Escolher minha motivação]

Eu acrescentaria uma pergunta opcional, mas muito poderosa:

"Se você pudesse guardar uma frase para os dias difíceis, qual seria?"

Isso permite que o próprio usuário escreva uma espécie de lema pessoal. O Soulmon poderá recuperá-lo em momentos apropriados, sem recorrer a mensagens motivacionais genéricas.

A motivação deve poder ser alterada posteriormente. Pessoas mudam, prioridades mudam e o produto precisa respeitar isso.

### Etapa 03. Transformar o destino em comportamentos

Agora chegamos à sua ideia original: antes de escolher os hábitos, o usuário precisa entender por que está escolhendo cada um.

**ETAPA 03 · A JORNADA**

# O que você precisa fazer para chegar lá?

Seu objetivo é: Quero conquistar uma oportunidade profissional no exterior.

Quais atividades podem aproximar você desse objetivo?

Exemplo ilustrativo de seleção de tarefas:

- Estudar inglês
- Estudar francês
- Desenvolver meu portfólio
- Pesquisar oportunidades de emprego
- Fazer exercícios físicos
- Estudar uma nova habilidade

As tarefas reais devem vir da biblioteca já existente no Soulmon. O usuário também poderá criar novas.

[Continuar com minhas tarefas]

Aqui há uma recomendação importante: não devemos presumir que todas as tarefas selecionadas contribuirão igualmente para o objetivo.

Precisamos estabelecer uma relação entre objetivo e comportamento.

Cada tarefa deverá poder ser associada a um ou mais objetivos. Isso permitirá que, futuramente, o Soulmon mostre quais atividades estão contribuindo para cada dimensão da evolução do usuário.

Uma melhoria adicional: pedir que o usuário identifique quais são as três atividades mais importantes. Assim, podemos evitar que ele crie uma lista enorme de hábitos sem capacidade real de mantê-los.

### Etapa 04. Identificar obstáculos

Esta etapa pode ser breve e opcional no primeiro onboarding.

Pergunta: "Qual é a maior dificuldade que pode impedir você de seguir esse caminho?"

Opções sugeridas:

- Falta de tempo.
- Falta de energia.
- Distrações.
- Dificuldade de manter consistência.
- Falta de recursos financeiros.
- Não saber por onde começar.
- Medo de fracassar.
- Outros compromissos e responsabilidades.
- Outro.

Depois: "Quando isso acontecer, o que você poderia fazer?"

Aqui introduzimos o planejamento do tipo se-então.

Exemplo: "Se eu não conseguir estudar por 30 minutos, farei pelo menos 5 minutos."

Essa é uma forma de preservar a continuidade sem exigir condições perfeitas.

## 4. Como funcionará o acompanhamento diário

Aqui precisamos fazer uma escolha cuidadosa.

Você propôs que o usuário reveja o objetivo todos os dias. Concordo com a intenção, mas faria uma distinção entre lembrar diariamente e refletir diariamente.

Uma reflexão profunda todos os dias pode virar fadiga. O usuário abre o Soulmon para organizar a vida e acaba recebendo mais uma obrigação.

Minha proposta:

**CHECK-IN DIÁRIO**

# Lembre-se do que está construindo.

Seu objetivo: conquistar independência financeira e construir uma vida melhor.

Sua motivação: minha família.

Hoje, qual será seu próximo passo?

- Executar as tarefas planejadas.
- Revisar as prioridades do dia.
- Escolher uma pequena ação para avançar.

A mensagem pode aparecer no início da sessão ou no horário escolhido pelo usuário. Não precisa ser uma notificação diária obrigatória.

O usuário deve conseguir acessar seu objetivo sempre que quiser, mas não precisamos interromper sua rotina para obrigá-lo a contemplá-lo.

### O registro de comportamento

Cada hábito precisa registrar:

- Quantas vezes foi realizado.
- Quantas oportunidades de realização existiram.
- Se foi realizado integralmente ou parcialmente.
- Em qual contexto aconteceu.
- Se houve algum obstáculo relevante.

Por exemplo:

| Hábito | Realizações | Oportunidades |
|---|---|---|
| Estudar inglês | 18 | 22 |
| Exercitar-se | 12 | 16 |
| Trabalhar no portfólio | 8 | 10 |

Isso permite calcular a adesão sem confundir quantidade absoluta com consistência.

Adesão = Realizações / Oportunidades × 100

E aqui entra um conceito da análise do comportamento: o registro precisa descrever o comportamento, não julgar a pessoa.

Não queremos mensagens como "Você falhou 4 vezes".

Queremos: "Você conseguiu realizar essa atividade em 18 das 22 oportunidades. Nas outras quatro, o que aconteceu?"

O Soulmon deve ajudar a identificar antecedentes, comportamentos e consequências:

- Antecedente: o que estava acontecendo antes?
- Comportamento: o que a pessoa fez ou deixou de fazer?
- Consequência: o que aconteceu depois?

Isso pode revelar padrões úteis. Talvez o usuário não consiga estudar à noite porque está cansado. Talvez consiga fazer exercícios quando os deixa preparados pela manhã.

O problema pode não ser motivação. Pode ser o desenho da rotina.

## 5. Revisão semanal: descobrir o que está funcionando

A revisão semanal deve ser curta, de aproximadamente um a dois minutos.

Não é uma avaliação de desempenho. É uma oportunidade de observar padrões.

Perguntas:

1. Qual hábito foi mais fácil de manter?
2. Qual foi mais difícil?
3. O que mais atrapalhou você?
4. Existe alguma coisa que podemos mudar na próxima semana?

O sistema pode gerar observações automaticamente:

- Você realiza mais atividades pela manhã.
- Sua consistência caiu nos finais de semana.
- Você está conseguindo manter os hábitos pequenos, mas está tendo dificuldade com atividades longas.

Essas observações precisam ser baseadas em registros suficientes. Não devemos inventar padrões a partir de dois ou três eventos.

Uma funcionalidade interessante: o Soulmon pode sugerir ajustes comportamentais.

Exemplo: "Você planejou estudar 40 minutos, mas normalmente consegue reservar apenas 15. Quer experimentar uma meta de 15 minutos nesta semana?"

Isso preserva o objetivo e modifica a estratégia.

## 6. Revisão mensal: o coração do sistema

Esta será a experiência mais importante depois do onboarding.

Eu criaria uma cerimônia mensal de evolução, com identidade visual própria dentro do Soulmon.

Nome provisório: Monthly Soul Review.

**MONTHLY SOUL REVIEW**

# Seu primeiro ciclo está completo.

Você está construindo algo. Vamos observar o que mudou.

- 18/22 — Estudos realizados
- 82% — Adesão ao hábito
- 12 — Dias de exercício
- 8 — Sessões no portfólio

Seu objetivo anual: Conquistar uma oportunidade profissional no exterior.

Sua motivação principal: Minha família.

Você sente que está mais próximo do seu objetivo?

- Sim, estou avançando.
- Um pouco, mas preciso ajustar algumas coisas.
- Não, preciso mudar minha estratégia.
- Ainda não consigo perceber.

O que você percebeu neste mês?

[Concluir minha revisão]

### A sequência da revisão mensal

Eu dividiria em cinco momentos:

1. Evidências: mostrar os dados reais de execução dos hábitos e tarefas.
2. Percepção: perguntar se o usuário sente que está se aproximando do objetivo.
3. Obstáculos: identificar o que dificultou a realização das atividades.
4. Recalibração: permitir três possibilidades: manter o plano; ajustar os hábitos; alterar o objetivo ou sua estratégia.
5. Próximo ciclo: estabelecer uma meta parcial para o mês seguinte.

### Uma distinção muito importante

Não devemos usar a percepção subjetiva como única medida de progresso.

Imagine que o usuário estudou inglês por 30 dias, mas ainda não consegue conversar fluentemente.

Ele pode sentir que não avançou, embora tenha desenvolvido uma competência importante.

Por isso, devemos mostrar duas dimensões:

| Dimensão | O que mede |
|---|---|
| Progresso comportamental | O que ele efetivamente fez |
| Progresso percebido | Como ele avalia sua aproximação do objetivo |

Se possível, adicionamos indicadores objetivos de resultado, como nível de idioma, entregas do portfólio, dinheiro economizado ou outras evidências específicas.

Assim evitamos que uma percepção momentânea apague um mês inteiro de trabalho.

## 7. Ciclos de metas mensais e semestrais

Aqui eu faria uma hierarquia.

#### A estrutura temporal

- Objetivo anual (12 meses): o destino principal. O que quero conquistar ou transformar.
- Marco semestral (6 meses): uma transformação intermediária. O que precisa estar diferente daqui a seis meses para que eu esteja no caminho certo?
- Metas mensais (30 dias): entregas concretas. Quais resultados menores demonstram que estou avançando?
- Hábitos e tarefas (diariamente): comportamentos executáveis. O que faço hoje para contribuir com o resultado?

### Exemplo prático

Objetivo anual: conseguir uma oportunidade de trabalho internacional.

| Período | Meta parcial |
|---|---|
| Mês 1 | Definir posicionamento profissional |
| Mês 2 | Finalizar dois projetos do portfólio |
| Mês 3 | Publicar o portfólio em inglês |
| Mês 4 | Atualizar currículo e LinkedIn |
| Mês 5 | Iniciar candidaturas |
| Mês 6 | Ter um processo consistente de candidaturas e entrevistas |

Marco semestral: estar preparado para disputar oportunidades internacionais e já ter iniciado candidaturas.

No segundo semestre, o usuário poderá trabalhar em entrevistas, networking, qualificação e processos seletivos.

Mas atenção: nem todo objetivo é previsível em seis meses. Alguns dependem de terceiros, oportunidades e condições externas. Portanto, precisamos distinguir metas controláveis, como publicar um portfólio, de resultados parcialmente controláveis, como conseguir uma contratação.

O Soulmon deve medir o esforço e o progresso sem prometer que a execução garante o resultado.

### O que acontece a cada semestre?

A revisão semestral deve ser mais profunda que a mensal.

Perguntas:

- Meu objetivo ainda representa aquilo que quero?
- O que mudou na minha vida?
- Quais conquistas demonstram minha evolução?
- Quais hábitos realmente contribuíram?
- Quais atividades se tornaram desnecessárias?
- O que preciso aprender ou desenvolver?
- Quero manter, ampliar ou substituir meu objetivo?

A revisão semestral também pode recalcular os próximos seis meses.

## 8. A motivação como elemento vivo do Soulmon

Essa parte eu considero uma oportunidade muito interessante para a identidade do jogo.

A motivação escolhida no onboarding não deve ficar guardada em um banco de dados sem função.

Ela pode aparecer em momentos estratégicos.

| Momento | Uso da motivação |
|---|---|
| Início da sessão | Relembrar o objetivo e a razão principal |
| Conclusão de um marco | Relacionar a conquista à motivação |
| Semana difícil | Recuperar a frase pessoal do usuário |
| Revisão mensal | Perguntar se a motivação continua válida |
| Revisão semestral | Reavaliar prioridades e significado |

Exemplo: o usuário escolheu como motivação principal: minha família.

Depois de concluir um marco: "Você dedicou 18 dias ao desenvolvimento de uma habilidade que pode abrir novas oportunidades para sua família."

Isso é muito mais significativo que simplesmente dizer que ganhou 200 bits.

Mas existe uma salvaguarda: não usar familiares, filhos, culpa ou medo como instrumentos de pressão. A motivação deve ser uma fonte de significado, não uma arma emocional.

Também devemos permitir que o usuário escolha não receber mensagens motivacionais em determinados momentos.

## 9. Como conectar isso à evolução dos Soulmons

Agora chegamos à parte em que a psicologia encontra a identidade do produto.

O Soulmon não precisa evoluir apenas porque o usuário completou tarefas.

Ele pode representar diferentes dimensões do desenvolvimento pessoal.

Minha proposta é separar três sistemas:

- Progressão: XP, níveis, evolução, bits e recompensas. Feedback imediato sobre ações e conquistas.
- Desenvolvimento: competências, consistência, hábitos e metas parciais. Evidências de desenvolvimento ao longo do tempo.
- Propósito: objetivo anual, motivação e revisões. Direção que conecta todas as atividades.

O ponto fundamental: não devemos punir a evolução do Soulmon porque o usuário não conseguiu cumprir um hábito.

A progressão do jogo deve recompensar comportamentos e conquistas, mas a revisão do propósito deve ajudar a compreender o que está acontecendo.

Podemos até criar uma mecânica de evolução baseada em marcos mensais e semestrais, sem exigir perfeição.

Por exemplo, o usuário pode desbloquear uma aparência, uma memória ou um fragmento de história ao completar uma revisão e registrar um aprendizado importante.

O prêmio não seria por ter sido perfeito. Seria por ter participado conscientemente do próprio processo de evolução.

## 10. Arquitetura de dados recomendada

Para implementar isso corretamente, precisamos tratar objetivo, motivação, metas e hábitos como entidades relacionadas.

| Entidade | Campos principais |
|---|---|
| Annual Goal | ID, usuário, descrição, início, prazo, status |
| Motivation | ID, categoria, texto personalizado, principal |
| Milestone | ID, objetivo, período, descrição, critério de conclusão |
| Habit | ID, descrição, frequência, contexto, objetivo relacionado |
| Task | ID, descrição, prioridade, objetivo relacionado |
| Behavior Log | ID, hábito, data, realização, contexto |
| Goal Review | ID, período, percepção, obstáculos, ajustes |
| Action Plan | ID, situação, resposta planejada |

### Relações (diagrama mermaid, transcrito)

USER defines ANNUAL_GOAL; USER has MOTIVATION; ANNUAL_GOAL divided_into MILESTONE; ANNUAL_GOAL supported_by HABIT; ANNUAL_GOAL supported_by TASK; HABIT records BEHAVIOR_LOG; ANNUAL_GOAL evaluated_by GOAL_REVIEW; HABIT reviewed_in GOAL_REVIEW; HABIT guided_by ACTION_PLAN.

Algumas decisões técnicas:

- Permitir vários objetivos históricos, mas um objetivo anual principal ativo.
- Permitir várias motivações associadas, com uma marcada como principal.
- Preservar o histórico de metas alteradas.
- Não apagar registros quando um hábito for desativado.
- Registrar quando uma revisão foi realizada.
- Separar a frequência planejada da frequência efetivamente realizada.
- Permitir que tarefas contribuam para mais de um objetivo.

Isso também permitirá relatórios históricos e análises de evolução.

## 11. Métricas para saber se a funcionalidade funciona

Não basta medir quantas pessoas preencheram o onboarding.

Precisamos saber se o sistema realmente ajuda a transformar intenção em comportamento.

| Indicador | O que queremos descobrir |
|---|---|
| Goal completion | Quantos usuários definem um objetivo |
| Habit adoption | Quantos selecionam hábitos associados |
| Habit adherence | Frequência de execução |
| Review completion | Quantos concluem revisões mensais |
| Goal adjustment | Quantos fazem ajustes conscientes |
| Goal progress perception | Como percebem sua evolução |
| Retention | Se continuam usando o Soulmon |
| Self-efficacy | Se sentem maior capacidade de realizar suas metas |

Eu adicionaria uma métrica especialmente interessante:

Goal-Habit Alignment: percentual de hábitos ativos associados a pelo menos um objetivo.

Isso ajuda a descobrir se o usuário está executando tarefas aleatórias ou construindo uma rotina conectada ao que deseja alcançar.

Também podemos acompanhar se a revisão mensal melhora a consistência no mês seguinte, comparando períodos anteriores e posteriores à revisão. Isso não provaria causalidade sozinho, mas seria um bom indicador inicial.

## 12. O que devemos evitar

Existem alguns riscos de design que quero deixar registrados.

| Risco | Solução |
|---|---|
| Excesso de tarefas no onboarding | Limitar recomendações e destacar prioridades |
| Reflexão diária cansativa | Check-in breve, reflexão profunda mensal |
| Culpa por não cumprir hábitos | Feedback descritivo, sem julgamento |
| Objetivos irreais | Dividir em marcos menores |
| Dependência de notificações | Incentivar pistas contextuais e autonomia |
| Motivação artificial | Usar a linguagem escrita pelo próprio usuário |
| Recompensas substituírem o propósito | Separar progressão do jogo de progresso pessoal |
| Objetivos externos incontroláveis | Medir também comportamentos controláveis |

Um ponto especialmente importante: recompensas externas podem ajudar no engajamento, mas não devem ser a única razão para realizar os comportamentos. A literatura sobre autodeterminação sugere que motivação autônoma e percepção de competência são mecanismos relevantes nas mudanças comportamentais. (Fonte citada: PubMed.)

## 13. Minha recomendação de implementação

Eu dividiria o desenvolvimento em três entregas.

**FASE 1 · ESSENCIAL — Objetivo e motivação no onboarding**

- Pergunta sobre o futuro em um ano.
- Seleção de uma motivação principal.
- Campo de motivação personalizada.
- Associação das tarefas e hábitos ao objetivo.
- Objetivo e motivação visíveis no perfil.

**FASE 2 · ACOMPANHAMENTO — Ciclo de autorregulação**

- Lembrete contextual do objetivo.
- Registro de execução dos hábitos.
- Revisão semanal.
- Revisão mensal com percepção de progresso.
- Ajustes de frequência e dificuldade.

**FASE 3 · EVOLUÇÃO — Metas e planejamento de longo prazo**

- Marcos semestrais.
- Metas mensais.
- Relatório de evolução.
- Comparação de ciclos.
- Revisão anual e definição do próximo objetivo.
- Integração com a evolução dos Soulmons.

### Referências científicas principais

Estas são as referências que eu usaria como base inicial do projeto:

1. Harkin et al. (2016). Does Monitoring Goal Progress Promote Goal Attainment? Psychological Bulletin. https://pubmed.ncbi.nlm.nih.gov/26479070/
2. Gollwitzer & Sheeran (2006). Implementation Intentions and Goal Achievement: A Meta-Analysis. Advances in Experimental Social Psychology. https://doi.org/10.1016/S0065-2601(06)38002-1
3. Wang, Wang & Gai (2021). A Meta-Analysis of the Effects of Mental Contrasting With Implementation Intentions on Goal Attainment. Frontiers in Psychology. https://pmc.ncbi.nlm.nih.gov/articles/PMC8149892/
4. Sheeran et al. (2020). Self-determination theory interventions for health behavior change. Journal of Consulting and Clinical Psychology. https://pubmed.ncbi.nlm.nih.gov/32437175/
5. Time to Form a Habit: A Systematic Review and Meta-Analysis of Health Behaviour Habit Formation and Its Determinants (2024). https://pmc.ncbi.nlm.nih.gov/articles/PMC11641623
6. Digital Behavior Change Intervention Designs for Habit Formation (2024). Journal of Medical Internet Research. https://www.jmir.org/2024/1/e54375/
7. Psychology of Planning (2025). Annual Review of Psychology. https://doi.org/10.1146/annurev-psych-021524-110536

## 14. A decisão de produto que eu gostaria de fixar

Minha recomendação é que essa funcionalidade seja tratada como um dos pilares do Soulmon, e não como um módulo opcional de metas.

Eu resumiria sua filosofia assim:

# You are not just completing tasks. You are becoming someone.

Cada tarefa é uma ação. Cada hábito é uma repetição. Cada marco é uma evidência. Cada revisão é uma oportunidade de escolher novamente o caminho.

O Soulmon não existe para cobrar o que você deixou de fazer. Existe para ajudar você a construir aquilo que decidiu se tornar.

E há uma última ideia que considero particularmente forte: na revisão anual, o Soulmon não deveria perguntar apenas "Você conseguiu alcançar seu objetivo?".

Deveria perguntar também: "Olhando para quem você era há um ano, o que mudou em você?"

Porque talvez o usuário não tenha conseguido exatamente aquilo que imaginava. Mas pode ter desenvolvido competências, autonomia, disciplina e confiança que antes não possuía.

Essa também é evolução.

Minha sugestão para o próximo passo: transformar esta proposta em uma especificação funcional do módulo Purpose & Goals, com fluxos de onboarding, estados, regras de negócio, componentes de interface e critérios de aceite, preservando as mecânicas atuais de tarefas, hábitos e evolução do Soulmon.
