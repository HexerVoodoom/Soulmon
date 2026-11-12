# Objetivo anual + motivação + revisões — Registro de Demanda (rascunho v0)

Status: **v0, NÃO congelado**. Vira v1 quando o lote de perguntas Q1–Q12 tiver resposta registrada (pergunta + resposta). Fonte: `docs/design/OBJETIVO-ANUAL-INSUMOS.md` (§1 = dono, §2 = ChatGPT).

Origem dos itens:
- **DONO**: tem trecho do pedido de voz (§1 dos insumos). Isso é pedido.
- **GPT**: só aparece na resposta do ChatGPT (§2). É **sugestão**: só vira escopo se o dono aprovar no modal.
- Critério marcado `proposto` = escrito pelo analista, o dono ainda não endossou.

## 1. Itens do dono

| ID | Tipo | Enunciado | Trecho-fonte | Critério de aceite (proposto) |
|---|---|---|---|---|
| D-01 | entrega | No onboarding, passo "onde você quer estar daqui a um ano?" **antes** da escolha de tarefas/hábitos | "no onboarding ... antes de definir as tarefas que ele quer pegar, os hábitos, eu quero que seja perguntado pro usuário qual o objetivo dele pra daqui um ano" | Dado save novo, quando o onboarding roda, então a tela do objetivo aparece antes da tela de tarefas (teste de ordem de passos); o texto fica salvo no save como objetivo ativo. |
| D-02 | entrega | Resposta do objetivo é texto livre escrito pelo usuário | "E aí ele vai escrever lá" / "Aí ele vai escolher. E esse vai ser o objetivo dele" | Campo de texto aceita e persiste o que foi digitado (recarregar o app mostra o mesmo texto). Ambíguo: "vai escolher" sugere também opções; ver Q2. |
| D-03 | entrega | Depois do objetivo, pergunta "pra que você cumpra isso, quais dessas tarefas você precisa fazer?" e cai na lista atual (escolher + criar) | "quais dessas tarefas você precisa fazer? E aí dá a lista ... e pra ele criar mais, que é o que já tem. Aí cai na parte que já tem" | A tela de tarefas existente é reutilizada (sem regressão dos testes atuais do onboarding) e o título/subtítulo cita o objetivo digitado. |
| D-04 | entrega | Pergunta "o que te motiva", com várias opções prontas + campo próprio; escolhe **uma** principal | "dá algumas opções, mas deixa ele, espaço pra ele pôr as próprias ... ele vai escolher uma motivação, a principal" | Tela com N≥8 opções + "Outro" com texto; seleção única; persiste `{categoria, texto}`. |
| D-05 | entrega | A motivação é **usada de tempo em tempo** | "E aí a gente vai usar isso de tempo em tempo" | Pelo menos uma superfície (definida em Q5) exibe a motivação do usuário; teste prova que o texto exibido vem do save, não é genérico. |
| D-06 | entrega | Revisão no fim do mês: "você cumpriu esse hábito tantas vezes" + "está mais próximo do objetivo? Sim / reajusta" | "no final do mês, vai falar, ó, você cumpriu esse hábito tantas vezes. Você tá mais próximo do seu objetivo? Sim. Ou reajusta." | Dado virada de mês com save que tem objetivo, quando abre o app, então aparece a revisão com contagem real por hábito (bate com o log) e as opções Sim/Reajustar; "Reajustar" leva a editar objetivo e/ou tarefas; resposta fica gravada com data. |
| D-07 | pesquisa | Desenvolver a ideia com pesquisa (análise do comportamento, psicologia, neuropsicologia) | "Desenvolve essa ideia, faz pesquisa em analise do comportamento, paicologia, neuropsicologia" | Doc de design com referências citadas e, para cada regra de produto, a evidência que a sustenta. Insumo do ChatGPT conta como ponto de partida, não como pesquisa concluída. |
| D-08 | entrega/pesquisa | Método de **rever o objetivo todo dia** e analisar se está cumprindo as tarefas | "como usar o método de todo dia rever o objetivo e analisar se ta cumprindo com as tarefas" | Forma depende de Q3 (lembrar × refletir diariamente). |
| D-09 | entrega/pesquisa | **Pacotes** de metas parciais mensais e semestrais | "de fazer pacotes mensaos, semestrais de metas parciais" | Forma e fase dependem de Q1/Q4. |
| D-10 | regra de processo | Tratar como prioridade alta e qualidade alta; squad_alpha na análise; todas as perguntas **antes** de executar | "muito importante, tem que ser muito bem feito"; "me fazer todas as perguntas que precisar ... antes de começar a execução" | Nenhum código antes do registro v1 congelado; fiscal-entrega audita contra este registro. |
| D-11 | implícito | Jogador que já passou do onboarding também precisa definir objetivo/motivação | implícito (a feature é "pilar"; saves atuais nunca veem o onboarding) | Depende de Q10. |

