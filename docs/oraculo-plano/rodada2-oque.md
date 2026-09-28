# Oráculo — rodada 2, o QUE (não o como)

## 1. GOAL revisado
O Oráculo entrega ao jogador uma criatura que É ele — nascida da leitura, mas só
comprovadamente sua depois de meses de cuidado real — e entrega ao universo a prova
narrativa de que a Malha registra padrões de vida, não performance (docs/NARRATIVA-E-UNIVERSO.md
L823, "registro de padrões, não de indivíduos"). NÃO é: um gerador de avatar bonito
(estética é consequência, não fim), um RPG com build otimizável (classe nunca aparece,
docs/PLANO-ORACULO.md L56), nem um teste psicométrico validado clinicamente (decisão
dono §4.1: "melhor" = melhor para a narrativa).
Alternativa que perde: "Oráculo = motor de raridade/gacha" — perde porque contradiz
docs/manual/01-VISAO.md L142 ("regras explicadas, resultados surpreendentes... condição
para o Oráculo não virar gacha caro").

## 2. Papel de cada recurso
- **class-system** (vendor/class-system): motor de FICHA invisível — ela já alimenta
  skills reais (`ficha/realSkillPower.ts` chama `calcularSkill` do motor de verdade,
  NARRATIVA-E-UNIVERSO.md L454-456) e por trás disso a masmorra/torneio (onde ficha e
  skill "poderiam importar", segundo o briefing). Hoje: ficha e talentos SÃO calculados
  (`ficha/classSystem.data.json`) mas viram só UMA linha de bio no reveal ("Essência
  Crepúsculo · Ofício X", L296) — não afetam visivelmente masmorra/torneio ainda.
  Recomendação: ficha vira o balanceador oculto de masmorra/torneio (dificuldade,
  drops, tempo de sobrevivência), nunca um número exposto. Perde a alternativa "expor
  ficha como stats de RPG" — quebra decisão 3 do dono.
- **Bestiário** (194 criaturas, pool.json): lore + captura, não escolha estética livre —
  vira a "linhagem de inspiração" por estágio (L333, "uma inspiração POR estágio,
  encadeada por..."), puxa o companheiro capturável e nomes/descrição-mundo. Não é
  catálogo pra o jogador navegar e escolher.
- **Famílias visuais (72, oracle.ts CREATURE_FAMILIES)**: identidade estética herdável —
  moldam a silhueta/forma reconhecível da linhagem (continuidade 80-90% entre pais e
  filhos, PLANO-ORACULO.md C7).
- **Leitura da pessoa**: só a SEMENTE. Fixa 4 eixos (elemento/papel/caminho/reino) e a
  ficha inicial; tudo depois é modulado por comportamento.
- Hoje calculado e SEM experiência: talento com pré-requisito (65/65 alcançável mas
  invisível), profissão (11), companheiro (existe como mecânica de captura mas fraco
  em identidade sentida). Deveriam virar: talento → traço de personalidade na bio/fala;
  profissão → o "jeito" da criatura agir na masmorra; companheiro → parceiro nomeado
  visível, não stat.

## 3. Criação × evolução
Leitura fixa a semente (eixos + ficha base); tudo que o jogador VÊ evoluir nasce do
comportamento: `perfectDays`, `habitRhythm.ts` (ritmo), `carePattern.ts` (o "como",
decide galho no empate, L809) e a masmorra. Os 3 caminhos devem favorecer/dificultar
elemento de forma assimétrica e SUSTENTADA (C6, ±15-20%), nunca travar — isso é o que
faz "meu jeito de cuidar" virar linhagem visível. Rebirth (uma vez, L836) deve ser onde
a leitura original é redesafiada pelo comportamento acumulado — recomeço que carrega
marca do ciclo anterior (traço herdado), não reset puro; alternativa "rebirth = ficha
zerada igual à primeira vez" perde por apagar a prova de jornada.

## 4. Balanceamento
Proporcional (nenhum vencedor estrutural): os 4 eixos de criação (elemento/caminho/
reino/papel, C2 ≤1,5×), escola (C3 ≤2×), grupos do bestiário/famílias (C4). Desigual por
propósito: classes-ápice (Arauto do Fim, Demiurgo...) raras como lendário, aceito por
decisão do dono §4.2 — só exige alcançável, não equiprovável. Comunicar raridade sem
ranking/cobrança: por REAÇÃO do mundo (NPCs comentam, bestiário ganha entrada nova) e
por RARIDADE DA FORMA/pose visual, nunca número ou selo "raro X%" — linha vermelha
contra métrica de posse (L925, proibição #1 sobre performance).

## 5. Unicidade × legibilidade
"É eu": comportamento e ritmo próprios moldam forma/skill/companheiro visivelmente ao
longo do tempo (IUP mede 97,4% de tupla única hoje, C8). "É único": família visual +
linhagem de inspiração do bestiário dão silhueta reconhecível sem qualquer painel de
atributo — o jogador lê diferença por OLHO (forma, cor, bio), nunca por comparação
numérica.

## 6. Cinco riscos e o que mata cada um
1. Unicidade estrutural ≠ percebida (PLANO-ORACULO.md L riscos) → só teste com pessoas
   reais fecha; simulação é proxy, não prova.
2. Classe vazar na UI por acidente (nova tela, export, log) → régua automatizada
   "nenhuma tela exibe nome da classe" (decisão 3) rodando em CI.
3. Ficha/talento ficarem "calculado e morto" (sem experiência) → todo cálculo novo do
   class-system só entra se tiver um ponto de manifestação narrativa definido ANTES.
4. Barnum genérico (bio parece "true pra qualquer um") → teste cego bio trocada entre
   perfis, planejado L69, precisa rodar antes de expor mais texto de leitura.
5. Vocabulário da leitura pesar negativo (numerologia "dívida cármica") sem tradução →
   checagem `alpha-compliance` obrigatória antes de qualquer exposição nova (Fase 3).
