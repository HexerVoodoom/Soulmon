# 07 — Auditoria do design system (alpha-auditor-design-system, 21/09/2026)

Fonte canônica viva: `src/index.css` (dois vocabulários) + `src/styles/tokens.md` + régua `src/styles/tokens.contrast.test.ts`.

## Contagens (Grep)
- `--sm-*:` em `src/index.css` → 83 ocorrências (41 nomes únicos no manual §2)
- `--sm2-*:` → 101 ocorrências (59 nomes únicos)
- classes `.sm2-*` → 327 (233 únicas no manual)
- classes `.sm-px-*` (kit antigo) ainda em `.tsx` → 32 ocorrências / 17 arquivos: `App.tsx`, `CityPicker`, `ChatBox`, `ActivitiesPage`, `AccountSection`, `GameTutorialFlow`, `LibraryPage`, `form/FormKit`, `OraclePage` (7×), `PixelFrame`, `SettingsPage`, `SoulmonOnboarding`, `TournamentPage`, `SoulTestItem` + 3 testes. Confirma a curva de migração do `04-IDENTIDADE-VISUAL.md` §2.8.

## Drift — `#hex` em `src/components/*.tsx`
45 ocorrências / 14 de 167 arquivos (≈8%). Top: `OraclePage.tsx` 16, `PixelFrame.tsx` 9, `NavGlyphs.tsx` 3, `TournamentPage.tsx` 3, `CompanionHUD` 2, `PixelizerCard` 2, `ItemsWindow` 2, `ui/sonner` 2.

## `style={{` inline
1034 ocorrências / 87 de 167 arquivos (52%). Top: `SoulmonOnboarding` 110, `EvolutionPath` 65, `TournamentPage` 58, `ShopModal` 42, `CreateModal` 39, `OraclePage` 33, `CompanionHUD` 33, `PetPage` 29, `DailyReportModal` 24, `ArenaGame` 23, `GameTutorialFlow` 23. É o padrão dominante (footgun 1 do CLAUDE.md). Próxima auditoria deve amostrar por tipo de valor (cor/fonte vs. posicionamento), não por chave.

## Dois sistemas de tema (footgun 10)
Scaffold shadcn (`--background`/`--foreground`/`.dark`) convive com `--sm-*`/`--sm2-*`; `.dark` nunca é aplicada; consumido por `src/components/ui/*`. Risco: texto novo sem `color` herda claro fixo (já regrediu uma vez).

## `ui/*`
9 arquivos (7 de produção: `Icon`, `MiniGlass`, `Viewport`, `NavGlyphs`, `OfflineSeal`, `ScreenSkeleton`, `sonner`) — todos consumidos (68 imports / 52 arquivos). Nenhum órfão. Botão é CSS-first (`.sm-btn`), não há duplicata de componente.

## Exceções
- `!important` em `src/index.css` → 25
- z-index literais: 23 valores distintos (0…9999) sem escala em token; escala implícita de fila (0/1/10/20/25/30/40/45/50/100/200/300) já existe em `src/index.css`; fora dela: 61, 90, 120, 2000, 9999. CLAUDE.md registra bug de empilhamento corrigido pontualmente.

## Proposta priorizada
1. Promover escala de z-index a tokens `--sm2-z-*`; migrar os 5 literais fora da escala. Esforço baixo.
2. Terminar a saída de `.sm-px-*` (17 arquivos). Esforço médio, ganho alto.
3. Auditar os 1034 `style={{` por categoria de valor. Esforço alto; pré-requisito para medir adoção.
4. Resolver os 25 `!important` um a um.
5. Aposentar scaffold shadcn (`--background`/`.dark`) migrando `ui/*` para `--sm2-*`. Esforço baixo, ganho alto.
