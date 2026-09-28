# Revisão psicológica do catálogo de atividades (28/09/2026)

Revisor: `soulmon-behavioral-psychologist` (tem poder de veto). Foi uma revisão só de leitura, sem nenhuma edição de código.
Escopo: `src/data/activityCatalog.ts`, `src/utils/recommend.ts`, `src/utils/catalogLevel.ts`,
`docs/CATALOGO-EVIDENCIAS.md`, `docs/PLANO-CATALOGO-ATIVIDADES.md`.

> Declaração de limite: esta revisão não faz diagnóstico, e o Soulmon não é tratamento. O que
> aparece abaixo como "efeito esperado" é previsão, não medição. Ninguém usou o app em produção.

Legenda: **VETO** bloqueia o merge ou a exposição ao jogador até ser corrigido. **AJUSTE OBRIGATÓRIO**
precisa entrar antes da F4 (UI do catálogo). **SUGESTÃO** é opcional.

---

## Vetos

### V1. O recomendador pode pôr protocolos de TCC no starter set
- **Onde:** `recommendStarterSet` / `scoreItem` (`src/utils/recommend.ts`).
- **Por que:** quem marca a dificuldade `ansiedade` no onboarding dá +2 de pontuação a
  `mente-registro-pensamentos` e a `mente-exposicao-leve`, e os dois ainda ganham +1 por
  terem nível "A". Com isso, a pessoa que se declarou ansiosa recebe **exposição** como
  sugestão padrão no primeiro minuto de uso, sem ter pedido e sem triagem nenhuma. Pesquisei
  e não achei literatura que sustente oferecer exposição sem avaliação a um público que
  pode ter pânico, TEPT ou transtorno alimentar. O recomendador também **não filtra
  `contraindications`**, embora o plano (§3) diga "descarta contraindicados".
- **Correção exata:** acrescentar ao `CatalogItem` o campo `optInOnly?: boolean` e marcar
  `true` em `mente-registro-pensamentos` e `mente-exposicao-leve`. Em `recommendStarterSet`,
  filtrar antes de pontuar:
  `catalog.filter(i => !i.optInOnly)`. Esses dois itens aparecem só no navegador do
  catálogo, atrás de uma tela de aviso (A1). Colocar um teste determinístico no
  recomendador: o perfil `{areas:['mente'], struggles:['ansiedade','perfeccionismo'], strengths:['calma']}`
  nunca pode devolver nenhum item `optInOnly`.

### V2. Exposição e registro de pensamentos não podem custar coração
- **Onde:** a integração do catálogo com a meta diária (`dailyGoalFor` / o peso do item). O
  catálogo define `effort: 2` para a exposição.
- **Por que:** se o item entra na meta que protege o coração, **evitar a exposição
  faz a "alma" perder vida**. Isso transforma a evitação ansiosa, que é o próprio sintoma, em
  punição sobre a identidade. É o caso de vergonha em vez de culpa que o mandato
  manda tratar como risco central. A exposição só funciona quando é voluntária e
  quando a pessoa controla o ritmo. Exposição feita sob coerção aumenta a chance de a
  pessoa abandonar a prática e de o medo voltar [hipótese baseada no princípio de
  controle percebido; não há estudo específico sobre apps].
- **Correção exata:** os itens `optInOnly` da área mente entram com peso **0** em
  `registeredForDay` (não contam para a meta nem para o coração) e **não geram**
  `needsIntervention`, estado assombrado nem contador de adiamento. Concluir o item ainda dá
  recompensa (comida, XP). Guardar com um teste de contrato: rodar a virada do dia com o item
  não feito tem que dar o mesmo HP que rodar sem o item.

### V3. Fonte errada e perigosa na exposição
- **Onde:** `mente-exposicao-leve` › `evidence.refs` e a linha 40 de `CATALOGO-EVIDENCIAS.md`.
- **Por que:** o PMC 9735589 é Heo & Park 2022, uma meta-análise de **exposição em
  realidade virtual para TEPT**, conduzida por terapeuta. Ou seja, a fonte citada trata
  justamente da condição que o próprio item contraindica, e numa modalidade clínica. A
  outra referência ("Springer/BMC 2011") é vaga demais para alguém conferir.
