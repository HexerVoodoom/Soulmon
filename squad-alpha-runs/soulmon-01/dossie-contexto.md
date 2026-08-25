# Dossiê de contexto — Soulmon (SQUAD-Alpha, modo: validar o que já existe)

> Curado por `alpha-curador-de-contexto`. Data da varredura: 2026-08-24.
> Memória entre runs (`<workdir>/memoria/soulmon.md`): **não existe** — nenhum "já sabido" a herdar. Este dossiê nasce do zero.

---

## 1. O que é o Soulmon (3 linhas, na linguagem dos próprios docs)

App de produtividade gamificado, gênero v-pet: o usuário cuida de um bichinho digital
completando hábitos/tarefas reais, e o pet evolui (ou degenera) conforme o cuidado
recebido. Nasceu de um **fork do DigiApp** (mesmo gênero, "estilo Tamagotchi/Digimon") e
ainda divide infraestrutura com o projeto original (`CLAUDE.md:8-15`). Essência declarada
pelo próprio time: "um avatar que evolui COM o usuário e o encoraja — nunca um cobrador"
(`CLAUDE.md:19-21`).

---

## 2. Mapa do que existe

| Item | Caminho | O que decide | Data/estado |
|---|---|---|---|
| Guia do agente (fonte da verdade das regras de jogo) | `CLAUDE.md` | Regras de HP, comida, energia, tarefas, masmorra, torneio, loja — tabela extensa e minuciosa | **Canônico**, vivo, sem data explícita mas referencia STATUS.md de 19/08/2026 |
| Registro vivo do projeto | `docs/STATUS.md` | Segurança, estado do produto, "depende de você", pendências — atualizado a cada rodada | **Canônico**, última entrada **19/08/2026** |
| Pendências do dono | `docs/DEPENDE-DE-VOCE.md` | O que só o dono pode decidir/fazer, por impacto | **Canônico**, mas **desatualizado em relação ao STATUS.md**: diz "rodada 8, 2026-08-14"; STATUS já está na rodada com Pesadelos/Passos de 19/08/2026. Itens de segurança (SEC-1/2/5) aparecem "não corrigidos ainda" aqui mas "✅ corrigido" no STATUS — ver contradição §5 |
| Separação DigiApp/Soulmon | `docs/SEPARACAO-DIGIAPP.md` | Inventário do que é compartilhado com o DigiApp e ordem segura de separar | **Canônico**, sem data no topo, mas consistente com CLAUDE.md |
| Plano de produto (core/negócio/progressão) | `docs/PLANO-PRODUTO.md` | Porquê e quando das decisões de produto; contém autocorreção de uma auditoria anterior | **Canônico**, "Consolidado em 2026-08-19" — o mais recente dos planos |
| Motor de tarefas | `docs/PLANO-TAREFAS.md` | Especificação das Fases 1-3 (hábitos, tarefas, Janela de Descanso) já implementadas | **Canônico**, referenciado ativamente pelo CLAUDE.md |
| Plano de evolução (benchmark + fases) | `docs/PLANO-EVOLUCAO.md` | Benchmark ago/2026 (Habitica, Finch, Pokémon Sleep/GO etc.) e plano em 5 fases | **Canônico**, referenciado pelo CLAUDE.md como fonte da "essência declarada" |
| Oráculo (motor de geração da criatura) | `docs/ORACULO.md` | Histórico de decisões do pipeline de geração (11+ rodadas registradas) | **Canônico**, alto volume de decisões datadas (ago/2026) |
| Palco e decoração | `docs/PALCO-E-DECORACAO.md` | Contrato de arte do palco do pet | **Canônico**, referenciado pelo CLAUDE.md — "falta só a arte de verdade" |
| Backlog de arte (Higgsfield) | `docs/BACKLOG-ARTE-GERAR.md` | Itens de arte pendentes/feitos, prompts | **Canônico/rascunho ativo** — referenciado em STATUS até 18/08/2026 |
| Pendências de arte/UI Higgsfield | `docs/PENDENCIAS-ARTE-UI-HIGGSFIELD.md` | Pendências específicas de arte de UI | Não lido em detalhe — **verificar antes de decidir arte** |
| Inventário de telas | `docs/INVENTARIO-TELAS.md` | Mapa medido (não proposto) da superfície visual do app | **Canônico, alta confiança declarada** — "Data do levantamento: 19/08/2026", metodologia explícita de o que foi medido vs. não verificado (sem screenshot) |
| Plano de design | `docs/PLANO-DESIGN.md` | Não lido em detalhe nesta varredura — **ler antes de qualquer decisão de UI** | Estado desconhecido, verificar |
| Plano desktop/Steam | `docs/PLANO-DESKTOP-STEAM.md` | Plano do overlay Electron/Steam | **Canônico com correção registrada**: STATUS.md corrige que o overlay nunca funcionou de ponta a ponta apesar de estar documentado como "funcional" — ver contradição §5 |
| Billing setup | `docs/BILLING-SETUP.md` | Configuração de cobrança/Play Store | Não lido em detalhe — relevante para pendências de dinheiro (§6) |
| Brief de arte/decoração | `docs/BRIEF-ARTE-DECORACAO.md` | Não lido em detalhe | Verificar |
| Attributions | `docs/Attributions.md` | Registro da remoção de sprites/nomes Digimon (resolvido 09/08/2026) | **Canônico**, resolve um item 🔴 antigo de direitos autorais |
| `README.md` (raiz) | `README.md` | Nada relevante — é o boilerplate genérico do bundle Figma "DigiApp Design Prototype" | **OBSOLETO/lixo residual**, não fala de Soulmon |
| `PROJETO.md` (raiz) | `PROJETO.md` | Especificação técnica completa, mas é **do DigiApp**, não do Soulmon (branches `version-b`, app id `com.digipartner.digiapp`) | **OBSOLETO**, datado "2026-06-25" mas descreve o projeto predecessor. CLAUDE.md explicitamente diz "não existem `version-b`... eram do DigiApp" |
| `docs/00-START-HERE.md` | `docs/00-START-HERE.md` | Onboarding de doc — mas fala de "DigiApp", app 100% pronto pra build v1.0.0 | **OBSOLETO** — datado 28/12/2024, pré-fork |
| `docs/DOCS-INDEX.md` | `docs/DOCS-INDEX.md` | Índice de documentação — mas indexa docs do DigiApp v1.0.1 (BACKLOG.md, CHANGELOG-v1.0.1.md etc.) | **OBSOLETO** — datado 26/12/2024, não reflete a estrutura atual de `docs/` |
| `docs/BACKLOG.md` | `docs/BACKLOG.md` | Diz ser "DigiApp - Backlog e Documentação de Build" | **OBSOLETO**, herança do DigiApp, não do Soulmon |
| `docs/STATUS.md` (achado dentro dele) | linha 649+ | Referencia `docs/PLANO-EVOLUCAO.md` como plano vigente que substitui o backlog antigo | Confirma que BACKLOG.md está morto |
| `PLANO_MELHORIAS.md` (raiz) | `PLANO_MELHORIAS.md` | Não lido nesta varredura | Verificar se é DigiApp ou Soulmon antes de usar |
| `CONTRACT.md` | `CONTRACT.md` | Existe, não lido em detalhe — nome sugere contrato de regras/API | Verificar |
| `PWA-SETUP.md` / `PWA-CHECKLIST.md` (raiz) | idem | Configuração PWA — provável herança do DigiApp | Verificar antes de usar |