## 2. Sugestões do ChatGPT (não são pedido; entram só se aprovadas)

| ID | Sugestão | Seção insumo | Pergunta que decide |
|---|---|---|---|
| G-01 | Frase pessoal para dias difíceis (opcional) | §2 Etapa 02 | Q6 |
| G-02 | Exemplos de objetivo como dica, não pré-seleção | §3 Etapa 01 | Q2 |
| G-03 | Associar cada tarefa a um ou mais objetivos | §3 Etapa 03 | Q1 |
| G-04 | Marcar as 3 tarefas mais importantes | §3 Etapa 03 | Q1 |
| G-05 | Obstáculo + plano se-então | §3 Etapa 04 | Q7 |
| G-06 | Check-in diário curto (lembrar, não refletir) | §4 | Q3 |
| G-07 | Adesão = realizações/oportunidades; registro parcial e de contexto | §4 | Q11 |
| G-08 | Revisão semanal 1–2 min + observações automáticas | §5 | Q3 |
| G-09 | Revisão mensal em 5 momentos ("Monthly Soul Review") | §6 | Q3 |
| G-10 | Hierarquia objetivo → marco semestral → meta mensal | §7 | Q4 |
| G-11 | Revisão semestral profunda; revisão anual "o que mudou em você" | §7, §14 | Q3 |
| G-12 | Motivação em momentos-chave; salvaguarda anti-culpa; opt-out | §8 | Q5 |
| G-13 | Recompensa por fazer a revisão (memória/aparência/história), nunca punir evolução | §9 | Q12 |
| G-14 | Modelo de dados (8 entidades, histórico preservado) | §10 | Q8 |
| G-15 | Métricas de eficácia (incl. Goal-Habit Alignment) | §11 | Q9 |
| G-16 | Roadmap em 3 fases | §13 | Q1 |

## 3. Contexto relevante (curto)

- Precedente de "passo novo no onboarding + saves existentes": D-24 do pesadelo/sono resolveu com **onboarding + modal único até confirmar** (`Core/contextos/soulmon/demandas/2026-10-18-pesadelo-sono-hp-bosque.md` l.94/104).
- Dado novo que sai do aparelho exige `privacidade.html`, `PLAY-DATA-SAFETY.md` e `PRIVACY_VERSION` (`demandas/2026-10-19-grok-chat-beta.md` D-90). Objetivo/motivação são texto pessoal sensível.
- Dono prefere seguir a recomendada e só parar no que é dele (memória `autonomia-seguir-recomendada`); aqui ele pediu explicitamente perguntar antes — por isso o lote abaixo.

## 4. Suposições declaradas (ASSUMIR-E-DECLARAR / DEFAULT)

- S1: Textos de UI em PT com versão EN, como o resto do app (default do projeto).
- S2: Objetivo e motivação editáveis depois (Perfil/Configurações), com histórico, não apagando o anterior. Fonte: "Ou reajusta" (D-06) implica edição.
- S3: Nenhum feedback punitivo ("você falhou") nem perda de progresso do Soulmon por não cumprir hábito — coerente com a regra já vigente de noite sem registro neutra.
- S4: Identidade Soulmon nas telas novas (UI = categoria "USAR").

## 5. Lote de perguntas ao dono (para modal; recomendada primeiro)

Rodada 1 (bloqueantes: escopo e entrada)

**Q1. O que entra na primeira entrega?**
- (a) **Recomendada**: Onboarding (objetivo, motivação, tarefas ligadas ao objetivo) + objetivo visível no app + revisão mensal simples (contagem + "mais perto? sim/reajustar"). Motivo: é exatamente o que você descreveu; sobe rápido e mede uso antes de crescer.
- (b) Só onboarding + objetivo visível (fase 1 do ChatGPT). Efeito: revisão mensal fica para depois.
- (c) Tudo: diário, semanal, mensal, semestral e metas parciais. Efeito: entrega longa, risco alto.

**Q2. Objetivo: texto livre ou escolher de uma lista?**
- (a) **Recomendada**: Texto livre como protagonista, com exemplos clicáveis que só preenchem o campo para editar. Motivo: não direciona a resposta e cobre o "ele vai escolher".
- (b) Só texto livre, sem exemplos.
- (c) Lista de categorias + texto opcional. Efeito: mais fácil de medir, menos pessoal.

**Q10. Jogador que já passou do onboarding?**
- (a) **Recomendada**: Modal único na próxima abertura ("defina seu objetivo"), com "agora não" que volta depois de alguns dias. Motivo: mesmo padrão do horário de sono (D-24).
- (b) Só um cartão na Home/Perfil, sem modal.
- (c) Obrigatório, sem pular.

