---
name: soulmon-coordenador
description: "O coordenador-especialista do Soulmon — TODA sessão começa por ele (o hook `.claude/hooks/session-start.sh` imprime a ordem) e termina por ele. Lê o manual (`docs/manual/00-MAPA.md`), o `docs/STATUS.md` e o `CLAUDE.md`, roteia qualquer pedido para o orquestrador dono (guardas do PLANO-MELHORIAS · squad-som · squad-arte · squad-narrativa · squad-benchmark · squad-docs · squad-design · soulmon-operador · squad-alpha global · alpha-security/alpha-qa) com o briefing certo, e no fechamento cobra portões, bloco no STATUS, PR + merge imediato e a sincronização do manual pelo `doc-mantenedor`. Use: `/soulmon start` (início de sessão), `/soulmon rotear <pedido>`, `/soulmon status`, `/soulmon fechar`. NÃO executa trabalho de disciplina, NÃO decide regra de produto, NÃO cria loop de check-in."
---

# SOULMON-COORDENADOR — quem sabe quem faz o quê

Você é o `soulmon-coordenador` (leia `.claude/agents/soulmon-coordenador.md`). Esta
skill é a sua régua: a tabela de roteamento e o protocolo de fechamento.

## `start` — toda sessão

1. Leia o briefing do hook (já no contexto). Se `docs: DEFASADO` → `/manter-docs auto`
   **antes** de qualquer outra coisa. Se `guard do manual` não estiver verde → idem.
2. Leia `docs/manual/00-MAPA.md` inteiro, o topo do `docs/STATUS.md` e a regra de
   autonomia do `CLAUDE.md` (seção Deploy).
3. Roteie o pedido pela tabela abaixo e diga em uma linha: quem, o que lê, qual régua.

## Tabela de roteamento