---

## 3. O ecossistema de 4 peças

```
teste-personalidade (Next.js, repo separado)
  Onboarding (nome/data/hora/cidade) + questionário 20 itens
       │
       ├─> Big Five + HEXACO (psicometria)
       ├─> Mapa astral (astronomy-engine, Placidus)
       └─> Numerologia pitagórica
                │
                ▼
        SoulProfile (JSON) ──────────────────────────┐
   [contrato de entrada, "pensado para o bestiário    │
    e o class-system do Soulmon"]                     │
                                                       ▼
                                        Soulmon (React/TS, este repo)
                                    src/utils/soulProfile/  (hub de integração)
                                    ┌──────────────────────────────────┐
                                    │ profile.ts   → recebe SoulProfile│
                                    │ ficha/*      → chama class-system│
                                    │ bestiary/*   → seleciona criatura│
                                    │ astrology/*, personality/*,      │
                                    │ numerology.ts → replicam parte do│
                                    │ cálculo do teste-personalidade   │
                                    │ pipeline.ts  → orquestra tudo    │
                                    └──────────────────────────────────┘
                                                       │
                              ficha/buildSheet.ts chama o motor REAL
                              (import dinâmico) de:
                                                       ▼
                            class-system (dependência npm: "class-system":
                            "github:HexerVoodoom/Class-System" em package.json:40)
                            17 elementos base, 79 arquétipos emergentes,
                            6 escolas, 65 talentos, cascata geracional de poder
                                                       │
                              devolve ficha por estágio + skills reais + classe
                                                       │
                                                       ▼
                            bestiary (NÃO é repo separado — é módulo interno:
                            src/utils/soulProfile/bestiary/{pool.json,select.ts})
                            pool de 2.000 criaturas, seleciona por linhagem
                            (proximidade de espécie entre estágios)
                                                       │
                                                       ▼
                            oracle.ts (metade "criativa", não tocada pela fusão)
                            gera nome, prompt de sprite, descrição — usa a
                            inspiração do bestiário só como TEXTO (nunca nome)
                            e a classe do class-system só no PROMPT DE IMAGEM
                            (nunca em texto visível ao jogador)
```

