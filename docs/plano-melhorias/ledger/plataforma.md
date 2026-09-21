# Ledger — guarda-plataforma (paridade web × APK/widget × overlay × EN × a11y)

Dono: `soulmon-guarda-plataforma` (criado em 21/09/2026 — governança N2,
`docs/reviews/2026-09-21-qa-geral/13-governanca-agentes.md` §8.5). Evidência: `CLAUDE.md`
› footguns 2/3/9 e › "Idioma: inglês é a base"; `docs/reviews/2026-09-21-qa-geral/`
(desktop/Android/workers/CI · i18n · a11y). Regra: só este guarda escreve aqui;
`VERIFICADO` exige a saída do comando colada. Vocabulário de estado: `../LEDGER.md`.

Este ledger não custodia WPs do `PLANO-MELHORIAS.md` (nenhum pacote de lá é de plataforma);
custodia **paridades** — cada linha é uma pergunta "chega igual em X?" com régua executável.

| Id | O quê | Estado | Comando de verificação | Evidência |
|---|---|---|---|---|
| PL-1 | Regras de cuidado do overlay são **import**, não cópia | `IMPLEMENTADO` (26/08/2026, `f6fb5f30`) — aguarda o primeiro `/guarda-soulmon plataforma` colar a saída | `npx vitest run desktop/renderer/src/care.parity.test.ts desktop/renderer/src/care.feed.parity.test.ts desktop/renderer/src/care.banhoSono.parity.test.ts` | `desktop/renderer/src/care.ts` importa de `src/utils/` (footgun 9) |
| PL-2 | `saveId` igual em app, overlay e servidor | `IMPLEMENTADO` — idem | `npx vitest run functions/api/saveId.parity.test.js desktop/renderer/src/cloudSync.test.ts` | três implementações, salt `soulmon:` |
| PL-3 | Widget Android não cobra e não grava chave vetada | `IMPLEMENTADO` (06/09/2026) — idem | `npx vitest run src/plugins/widgetSemCobranca.contract.test.ts` | guard lê o fonte Kotlin |
| PL-4 | Copy de push igual em cliente e worker; crons derivados de `PUSH_HOURS_BRT` | `IMPLEMENTADO` — idem | `npx vitest run workers/pushCopy.parity.test.js workers/vapid.parity.test.js` | footgun 9 no `NotificationManager.tsx` (WP3.4, guarda-vínculo) |
| PL-5 | Nenhuma string de UI só em PT (aria, push, toast) | `PROPOSTO` — sem régua executável; a QA geral (21/09/2026) achou i18n EN sem disciplina | `grep -rn "aria-label=\"[^\"]*[ãõçáéíóú]" src` → 0; ternário `'pt-BR' ?` sempre com par EN | já houve `aria-label` e título de push só em PT |
| PL-6 | `android/` e `desktop/electron/*` com zero teste | `PROPOSTO` — depende de decidir o que é testável sem emulador (Gradle/Electron) | `find android/app/src -name "*Test*.kt" \| wc -l`; `ls desktop/electron/*.test.* 2>/dev/null \| wc -l` | QA geral 21/09/2026 |
| PL-7 | a11y de código: rótulo em toda ação, foco conferível, reduced-motion reduz movimento e não pausa, fonte ≥ 12px, ícone nunca em box | `IMPLEMENTADO` parcial — `iconScale.contract.test.ts` e piso `.sm2-chat-support` 12px (21/09/2026); leitor de tela **nunca medido** (→ `alpha-perf-a11y`) | `npx vitest run src/styles/iconScale.contract.test.ts` + `grep -rn "prefers-reduced-motion" src/index.css` | `04` §4.3, `CLAUDE.md` › UI |

## Verdades deste domínio que o guarda defende
- Regra copiada diverge em silêncio; o precedente é **importar** (`care.ts`). Onde importar é
  impossível (Kotlin), o teste de paridade lê o fonte e entra no mesmo commit.
- Chaves do bridge Android são congeladas — só se acrescenta; o plugin **remove** a vetada.
- O widget é a superfície mais vista do telefone e **nunca cobra**.
- Todo texto de UI nasce em EN com o par PT; `resolveLanguage` é o ponto único.
- Movimento reduzido reduz o MOVIMENTO, nunca a cerimônia.
- Publicar o desktop só por tag `v*` (`desktop-release.yml`); o APK carrega a URL de produção.
