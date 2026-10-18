# SOULMON — Briefing de Implementação, Melhorias e QA (backlog beta-2, colado pelo dono em 13/10/2026)

Prioridade: bugs funcionais e estabilidade → mecânicas → UX/UI → refinamento visual.
Mudanças sobre a arquitetura existente, preservando o que já está correto. Não considerar tarefa concluída só porque o código mudou: só após validar os critérios de aceite.

## Diretrizes obrigatórias de design
- Envolver o Squad Design (alpha-product-designer + alpha-design-critic) na validação de UX/UI.
- Minimalismo; eliminar textos explicativos redundantes (rótulos, ícones, estados visuais, feedback contextual).
- Reutilizar componentes, tokens, cores, tipografia existentes. Bronze nos checkboxes; dourado da paleta para destaques como `New`.
- Substituir emojis usados como ícones funcionais por ícones próprios.
- Bottom sheets como padrão para interações comuns e desbloqueios; modais centralizados só para alertas.
- Não criar componentes/sistemas paralelos. Não alterar regras de progressão/recompensa/balanceamento sem verificar dependências.
- Validar em mobile e web/PWA.

## 2. Home e atividades
2.1 Lista só com atividades de HOJE, em duas categorias `Tasks` (pontuais) e `Habits` (diárias). Sem mensagens/diálogos/notificações dentro da lista (vão em modal/bottom sheet). Aceite: Home só mostra atividades de hoje; hierarquia clara; conteúdo externo não se mistura; interface estável quando mensagens/modais aparecem.
2.2 Hierarquia tarefa/subtarefa: checkbox bronze alinhado à esquerda do nome; atividades com várias ocorrências mostram checkboxes filhos abaixo do título; cada ocorrência marcável; pai NÃO conclui direto, só quando todos os filhos concluídos; controle discreto expandir/recolher; ao concluir todas, recolhe e mantém só o título; estado preservado após navegar/atualizar/reabrir.
2.3 Tela de todas as atividades: `View all →` no fim da lista de hoje + gesto de deslizar horizontal; na tela completa seta de voltar + `View today`; três categorias `Tasks`, `Habits`, `Scheduled` (recorrentes em dias específicos: semanal, dias alternados, mensal). Atividade de segunda não aparece na lista de terça mas continua em View all. Botão e gesto levam à mesma experiência; retorno preserva estados; preservar regras de recorrência e datas.
2.4 Today e Goal: destacar `Today` com acabamento cromado discreto; exibir `Goal` com o valor definido; separar visualmente qtd de atividades da meta de conclusão; não confundir; meta não altera o registro de conclusão.
2.5 Layout estável na Home: texto como `Tomar banho` não pode empurrar o cenário nem deslocar o Soulmon; dimensões estáveis para cenário e sprite; texto no espaço previsto; controlar quebra/truncamento/overflow; mensagens de comprimentos diferentes não alteram a altura do layout principal; várias resoluções.

## 3. Cenário, personagem e necessidades
3.1 Android em tela cheia (modo imersivo) na camada Android/Capacitor: ocultar barras de status/navegação; gestos de navegação e retorno funcionando; versões diferentes; sem prejudicar safe areas/viewport web.
3.2 Corrigir mochila aparecendo junto do sprite (investigar sobreposição/camadas; manter só o ícone da mochila no local da funcionalidade; preservar sprite).
3.3 Redimensionar área do cenário: remover linha divisória abaixo do cenário; aumentar o background; acomodar vida, energia e controles de interação DENTRO do background; reduzi-los discretamente; gradientes suaves nas bordas superior/inferior; preservar legibilidade.
3.4 Timer de energia: timer discreto ao lado do indicador de energia com o tempo para a próxima unidade; calculado sobre o estado real e as regras de recuperação; atualiza quando a velocidade muda; consistente após fechar/navegar/voltar. Não pode ser contagem visual independente do estado.
3.5 Fome: indicador de fome na Home; integrar ao sistema de necessidades; COMIDA recupera fome (não energia direto); fome determina a velocidade de regeneração de energia: Faminto = interrompida; mediana = mais lenta; bem alimentado = 100%. Definir limites numéricos e duração no balanceamento; timer atualiza quando a fome muda; sem valores inconsistentes nem regeneração duplicada; verificar interações com dungeon/consumo de energia. Aceite: comer altera fome, não concede energia; fome controla regeneração; timer corresponde à velocidade efetiva; estados persistem; sem exploits.

