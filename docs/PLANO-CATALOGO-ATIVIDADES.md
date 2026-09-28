# Plano — Catálogo de atividades curado (fim da tarefa criada do zero)

Data: 2026-09-28 · Dono da decisão: o dono do produto · Status: APROVADO para execução

## 0. A virada

Hoje o jogador cria e configura as próprias atividades (`CreateModal`). Passa a ser:
**o Soulmon propõe**. O onboarding pergunta quais áreas da vida a pessoa quer melhorar,
suas principais dificuldades e forças; daí sai um **set inicial sugerido** (3–5
atividades). Depois, a pessoa pode buscar num **pool maior, por categoria**. Cada
atividade do pool tem **níveis 1, 2 e 3** que acompanham o progresso do jogador.

Ganho de design: todo item do catálogo é parametrizado por nós → recompensa, esforço,
XP e atributos ficam equilibráveis numa tabela só, em vez de dependerem do que o
jogador digitou.

**Regra inegociável**: só entra no catálogo comportamento com evidência. Cada item
carrega `evidence` (fonte + nível) e passa por revisão de um agente de evidência.

## 1. Modelo de dados (fonte única: `src/types/activityCatalog.ts` + `src/data/activityCatalog.ts`)

```ts
type LifeArea = 'sono' | 'corpo' | 'mente' | 'foco' | 'aprendizado' | 'relacoes' | 'casa' | 'financas' | 'proposito';
type CatalogLevel = 1 | 2 | 3;
interface CatalogLevelSpec {
  label: string;            // "1 copo ao acordar" → "6 copos ao longo do dia"
  target: string;           // critério objetivo de "feito"
  effort: Effort;           // reaproveita Effort 1|2|3 do taskModel (peso da meta diária)
  defaultSchedule: Schedule;// ex.: 3×/semana no nível 1, diário no 3
}
interface CatalogItem {
  id: string;               // estável, vai para o save
  kind: 'especifica' | 'abrangente';  // "beber água" vs "estudar"
  area: LifeArea;
  category: ActivityCategory;  // mantém o mapa de atributos existente (CATEGORY_ATTRIBUTES)
  emoji: string;
  name: { pt: string; en: string };
  levels: [CatalogLevelSpec, CatalogLevelSpec, CatalogLevelSpec];
  anchorSuggestion?: string;   // implementation intention (Gollwitzer)
  addresses: StruggleId[];     // quais dificuldades o item ataca
  leverages: StrengthId[];     // quais forças o item usa
  contraindications?: string[];// ex.: jejum/restrição alimentar → nunca sugerir
  evidence: { level: 'A' | 'B' | 'C'; refs: string[] }; // A = meta-análise/RCT
}
```

`Activity` ganha campos OPCIONAIS `catalogId?` e `level?` (save antigo continua válido,
atividade sem `catalogId` = legado/custom). Nenhuma migração destrutiva.

## 2. Onboarding

Reaproveitar `GOAL_STEP`/`STRUGGLE_STEP` já existentes (`soulGoal`/`soulStruggle`
hoje são texto livre) e trocar por **escolha múltipla**:
1. Áreas a melhorar (escolher até 3 de `LifeArea`).
2. Dificuldades (até 3): começar, manter constância, esquecer, cansaço/energia,
   ansiedade, distração/celular, tempo, perfeccionismo.
3. Forças (até 3): disciplina, curiosidade, criatividade, sociabilidade, organização,
   energia física, calma, persistência.
4. Tela "Seu ponto de partida": 3–5 sugestões, todas no **nível 1**, com "trocar" e
   "ver mais". Pessoa confirma → viram `Activity` com `catalogId`+`level:1`.

Compatibilidade: se `soulGoal`/`soulStruggle` já existe como texto (save antigo), mantém
e oferece o seletor novo no menu, sem forçar.

## 3. Recomendador — função pura `utils/recommend.ts`

