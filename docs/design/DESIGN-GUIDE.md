# Soulmon — Design Guide

> Guia **documentado** do design system (o porquê e o como usar). O sistema em si vive no código;
> este arquivo explica e aponta. Auditoria de 22/11/2026 (pacote P7, spec item 27 / backlog item 4).
> Regra: todo valor citado vem do token real em `src/index.css` / `src/styles/tokens.md`; se divergir, o código vence e este guia é corrigido.

Fontes do DS (dispersas, nesta ordem de autoridade): `src/index.css` (tokens `--sm2-*`) → `src/styles/tokens.md` (contrato + contraste medido) → `src/components/ui/` e `src/components/form/FormKit.tsx` (componentes) → `docs/manual/04-IDENTIDADE-VISUAL.md` (tese "O Visor", histórico) → `docs/REGRA-IDENTIDADE-SOULMON.md` (onde a marca aparece) → `docs/PLANO-MOLDURAS-MODAIS.md`, `docs/FILA-DE-MODAIS.md`.

## 1. Princípios

1. **Tinta × fill.** Cada acento tem dois tokens (`*-ink` texto, `*-fill` preenchimento) e `--sm2-on-*` para texto sobre fill. Nunca uma cor serve aos dois papéis. *Origem: bug recorrente de contraste "no screenshot parecia ok".*
2. **Um componente, um dono.** O visual vive em uma classe/componente só (`.sm2-cta`, `.sm2-moldura-modal`, `.sm2-moldura-card`); as telas só compõem. Não criar padrão isolado onde já há compartilhado.
3. **Identidade só onde a marca precisa aparecer.** Molduras, botões, HUD, prédios, NPCs e mapas usam o vocabulário (turquesa escuro, cobre, cipó, cristal). Criaturas, efeitos e ícones de elemento seguem o próprio elemento (`docs/REGRA-IDENTIDADE-SOULMON.md`).
4. **Polegar primeiro.** Alvo ≥ 44 px (botão padrão 48), ação principal embaixo, folhas sobem de baixo.
5. **Escala fechada.** Texto 12–32 px por token, espaço em 6 degraus, nada abaixo de 12 px.

## 2. Fundamentos

| Fundamento | Tokens | Nota / justificativa |
|---|---|---|
| Cor | `--sm2-bg/surface/surface-2/line/ink/muted`, `primary\|gold\|danger-{ink,fill}`, `--sm2-on-*`, `--sm2-haunted`, `--sm2-viewport-*` | Escuro é o canônico (app noturno). Paridade obrigatória nos dois temas (FOOTGUN 10). Contraste medido em `tokens.md` §3; menor par de texto 4,42:1. |
| Tipografia | `--sm2-font-display` Cinzel (só títulos, caixa alta), `-text` Rubik, `-pixel` Silkscreen, `-icon` Material Symbols Rounded, `-mono` (Bits), `-serif` (Honra) | As moedas nunca se confundem: Bits mono + `BitsIcon`, Honra serifa dourada, Créditos `diamond`. |
| Escala de texto | `--sm2-text-xs 12 · sm 14 · md 16 · lg 20 · xl 24 · 2xl 32`; entrelinha 1,45 / 1,2 | Piso absoluto 12 px. |
| Espaço | `--sm2-space-half 2 · 1 4 · 2 8 · 3 12 · 4 16 · 5 24 · 6 32` | Qualquer outro valor é literal fora do grid. |
| Raio | `--sm2-radius-sm 4 · md 12 · lg 20` | Botão kit = md; modal centrado = lg. |
| Movimento | `--sm2-dur-tap 120ms`, `-enter 200ms`, `-page 320ms`, `--sm2-ease` | `prefers-reduced-motion` tratado só no bloco canônico do `index.css`. |
| Ícones | `Icon` (glifo Material, `tone` = ink/muted/primary/gold/danger/viewport/inherit), `PixelIcon` + `assets/soulmon/icones-ui/` (pixel art), `EstagioIcone`, `BitsIcon`, `CreditIcon` | 39 glifos autorais travados na Fase 2; ícone nunca em box extra. |
| Moldura | `ModalFrame`, `CardFrame` (fatiamento vertical), `--sm2-moldura-pad-{x,t,b}` | A moldura é arte; o respiro do conteúdo é token. |

## 3. Componentes e categorias

### 3.1 Botões — categorias por função

