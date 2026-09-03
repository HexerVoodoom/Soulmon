# Ledger — guarda-medição (WP0.1–0.5, WP0.7)

Dono: `soulmon-guarda-medicao`. Anexo de evidência: `../E-telemetria.md`.
Regra: só este guarda escreve aqui; `VERIFICADO` exige a saída do comando colada.

| WP | O quê | Estado | Comando de verificação | Evidência |
|---|---|---|---|---|
| WP0.1 | Leitura da telemetria ligada (`METRICS_ADMIN_KEY`) | `BLOQUEADO:D1` | `curl -s -o /dev/null -w '%{http_code}' -H "X-Metrics-Key: $K" https://soulmon.mateus-sprnd.workers.dev/api/metrics?days=7` → **200** (hoje 404 = fail-closed proposital) | — |
| WP0.2 | Retenção D1/D7/D30 por ledger local | `BLOQUEADO:D2` | `grep -q "retained" src/utils/telemetry.ts && grep -q "retained" functions/api/metrics.js && npx vitest run src/utils/telemetry.test.ts` | — |
| WP0.3 | `privacidade.html` "sete"→dez + teste | `VERIFICADO` (02/09/2026) | `! grep -q "sete eventos" public/privacidade.html && npx vitest run src/utils/telemetry.test.ts` | `grep -c "sete eventos" public/privacidade.html` → **0**; teste novo em `telemetry.test.ts` exige todo evento do `EVENT_SCHEMA` na tabela PT e EN e proíbe número escrito à mão — **passa** |
| WP0.4 | Documentos que mentem sobre o código | `PROPOSTO` | `grep -c "o pet olha" CLAUDE.md` → 0 ocorrências **sem** o aviso; cada guarda reporta as mentiras do seu domínio | parcial: `CLAUDE.md` 👻 já corrigido em 02/09 |
| WP0.5 | Eventos novos nos DOIS `EVENT_SCHEMA` | `VERIFICADO` (02/09/2026) | `npx vitest run src/utils/telemetry.test.ts functions/api/metrics.test.js` (paridade) + `grep -c "reveal_seen\|checkin_commit\|milestone\|shield_used\|welcome_back\|evolve\|dungeon_run\|bond_level" src/utils/telemetry.ts functions/api/metrics.js` | 8 eventos novos nos DOIS schemas (`grep -cE` → 8 e 8); `unlock_view.reason max: 3` nos dois; paridade `telemetry.test.ts` + `metrics.test.js` **verde**; `privacidade.html` ganhou as 8 linhas PT+EN |
| WP0.7 | Medir o tamanho do save | `VERIFICADO` (02/09/2026) | teste novo que serializa 90 dias e imprime bytes; registrar o número no `STATUS.md` | `src/utils/saveSize.test.ts`: save sintético de 90 dias pesados = **79.602 bytes (77,7 KB)**, 64× abaixo de `MAX_STATE_BYTES` (5 MB). WP3.1 e WP4.6 cabem com folga |

## Verdades deste domínio que o guarda defende
- A telemetria **já existe** (10 eventos). Quem propuser "instrumentar do zero" está lendo o guia velho.
- `EVENT_SCHEMA` é **cópia deliberada** em 2 arquivos com teste de paridade (footgun 9). Evento novo entra nos dois.
- Coorte de retenção é **decisão do dono** (D2), não de implementação — `metrics.js` diz isso no cabeçalho.
- Nenhum evento carrega string. Allowlist rejeita o evento inteiro, não limpa o campo.
