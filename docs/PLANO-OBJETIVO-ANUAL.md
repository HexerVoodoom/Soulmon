# Plano — Objetivo anual, motivação e revisões

Status: rascunho para aprovação do dono (12/11/2026). Insumos: `docs/design/OBJETIVO-ANUAL-INSUMOS.md`. Demanda: `docs/design/OBJETIVO-ANUAL-DEMANDA.md`. Ciência: `docs/design/OBJETIVO-ANUAL-CIENCIA.md`.

## 1. Decisões do dono (modais de 12/11)

| # | Tema | Decisão |
|---|---|---|
| Q1 | Escopo | Tudo numa entrega: onboarding, revisões diária, semanal, mensal e semestral, e metas parciais |
| Q2 | Objetivo | Lista de categorias + texto livre; as categorias são as **áreas que o onboarding já pergunta** |
| Q10 | Jogador existente | Modal único com "agora não"; depois disso fica no perfil |
| Q8 | Dados | No save sincronizado **e liberado para a IA do chat** (exige Política de Privacidade e Data Safety) |
| Q3 | Ritmo | A profundidade cresce com o intervalo: diária = 1 linha; semanal ≤60 s opcional; mensal no dia 1 com 2–3 min; semestral 5 min; revisão perdida não vira dívida |
| Q7 | Se-então | No onboarding, 1 tela pulável com chips |
| Q4 | Metas parciais | Dentro das revisões: meta do mês na mensal, marco de 6 meses na semestral |
| Q5 | Motivação aparece em | Home + revisões, falas do Soulmon (raras, nunca depois de falha, nunca como culpa) e chat com IA |
| Q9 | Versão | **Junto da beta12** (PR contra `feat/beta12`) |
| Q12 | Prêmio | Cosmético especial (aparência ou memória do Soulmon) por revisão semestral concluída, igual para qualquer resposta |
| Risco | Texto com sinal de ideação | Só não envia à IA (sem tela). Ver risco R6 |

## 2. Base científica (resumo; detalhes no doc de ciência)

- Intenção de implementação ("se X, faço Y") tem o efeito mais sólido da lista: Gollwitzer & Sheeran 2006, d≈0,65 (inflado). WOOP/MCII: g≈0,34, cerca de 0,24 corrigido (Wang 2021). Por isso o se-então fica no onboarding.
- Monitorar o progresso ajuda, mais quando é registrado (Harkin 2016, d≈0,40). Daí "feitas / oportunidades".
- Formação de hábito: mediana de 59–66 dias em 2 estudos e grande variação (4–335 dias; Singh 2024). Não prometer "21 dias". Perder um dia não atrapalha (Lally 2010).
- Maior risco num app de sequência: abandonar tudo depois de um lapso (efeito "what-the-hell"). Antídoto: linguagem descritiva, autocompaixão e "um dia fora não apaga o caminho".
- Revisão mensal no dia 1 aproveita o fresh start effect (Dai, Milkman & Riis 2014).
- SDT: motivação autônoma > controlada. A família pode ser a motivação, mas nunca é usada como pressão.

## 3. Fluxo do onboarding (novo trecho)

Ordem atual: conta → termos → nome → Ambra → oráculo → teste → **áreas de meta (GOAL_STEP)** → dificuldades → forças → ponto de partida → ovo.

Ordem nova (ids negativos novos, sem renumerar o rascunho):

1. **Áreas de meta** (existente, `GOAL_STEP`): continua como está. É a "lista de categorias".
2. **O destino (novo, `YEAR_GOAL_STEP`)**: "Daqui a um ano, onde você quer estar?" Mostra as áreas escolhidas como contexto e um campo de texto (até 200 caracteres) com exemplos tocáveis por área que só preenchem o campo. Obrigatório ter texto (≥3 caracteres) ou tocar "pular por agora".
3. **A motivação (novo, `MOTIVE_STEP`)**: "Por que isso importa pra você?" Tem 11 chips autônomos + "outro motivo" (texto), com 1 principal. Abaixo, opcional: "uma frase pra guardar pros dias difíceis" (até 120 caracteres).
4. **O obstáculo (novo, `PLAN_STEP`, pulável)**: chips do maior obstáculo + "quando isso acontecer, eu…" com sugestões ("faço só 5 minutos", "faço amanhã cedo", "peço ajuda") ou texto.
5. **Dificuldades / forças** (existentes) e depois **ponto de partida** (existente), com título novo: "Pra chegar lá, o que você vai fazer?". O objetivo aparece no topo. A pessoa escolhe as atividades do catálogo como hoje e **marca até 3 como prioridade** (estrela).
6. Ovo → criatura (sem mudança).

