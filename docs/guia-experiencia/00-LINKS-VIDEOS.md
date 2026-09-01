# Biblioteca de vídeos — referências verificadas

Complemento do `docs/GUIA-EXPERIENCIA.md`. Cada link aqui foi verificado no
endpoint oEmbed do YouTube
(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<ID>&format=json`),
que devolve o **título e o canal reais** de um vídeo existente e falha em ID
inventado.

> **Por que a verificação virou regra.** A primeira versão do relatório
> `01-youtube-mobbin-timgabe.md` atribuiu **cinco** vídeos ao canal errado —
> links achados em busca, aceitos pelo título. Um ID de YouTube não pode ser
> adivinhado nem inferido: ou você confirma, ou não sabe de quem é o vídeo.
> Quem acrescentar link a este arquivo roda o `curl` do oEmbed antes, e copia o
> `author_name` que voltar — não o que esperava encontrar.

Contagem: **84 vídeos verificados** (conferidos um a um na árvore deste commit,
não estimados). Descartes ficaram de fora em silêncio
(vídeo removido, privado, ou fora do tema) — a lista não tenta ser exaustiva,
tenta ser confiável.

---

## 1. Tim Gabe (`@TimGabe`) — os 10 confirmados

Os dois primeiros são os de maior retorno para o Soulmon.

| Vídeo | Link |
|---|---|
| ⭐ I Studied 500+ Gamified Apps (Here's What Actually Works) | https://www.youtube.com/watch?v=LXX_qOA5D8E |
| ⭐ Why Leaderboards Kill App Retention (How To Fix It) | https://www.youtube.com/watch?v=BxhsCu9hNpY |
| How To Solve The App Onboarding Paradox | https://www.youtube.com/watch?v=Aa89MC8jX2c |
| I Studied 10,000 Paywall Screens (THIS Makes People Pay) | https://www.youtube.com/watch?v=sYRhXB_ZcLI |
| How To Scientifically Design Addictive Apps | https://www.youtube.com/watch?v=yBpv5rZoBjA |
| Our World Class App Design Formula | https://www.youtube.com/watch?v=wmTkiF23GRQ |
| Viral Design Tricks from Spotify (Founder Playbook) | https://www.youtube.com/watch?v=Tpg0pxKHrCA |
| The New Way Apps Dominate in 2026 | https://www.youtube.com/watch?v=yYs7iv81Ppk |
| The Hidden App Growth Killer (How To Avoid It) | https://www.youtube.com/watch?v=55hDj88zKa8 |
| The Future of App Design is Invisible | https://www.youtube.com/watch?v=zRUoPIwCxfw |

Transcrição integral do "World Class App Design Formula" (a única que o sandbox
conseguiu ler): https://sozai.app/transcript/world-class-app-design-formula/

## 2. Os que NÃO são do Tim Gabe nem da Mobbin (mas valem)

Estavam atribuídos errado no primeiro relatório. São bons — só têm outro dono.

| Vídeo | Canal real | Link |
|---|---|---|
| I Studied 100 Paywalls, Here's What I Found | Steven Cravotta | https://www.youtube.com/watch?v=y0f8-CSOJ58 |
| This app onboarding hides the paywall | Adam Lyttle | https://www.youtube.com/watch?v=uw0Y_FiKkYQ |
| I Analyzed 300+ Paywall UI Designs | Elizabeth Alli – DesignerUp | https://www.youtube.com/watch?v=WvOhpkAcHno |
| Duolingo End UX / Design Breakdown Ep. 5 | Punit Chawla | https://www.youtube.com/watch?v=Bu77RJKOUvA |
| Curso [MOBBIN] 01 – Introduction to UI/UX Design | DesignCode | https://www.youtube.com/watch?v=BB8uOVJQnLg |
| Curso [MOBBIN] 06 – UX Research and Design Flows | DesignCode | https://www.youtube.com/watch?v=9hFFyNHKr7A |
| Fintech App With Mobbin – Full Design + Prototype | DSCODE | https://www.youtube.com/watch?v=fDkCdTc8LUY |

⚠️ **Sobre a Mobbin**: o canal `@mobbindesign` existe, mas o sandbox não
consegue enumerar os vídeos dele — nenhum vídeo desta biblioteca é de lá. O
valor real da Mobbin para o Soulmon está no catálogo de flows, não no canal:

- Onboarding do Duolingo (iOS): https://mobbin.com/explore/flows/0acc27c7-4e01-481c-83b2-99f8d741bef1
- Onboarding do Duolingo (Android): https://mobbin.com/explore/flows/afd9076d-2599-44fe-962f-fc723a7a7b6b
- Galeria de paywalls: https://mobbin.com/explore/mobile/screens/subscription-paywall

## 3. Tamagotchi effect e vínculo com criatura virtual

| Vídeo | Canal | Link |
|---|---|---|
| ⭐ Why Do Virtual Pets Give Us Real Feelings? | PBS Game/Show | https://www.youtube.com/watch?v=T7rnpdBZvPo |
| What happened to Hand-Held Digital Pets? | Maia Faith | https://www.youtube.com/watch?v=NLbjRcSSh88 |
| Tamagotchi Nostalgia: Why I Actually Hated Virtual Pets! | Pew Moments | https://www.youtube.com/watch?v=96EJFA-3Cvk |
| The Tamagotchi Was A Huge Success. But Why? | Mental Floss | https://www.youtube.com/watch?v=PTemp5C4qAM |
| What's it like to be a robot? (HRI acadêmico) | TED — Leila Takayama | https://www.youtube.com/watch?v=7LE4MoJ-2po |
| The Tamagotchi Effect — o começo da nossa relação com tecnologia | CuriousYunaPie | https://www.youtube.com/watch?v=Pz4OsdB7dwM |
| Tamagotchi Effect in Psychology (resumo) | Psychological Effects | https://www.youtube.com/watch?v=6srulhlhcCE |

Os dois marcados como crítica (`Maia Faith`, `Pew Moments`) são os mais úteis na
prática: são o relato de quem **abandonou** o v-pet clássico por cobrança
constante — a lista do que `ABSENCE_FORGIVENESS_DAYS` e o teto de 1 coração/dia
existem para não repetir.

⚠️ O postmortem do Tamagotchi na GDC 2023 (Nobuhiko Momoi, Bandai) **não está no
YouTube público** — a sessão existe, mas só no GDC Vault pago. Nenhum link foi
inventado para preencher a lacuna.

## 4. V-pets, Bandai e o bicho que mora no desktop

| Vídeo | Canal | Link |
|---|---|---|
| Tamagotchi CD-ROM: The 1997 Digital Pet on PC | LGR | https://www.youtube.com/watch?v=AxO9gxkz1hU |
| The PocketStation: v-pet acoplado ao PS1 | CQ (CorruptionQuest) | https://www.youtube.com/watch?v=FFQF0oNckLY |
| The Unhinged Official Tamagotchi Backstory | Slope's Game Room | https://www.youtube.com/watch?v=AKW3i6f4kyk |

Os dois primeiros são precedente direto do overlay Electron (`desktop/`) e do
par app + widget: o que funciona quando a criatura vive fora do app principal.

## 5. Monster taming e creature collection

| Vídeo | Canal | Link |
|---|---|---|
| What Makes a Monster Taming Game? | Gym Leader Ed | https://www.youtube.com/watch?v=0Olnbuo1a2Q |
| What Is a "Creature Collector" Game? | Gym Leader Ed | https://www.youtube.com/watch?v=Gvn9YXteDY0 |
| What is a Creature Collector Game? | frogMak | https://www.youtube.com/watch?v=1xdddrGHYQU |
| What types should be in a creature collector? | Rigamarolled | https://www.youtube.com/watch?v=Q4pdO82S37g |
| Designing a Creature Collecting Game | DavSketch | https://www.youtube.com/watch?v=HSTdvQFvhSM |
| Advice For Making Your Own Monster Taming Game | Bryson Ultra | https://www.youtube.com/watch?v=UmXeawdr0SM |
| ⭐ What Makes A Great In-Game Shop? | Design Doc | https://www.youtube.com/watch?v=B_pfFVXBvic |
| How To Make Great Game Rivals | Design Doc | https://www.youtube.com/watch?v=58FL3yIkJSs |
| Pokémon GO & Designing Interactive Games for the Real World | GDC | https://www.youtube.com/watch?v=48DOh-QWgaU |
| When Trainers' Eyes Meet: Real Time Combat for Pokémon GO | GDC | https://www.youtube.com/watch?v=3G8kfLJTVx4 |
| The Birth of the Japanese RPG | Game Maker's Toolkit | https://www.youtube.com/watch?v=fJiwn8iXqOI |

**Palworld e Monster Rancher não entraram**: não existe análise de design
verificável de canal de qualidade sobre eles — só guias e speedruns. O material
sobre os dois no `04-monster-taming.md` veio de fontes escritas.

## 6. Ética, dark patterns e psicologia do engajamento

Quatro destes batem quase literalmente em regras já escritas no `CLAUDE.md` —
servem como fundamentação de decisão que já foi tomada, não como novidade.

| Vídeo | Canal | Regra do Soulmon que ele sustenta | Link |
|---|---|---|---|
| ⭐ De-Gamification: Flexibility to Play Your Way | Extra Credits | `someday` / `dropped` e o escudo automático | https://www.youtube.com/watch?v=gbHizMGL3vc |
| ⭐ The Freedom Fallacy: Player Autonomy | GDC | "aviso, NUNCA bloqueio" (`isOvercommitted`) | https://www.youtube.com/watch?v=kBSB2X4Sbak |
| ⭐ Psychology of Loss Aversion | GDC | teto de 1 coração/dia, alívio de segunda | https://www.youtube.com/watch?v=F_1YcCcBVfY |
| ⭐ Data-Driven or Data-Blinded? | GDC | humor opcional que nunca vira pontuação | https://www.youtube.com/watch?v=MR2rorssk9c |
| Errant Signal — Gamification | Errant Signal | a crítica mais dura ao gênero; leitura obrigatória | https://www.youtube.com/watch?v=pWfMjQKXZXk |
| Dark Patterns: How Good UX Can Be Bad UX | GDC | catálogo do que evitar | https://www.youtube.com/watch?v=BYzwoqezAjU |
| Monetization Design: The Dark Side of Gacha | GDC | fronteira dos Créditos | https://www.youtube.com/watch?v=LnCOkQ-f8AQ |
| Business of Fair Play | GDC | desbloqueio único vs. assinatura | https://www.youtube.com/watch?v=D87U-wutKRk |
| Intrinsically Motivated Teams: Applying SDT | GDC | recompensar comportamento, não resultado | https://www.youtube.com/watch?v=ajzYQpOwfL0 |
| Sid Meier's Psychology of Game Design | GDC | percepção de justiça e sorte | https://www.youtube.com/watch?v=MtzCLd93SyU |
| Idle Games: Mechanics and Monetization | GDC | loop de retorno curto e frequente | https://www.youtube.com/watch?v=Lu-RjxeDpU8 |
| A Practical Guide for Doing Ethical Player Testing | GDC | validar mudança de regra sem manipular | https://www.youtube.com/watch?v=7Q6MkcrpXYI |
| Celia Hodent — Game UX & Ethics | gamescom dev | referência da área em UX + ética | https://www.youtube.com/watch?v=Fv6rltKHW90 |
| Celia Hodent — entrevista longa | Howest DAE | versão conversada dos mesmos princípios | https://www.youtube.com/watch?v=NiuIEWJhimE |
| The Gamer Motivation Profile (Quantic Foundry) | Games User Research SIG | perfis de motivação: oferecer sem obrigar | https://www.youtube.com/watch?v=5lhogZnZ3v0 |
| Gamification Sucks... How to Improve Gamification | Extra Credits | corrosão da motivação intrínseca | https://www.youtube.com/watch?v=pq8dwfvHluc |
| Gamification: Principles of Play in Real Life | Extra Credits | o lado que funciona | https://www.youtube.com/watch?v=1dLK9MW-9sY |
| Don't be a Victim of Dark Patterns! | Extra Credits | auditoria de telas novas | https://www.youtube.com/watch?v=SyeZf50jQXU |
| How Video Games Use Supermarket Psychology | Extra Credits | loja e `UnlockNudge`: convite vs. pressão | https://www.youtube.com/watch?v=Gd5E6uRIWds |
| Game Psychology (compilação) | Extra Credits | entrada rápida para quem chega ao projeto | https://www.youtube.com/watch?v=eg-DoJNMt6A |
| What Can Game Designers Learn From Behavioral Psychology? | Distraction Makers | reforço e extinção → `habitRhythm.ts` | https://www.youtube.com/watch?v=xGajGE2nDiE |
| Why You Keep Playing Brutally Tough Games | Daryl Talks Games | desafio escolhido vs. imposto | https://www.youtube.com/watch?v=H8cavOfbwHw |
| The Concept All Game Devs Should Know | Daryl Talks Games | contrapeso ao discurso de retenção | https://www.youtube.com/watch?v=Uv-KycvzHCA |
| The Psychology of Player Engagement (NZGDC21) | NZ Game Developers Assoc. | engajamento saudável vs. compulsivo | https://www.youtube.com/watch?v=aG5P55jJ2UQ |
| Psychology of Gaming: Crash Course Games #16 | CrashCourse | nivelamento didático | https://www.youtube.com/watch?v=MYJBRWT7JGU |

## 7. Onboarding, ativação e retenção de app

| Vídeo | Canal | Link |
|---|---|---|
| ⭐ Behind the product: Duolingo streaks (Jackson Shuttleworth) | Lenny's Podcast | https://www.youtube.com/watch?v=_CCwoQZH5hI |
| Mastering onboarding (Lauryn Isford, Airtable) | Lenny's Podcast | https://www.youtube.com/watch?v=dLku0AiGPVA |
| Onboarding: Skip it When Possible | NNgroup | https://www.youtube.com/watch?v=OO0jveK-x0w |
| 3 Ways to Onboard New Users | NNgroup | https://www.youtube.com/watch?v=GGRF-B6DgeI |
| Gamification in the User Experience | NNgroup | https://www.youtube.com/watch?v=YKnutkaa5kE |
| How To Keep Your Users (Startup School) | Y Combinator | https://www.youtube.com/watch?v=VNxBZ7ka5J0 |
| Duolingo VP Product: Hypergrowth through Experimentation & Gamification | Product School | https://www.youtube.com/watch?v=aX1wi8AkP04 |

O de streaks do Duolingo é **o mais relevante da biblioteca inteira** para a
seção de constância: é o PM da equipe de retenção explicando por que o streak
freeze precisou vir equipado por padrão — o mesmo achado que sustenta o escudo
automático em `applyMissedDay`.

## 8. Paywall e assinatura

| Vídeo | Canal | Link |
|---|---|---|
| Building More Successful Paywalls in Subscription Apps | Sub Club by RevenueCat | https://www.youtube.com/watch?v=zza9ZIB8jyk |
| Should You Ditch Freemium for a Free Trial Model? | Sub Club by RevenueCat | https://www.youtube.com/watch?v=z-DvsM5-VVU |
| The 2025 State of Subscription Apps Report | Sub Club by RevenueCat | https://www.youtube.com/watch?v=NWT7wIxDkLY |

## 9. Mascote e personagem (Duolingo)

O material público mais próximo do problema "criatura que carrega o vínculo".

| Vídeo | Canal | Link |
|---|---|---|
| ⭐ Creating Our Duolingo Characters (Duocon 2020) | Duolingo | https://www.youtube.com/watch?v=m-3-D7S0piw |
| How we animate the Duolingo world | Duolingo | https://www.youtube.com/watch?v=fgOqvyPif3g |
| Design at Duolingo | Duolingo | https://www.youtube.com/watch?v=IFEHSfH3Lbk |
| How to Make Learning as Addictive as Social Media (Luis von Ahn) | TED | https://www.youtube.com/watch?v=P6FORpg0KVo |
| Luis von Ahn — How to Be (Truly) Mission-Driven | Tim Ferriss | https://www.youtube.com/watch?v=JwiswTQkvew |

## 10. Behavior design (Fogg, Clear, Eyal)

Eyal aparece dos **dois lados** de propósito: escreveu o *Hooked* e depois o
*Indistractable*. Ver os dois na sequência é o melhor teste de consciência antes
de aumentar qualquer push.

| Vídeo | Canal | Link |
|---|---|---|
| The Behavior Model (B=MAP) — BJ Fogg | FranklinCovey | https://www.youtube.com/watch?v=hfLpvmiGzOQ |
| Tiny Habits, Big Changes — BJ Fogg | FranklinCovey | https://www.youtube.com/watch?v=Gsf7AT3itFg |
| Identity-based Habits — James Clear | Omaid Homayun | https://www.youtube.com/watch?v=mnRywBvjjIs |
| Hooked: Building Habit Forming Products — Nir Eyal | Khosla Ventures | https://www.youtube.com/watch?v=RR9PnPr529k |
| Indistractable — Nir Eyal | Talks at Google | https://www.youtube.com/watch?v=WtLIJwObk2M |
| How to Control Your Attention — Nir Eyal | RSA | https://www.youtube.com/watch?v=PxhO5EvCoOs |

"Identity-based habits" ("hábitos são votos em quem você quer ser") é a
formulação mais próxima da tese declarada do Soulmon — um avatar que evolui COM
o usuário é exatamente um voto de identidade tornado visível.
