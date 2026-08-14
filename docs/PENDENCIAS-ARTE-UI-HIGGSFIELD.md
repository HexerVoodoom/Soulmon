# Pendências — rodada de arte/UI via Higgsfield (2026-08-09)

Gerado ao final da sessão que criou e integrou os 14 assets de decoração +
ícones/cenários/vídeo de UI. Tudo abaixo depende de você — decisão ou execução.
Nada disto foi commitado.

## Decidir

-1. **`desktop/` não builda — fora de escopo desta sessão, achado por acaso.**
   Ao tentar `npm run dev` em `desktop/` (pra "ativar o controle remoto"),
   `vite build` falha:
   - `desktop/renderer/src/sprites.ts:12` importa `LEFT_FACING_STAGES` de
     `src/utils/sprites.ts` — esse export **não existe** no arquivo atual
     (`grep` confirma zero ocorrências).
   - `desktop/renderer/src/sprites.ts:20` chama
     `getSpriteForStage(stage, genericLine, demoCharId)` com **3 argumentos**,
     mas a assinatura real hoje (`src/utils/sprites.ts:118`) é
     `getSpriteForStage(stage, demoCharacterId?)` — **2** argumentos.
   - Leitura: `desktop/` ficou congelado numa versão anterior da API de
     `src/utils/sprites.ts` e ninguém notou porque os dois só se encontram no
     build do desktop, que não roda no CI do app principal — exatamente o
     footgun #9 do `CLAUDE.md` ("regra copiada que diverge em silêncio").
   - Não toquei em nada — pedido explícito seu foi registrar e não consertar
     agora. Pra retomar: alguém precisa decidir o que `LEFT_FACING_STAGES`
     deveria conter (quais estágios olham pra esquerda) e ajustar a chamada
     de `getSpriteForStage` pra 2 argumentos.
   - `desktop/node_modules` foi instalado nesta sessão (`npm install` dentro
     de `desktop/`) — 19 vulnerabilidades reportadas (18 high, 1 critical),
     mesma categoria do item de `npm audit` já listado abaixo pro repo raiz.

0. **Mascote — RESOLVIDO, mas nada integrado no código ainda.** Depois de
   várias rodadas de exploração (blob roxo, dragão, tentativas rejeitadas —
   `mascot.png`/`mascot-dragon.png`/`mascot-v2.png`, os dois últimos **NÃO
   USAR**: `mascot-dragon` foi descartado por você e `mascot-v2` ficou
   parecido demais com o Eevee, risco de IP), a direção final que você
   aprovou foi o **corvo médico-da-peste** (preto, máscara facial creme em
   formato de coração, cartola preta, lanterna acesa) — o mesmo design que já
   tinha saído como `mascot-candidates/h-coruja-lanterna.png` numa rodada
   anterior e que você depois trouxe de volta via referência externa
   (imgur, imagem idêntica byte a byte à que eu já tinha gerado).
   - **Arquivo canônico:** `src/assets/brand/mascot-final.png` (alpha real).
   - **Versão adaptada pro jogo** (pixel art, via `nano_banana_pro` como você
     pediu): `src/assets/brand/mascot-ingame/idle.png`. Só a pose idle foi
     gerada — as outras 3 poses do `docs/MASCOTE-PRINCIPAL.md` §5.4-ish
     (cumprimento, quieto/dormindo, apresentando) ficaram de fora, ninguém
     pediu ainda.
   - **Logo oficial:** `src/assets/brand/final/logo.svg` (vetor, Recraft
     V4.1) — badge do corvo + wordmark "Soulmon". Substitui o
     `logo-raw.svg` antigo (que era só um badge abstrato sem mascote,
     gerado antes de você exigir o corvo na marca — pode apagar o antigo).
   - **Ícone do app:** `src/assets/brand/final/icon-{192,512,1024}.png` —
     recortado direto do SVG do logo (zero custo de geração extra), fundo
     roxo degradê arredondado com o corvo centralizado. Candidato a
     substituir `public/favicon-192x192.png`/`favicon-512x512.png`, mas eu
     NÃO troquei — troca de favicon é decisão de integração.
   - **Vídeo de loading:** `src/assets/brand/final/loading.mp4` (+
     `loading-thumb.webp` como poster/thumbnail) — Seedance 2.0 Mini, 4s,
     9:16, corvo balançando e piscando com a lanterna acesa sobre fundo roxo
     degradê. Custou ~10 créditos (vs. ~45 do Seedance 2.0 full que usei pro
     vídeo de evolução na rodada anterior — vale considerar trocar aquele
     também se o custo incomodar).
   - **18 sprites de "branches" das 6 espécies favoritas** (ferreiro-coelho,
     carneiro-lã, raposa-filhote, dino-goggles, imp-flamejante, coruja — SEM
     ser o corvo/mascote, são espécies jogáveis separadas) em
     `src/assets/brand/mascot-branches/`, cada uma nos 3 galhos
     (poder=vermelho / harmonia=ciano / benevolência=dourado), usando o
     template EXATO validado em `utils/oracle.ts` (Tamagotchi-style,
     16x16→gerado em 32x32, sem contorno/sombreado). **Não confundir com o
     mascote** — são propostas de espécie pro oráculo gerar, não pra marca.
   - **Nada disso foi ligado no código.** `EvolutionCeremony`, `IntroScreen`,
     `favicon.svg`/`manifest.json`, e o pool de espécies do `oracle.ts` ainda
     usam o que já existia. Integração é passo separado, como sempre nesta
     sessão.
   - Custo: a rodada consumiu a maior parte dos créditos Higgsfield (de
     ~460 pro plan até ~110 no fim) — em parte por 2 lotes de 18 gerações
     rodados em paralelo por engano (`mascot-branches-v2`/`-v3`, apagados,
     ~36 gerações jogadas fora). Ícones usados em `low`/`1k` (0.5 crédito
     cada) e o logo em Recraft vetor (2.5 créditos) por sugestão sua —
     ajudou a esticar o que sobrou.

