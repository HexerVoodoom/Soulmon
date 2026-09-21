# Mapa do Squad — Soulmon

> ⚰️ **DOCUMENTO HISTÓRICO (registro) — 21/09/2026.** A squad de revisão descrita abaixo
> (`soulmon-maestro` + 16 especialistas, uma rodada em 03/08/2026) foi **aposentada** pela
> governança `docs/reviews/2026-09-21-qa-geral/13-governanca-agentes.md` §8 (C3–C5, R6),
> com aval do dono (`docs/PERGUNTAS-DO-DONO.md` #28). Dos 16, sobrevivem no repo só os que
> outras squads reusam: `soulmon-ip-brand-guardian`, `soulmon-behavioral-psychologist`,
> `soulmon-product-designer` e `soulmon-monster-taming-designer`. O `/revisao-soulmon` não
> existe mais. **Uma nova rodada de revisão de produto se instancia pela skill global
> `squad-alpha`** (`/squad-alpha start <alvo>`, com `alpha-briefer` lendo `00-BRIEFING.md` +
> `01-RUBRICA.md` como contexto) — foi assim que o run `som-01` rodou. O texto abaixo é
> mantido como estava em 02/08/2026 para que os relatórios de `docs/reviews/2026-08-03/`
> continuem legíveis; **nenhum nome de agente aqui é despachável**.

Era: 16 agentes (o texto dizia "14" — contagem apodrecida, registrada como estava).
Definições viviam em `.claude/agents/soulmon-*.md`.
Contexto compartilhado em [`00-BRIEFING.md`](00-BRIEFING.md).
Rubrica e template em [`01-RUBRICA.md`](01-RUBRICA.md).

---

## Elenco

| Onda | Agente | Domínio | Rubrica (dono) |
|---|---|---|---|
| — | `soulmon-maestro` | Orquestração, arbitragem, síntese, criação de novos agentes | consolida todas |
| 0 | `soulmon-user-researcher` | ICP, personas com skills, walkthrough por persona | D1 D2 D3 D4 D10 |
| 0 | `soulmon-ip-brand-guardian` | PI, marca, conformidade de loja, privacidade | D12 |
| 1 | `soulmon-productivity-expert` | Gestão de tarefas, metodologias, apps de produtividade | D3 D5 D9 D10 |
| 1 | `soulmon-gamification-expert` | Gamificação, serious games, arquitetura motivacional | D5 D7 D8 D9 |
| 1 | `soulmon-monster-taming-designer` | Vínculo alma↔criatura, evolução, coleção, universo do gênero | D4 D6 D10 |
| 1 | `soulmon-mobile-game-designer` | Core loop, sessão, economia, sistemas, live ops | D5 D6 D7 |
| 1 | `soulmon-behavioral-psychologist` | Hábito, motivação, resposta ao fracasso, ética, dark patterns | D3 D8 D14 |
| 1 | `soulmon-product-designer` | UX, IA, onboarding, identidade visual, acessibilidade | D1 D2 D14 |
| 2 | `soulmon-monetization-strategist` | Modelos de receita, preço, custo, ética de monetização | D11 |
| 2 | `soulmon-retention-analyst` | Curvas de churn, telemetria, métrica-farol, experimentos | D9 |
| 2 | `soulmon-growth-aso` | Posicionamento, nome, listagem de loja, canais, viralidade | D1 D10 |
| 2 | `soulmon-tech-feasibility` | Viabilidade, dívida, custo por usuário, prontidão de lançamento | D13 |
| 3 | `soulmon-product-manager` | Tese, competição, escopo de lançamento, roadmap, métricas | D1 D9 D10 |

## Por que estes agentes (o texto original dizia 14; eram 16 com as duas adições do registro abaixo)

Os nove primeiros papéis vieram do pedido original. Os cinco seguintes foram
acrescentados porque a revisão ficaria cega sem eles:

- **`ip-brand-guardian`** — o repositório ainda carrega nomes e sprites de Digimon.
  Sem resolver isso, nenhuma recomendação de lançamento ou de receita é executável.
  Este é o único agente com poder de bloqueio absoluto.
- **`retention-analyst`** — o produto não tem telemetria alguma. Sem ele, os outros 13
  relatórios são um conjunto de opiniões qualificadas e nada mais. Ele é quem transforma
  as opiniões em hipóteses testáveis.
- **`growth-aso`** — o app não está em nenhuma loja. "O que falta para ser um sucesso"
  inclui obrigatoriamente "como alguém descobre este app".
- **`tech-feasibility`** — sem alguém checando custo e esforço, um squad de estrategistas
  produz um roadmap de fantasia. Ele também é quem calcula o custo por usuário (Groq,
  Higgsfield, Cloudflare) sem o qual não existe estratégia de preço.
- **`maestro`** — 13 relatórios sem síntese e sem arbitragem não produzem decisão.

## Ondas

```
Onda 0  user-researcher ∥ ip-brand-guardian
          └─> personas + mapa de risco de PI viram insumo de todos

Onda 1  productivity ∥ gamification ∥ monster-taming ∥ game-design
        ∥ psychologist ∥ product-designer
          └─> as seis análises de domínio, em paralelo

Onda 2  monetization ∥ retention ∥ growth-aso ∥ tech-feasibility
          └─> leem a Onda 1; negócio e realidade

Onda 3  product-manager  →  maestro
          └─> integração e veredito
```

Rodar em ondas (e não todos de uma vez) é o que produz debate em vez de N análises
paralelas que se ignoram.

## Como rodar

**Rodada completa:** peça ao Maestro. Ex.: *"Use o soulmon-maestro para conduzir uma
revisão completa do produto"*. Ele define escopo, dispara as ondas e consolida.

**Rodada temática:** chame os 3-5 agentes relevantes diretamente. Ex.: *"O loop retém?"*
→ `soulmon-behavioral-psychologist` + `soulmon-gamification-expert` +
`soulmon-retention-analyst` + `soulmon-productivity-expert`.

**Rodada de bloqueio:** um agente sobre um risco. Ex.: `soulmon-ip-brand-guardian` antes
de submeter à Play Store.

Existia também o comando `/revisao-soulmon` (em `.claude/commands/`) que disparava a rodada
completa com um argumento opcional de escopo — ⚰️ apagado em 21/09/2026 (ver lápide no topo).

## Regras invioláveis

1. **Nenhum agente do squad modifica código.** A única escrita permitida é o relatório
   em `docs/reviews/<AAAA-MM-DD>/`.
2. **Grave cedo, enriqueça depois.** Cada agente grava o esqueleto do seu relatório assim
   que tem a estrutura, e vai atualizando com `Edit` conforme avança — nunca deixa para
   escrever no fim. Aprendido a dor na rodada de 2026-08-03: três agentes morreram por
   limite de sessão; os dois que escreveriam no fim não deixaram nada, e o único que
   gravou cedo deixou o achado que redefiniu o veredito da revisão inteira.
2. **Evidência ou silêncio.** Afirmação sobre o produto exige `arquivo:linha`; afirmação
   sobre o mercado exige link e data.
3. **Hierarquia de camadas** (tarefas > vínculo > riqueza) arbitra empates.
4. A **linha vermelha ética** do `soulmon-behavioral-psychologist` é vinculante para o
   `soulmon-monetization-strategist`.
5. O **veto de PI** do `soulmon-ip-brand-guardian` precede qualquer plano de receita ou
   de crescimento.

## Saída de uma rodada

```
docs/reviews/<AAAA-MM-DD>/
├── 00-CONSOLIDADO.md          ← Maestro: veredito, matriz, conflitos, roadmap
├── soulmon-user-researcher.md
├── soulmon-ip-brand-guardian.md
├── ...                        ← um por agente que rodou
└── soulmon-product-manager.md
```

## Agentes futuros (candidatos avaliados, não criados ainda)

O Maestro pode criar novos agentes quando a lacuna aparecer em 2+ relatórios. Candidatos
já identificados, deliberadamente **fora** da v1 do squad:

| Candidato | Por que ainda não | O que o destravaria |
|---|---|---|
| Narrativa e roteiro | O monster-taming-designer cobre o essencial por ora | Decisão de investir em lore como pilar |
| Som e música | Existe `sounds.ts` mas áudio não é o gargalo atual | Um relatório apontar áudio como lacuna de imersão |
| IA aplicada (qualidade do chat) | Coberto parcialmente por monster-taming + tech | O chat virar pilar do vínculo, não acessório |
| Comunidade e moderação | Não há comunidade real ainda | Decisão de investir em social |
| QA e teste com usuários reais | O retention-analyst desenha o plano | Existirem usuários reais para testar |
| Mercado LATAM / localização | O user-researcher cobre o recorte inicial | Decisão de expandir para en-US como mercado primário |

## Reuso para outros produtos

Este squad é específico do Soulmon por desenho — os agentes citam arquivos, regras e a
tese deste produto, e é isso que os torna úteis. Para revisar outro jogo ou app, replique
a **estrutura** (briefing + rubrica + ondas + template de relatório), não os arquivos:
troque o briefing, ajuste as dimensões da rubrica ao domínio e reescreva as seções "o que
auditar" de cada agente contra o novo repositório.

---

## Registro de alterações do squad

| Data | Alteração | Motivo |
|---|---|---|
| 2026-08-02 | Squad criado com 14 agentes | Primeira rodada de revisão do Soulmon |
| 2026-08-02 | +`soulmon-ai-companion-designer` (Onda 1) | Duas tecnologias — chat Groq e sprites Higgsfield — carregam sozinhas a promessa da camada 2, e nenhum agente as julgava a fundo. Consistência visual entre estágios evolutivos e memória da criatura são risco de produto, não detalhe de implementação. |
| 2026-09-21 | ⚰️ Squad aposentada (governança C3–C5): saem `soulmon-maestro`, `-user-researcher`, `-productivity-expert`, `-gamification-expert`, `-mobile-game-designer`, `-monetization-strategist`, `-retention-analyst`, `-growth-aso`, `-tech-feasibility`, `-product-manager`, `-ai-companion-designer`, `-devils-advocate` e `/revisao-soulmon`; ficam os 4 reusados. Rodada nova = skill global `squad-alpha` | 1 rodada em 7 semanas, 3 de 16 chegaram ao fim, lanes absorvidas por guardas/squads (`docs/reviews/2026-09-21-qa-geral/13-governanca-agentes.md` §1.2) |
| 2026-08-02 | +`soulmon-devils-advocate` (pós-Onda 2) | Um squad contratado para melhorar um produto converge para consenso construtivo. Sem alguém encarregado do pre-mortem e do caso "não faça", a revisão vira polimento de uma premissa não testada. |
</content>
