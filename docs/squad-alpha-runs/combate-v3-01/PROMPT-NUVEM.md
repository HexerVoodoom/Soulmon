# Prompt para a sessão na nuvem (cole inteiro)

```
Sessão de continuação do Soulmon (repo HexerVoodoom/Soulmon, branch main). Você assume o run "combate-v3-01" da SQUAD-Alpha, que rodava local.

LEIA, nesta ordem (todos no branch `combate-v3/run-state`; faça um checkout dele em uma pasta separada, SOMENTE LEITURA, nunca mergear esse branch):
 1. docs/squad-alpha-runs/combate-v3-01/HANDOFF-ESTADO.md  (estado AO VIVO de cada frente: branch, commit, o que falta, comandos)
 2. docs/squad-alpha-runs/combate-v3-01/contexto.md  (TODAS as decisões do dono, §2.x até §2.38; valem acima de qualquer story)
 3. docs/squad-alpha-runs/combate-v3-01/ALINHAMENTO-VISAO.md  (a visão do dono × o que existe)
 4. docs/squad-alpha-runs/combate-v3-01/SEGURANCA-AUDITORIA.md, builder/stories/ (README + PR15-ficha-comportamento.md), builder/balanco-motores.md, builder/INVENTARIO-ASSETS.md, docs/ARTE-MELHORIAS-FUTURAS.md (na main)
 5. CLAUDE.md do repo e docs/manual/00-MAPA.md.

JÁ NA MAIN: PR1–PR13 do Combate v3 (núcleo com golpe normalizado, Arena/Masmorra/Pesadelo/PvP no motor novo, XP e level, chips só distribuição, Vínculo/talentos/gates, equipamento e moeda, nome do especial por regra, FX de status, docs, endurecimento de segurança do servidor), higiene de testes, identidade única do lutador (fighterIdentity), PR12a (câmbio em pacotes pequenos + Masmorra DEF/SPD) e o #232 da outra sessão (bestiário de 7.386 criaturas). Verifique com `git log origin/main`.

FRENTES EM ABERTO (estado exato em HANDOFF-ESTADO.md; confira com gh pr list / ls-remote antes de agir):
 a) PR12b: 3 nós de Comércio (mochila +1 espaço, Bits de missão, desconto rotativo).
 b) Cadeia, em ORDEM, cada um mergeado antes do próximo: PR14 (família do especial estável; só muda com mudança forte de perfil) → PR15a (núcleo puro: ficha reage ao comportamento) → PR15b (integração + migração, `fichaJornada`) → PR15c (servidor/paridade) → PR17 (nome do básico segue o elemento par; vantagem do par = base dominante).
 c) PR16: duração real dos selos de status, selo de maldição sobre o debuff, "Nível N" → "Camada N" na Masmorra.
 d) Tarefa A: prédios liberados por Vínculo (cadeado procedural, sem emoji; Arena = 5; tabela BUILDING_GATES) + renomear o Laboratório (Arquivo / Centro de Evolução / Santuário do Vínculo).
 e) Tarefa B: árvore de talentos desenhada como árvore (centro → 3 caminhos → bifurcações, pré-requisitos, servidor valida).
 f) Tarefa C: avatar no canto superior esquerdo substitui o menu sanduíche → configurações → editar perfil (moldura + foto = NPCs ativos e guardados); persistência só por IDs de lista fechada.
 g) Por último: /manter-docs completo (delta enorme desde e3d55bb8).

DECISÕES-CHAVE DO DONO (resumo; detalhe em contexto.md): estratégia só muda playstyle (régua de paridade ±5%); bônus de talento+equipamento+Comércio+Renascimento com TETO ÚNICO de 5% (razão das médias), vale no PvP; equipamento só com moeda GANHA, sem RNG/lootbox; Créditos (dinheiro real) só aceleram o que NÃO é combate, teto +25%; nunca pay-to-win; produto continua 18+ (não adotar 14+); sem consulta a advogado por ora (análise por IA, fontes oficiais da lei não foram lidas); level do Soulmon desce na degeneração com texto neutro; "Lv N"/"Vínculo N", a palavra "nível" é vetada só para a criatura; talentos NÃO modificam o especial; golpe básico = elemento de maior peso da ficha (base ou par) em todas as telas; cada estágio gera especial/nome novo, família estável (muda raro); Masmorra e Pesadelo sem torcida; Arena com torcida em 9 de energia.

MARGENS FINAS (não mexa sem medir): torcida da Arena em 9 tem ~0,2pp de folga no limite de 25pp (arena.v3.test.ts); orçamento de bytes do chunk de entrada (prefira lazy); contagem de campos do save (teste fuzz2) só muda de propósito.

REGRAS DE TRABALHO:
 - Um PR por story. ANTES de cada merge: `git fetch origin main`, rebase, rerodar tsc (app + tsconfig.server.json + desktop `npx tsc -p desktop/tsconfig.json --noEmit`), vitest completo, `npm run build` (dist é commitado), e CONFERIR `git diff origin/main --stat` só com o escopo (lição do incidente #226: base velha reverteu código). ESPERE o CI verde; nunca mergeie com check pendente. `gh pr merge --rebase`. Flaky conhecidos (já estabilizados no #250; se reaparecerem: `gh run rerun --failed` uma vez): convertToWebp, ArenaGame.torcida, versaoUnica, spriteManualRetry, playArea.
 - Funções puras como donas de cada regra; paridade cliente×servidor travada por teste (_combate/_gates/_talents/_equipment/_soulXP/_honra/_duel.js); servidor decide o PvP; EN primeiro + PT-BR; copy sem cobrança (copy.semFomo); superfície nova nasce muda (R-NOVA).
 - Commits em PT-BR terminando com a linha Co-Authored-By indicada pelo ambiente. NÃO edite as linhas de PI/bestiário do CLAUDE.md (são do dono). NÃO mergeie o PR rascunho #232 nem mexa nele (outra sessão).
 - Planeje e revise com o modelo mais forte; delegue a execução de código a subagentes Sonnet (economia de tokens). Decisões de produto vão ao dono em UM modal (AskUserQuestion, até 4 perguntas, opções com recomendação marcada); nunca pare esperando: siga no que não depende.
 - Worktrees: NUNCA `git worktree remove` com junction de node_modules presente (apaga o node_modules compartilhado); antes `cmd /c rmdir <worktree>\node_modules`. Na nuvem use `npm ci` por worktree se preferir.
 - Atualize HANDOFF-ESTADO.md e contexto.md no branch run-state (git add -f, commit+push) a cada PR mergeado.

PENDÊNCIAS QUE SÓ O DONO RESOLVE (leve em modal quando surgirem): regerar ~12 peças de arte no Gemini (precisa da extensão Chrome e do Gemini logado; prompts em docs/ARTE-MELHORIAS-FUTURAS.md); confirmar a tabela BUILDING_GATES e os nomes novos do Laboratório; outros nós de talento "em breve"; loja de Créditos com verificação de idade só se um dia abrir 14+.
```