Jogador existente: um modal único ao abrir o app, com os passos 2–4 e mais a escolha das 3 prioridades entre os hábitos que ele já tem, e "agora não". Fica sempre acessível em Perfil → "Meu objetivo".

## 4. Revisões

| Revisão | Quando | Conteúdo | Saída |
|---|---|---|---|
| Diária | sempre | Linha do objetivo na Home (toque abre "Meu objetivo") | nenhuma pergunta |
| Semanal | domingo, dentro do `WeeklyReportCard` existente | "X de Y" por hábito prioritário + 1 pergunta opcional "o que mais atrapalhou?" (chips) | registro de obstáculo |
| Mensal | a partir do dia 1, card na Home até concluir ou dispensar (some no dia 8) | 1) evidências: feitas/oportunidades por hábito e totais; 2) "Você sente que está mais perto?" (4 opções); 3) obstáculos; 4) manter / ajustar hábitos / mudar objetivo; 5) meta do próximo mês (opcional) + marcar a meta anterior como feita, parcial ou não | `GoalReview` |
| Semestral | 6 meses depois de definir o objetivo | revisão mensal + "o objetivo ainda é o que você quer?", "o que mudou em você?", marco dos próximos 6 meses | `GoalReview` + **cosmético especial** |
| Anual | 12 meses | "Olhando quem você era há um ano, o que mudou?" e novo objetivo | arquivo do objetivo |

Regras: revisão perdida não acumula; o card some e volta no próximo ciclo. Nenhuma revisão bloqueia o app. Toda linguagem é descritiva ("18 de 22. Nas outras 4, o que aconteceu?"), nunca "você falhou".

## 5. Motivação viva

- **Home**: linha do objetivo (o texto do jogador, sem retoque).
- **Falas do Soulmon** (local, `petVoice`): no máximo 1 por semana, só em momento positivo (meta batida, revisão concluída, marco de constância). Usa a categoria da motivação, não o texto livre. Nunca depois de dia ruim. Interruptor em Configurações: "Soulmon pode lembrar meu porquê".
- **Chat com IA (beta12)**: objetivo, motivação, frase e plano entram no system prompt como DADO delimitado (mesmo padrão de `customKeywords`), redigidos pelo filtro `_redact`. Se o detector de risco local marcar o texto, ele não é enviado.
- **Frase dos dias difíceis**: aparece quando o jogador abre "Meu objetivo" e, no chat, só se ele pedir.

## 6. Dados (novos campos no `GameState`, sincronizam pelo save)

```
purpose?: {
  goal: { text, areas[], createdAt, status: 'active'|'archived' } ,
  history: Goal[]                       // objetivos anteriores
  motive: { key, customText?, phrase? }, motiveHistory[]
  plan?: { obstacleKey, obstacleText?, response }
  priorities: activityId[]              // até 3
  milestones: { id, period:'month'|'semester', label, status:'open'|'done'|'partial'|'not', createdAt }[]
  reviews: { id, kind:'week'|'month'|'semester'|'year', at, perceived?, obstacles[], decision?, note? }[]
  monthlyAgg: { [YYYY-MM]: { [activityId]: { done, due } } }   // fecha o teto de 120 dias
  prefs: { voiceReminder: boolean }
  promptedExisting?: boolean
}
```

- `monthlyAgg` é calculado a partir de `habitRhythms` no fechamento de cada mês, para revisões semestrais e anuais.
- Sanitização no load (`GameStateContext`) e limite de tamanho no `save.js`.
- Nada de texto livre na telemetria; só eventos anônimos (passo concluído/pulado, revisão concluída, decisão).

## 7. Itens de entrega e critérios de aceite