Levantamento (código, 22/11/2026): **~718 `<button` em 223 arquivos .tsx**; 139 arquivos usam `sm2Button()`; CtaButton em 18 arquivos, BotaoEspecial 8, BackArrow 11, BackCircleButton 10, EscolhaLinha 3, SortearNovos 3. Famílias de CSS: `sm2-kit-btn-*`, `sm2-cta*`, `sm2-pxbtn`, `sm-btn*` e ~25 classes locais.

| Categoria (função) | Componente / token | Tamanhos | Arte própria? |
|---|---|---|---|
| **CTA principal** (a ação que a pessoa veio fazer) | `CtaButton` (`tone` padrao/acao, `width` full/auto, `fillMs`): moldura de cobre 9-slice, um arquivo por estado (`btn-cta`, `-hover`, `-press`, `-off`) | altura ≥ 44, texto `--sm2-text-*` | **Sim** |
| CTA de texto (secundário ao lado de CTA) | `CtaTextButton`: só texto, empilhado abaixo | — | n/a (sem fundo) |
| **Ação especial de combate/ranking** | `BotaoEspecial` `variant` dourado/pve/pvp/ranking (`btn-especial\|pve\|pvp\|ranking` + `-off`/`-press`) | full/auto | **Sim** |
| **Padrão de formulário/modal** (primary, outline, ghost, quiet) | `sm2Button(variant, disabled, size)` em `FormKit.tsx`; classes `sm2-kit-btn-{primary,outline,quiet,ghost}-{sm,md,lg}` | sm 44 · md 48 · lg 56 | **Não** (só CSS; §316c revogado pelo dono em 22/11: vai ganhar arte própria (P6)) |
| Escolha de linha / sorteio | `EscolhaLinha`, `SortearNovos` (Torneio, Match-3; Arena no PR #1093) | — | Não |
| Voltar / fechar | `BackArrow`, `BackCircleButton`, `ChevronAcao`; ✕ da moldura de aço (`sm2-moldura-aco__fechar`, sobre o disco da arte) | 44 | Glifo; ✕ de aço usa o disco da arte |
| Ícone de ação / nav | `sm-icon-action-btn`, `sm-nav-btn`, `NavGlyphs` | 44 | Parcial (`icones-ui`) |
| Botões locais por tela | `sm2-deck-btn`, `sm2-guild-btn`, `sm2-guild-invite-btn`, `sm2-hex-equip-btn`, `sm2-evolve-btn`, `sm2-chat-*`, `sm2-grove-walker-btn`, `sm3-material-btn`, `sm3-mochila-usar-btn`, `sm-game-card__btn` | variam | **Não** — candidatos a migrar para uma categoria acima |
| Legado | `retro-button`, `sm-btn`, `sm-btn-secondary`, `sm-px-*` | — | Migrar/aposentar |

**Hierarquia:** 1 CTA principal por tela → secundária = `CtaTextButton` (ao lado de CtaButton) ou o par `primary`+`outline` (sem CtaButton) → terciária = `quiet`/`ghost`.

**Estados (todas as categorias):** padrão · hover (só desktop) · pressed · foco visível · desabilitado (`--sm2-surface-2` + `--sm2-muted`) · ocupado (`sm2-kit-btn-busy`). CtaButton tem arte por estado; `sm2Button` marca `--sm2-btn:<variant|disabled>` para o CSS do pressed. Alvo ≥ 44 travado por `alvo44.test.tsx`.

**Do / Don't:** use `--sm2-on-primary` sobre `primary-fill`, nunca `primary-ink` · não coloque `CtaButton` em modal/popup pequeno · não crie botão novo com `all: unset` · a ação principal sempre tem rótulo; o resto pode ser só ícone com `aria-label`.

### 3.2 Modais — categorias

Levantamento: `ModalSheet` em 64 arquivos (`form/FormKit.tsx`), `AreaSheet` 19 (`nav/AreaSheet.tsx`, `moldura='padrao'|'aco'`), `ModalFrame` 8, `TelaMoldura` 5, `ModalInfo` 11, `BlockedActionModal` 3. Fila: `docs/FILA-DE-MODAIS.md`.

| Categoria | Componente | Moldura | Fechar |
|---|---|---|---|
| **Prédio/área** (NPC + folha) | `AreaSheet` → `ModalFrame` (flag `MOLDURA_MODAL`) | 9-slice de lote (topo, base, laterais) + fundo do lote a 15% | ✕ no canto superior **esquerdo** (mesmo lugar do voltar) |
| **Hexsmith** | `AreaSheet moldura="aco"` | aço com runas (`assets/soulmon/ui/hex-moldura/`) | ✕ no disco esquerdo da arte; "i" no direito |
| **Ranking / Files / Mochila / Talentos** | `RankingModal`, `sm3-files`, `Mochila`, `TalentTreeEntry` (pads próprios) | variam | esquerdo |
| **Sub-folha** | `ModalSheet` dentro de moldura entra no encaixe `sm2-moldura-modal__subfolha` (`useModalArea`) | herda do pai | seta voltar à esquerda |
| **Folha avulsa** (bottom sheet ou `placement="center"`) | `ModalSheet` | sem arte (superfície) | `closeSide` start (padrão) · end só para encerrar atividade · none só onboarding |
| **Aviso/bloqueio** | `BlockedActionModal`, `ModalInfo`/`InfoTip` | sem arte | explícito |

**Contrato de fechar/voltar:** voltar e fechar no canto superior esquerdo; fechar à direita só para encerrar atividade em andamento (confirma se perde progresso); o ✕ de dispensar card inline pode ficar à direita. Trava: `components/ui/voltarFechar.contract.test.ts`. Clique no véu fecha, exceto confirmação destrutiva e formulário com texto digitado.

**Margens:** o conteúdo rola no vão da moldura com `--sm2-moldura-pad-x/t/b` (em unidades `--u` = 1% da largura). Hoje existem ao menos 5 conjuntos de pads (`index.css` ~8522 ranking, ~8560 files, ~8592 aço, ~9877 e o padrão do `ModalFrame`); a Fase 2 padroniza e adiciona teste de contrato para 360/375/412 px.

### 3.3 Cards, ícones, recompensas

| Componente | Uso | Observação |
|---|---|---|
| `CardFrame` (`sm2-moldura-card`: arte, nome, descrição, pílula de recompensa) | cards com moldura | fatiamento vertical; ícone nunca em box extra |
| `LockBadge` / `LockGlyph` / `LockNotice` | estado bloqueado (por vínculo) | |
| `RewardLine`, `RewardPreview`, `RewardPop`, `BitsAmount`, `EnergyCost` | recompensa e custo | valor de Bits sempre via `BitsAmount` |
| `EstagioIcone` / `EstagioMarca` | estágio de evolução | guard `EstagioIcone.guard.test.ts` |
| `icones-ui/index.ts` | pixel art: mapa, home, itens, dormir, banho, ações, enviar, hp, energia, chip-moeda, mochila, acordar | contract tests de inventário e escala |
| `AvatarFrame`, `PlayerName`, `OfflineSeal` | identidade do jogador | |

**Estados ativo/inativo/bloqueado/selecionado:** resolvidos tela a tela, sem token único (lacuna 3). Padrão proposto: ativo = `primary-ink` sobre `primary-soft`; selecionado = contorno `primary-fill`; inativo = `muted`; bloqueado = `LockBadge` + `muted`.

## 4. Padrões recorrentes
Folha de formulário (`ModalSheet` + rodapé com par primary/outline) · escolha de linha (`EscolhaLinha`) · recompensa (`RewardLine` + `BitsAmount`) · estado vazio (`ScreenSkeleton` / mensagem curta) · carregando (`LoadingBar`).

## 5. Voz e microcopy
PT-BR e EN sempre; rótulo curto; ação principal com verbo; termos do jogo no glossário (`docs/design/GLOSSARIO-PT-BR.md`); texto do aparelho em `.sm2-device-voice`.

## 6. Acessibilidade
Alvo ≥ 44 (`alvo44.test.tsx`), foco visível em todo botão, `aria-label` em botão só-ícone, foco preso + Esc + retorno de foco nas folhas (`useDialogA11y`), contraste WCAG medido em `tokens.contrast.test.ts`, `prefers-reduced-motion` (CtaButton dispara a ação direto).

## 7. Lacunas encontradas (auditoria 22/11/2026)
1. ~25 classes de botão locais sem categoria nem arte; migrar para `sm2Button`/`CtaButton`.
2. Categoria "padrão de modal" (`sm2Button`) só tem CSS; vai receber arte (P6); componente e regra de uso ajustam quando a arte chegar.
3. Estados ativo/inativo/bloqueado/selecionado de card sem token/classe única.
4. Pads de moldura em 5 conjuntos; sem teste de contrato de margem (Fase 2).
5. Dois sistemas de tokens convivem (`--sm-*` legado → `--sm2-*`).
6. Documentação dispersa em 5 lugares; este guia é o ponto de entrada.

## 8. Changelog
- 2026-11-22 — criação (P7 Fase 1). Levantamento por grep de código, não por captura de tela.