**Q8. Onde ficam objetivo, motivação e revisões?**
- (a) **Recomendada**: No save, sincronizado como o resto do save; nunca enviado para IA/terceiros; privacidade e Data Safety atualizados. Motivo: não some ao trocar de aparelho, e não cria nova finalidade de dado.
- (b) Só local no aparelho. Efeito: perde ao reinstalar; zero mudança de privacidade.
- (c) Sincronizado e também usado pelo chat de IA do Soulmon para falas personalizadas. Efeito: exige consentimento e política nova.

Rodada 2 (forma do acompanhamento)

**Q3. Ritmo das revisões?**
- (a) **Recomendada**: Diário só lembra (objetivo + motivação numa linha na Home, sem pergunta); mensal é a revisão principal; semanal e semestral ficam para a fase seguinte. Motivo: evita fadiga diária; a evidência pesa mais no ciclo mensal.
- (b) Diário lembra + semanal curta (1–2 min) + mensal agora; semestral depois.
- (c) Diário com pergunta "cumpriu hoje?" + mensal. Efeito: mais próximo do "todo dia rever", mais atrito.
- (d) Todas as quatro já na primeira entrega.

**Q4. Metas parciais (mensais/semestrais)?**
- (a) **Recomendada**: Na revisão mensal, o usuário escreve uma meta para o próximo mês (opcional); marco semestral só depois. Motivo: começa o "pacote" sem obrigar planejamento de 12 meses no dia 1.
- (b) Pacotes pré-montados por tipo de objetivo (sugestões do app).
- (c) Deixar metas parciais para uma fase posterior.

**Q5. Como a motivação é usada?**
- (a) **Recomendada**: Aparece na Home e na revisão mensal; o Soulmon cita ela em falas raras (marco atingido, depois de dias sem atividade), sem notificação nova; com opção de desligar. Motivo: significado sem pressão nem spam.
- (b) Também em notificação (uma por semana no máximo).
- (c) Só na revisão mensal.

**Q6. Frase pessoal para dias difíceis (sugestão ChatGPT)?**
- (a) **Recomendada**: Sim, opcional, no onboarding; o Soulmon mostra em semana fraca. Motivo: usa a voz do próprio usuário, barato de fazer.
- (b) Sim, mas só oferecida na primeira revisão mensal (onboarding mais curto).
- (c) Não.

Rodada 3 (complementos)

**Q7. Obstáculo + plano se-então?**
- (a) **Recomendada**: Fora do onboarding; entra na revisão mensal quando o usuário escolhe "reajustar". Motivo: onboarding já ganha 2–3 passos; se-então funciona melhor diante de obstáculo real.
- (b) Passo opcional no onboarding.
- (c) Não fazer.

**Q11. Métricas e o que mostrar ao usuário?**
- (a) **Recomendada**: Ao usuário: feitas / oportunidades por hábito, em linguagem descritiva. Internas (anônimas, agregadas): % que define objetivo, % que conclui revisão mensal, retenção 30d com × sem objetivo. Motivo: mede se a feature ajuda sem coletar o texto pessoal.
- (b) Só a contagem simples ("cumpriu X vezes"), sem métricas internas.
- (c) Conjunto completo do ChatGPT (incl. autoeficácia por questionário).

**Q9. Em qual versão entra?**
- (a) **Recomendada**: beta13, branch própria (`feat/objetivo-anual`). Motivo: beta12 já tem frente de widgets em curso; feature "pilar" merece ciclo próprio.
- (b) beta12, junto com widgets.
- (c) Partes: onboarding no beta12, revisão mensal no beta13.

**Q12. Revisão dá recompensa no jogo?**
- (a) **Recomendada**: Sim, pequena e por participar (não por resultado): ex. memória/fala nova do Soulmon. Motivo: reforça o ritual sem trocar propósito por prêmio.
- (b) Bits/XP comuns.
- (c) Nada.

## 6. Dúvidas para o fim (não bloqueantes)
- Nome da revisão mensal na UI (o "Monthly Soul Review" do ChatGPT é provisório).
- Copy exata das opções de motivação (ChatGPT listou 12; revisar com squad de texto).
- Revisão anual ("o que mudou em você") — só relevante daqui a 12 meses.

## 7. Pacote para o orquestrador
- Ordem: Q1, Q2, Q10, Q8 → Q3–Q6 → Q7, Q11, Q9, Q12. Após respostas, congelar v1.
- Donos sugeridos: D-07 pesquisa → alpha-requisitos/pesquisa; D-01..D-04, D-11 → front (onboarding); D-05/D-06 → front + game design; Q8 → conformidade; priorização de G-* → alpha-product-manager.
- Varredura final: todo trecho do §1 caiu em D-01..D-10; nada do ChatGPT foi promovido a pedido sem pergunta.
