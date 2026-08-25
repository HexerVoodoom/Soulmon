# Briefing comum — Fase 0 (Discovery) · run `soulmon-01` · alvo **Soulmon**

**LEIA NESTA ORDEM, ANTES DE QUALQUER COISA:**
1. `D:/Soulmon/repo/squad-alpha-runs/soulmon-01/contexto.md` — **bloco de contexto §1–§10. É lei.**
2. `D:/Soulmon/repo/squad-alpha-runs/PROGRAMA.md` — as respostas P1–P8 do dono e o programa de 4 runs.
3. `D:/Soulmon/repo/squad-alpha-runs/soulmon-01/HANDOFF.md` — resumo dos 4 riscos de topo.
4. O template do seu artefato em `C:/Users/spera/.claude/skills/squad-alpha/templates/` e a
   barra em `C:/Users/spera/.claude/skills/squad-alpha/references/barra-de-qualidade.md`.

## Lente da fase
**"É problema e negócio real?"** — mas neste run o objetivo declarado (P1) é **C: auditar o que
existe e priorizar**. Modo do run: **validar o que já existe**, não propor produto novo.
Entregável do run é **mapa honesto + lista priorizada**. Nenhum código de produto muda nesta fase.

## Repositório
`D:/Soulmon/repo` (branch atual: `claude/gamification-games-analysis-lk2mok`).
**Fonte da verdade, nesta ordem:** `CLAUDE.md` → `docs/STATUS.md` → `docs/PLANO-PRODUTO.md` →
`docs/PLANO-EVOLUCAO.md`.

⚠️ **ARMADILHA:** `README.md`, `PROJETO.md`, `docs/00-START-HERE.md`, `docs/DOCS-INDEX.md` e
`docs/BACKLOG.md` descrevem o **DigiApp**, o projeto predecessor — **não o Soulmon**.
É proibido usá-los como fonte.

## Travas inegociáveis deste run
- 🚫 **P4=B — não existe telemetria coletando.** É **proibida qualquer afirmação quantitativa**
  sobre funil, retenção, conversão ou custo. Todo achado de produto sai rotulado `[hipótese]`
  com o experimento que a falsearia. O repo registra que uma auditoria anterior já "produziu
  opinião com aparência de diagnóstico" — não repita.
- 🚫 **Dois usuários opostos, proibido fundi-los:** *demo* (4 telas, **não recebe o
  diferencial**) e *pago* (8 telas do ritual do Oráculo, R$ 29,90). Otimizar para um degrada o
  outro. **Todo achado deve nomear a qual dos dois se aplica.**
- 🚫 **P6=B — o selo verde de segurança do `STATUS.md` não é confiável.** SEC-1/2/5 estão
  contraditórios entre fontes; SEC-3 é falso-positivo admitido pelo próprio doc
  (`STATUS.md:518-527`). Trate **todos como NÃO resolvidos** até reverificação no código.
- 🚫 **A lane de marca NÃO abre.** `docs/PLANO-DESIGN.md:3-5` é canônico e não se reabre.
- 🚫 **Fora de escopo** (contexto §10 + P8): trocar a URL de produção, renomear `DIGIAPP_SAVES`,
  reinventar regra de jogo, Fase 4 de sensores, rotação de keystore, mudança de preço,
  **Steam/desktop**.
- 🚫 **Essência que rege toda decisão:** o Soulmon é um avatar que evolui COM o usuário e o
  **encoraja — nunca um cobrador, nem um score**. Nenhuma recomendação pode violar isso.
- ✅ **P5=A** — a squad **pode** propor CI de `tsc`+`vitest` em PR (hoje não existe).
- ✅ **P2=A** — decisão do dono: mergear `claude/canonical-classification` na `main` do
  Bestiário e apontar a ref para `origin/main`. ⚠️ Os repos irmãos **não estão clonados**
  (`../Besti-rio-`, `../Class-System` ausentes) — isso é pendência para o dono, não invente.

## Regras de saída (barra de qualidade)
- **Evidência sobre asserção:** toda afirmação com `arquivo:linha` citado, ou marcada
  `[suposição]` / `[hipótese]`. Sem meio-termo.
- Toda lacuna de contexto vira **pergunta endereçada ao dono** (§9: o dono é único), no formato
  de `docs/DEPENDE-DE-VOCE.md` — ordenada por impacto, com 🔴/🟠/🟡.
- **Nunca afirme norma** que não esteja documentada no bloco de contexto.
- Declare no topo do artefato: *"P3–P8 respondidas por default do HANDOFF, não por escolha
  explícita do dono."*
- Escreva em **pt-BR**. Salve o artefato no caminho que o seu despacho indicar. Seja conciso:
  denso e citado vence longo.
