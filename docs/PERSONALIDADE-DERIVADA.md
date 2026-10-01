# Personalidade derivada do Soulmon (G7)

> **Etiqueta:** vivo · **Dono do código:** `src/utils/personality.ts` (`derivePersonality`) ·
> **Régua:** `src/utils/personality.test.ts` · **Origem:** navegação do dono de 01/10/2026
> (`docs/AJUSTES-NAVEGACAO-2026-10-01.md`, G7) — resposta do dono: *"automática, sem troca —
> some das Settings"*.
>
> Parecer escrito pelo método do `soulmon-behavioral-psychologist`
> (`.claude/agents/soulmon-behavioral-psychologist.md`): mecanismo, resposta ao fracasso,
> públicos vulneráveis, linha vermelha. **O app não diagnostica nada** — a personalidade só
> muda a VOZ do chat (tom, emoji, estilo de motivação), nunca regra de jogo.

## 1. O que mudou

Antes a pessoa escolhia, nas Configurações, tom (Tranquilo/Elétrico/Calmo/Brincalhão), emoji e
estilo de motivação (Encorajador/Desafiador/Apoio/Equilibrado). Agora a escolha sai do
onboarding: as **forças** e **dificuldades** declaradas (os mesmos ids de
`src/types/activityCatalog.ts` — `StrengthId`/`StruggleId` — que o recomendador do catálogo já
usa) definem a voz que **contrabalança a dificuldade** e **apoia-se na força**.

A saída tem a forma que `functions/api/chat.js` já consome (`tone`, `emojiIntensity`,
`motivationStyle`); o servidor não mudou. As instruções livres e a criatividade guardadas
antes continuam valendo para quem as escreveu (não são personalidade).

**Contrato com a frente de onboarding:** o perfil é lido de
`gameState.onboardingProfile = { strengths: StrengthId[]; struggles: StruggleId[] }`
(`personalityProfileFromSave`). Sem o campo, ou com ids desconhecidos, vale o fallback.

## 2. Por que "contrabalançar" e não "espelhar"

Espelhar (dar voz energética a quem já é energético) só reforça o que a pessoa já tem. A
pergunta comportamental é outra: **qual voz aumenta a chance de a pessoa agir no ponto em que
ela trava?** Pelo modelo B=MAP (Fogg, 2009), o comportamento acontece quando motivação,
habilidade e gatilho coincidem; cada dificuldade declarada aponta qual desses três falta, e a
voz do pet é uma alavanca sobre motivação (e, pela forma, sobre o gatilho percebido).

A dificuldade pesa o **dobro** da força (`STRUGGLE_WEIGHT = 2`): é ela que a voz existe para
amparar, e uma força não pode empatar com a dificuldade declarada.

## 3. Mapeamento

| Dificuldade | Mecanismo provável | Voz que contrabalança | Motivação |
|---|---|---|---|
| Começar | Atrito de iniciação; procrastinação como regulação de humor de curto prazo (Sirois & Pychyl, 2013) | **energética** (ativação), brincalhona | **encorajadora** (passo pequeno agora) |
| Manter constância | O lapso vira "já estraguei tudo" — efeito de violação da abstinência (Marlatt & Gordon, 1985) | **tranquila** (sem drama), calma | **apoio** (voltar é o fluxo mais importante) |
| Esquecer | Falta de gatilho, não de motivação (Fogg, 2009; intenções de implementação, Gollwitzer, 1999) | tranquila, brincalhona | **equilibrada** — pressão não resolve esquecimento |
| Cansaço/energia | Baixa capacidade; exigir mais vira prova de fracasso | **calma**, tranquila | **apoio** |
| Ansiedade | Avaliação ameaçadora amplifica evitação; autocompaixão reduz evitação (Neff, 2003) | **calma** | **apoio** |
| Distração/celular | Déficit de recompensa/motivação ligado à via dopaminérgica em TDAH (Volkow et al., 2011) — novidade e leveza prendem mais | **brincalhona**, energética | **encorajadora** |
| Falta de tempo | O problema é carga, não vontade | **tranquila** (breve), calma | **equilibrada** |
| Perfeccionismo | Perfeccionismo crescente e associado a sofrimento (Curran & Hill, 2019); vergonha leva à fuga, culpa à reparação (Tangney, Stuewig & Mashek, 2007) | **calma**, brincalhona (leveza tira a régua do "perfeito") | **apoio** |

| Força | O que ela permite / pede para equilibrar |
|---|---|
| Disciplina, Persistência | Dão **lastro ao desafio** (autoeficácia, Bandura, 1977) → `challenging` passa a ser possível; a voz puxa para brincalhona (contrapeso à rigidez) |
| Organização | Equilibrada/desafio leve; voz brincalhona |
| Calma | Voz energética (contrapeso à baixa ativação); motivação equilibrada |
| Energia física | Voz calma (contrapeso); encorajadora |
| Curiosidade, Criatividade | Brincalhona e encorajadora — alimentar o interesse intrínseco em vez de trocá-lo por recompensa (Deci, Koestner & Ryan, 1999; Ryan & Deci, 2000) |
| Sociabilidade | Tranquila (calorosa), encorajadora |

