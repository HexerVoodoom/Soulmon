# Handoff — run `soulmon-01` (SQUAD-Alpha)

> Escrito em 2026-08-25. Abre uma sessão nova focada só no Soulmon.
> Status do run: **checkpoint** — contexto resolvido, Fase 0 **não** iniciada.
> O que trava o início: as respostas de **P1** e **P2** (as outras têm default utilizável).

## Onde está tudo

| Artefato | Caminho |
|---|---|
| Bloco de contexto (§1–§10 + 8 perguntas) | `D:\Soulmon\repo\squad-alpha-runs\soulmon-01\contexto.md` |
| Dossiê bruto do curador | `D:\Soulmon\repo\squad-alpha-runs\soulmon-01\dossie-contexto.md` |
| State do run | `D:\Soulmon\repo\squad-alpha-runs\state\soulmon-01.json` |
| Repo | `D:\Soulmon\repo` — github.com/HexerVoodoom/Soulmon |

Nada foi commitado. `squad-alpha-runs/` está untracked no repo.

## Como retomar

```
/squad-alpha resume
```

Se o `resume` não achar o run, use: `/squad-alpha fase discovery` apontando o workdir
`D:\Soulmon\repo\squad-alpha-runs` e o run-id `soulmon-01`.

## O que a sessão nova NÃO precisa redescobrir

**Fonte da verdade do repo, nesta ordem:** `CLAUDE.md` → `docs/STATUS.md` (19/08) →
`docs/PLANO-PRODUTO.md` → `docs/PLANO-EVOLUCAO.md` (benchmark ago/2026).

⚠️ **Armadilha de onboarding:** `README.md`, `PROJETO.md`, `docs/00-START-HERE.md`,
`docs/DOCS-INDEX.md` e `docs/BACKLOG.md` descrevem o **DigiApp**, o projeto predecessor —
não o Soulmon. Quem seguir "leia o README primeiro" lê o projeto errado.

**O que é:** v-pet de produtividade em que a criatura é gerada do perfil psicométrico do
usuário. Em produção com jogadores reais, **não lançado em loja nenhuma**.

**Essência declarada (rege toda decisão de regra):** o Soulmon é um avatar que evolui COM o
usuário e o encoraja — **nunca um cobrador**. As regras de jogo no `CLAUDE.md` documentam o
porquê de cada uma e o modo de falha que evitam. Não reinventar.

**Stack:** React 18 + TS + Vite 6 (web/PWA) · Capacitor 8.4 (Android, CI próprio) ·
Electron (`desktop/`, CI próprio) · Cloudflare Pages Functions + Worker (worker é **deploy
manual**) · KV · Supabase · Groq (chat IA) · Vitest (58 arquivos de teste, **sem CI rodando
`tsc`/`vitest` em PR**) · i18n pt-BR/en-US.

**Regra de processo do repo:** `CLAUDE.md` manda abrir PR e **mergear na hora** quando
`tsc`/`vitest`/`build` estiverem limpos, sem esperar aprovação. Não criar loop de check-in.

## Os 4 riscos de topo (já verificados, não re-litigar)

1. **Infra ainda é do DigiApp** — URL de produção `digiapp-a5e.pages.dev`, KV `DIGIAPP_SAVES`,
   projeto Firebase compartilhado. `CLAUDE.md:57-61` **proíbe trocar sozinho**: trocar antes de
   existir um projeto Pages próprio com todas as variáveis derruba o app. Ordem segura em
   `docs/SEPARACAO-DIGIAPP.md`.
2. **Selo verde de segurança não confiável** — `STATUS.md:518-527` se autocorrige sobre SEC-3:
   *"o ✅ acima é otimista"*. SEC-1/2/5 estão contraditórios entre `STATUS.md` (✅) e
   `DEPENDE-DE-VOCE.md` de 14/08 (abertos). **Todos tratados como NÃO resolvidos.**
3. **Nenhuma métrica é legível** — `PLANO-PRODUTO.md:88`: *"um north star que ninguém consegue
   medir é um slogan"*. As 3 teses do negócio (conversão ≥3%, D30 ≥12%, custo de IA ≤R$8) não
   têm dado. **Enquanto P4 não for respondida, é proibido produzir afirmação quantitativa** —
   todo achado de produto vira hipótese rotulada. O repo registra que uma auditoria anterior
   já caiu nessa.