- **Correção exata:** trocar para
  `['Haug et al. 2012 (Clinical Psychology Review) — self-help para transtornos de ansiedade, meta-análise', 'Domhardt et al. 2019 (Depression and Anxiety) — componentes de intervenções digitais para ansiedade']`
  e baixar o nível para **B**, com
  `note: 'Evidência A é de exposição conduzida ou guiada por terapeuta para transtorno; a autoajuda não guiada tem efeito menor e menor adesão, e aqui é extrapolada para evitações cotidianas.'`

---

## Ajustes obrigatórios

### A1. O aviso e o CVV têm que estar na UI, e hoje não estão em lugar nenhum
- **Onde:** nenhum componente lê `contraindications`. O grep em `src` mostra o campo só no
  dado e no tipo. O aviso sobre CVV existe só dentro do texto `why`, e só em PT.
- **Correção exata:** antes de adicionar qualquer item da área `mente`, mostrar um cartão
  fixo, que não se dispensa para sempre, com o texto:
  PT: "Isto é uma prática de autocuidado, não tratamento. Não substitui psicólogo ou psiquiatra. Se você está em sofrimento intenso ou pensando em se machucar, ligue 188 (CVV, 24h, gratuito) ou 192."
  EN: "This is a self-care practice, not treatment. It does not replace a psychologist or psychiatrist. If you are in intense distress or thinking of harming yourself, contact your local emergency number or a crisis line (e.g. 988 in the US)."
  Nos itens `optInOnly`, listar também as `contraindications` e só liberar o "Adicionar"
  depois de um toque em "Entendi". Reaproveitar o texto de crise de `src/utils/chatSafety.ts`
  para não existirem duas versões. Tirar o CVV do `why` (o `why` é a justificativa, não o
  aviso) e **pôr o equivalente em EN**. Hoje o `en` de `mente-exposicao-leve` e o de
  `mente-registro-pensamentos` não trazem nenhuma linha de crise.

### A2. O texto promete tratamento
- `mente-ativacao-comportamental.why`: "efeito grande sobre sintomas depressivos,
  comparável a terapia cognitiva" apresenta uma tarefa de checkbox como equivalente a
  terapia. **Trocar por** PT: "Programar pequenas atividades de que você gosta, ou que
  importam para você, é o núcleo da ativação comportamental, uma abordagem bem estudada
  para o humor (Cuijpers et al. 2007). Aqui é só uma prática leve." EN, no mesmo sentido.
- `mente-registro-pensamentos.why`: "melhora consistente vs. cuidado usual" vira PT
  "Anotar um pensamento e o que o confirma ou contradiz é uma técnica usada na TCC. Aqui
  é uma versão simples, de autocuidado."
- `mente-exposicao-leve.why`: tirar "tratamento de primeira linha". Usar PT "Aproximar-se
  aos poucos do que a gente evita costuma diminuir o medo com o tempo. Aqui é para
  evitações pequenas do dia a dia."
- Colocar em `narrativa.contract.test.ts` (ou num teste do catálogo) uma regra que reprove
  `/trat|cur[ae]|terapia|treat|cure|therapy/i` no `why` e no `target` dos itens
  `area:'mente'`, com exceção só para o nome técnico dentro de `evidence`.

