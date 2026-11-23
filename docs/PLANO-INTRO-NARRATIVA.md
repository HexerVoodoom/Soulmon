# Plano — Intro narrativa jogável (pós-criação do Soulmon → Home)

> Etiqueta: **plano** (12/11/2026). Nada implementado. Pedido do dono na íntegra: `E:\Soulmon-assets\_pedidos\INTRO-NARRATIVA-PEDIDO-DO-DONO.md`.
> Decisões do dono nesta sessão marcadas **[N]**. Parte objetivo anual é de outra sessão e está fora.

## 1. Decisões [N]

| # | Decisão |
|---|---|
| N1 | **Escopo:** substitui só a sequência pós-criação do "Onboarding do Velado" (`src/components/onboarding/sequencia/*`, cenas 2–9 antigas: fuga, puzzle, bifurcação, resgate-lanterna). **Ficam**: ritual com o ancião, berço/BB do pool, preço, Guilda (D1–D34). Vídeo de abertura e perguntas/criação não mudam. |
| N2 | Entra em **beta seguinte**, atrás de interruptor. Branch própria, PR sem merge até o dono testar na prévia. beta12 não muda. |
| N3 | **Pular:** pula falas, nunca as etapas jogáveis (tarefa, alimentar, luta, botão Subir). "Rever a história" nas Configurações, sem tocar no save. |
| N4 | **Combate:** roteirizado leve, visual do combate real (cenário/sprites de `BattleStage`), turnos fixos e determinísticos, sem save/recompensa. |
| N5 | **Duração ~4 min**, ~60% cena / ~40% jogável. |
| N6 | **Elenco:** o "Velado de glitch" = **Desfeito** já instalado (`desfeito.png`, `desfeito-soulmon.png`) + overlay de glitch; quem fala de cima = **Velado da Mão** (arte pronta). Zero sprite novo de personagem. |
| N7 | **Idiomas** EN + PT-BR. **Progresso** local por cena (retoma após fechar o app); "vista" marcada como hoje. Sem servidor. |

## 2. Itens (Núcleo de Demanda) — D-01…D-16, critério de aceite

| Item | Pedido | Aceite testável |
|---|---|---|
| D-01 | Tela escura, texto "Acorda, temos que ir" | preto ≥1,2 s, depois a fala aparece com fade; toque avança |
| D-02 | Olho abrindo com desfoque | faixa central horizontal; metades sobem/descem com blur animado (não corte seco), ~1,6 s; mostra cenário + ancião |
| D-03 | Ancião: "Precisamos ir", vira de costas | troca de pose (costas) por corte; fala exibida |
| D-04 | Túnel pseudo-3D estilo corrida SNES | paredes laterais em perspectiva se deslocando, chão/teto quase invisíveis; turquesa escuro; cristais, cobre, plantas, desenhos digitais tipo rupestres; ≥30 fps em celular fraco; `prefers-reduced-motion` = quadro estático com pequena oscilação |
| D-05 | Despenhadeiro com ilhas flutuantes | imagem de borda em primeiro plano e recorte do mundo ao fundo (parallax leve) |
| D-06 | Desfeito chega e ameaça (fala agressiva) | entra com glitch; fala antes do ataque |
| D-07 | Ancião pede tarefa e alimentar | abre o cartão de tarefa **igual ao da Home** (mesmos componentes), botão concluir; depois ícone de mochila centralizado embaixo; toque abre o modal de comida; dar comida; volta à cena |
| D-08 | "Agora estamos prontos" → combate 2×1 | aliado do ancião + Soulmon do jogador vs Soulmon do Desfeito; inimigo só ataca o aliado; vantagem do inimigo |
| D-09 | Corte a 1/3 de vida do ancião | ao chegar a ≤1/3 do HP do aliado, sai da luta e volta à cena (a regra antiga "corta com o inimigo a 1/3" **inverte**) |
| D-10 | Corda e voz de cima | balão posicionado no alto da cena; "Vamos, suba depressa"; botão único "Subir" |
| D-11 | Escurece e carrega cena do cristal | transição preta; ancião e Velado da Mão com as mãos no cristal |
| D-12 | Cristal brilha, tela branca | luz expande (radial) até branco total; ~1,2 s; sem flashes rápidos (a11y) |
| D-13 | Teleporte para a cidade central | volta do branco com cristal igual noutro lugar; fundo = cidade CORE (arte instalada `bg-core-cidade.jpg`) |
| D-14 | Fala de boas-vindas | "…bem-vindo a este novo, vírgula, antigo mundo…" (ver §4) |
| D-15 | "Descanse": escurece e cai na Home | fade preto, depois Home normal; marcar vista |
| D-16 | Transversais | pular falas (N3), retomar (N7), reduzir movimento, EN/PT, interruptor desligado = nada muda, "Rever a história" sem tocar save |

## 3. Cenas e estados

