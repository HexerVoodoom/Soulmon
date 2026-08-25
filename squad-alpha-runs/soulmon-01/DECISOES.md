# Decisões do dono — run `soulmon-01` · 2026-08-25

> Respostas dadas diretamente pelo dono nesta sessão. **Substituem os defaults do HANDOFF.md**
> onde houver conflito. Toda squad despachada daqui em diante recebe este arquivo.

---

## 🔴 CORREÇÃO DE CONTEXTO — a mais importante do run

O `contexto.md` §1 afirma **"app em produção e com jogadores reais"**, derivado de
`CLAUDE.md:69-70` e `CLAUDE.md:13-15`. **Está errado.**

| Fato corrigido | Fonte |
|---|---|
| **Soulmon tem ZERO usuários reais além do dono.** Só o dono, em teste. | dono, 25/08/2026 |
| **DigiApp tem exatamente 2 usuários: o dono e a namorada dele.** Foi piloto do Soulmon; os dois usam ativamente **até o Soulmon ficar pronto**. | dono, 25/08/2026 |

### O que isso inverte

1. **A exposição de saves deixa de ser incidente.** Vira dívida técnica com prazo: fechar antes
   de existir qualquer usuário de terceiro. Rebaixada de 🔴🔴 para 🔴-com-prazo.
   **Nenhum dado de terceiro está exposto.** Não há evento a comunicar a ninguém.
2. **A trava "não quebrar o save de quem já joga" (`CLAUDE.md:13-15`, §10.2) muda de natureza.**
   Não é mais "não posso arriscar usuários anônimos"; é "preciso combinar com 2 pessoas que eu
   conheço". Renomear `DIGIAPP_SAVES` e trocar a URL passam a ser **possíveis e baratos agora** —
   com coordenação, não com migração cega. ⚠️ Mas os 2 usuários do **DigiApp** são reais e ativos:
   quebrar o DigiApp ainda é quebrar o app que duas pessoas usam hoje.
3. **`soulmon-02` encolhe muito.** Deixa de ser operação de alto risco sobre base viva.
4. **Toda a "fronteira A" do `requisitos.md`** ("obrigatório para continuar em produção hoje")
   perde urgência de incidente e vira "obrigatório antes do primeiro usuário de terceiro".
5. **Não existe baseline a extrair.** O `alpha-analista-comportamento` propôs contar `ent:`/`ord:`
   no KV para o numerador de conversões: o número é o do próprio dono. Sem valor diagnóstico.

**Ação:** `contexto.md` §1, §3, §5 e §10 precisam ser reescritos. Registrado como pendência.

---

## Respostas às 8 perguntas do HANDOFF

| # | Resposta | Origem |
|---|---|---|
| **P1** | **TODOS os quatro** (A+B+C+D) → programa de 4 runs (`PROGRAMA.md`) | dono |
| **P2** | **A** — mergear `claude/canonical-classification` na main do Bestiário, ref → `origin/main` | dono |
| P3 | C — "assim que os 🔴 fecharem" | default |
| P4 | B — não há telemetria coletando | default |
| P5 | A — pode criar CI de `tsc`+`vitest` | default |
| P6 | B — reverificar SEC-1/2/5 no código *(feito: ver `security-escopo-e-reverificacao.md`)* | default |
| P7 | B — não há assessoria jurídica | default |
| P8 | B — Steam/desktop fora de escopo | default |

## Decisões tomadas nesta sessão

