# Sprite de criatura: specs da SQUAD-ARTE e custo Higgsfield gpt_image_2 (levantamento, 13/10/2026)
Nenhuma imagem gerada, nenhum crédito gasto. `higgsfield` NÃO está no PATH (CLI não consultado).

## PARTE 1 - Specs (fontes: arte-gerador.md, ASSETS-A-GERAR §1/§3, scripts/, motor.ts, generate-sprite.js)
(a) Formato final: sprite 256x256 PNG com alfa real, um por pet, reescala `fit:contain` fundo alfa 0 (sharp; finalize-oracle-sprites.sh), nearest no pipeline de pixel. Árvore genérica antiga 384². Checagem do conferente: alfa real, 0% xadrez, 0% magenta/roxo. Fundo NA GERAÇÃO: o doc manda peça única sobre verde chapado #00FF00 + chroma-key (chroma-key.mjs: key, despill, descarta ilhas <24px, recorte da bbox, nearest); alternativa em folha sobre branco + _fatiar.mjs. "Transparent PNG" nunca é aceito. Na prática (histórico real) o gpt_image_2 devolve xadrez assado -> dechecker.mjs (flood-fill de branco/cinza do xadrez); Soul/Nano Banana 2 Lite e `image_background_remover` do Higgsfield já foram usados para alfa.
(b) Prompt: nunca à mão. `generateOracle*(input, seed).creature.stages[].imagePrompt` (e `imagePromptFallback`, sem citar franquias). Script: scripts/simulate-oracle-lines.ts (`npx tsx`). Já existe saída em builder/prompts-sprite/dados-brutos.json (3 usuários, 5 formas + 2 ramos de champion cada = 21 prompts, 801-872 chars).
(c) Referências: sem anexo de estilo fixo para criatura; a referência é encadeada: cada forma recebe a anterior da MESMA linha (rookie->champion->ultimate->mega->ultra) via image2image (`gen-line-from-oracle.sh --image`; app: referenceImageUrls = sprite anterior). CLI aceita só arquivo local (`--image-references`), não URL. Bloco [SPRITE] (paleta teal/ciano/cobre) é de ícones/FX, não do oráculo.
(d) Pipeline: arte-gerador gera e entrega em _gemini_out/criaturas-<data>/ com INSTALAR.md (+seed do run) -> dechecker.mjs / debackground-lines.mjs (gerador) -> finalize-oracle-sprites.sh 256² -> arte-conferente (bloqueante, CONFERENCIA.md, hash MD5, folha de contato) -> arte-instalador (src/assets/soulmon/lines/, DUNGEON_LINE_SPRITES/NAMES, guard sprites.dungeonRoster.test.ts, CACHE_VERSION, tsc/vitest/build). Gerador não toca src/. Linha sem sufixo -mon.
(e) Regras duras: "Do not copy any existing franchise character" em TODO prompt (as duas variantes); nada Bandai/Digimon (Attributions.md); a variante 1 cita Digimon/Pokémon etc. como gênero e o bestiário nomeia inspiração (ex.: "Belphemon", "Agumon" aparecem em dados-brutos) -> risco de IP real, só a variante fallback é limpa. SPRITE_FACING_PROMPT (src/utils/spritePose.ts, importado em oracle/motor.ts, branch integ/beta-2): "Side profile view, the creature faces RIGHT (toward the right edge of the image), never facing left." Paleta sem magenta/roxo/rosa vale para assets de UI, não está no prompt de criatura (que usa colorDesc do oráculo). Pixel art só dentro do visor.
(f) Lacunas/contradições:
 1. generate-sprite.js (main e integ/beta-2) usa Higgsfield **Soul** (`/v1/text2image/soul`, `/v1/image2image/soul`), width_and_height 1536x1536, quality 720p, batch 1; NÃO usa gpt_image_2. Docs de arte falam em gpt_image_2/nano_banana_2_lite via CLI. Produção != pipeline de arte.
 2. O código NÃO faz chroma-key, dechecker, resize 256 nem nearest: republica o bruto 1536² em KV (`/api/sprite-image?k=`). Nenhum fundo verde é pedido; o prompt diz "16x16 pixel art, no background, transparent background" (exatamente o que o guia proíbe). Tamanho/alfa dependem do que o Soul devolve (não verificado).
 3. Fallback Gemini gemini-2.5-flash-image (texto puro, sem ref).
 4. Auth da API: `Key HF_API_KEY:HF_SECRET` (plataforma, cobrança API) - ver Parte 2.
 5. Comentário em generate-sprite.js aponta oracle.ts; hoje o dono é oracle/motor.ts.
 6. _aiGuard.js diz "Starter US$15 = 800 imagens"; fontes públicas de ago-set/2026 dão Starter US$19/270 créditos. Ver abaixo.
 7. ASSETS-A-GERAR fala "arte-criatura" (agente fundido em arte-gerador familia=criatura).

