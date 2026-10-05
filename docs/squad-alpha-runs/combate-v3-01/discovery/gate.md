# Gate — Discovery REABERTA (progressão), run `combate-v3-01`, 05/10/2026

> O gate anterior está em `_superseded/gate-v1.md`. Os spikes da F1 estão em `prototyper/_superseded/` (evidência).

## Veredito
**CONCERNS. A arquitetura de camadas é viável, mas não fecha como está.** Há 1 FATAL numérico, fixável com uma regra de HP. Há 1 FATAL de escopo/decisão, e esse é do dono.

## Agentes (7): curador, benchmark, backend (spike + 1 passe), compliance, architect, skeptic
Escala: a proposta toca economia, PvP e linhas vermelhas, por isso entraram todos os críticos.

## Artefatos
- `discovery/dossie-progressao.md`
  - O **Vínculo já é o level de usuário**: derivado, nunca desce, gate PvP Vínculo ≥5.
  - Os invariantes dele são "só cosmético" e "escada de gates é grind".
  - **Créditos→Bits→chips de atributo já é um furo hoje.**
  - O XP hoje é ~50/50.
- `discovery/benchmark-progressao.md`
  - Paridade de mercado: conta separada da criatura; PvP normalizado (GW2, VGC); moeda paga só cosmética.
  - Diferencial provável: teto de level preso a hábito real.
- `discovery/spike-level.md`
  - Curva multiplicativa k=8 + limite de concentração X≤45%.
  - Teto do código `FORM_REQUIREMENTS.cap` 6/13/21/30/40.
  - Prova de vermelho: X=1 → REPROVA.
- `discovery/arquitetura-camadas.md`: ADR-rascunho de 4 camadas, um dono por regra, quase tudo derivado. Talento e equipamento só no PvE. PvP normalizado no teto do estágio.

## Self-grade
| Dimensão | Nota | Evidência |
|---|---|---|
| Evidência | 🟢 | dossiê símbolo a símbolo; spike executado com vermelho; benchmark com fonte (várias `[indício]`) |
| Risco | 🟢 | FATAIS nomeados com refutação |
| Decisão | 🔴 | 9 decisões do dono (D1–D9) |
| Mensurabilidade | 🟡 | metas fixas (gap ≤10%, +1 level ≥2%, DEF ≤40 s); a meta de XP 66/34 não tem critério |
| Caminhos de falha | 🟡 | level que desce × semFomo sem copy |
| Executabilidade | 🟡 | MVP não declarado |

## Objeções
| # | Objeção | Sev. | Estado |
|---|---|---|---|
| F1 | Teto derivado não testado | FATAL | **re-sim feito:** gap −1,3% ✔, DEF 34,4 s ✔, **+1 level +1,7% ✖** (o level de HP no estágio 4); nenhum X resolve; a saída é uma regra de HP (não testada) |
| F2 | direto2 −8,3% no L1 | FATAL | **resolvida:** é artefato da régua em luta curta (com HP×3 dá 0,0%); o motor está correto; a régua precisa de uma regra para luta curta |
| F3 | X≤45% + PvP normalizado esvazia o level | FATAL de decisão | **parcialmente refutada:** no PvE, do level mínimo ao teto do estágio o TTK cai 16–26% (>5%); no PvP o level não conta (decisão do dono) |
| X1 | Vínculo × invariantes 3/§6 | FIXÁVEL | dono (D7/D8) |
| X2 | 5 sistemas, 9 decisões, sem MVP | FIXÁVEL | proposta de MVP abaixo |
| X3 | XP 66/34 sem critério | FIXÁVEL | dono |
| X4 | furo Créditos→chips hoje | FIXÁVEL | dono, **separado do v3** |
| X5 | "Level 8→5" é punitivo | FIXÁVEL | dono (D3) |
| C | equipamento com Bits/Honra proibido como está; XP por contagem de tarefas proibido (#16), por esforço ok; copy de gates via semFomo; Renascimento pago+level | requisitos/lacunas | dono |

## MVP proposto (ordem barato → caro)
1. Regra de luta curta na régua + regra de HP do level.
2. Camada 1: soulXP → level com teto → pontos → X_MAX.
3. Camada 4: PvP normalizado no teto do estágio; `duelStats` já é por estágio.
4. Especiais (das F1 anteriores).
5. Depois: talentos e gates (exige D7/D8).
6. Por último: equipamento e moeda (exige D1).

**Não-objetivos do MVP:** equipamento, Comércio, novos gates.

## Verificação executável
`node cv3-sim4.mjs` → fecha com X≤0,45 (teto 10/20/…), REPROVA com `--red`. `node cv3-sim4.mjs --cap-code --p1` → +1 level +1,7% REPROVA; direto2 com HP×3 = +0,0%. Saída em `spike-level.md`.

## Maior risco sobrevivente
O escopo explodiu: 5 sistemas e 9 decisões, num produto sem usuários. Sem um corte de MVP, o combate v3 trava em decisões de economia (D1/D8) que não são do combate.

## Pendências → dono (contexto §9)
D1 Créditos→Bits→chip/equipamento · D2 5% no PvP · D3 level que desce · D4 XP 66/34 e por esforço · D5 Comércio · D6 Renascimento · D7 gates × "escada é grind" · D8 reescrever invariante 3 do Vínculo · D9 "45% ainda é build?" · regra de HP do level · regra de luta curta na régua.

## Decisão do checkpoint (05/10/2026): CONTINUAR
Ver contexto §2.8. A recomendação de corte para MVP foi rejeitada (escopo total, sequenciado). 5% no PvP aceito conscientemente.
