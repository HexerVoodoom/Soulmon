# Benchmark site de captação Soulmon (consulta 2026-11-05)

Credibilidade: oficial >=0.8; blog/agregador <=0.4 (rebaixado a [indício]). "Não verificado" = não abriu / não confirmou.

## 1. Páginas de jogos (resultado da leitura via WebFetch, 2026-11-05)
| Página | Achado | Fonte | Cred. |
|---|---|---|---|
| Cassette Beasts | Hero = logo + arte + pergunta-gancho; sem botão no hero; CTA único "Wishlist Now" no nav; tira de 4 screenshots; blocos de feature alternados; sem vídeo, sem prova social numérica | https://www.cassettebeasts.com/ | 0.8 |
| Coromon | CTA logo abaixo do texto; newsletter repetida (nav, seção, rodapé) com promessa "rarely"; prova social: "Very Positive", 6.000+ reviews Steam; blocos imagem+título; sem vídeo embutido | https://www.coromon.com/ | 0.8 |
| Monster Sanctuary | Botões de plataforma no topo; bloco "subscribe to get notified"; GIFs de combate em vez de vídeo; Hall of Fame; sem reviews | https://www.monster-sanctuary.com/ | 0.8 |
| Finch | Hero mínimo: headline + subhead + selos App Store/Google Play; prova social "5.0, 500k+ ratings"; quase sem seções | https://finchcare.com/ | 0.8 |
| Habitica | Abriu só o título; hero/CTA não verificado | https://habitica.com/static/home | - |
| Temtem | domínio redireciona para iphome.com (não é o site do jogo); não verificado | https://temtem.com/ | - |
| Palworld | palworld.com NÃO é o jogo (site de gnosticismo); não verificado | https://www.palworld.com/ | - |
| Pokémon Sleep | pokemonsleep.net é site de fã e recusou conexão; não verificado | https://pokemonsleep.net/ | - |
| Nexomon, Tamadoge | não tentados | - | - |
Só 4 de 8 abriram (meta 6-8 NÃO cumprida).

## 2. Sites premiados (Awwwards/FWA)
Não verificado. Busca não achou Silksong/Ori/Sea of Stars/Hades II no Awwwards. Não há base para afirmar "o que faz parecer cinematográfico". Só genérico (Awwwards inspiration, cred. 0.4): parallax em camadas a velocidades diferentes e animação amarrada à posição do scroll. [indício]. Lacuna: abrir awwwards.com/websites/games e fwa.com manualmente.

## 3. Google Play
- Teste fechado: testador precisa de conta Google; lista por e-mail em Test and release > Testing > Closed testing > Manage track > Testers > Create email list (vírgula ou CSV). Limites: 200 listas/conta, 50/trilha, 2.000 testadores/lista; acima disso, Google Groups. Link de opt-in só aparece com app Published; cada testador tem de aceitar pelo link. https://support.google.com/googleplay/android-developer/answer/9845334 (0.9)
- Conta pessoal criada após 13/11/2023: teste fechado com 12 testadores com opt-in contínuo por 14 dias antes de pedir produção. https://support.google.com/googleplay/android-developer/answer/14151465 (0.9)
- Texto: nome 30 car., descrição curta 80, completa 4.000; keyword repetitiva/irrelevante pode gerar suspensão. https://support.google.com/googleplay/android-developer/answer/9859152 (0.9)
- NÃO verificado: ordem/specs de assets e vídeo, regras de pré-registro (as páginas tentadas, 9859455 e 9859350, eram outro assunto). Lacuna.

## 4. Evidência de conversão (fraca)
- [indício] Form de 1 campo (e-mail): mediana 13,4% vs 3,6% com 9 campos; citado como Unbounce 2026 (1,4 mi forms) só por saashero.net, NÃO confirmado em unbounce.com. Cred. 0.4.
- [indício] Vídeo em landing: análise Unbounce (35 mil páginas) relatada por terceiros: mediana de conversão menor com vídeo (desktop e mobile); o "+86%" é teste de um caso (EyeView/TutorVista). https://yougov.com/articles/37776-video-not-conversion-boosting-genie-landing-pages- (0.4)
- Mediana geral 6,6% (Unbounce 2024), via terceiro. [indício]
- CTA, escassez, prova social, double opt-in: não achei estudo. Só observação direta dos 4 sites acima (nível "observação", não prova).