## 4. Ciclo diário e engajamento
4.1 Três momentos de retorno: check-in matinal (preparar o dia), pós-almoço (acompanhar progresso), noturno (encerrar e preparar o próximo dia), cada um com benefício específico integrado à progressão/recursos; verificar notificações e preferências de horário; sem penalidade severa por perder; não exige app aberto; sem recompensa duplicada ao entrar/sair; respeita dia e fuso do usuário; ausência não invalida o progresso. PENDENTE de balanceamento: recompensas, horários, regras de disponibilidade e conclusão (propor defaults e documentar para o dono).
4.2 Resumo após a conclusão do dia: remover `Evolution Path`; manter `Yesterday Tasks`; mostrar os 3 corações; ao perder um, animação de tremor e quebra, virando coração preto; preservar os restantes; animação representa o resultado real do dia; NÃO repetir a animação ao reabrir a tela.
4.3 `Front Today's Adventure` vira `From Yesterday's Adventure`; `New` com o dourado da paleta; associar explicitamente o resultado ao scroll escolhido no dia anterior; apresentar destino/missão relacionada; modal independente com o NPC associado ao scroll; separar das informações de tarefas; remover textos redundantes.
4.4 Modais de resumo separados por seção (tarefas, corações, aventura); NPC só na experiência do scroll; sem NPC em `Stretch Closed`; reutilizar o bottom sheet padrão.

## 5. Stroll e missão do dia
5.1 Unificar Free Stroll e Mission of the Day: remover o bloco explicativo de Free Stroll; unificar escolha de missão e destino; missão do dia como informação principal; destino associado com destaque; a missão determina/justifica o destino; preservar a associação escolha→resultado vinculada ao scroll selecionado; evitar duas etapas. Exemplo: Missão `I Try Without Screens` → Destino `Desert Mind` (destaque discreto); resultado no retorno com relação explícita à escolha.

## 6. Dungeon e progressão
6.1 Limite diário de andares e custo de energia por exploração integrados ao estado real de energia; bloqueia novas explorações no limite; aplicado na lógica AUTORITATIVA (servidor), não só visual; progresso persistido fora do ciclo de vida da tela; sem recompensa duplicada ao sair/reentrar; preservar continuidade da exploração e saída explícita. PENDENTE de balanceamento: máx. de andares, custo por andar, duração.
6.2 Timer de retorno na Home: placa da dungeon vira elemento visual de madeira; texto curto `In Dungeon`; tempo restante; vinculado ao estado persistido; correto após navegar; não reinicia ao reabrir.
6.3 Preservar: `Layer 1 of 6`, velocidades 1×/2×/3×, progressão no estado do jogo (não só timer de tela), sair da tela ≠ abandonar, restrição de invocação enquanto ativa, especiais cobrados/executados pelas regras, recompensas/itens/transições testados.

## 7. Modais, desbloqueios e level-up
7.1 Padronizar: mesmo bottom sheet do mercado/prédios para novos prédios e desbloqueios comuns; modais centrais só para alertas; preservar convenções de fechamento.
7.2 Level-up: remover textos como `Your bond grew` e pontos de talento redundantes; mostrar `Now Open` quando houver desbloqueio; resultado direto sobre o fundo escurecido, sem caixa; trocar o sunburst rígido por glow difuso; corrigir recorte/alinhamento do ícone de três setas para cima.
7.3 Seleção de metas: rótulo `Add tasks to list`; todas marcadas por padrão; desmarcáveis; só as selecionadas entram; sem duplicar tarefas existentes.

