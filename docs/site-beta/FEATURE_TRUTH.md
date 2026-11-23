# FEATURE_TRUTH: o que o Soulmon realmente tem

Fonte única de site, vídeos e ficha da Play. Base: branch `versao/1.3.0-beta3` (v244), levantada em 05/11/2026.
Precedência: código > teste > doc. Se o código mudar, atualize aqui antes de divulgar.

**Estados**
- `implementada`: no código, ligada para o jogador; pode ser anunciada.
- `parcial`: existe com limite; anunciar só com o limite dito.
- `planejada`: fora da beta3; não anunciar.
- `conceitual`: arte ou ideia sem jogo por trás; nunca como gameplay.

## Pode anunciar

| Feature | Estado | O que dá para dizer | Limite | Fonte |
|---|---|---|---|---|
| Tarefas e hábitos reais alimentam a evolução | implementada | Concluir tarefas enche a evolução; o jogador decide quando evoluir | | `CLAUDE.md` (Regras do jogo) |
| Cuidado da criatura | implementada | Comida, carinho, banho, sono | | `CLAUDE.md` |
| Constância sem streak que zera | implementada | "N das últimas 7", folgas e perdão por ausência; falhar um dia não apaga nada | | `CLAUDE.md` |
| Evolução no cristal | implementada | Cerimônia no cristal, em estágios | Evoluir zera Poder, Harmonia e Benevolência | REGISTRO §208-209 |
| 5 iniciais | implementada | Crato, Brooka, Zefi, Oaken, Bolid | | `docs/ELEMENTOS-DOS-INICIAIS.md` |
| Elementos e estágios | implementada | Dizer "20 elementos" e "5 estágios" | Os 100 PNG provam arquivo, não que todos apareçam em jogo | `src/assets/soulmon/novos/` (100 PNG) |
| Combate com vantagem elemental | implementada | Combate em que o elemento conta | Duelo e Torneio são neutros | REGISTRO §177 |
| Endless Rift | implementada | Descida que segue fora da tela, sem teto de camadas | Teto de 8 h offline; não prometer prêmio | REGISTRO §172 |
| Minijogos | implementada | Combina 3, Soul Barrage, corrida, Pedra-papel-tesoura, Mind Workshop | | `BACKLOG-BETA3` M5/M9 |
| Mapa com 7 áreas | implementada | Mercado, Jogos, Exploração, Forja, Laboratório, Arena, Hall | Arte do jogo atual é a anterior à dos mapas novos | REGISTRO §187 |
| Loja | implementada | Itens, decoração, fundos, molduras | Sem anúncios. Não dizer "tudo grátis" | `CLAUDE.md` |
| Guilda e amigos | implementada | Casa, Missão, Guerra 4x4, amigos, presentes | Guerra depende de gente suficiente: não prometer no 1º dia | `CLAUDE.md` |
| Feira (Chefe e Desafio) | implementada | Chefe do clã | Mínimo de 3 membros. Docs antigos dizem desligada; o código diz ligada desde 29/10 | `functions/api/_feira.js:40` |
| PT-BR e inglês | implementada | Jogo nos dois idiomas | | `CLAUDE.md` |

## O que cada lugar do mapa guarda (para falas de NPC e legendas)

| Lugar | Pode dizer | Fonte |
|---|---|---|
| Exploração | Passeio e Endless Rift (descida sem teto de camadas) | REGISTRO §172 |
| Jogos | Combina 3, Soul Barrage, corrida, Pedra-papel-tesoura, Mind Workshop; minijogos rendem Bits (teto diário) | `CLAUDE.md`, `BACKLOG-BETA3` |
| Arena | Duelos e Torneio | REGISTRO §177 |
| Hall | Feira, Salão do Clã, Grove; amigos e presentes | REGISTRO §173, §203 |
| Guilda | Casa e Missão do clã, Guerra 4x4 | `CLAUDE.md` |
| Laboratório | Vínculo, Perfil (a ficha do Soulmon) e Centro de Evolução | `AreaView.tsx` (QA 05/11). **Não citar "Drive"**: não confirmado |
| Forja | Frase do dono (05/11): "ferramentas que ajudam a cumprir as tarefas mais difíceis". **Não detalhar** (foco, caderno, refúgio etc.): o conteúdo da Forja não está confirmado no código lido | Decisão do dono |