4. **O pipeline do Oráculo depende de uma branch não mergeada de outro repo** — a classificação
   canônica vive em `claude/canonical-classification` no Bestiário; a `main` de lá só tem
   `tags`. `export-canonico.mjs` (provedor) e `sync-oracle-data.mjs` (consumidor) usam essa
   branch como ref **default**. Se sumir ou divergir, o `pool.json` para de refletir o canônico
   **sem erro visível**. É a P2.

## O ecossistema (4 repos)

```
teste-personalidade ──(formato/vocabulário)──► Soulmon ◄──(npm dep real, ida e volta)──► Class-System
                                                  ▲                github:HexerVoodoom/Class-System
                                                  │
                            Besti-rio- ──[npm run sync:oracle-data]──► pool.json (snapshot)
                            github.com/HexerVoodoom/Besti-rio-
```

- **Besti-rio-** = "Bestiário Interdimensional" (Pokémon, Digimon, D&D, fauna real, variantes)
  + Laboratório de Fusão. Publicado: https://bestiario.mateus-sprnd.workers.dev.
  O próprio `export-canonico.mjs` declara: *"o uso principal deste repositório é servir de
  PROVEDOR DE DADOS para o pipeline do oráculo do Soulmon; a UI humana é secundária."*
- **Contrato de elegibilidade** (compartilhado pelos dois lados): `classificacaoConfianca ===
  'alta'` && descrição real && `elementos` não-vazio (família é **opcional**).
- **Por que snapshot commitado e não dependência git:** o Soulmon builda para APK/Cloudflare
  com `dist/` commitado e o typecheck estrito não pode depender do tsconfig de outro repo.
  Decisão consciente e documentada. Atualizar = `npm run sync:oracle-data` com os clones irmãos
  em `../Class-System` e `../Besti-rio-`.
- **Grau de acoplamento:** *integrado de verdade* = Class-System (há `cascata.parity.test.ts`
  contra o motor real) · *snapshot* = Bestiário · *só vocabulário* = teste-personalidade
  (duplica cálculo que o Soulmon também faz em `derivedElements.ts`/`axes.ts`/`numerology.ts`).

## Dois usuários opostos — proibido fundi-los

| Perfil | Realidade |
|---|---|
| **Demo** | 4 telas. **Não recebe o diferencial** — o produto tem o diferencial construído e não o entrega |
| **Pago** | 8 telas do ritual do Oráculo, R$ 29,90 |

Otimizar para um degrada o outro. Densidade e tolerância a fricção são opostas.

## Marca / §7

**A lane de marca NÃO abre.** O design system é **canônico**: `PLANO-DESIGN.md:3-5` decide e
não reabre — tokens, fronteira diegética "O Visor", tipografia e critério de merge, sobre base
medida de 114 superfícies. **Ressalva:** `INVENTARIO-TELAS.md:21` admite que nenhuma afirmação
sobre aparência foi de fato medida (o screenshot falhou).

## As 8 perguntas (responder antes de abrir a Fase 0)

| # | Pergunta | Default se não responder |
|---|---|---|
| **P1** 🔴 | Que resultado faz o run valer a pena? **A** destravar lançamento · **B** tornar as 3 teses mensuráveis · **C** auditar e priorizar · **D** separar do DigiApp | **C** — define o roster inteiro |
| **P2** 🔴 | Mergear `claude/canonical-classification` na main do Bestiário? **A** mergear + ref `origin/main` · **B** travar por SHA · **C** não tocar | **A** — única que remove o modo de falha silencioso |
| P3 | Existe data-alvo de lançamento? | **C** — "assim que os 🔴 fecharem" |
| P4 | Existe telemetria coletando hoje? | **B** — não (⇒ proibido afirmar número) |
| P5 | A squad pode criar CI de `tsc`+`vitest` em PR? | **A** — sim |
| P6 | SEC-1/2/5: o ✅ do `STATUS.md` é confiável? | **B** — reverificar no código |
| P7 | Há revisão jurídica disponível (ECA Digital, LGPD, termos)? | **B** — não há assessoria |
| P8 | Steam/desktop entra no escopo? | **B** — não (o overlay nunca funcionou fim-a-fim) |

**P1 e P2 são as que travam.** As outras seis podem rodar no default, com a suposição declarada
no artefato da fase.

## Lacunas que só o dono fecha

§1 estágio/organização formal · §3 ICP e personas (`[EM ABERTO]` na própria fonte) ·
§4 métricas · §5 orçamento e prazo · §9 donos por disciplina além do dono único ·
§10 o que está fora do escopo deste run.