`recommendStarterSet(profile, catalog, n=4)`:
- pontua itens: +3 área escolhida, +2 por dificuldade que ataca, +1 por força que usa,
  +1 evidência A; descarta contraindicados;
- diversidade: no máx. 2 por área; pelo menos 1 `especifica` (vitória rápida);
- **orçamento de esforço inicial ≤ 4** (pesquisa de sobrecarga: começar pequeno — Fogg,
  Lally). Nível 1 sempre.
Testes determinísticos (mesmo perfil → mesmo set).

## 4. Progressão de nível — `utils/catalogLevel.ts`

- **Subir**: sugere (não impõe) nível+1 quando constância ≥ 80% nas últimas 3 semanas
  (reaproveita `habitRhythm.ts`), e só se o jogador aceitar. Lally 2009: automaticidade
  mediana ~66 dias → não acelerar demais; mínimo 21 dias no nível.
- **Descer**: após 2 semanas < 40%, oferta gentil de voltar um nível — sem punição, sem
  vermelho (regra de ouro do motor: fracasso nunca vira culpa).
- Recompensa (XP/moedas) escala com `effort` do nível, via o mesmo caminho da meta
  ponderada (`dailyGoalFor`). Não criar segunda fórmula.
- Gate por estágio do pet é opcional: nível 3 só depois de Champion — decidir com
  o balanceador; padrão = sem gate (progresso é da pessoa, não do pet).
  ⚠️ **Decidido pelo dono em 28/09/2026: SEM gate.** Nível 3 fica disponível
  a qualquer estágio do pet — progresso de nível é da PESSOA, nunca do pet.
  Ver `docs/REGISTRO-DE-DECISOES.md`.

## 5. UI

- `CreateModal` vira **Catálogo**: abas por categoria/área, busca, filtro de nível,
  cartão com "por que funciona" (1 linha + fonte). "Criar do zero" continua, mas atrás
  de "Algo que não está aqui?" (legado/custom, peso fixo effort 1).
  ⚠️ **Confirmado pelo dono em 28/09/2026**: "criar do zero" fica ESCONDIDO
  atrás de "Algo que não está aqui?", mantém-se disponível, esforço fixo 1.
- `EvolveTaskModal` (já existe) vira o convite de subir/descer nível.
- Identidade Fase 2 travada: só tokens `--sm2-*` e os 39 glifos. Nada de cor nova.
- **Onboarding retroativo (decisão do dono, 28/09/2026)**: jogadores que já
  têm save REFAZEM o onboarding na próxima abertura — passam pelas perguntas
  novas (áreas/dificuldades/forças) e recebem sugestões de starter set.
  **Não apaga nenhuma atividade existente**: as antigas continuam como
  legado (sem `catalogId`), e as sugeridas se somam. Roda **uma vez só**
  (flag persistida no save, ex. `catalogOnboardingSeenAt`), pulável mas
  **curto**, e entra pela **fila única de intersticiais** do `App.tsx` (ver
  `src/components/filaDeAvisos.contract.test.ts`) — nunca como modal solto.
  Pendente de implementação (F3).
- **Área "mente" — protocolos TCC (decisão do dono, 28/09/2026)**: incluir
  itens derivados de TCC com evidência A/B (registro de pensamentos,
  ativação comportamental agendada, exposição gradual leve,
  reestruturação cognitiva simples) — feito em F1 (`mente-registro-pensamentos`,
  `mente-exposicao-leve` em `src/data/activityCatalog.ts`, revisão reforçada em
  `docs/CATALOGO-EVIDENCIAS.md`). Regras obrigatórias, ainda pendentes na UI
  (F3/F4): copy nunca usa "trata"/"cura"; aviso "não substitui ajuda
  profissional" + CVV 188 visível nesses itens; contraindicação sempre
  marcada e lida antes de sugerir (crise aguda/ideação suicida → nunca
  sugerir, sempre apontar CVV 188).

## 6. Conteúdo — pool inicial (~60 itens, 9 áreas)

