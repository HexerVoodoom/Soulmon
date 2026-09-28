# Rodada 2 — goal do Oráculo revisado

## O IUP mede o que importa?
Não sozinho. IUP mede unicidade da TUPLA VISÍVEL na largada (criação). Mas a
decisão do dono diz "o bicho é a pessoa, e evolui COM ela" — isso é uma
alegação sobre TRAJETÓRIA, não sobre o instante do reveal. Em 97,4%, o próximo
gargalo não é "ficar mais único no dia 0": é se a UNICIDADE SE MANTÉM/CRESCE
conforme o comportamento diverge (dois perfis iniciais parecidos que jogam
diferente por 30 dias precisam divergir mais, não convergir). Hoje não existe
métrica para isso — é o buraco real.

## Goal revisado
"O bicho nasce único e continua sendo só dela: a leitura inicial dá a
largada, o comportamento decide o rumo, e ninguém de fora vê o mecanismo
(classe) que torna isso possível."

## Resultados-chave (OKR-like)
1. **Unicidade na largada seguece C8** (já quase saturado) — manter ≥97%,
   parar de investir mais aqui. Medível hoje por simulação. Hipótese: já
   resolvido; esforço adicional tem retorno decrescente.
2. **Divergência comportamental**: perfis com leitura inicial PRÓXIMA (mesmos
   4 eixos, δ pequeno) que recebem trajetórias de comportamento opostas (30
   "dias" simulados de ritmo Constante vs Explosivo, ver `carePattern.ts`)
   devem produzir formas/companheiro/ficha finais mensuravelmente diferentes.
   Medível hoje por simulação (motor de evolução já existe). Hipótese: o
   desempate por ritmo (já implementado) é suficiente para isso, mas nunca foi
   medido como MÉTRICA-NORTE — só existe como teste unitário local.
3. **Raridade percebida das classes-ápice**: fração de jogadores que, sem
   nunca ver o nome da classe, associam a criatura a algo "especial/raro"
   quando ela de fato é ápice. Só medível com usuário real (painel/estudo);
   hipótese: sinais indiretos (bio, sprite, skills) carregam a raridade sem
   nomear.
4. **Fidelidade percebida** (extensão do C5 hoje só estrutural): pessoa real
   reconhece a PRÓPRIA criatura como reflexo de si, não só "respostas opostas
   → eixos opostos" internamente. Só com usuário (estudo tipo Barnum × especificidade,
   já previsto na Fase 3). Hipótese: fidelidade estrutural é necessária mas
   não suficiente para fidelidade percebida.
5. **Retenção de identidade no renascimento**: quem usa Rebirth (troca de
   criatura mantendo perfectDays) ainda sente "sou eu" na nova forma. Parcialmente
   simulável (checar se os NOVOS eixos escolhidos no rebirth conservam
   distância dos antigos quando o comportamento continuou o mesmo); fidelidade
   percebida só com usuário.

## Fora de escopo
Psicometria clínica; aumentar ainda mais IUP de largada; qualquer UI que
exponha classe, pontuação ou "por que você é raro".

## Tensões
- **Proporcional (sem vencedor estrutural) × raro por design**: já resolvido
  no plano 1 — proporcional vale para os 4 eixos de leitura; raridade é
  efeito de COMBINAÇÃO (ápice = interseção rara de eixos comuns), não de um
  eixo enviesado. Não reabrir.
- **Único × dados da pessoa**: tensão nova que a Rodada 1 não tratou. Quanto
  mais o motor usa comportamento real (KR2) para divergir, mais ele depende
  de HISTÓRICO acumulado — e por regra do jogo (`careRules`) o app não pode
  usar isso para punir nem para score visível. Resolução recomendada:
  divergência entra só como INPUT de criação/evolução (like ritmo já faz),
  nunca como número mostrado — mesma fronteira que already protege HP/coração.
- **Único × raro por design**: já decidido (KR1 satura, KR2 é o novo eixo);
  não competem porque medem coisas diferentes (largada vs trajetória).

## Recomendação de próximo passo
Adicionar KR2 (divergência comportamental) como nova métrica-norte complementar
ao IUP na Fase 0/1 do plano existente, medível por simulação sem esperar
usuários — não substitui C1–C8, acrescenta um C9.
