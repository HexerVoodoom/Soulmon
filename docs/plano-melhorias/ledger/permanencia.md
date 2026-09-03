# Ledger — guarda-permanência (WP4.1–4.8)

Dono: `soulmon-guarda-permanencia`. Anexo: `../F-conteudo.md`.
É o domínio com os números mais duros do plano — e o eixo mais fraco do produto.

| WP | O quê | Estado | Comando de verificação | Evidência |
|---|---|---|---|---|
| WP4.1 | Uma verdade para a evolução (`daysToEvolve` vira gate ou some) | `BLOQUEADO:D5` | `grep -q "evolveGateFor" src/types/progression.ts` (opção a) **ou** `! grep -q "daysToEvolve" src/types/progression.ts` (opção b); + teste que lê `FORM_REQUIREMENTS` e o gate e exige que concordem | hoje: gate é `.required` (4/5/5/6); `daysToEvolve` nunca lido |
| WP4.2 | Ultra sem degeneração forçada | `BLOQUEADO:D6` | teste que prova ultra alcançável **sem** `getPreviousForm` ser chamado | hoje exige HP=0 duas vezes |
| WP4.3 | Vínculo depois do nível 13 | `PROPOSTO` | `node -e "…bondRewardFor(20)"` ≠ null; teste até L31; nenhuma recompensa duplica item da loja | `bondRewardFor` → null ≥ L14; 9/12 são duplicatas |
| WP4.4 | Estações cíclicas | `PROPOSTO` | teste: `currentSeason()` ≠ null para qualquer data 2026–2036 | `SEASONS` expira 2027-02-27 |
| WP4.5 | Sumidouro recorrente de Bits | `PROPOSTO` | teste: vitrine muda com `currentSeason()`; nenhum item novo tem efeito mecânico | catálogo esgota D15–D23 |
| WP4.6 | Álbum de formas vividas + Encontros (molde `DreamDex`) | `PROPOSTO` | `test -f src/components/BestiaryPage.tsx` + teste "Abismo nunca rende mais Bits/andar que o andar 5" + `MAX_FLOORS` mora em `dungeon.ts` | ⚠️ evidência corrigida em 02/09: **não há roster de 60** — 6 linhas × 4 artes (`DUNGEON_LINE_SPRITES`); WP4.6 vira Álbum de formas vividas + Encontros (G→M), Abismo adiado |
| WP4.7 | Missões semanais repetíveis | `PROPOSTO` | `test -f src/utils/weeklyMissions.ts` + teste de sorteio determinístico por semana + teste "nenhuma missão premia contagem de itens" | 6 missões de alvo único hoje |
| WP4.8 | "Memórias" aos 30/90 dias + card | `PROPOSTO` | `test -f src/utils/shareCard.ts` + render test | — |
| WP4.9 | Corrigir "roster de 60" nas 3 fontes + comentário `progression.ts:57-59` | `PROPOSTO` | `grep -rn "60 nomes" docs/plano-melhorias` → 0; teste `getDungeonEnemySprite` ∈ `DUNGEON_LINE_NAMES` | erro do plano, pego pela guarda |
| WP4.10 | Datar coleções (`formReachedAt`, `rest.dreamDates`) | `PROPOSTO` | `grep -n "formReachedAt\|dreamDates" src/contexts/GameStateContext.tsx src/utils/restWindow.ts` ≥ 2 | Mobbin D7 |
| WP4.11 | **E3** perfil do amigo sem métrica (#21) | `PROPOSTO` | grep `rank\|tasksDone` em `LibraryPage.tsx`/`PlayerDetailModal.tsx` → 0 | vetado no código hoje |
| WP4.12 | **E4** missão bloqueada sem 🔒 + `0/N` | `PROPOSTO` | render test da aba Missões sem `0/` | vetado no código hoje |
| WP4.13 | **E5** faixa do Torneio lifetime (nunca rebaixa) | `PROPOSTO` | teste: faixa após virada de mês ≥ anterior | vetado no código hoje |
| WP4.14 | Criatura visitável (decisão 8), sem estado nem número; depende de WP4.11 | `PROPOSTO` | `grep -q visit src/components/LibraryPage.tsx functions/api/community.js` + teste "nunca expõe HP" | não existe hoje |

## Verdades deste domínio que o guarda defende
- **Recompensa por contagem de tarefas é proibida** (`CLAUDE.md`). WP4.7 respeita: missão é comportamento, nunca "faça N tarefas".
- Tudo que Emblemas e Vínculo entregam é **cosmético** — há teste travando. Se algum dia comprar vantagem, vai para o servidor.
- Perda só sobre item recuperável (moedas, escudos), **nunca** sobre identidade ou progresso acumulado.
- "Última chance" / FOMO que tira é **dark pattern nomeado** (C3). A vitrine da estação volta no ano seguinte.
- O conteúdo real hoje é **muito menor do que o declarado** (mega em 14 dias perfeitos, não 100). Quem citar 10/20/30/40 está lendo dado morto.
