# Plano de design do site do Soulmon (v3, 05/11/2026)

Base: [BENCHMARK-VISUAL-JOGOS.md](BENCHMARK-VISUAL-JOGOS.md) (18 sites) e [BENCHMARK-VISUAL-MOBILE.md](BENCHMARK-VISUAL-MOBILE.md) (22 sites), sobre capturas reais em `E:\Soulmon-marketing\_pesquisa\`. Regras do dono continuam valendo: [PLANO.md](PLANO.md) §16 a §18 e [FEATURE_TRUTH.md](FEATURE_TRUTH.md).
Sistema e guia: [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) e [DESIGN-GUIDE.md](DESIGN-GUIDE.md).

## 1. Diagnóstico

O site atual acerta na promessa, no CTA único, na ausência de banner e no campo único. Perde para as referências em seis pontos:

1. **Hero desktop vazio:** o mapa ocupa uma tira; 15 de 18 sites de jogos abrem com arte em tela cheia.
2. **Uma criatura pequena:** os melhores abrem com elenco (Palworld, Cult of the Lamb).
3. **Sem tela real do jogo na 1ª dobra:** 8 de 22 sites mobile mostram, e são os mais claros (Neko Atsume, Umamusume).
4. **Escuro sem ritmo:** todas as seções têm o mesmo fundo; os melhores trocam o cenário inteiro por seção (Sea of Stars, Stardew).
5. **CTA some na rolagem** no desktop.
6. **Pop-up termina em "Fechar"**, sem próximo passo.

## 2. Conceito: "cada rolagem é um lugar"

O visitante atravessa o mundo do Soulmon de cima a baixo. Cada seção é uma área do jogo em tela cheia, com criaturas vivendo nela, e a mensagem aparece como parte da cena. O fio condutor é a barra de cobre com energia turquesa, que enche conforme a pessoa desce.

Mensagem que domina: **faz tarefa, seu Soulmon evolui.** Texto mínimo: título de até 6 palavras e uma frase curta por seção.

## 3. Estrutura

| # | Seção | Lugar (fundo) | O que mostra | Origem no benchmark |
|---|---|---|---|---|
| 0 | Barra superior fixa | | Logo pequeno, idioma, botão "Entrar no beta" compacto | CTA persistente (Eastward, Duolingo) |
| 1 | Hero | Exploração, em tela cheia | Logo grande, H1, elenco de 5 a 7 criaturas (uma grande), CTA + "Ver o jogo", "50 vagas" em tamanho de título, linha "Android, pela Google Play" | Palworld, Cult of the Lamb, Forest |
| 2 | O jogo na sua mão (v3.1: fundida com a 3) | Laboratório | Aparelho com o loop real ("Gameplay real") ao lado da demo interativa; um título só, sem os 3 passos | Neko Atsume, Habitica |
| 3 | Faça a tarefa | Laboratório | Demo interativa: lista de tarefas no estilo real da Home ao lado da criatura no disco; scroll e toque | Habitica |
| 4 | Seu Soulmon | Jogos | Fichas de criatura, uma por vez, com setas e chips de elemento; número grande "20 elementos, mais de 200 combinações"; árvore de 5 formas com "?" | Cookie Run, Palworld |
| 5 | O universo | Hall | Abas pedidas pelo dono: Universo, Habitantes, Jogos, Elementos; no celular viram chips com cartões deslizáveis | Decisão do dono (0 de 18 usam abas; ver §6) |
| 6 | O que você faz | Arena | 3 cartões com tela real do app (Home, Hall, Jogos) + título + 1 linha | Sea of Stars |
| 7 | Abertura | Fundo calmo | Vídeo de abertura, rotulado cinemática | |
| 8 | Como entrar | Painel calmo escuro | 3 medalhões na moldura de cobre da ficha; regra das 50 vagas em 1 linha | (v3.1: sem superfície clara) |
| 9 | Perguntas | Fundo calmo | FAQ | |
| 10 | Entre no beta | Cena final com criaturas | E-mail + botão grande + linha legal; compartilhar | Eastward (fechar com cena e convite) |

No celular, o botão fixo inferior continua, e some quando um formulário está visível.

## 4. Regras de composição

- **Cena cheia:** mapa em tela cheia como fundo, com véu escuro só onde há texto; nunca mapa dentro de cartão pequeno.
- **Elenco:** criaturas de `novos/` em tamanhos inteiros, pisando no cenário; nenhuma da DEMO; sem lagarto com chama na cauda.
- **Tela real:** todo print ou vídeo de gameplay aparece dentro de moldura de aparelho e com rótulo. A demo interativa continua rotulada como demonstração.
- **Ritmo:** cena cheia alterna com painel calmo, tudo escuro. **v3.1 (06/11):** a seção clara saiu (quebrava a atmosfera e os cartões brancos pareciam template); o respiro vem do painel calmo. Fecho na Guilda inteira (não repete a Exploração); a faixa da Guilda antes de Como entrar saiu para a Guilda não aparecer duas vezes.
- **Ornamento:** só da identidade: cobre, cristal com chama, folhas, circuito. Divisor entre seções com cristal e folhas.
- **Número grande:** só real. "50 vagas", "20 elementos", "mais de 200 combinações", "5 formas".
- **Pop-up de sucesso:** termina em "Compartilhar", com "Fechar" secundário.
- **Movimento:** criaturas com flutuação leve, cena trocando no scroll, barra enchendo; tudo desliga em movimento reduzido.

## 5. Orçamento e acessibilidade

LCP mobile abaixo de 2,5 s, JS inicial abaixo de 90 KB, CLS abaixo de 0,1, acessibilidade 95 ou mais, contraste 4,5:1 sobre arte, teclado completo, sem JS legível. O hero em tela cheia não pode piorar o LCP: imagem do hero em AVIF dimensionada por tela, elenco carregado depois.

## 6. Onde sigo o dono contra o benchmark

- **Abas no Universo:** nenhum dos 18 sites de jogos esconde conteúdo em abas. O dono pediu abas, então ficam, mas com a primeira aba rica e cartões deslizáveis no celular.
- **Sem depoimentos nem números de comunidade:** o benchmark sugere prova social; o Soulmon ainda não tem, e não se inventa.
- **Mercado e Forja fora**, mapa-múndi fora, nada da DEMO.

## 7. Lacunas do benchmark

- Nenhum dos 22 sites mobile era página de pré-registro ou beta: contador, metas e recompensa por marco ficaram sem referência real.
- Movimento e parallax foram inferidos de imagens estáticas.
- 4 sites não abriram (Dave the Diver, Moonlighter, Monument Valley 3, Squad Busters); 6 eram tela única.
- Não foram vistos sites premiados em Awwwards ou FWA como categoria.

## 8. Entrega

1. Design system e design guide escritos.
2. Site reconstruído sobre o sistema, PT e EN, com o loop e os prints reais de `E:\Soulmon-marketing\site\`.
3. Crítica de design, QA e medição.
4. Prints por seção para o dono. Publicação continua bloqueada pelos itens do `DEPLOY.md`.

## 9. Changelog

- **v3.1, 06/11/2026:** seções 2 e 3 fundidas (aparelho real + demo); Como entrar volta ao escuro com moldura de cobre; fecho na Guilda; trailer de 60 s desligado (slot em `midia.json`, rótulos internos e frase vetada no arquivo atual); uma escala de pixel por cena.