Máquina de estados linear, cada cena = quadros; estado persistido `introNarrativa:{cena, quadro}` local (chave nova em `storageKeys`). Estados: `idle → cena N → … → concluída`. Falha de asset = silhueta nomeada (padrão atual), nunca trava.

| # | Cena | Quadros | Interativo |
|---|---|---|---|
| 1 | Acorda | preto → fala "Acorda, temos que ir" → olho abre (blur) → ancião + cenário | toque |
| 2 | Túnel | ancião de costas, fala "Precisamos ir" → túnel pseudo-3D em canvas por ~12 s | toque (falas) |
| 3 | Despenhadeiro | borda + ilhas; Desfeito entra (glitch), fala, ameaça | toque |
| 4 | Tarefa + alimentar | slot `EtapaTarefa` → ícone mochila → `EtapaAlimentar` → "Agora estamos prontos" | **obrigatório** |
| 5 | Luta 2×1 | `EtapaDuelo` reescrita (dano só no ancião; corta a ≤1/3 do ancião) | **obrigatório** |
| 6 | Corda | voz de cima, botão único **Subir** | **obrigatório** |
| 7 | Cristal | escuro → cristal com os dois → luz → branco | auto |
| 8 | Cidade CORE | ancião fala boas-vindas (líder dos Remendados) | toque |
| 9 | Descanso | fade preto → Home | auto |

Efeito do túnel: **canvas 2D leve** (sem WebGL): faixas de parede por scanline com perspectiva (estilo corrida SNES), textura da parede repetida e escalonada, 30 fps fixos, resolução interna ~320×180 escalada com `image-rendering: pixelated`, pausa com a aba oculta, fallback estático. Orçamento: <4 ms/quadro num aparelho de entrada.

## 4. Textos (rascunho PT / EN — revisão final `alpha-redator-ux`, tom calmo, sem prometer saúde)

1. "Acorda… temos que ir." / "Wake up… we have to go."
2. "Precisamos ir." / "We have to move."
3. Desfeito: "Eu ouvi o barulho de vocês… vou desfazer tudo." / "I heard you… I will undo it all."
4. Ancião: "Cumpra uma tarefa. Seu Soulmon precisa de força para lutar. Depois, alimente-o." / "Do a task. Your Soulmon needs strength to fight. Then feed it."
5. Ancião: "Agora estamos prontos." / "Now we are ready."
6. Ancião (luta, 1/3): "Basta. Só precisamos ganhar tempo." / "Enough. We only had to buy time."
7. Voz de cima: "Vamos, suba depressa!" / "Come on, climb up quickly!" — botão **Subir** / **Climb**
8. Ancião: "Bem-vindo a este novo… (pausa) antigo mundo." / "Welcome to this new… (beat) old world."
9. Ancião: "Você tem muito a descobrir. Faça no seu tempo e volte quando quiser. Agora, descanse." / "You have much to find. Take your time, come back when you like. Now, rest."

Nomes: "Velado dos Remendados" no jogo; ancião = "O Ancião" (nome próprio ainda pendente do dono, §8).

## 5. Reuso x remoção

- **Reusa:** player base (se couber; senão novo `IntroNarrativa.tsx`), `EtapaTarefa`/`EtapaAlimentar` (conferir que usam o cartão e a mochila **da Home**, não cópias), `BattleStage`/sprites do combate, `desfeito*.png`, `velado-*.png`, `bg-core-cidade.jpg`, `bg-malha-*.jpg`, música de suspense, interruptor `ONBOARDING_VELADO`, "Rever" das Configurações.
- **Remove:** `EtapaPuzzle`, bifurcação, `CENA_3/5/8`, vídeos fuga/resgate, lanterna-granada (`velado-mao-lanterna` fica como arte sem uso), testes correspondentes, textos `c3–c8` antigos.
- **Não tocar:** ritual do ancião (cena 0), berço/BB, `GameTutorialFlow` (continua para quem não tem o interruptor), `run_worker_first`/assets do `wrangler.jsonc`.

## 6. Assets a gerar (2 amostras por categoria antes do lote; regra de identidade: UI/mapa/NPC = USAR, acento sutil em combate)

| Categoria | Existe? | A gerar | Caminho |
|---|---|---|---|
| Parede do túnel (textura repetível, lateral esq./dir.) | `bg-malha-escura` serve de referência, não de textura | 2 texturas (turquesa escuro, cristais, cobre, plantas, desenhos digitais rupestres, como o vídeo de abertura) | ChatGPT (fundo), máx 3 imagens/conversa, apagar conversa depois |
| Despenhadeiro + ilhas flutuantes | não | 1 borda (primeiro plano) + 1 panorama recortado do mapa principal | ChatGPT |
| Ancião de costas | só frontal/mão/preocupado | 1 pose de costas | **API Higgsfield** (sprite), nunca ChatGPT |
| Cristal da praça (cena 7) | referência em `PROMPT-CRISTAL.md` | 1 imagem do cristal + brilho | ChatGPT |
| Cenário "cima do penhasco" (corda) | não | 1 fundo | ChatGPT |
| Cidade CORE | `bg-core-cidade.jpg` | nada (ou variante com cristal) | — |
| Desfeito / Velado da Mão / ancião | instalados | nada | — |