**O que atravessa cada fronteira:**
- `teste-personalidade → Soulmon`: um JSON `SoulProfile` (o teste roda 100% no navegador do usuário do teste-personalidade; **não há API entre os dois repos** — é um contrato de formato, não uma integração ao vivo). Confirmar se o Soulmon consome esse profile via cópia de código ou de fato importa o output do outro app: pelo que os docs indicam, o teste-personalidade é uma REPLICAÇÃO paralela do vocabulário do oráculo do Soulmon (mesmos 8 elementos/5 papéis/3 alinhamentos/9 reinos), pensada para **substituir** `oracle.ts` do Soulmon quando madura — hoje ainda não substitui.
- `Soulmon → class-system`: dependência de pacote real (`github:HexerVoodoom/Class-System` no `package.json`), consumida por import dinâmico em `ficha/buildSheet.ts`/`ficha/classTitle.ts`/`ficha/realSkillPower.ts` — **integração de verdade**, não acoplamento cosmético. Há teste de paridade (`cascata.parity.test.ts`) contra o motor real.
- `Soulmon ↔ bestiário`: **não é fronteira externa** — é módulo interno do próprio Soulmon (`src/utils/soulProfile/bestiary/`), com um pool JSON estático (`pool.json`, dito ter 2.000 criaturas, sincronizado por `npm run sync:oracle-data` a partir de um repositório canônico externo chamado "Besti-rio-", citado em STATUS.md mas sem cópia local neste levantamento).

**Acoplado vs. integrado de verdade:**
- **Integrado de verdade**: Soulmon ↔ class-system (dependência de pacote, testes de paridade, import dinâmico do motor real).
- **Acoplado por convenção/vocabulário, não por API viva**: Soulmon ↔ teste-personalidade (mesmo vocabulário de eixos, mas cada um com implementação própria — `derivedElements.ts`/`axes.ts`/`numerology.ts`/`astrology/` no Soulmon parecem duplicar cálculo que o teste-personalidade também faz).
- **Interno, não é peça separada**: o "bestiário" é pasta dentro do Soulmon, alimentada por um snapshot sincronizado de um repo externo ("Besti-rio-") que **não estava nas fontes indicadas para este run** — é uma 5ª peça implícita não mapeada no briefing original.

---

## 4. Estado técnico

- **Stack**: React 18 + TypeScript + Vite 6.3.5 (`@vitejs/plugin-react-swc`), Tailwind v4, Radix UI/shadcn. `package.json` `name: "soulmon"`, versão `0.1.0`.
- **Mobile**: Capacitor 8.4 → Android (`android/`, app id `com.hexervoodoom.soulmon` conforme `SEPARACAO-DIGIAPP.md:11`). CI dedicado: `.github/workflows/android-build.yml` (builda no push).
- **Desktop**: Electron separado em `desktop/` (README.md, STEAM.md próprios) — plano de Steam em `docs/PLANO-DESKTOP-STEAM.md`, com correção registrada de que o overlay nunca funcionou fim-a-fim apesar de estar documentado como pronto (ver §5). CI dedicado: `.github/workflows/desktop-build.yml`.
- **Backend**: Cloudflare Pages Functions (`functions/api/`) + Cloudflare Worker standalone com cron (`workers/`, deploy manual, **não builda automaticamente** — achado crítico em `DEPENDE-DE-VOCE.md` item 1). KV para saves/push/entitlements. Auth via Firebase (parcialmente desligada — `FIREBASE_PROJECT_ID` não configurado, ver §6).
- **Testes**: Vitest + `@vitest/coverage-v8`. **58 arquivos `*.test.ts`/`*.test.tsx`** encontrados em `src/` nesta varredura (contagem de arquivos, não de casos — STATUS.md cita "suíte 1143→1149" testes individuais numa rodada de agosto, e outras entradas citam 600, 1253 — o número de casos individuais oscila entre entradas do STATUS e não há um total único confiável no momento desta varredura).
- **CI**: dois workflows GitHub Actions (`android-build.yml`, `desktop-build.yml`). Não há workflow visível para o build/testes web (`npm run test`/`typecheck`) rodando em CI — a garantia de qualidade descrita no `CLAUDE.md` ("rode ANTES de todo commit") parece depender de disciplina manual/do agente, não de gate de CI automatizado para PRs web.
- **Coverage**: script `test:coverage` existe; não há artefato `coverage/` persistido encontrado nesta varredura (pode ser gerado sob demanda, não commitado).
- **`class-system`** entra como **dependência de pacote GitHub**, não como submódulo/monorepo — versão fixada implicitamente pelo branch default do repo remoto (risco: sem lockfile de commit explícito visível, mudanças no upstream podem alterar comportamento silenciosamente entre installs).