### A3. Nível de evidência inflado na área mente
| Item | Hoje | Correto | Motivo verificado |
|---|---|---|---|
| `mente-registro-pensamentos` | A | **B** | A referência real é Ciharova et al. 2021, *J Consult Clin Psychol* 89(6):563-574 (45 estudos, n=3.382), e confirma o número. Mas os estudos avaliam reestruturação cognitiva **presencial e individual, com terapeuta**, contra lista de espera ou cuidado usual. Não sustenta um registro semanal feito sozinho. O `refs` tem que citar o artigo pelo nome e ganhar a `note` sobre essa extrapolação. |
| `mente-respiracao` | A | **B** | Balban 2023 é um único RCT remoto, n=108 (24 no controle), sem poder estatístico para mostrar superioridade entre os braços, e sem mudança na VFC. Um RCT pequeno não é nível A. |
| `mente-gratidao` | A | **B** | O RCT de 2003 existe, mas as meta-análises posteriores (Davis et al. 2016; Dickens 2017) mostram efeito pequeno, e perto de zero contra controle ativo. |
| `mente-autocompaixao` | B | B, com fonte trocada | Neff 2003 é o artigo **da escala**, não de uma intervenção. Citar Ferrari et al. 2019 (*Mindfulness*, meta-análise de intervenções de autocompaixão). |

Consequência: o +1 de `scoreItem` para nível A deixa de favorecer esses itens, e isso é o
correto.

### A4. Contraindicações que faltam
- `mente-respiracao`: `contraindications: []`. Acrescentar "se sentir tontura ou falta de
  ar, pare e respire normalmente" e "não usar como substituto de atendimento em crise de
  pânico recorrente".
- `mente-registro-pensamentos`: acrescentar "se escrever sobre o pensamento te deixa
  ruminando (voltando ao mesmo assunto por muito tempo), pare, e prefira uma atividade
  prazerosa" e "em TOC, checar pensamentos pode virar ritual; converse com um
  profissional". O risco é real: em depressão e TOC, registrar pensamentos sem guia pode
  alimentar ruminação ou reasseguramento [princípio: ruminação e neutralização,
  Nolen-Hoeksema 2000; Salkovskis 1985].
- `mente-exposicao-leve`: acrescentar "não usar para comida, corpo ou peso", porque
  exposição alimentar em transtorno alimentar é clínica.
- `mente-ativacao-comportamental`: acrescentar CVV/192 para ideação suicida (depressão é o
  público dessa técnica).
- `mente-gratidao`: acrescentar "se listar coisas boas num dia difícil te deixar culpado,
  pule, porque não é obrigação". Gratidão forçada em depressão pode virar mais uma prova de
  fracasso [hipótese].

### A5. A exposição sobe a frequência, mas o mecanismo dela é a gradação
- **Por que:** exposição age pela **hierarquia**, um degrau um pouco mais difícil a cada
  vez, não pela repetição semanal do mesmo passo. Os níveis 2 e 3 hoje são "2x/semana" e
  "3x/semana", sem nenhuma orientação de degrau. A pessoa com TDAH ou perfeccionismo tende
  a ler o nível 3 como "o certo" e acumular falhas contra ele.
- **Correção exata:** manter um único nível. `levels` fica com uma entrada:
  `{ label:'Seu ritmo', target: { pt:'Escolha um passo que dê para fazer hoje; se ficou fácil, o próximo pode ser um pouquinho maior', en:'…' }, effort:1, defaultSchedule:{kind:'timesPerWeek',target:1} }`.
  O `effort` passa a ser 1: ninguém deve ser incentivado a escolher o degrau pela
  recompensa. `suggestLevelChange` não oferece subir em itens `optInOnly` (A6).

### A6. A regra de subir e descer nível
- **Subir** (0,8 em 21 dias) está calibrado. O mínimo de 21 dias é conservador, e isso é
  o certo. **Correção:** `suggestLevelChange` recebe `optInOnly` e devolve `null` para
  `'up'` nesses itens. Em registro de pensamentos e exposição, mais frequência não é
  progresso.
- **Inconsistência:** o comentário diz "janela de 3 semanas", mas `constancy()` usa
  `CONSTANCY_WINDOW_DAYS` = 7. Se quem chama passar o ratio de 7 dias, uma única semana boa
  depois de 21 dias já dispara o convite. **Correção:** exportar
  `LEVEL_UP_WINDOW_DAYS = 21` e exigir que quem chama calcule a constância nessa janela,
  com um teste de fiação.