## PARTE 2 - Custo Higgsfield gpt_image_2
| Item | Valor | Fonte | Data |
|---|---|---|---|
| gpt_image_2, 1k, low/medium/high | 0,5 / 2 / 4 créditos | docs/BACKLOG-ARTE-GERAR.md ("Estado da conta"), medido pelo próprio CLI do dono | 14/08/2026 |
| "GPT Image" low/med/high | 1 / 2 / 5 créditos (sem "2" no nome) | resumo de busca da pág. higgsfield.ai/pricing (a página é JS, WebFetch não leu) | consulta 13/10/2026, NÃO confirmado |
| 2k, 4k, aspect 1:1 vs outros | NÃO confirmado | - | - |
| Starter | US$19/mês, 270 cr (US$0,0704/cr) | krea.ai/blog higgsfield-pricing-explained (preços de 31/08/2026) | publ. 05/09/2026 |
| Plus | US$59 mensal (47 anual), 1.200 cr (0,049 / 0,039) | idem | idem |
| Ultra | US$129 mensal (99 anual), 3.000 cr (0,043 / 0,033) | idem | idem |
| Pacotes avulsos (exigem assinatura, expiram 90 d) | 80cr/$5 ... 1.700cr/$80 (0,0625 a 0,0471/cr) | idem | idem |
| Plano do dono | "pro", 1,5 crédito de saldo | BACKLOG-ARTE-GERAR / DEPENDE-DE-VOCE #19 | 14/08/2026; atual NÃO verificado (sem CLI) |
| API (platform, key) x CLI/MCP | Cobranças separadas: API = saldo pré-pago em US$, não usa créditos da assinatura | seedance.tv/blog higgsfield-api-pricing-per-video (terceiro) | 13/10/2026, não oficial |
| Concorrência | 4 jobs simultâneos no plano pro; excesso derruba todos (rate_limit_reached) | BACKLOG-ARTE-GERAR | ago/2026 |
| Edição com imagem de referência | preço NÃO confirmado (provável igual ao de geração) | - | - |
| Remover fundo (`image_background_remover`) | NÃO confirmado | - | - |
Confirmar: `higgsfield generate cost gpt_image_2 --prompt ... --aspect_ratio 1:1 --resolution 1k --quality medium` (leitura) quando o CLI estiver instalado.

## PARTE 3 - Estimativa (21 prompts já existem; base: gpt_image_2 1k, 1:1; crédito Starter US$0,0704)
Imagens: 15 (3 x 5 formas) + 6 (champion dos outros 2 ramos) = 21.
| Cenário | Imagens | Créditos low(0,5) | medium(2) | high(4) | US$ medium | US$ high |
|---|---|---|---|---|---|---|
| A: 1 por imagem (21) | 21 | 10,5 | 42 | 84 | 2,96 | 5,91 |
| A mínimo (15) | 15 | 7,5 | 30 | 60 | 2,11 | 4,22 |
| B: 2 tentativas (21x2) | 42 | 21 | 84 | 168 | 5,91 | 11,83 |
| C: com ref anexa (21) | 21 | 10,5* | 42* | 84* | 2,96* | 5,91* |
*Pressupõe preço de edição = geração (não confirmado). C sobre B (2 tentativas): 84 cr medium. Remoção de fundo extra: não incluída (chroma-key/dechecker locais são grátis).
Contexto: Starter = 270 cr. Medium A = 15,6% do mês; B = 31%; high B = 62%. O "800 imagens/US$15" é só o teto de app (`globalMonth: 800`, _aiGuard.js; abuso-e-custo.md cita o mesmo): 21 a 42 imagens = 2,6% a 5,3% do teto, mas em créditos reais 800 imagens medium = 1.600 cr = ~US$113 (Starter) - o "800/US$15" NÃO se confirma. Saldo atual do dono (1,5 cr em ago) não cobre nada.

## Dúvidas para o dono
1. Usar gpt_image_2 (pipeline de arte) ou Soul (o que produção usa)? Define se o teste vale para produção.
2. Qual qualidade/resolução (low 0,5 / medium 2 / high 4) e saldo/plano atuais?
3. Aceita prompt com variante de referências (cita Digimon/Pokémon/bestiário) ou só a fallback limpa, dado o risco de IP?
4. Fundo: pedir verde #00FF00 + chroma-key (guia) em vez do "transparent" do prompt do oráculo?
