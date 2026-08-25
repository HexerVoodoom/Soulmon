# Bloco de contexto — Soulmon (run `soulmon-01`)

> Fonte única da verdade do run. Preenchido pelo `alpha-briefer` a partir das 3 fontes
> (respostas do usuário · docs apontados · repositório atual), nesta ordem.
> **O dono não estava disponível na resolução** — nenhuma resposta humana entrou aqui.
> Todo campo abaixo é **evidência citada de arquivo** ou `[a definir]`. Nada foi inferido
> de conhecimento geral do setor. As perguntas que o dono precisa responder estão no fim,
> em "Perguntas para o dono (responder antes da Fase 0)".

| Meta | Valor |
|---|---|
| Resolvido em | 2026-08-24 |
| Modo do run | `validar o que já existe` |
| Fontes usadas | `squad-alpha-runs/soulmon-01/dossie-contexto.md` · `CLAUDE.md` · `docs/STATUS.md` (19/08/2026) · `docs/PLANO-PRODUTO.md` (19/08/2026) · `docs/PLANO-EVOLUCAO.md` · `docs/SEPARACAO-DIGIAPP.md` · `docs/PLANO-DESIGN.md` (19/08/2026) · `docs/INVENTARIO-TELAS.md` (19/08/2026) · `docs/BILLING-SETUP.md` · `docs/PLANO-TAREFAS.md` · `docs/DEPENDE-DE-VOCE.md` (14/08/2026) · `docs/reviews/2026-08-03/soulmon-user-researcher.md` |
| Fonte **verificada** (localizada após o dossiê) | Repositório do **Bestiário** = `github.com/HexerVoodoom/Besti-rio-` (o acento mangled no nome é o motivo de não aparecer em busca por "bestiario"). Clonado e lido: é o provedor canônico das criaturas do oráculo. Ver §8 — inclui risco 🔴 de branch não mergeada. |
| Lacunas abertas | §1 (estágio/organização formal) · §3 (ICP e personas — `[EM ABERTO]` na própria fonte) · §4 (nenhuma métrica é legível hoje) · §5 (orçamento e prazo) · §9 (donos por disciplina além do dono único) · §10 (escopo fora do run) · acesso ao repo do Bestiário |
| Correção de dossiê aplicada | O dossiê §3 afirma que o bestiário "NÃO é repo separado". **Está errado** (autoridade do dono): o bestiário **é repo separado e canônico**; `src/utils/soulProfile/bestiary/pool.json` é apenas um **snapshot** dele. |

---

## §1 Organização