---

## 5. Contradições e desatualizações encontradas

1. **Docs "raiz" descrevem o projeto errado.** `README.md` (boilerplate Figma genérico), `PROJETO.md` (linhas 1-14, fala de "DigiApp" com app id `com.digipartner.digiapp` e branches `version-b`), `docs/00-START-HERE.md` (linha 2, "DigiApp - START HERE", datado 28/12/2024) e `docs/DOCS-INDEX.md` (linha 1, "DigiApp v1.0.1", datado 26/12/2024) descrevem o **projeto predecessor**, não o Soulmon. `CLAUDE.md:8-15,42` confirma explicitamente que o fork existe e que nomes "digiapp" remanescentes são herança — mas não avisa que arquivos inteiros na raiz e no topo de `docs/` ainda são do projeto errado, não só nomes de variável.
2. **`docs/BACKLOG.md`** (linha 1: "DigiApp - Backlog e Documentação de Build") é do DigiApp, mas `docs/00-START-HERE.md` o lista como doc "atual" a ler — cadeia de referência morta.
3. **`docs/DEPENDE-DE-VOCE.md:7`** diz "última atualização: rodada 8 de QA (2026-08-14)" e no item 1 trata SEC-1/SEC-2/SEC-5 como pendentes de correção (implícito pelo tom urgente), enquanto **`docs/STATUS.md` §1.1** (achados de segurança) já lista SEC-1, SEC-2 e SEC-5 como **✅ corrigido** em rodada posterior (referências a "rodada 9" dentro do próprio STATUS). `DEPENDE-DE-VOCE.md` não foi atualizado para refletir essas correções — **quem ler só esse arquivo vai achar que os buracos de autorização ainda estão abertos quando podem não estar** (ou pode ser que a correção do STATUS seja otimista — ver item 4).
4. **Autocontradição dentro do próprio `docs/STATUS.md` sobre SEC-3**: §1.2 lista SEC-3 como "✅ corrigido", mas um bloco de alerta logo abaixo (linhas 518-527) diz explicitamente **"ISSO CONTINUA VALENDO — o ✅ acima é otimista"**, porque o teste que sustenta a correção usa um `Map` em memória que não reproduz a condição de corrida real do KV. Ou seja, o próprio STATUS.md se autocorrige e classifica seu próprio ✅ como não confiável — tratar SEC-3 como **não resolvido de fato**, apesar do selo verde.
5. **`docs/STATUS.md` §2** registra uma correção de registro sobre o overlay Electron/desktop: a linha antiga dizia "overlay **funcional**" e isso "era falso desde sempre" (bug de payload `id` no body vs. query quebrava as 3 únicas ações do overlay 100% das vezes) — mas `docs/PLANO-DESKTOP-STEAM.md` foi escrito **com base na premissa de que o overlay funcionava**. Não verificado nesta varredura se `PLANO-DESKTOP-STEAM.md` já foi atualizado após a correção — **checar antes de usar esse plano para qualquer decisão de lançamento Steam**.
6. **`docs/PLANO-PRODUTO.md:9-38`** documenta explicitamente duas rodadas de autocorreção sobre o tamanho do onboarding (concluiu primeiro que eram 4 telas, depois corrigiu para ~12 telas reais, porque a primeira análise mediu só um arquivo em vez do fluxo completo). Não é uma contradição externa, mas é um sinal de que **medições anteriores no próprio repo já erraram por análise parcial** — vale replicar o cuidado ao ler qualquer "medição" em outros docs sem reverificar o caminho completo.
7. **Contagem de testes inconsistente entre entradas do STATUS.md**: menções a "379 → 600", "suíte 1143 → 1149", "1253/1253 verdes" em rodadas diferentes, sem uma linha do tempo clara de qual é a contagem atual — o número real de casos de teste no momento desta varredura não está determinável só pelos docs (a contagem de 58 *arquivos* de teste é medida diretamente no filesystem, mas não equivale a "quantos testes").