Desempate, sempre da voz mais segura para a mais intensa: tom `casual > calm > playful >
energetic`; motivação `supportive > balanced > encouraging > challenging`.

Emoji: `low` quando a voz é calma ou quando há ansiedade/perfeccionismo; `medium` no resto.
Nunca `high` (ruído) nem `none` (frieza).

## 4. Linha vermelha (travas com teste)

1. **Veto de vulnerabilidade.** Ansiedade, perfeccionismo ou cansaço declarados ⇒ a motivação
   **nunca** é `challenging`, qualquer que seja a força. Pressão sobre esses três é o caminho
   documentado para vergonha, evitação e abandono (Tangney et al., 2007; Curran & Hill, 2019;
   Breines & Chen, 2012 — autocompaixão aumenta a motivação de melhorar, não a reduz). O teste
   varre todas as combinações de até 2 dificuldades × 2 forças.
2. **Desafio só com lastro.** `challenging` exige disciplina ou persistência declaradas.
   Desafio sem autoeficácia é cobrança (Bandura, 1977).
3. **Fallback seguro.** Perfil vazio, incompleto, de save antigo ou com lixo ⇒
   `casual` + `supportive` + emoji `medium`: a voz que não machuca ninguém.
4. **Determinística.** O mesmo perfil dá sempre a mesma voz — sem sorteio, sem relógio.
5. O bloco **NEVER** do `functions/api/chat.js` (sem culpa, sem cobrança, sem "você deveria")
   continua acima de qualquer personalidade, inclusive `challenging`.

## 5. Limites e o que falsifica esta aposta

- É **hipótese não confrontada**: não há telemetria de uso real (ver `CLAUDE.md`, "ninguém nunca
  usou o app em produção"). O que a derrubaria: quem recebe a voz derivada responder pior
  (menos conversas, mais opt-out da IA) do que quem tinha escolhido manualmente.
- A técnica de mudança de comportamento em jogo é **feedback/reforço social** (taxonomia BCT v1,
  Michie et al., 2013, grupos 2 e 10); não substitui planejamento de obstáculo nem quebra de
  tarefa, que vivem em outros módulos.
- Decisão do dono que fica em aberto: oferecer, no futuro, um "ajustar a voz" (o dono disse
  *sem troca*; esta implementação não a oferece).

## Fontes

- Bandura, A. (1977). Self-efficacy: Toward a unifying theory of behavioral change. *Psychological Review*, 84(2), 191–215.
- Breines, J. G., & Chen, S. (2012). Self-compassion increases self-improvement motivation. *Personality and Social Psychology Bulletin*, 38(9), 1133–1143.
- Curran, T., & Hill, A. P. (2019). Perfectionism is increasing over time: A meta-analysis of birth cohort differences from 1989 to 2016. *Psychological Bulletin*, 145(4), 410–429.
- Deci, E. L., Koestner, R., & Ryan, R. M. (1999). A meta-analytic review of experiments examining the effects of extrinsic rewards on intrinsic motivation. *Psychological Bulletin*, 125(6), 627–668.
- Fogg, B. J. (2009). A behavior model for persuasive design. *Proceedings of Persuasive '09*, ACM.
- Gollwitzer, P. M. (1999). Implementation intentions: Strong effects of simple plans. *American Psychologist*, 54(7), 493–503.
- Marlatt, G. A., & Gordon, J. R. (1985). *Relapse Prevention*. Guilford Press.
- Michie, S., et al. (2013). The Behavior Change Technique Taxonomy (v1) of 93 hierarchically clustered techniques. *Annals of Behavioral Medicine*, 46(1), 81–95.
- Neff, K. D. (2003). Self-compassion: An alternative conceptualization of a healthy attitude toward oneself. *Self and Identity*, 2(2), 85–101.
- Ryan, R. M., & Deci, E. L. (2000). Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being. *American Psychologist*, 55(1), 68–78.
- Sirois, F., & Pychyl, T. (2013). Procrastination and the priority of short-term mood regulation. *Social and Personality Psychology Compass*, 7(2), 115–127.
- Tangney, J. P., Stuewig, J., & Mashek, D. J. (2007). Moral emotions and moral behavior. *Annual Review of Psychology*, 58, 345–372.
- Volkow, N. D., et al. (2011). Motivation deficit in ADHD is associated with dysfunction of the dopamine reward pathway. *Molecular Psychiatry*, 16(11), 1147–1154.