Critério de inclusão: evidência A ou B; C só com justificativa e marcado.
Exemplos semente (o agente de evidência valida/refina cada um):
- sono: horário fixo de deitar (higiene do sono; Irish 2015), telas fora 30min antes
- corpo: caminhar (Paluch 2022, passos e mortalidade), beber água, força 2×/sem (OMS 2020)
- mente: respiração lenta (Balban 2023), diário de gratidão (Emmons & McCullough 2003),
  autocompaixão (Neff), ativação comportamental (Cuijpers 2007) — "fazer 1 coisa prazerosa"
- foco: bloco de foco 25min (timeboxing), celular fora do quarto/mesa (Ward 2017)
- aprendizado: estudar com recuperação ativa (Roediger & Karpicke 2006; Dunlosky 2013),
  prática espaçada, ler 10 páginas
- relações: mandar mensagem a alguém (Holt-Lunstad 2010), ato de gentileza
- casa: arrumar 10 min, preparar a roupa de amanhã
- finanças: registrar gastos (automonitoramento — Michie BCT 2.3)
- propósito: planejar o dia (implementation intentions, Gollwitzer & Sheeran 2006)

Referência de apps: Fabulous (jornadas por área, começa com 1 hábito), Finch (metas
sugeridas + pet), Habitica (contraexemplo: sobrecarga de itens), Headspace/Calm
(programas por nível), Duolingo (unidades progressivas), Streaks, Tiimo (neurodivergente).

Linha vermelha (veto do psicólogo): nada de dieta restritiva, jejum, contagem de
calorias, peso corporal, "detox", metas de sono por duração (ortossonia, já registrado),
ou qualquer coisa que pareça tratamento. Área "mente" leva aviso de que não substitui
ajuda profissional + link CVV (188) já usado no app, se existir.

## 7. Agentes (criados em `.claude/agents/`)

| Agente | Papel |
|---|---|
| `catalogo-curador` | monta/edita o pool, níveis 1–3, cópia PT/EN |
| `catalogo-evidencia` | revisa cada item contra literatura (psicologia, psiquiatria, neuropsicologia); veta sem fonte; mantém `docs/CATALOGO-EVIDENCIAS.md` |
| `catalogo-benchmark` | extrai padrões de apps de hábito (Fabulous, Finch, Habitica, Duolingo, Tiimo) |
| `catalogo-balanceador` | parametriza effort/schedule/XP por nível e roda simulação da economia |
| `catalogo-recomendador` | dono do algoritmo onboarding → starter set e das regras de subir/descer |
| `soulmon-behavioral-psychologist` (já existe) | veto ético final |

## 8. Fases de execução

1. **F1 Dados**: tipos + catálogo semente (~60) + `CATALOGO-EVIDENCIAS.md`; revisão de evidência.
2. **F2 Lógica**: `recommend.ts`, `catalogLevel.ts`, campos opcionais em `Activity`, hidratação segura (`hydrateSave`), testes.
3. **F3 Onboarding**: seletores área/dificuldade/força + tela de starter set.
4. **F4 Catálogo UI**: `CreateModal` → navegador do catálogo; convite de nível via `EvolveTaskModal`.
5. **F5 Balanceamento + QA**: simulação, suíte completa (`Test Files` conferido — ver memória do hook), build, verificação no navegador com localStorage limpo.
6. **F6 Docs**: atualizar `PLANO-TAREFAS.md`, `REGISTRO-DE-DECISOES.md`, `CHANGELOG.md`.

Commits por fase, `git add` por caminho (nunca `-A`). Não fazer push sem o dono
(push publica em produção). Decisões que só o dono toma → `docs/PERGUNTAS-DO-DONO.md`.

## 9. O que falsifica a aposta

- Taxa de conclusão da 1ª semana cai vs. baseline de atividade criada manualmente.
- >30% dos jogadores trocam todo o starter set → recomendador errou.
- Subida de nível aceita < 20% → níveis mal calibrados.