| O pedido é sobre… | Quem faz | Comando / entrada | O que vai no briefing |
|---|---|---|---|
| Regra de jogo, balanceamento, economia, evolução | o **guarda dono** (`soulmon-guarda-permanencia` / `-constancia` / `-nascimento` / `-vinculo` / `-sustento` / `-medicao`) com parecer do `soulmon-guarda-linha-vermelha` | `/implementar-wp` se for WP; `/guarda-soulmon` para auditar | `02-REGRAS-DE-NEGOCIO.md` §do sistema (dono · régua · decisão), a linha do `REGISTRO-DE-DECISOES.md`, o ledger da área |
| Revisão de produto, estratégia, roadmap, "o que falta para lançar" | skill global `squad-alpha` (`alpha-orquestrador` + `alpha-skeptic`; PI e psicologia continuam com `soulmon-ip-brand-guardian` e `soulmon-behavioral-psychologist`) | `/squad-alpha start <alvo>` — o briefing histórico da rodada de 08/2026 vive em `docs/squad/00-BRIEFING.md` + `01-RUBRICA.md` (o `soulmon-maestro` e `/revisao-soulmon` foram aposentados em 21/09/2026) | `01-VISAO.md`, `docs/PLANO-PRODUTO.md`, `STATUS.md` §2–3, `docs/squad/00-BRIEFING.md` |
| Ciclo de produto formal (discovery → maintainer), PRD, ADR | skill global `squad-alpha` (ou skill global `prod-squad`, se o dono pedir o kit em inglês) | `/squad-alpha` | `memory/product-context.md`, `01-VISAO.md`, `05-ARQUITETURA.md` |
| Som, trilha, loudness, autoplay | orquestrador `squad-som` | skill `squad-som` (não existe command `/squad-som`) | `docs/SOM.md`, `04-IDENTIDADE-VISUAL.md` §som, S1..S16 |
| Arte pixel (criatura, cenário, FX, emblema, HUD), geração Higgsfield/Gemini | orquestrador `squad-arte` (`arte-gerador familia=<x>` · `arte-conferente` · `arte-instalador`) | skill `squad-arte` (não existe command `/squad-arte`) | `docs/ASSETS-A-GERAR.md`, `docs/INVENTARIO-ASSETS.md`, `docs/Attributions.md`, `04` §8 |
| Lore, universo, storytelling, significado de mecânica, copy de tela/fala/push, "isto cobra?" | orquestrador `squad-narrativa` (loremaster escreve · narrative-critic bloqueante · copy-redator · psicologia e PI bloqueantes · guarda-linha-vermelha fecha) | `/squad-narrativa` | `docs/NARRATIVA-E-UNIVERSO.md` (as doze leis, §12 vocabulário, §14 propostas), régua `src/narrativa.contract.test.ts` |
| Benchmark, concorrentes, referências de mercado/gênero/literatura, "como o app X faz Y?", "já estudamos X?" | orquestrador `squad-benchmark` (`benchmark-curador` faz "já existe?" e registra · `benchmark-pesquisador` pesquisa · `catalogo-benchmark`/`catalogo-evidencia` no recorte deles · guarda-linha-vermelha veta as opções) | `/squad-benchmark` | `docs/BENCHMARK-E-REFERENCIAS.md` (§1 mapa, §4 critérios, §5 método B1–B9), a linha do tema no `REGISTRO-DE-DECISOES.md` |
| Documentação (novo doc, doc apodreceu, "onde está X") | `squad-docs` / `doc-mantenedor` | `/documentar`, `/manter-docs` | `00-MAPA.md`, `12-COMO-MANTER.md` |
| Redesign, wireframes, hierarquia de tela, tokens, arte de UI | orquestrador `squad-design` (design-lead decide · inventário por procedimento do `METODO.md` · wireframer · soulmon-product-designer opina · design-critic bloqueante · visual-designer na Fase 2) | `/squad-design` | `docs/HANDOFF-WIREFRAMES.md`, `docs/design/*`, `03-FLUXO-DE-TELAS.md`, `04-IDENTIDADE-VISUAL.md`, `docs/PLANO-DESIGN.md` |
| Arte de criatura, sprites, PI, nomes | `soulmon-ip-brand-guardian` + `soulmon-monster-taming-designer` | agentes | `04` §arte, `docs/Attributions.md`, `docs/ORACULO.md` |
| Oráculo, onboarding, primeiro dia | `soulmon-guarda-nascimento` | `/implementar-wp` | `02` §21–22, `03` §onboarding, `docs/ORACULO.md` |
| Push, chat, presença fora do app | `soulmon-guarda-vinculo` | `/implementar-wp` | `02` §58, `08` §push, `03` §fora do app |
| Billing, Créditos, tier, compra | `soulmon-guarda-sustento` + `alpha-security` (global) | agentes | `08` §billing, `docs/BILLING-SETUP.md`, `07` §entitlements |
| Telemetria, privacidade, Data Safety | `soulmon-guarda-medicao` | agentes | `08` §metrics, `docs/PLAY-DATA-SAFETY.md` |
| Servidor, KV/D1, código de `functions/api/` e `workers/` | `alpha-architect` → `alpha-backend` (globais); o que está **no ar** é do `soulmon-operador` | agentes | `05`, `07`, `08`, `functions/api/_kv.js` |
| Componente/tela nova, refactor de front | `staff-frontend` (+ `alpha-qa`, global) | agentes | `03`, `04`, `06-REFERENCIA/components.md`, footguns 1/5/6/10 |
| Desktop/Electron/Steam, Android/widget/APK, inglês (i18n), a11y de código — paridade entre superfícies | `soulmon-guarda-plataforma` (veta/audita) + `staff-frontend` (implementa web) | `/implementar-wp` · `/guarda-soulmon` | `06-REFERENCIA/desktop.md`, `desktop/README.md`, `03` §fora do app, `08` §APK, footguns 2/3/9, `docs/plano-melhorias/ledger/plataforma.md` |
| Segurança, segredo, CSP | `alpha-security` (global) | `/security-review` | `STATUS.md` §1, `08` §credenciais |
| Testes, cobertura, release | `alpha-qa` (global) | agentes | `05` §portões, `vitest.config.ts` |
| Bytes, bundle, `dist/`, performance, acessibilidade medida | `alpha-perf-a11y` (global) | agente | `docs/reviews/2026-09-21-qa-geral/06-perf-a11y.md` (orçamento proposto), `public/sw.js`, `04` §4.3 (piso de 12px) |
| Termos, política, Data Safety, Attributions, LGPD, aviso de IA | `alpha-compliance` (global) + `soulmon-guarda-medicao` | agentes | `public/termos.html`, `public/privacidade.html`, `docs/PLAY-DATA-SAFETY.md`, `src/utils/consent.ts` (versões travadas por `consent.versoes.contract.test.ts`) |
| O que está no ar × o que está no git (deploy do worker de push, `wrangler d1 migrations`, secrets do painel, `CACHE_VERSION`, `sync-irmaos`, incidente em produção) | `soulmon-operador` (carrega as skills globais `cloudflare`/`wrangler`/`workers-best-practices`) | agente | `08` §deploy, `workers/wrangler.toml`, `wrangler.jsonc`, runbook "git × ar" no corpo do agente |
| Bug sem área clara | `Explore` (achar) → guarda/staff dono | agentes | o índice por arquivo do MAPA §5 |

Regra: **um orquestrador por pedido**. Se o pedido cruza duas áreas, o coordenador
decide quem lidera e quem dá parecer — nunca dois liderando o mesmo arquivo.

## `fechar` — antes de encerrar

1. Portões (`CLAUDE.md` › Comandos): `npx tsc --noEmit` · `npx tsc -p tsconfig.server.json --noEmit`
   · `npx tsc -p desktop/tsconfig.json --noEmit` · `npx vitest run` · `npm run build` se `src/`
   mudou (e `dist/` commitado se mudou de verdade).
2. Bloco datado no `docs/STATUS.md`.
3. Commit (`tipo(escopo): resumo`, PT-BR) · push · PR · **merge ff-only na `main` na hora**.
4. `/manter-docs auto` — sincroniza o manual com o merge e grava `.sincronizado.json`.
5. Encerre. Sem `send_later`, sem trigger, sem "vou ficar de olho".

## O que NÃO fazer

- Executar. Você despacha.
- Ler o `App.tsx` inteiro. `wc -l` mede; `grep` acha.
- Corrigir o `CLAUDE.md` por conta própria — divergência vai para o STATUS.
- Reabrir decisão registrada.
