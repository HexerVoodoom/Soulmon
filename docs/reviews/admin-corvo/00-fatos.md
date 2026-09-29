# Corvinho + conta de administrador — fatos medidos (29/09/2026)

> Termos renomeados em 29/09/2026: vírus→poder, dado→harmonia, vacina→benevolência.

> Registro de levantamento (só-leitura). Símbolos por `arquivo` + SÍMBOLO. Nada aqui é decisão de regra.

## O corvinho
- É o **mascote da marca**, não uma criatura de linha nem NPC: um único arquivo, `src/assets/soulmon/mascot-raven.png`, 512×512 RGBA (79.740 px visíveis, 2.653 semitransparentes).
- Pixel art: corvo azul-marinho (matiz ~210°) com máscara de médico da peste (bico off-white), cartola azul-escura com faixa cinza, olho âmbar, correntinhas douradas, lanterna de chama ciano/turquesa (~180°).
- Usado em `IntroScreen.tsx` (`ravenMascot`) e `ErrorBoundary.tsx`; testes de onboarding afirmam que **não** aparece no onboarding.
- Não existe arte de outros estágios. `PREMADE_CHARACTERS` são 6 (kaelen, orrin, thalindra, igni, nautilu, astrase); `DUNGEON_LINE_SPRITES` são 9 linhas × 4 tiers × 256².
- O jogo já recolore por CSS (`demoTintFilter`, `DEMO_TINTS`); aqui a recoloração é programática (PIL 12, sem numpy, sem ImageMagick).

## Árvore de 11 formas
- `src/types/progression.ts` › `FORM_REQUIREMENTS`: `rookie`, `{champion|ultimate|mega}-{power|data|benevolence}`, `ultra`.
- `getSpriteForStage(stage, demoCharacterId?)` (`src/utils/sprites.ts`): linha pronta → `SOULMON_SPRITES[key]` (11 PNGs genéricos) → `legacySpriteForStage`. Save: `soulmonStages` (nome/descrição/prompt por forma, não pixels), `spriteLibrary` (URL por forma), `demoCharacterId`, `accountTier`, `currentBranch`.
- `handleUpgradeRevealed` (`App.tsx`) força `accountTier:'paid'` e troca só a criatura.

## Tier, créditos e auth no servidor
- `ent:<saveId>` no KV é a fonte do tier (`_entitlements.js`); `save.js` sobrescreve `state.accountTier = ent.tier`; o cliente sobrescreve tier/credits com `fetchEntitlement()`.
- `authorizeSaveAccess` (`_auth.js`): com `FIREBASE_PROJECT_ID` exige ID token com `email_verified === true`; **sem** `FIREBASE_PROJECT_ID` é modo aberto (fail-open). `saveId = SHA-256("soulmon:" + e-mail)` é computável a partir do e-mail — nunca é prova de identidade sozinho.
- Já existe cortesia: `POST /api/entitlements?action=grant` com `ENTITLEMENTS_ADMIN_KEY` (teto `COURTESY_MAX_ACCOUNTS`). Outras chaves admin: `METRICS_ADMIN_KEY`, `SEASON_ADMIN_KEY`.
- Geração de pet próprio: `generate-sprite.js` › `requirePaidTier`; tetos `AI_LIMITS.sprite` (6/dia, 26 vitalícios, 3 por forma, 800 globais/mês). Reroll `REROLL_COST_CREDITS` cobrado via `spend`. Renascimento decidido no cliente (`rebirth.ts`).
- Não existe painel GM/godmode no cliente. Itens de loja com `unlock:{kind:'mission'}` são decididos no cliente.