Projeto **solo**, sob a conta GitHub `HexerVoodoom` (`CLAUDE.md:37` — "Repositório:
`HexerVoodoom/Soulmon`"). Não há empresa, time ou organograma declarado em nenhuma fonte:
toda a documentação fala de **"o dono"** no singular, e `docs/PLANO-PRODUTO.md:100` assume
explicitamente a condição de **"um dev solo"** ao decidir onde não competir.

**Estágio: pré-lançamento com produto construído.** Evidência convergente:
- `package.json` versão `0.1.0`, `name: "soulmon"` (dossiê §4);
- app **em produção e com jogadores reais**: `CLAUDE.md:69-70` exige bump de `CACHE_VERSION`
  "senão usuários ficam presos em cache velho", e `CLAUDE.md:13-15` mantém `DIGIAPP_SAVES`
  de propósito "porque renomear quebraria o save de quem já joga";
- porém **não lançado nas lojas**: os itens de lançamento Play Store e Steam continuam
  abertos em `docs/DEPENDE-DE-VOCE.md:141-150` e §3.3.

`[a definir]` — se existe CNPJ / conta de organização verificada no Play (isso é
**bloqueador** da Fase 4 de sensores, `docs/PLANO-TAREFAS.md:186`).

## §2 Alvo do run

**Soulmon** — app de produtividade gamificado do gênero v-pet, onde o usuário cuida de uma
criatura **única, gerada do seu próprio perfil psicométrico**, que evolui conforme tarefas e
hábitos reais são cumpridos (`CLAUDE.md:3-6`; `docs/PLANO-PRODUTO.md:63`).

Frase-core literal do produto (`docs/PLANO-PRODUTO.md:63`):
> "O Soulmon é uma criatura única no mundo — gerada de quem você é — que só cresce quando
> você cuida da sua vida real, e que te encoraja. Ela nunca vira um cobrador, um medidor de
> culpa, nem um score."

Escopo do run: **validar o que já existe**, não propor produto novo.

## §3 Usuário(s)

⚠️ **Há dois perfis com necessidades opostas dentro do produto hoje. É proibido tratá-los
como um só usuário em qualquer entregável deste run.**

| Perfil | Quem é | Condição de uso | O que precisa |
|---|---|---|---|
| **Usuário demo (grátis)** | Entra por `intro → objetivo → luta → escolher 1 de 3 personagens → jogar` — **4 telas** (`docs/PLANO-PRODUTO.md:18`), com `DEMO_PICK` (`INVENTARIO-TELAS.md:276`). Tarefas limitadas. | Chega sem investimento, sem pet próprio | Ver valor em minutos. **O diferencial (pet único) não é entregue a ele** — `soulmon-user-researcher.md:68-69`: "o produto tem o diferencial construído e não o entrega" |
| **Usuário pago (`paid`)** | Percorre o ritual do Oráculo (**8 telas** de onboarding hoje, eram 13; `docs/PLANO-PRODUTO.md:55`), gera pet próprio, tarefas ilimitadas. R$ 29,90 (`docs/BILLING-SETUP.md:81`) | Já converteu ou está convertendo | Unicidade, profundidade (galhos, masmorra, torneio, estações) |

Otimizar onboarding para o pago encurta o funil do demo; otimizar para o demo esvazia o
ritual que é o motivo de compra. **São tensões opostas — nomeie sempre qual dos dois um
achado atende.**

Condições de uso medidas/declaradas:
- **Plataformas simultâneas**: web/PWA, APK Android (o APK carrega a URL de produção —
  `CLAUDE.md:63-66`) e overlay Electron desktop.
- **Idioma**: sempre pt-BR **e** en-US, nunca só um (`CLAUDE.md:5-6`).
- **Faixa etária de risco declarada**: `docs/PLANO-TAREFAS.md:206` afirma que "o público do
  Soulmon está inteiro na faixa de risco" de 18–35 anos para estresse por apps de métrica.
  É a única afirmação de faixa etária com fonte no repo.
- **Android antigo**: `minSdkVersion = 24` oferece o app a aparelhos que não conseguem
  rodá-lo (exige Chromium 111+) — `docs/DEPENDE-DE-VOCE.md:81-91`.

`[a definir]` — **ICP primário, secundário e anti-persona**: a própria fonte que deveria
respondê-los está com os anexos marcados **`[EM ABERTO]`**
(`docs/reviews/2026-08-03/soulmon-user-researcher.md:71-87`). Não há personas escritas, nem
dado de base instalada, DAU/MAU ou funil medido em produção. Ver P4.

## §4 Métrica-norte + métricas de entrada

**North star declarada** (`docs/PLANO-PRODUTO.md:77`):
> "peso de esforço real concluído por usuário ativo por semana"

Métricas de suporte (`docs/PLANO-PRODUTO.md:81-86`):

| Métrica | Alvo v1 | Estado |
|---|---|---|
| % da semana 2 com ≥1 conclusão real em ≥4 dos 7 dias | — | não medida |
| Retenção D7 / D30 | 25% / 12% *(estimativa)* | não medida |
| Conversão demo→pago em 14 dias | ≥3% *(estimativa)* | não medida |
| Retorno após ausência ≥2 dias | — | métrica-assinatura da tese anti-cobrança; não medida |

As três teses que decidem o negócio (`docs/PLANO-PRODUTO.md:227-231`): conversão demo→pago
≥ 3% · D30 ≥ 12% · custo de IA por usuário pago ≤ R$ 8.

⚠️ **Fato mais duro deste contexto**, literal em `docs/PLANO-PRODUTO.md:88`:
> "**Nenhuma dessas é legível hoje.** É o achado mais duro da rodada 2: um north star que
> ninguém consegue medir é um slogan."

E `docs/PLANO-PRODUTO.md:227`: "O produto vive ou morre por três números, e nenhum é legível
hoje." Existe `src/utils/telemetry.test.ts`, mas **nenhuma fonte confirma coleta ativa em
produção nem dashboard** (dossiê §7). Qualquer agente que produzir diagnóstico quantitativo
neste run está produzindo opinião — o próprio `PLANO-PRODUTO.md` registra que uma auditoria
anterior "produziu opinião com aparência de diagnóstico" por falta de telemetria.

## §5 Restrições duras

- **Stack obrigatória**: ver §8. Não é escolha aberta — é o que está construído e em produção.
- **Infra compartilhada com o DigiApp — risco estrutural nº 1.** URL de produção ainda é
  `digiapp-a5e.pages.dev`, namespace KV `DIGIAPP_SAVES`, projeto Firebase comum
  (`CLAUDE.md:8-15`). `CLAUDE.md:57-61`: **"Não troque isso sozinho"** — só depois de existir
  projeto Pages próprio com todas as variáveis reconfiguradas (passo 1 de
  `docs/SEPARACAO-DIGIAPP.md`); trocar antes **derruba o app**. Chaves de localStorage e o
  binding KV são mantidos de propósito: renomear quebra o save de quem já joga.
- **Regra de autonomia de processo** (`CLAUDE.md:43-53`, "vale para toda sessão, sem
  exceção"): com `tsc`/`vitest`/`build` limpos, abre-se o PR e **faz-se o merge na hora**,
  sem esperar aprovação do dono. Proibido criar loop de check-in reagendado. Única exceção
  legítima: bloqueio real e documentado que só o dono pode resolver — nesse caso, avisar o
  dono **uma única vez**.
- **Gate de qualidade manual** (`CLAUDE.md:27-33`): `npx tsc --noEmit`, `npx vitest run`,
  `npm run build` antes de todo commit. `dist/` **é commitado**.
- **Deploy do worker é manual** (`CLAUDE.md:67-68`): `workers/` não builda no push da `main`;
  exige `wrangler deploy` local. Isso é hoje uma pendência 🔴 aberta do dono
  (`docs/DEPENDE-DE-VOCE.md:14-24`).
- **Cache**: mudança incompatível em asset/HTML exige bump de `CACHE_VERSION` em
  `public/sw.js` (`CLAUDE.md:69-70`).
- **Regra de ouro de game design** (`docs/PLANO-PRODUTO.md:68`): todo parâmetro ou é
  alimentado por tarefa real cumprida, ou gasta recurso que veio de tarefa real.
- **Armadilha de onboarding documental** — `README.md`, `PROJETO.md`, `docs/00-START-HERE.md`,
  `docs/DOCS-INDEX.md` e `docs/BACKLOG.md` **descrevem o DigiApp, não o Soulmon** (dossiê
  §5.1-2). Nenhum agente deste run pode usá-los como fonte.

`[a definir]` — **orçamento** e **prazo/data-alvo de lançamento**. Nenhuma fonte declara
qualquer um dos dois. Ver P1 e P3.

## §6 Restrição regulatória / política

Só o que está documentado:

- **Lei 15.211/2025 (ECA Digital)** — o **Reroll por Créditos** é resultado aleatório pago
  com dinheiro real. Atenuante declarado: todo pet é mecanicamente equivalente (é identidade,
  não poder); a mitigação sugerida é deixar isso explícito na tela
  (`docs/DEPENDE-DE-VOCE.md:132-137`, `docs/STATUS.md:698`).
- **LGPD art. 11** — sono e passos são dado sensível; exigem consentimento **específico e
  destacado por finalidade**; `docs/PLANO-TAREFAS.md:187` afirma que checkbox dentro dos
  Termos é **juridicamente inválido**. Aplica-se se a Fase 4 (Health Connect) for adiante.
- **Health Connect / Play** — declaração de health app, política de privacidade dedicada e
  **conta de organização verificada** (enforcement de jan/2026; se o publisher for conta
  pessoal, é **bloqueador**) — `docs/PLANO-TAREFAS.md:186`.
- **Play Store**: política de privacidade obrigatória, escrita e linkada
  (`docs/BILLING-SETUP.md:194`, `:209` — `public/privacidade.html`); formulário de Segurança
  de Dados ainda **pendente** (`docs/DEPENDE-DE-VOCE.md:145`).
- **Direitos autorais**: sprites/nomes Digimon já removidos e registrados em
  `docs/Attributions.md` (resolvido 09/08/2026).

**Segurança — estado real, não o selo:**

| Item | Selo | Estado a assumir neste run |
|---|---|---|
| SEC-1 / SEC-2 / SEC-5 | ✅ em `STATUS.md`, mas tratados como abertos em `DEPENDE-DE-VOCE.md` (14/08) | **Contraditório entre fontes** — não afirmar resolvido sem reverificar no código. Ver P6 |
| **SEC-3** | ✅ verde em `STATUS.md` §1.2 | **NÃO resolvido.** O próprio `docs/STATUS.md:518-527` diz: *"ISSO CONTINUA VALENDO — o ✅ acima é otimista"* — o teste usa `Map` em memória e não reproduz a corrida real do KV |
| `FIREBASE_PROJECT_ID` desligado | 🔴 | Toda autorização de save é no-op: qualquer um lê/sobrescreve o save de qualquer jogador com e-mail conhecido (`DEPENDE-DE-VOCE.md:28-41`) |
| D1 `order_claims` inexistente + `PLAY_REQUIRE_ACCOUNT_BINDING` desligado | 🟠 | "Maior risco de dinheiro que sobrou": um recibo pode virar N contas pagas (`DEPENDE-DE-VOCE.md:47-64`) |
| Keystores Android no histórico do git | 🔴 | Removidas do HEAD, recuperáveis por qualquer clone. Rotacionar ou reescrever histórico é decisão do dono (`DEPENDE-DE-VOCE.md:68-75`) |

`[a definir]` — idade mínima declarada do usuário, termos de uso revisados por jurídico,
COPPA/Famílias da Play. Nenhuma fonte responde.

## §7 Marca e voz

**Estado do design system: CANÔNICO.** A lane de marca **não precisa abrir** para criar
identidade — ela já foi decidida. `docs/PLANO-DESIGN.md:3-5` é explícito: *"Este documento
**decide**. Ele não lista alternativas, não pede escolha do dono e não reabre o que já foi
decidido. Quem discorda abre um PR contra este arquivo."* Datado 19/08/2026, com dono
declarado ("o Líder de Design") e base factual medida (`docs/INVENTARIO-TELAS.md`, 114
superfícies).

O que já está fechado e **não se reabre neste run** (`docs/PLANO-DESIGN.md:19-42`):
- **Fronteira diegética "O Visor"**: pixel art só **dentro** do visor do aparelho v-pet;
  tudo fora é o aparelho (SVG limpo, Material Symbols Rounded, tipografia legível). As duas
  linguagens **nunca se misturam na mesma superfície**.
- **Geometria**: bisel 20px · tela interna 12px · anel de cobre 4px · interior do visor
  sempre escuro nos dois temas · `image-rendering: pixelated` em escala inteira · grid 4px.
- **Paleta**: ciano-turquesa é a única luz forte; cobre envelhecido; petróleo. **Token de
  tinta ≠ token de fill** por acento (`--sm-ciano-fill` / `--sm-ciano-ink` / `--sm-ciano-on`,
  idem cobre; `--sm-petroleo-900` idêntico nos dois temas).
- **Tipografia**: Silkscreen = voz do dispositivo (só dentro do visor e em selos; ≥14px;
  CAIXA ALTA; nunca frase inteira) · Fredoka = títulos · Rubik = texto e dado
  (`tabular-nums`).
- **Ícones**: Material Symbols Rounded variável; eixo `FILL` 0→1 é o sistema de estado;
  `wght` 500. **Ícone nunca dentro de box**; seleção na nav = sublinhado ciano.
- **Movimento**: `steps()` dentro do visor, curvas contínuas 120/200/320ms fora;
  `prefers-reduced-motion` obrigatório.
- **Teste de aceitação da identidade** (vale como critério de merge): recorte 200×200px de
  qualquer tela, sem logo — se não dá para dizer que é o Soulmon, não está pronto.

**Voz — a regra que rege todas as outras** (`CLAUDE.md:17-21`, essência de
`docs/PLANO-EVOLUCAO.md`): o Soulmon é *"um avatar que evolui COM o usuário e o encoraja —
nunca um cobrador"*. Cláusula negativa endurecida em `docs/PLANO-PRODUTO.md:69-71`: **nem
score**, porque "o jeito mais comum de virar cobrador não é punir, é *medir*" — score de
sono, streak e ranking absoluto já foram recusados por esse motivo. O Soulmon nunca deve
virar: paywall recorrente sobre cuidado, app de métricas de desempenho, ou gacha.

Isso tem consequência mecânica verificável em `CLAUDE.md:76`: teto de 1 coração perdido por
dia; ausência ≥2 dias não cobra nada; segunda devolve 0,5 coração. As regras documentam o
**porquê**, não só o quê — não reinventar.

**Ressalva de confiança**: `docs/INVENTARIO-TELAS.md:21,25-38` declara que **nenhuma
afirmação sobre aparência foi medida** (screenshot falhou; tudo por DOM). O que existe é
mapa de presença/ausência, não avaliação visual. Toda crítica visual deste run precisa
declarar se olhou a tela de verdade.

`[a definir]` — brandbook/guidelines de uso do mascote corvo e tom de voz escrito fora do
`CLAUDE.md`. Não existe documento único de identidade de marca.

## §8 Stack e ambiente

- **Web/PWA**: React 18 + TypeScript + Vite 6.3.5 (`@vitejs/plugin-react-swc`), Tailwind v4,
  Radix UI/shadcn. `src/index.css` é o **único** CSS empacotado (footgun 1 do
  `PLANO-DESIGN.md`). Service worker em `public/sw.js` (`CACHE_VERSION` v24).
- **Android**: Capacitor 8.4, app id `com.hexervoodoom.soulmon` (mudou de
  `com.digipartner.digiapp`; `docs/BILLING-SETUP.md:6-25` — **o build Android FALHA de
  propósito** até o pacote novo ser registrado no Firebase). CI próprio:
  `.github/workflows/android-build.yml`.
- **Desktop**: Electron em `desktop/`, CI próprio `.github/workflows/desktop-build.yml`.
  ⚠️ O overlay **nunca funcionou fim-a-fim**, apesar de documentado como funcional
  (`docs/STATUS.md` §2 corrige o registro); `docs/PLANO-DESKTOP-STEAM.md` foi escrito sob a
  premissa falsa de que funcionava.
- **Backend**: Cloudflare Pages Functions (`functions/api/`) + Cloudflare Worker com cron
  (`workers/`, **deploy manual**, pendência 🔴 do dono). KV para saves/push/entitlements.
  Supabase. Auth Firebase (parcialmente desligada, §6).
- **IA**: Groq (chat). Custo de IA por usuário pago é uma das 3 teses do negócio (≤ R$ 8).
- **Testes**: Vitest + `@vitest/coverage-v8`. **58 arquivos de teste** em `src/` (medido).
  A contagem de *casos* citada em `STATUS.md` é inconsistente entre rodadas (379→600,
  1143→1149, 1253) — **não usar número de casos como fato**.
- **CI — buraco declarado**: só existem os dois workflows de build (Android, desktop).
  **Não há CI rodando `test`/`typecheck` em PR web** — a garantia depende de disciplina
  manual, apesar de `CLAUDE.md:43-53` autorizar merge automático "com tsc/vitest/build
  limpos". Ver P5.
- **i18n**: pt-BR + en-US, sempre os dois (`language === 'pt-BR'`).
- **Rastreador de tarefas**: `[a definir]`. Não há Jira/Linear declarado; o backlog vive em
  markdown (`docs/STATUS.md`, `docs/DEPENDE-DE-VOCE.md`, `docs/PLANO-EVOLUCAO.md`).
  ⚠️ `alpha-delivery-ops` **não age** enquanto isso não for declarado.
- **Analytics**: `[a definir]` — nenhuma ferramenta de analytics de produção identificada.

### O ecossistema — 4 repositórios, fluxo em uma direção

```
teste-personalidade (Next.js, repo separado)
   onboarding + questionário de 20 itens → Big Five/HEXACO + mapa astral + numerologia
        │  produz SoulProfile (JSON)
        │  ── contrato de FORMATO, não API viva: roda 100% no navegador do outro app
        ▼
Soulmon (React/TS, este repo) — src/utils/soulProfile/ é o hub
   profile.ts recebe o SoulProfile → pipeline.ts orquestra
        │
        ├─► class-system  (REPO SEPARADO — dependência npm real
        │   "class-system": "github:HexerVoodoom/Class-System", package.json:40)
        │   17 elementos, 79 arquétipos, 6 escolas, 65 talentos, cascata geracional
        │   chamado por import dinâmico em ficha/buildSheet.ts
        │   ◄── devolve ficha por estágio + skills reais + classe
        │       (integração de verdade; há cascata.parity.test.ts contra o motor real)
        │
        ├─► Bestiário — github.com/HexerVoodoom/Besti-rio- (REPO SEPARADO E CANÔNICO)
        │   "Bestiário Interdimensional": criaturas de múltiplos universos (Pokémon,
        │   Digimon, D&D, fauna/flora real, variantes geradas) + Laboratório de Fusão.
        │   App publicado: https://bestiario.mateus-sprnd.workers.dev (CF Worker + Assets,
        │   deploy automático via Git integration do dashboard da Cloudflare).
        │   ── fluxo: Bestiário ──[npm run sync:oracle-data]──► snapshot local
        │      src/utils/soulProfile/bestiary/pool.json (amostra ESTRATIFICADA:
        │      cobre todos os elementos, famílias e tamanhos, com descrição real)
        │   select.ts escolhe a criatura por linhagem (proximidade de espécie entre estágios)
        │   Superfície de máquina do provedor: scripts/export-canonico.mjs, que declara
        │      "o uso principal deste repositório é servir de PROVEDOR DE DADOS para o
        │      pipeline do oráculo do Soulmon; a UI humana é secundária".
        │   Contrato de elegibilidade compartilhado pelos dois lados:
        │      classificacaoConfianca === 'alta' && descrição real && elementos não-vazio
        │      (família é OPCIONAL — metade das variantes de confiança alta não tem).
        │   🔴 RISCO ESTRUTURAL — a classificação canônica (elementos/família/biologia)
        │      vive na branch NÃO MERGEADA `claude/canonical-classification`; a `main` do
        │      Bestiário só tem `tags`. Os DOIS scripts (export-canonico.mjs e
        │      sync-oracle-data.mjs) usam essa branch como ref DEFAULT. Branch confirmada
        │      no remoto. Se for deletada, renomeada ou divergir, o sync quebra em
        │      silêncio. Ver P2.
        │
        └─► oracle.ts (metade "criativa", não tocada pela fusão)
            gera nome, prompt de sprite e descrição. Usa a inspiração do bestiário só
            como TEXTO (nunca o nome) e a classe do class-system só no PROMPT DE IMAGEM
            (nunca em texto visível ao jogador).
```

**Direção do dado**: `teste-personalidade → Soulmon` (por formato, unidirecional) ·
`Soulmon → class-system → Soulmon` (chamada real, ida e volta) ·
`Bestiário → Soulmon` (sincronização unidirecional; o Soulmon nunca escreve no Bestiário).

**Grau de acoplamento**: *integrado de verdade* = class-system. *Sincronizado por snapshot*
= Bestiário (risco: snapshot pode divergir do canônico sem ninguém notar). *Acoplado só por
vocabulário* = teste-personalidade (duplica cálculo que o Soulmon também faz em
`derivedElements.ts`/`axes.ts`/`numerology.ts`/`astrology/`). **Risco de versão**: o
`class-system` é fixado pelo branch default do repo remoto, sem commit travado visível —
mudança upstream pode alterar comportamento silenciosamente entre installs.

## §9 Donos por disciplina

Todas as fontes falam de **"o dono"**, sempre no singular. **Não há organograma nem RACI no
repositório** e nenhum é inventado aqui.

| Disciplina | Dono |
|---|---|
| Produto | **O dono** (único) |
| Design | **O dono**. `docs/PLANO-DESIGN.md:3` cita um papel "Líder de Design", mas é **papel funcional de agente dentro de um run de QA**, não pessoa — igual ao "Cartógrafo de Telas" de `INVENTARIO-TELAS.md:3`. Não tratar como segunda pessoa. |
| Tech | **O dono** (dev solo — `docs/PLANO-PRODUTO.md:100`) |
| Negócio | **O dono** — `docs/DEPENDE-DE-VOCE.md` é inteiro endereçado a ele |
| Jurídico | `[a definir]` — nenhuma fonte indica assessoria jurídica. Hoje as decisões de ECA Digital / LGPD estão no colo do dono, sem revisão externa declarada. Ver P7. |

**Destino de toda pendência escalada neste run: o dono.** Formato esperado por ele já existe
e deve ser respeitado: `docs/DEPENDE-DE-VOCE.md`, ordenado por impacto, com 🔴/🟠/🟡.

## §10 Fora de escopo

Derivado do modo do run ("validar o que já existe") e das travas explícitas dos docs.
**Não confirmado pelo dono** — ver P8.

Não se toca neste run:
1. **Trocar a URL de produção / desacoplar do DigiApp na prática.** `CLAUDE.md:57-61`
   proíbe: "Não troque isso sozinho". Mapear e recomendar, sim; executar, não.
2. **Renomear `DIGIAPP_SAVES`, chaves de localStorage ou qualquer coisa que quebre o save
   de quem já joga** (`CLAUDE.md:13-15`).
3. **Reabrir decisões de `docs/PLANO-DESIGN.md`** — quem discorda abre PR contra o arquivo,
   não redecide dentro do run (`PLANO-DESIGN.md:3-5`).
4. **Reinventar regra de jogo** — a tabela de `CLAUDE.md:72+` é fonte da verdade e documenta
   o porquê de cada regra.
5. **Fase 4 do plano de evolução (Health Connect/sensores)** — decisão explicitamente adiada
   até a Fase 3 provar retenção (`docs/STATUS.md:711-716`).
6. **Rotação de keystore / reescrita de histórico do git** — decisão exclusiva do dono
   (`docs/DEPENDE-DE-VOCE.md:68-75`).
7. **Mudança de preço** — `docs/PLANO-PRODUTO.md:124`: "Não mexer no preço antes de ter
   funil medido".

`[a definir]` — se Steam/desktop entra no escopo deste run. Ver P8.

---

# Perguntas para o dono (responder antes da Fase 0)

Oito perguntas. Cada uma muda o que a squad faz. Se você não responder nenhuma, a squad roda
com os defaults da coluna 3 e **declara a suposição** em todo entregável.

### P1 — Qual é o resultado que este run precisa entregar para ter valido a pena?

| Opção | O que muda no run |
|---|---|
| **A. Destravar o lançamento** (fechar os 🔴 de Play Store/segurança) | Squad prioriza segurança, billing e checklist de loja. Produto/design entram só como consultores |
| **B. Tornar as 3 teses mensuráveis** (telemetria antes de qualquer opinião) | Run vira projeto de instrumentação: define eventos, implementa, e adia todo diagnóstico de produto para depois do dado |
| **C. Auditar o que existe e priorizar** (mapa honesto do estado, sem executar) | Run é diagnóstico amplo, entregável é uma lista priorizada, nenhum código de produto muda |
| **D. Separar do DigiApp** | Run vira execução da ordem de `SEPARACAO-DIGIAPP.md`, com risco máximo sobre saves de jogadores ativos |

**Default: C.** É o único compatível com "validar o que já existe" e com o fato de que
nenhuma métrica é legível hoje.
**Por que importa:** define o roster inteiro. A vale segurança+billing; B vale
dados+engenharia; C vale a squad larga; D vale infra.

### P2 — A classificação canônica do Bestiário vive numa branch não mergeada. Consertar neste run?

**Resolvido desde o dossiê:** o repo é `github.com/HexerVoodoom/Besti-rio-`, é acessível e foi
lido. A pergunta que sobra é outra, e é mais grave: `export-canonico.mjs` (provedor) e
`sync-oracle-data.mjs` (consumidor) usam como ref **default** a branch
`claude/canonical-classification`, porque a `main` do Bestiário só tem `tags`. Todo o pipeline
do Oráculo depende de uma branch não mergeada de outro repositório.

| Opção | O que muda no run |
|---|---|
| **A. Mergear a branch na `main` e trocar o ref default para `origin/main`** | Fecha o risco na raiz; entra como primeira story de infraestrutura do run e o Bestiário vira 4ª peça auditável estável |
| **B. Manter a branch e travar por SHA nos dois scripts** | Remendo consciente: o sync para de depender do nome da branch, mas a classificação canônica segue fora da main |
| **C. Não tocar nesta rodada** | Squad registra "divergência não verificável" como risco aberto em todo achado de geração de criatura |

**Default: A.** É a única que remove o modo de falha silencioso.
**Por que importa:** se a branch for deletada ou divergir, o `pool.json` para de refletir o
canônico **sem erro visível** — a criatura errada é gerada e ninguém percebe.

### P3 — Existe data-alvo de lançamento?

| Opção | O que muda no run |
|---|---|
| **A. Data firme (qual?)** | A squad corta tudo que não estiver no caminho crítico da data e entrega um plano datado |
| **B. Sem data — qualidade primeiro** | A squad pode recomendar reescrita/refatoração estrutural (ex.: separação do DigiApp bem feita) |
| **C. "Assim que os 🔴 fecharem"** | O run vira contagem de 🔴, e todo achado novo precisa se justificar contra "isso atrasa o lançamento?" |

**Default: C.** É o que `docs/DEPENDE-DE-VOCE.md` sugere na prática, sem afirmar.
**Por que importa:** decide se a squad propõe conserto profundo ou remendo consciente.

### P4 — Existe telemetria de produção coletando hoje?

| Opção | O que muda no run |
|---|---|
| **A. Sim (qual ferramenta? há dashboard?)** | A squad puxa número real e faz diagnóstico de verdade sobre funil e retenção |
| **B. Não, nada** | **Proibido** produzir qualquer afirmação quantitativa. Todo achado de produto vira hipótese explicitamente rotulada, e instrumentar vira recomendação nº 1 |
| **C. Existe evento sendo enviado, mas ninguém olha** | A squad primeiro descobre o que já se coleta antes de propor evento novo |

**Default: B.** `docs/PLANO-PRODUTO.md:88` diz que nenhuma métrica é legível hoje.
**Por que importa:** é a diferença entre a squad diagnosticar e a squad opinar — e o próprio
repo já registra que uma auditoria anterior confundiu as duas coisas.

### P5 — A squad pode criar um workflow de CI rodando `tsc` + `vitest` em PR?

| Opção | O que muda no run |
|---|---|
| **A. Sim, criem** | Primeira entrega do run; a regra de auto-merge de `CLAUDE.md:43-53` passa a ter gate real de verdade |
| **B. Não, o gate manual basta** | A squad registra o risco (auto-merge sem gate automatizado) e segue rodando os comandos à mão antes de cada commit |
| **C. Sim, mas sem auto-merge — só reportando** | CI informativo; merge continua manual |

**Default: A.** Custo baixo e diretamente ligado a uma regra de processo já declarada.
**Por que importa:** hoje "merge na hora com tsc/vitest limpos" depende de alguém lembrar de
rodar. É a maior alavanca de confiabilidade por unidade de esforço no repo.

### P6 — SEC-1, SEC-2 e SEC-5: o ✅ do `STATUS.md` é confiável?

| Opção | O que muda no run |
|---|---|
| **A. Sim, o `DEPENDE-DE-VOCE.md` é que está velho** | A squad atualiza o `DEPENDE-DE-VOCE.md` e foca em SEC-3 + entitlements |
| **B. Não sei — reverifiquem no código** | A squad gasta uma frente inteira reauditando os três antes de qualquer outra coisa |
| **C. Tratem todos como abertos** | Segurança vira a prioridade nº 1 do run e empurra o resto |

**Default: B.** SEC-3 já provou que o selo verde deste repo pode ser otimista
(`docs/STATUS.md:518-527` se autocorrige).
**Por que importa:** decide se a frente de segurança é uma linha de rodapé ou metade do run.

### P7 — Há alguma revisão jurídica disponível (ECA Digital, LGPD, termos)?

| Opção | O que muda no run |
|---|---|
| **A. Sim, há advogado/assessoria** | A squad produz um brief jurídico endereçado e para por aí — não opina sobre risco legal |
| **B. Não há nenhuma** | A squad só sinaliza risco com fonte e **nunca** conclui que algo é legal ou ilegal; contratar revisão vira recomendação explícita |
| **C. Sou eu que decido, sem assessoria** | Mesma postura de B, mas as pendências jurídicas entram no `DEPENDE-DE-VOCE.md` como decisão sua, com o trade-off escrito |

**Default: B.** Nenhuma fonte indica assessoria.
**Por que importa:** o Reroll pago (ECA Digital) e a Fase 4 (LGPD art. 11) são os dois pontos
onde um erro custa a loja inteira — e ninguém na squad é advogado.

### P8 — Steam/desktop entra no escopo deste run?

| Opção | O que muda no run |
|---|---|
| **A. Sim** | A squad precisa primeiro reverificar `PLANO-DESKTOP-STEAM.md`, que foi escrito sobre a premissa falsa de que o overlay funcionava |
| **B. Não — só web + Android** | Corta uma frente inteira; `desktop/` fica fora de toda análise |
| **C. Só registrar o estado, sem trabalhar nele** | Uma linha de achado, sem plano |

**Default: B.** O overlay nunca funcionou fim-a-fim (`docs/STATUS.md` §2), a Steam custa
US$ 100 ainda não pagos, e o caminho crítico documentado é a Play Store.
**Por que importa:** Steam é a frente mais cara e a mais distante do lançamento.

---

**Próximo passo:** o dono responde este bloco (ou deixa correr nos defaults) e o
`alpha-orquestrador` abre a Fase 0 do run `soulmon-01` com este arquivo como briefing de
todo agente despachado.