---

## 6. Pendências já declaradas pelo próprio projeto (as 10 mais relevantes)

Fonte primária: `docs/DEPENDE-DE-VOCE.md` (ordenado por impacto declarado) e `docs/STATUS.md` §3, com data de referência 14–19/08/2026. Note a contradição do item 3 da seção anterior antes de repriorizar.

1. 🔴 **Deploy manual do worker de push está pendente** — o nudge de cobrança das 21h foi removido do produto mas continua ativo em produção porque `workers/` não builda automaticamente no push (`DEPENDE-DE-VOCE.md:14-24`).
2. 🔴 **`FIREBASE_PROJECT_ID` não está ligado** — sem ele, toda autorização de save é um no-op; qualquer um pode ler/sobrescrever/corromper o save de qualquer jogador via e-mail conhecido. Ordem importa: só ligar depois de `VITE_FIREBASE_*` configurado (`DEPENDE-DE-VOCE.md:28-41`).
3. 🟠 **D1 `order_claims` não existe** + `PLAY_REQUIRE_ACCOUNT_BINDING` não ativado — sem isso, um recibo de compra pode virar N contas pagas (condição de corrida no KV eventualmente consistente). Marcado como o "maior risco de dinheiro que sobrou" mesmo com o ✅ otimista do STATUS (`DEPENDE-DE-VOCE.md:47-64`, `STATUS.md:518-527`).
4. 🔴 **Keystores Android vazadas no histórico do git** (`bubblewrap_build/android.keystore`, `signing.keystore`) — removidas do HEAD mas recuperáveis por qualquer clone; decisão de rotacionar chave ou reescrever histórico é do dono (`DEPENDE-DE-VOCE.md:68-75`).
5. 🟡 **Balanceamento da carga diária** — 4 propostas (P1-P4) aguardando decisão do dono, vindas de teste com usuários reais ("nem todo dia consigo fazer as 6 tarefas") — a mais recomendada (P4, presets de rotina) não muda regra (`DEPENDE-DE-VOCE.md:101-125`).
6. 🟡 **`minSdkVersion = 24` é promessa que o app não cumpre** — usa CSS/JS moderno que exige Chromium 111+; Play Store oferece o app a quem não consegue rodá-lo. Decisão de subir para ~30 é do dono (`DEPENDE-DE-VOCE.md:81-91`).
7. 🟠 **Decidir se a Fase 4 do plano de evolução (sensores via Health Connect) vale o custo** — exige conta de organização verificada no Play (bloqueador se a conta for pessoal), declaração de health app, política de privacidade dedicada e consentimento LGPD art. 11 específico. Decisão explicitamente adiada até a Fase 3 (Janela de Descanso, já em produção sem sensor) provar que move retenção (`STATUS.md:711-716`, `CLAUDE.md` menções de Passos/Pesadelos de 19/08).
8. 🔴 **Itens de lançamento na Play Store** — registrar pacote no Firebase, criar os 4 produtos no Play Console, conta de serviço, URL de política de privacidade, formulário de Segurança de Dados (`DEPENDE-DE-VOCE.md:141-150`).
9. 🔴 **Itens de lançamento na Steam** — conta Steamworks (US$100), App ID/Depot ID, arte da loja, build a partir de máquina Windows (`DEPENDE-DE-VOCE.md §3.3`).
10. 🟠 **Reroll por Créditos = resultado aleatório pago com dinheiro real** — risco regulatório sob a Lei 15.211/2025 (ECA Digital), atenuado por todo pet ser mecanicamente equivalente; pode bastar deixar isso explícito na tela (`DEPENDE-DE-VOCE.md:132-137`, `STATUS.md:698`).