| Item | Critério de aceite |
|---|---|
| E1 Onboarding: destino, motivação, plano | Novos passos depois das áreas; voltar e avançar funcionam; o rascunho sobrevive a fechar o app; pular não quebra; dados vão para `purpose` |
| E2 Prioridades | No ponto de partida, marca até 3 com estrela; uma 4ª mostra aviso; prioridades salvas |
| E3 Jogador existente | O modal aparece 1 vez; "agora não" não volta a aparecer; acessível no Perfil |
| E4 Meu objetivo (Perfil) | Mostra e edita objetivo, motivação, frase, plano e prioridades; editar guarda histórico |
| E5 Linha na Home | Objetivo visível em 1 linha; toque abre "Meu objetivo"; some se não houver objetivo |
| E6 Semanal | Domingo, dentro do relatório semanal: X de Y das prioridades + pergunta opcional |
| E7 Mensal | Card do dia 1 ao 7; 5 passos; grava `GoalReview` e a meta do mês; linguagem sem julgamento (teste de palavras proibidas) |
| E8 Semestral + cosmético | Aos 6 meses; marco; concede o cosmético 1 vez por semestre, para qualquer resposta |
| E9 Anual | Aos 12 meses; arquiva e permite um novo objetivo |
| E10 Agregado mensal | `monthlyAgg` correto em virada de mês, fuso BRT e hábito pausado |
| E11 Falas do Soulmon | Máx. 1/semana, só em gatilho positivo, desligável, nunca depois de dia ruim |
| E12 Chat IA | Bloco de propósito no prompt, redigido, sem envio quando há risco; política e Data Safety atualizadas |
| E13 PT/EN | Todos os textos nos dois idiomas, conforme o glossário |
| E14 Testes | Unitários (agregado, revisões, gatilhos, sanitização) + render dos passos; `npm test` com "Test Files" verde |

## 8. Riscos

- **R1 Onboarding mais longo** (3 telas a mais): todas puláveis; medir o abandono por passo.
- **R2 Beta12 maior**: o PR vai contra `feat/beta12`; coordenar com a sessão beta12 porque ambos mexem no onboarding e na personalidade/chat.
- **R3 IA com texto pessoal**: exige Política de Privacidade e Data Safety antes do release (isso é do dono na Play Console).
- **R4 Culpa**: teste automático de palavras proibidas nos textos novos; a motivação nunca aparece depois de falha.
- **R5 Revisão vira obrigação**: nenhuma bloqueia; nenhuma acumula.
- **R6 Sinal de risco sem tela de ajuda**: o dono escolheu só não enviar à IA. A squad recomenda ao menos reaproveitar o aviso do Caderno (CVV 188), já existente. **Ponto de decisão final.**
- **R7 Cosmético**: precisa de arte (fila de assets) e não pode virar prêmio por resultado.

## 8b. Correções da revisão crítica (alpha-skeptic)

1. **Agregado mensal (crítico):** o app só calcula quando é aberto, e `habitRhythms` guarda no máximo 120 dias e só os dias feitos. Por isso: a partir de agora, gravar todo dia `done` e `due`; no load, fechar retroativamente todo mês sem registro (`due` vem da agenda e das pausas). Teste: "app fechado 150 dias".
2. **Dia:** uma fonte única, a data local do aparelho (a mesma de `habitRhythm`). A virada de mês e o domingo da semanal são testados nela.
3. **Chat:** cada campo tem teto próprio, igual ao do formulário (objetivo 200, frase 120), sem o corte de 120 de `customKeywords`.
4. **Detector de risco:** roda no servidor, logo antes de montar o prompt, a cada envio (o texto pode ter sido editado em outro aparelho). Teste de "não envia".
5. **Âncora do semestre:** `purpose.firstCreatedAt` não muda quando o objetivo muda. O cosmético tem id de concessão idempotente (1 por semestre de calendário do propósito).
6. **Beta12:** rebase sobre `feat/beta12` antes do passo 2; combinar com a sessão beta12 os ids novos de passo do onboarding e o bloco do `chat.js`.
7. **Funil:** registrar o baseline atual de abandono do onboarding antes de soltar. Gatilho: se um passo novo passar de +10 pontos de abandono, ele vira opcional ou sai.

## 9. Ordem de execução (depois da aprovação)

1. Modelo `purpose` + sanitização + agregado mensal (E10), com testes.
2. Onboarding E1–E2 + jogador existente E3.
3. "Meu objetivo" E4 + linha na Home E5.
4. Revisões E6–E9.
5. Falas E11 + chat E12.
6. Textos PT/EN, QA e fiscal; PR contra `feat/beta12`, sem merge até o dono testar.