Fila coordenada com a sessão operacional [soulmon] e a beta12; cota do ChatGPT hoje pausada. Registro de prompt+tags em `E:\Soulmon-assets\_banco\registro.jsonl`. **Plano roda com silhuetas nomeadas até a arte chegar.**

## 7. Riscos

1. **Desempenho do túnel** em celular fraco → canvas 320×180, 30 fps, fallback estático, medir com `alpha-perf-a11y`.
2. **Arte ausente** (cota ChatGPT) → silhuetas; o fluxo passa nos testes sem arte, o dono só aprova com arte.
3. **Dupla fonte de tutorial** (`GameTutorialFlow` x intro) → o interruptor decide um só; teste de contrato impede os dois.
4. **Tarefa sem cadastro**: a 1ª tarefa já nasce no ritual (`firstTaskValue`); se faltar, a etapa cria uma pequena sugerida.
5. **Luta que "perde"**: dano só no ancião, o jogador nunca falha; sem game over.
6. **Retomar** no meio da luta/alimentar → reinicia só a etapa, sem recompensa duplicada (alimento consumido só 1×; checar inventário).
7. **Acessibilidade:** reduced-motion, sem flash branco brusco (rampa ≥0,6 s), falas lidas por `aria-live`, botões ≥44 px.
8. **Conflito com a beta12** nos arquivos de onboarding → branch a partir da `main`, rebase quando a beta12 sair.
9. Desmonte de arquivos antigos pode quebrar contratos (`narrativa.contract`, `assets.contract`) → rodar suíte inteira, conferir `Test Files`.

## 8. Ainda depende do dono

- Nome próprio do ancião (hoje "O Ancião").
- Aprovar as amostras de arte (2 por categoria) e os textos finais.
- Datas: qual beta recebe o interruptor ligado.

## 9. Testes

- Unitário: máquina de cenas, persistência/retomada, lógica do duelo (dano só no ancião; corte a ≤1/3; determinismo), pular não pula etapas interativas.
- Render: cada cena EN/PT; reduced-motion; arte ausente = silhueta; interruptor desligado = nada renderiza.
- Contrato: nenhuma menção a saúde/cura; sem emoji; textos bilíngues presentes; tokens de design.
- Integração: App com interruptor ligado vai ritual → intro → Home e marca "vista"; "Rever" não escreve no save.
- Perf: medir quadro do canvas do túnel (alvo <4 ms entrada).
- Manual na prévia (`wrangler versions upload --preview-alias`) + APK de teste; screenshots por cena.

## 10. Execução (após aprovação)

1. Branch `feat/intro-narrativa` a partir da `main`, worktree em E:\ (limpar depois; `cmd /c rmdir` na junction de node_modules).
2. Remover sequência antiga + testes; 3. cenas e máquina; 4. túnel canvas; 5. duelo novo; 6. ligar ao App/Configurações; 7. copy EN/PT; 8. arte quando liberada; 9. suíte + a11y; 10. PR sem merge, prévia para o dono.

## 11. Ajustes da revisão adversarial (alpha-skeptic, 12/11/2026) — valem sobre qualquer trecho anterior

1. **Retomar sem pagar duas vezes:** o progresso grava `{cena, quadro, tarefaId, alimentou}`; retomar nunca chama `onCompleteTask`/`onFeed` de novo. Teste: fechar após "Sim, fiz" e reabrir não conclui 2ª tarefa nem gasta 2ª comida.
2. **Sem `GameTutorialFlow` dentro da cena:** a cena 4 usa o cartão real da Home; sem tarefa aberta, cria uma sugerida pequena direto (sem o wizard). Teste de contrato: a cena não monta `GameTutorialFlow`. `EtapaTarefa` atual (fase criar/pergunta) é reescrita.
3. **Interruptor próprio** `INTRO_NARRATIVA` (build + lista de testers), separado de `ONBOARDING_VELADO` (BB, paywall, monetização). Tabela de combinações com 1 teste cada; só testers entram antes da beta seguinte.
4. **Copy:** revisão da `/squad-narrativa` contra L1–L12 e §12 da bíblia antes do aceite: lugar = "a Malha" (sem "o outro mundo"); a ameaça do Desfeito não nasce de algo que o jogador fez (L3). Falas 3 e 8 viram rascunho a reescrever; `narrativa.contract` passa a cobrir os arquivos de copy novos.
5. **Reduzir movimento:** zero movimento (quadro estático, sem oscilação); narração em texto/aria do túnel; aparelho de referência nomeado antes do teste de perf (a definir na execução, p. ex. um Android de entrada do dono).
6. Detalhe de execução: apagar vídeos antigos pode exigir bump de `CACHE_VERSION` em `public/sw.js`.