Sem promessa de saúde, descanso terapêutico ou "bem-estar" nas falas.

## Números e processo que podem ser ditos

| Afirmação | Base |
|---|---|
| "20 elementos base" e "mais de 200 combinações" | `src/utils/elementDex.ts`: 20 bases + 190 pares = 210. Não usar 260 nem "30": os 50 curados ainda não são aceitos pela lista fechada do jogo |
| "5 formas, 3 caminhos no meio" | `src/types/progression.ts`: 1 + 3 + 3 + 3 + 1; caminhos Poder, Harmonia, Benevolência |
| "Nasce de um teste de personalidade" | Oráculo; no beta, 3 gerações por testador |
| "O elemento muda o corpo e o combate" | `ELEMENTO-POR-SPRITE.md`. **Não dizer** que muda comida ou banho: não confirmado no código |
| "Você receberá o link nos próximos dias" | Promessa de processo do dono (05/11), só com vagas abertas; depende de ele enviar convites todo dia |
| "7 dias para aceitar o convite" | Decisão do dono (05/11) |
| "Ficar 14 dias no teste" | Exigência do teste fechado da Play, informada pelo dono |
| "50 vagas na 1ª leva, por ordem de inscrição" | Decisão do dono; real só com `BETA_CLOSED` ligado |
| Plataforma | Dizer "só Android". Não sugerir iPhone "por ora" nem "em breve" |

Rótulos internos de estágio (rookie, champion, ultimate, mega, ultra) não aparecem em material público: usar "Forma N de 5".

## Só com o limite dito

| Feature | Estado | Regra |
|---|---|---|
| Criatura gerada pelo Oráculo | parcial | No beta, 3 gerações por testador. Pós-beta não definido: não prometer "sempre grátis" |
| Calabouço roguelike | parcial | MVP: 3 andares por dia. Dizer "em construção" se citado |
| Chat com a criatura | parcial | Depende de serviço externo; é conversa, nunca conselho ou terapia |
| Rankings | parcial | Há 50 jogadores simulados. Nunca usar ranking como prova de comunidade |
| Prêmio mensal do Rift | parcial | Aprovação manual do dono. Não anunciar |
| Som | parcial | Sons novos sem escuta confirmada. Não destacar antes da escuta |
| Plataforma | parcial | Android pela Play. Web existe, mas não é o canal do beta. Não citar iOS |

## Não anunciar

| Item | Estado |
|---|---|
| Contagem de passos (Health Connect) | planejada (fora da beta3) |
| Steam, desktop | planejada |
| Onboarding Velado | planejada (flag desligada) |
| Mapas recriados 9:20 | **Implementado** (dono confirmou em 05/11: já estão na versão do testador; `main`, fafbbb5a4). Pode mostrar como jogo real. No site ficam fora: mapa-múndi, Mercado e Forja, por decisão do dono |
| `brand/intro.mp4` | conceitual: cinemática, nunca gameplay |
| Telas de wireframe e Figma | conceitual |

## Frases proibidas

- Promessa de saúde ou resultado: "cura procrastinação", "ajuda no TDAH", "muda sua vida", "clinicamente".
- Vocabulário vetado: tamer, domador, treinador, digievolução, mundo digital (`docs/NARRATIVA-E-UNIVERSO.md`).
- Número de comunidade inventado, depoimento inventado, nota de loja, data de lançamento.
- Falar em streak que se perde ou em cobrança: a criatura encoraja, nunca cobra.

## Lacunas a confirmar com o dono

1. Teste fechado já aprovado pelo Google? (`CLAUDE.md` diz que é o próximo passo; `DEPENDE-DE-VOCE.md` diz que está no ar). O `build.gradle` desta branch está em `versionCode 22`/beta2; v244 é o release do servidor que o APK carrega.
2. `BETA_CLOSED` está ativo? Define se o inscrito precisa ser adicionado à lista para entrar.
3. Quantas perguntas tem o Oráculo hoje? Docs dizem 6, 26 e "3 blocos": o site não cita número.
4. Modelo de monetização pós-beta. O site não cita.
5. `docs/PLAY-FICHA.md` está desatualizada (6 perguntas, fendas de 5 camadas): não copiar.
