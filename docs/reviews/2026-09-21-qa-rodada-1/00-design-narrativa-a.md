# Design-critic + narrative-critic — superfícies novas (salvo pelo coordenador; tabela final)
| # | Superfície | Achado | Sev. | Conserto |
|---|---|---|---|---|
| P1 | privacidade §2b/§6 | "nunca texto seu" falso: `aiSettings.customKeywords` + humor (`moodToday`) + estágio/galho vão ao Groq | FATAL | reescrever §2b e linha Groq da §6 (PT+EN) |
| B1 | FeedbackLink | 3 versões (1.0.2 / package 0.1.0 / versionName 1.1.4) | alto | `__APP_VERSION__` via vite define + contrato |
| E2 | termos §8 | "deixa a voz do personagem de lado" × `bridgeReply` mantém a voz | alto | "mensagem fixa, escrita por gente — não pelo modelo" |
| D1 | index.html aviso WebView | sem links para a Play | alto | dois <a> Play Store via createElement |
| A1 | Banner | título afirma os dois docs mesmo com `||` | fixável | prop changed + 3 títulos |
| A2 | Banner | "Nada muda no seu jogo" não verificado | fixável | "Você continua jogando normalmente…" |
| A3 | Banner+ActionRow | `_blank` sem aviso | fixável | aria-label "(abre em nova aba)" |
| A4 | Banner | role=status com controles | fixável | role=region aria-labelledby |
| A5 | Banner + Settings | EN cai no PT (`#en`, `#chat-context`) | fixável | href por idioma |
| A6 | Banner | "Ok" × "Entendi/Got it" | baixo | rótulo |
| A7 | contrato fila | `termos` não travado como último; PRINCIPIOS com 6 itens | baixo | indexOf + docs |
| B2 | ActionRow | mailto com `_blank`; hint sem endereço | fixável | sem _blank em mailto; hint com e-mail |
| B3 | SettingsPage | feedback em Sobre; padrão é Ajuda | fixável | mover acima da versão em Ajuda |
| B4 | feedbackMailto | "Origem: settings" em PT | baixo | localizar |
| C1 | Settings Sobre | omite sons de IA | fixável | "…alguns sons e as falas…" |
| C2 | Settings Sobre | §16.3 em sm2Hint | baixo | sm2Text |
| C3 | bíblia L10 | diz que Sobre não existe | doc | atualizar nota |
| D2 | index.html | lang="en" fixo | fixável | documentElement.lang no script |
| D3 | index.html | diagnóstico WebView para não-Android | fixável | ramo /Android/ |
| D4 | index.html | sem contato | baixo | mailto |
| E1 | termos §4 PT | "quando existir" × BITS_EXCHANGE existe | fixável | remover hedge |
| E3 | termos §8 | "sons de marco e evolução" × S16 (evolve/degenerate/taskComplete) | baixo | corrigir lista |
| P2 | privacidade §2b×§6 | objetivo onboarding × objetivo sugestão | fixável | parêntese |
| P3 | privacidade §6 | "Serviço de transcrição" sem nome (Groq Whisper) | fixável | nomear |
| OBS | privacidade §8 × account.js L180 | "sem pedir a ninguém" pode não valer sem login | verificar | — |
| OBS | decisão #24 | sem caminho para mudança material | registrar | gatilho no REGISTRO |
| ESC | privacidade Contato | sem encarregado LGPD | compliance | — |