---

## 7. Lacunas para o briefing — o que as fontes NÃO respondem

- **Usuários reais / métricas de uso.** Há menção a "teste com usuários" e "5 personas do público" (adolescente com TDAH, pai com 3 min/dia etc.) em `STATUS.md`, mas nenhum dado quantitativo de base instalada, retenção real, DAU/MAU ou funil de conversão medido em produção. `PLANO-PRODUTO.md` admite textualmente que uma auditoria anterior "produziu opinião com aparência de diagnóstico" por falta de telemetria — **não há evidência de que telemetria de produção exista ou esteja sendo coletada hoje** (há `src/utils/telemetry.test.ts`, mas não confirma coleta ativa nem dashboard).
- **Métrica de sucesso do produto.** Não há um documento que declare explicitamente "sucesso é X" (ex.: retenção D30, conversão free→pago, NPS). O que existe são princípios qualitativos ("nunca um cobrador", guardrails de design), não KPIs.
- **Modelo de negócio / monetização, além dos mecanismos já implementados.** `CLAUDE.md` documenta o que os Créditos/Bits/compras fazem tecnicamente, mas não há um plano de negócio (preço, LTV esperado, CAC, projeção) nas fontes lidas — `BILLING-SETUP.md` não foi lido em profundidade e pode conter parte disso; verificar antes de assumir que não existe.
- **Restrição regulatória além do ECA Digital citado.** LGPD é mencionada pontualmente (Health Connect, dados sensíveis de sono), mas não há um mapeamento regulatório completo (ex.: Play Store Data Safety, COPPA/idade mínima do usuário, termos de uso revisados por jurídico).
- **Donos por disciplina.** Os docs falam de "o dono" no singular (decisões de produto/negócio) e citam papéis funcionais dentro dos runs de QA (ex.: "Cartógrafo de Telas" em `INVENTARIO-TELAS.md`), mas não há um organograma ou RACI — não dá para saber se há mais de uma pessoa além do "dono" único mencionado em toda a documentação, nem quem responde por design, backend, ou compliance como função contínua.
- **Estado real da marca / design system consolidado.** Há evidência de um redesign recente (paleta teal/cobre, mascote corvo, kit pixel-art, `docs/PLANO-DESIGN.md`, `docs/INVENTARIO-TELAS.md`), mas nenhum documento único de identidade de marca (tom de voz, guidelines de uso do mascote, brandbook). `PLANO-DESIGN.md` não foi lido em profundidade nesta varredura — é a leitura mais provável para preencher essa lacuna, mas pode ainda ser só plano tático de UI, não marca.
- **A 5ª peça do ecossistema ("Besti-rio-")** — citada várias vezes em `docs/STATUS.md` e no `README.md` do teste-personalidade como repositório canônico do bestiário, com PRs próprios (#3, #5, #8) e branch `claude/canonical-classification` pendente de merge — não estava no escopo de fontes deste run e não há cópia local. Se o próximo run precisar entender o bestiário a fundo, este repo (não mapeado) precisa entrar no escopo.

---

## 8. As 3 leituras que mais economizam tempo (nesta ordem)

1. **`D:\Soulmon\repo\CLAUDE.md`** — é a fonte da verdade operacional: regras de jogo completas, fluxo de deploy, o que é herança do DigiApp vs. o que é Soulmon de verdade. Sem ele, qualquer leitura de código corre risco de reinventar regra já decidida.
2. **`D:\Soulmon\repo\docs\STATUS.md`** — registro vivo com segurança, estado do produto e "depende de você"; é o único lugar que amarra decisões recentes (19/08/2026) e as autocorrige em público (inclusive contradizendo o próprio ✅ em SEC-3). Ler por inteiro, incluindo os alertas ⚠️ inline — eles corrigem o texto acima deles.
3. **`D:\Soulmon\repo\docs\PLANO-PRODUTO.md`** — é o documento que já fez o trabalho de auto-crítica sobre onboarding/funil e reflete o estado mais atual (19/08/2026) do raciocínio de produto; qualquer proposta nova de UX deveria começar checando se essa mesma pergunta já foi feita e corrigida aqui.

Evitar como ponto de partida (mas não descartar do repo): `README.md`, `PROJETO.md`, `docs/00-START-HERE.md`, `docs/DOCS-INDEX.md`, `docs/BACKLOG.md` — todos descrevem o projeto predecessor (DigiApp), não o Soulmon.