## 8. Mercado e itens
8.1 Descrições simples: nome, efeito, valor (Powership `+3 Power`, Harmony Ship `+3 Harmony`, Benevolence `+3 Benevolence`); sem parágrafos; preservar preço/compra/inventário/efeitos.
8.2 Thumbnail de todos os itens abre o modal de pré-visualização (reutilizar o comportamento dos backgrounds); preservar compra/seleção.
8.3 Soulsmith bloqueado mesmo após concluir scrolls e missões: inspecionar condições, eventos de scroll/missão concluídos, requisitos de progressão/vínculo; conferir se os dados persistidos são os mesmos consultados pela UI; corrigir; testar desbloqueio em tempo real e após reiniciar; NÃO liberar artificialmente.

## 9. Games, Match 3 e Arena
9.1 Game Hall: mais espaçamento entre entradas; sem novos cards ilustrados; substituir os ícones do dinossauro e da tesoura; manter o ícone do Match 3; preservar posição do refúgio e do prédio; revisar posição relativa Game Hall × Mind Workshop; assets próprios só se não houver componente adequado.
9.2 Match 3: peças só movem quando o movimento pontua → remover essa exigência; movimentação livre; preservar detecção, pontuação, animações; sem estados inválidos; testar válidos/inválidos/repetidos/fim de partida.
9.3 Arena: Tournament em um bloco, Open Arena no outro; preservar layout; remover da Open Arena elemento e ataque (vão para o perfil do Soulmon).
9.4 Loading: apresentação minimalista coerente com a identidade; comunica atividade sem ocupar espaço; sem animação pesada; estados de carregando/erro/concluído.

## 10. Bond Sanctum e Evolution Center
10.1 Ícones de categoria no Bond Sanctum: trocar emojis por ícones próprios (reutilizar assets; criar só se necessário); legíveis em tamanho pequeno.
10.2 Árvore do Bond Sanctum aberta por padrão; remover a opção de colher; preservar estados/progresso.
10.3 Evolution Center: trocar as pílulas por abas compactas (sublinhado fino na ativa, separadores discretos, toque e deslize, sem truncar Power/Harmony/Benevolence); preservar conteúdo/estados.

## 11. Novo prédio: perfil do Soulmon (na área do laboratório)
Integrado ao mapa e ao sistema de desbloqueios; padrão visual dos prédios; sem telas explicativas extensas. Conteúdo: personalidade concisa; nível do equipamento Soulforger; atributo principal qualitativo (força/agilidade/resistência); elemento principal; tipo de ataque; nome do ataque especial; efeito principal do especial (cura/dano/suporte…); elemento do especial só quando relevante e disponível. Restrições: sem pontuações numéricas; sem melhoria do Soulforger; sem repetir; sem inventar atributos quando não existirem; ícones próprios; sem descrições longas. 11.3 Mover para o perfil elemento e tipo de ataque da Open Arena; verificar dependências; sem duplicar fonte.

## 12. Mood tracking
Ícones de `How are you today?` maiores, mais diferenciados, próprios, associação ícone/rótulo/estado preservada, áreas de toque adequadas, sem explicações longas.

## 13. Navegação, desempenho e estabilidade
13.1 bottom sheet para novos prédios. 13.2 Estabilidade de layout (textos curtos/longos, estados de energia/fome/tarefas, sprite/background estáveis, sem overflow/saltos/sobreposição). 13.3 Persistência e integridade (tarefas, subtarefas, fome, energia, dungeon, recompensas; timers não reiniciam; sem recompensa duplicada; estado visual = estado real; limites não confiam só no estado local da UI).

## Relatório obrigatório de cada agente
1. Concluído e verificado. 2. Corrigido (bugs reproduzidos/resolvidos). 3. Testado (comandos e resultados). 4. Pendente e motivo. 5. Balanceamento: valores que exigem decisão de produto (proponha defaults). 6. Arquivos alterados. 7. Regressões encontradas e como tratadas. Não declarar concluído sem validação.
