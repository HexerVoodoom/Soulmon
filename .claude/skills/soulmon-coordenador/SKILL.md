---
name: soulmon-coordenador
description: "O coordenador-especialista do Soulmon — TODA sessão começa por ele (o hook `.claude/hooks/session-start.sh` imprime a ordem) e termina por ele. Lê o manual (`docs/manual/00-MAPA.md`), o `docs/STATUS.md` e o `CLAUDE.md`, roteia qualquer pedido para o orquestrador dono (soulmon-maestro · guardas do PLANO-MELHORIAS · squad-som · squad-docs · prod-squad · design-lead · security/qa) com o briefing certo, e no fechamento cobra portões, bloco no STATUS, PR + merge imediato e a sincronização do manual pelo `doc-mantenedor`. Use: `/soulmon start` (início de sessão), `/soulmon rotear <pedido>`, `/soulmon status`, `/soulmon fechar`. NÃO executa trabalho de disciplina, NÃO decide regra de produto, NÃO cria loop de check-in."
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
| Revisão de produto, estratégia, roadmap, "o que falta para lançar" | `soulmon-maestro` (14 especialistas) | `/revisao-soulmon` | `01-VISAO.md`, `docs/PLANO-PRODUTO.md`, `STATUS.md` §2–3 |
| Ciclo de produto formal (discovery → maintainer), PRD, ADR | `prod-squad` | skill `prod-squad` | `memory/product-context.md`, `01-VISAO.md`, `05-ARQUITETURA.md` |
| Som, trilha, loudness, autoplay | orquestrador `squad-som` | `/squad-som` | `docs/SOM.md`, `04-IDENTIDADE-VISUAL.md` §som, S1..S13 |
| Documentação (novo doc, doc apodreceu, "onde está X") | `squad-docs` / `doc-mantenedor` | `/documentar`, `/manter-docs` | `00-MAPA.md`, `12-COMO-MANTER.md` |
| Redesign, wireframes, hierarquia de tela, tokens, arte de UI | orquestrador `squad-design` (design-lead decide · cartógrafo mede · curador de padrões · wireframer · design-critic bloqueante · visual-designer na Fase 2) | `/squad-design` | `docs/HANDOFF-WIREFRAMES.md`, `docs/design/*`, `03-FLUXO-DE-TELAS.md`, `04-IDENTIDADE-VISUAL.md`, `docs/PLANO-DESIGN.md` |
| Arte de criatura, sprites, PI, nomes | `soulmon-ip-brand-guardian` + `soulmon-monster-taming-designer` | agentes | `04` §arte, `docs/Attributions.md`, `docs/ORACULO.md` |
| Oráculo, onboarding, primeiro dia | `soulmon-guarda-nascimento` | `/implementar-wp` | `02` §21–22, `03` §onboarding, `docs/ORACULO.md` |
| Push, chat, presença fora do app | `soulmon-guarda-vinculo` | `/implementar-wp` | `02` §58, `08` §push, `03` §fora do app |
| Billing, Créditos, tier, compra | `soulmon-guarda-sustento` + `security-architect` | agentes | `08` §billing, `docs/BILLING-SETUP.md`, `07` §entitlements |
| Telemetria, privacidade, Data Safety | `soulmon-guarda-medicao` | agentes | `08` §metrics, `docs/PLAY-DATA-SAFETY.md` |
| Servidor, KV/D1, deploy, workers, CI | `principal-architect` → `staff-backend` | agentes | `05`, `07`, `08`, `functions/api/_kv.js` |
| Componente/tela nova, refactor de front | `staff-frontend` (+ `qa-sweeper`) | agentes | `03`, `04`, `06-REFERENCIA/components.md`, footguns 1/5/6/10 |
| Desktop/Electron/Steam | `staff-frontend` + `principal-architect` | agentes | `06-REFERENCIA/desktop.md`, `desktop/README.md`, footgun 9 |
| Android/widget/APK | `staff-frontend` | agentes | `03` §fora do app, `08` §APK, footguns 2/3 |
| Segurança, segredo, CSP | `security-architect` | `/security-review` | `STATUS.md` §1, `08` §credenciais |
| Testes, cobertura, release | `qa-sweeper` | agentes | `05` §portões, `vitest.config.ts` |
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