1. **Assets fonte estão pesados demais.** Todo PNG gerado saiu em 2048×2048
   (padrão do `gpt_image_2`), mas é exibido em 12–104px na UI:
   - `src/assets/decor/` — 35 MB (14 peças)
   - `src/assets/icons/` — ~22 MB (8 ícones)
   - `src/assets/backgrounds/` — ~8,5 MB (3 cenários)
   - `src/assets/video/evolution-bg.mp4` — 3,8 MB
   - **Total: ~70 MB** de fonte pra elementos que, na tela, ocupam no máximo
     algumas dezenas de pixels. `dist/` é commitado (ver CLAUDE.md) — isso
     infla o repo de verdade, não só o build.
   - Ação sugerida: `sharp().resize()` cada PNG pro tamanho real do slot/ícone
     (×2 ou ×3 pra retina, não ×20) antes de commitar. Eu não fiz isso sozinho
     porque é uma decisão de trade-off (nitidez vs peso) que prefiro que você
     valide, não uma limpeza óbvia.

2. **`npm install` rodou e trouxe 13 vulnerabilidades** (2 moderate, 10 high,
   1 critical) reportadas pelo próprio npm — pré-existentes na árvore de
   dependências, não introduzidas por mim. Não rodei `npm audit fix` nem
   `--force` (pode subir major version e quebrar algo). Decida se quer ver o
   relatório (`npm audit`) e resolver, ou se ignora por ora.

3. **Commit.** Nada desta sessão (nem a rodada anterior de decoração, nem
   esta de ícones/cenários/vídeo + toda a integração no código) foi
   commitado ou dado push, por instrução original seguida à risca. Isso
   inclui `package-lock.json` atualizado pelo `npm install`. Decida se quer
   revisar você mesmo antes, ou se eu preparo o commit numa próxima sessão.

4. **QA visual não rodou.** Não consegui tirar screenshot do app — o painel
   do navegador não renderizou neste ambiente (timeout ao compositar,
   provavelmente limitação local, não do código). `npx tsc --noEmit` limpo e
   `npx vitest run` com 379/379 passando, e o servidor dev (`npm run dev`,
   porta 3000) sobe sem erro nos logs — mas ninguém *olhou* a tela ainda.
   Antes de considerar a integração "pronta" (regra do CLAUDE.md), alguém
   precisa abrir o app e conferir visualmente: item de cura, chips, medalhas
   na vitrine/pódio, os 3 cenários `bg-matrix`/`bg-ocean`/`bg-gameboy`, a
   cerimônia de evolução com vídeo, e o confete no relatório de dia perfeito.

## Executar (quando quiser)

5. **Scripts descartáveis desta sessão** ainda no repo:
   `scripts/gen-decor-remaining.sh`, `scripts/gen-ui-assets.sh` — só serviram
   pra gerar os assets já baixados, não são parte do fluxo permanente. Apagar
   ou manter é indiferente pro funcionamento; `scripts/dechecker.mjs`
   recomendo MANTER (é reutilizável — converte o "xadrez fake" que o
   `gpt_image_2` desenha em vez de alpha real).

6. **`.claude/launch.json`** foi criado nesta sessão pra abrir o preview local
   (`npm --prefix repo run dev`, porta 3000). Fica no repo se quiser reusar,
   ou apague se preferir configurar diferente.

## Contexto rápido do que já foi feito (sem pendência)

- Typecheck e os 379 testes passam limpos com todas as integrações.
- `EvolutionCeremony.tsx`: vídeo substituiu o placeholder CSS (`.evo-bg`
  removido de `index.css`).
- `ItemsWindow.tsx`: coraçãozinho e os 3 chips usam PNG com alpha real em vez
  de emoji (emoji continua sendo a CHAVE de inventário internamente — só o
  visual mudou).
- `PetStageDecor.tsx`: as 14 peças de mobília agora renderizam a arte real
  (antes emoji), e as medalhas de season (ouro/prata/bronze) também.
- `ShopModal.tsx`: miniaturas de mobília na loja mostram a arte real.
- `backgrounds.ts`: `bg-matrix`/`bg-ocean`/`bg-gameboy` trocaram gradiente CSS
  por imagem (`bg-gameboy` precisou de 2 tentativas — a 1ª saiu como moldura
  de aparelho, não cenário).
- `DailyReportModal.tsx`: confete aparece atrás do ícone só em dia perfeito,
  só no tema padrão (win98/glitch ficaram como estão, de propósito).