## 5. Viabilidade (docs oficiais Cloudflare/Resend, 0.9)
- Pages grátis: 500 builds/mês, 20.000 arquivos, 25 MiB/arquivo. https://developers.cloudflare.com/pages/platform/limits/
- Workers grátis: 100.000 req/dia, 10 ms CPU/req, 50 subrequests. Functions do Pages contam nessa cota. https://developers.cloudflare.com/workers/platform/limits/
- D1 grátis: 5 GB/conta, 500 MB/banco, 10 bancos, 50 queries/invocação. Limite de linhas lidas/escritas por dia: não verificado. https://developers.cloudflare.com/d1/platform/limits/
- Turnstile grátis: 20 widgets, desafios ilimitados, 10 hostnames/widget, analytics 7 dias. https://developers.cloudflare.com/turnstile/plans/
- Web Analytics: "disponível em todos os planos"; limites/retenção não verificados.
- Cloudflare Email Sending (beta) exige Workers Paid; no Free só envia a endereços destino verificados na conta. Email Routing só recebe/encaminha. https://developers.cloudflare.com/email-service/
  => Free serve para avisar o revisor soulmon.revisor@gmail.com SE ele for verificado como destino; NÃO serve para confirmação ao inscrito (endereço arbitrário).
- Resend grátis: 100 e-mails/dia, 3.000/mês, 3 domínios. https://resend.com/pricing => serve aos dois usos (inscrito + revisor); precisa de domínio verificado para mandar a terceiros [suposição: não confirmado na página].
- Brevo: números do plano grátis não verificados (página não trouxe).

## 6. Técnica
- GSAP: licença padrão da Webflow cobre uso comercial grátis, incluindo plugins como ScrollTrigger; proibido em ferramentas visuais concorrentes do Webflow. https://gsap.com/community/standard-license/ (0.9)
- Lenis: MIT, "alguns KB", respectReducedMotion=true por padrão, não quebra sticky/âncoras, syncTouch desligado por padrão. https://github.com/darkroomengineering/lenis (0.8)
- prefers-reduced-motion: animação decorativa só sob no-preference; sob reduce, cortar parallax/autoplay; JS precisa de listener de change. https://web.dev/articles/prefers-reduced-motion (0.9)
- gsap.matchMedia() recomendado (ScrollTrigger.matchMedia está deprecado). https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- Astro i18n nativo: locales em src/pages/<locale>, prefixDefaultLocale, getRelativeLocaleUrl, fallback; funciona em estático. https://docs.astro.build/en/guides/internationalization/ (0.9)
- NÃO verificado: kB exatos do GSAP, custo de parallax em celular fraco (sem medição nem fonte). Vite puro: sem fonte consultada.

## Paridade x diferencial
Paridade (4 sites): logo + arte, 1 CTA claro, screenshots, blocos de feature, link de rede/Discord, rodapé.
Paridade fraca: prova social numérica (só Coromon, Finch); newsletter repetida (Coromon, Monster Sanctuary).
Diferencial possível p/ Soulmon [suposição, nenhum concorrente lido faz]: pré-cadastro de beta com e-mail único + parallax arcano de identidade própria (cristal/chama); nenhum dos 4 mostra o loop tarefa-real -> criatura na página (Finch comunica por frase). Cópia em 3 meses: arte e mundo próprios não se copiam rápido; parallax em si se copia.

## Anti-padrões
- Hero sem CTA (Cassette Beasts) quando o objetivo é captar e-mail.
- Vídeo autoplay pesado no hero (evidência fraca de ganho).
- Form longo; efeito sem fallback de reduced-motion; scroll hijack.
- Site "cinematográfico" sem entregar o CTA acima da dobra no celular.

## Recomendações
1. Um campo (e-mail) + Turnstile; CTA no hero e repetido no fim.
2. Parallax só em transform/opacity, GSAP+ScrollTrigger (ou CSS), desligado em reduce; Lenis opcional.
3. Astro estático com i18n nativo (pt-BR padrão, /en).
4. Inscrição: Pages Function -> D1; aviso ao revisor via Resend (ou Cloudflare se destino verificado); confirmação ao inscrito via Resend.
5. Ponte Play: coletar e-mail Gmail do testador (lista de e-mail exige conta Google); planejar 12 testadores x 14 dias.
6. Fechar lacunas: Awwwards/FWA, specs de assets e pré-registro da Play, Brevo, limites D1 por linha, Web Analytics.
