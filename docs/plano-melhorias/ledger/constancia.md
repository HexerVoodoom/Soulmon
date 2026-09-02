# Ledger — guarda-constância (WP2.1–2.7)

Dono: `soulmon-guarda-constancia`. Anexo: `../B-habitos.md`.

| WP | O quê | Estado | Comando de verificação | Evidência |
|---|---|---|---|---|
| WP2.1 | `REST_SHIELD_MAX` 3→2 (experimento) | `BLOQUEADO:D3` | `grep "REST_SHIELD_MAX = " src/types/taskModel.ts` → `2`; + teste de clamp na hidratação (save com `shields:3` → 2); + `npx vitest run` inteiro | hoje 3; nenhum teste trava a mudança |
| WP2.2 | Prestígio "sem escudo gasto" | `PROPOSTO` | `grep -q "pureWindow" src/utils/habitRhythm.ts` + teste "usar escudo nunca altera constância por causa da aura" + teste "aura some sem toast" | `shielded[]` já existe |
| WP2.3 | Botão do check-in vira compromisso | `PROPOSTO` | `grep -q "Assumir minha meta" src/components/MorningCheckIn.tsx` + `checkin_commit` emitido só no confirm | hoje: 'Começar o dia' |
| WP2.4 | Celebração de marco que interrompe | `PROPOSTO` | `test -f src/components/MilestoneCeremony.tsx` + teste "nunca durante `busy`" + `navigator.vibrate` presente | hoje: só toast + som |
| WP2.5 | Never-miss-twice usa `soulStruggle` | `PROPOSTO` | teste: frase nunca contém "deveria"/"falhou"; usa `soulStruggle` quando não-vazio | — |
| WP2.6 | Widget = janela do pet | `PROPOSTO` | `grep -c "constancy_pct\|shields\|needs_intervention" android/app/src/main/java/com/hexervoodoom/soulmon/plugins/DigiWidgetPlugin.kt` → ≥3; **APK novo**; widget antigo continua renderizando | widget hoje não recebe dado de hábito nenhum |
| WP2.7 | Reencontro por DIAS, não por minutos | `PROPOSTO` | `grep -q "daysAway" src/components/CompanionHUD.tsx` + teste das 4 faixas + nenhuma frase cita o que ficou por fazer | hoje: limiar fixo de 10 min |

## Verdades deste domínio que o guarda defende
- **Streak que zera é proibido por teste.** Quem propuser um contador que volta a zero está propondo outro produto.
- O escudo é **ganho por constância e gasto sozinho** — não é o Streak Freeze do Duolingo (comprado e ativado). Por isso WP2.1 é experimento, não correção.
- Constância nunca aparece como **percentual cru** na UI.
- `MAX_DAILY_FOCUS === 3` e `ABSENCE_FORGIVENESS_DAYS === 2` são literais travados em teste — mudar exige mexer no teste, e isso é sinal vermelho.
- Aura/prestígio **some em silêncio**. Nenhum texto de perda, nunca.