- **`lowConstancyDays` é ambíguo** ("consecutivos ou dentro da janela"). **Correção:**
  definir que é o número de dias consecutivos em que o ratio de 7 dias ficou abaixo de 0,4.
- **Descer** (0,4 em 14 dias): o limiar é bom, mas o convite, do jeito que está desenhado,
  vira **rebaixamento**. "Nível 2 para Nível 1" funciona como um placar que desce, e isso
  contraria a regra do produto de que nenhum número que diminui fica exposto. **Correção
  de texto no `EvolveTaskModal`:** nunca mostrar "descer" nem "Nível 1". Oferecer PT
  "Quer deixar este mais leve por um tempo? Dá pra voltar quando quiser." EN "Want to make
  this lighter for a while? You can switch back anytime." Os botões são "Deixar mais leve"
  e "Manter como está", e os dois têm o mesmo peso visual. A recusa não gera nada e não
  reaparece por 14 dias.
- **Dia de folga e ausência:** os dias com `ABSENCE_FORGIVENESS_DAYS`, os dias protegidos
  por escudo e as semanas de folga não podem somar em `lowConstancyDays`. Sem isso, quem
  ficou doente volta e encontra o convite de "descer", que se lê como "você piorou".

---

## Sugestões

- **S1. TDAH:** no starter set, dar preferência a itens com `anchorSuggestion`, porque a
  intenção de implementação ajuda quem esquece (Gollwitzer & Sheeran 2006). Hoje âncora não
  pesa no `scoreItem`. Efeito esperado: pequeno (previsão).
- **S2. Transtorno alimentar (fora da área mente):** `corpo-beber-agua` no nível 3 (6
  copos) e `corpo-forca`/`corpo-caminhar` no nível 3 podem alimentar compensação em quem
  tem TA. Não é caso de veto, porque não falam de caloria, peso nem dieta. Sugiro que o
  nível 3 de corpo não apareça no convite automático de subir.
- **S3. Privacidade:** se um dia o registro de pensamentos ganhar campo de texto, esse
  conteúdo é **dado de saúde sensível (LGPD art. 11)**. Ele fica só no aparelho, não vai
  para o cloud save nem para o `/api/chat`, a menos que a pessoa consinta de forma
  explícita. Hoje o item é só checkbox, e é melhor que continue assim.
- **S4. Validar com humanos (gestor-pesquisa):** (a) testar se o cartão de aviso A1 é lido
  ou pulado; (b) testar se o convite "deixar mais leve" é percebido como cuidado ou como
  julgamento. Esse teste vem antes de decidir o texto final. A linha de falsificação do
  plano ("subida aceita < 20%") precisa de um par: "descida aceita > 50%" indicaria que o
  nível 1 foi calibrado alto demais.

## Filtro ético (verificado)
Não encontrei urgência artificial, escassez nem custo escondido no catálogo. O que
encontrei: **punição por evitação ansiosa** (V2), **promessa implícita de tratamento**
(A2), **oferta clínica sem pedido** (V1) e **um número que desce exposto** (A6).

## Fontes verificadas
- Ciharova et al. 2021, J Consult Clin Psychol 89(6):563-574: https://research.vu.nl/en/publications/cognitive-restructuring-behavioral-activation-and-cognitive-behav/
- Heo & Park 2022 (PMC9735589, VR para TEPT): https://pmc.ncbi.nlm.nih.gov/articles/PMC9735589/
- Balban et al. 2023: https://www.cell.com/cell-reports-medecine/fulltext/S2666-3791(22)00474-8
- Haug et al. 2012, self-help para ansiedade (DARE): https://www.ncbi.nlm.nih.gov/books/NBK116139/
- Domhardt et al. 2019: https://onlinelibrary.wiley.com/doi/10.1002/da.22860