| # | Tema | Decisão | Consequência |
|---|---|---|---|
| D-01 | Exposição de saves | **Consertar junto com a separação do DigiApp** | Vira a **fatia 1 de `soulmon-02`** ("separar + ligar a autorização"), como o `alpha-product-manager` recomendou. Não vira run novo. |
| D-02 | Houve acesso indevido? | **Não** — poucos jogadores e ninguém sabe da falha. *(Depois refinado: zero usuários de terceiro.)* | Nenhuma comunicação a usuário. Nenhuma resposta a incidente. |
| D-03 | Repositório | **Público hoje**, será tornado privado "quando estiver pronto" | Keystores no histórico são recuperáveis por qualquer clone **agora**. Ver D-11. |
| D-04 | Modelo de negócio | **Primeiro se bancar. Depois de validado e testado, quer lucro.** | O veredito de unit economics é o favorável: 4–17 unlocks/mês cobrem os fixos; a economia **não é o gargalo hoje**. Aquisição e conversão só viram problema nº 1 na fase de lucro. |
| D-05 | Reroll pago aleatório | **Implementar a mitigação de tela e seguir** — dono assume o risco sem revisão jurídica | `alpha-redator-ux` escreve o texto de equivalência mecânica. Não remove a mecânica. |
| D-06 | Idade mínima | **18+** | Exige gate de idade no app. Governa reroll pago e anúncio. Coerente com a única faixa com fonte (18–35, `PLANO-TAREFAS.md:206`). ⚠️ `privacidade.html:111-115` diz "13" — **precisa ser corrigido**. |
| D-07 | Termos e política | **Criar Termos e mostrar ambos no onboarding**, antes da coleta de nome e data de nascimento | Trabalho de `alpha-redator-ux` + `alpha-frontend`. Fecha E5. |
| D-08 | Billing inexistente | **Dívida — era pra funcionar** | Item obrigatório de `soulmon-04`. Explica por que nenhuma das 3 teses tem dado: **nunca houve funil de compra para medir**. |
| D-09 | Consertos de 1 linha | **Todos os 4 autorizados**: teto do dreno de cocô · apagar `tasksDone` + gate de `pvpEnabled` · corrigir selos falsos do `STATUS.md` · alinhar `privacidade.html` | Squad aplica **sem esperar run**. Cada um com teste de regressão. |
| D-10 | `generate-sprite` sem checar tier | **O código está errado — deveria checar o `accountTier`** | Squad adiciona a checagem. A tese nº 3 (custo de IA por usuário pago) passa a ter denominador real. |
| D-11 | Keystores | **Gerar keystore nova antes do primeiro envio à Play** | Não reescreve histórico do git. A keystore vazada nunca assina nada publicado. Item obrigatório de `soulmon-04`. |
| D-12 | Cap do demo (`DEMO_ACTIVITY_DAILY_CAP = 1`) | **Proposital, mas quer revisar** | `alpha-growth`/`alpha-comportamento` avaliam mover a paywall (limitar o **diferencial** em vez do **cuidado**) e trazem experimento falseável. Não mexer antes disso. |
| D-13 | Anúncio recompensado | **Desligar agora — custa zero** (SDK ainda não existe) | Fecha o caminho anúncio→crédito→aleatório antes que exista. Coerente com 18+ e com a essência anti-cobrador. |
| D-14 | Ler dados reais no KV | **Autorizado** — mas irrelevante: os dados são do próprio dono | Nenhuma extração de baseline tem valor diagnóstico. Ver correção de contexto. |
| D-15 | North star | **Squad propõe definição de "usuário ativo" e alvo v1; dono aprova** | Derivar de `activityLog`/`completedTasks`, que já são persistidos. Entregar no próximo checkpoint. |
| D-16 | Exclusão/exportação de dados | **Antes do lançamento (`soulmon-04`)** | Coerente: sem usuário de terceiro, não há direito a exercer hoje. |
| D-17 | CI de `tsc`+`vitest` | **Em `soulmon-02`, junto com a infra** | ⚠️ Os consertos de D-09 entram **sem** rede de segurança automática. Squad roda o gate manual (`CLAUDE.md:27-33`) e cola a saída. |
| D-18 | Rastreador de tarefas | **GitHub Issues** | Destrava o `alpha-delivery-ops`, que estava proibido de agir por §8 `[a definir]`. |
| D-19 | `soulmon-user-researcher.md` | **Corrigir — reescrever com o alvo certo** | Não aposentar. Preserva o raciocínio útil com a evidência corrigida (o alvo é o **pago**, não o demo). |
| D-20 | `minSdkVersion = 24` | **Subir para o que realmente funciona** (garantir Chromium 111+) | Squad determina a versão. Perde alcance nominal, ganha avaliação na loja. |

## Decisões de produto esclarecidas pelo dono

### DP-01 — Geração de sprite é **incremental sob demanda**, não em lote

Enunciado do dono (25/08/2026):

> Gerar a fase Rookie (1) e a fase 2. E só quando faltar **1 dia** para a próxima fase, gerar
> ela — **a branch mais provável de evoluir**. Pode ter uma segurança: se 2 ou mesmo as 3
> estiverem empatadas, gerá-las por segurança.

**Consequência:** `generateAllSprites` (o único chamador é `OraclePage.tsx:259`, página sem
entrada na navegação) **não é o caminho certo abandonado — é uma abordagem diferente da
pretendida**. A squad **não deve "consertar" essa função**; deve especificar e implementar a
geração incremental acima. O corpo sorteado por hash em `App.tsx:3045-3050` é o placeholder que
essa implementação substitui.

Cabe a `alpha-product-designer` (estados e momento da geração) + `alpha-architect` (custo,
cache, o que acontece se a geração falhar na véspera da evolução) + `alpha-backend`.

### DP-02 — 🔴 Propagação viva dos repos irmãos (**conflita com decisão documentada**)

Enunciado do dono (25/08/2026):

> Pode clonar. Mas eu gostaria de poder **atualizar o Bestiário e isso refletir no Soulmon** —
> mesma coisa com `class-system` e `teste-personalidade`.

**Tensão real, não mal-entendido.** `contexto.md` §8 registra a decisão oposta, e o motivo:
o Soulmon builda para APK/Cloudflare com `dist/` **commitado**, e o typecheck estrito **não pode
depender do `tsconfig` de outro repo**. Por isso o Bestiário entra por **snapshot commitado**
(`pool.json`) e não por dependência viva.

**Não decidido aqui.** Vira **ADR** para o `alpha-architect`, que deve avaliar ao menos:
sincronização automatizada por CI (bot abre PR quando o canônico muda) · dependência npm fixada
por SHA · endpoint publicado pelo Bestiário lido em runtime com fallback para o snapshot.
Cada uma com o custo sobre build, offline e typecheck.

---

## Pendências que continuam abertas (nenhum agente pode fechar)

- 🟠 **Q3 — o que declarar no formulário de Segurança de Dados** sobre os eixos derivados de
  psicometria que vão ao servidor. A squad pode **propor** o texto; a declaração é do dono.
- 🟡 §1 — existe CNPJ / conta de organização verificada no Play?
- 🟡 §5 — orçamento.
- 🟡 Q6 — TTL de 365 dias no save: decisão de retenção ou efeito colateral?
