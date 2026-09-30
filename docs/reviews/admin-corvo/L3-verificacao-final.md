# L3 — Verificação final independente (admin-corvo, 29/09/2026)

Verificador só-leitura sobre `ccr-1aa8b7db-xk45mh` @ `aebd2366`. Nada de código de produto foi tocado.
Build e navegador rodaram numa worktree em `/tmp/sm-final` (o `dist/` do repo não foi mexido).
Capturas: `shots-final/` (13).

**Veredito geral: PRONTO PARA MERGE, com ressalvas menores (nenhuma FATAL/ALTA aberta).**
R1 e R2, que bloquearam o L2, estão fechados no navegador.

## 1. Portões — PRONTO
- `git status` limpo. `tsc` (app, server, desktop): exit 0 nos três.
- `vitest run`: 435 arquivos, 6100 testes passando, **2 falhas, as duas já conhecidas**
  (`orcamentoDeBytes` e `convertToWebp`). O `SoulmonOnboarding.portao` passou na rodada completa.
- `npm run build` na worktree: exit 0. Entrada `index-CXZQmQ9m.js` = 718.798 B (é a dívida do
  `orcamentoDeBytes`, que já existia). CSS `index-BP4K1ipL.css` = 153.795 B.
- `dist/assets/*.js` não tem nenhum id antigo (`champion-virus|vaccine|data`, `virusPoints|dataPoints|vaccinePoints`).
  O corvo aparece no bundle só em `corvoAdocao-*.js` (chunk separado, G1), `familias`, `SettingsPage` e na entrada (`isCorvo`/sprite).
  Há **22** `*corvo*.webp` no dist.

## 2. R1/R2 no navegador real — PRONTO (1 ressalva)
Ambiente: `vite preview`, Chromium do Playwright, `serviceWorkers:'block'`, save semeado por `addInitScript`, telas de 390×844 e 360×640.
- Com Masmorra, Dino, PPT e Duelo em andamento, a barra do topo fica `visibility:hidden` e
  `elementFromPoint` no botão dela **não** acerta a barra nas duas telas. O toque vai para o jogo.
- Com a folha aberta, o topo também fica coberto (`topbarOnTop:false`). O mapa da área mostra o ícone de mapa.
- Voltar do Android por `history.back()`: jogo → cena da área → mapa → Home. Cada toque desce uma camada, e na Home a pilha para.
  *Ressalva:* sair do jogo leva para a **cena da área** e não reabre a folha. Cada toque ainda desce uma só camada, mas a sequência não é "jogo → folha".
- Arena › Torneio em 360×640: o balão ocupa (175..348, 53..201) e fica inteiro dentro da tela. "Vultrak, mestre da arena" está visível (`05-360x640-torneio.png`).
  Em 390×844 o NPC tem 236 px de largura, contra 155 px em 360×640, ou seja, está ampliado.

## 3. Admin e migração — PRONTO (1 ressalva)
- `/api/entitlements` simulado com `admin:true`: o corvinho foi adotado sozinho (`creature:'corvo'`, 11 estágios) e continuou igual depois de recarregar. Não duplicou.
- O painel de GM mostra o aviso "não são desfeitas" e, no botão de adotar, "não há como voltar".
  Dar saldo deu 999.999 Bits. O seletor "Ir para forma" tem as **11** formas, e o ultra foi aplicado. Os botões +1/+7/+30 somaram 38 dias completos.
- Com `admin:false`, e também com o valor forjado `'true'` (string) mais uma chave `soulmon-admin` no localStorage: nenhum painel, nenhum corvo.
- Save antigo (`champion-virus`, `virus/data/vaccinePoints`, `unlockedEvolutions` com ids antigos e duplicados, chips 🦠/💾/💉) virou
  `champion-power`, pontos 7/3/2, `unlocked` = `[rookie, champion-power, champion-harmony]` e inventário 👊/🎶/🤲 com as contagens preservadas (🍎 intacta). Bits intactos.
  Recarregar deu o resultado idêntico, então a migração é idempotente.
- *Ressalva (só GM):* "Ir para forma → ultra" abre por cima das Configurações o modal "Evolução!", com o convite "Criar nova tarefa / cadastre mais 6".

## 4. Widget — COM RESSALVA (só o CI confirma)
- Lido como um compilador leria:
  - `CORVO_SPRITES` aponta para 11 `R.drawable.sprite_corvo_*`, e os 11 PNG existem em `drawable-nodpi/`.
  - O `when` do `groveStageLabel` tem `else -> return null`, que é Kotlin válido.
  - `widget_grove` só é tocado no ramo não-vertical, e só `widget_soulmon.xml` usa esse ramo. Esse layout declara o id.
  - Nenhum `<View>` e nenhum `setInt(background)`. O texto do Bosque é só o nome do estágio, sem número nem "faltam".
  - As chaves `constancy_pct`, `shields` e `bond_level` continuam sendo removidas.
  - `pet_line` e `grove_stage` passam por allowlist.
- `xmllint` deu OK nos 3 XML tocados. `widgetSemCobranca.contract.test.ts` passou (21 testes).
- **Só o `android-build.yml` confirma** o link de recursos (`aapt2`), a compilação Kotlin e o widget rodando num aparelho.

## 5. Docs/PI — PRONTO
- Os prompts em `prompts/*.md` e em `npcs-oraculo*` não citam vírus, dado, vacina nem vaccine.
- Os 11 NPCs de `npcs-oraculo-saida.json` têm a cláusula "Do not copy any existing franchise character" em `imagePrompt` **e** em `imagePromptFallback`. Nenhum nome termina em "-mon".
- `jogos.md` não tem prompt de NPC porque o dono decidiu não repintar o Pipo.
- O e-mail completo do dono só aparece onde já estava antes e é público: `dist/privacidade.html`, `termos.html`, `index.html`, `docs/AUDITORIA-ALINHAMENTO.md` e `BACKLOG-ARTE-GERAR.md`. O lote não acrescentou nenhuma ocorrência.
  `ADMIN_EMAILS` não recebe valor atribuído no repositório.

## 6. Regressão — COM RESSALVA
- Hall (Biblioteca, Amigos, Salão da Guilda) e Mercado (4 lojinhas) abrem com e sem admin. Nenhuma chave crua nem `{n}` apareceu, em PT e na Home em EN.
- A masmorra desenha o corvo (`corvo-rookie-256`) para o admin e o pet comum para os outros. Nenhum `pageerror`.
- *Ressalva:* o "Do bosque" no topo de Cenários (`guild.cenarios.titulo`) não apareceu no navegador. Ele depende de haver guilda com cenário próprio, e o save não tinha isso; esse caso foi conferido só no código.
  Feira e resgate não foram exercitados de ponta a ponta.
