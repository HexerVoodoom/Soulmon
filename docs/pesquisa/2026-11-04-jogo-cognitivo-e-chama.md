# Pesquisa: jogo de resolução de problemas (substituto da Colcha) + exercício da Chama

Data: 2026-11-04 · só leitura, sem mudança de código.

## Contexto do código (não duplicar)

Jogos de mente existentes em `src/utils/mente/`:
- `eco` — sequência espacial (memória de trabalho, tipo Corsi)
- `bolhas` — go/no-go (inibição/atenção)
- `troca` — troca de regra DCCS/Wisconsin (flexibilidade cognitiva)
- `picross` — nonograma (dedução lógica)
- `zip` — caminho único hamiltoniano (puzzle espacial)
- `revisao` — Leitner, recuperação espaçada
- `patches` (Colcha/Patchwork) — dividir grade em retângulos por área (Shikaku). É **o alvo da troca**: sobrepõe picross/zip (mais um puzzle de dedução em grade) e não treina planejamento.

Lacuna real: **planejamento / antecipar estados futuros** (função executiva "planning") e **raciocínio indutivo/abstrato**. Nenhum jogo atual cobre.

Ressalva honesta de evidência (vale para tudo): treino cognitivo melhora a tarefa treinada e tarefas próximas; transferência distante ("ficar mais inteligente") é fraca — Simons et al., *Psychological Science in the Public Interest*, 2016 (https://journals.sagepub.com/doi/10.1177/1529100616661983); FTC multou a Lumosity em US$ 2 mi por alegações sem prova, jan/2016 (https://www.ftc.gov/news-events/news/press-releases/2016/01/lumosity-pay-2-million-settle-ftc-deceptive-advertising-charges-its-brain-training-program). Copy do app não deve prometer "treina seu cérebro"; dizer "exercita planejar".

## Parte A — 3 candidatos

### A1. Pedras do Bosque — Torre de Londres (RECOMENDADO)
- Mecânica: 3 galhos/pilares de alturas diferentes (cabem 1/2/3 pedras rúnicas). Estado inicial e estado-alvo mostrados; mover só a pedra do topo. Meta: chegar ao alvo no **número mínimo de movimentos** (exibido: "em 4 movimentos"). Pontua mais quem planeja antes de tocar (tempo até o 1º toque é medido no ToL clássico).
- Habilidade: planejamento, sequenciação de submetas, inibição de movimento impulsivo, memória de trabalho.
- Evidência/precedente: ToL é instrumento padrão de planejamento (Shallice, 1982); usado como desfecho executivo em ensaios clínicos (NCT02920632, protocolo de treino cognitivo em Parkinson — https://cdn.clinicaltrials.gov/large-docs/32/NCT02920632/Prot_SAP_000.pdf); validação em adolescentes brasileiros, *Dementia & Neuropsychologia* (https://scielo.br/j/pn/a/3DSHg5tKtMVBLLy7775JpcK/abstract/?lang=en). Peak e CogniFit têm variantes de "planejamento em torre". Evidência de **transferência** a partir de treinar ToL é fraca (busca 2026-11-04 não achou RCT grande) — vale como exercício executivo, não como cura.
- Rodada mobile 1–3 min: 5–8 problemas por rodada; dificuldade = movimentos mínimos 2→7, mais pedras (3→5), alvos que exigem mover pedra "errada" primeiro (conflito de submeta). Escada adaptativa ~80% de acerto como `bolhas`. Erro não é game over: botão desfazer, só não ganha a estrela de "ótimo".
- Tema: galhos de árvore antiga, pedras rúnicas com glifo de elemento, pet ajeita as pedras num altar de musgo. Zero engrenagem.
- Esforço: **S/M**. Gerador = BFS sobre estados (espaço minúsculo: 36 estados com 3 bolas), garante ótimo exato e testável no padrão puro de `mente/`.

### A2. Selo Faltante — matrizes estilo Raven
- Mecânica: grade 3×3 de selos arcanos com regras (cor, número de pétalas, rotação, progressão); célula final vazia; escolher entre 4–6 opções.
- Habilidade: raciocínio indutivo/abstrato, inteligência fluida.
- Evidência: Raven é o padrão de Gf; Jaeggi et al., PNAS 2008 (https://www.pnas.org/doi/10.1073/pnas.0801268105) alegou ganho em matrizes via n-back, replicações mistas (Melby-Lervåg & Hulme 2013, https://doi.org/10.1037/a0028228). Elevate/Peak usam formatos de padrão.
- Mobile: 8–10 itens/90 s; dificuldade = nº de regras simultâneas (1→3). Gerador procedural com distratores que violam 1 regra (evita atalho de "opção mais comum" — usar método de distratores balanceados, Matzen et al. 2010).
- Tema: ótimo (sigilos, flores, fases da lua). Esforço: **M** (arte de símbolos composicionais + gerador sem viés).

### A3. Trilha do Riacho — Rush Hour / blocos deslizantes
- Mecânica: troncos deslizam só no seu eixo; liberar a saída para a folha-barquinho do pet.
- Habilidade: planejamento com restrições, raciocínio espacial.
- Evidência: precedente forte de mercado (Rush Hour, ThinkFun; "Unblock Me"); estudo como tarefa de resolução de problemas (Jarušek & Pelánek, 2010, "Human problem solving: Sokoban case study"/Rush Hour difficulty model — https://www.fi.muni.cz/~xpelanek/publications/). Pouca evidência de treino.
- Mobile: 1 puzzle/rodada, 1–3 min; dificuldade = movimentos ótimos. Precisa banco gerado offline + solver.
- Tema: bom. Esforço: **M/L**. Risco: sobrepõe "puzzle espacial" de `zip`.

**Recomendação: A1 (Pedras do Bosque/ToL)** — cobre a lacuna exata (planejamento), tem o melhor lastro como tarefa executiva clássica, menor esforço, gerador com ótimo provável e prova por teste. A2 é boa segunda opção se quiser também raciocínio abstrato.

## Parte B — Chama (trataka)

### O que se sabe
- Literatura: RCT em idosos (n=55, trataka vs. lista de espera) melhorou cognição — Talwadkar et al. (PMC4097909, https://pmc.ncbi.nlm.nih.gov/articles/PMC4097909); sessão única vs. exercício ocular em 41 jovens melhorou memória de trabalho e atenção espacial — Frontiers in Psychology 2021 (https://www.frontiersin.org/articles/10.3389/fpsyg.2021.773049); revisão sistemática (https://ruralneuropractice.com/trataka-and-cognition-a-systematic-review-with-a-proposed-neurophysiological-mechanism/). Estudos pequenos, mesmo grupo (SVYASA, Índia), protocolos heterogêneos — evidência preliminar. Acessado 2026-11-04.
- Protocolo clássico (Hatha Yoga Pradipika; SVYASA): olhos abertos fitando a chama sem piscar o quanto for confortável (1–3 min) → fechar olhos e segurar a imagem residual no "olho da mente" → repetir 2–3 ciclos; algumas versões incluem exercícios oculares antes e "palming" (mãos em concha nos olhos) depois.
- Apps: Insight Timer tem dezenas de faixas guiadas de "candle gazing/trataka" de 5–20 min, só áudio, cue de voz para fechar olhos; Calm e Headspace têm meditação de foco em objeto ("focus on an object") em áudio, sem chama visual dedicada; apps nicho ("Trataka — candle meditation", Play Store) mostram vídeo de vela em loop + timer. Padrão comum: duração 3/5/10 min, sino suave nas transições, tela escura, "se a mente fugir, note e volte" (notação de distração, estilo Headspace "noting"). (Observação baseada em conhecimento dos catálogos, não em navegação desta data — conferir antes de citar publicamente.)
- Segurança: piscar quando precisar (não forçar sem piscar → olho seco/ardência); quem tem epilepsia fotossensível: evitar cintilação — **chama digital sem flicker rápido** (WCAG 2.3.1: nada piscando >3×/s, https://www.w3.org/WAI/WCAG21/Understanding/three-flashes-or-below-threshold.html); quem usa lente de contato, tem glaucoma, cirurgia ocular recente ou enxaqueca com aura: fazer versão de olhos fechados; brilho moderado, chama não ocupar >~15% da tela, sem branco puro (afterimage virá de contraste, não de brilho).

### Desenho proposto: "Chama" (tela cheia)
Visual: fundo escuro do mundo Soulmon (bosque noturno, quase preto azulado), chama âmbar-turquesa pequena no centro, oscilação lenta (~0,3–0,5 Hz, sem flicker), UI some após 3 s (toque mostra botão sair). Sem placar visível.

Durações: Curta 3 min · Padrão 5 min · Longa 10 min (2/3/5 ciclos). Opção "olhos fechados" (só áudio) para quem tem contraindicação.

| Fase | Duração (5 min) | O que o usuário faz | PT-BR | EN |
|---|---|---|---|---|
| 0 Chegada | 20 s | sentar, celular à altura dos olhos, ~50 cm | "Apoie o celular na altura dos olhos. Ombros soltos. Respire devagar." | "Rest the phone at eye level. Loosen your shoulders. Breathe slowly." |
| 1 Olhar | 60 s | fitar a chama, piscar quando precisar | "Olhe para a chama. Pisque quando precisar, sem esforço." | "Gaze at the flame. Blink whenever you need — no strain." |
| 2 Fechar | 40 s | fechar olhos, segurar a imagem residual | "Feche os olhos. Guarde a chama por dentro, entre as sobrancelhas." | "Close your eyes. Hold the flame inside, between your brows." |
| (repetir 1–2 ×2) | | tela escurece na fase 2; sino suave | "Se a mente fugir, só note: 'pensando'. E volte." | "If your mind wanders, just note: 'thinking'. Come back." |
| 3 Repouso | 30 s | palming, olhos fechados | "Esfregue as mãos e cubra os olhos. Descanse." | "Rub your palms and cover your eyes. Rest." |
| 4 Fecho | 10 s | abrir olhos | "Abra os olhos devagar. Pronto." | "Open your eyes slowly. Done." |

Sinais: sino suave + vibração curta (haptic leve, 1 pulso) a cada troca de fase, já que olhos fechados não veem a tela; voz opcional (TTS ou gravação) com legendas. Som ambiente opcional: crepitar baixo/vento no bosque. Tela fica acesa (wake lock). Distração: opcional tocar 2× a tela ao perceber distração (contagem privada, nunca mostrada como nota — só "você voltou 4 vezes", enquadrado como positivo: voltar é o exercício).

Recompensa sem gamificar o foco: valor fixo e pequeno de Bits **por sessão concluída, 1×/dia** (mesmo modelo de `revisao`), nunca por "tempo sem distração"; sem ranking, sem streak que zera; fecho narrativo — "A chama do seu pet ficou um pouco mais quente" (liga à lanterna da evolução, ver memória "evolução é a lanterna") e o pet aparece dormindo/calmo. Sair no meio não pune; só não paga.

Aviso inicial (1ª vez, curto): "Pisque à vontade. Se tiver sensibilidade à luz, epilepsia ou problema nos olhos, use o modo olhos fechados." / "Blink freely. If you have light sensitivity, epilepsy or an eye condition, use eyes-closed mode."
