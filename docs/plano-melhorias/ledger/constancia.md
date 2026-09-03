# Ledger — guarda-constância (WP2.1–2.7)

Dono: `soulmon-guarda-constancia`. Anexo: `../B-habitos.md`.

| WP | O quê | Estado | Comando de verificação | Evidência |
|---|---|---|---|---|
| WP2.1 | `REST_SHIELD_MAX` 3→2 (experimento) | `BLOQUEADO:D3` | `grep "REST_SHIELD_MAX = " src/types/taskModel.ts` → `2`; + teste de clamp na hidratação (save com `shields:3` → 2); + `npx vitest run` inteiro | hoje 3; nenhum teste trava a mudança |
| WP2.2 | Prestígio "sem escudo gasto" | `PROPOSTO` (+ pendência D4, ver mobbin) | `grep -q "steadyWindow" src/utils/habitRhythm.ts` (era `pureWindow`; renomeado em `../mobbin/constancia.md` §2) + teste "usar escudo nunca altera constância por causa da aura" + teste "aura some sem toast" | `shielded[]` já existe |
| WP2.3 | Botão do check-in vira compromisso | `VERIFICADO` (03/09/2026) | `grep -q "Assumir minha meta" src/components/MorningCheckIn.tsx` + `checkin_commit` emitido só no confirm | `grep -c "Assumir minha meta de hoje" src/components/MorningCheckIn.tsx` → **1**; texto cai para 'Começar o dia' quando `plannedEffort` é 0; `track('checkin_commit', { focus_count })` em `handleCheckInConfirm` (fora do updater), ausente em `handleCheckInSkip`; teste novo `MorningCheckIn.commit.render.test.tsx` (4 casos, incl. guard de fiação por leitura do `App.tsx`) — **passa** |
| WP2.4 | Celebração de marco que interrompe | `PROPOSTO` | `test -f src/components/MilestoneCeremony.tsx` + teste "nunca durante `busy`" + `navigator.vibrate` presente + teste "não fecha sozinho" (modal que espera gesto, `../mobbin/constancia.md` §2) | hoje: só toast + som |
| WP2.5 | Never-miss-twice usa `soulStruggle` | `PROPOSTO` | teste: frase nunca contém "deveria"/"falhou"; usa `soulStruggle` quando não-vazio | — |
| WP2.6 | Widget = janela do pet | `PROPOSTO` | `grep -c "habit_tier_max\|steady\|needs_intervention" android/app/src/main/java/com/hexervoodoom/soulmon/plugins/DigiWidgetPlugin.kt` → ≥3 **e** `grep -c "constancy_pct\|\"shields\""` → 0 (chaves vetadas em `../mobbin/constancia.md` §2; decisão 4 do dossiê); frases sem dígito quando `completed < total`; **APK novo**; widget antigo continua renderizando | widget hoje não recebe dado de hábito nenhum |
| WP2.7 | Reencontro por DIAS, não por minutos | `PROPOSTO` | `grep -q "daysAway" src/components/CompanionHUD.tsx` + teste das 4 faixas + nenhuma frase cita o que ficou por fazer | hoje: limiar fixo de 10 min |
| WP2.8 | `hideMetrics` cobre a constância | `PROPOSTO` | `grep -q hideMetrics src/components/HabitConstancy.tsx` + render test sem dígito | Mobbin D8 (Headspace) |
| WP2.9 | Teste de guarda: nenhum render de constância com `/\d+\s*%/` | `VERIFICADO` (02/09/2026) | o teste existe e passa | `dailyList.sm2.render.test.tsx` → describe "HabitConstancy nunca imprime percentual (WP2.9)": 10 casos (5 estados × PT/EN) sobre o TEXTO visível — **passa**. A proibição #14 deixou de ser só tese |

## Verdades deste domínio que o guarda defende
- **Streak que zera é proibido por teste.** Quem propuser um contador que volta a zero está propondo outro produto.
- O escudo é **ganho por constância e gasto sozinho** — não é o Streak Freeze do Duolingo (comprado e ativado). Por isso WP2.1 é experimento, não correção.
- Constância nunca aparece como **percentual cru** na UI.
- `MAX_DAILY_FOCUS === 3` e `ABSENCE_FORGIVENESS_DAYS === 2` são literais travados em teste — mudar exige mexer no teste, e isso é sinal vermelho.
- Aura/prestígio **some em silêncio**. Nenhum texto de perda, nunca.

## Leitura do dossiê Mobbin (02/09/2026)
Em `../mobbin/constancia.md`. Resumo: Dossiês 6/8/9 **não acrescentam perdão nem cobrança** ao
motor. Mudaram spec de WP2.2 (sem nome de pureza; `steadyWindow`), WP2.4 (modal que espera o
gesto, saída relacional) e WP2.6 (`shields`/`constancy_pct` saem do bridge; frases de cobrança do
widget — "X de Y feitas", "N task(s) left" — são reescritas). Pendência D4: a aura pode ser a única
coisa que dói perder? Candidato sem número: `hideMetrics` cobrindo a linha de constância.
