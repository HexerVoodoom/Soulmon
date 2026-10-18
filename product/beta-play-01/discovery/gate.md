# Gate Fase 0 — beta-play-01
Artefatos: dossie-prontidao.md, qa-baseline.md (+test-run.log), threat-model-beta.md, compliance-play.md.
Suíte: 8550 ok / 2 falhas (F1 fuso BRT em dayKeyToDate — BLOQUEIA; F2 CRLF App.tsx). tsc ok. build web ok. assembleDebug ok, bundleRelease gera AAB não assinado.
Bloqueadores beta: F1; migração D1 remota não provada; PLAY_REQUIRE_ACCOUNT_BINDING off; BillingPlugin só INAPP (assinatura); sem crash reporting; sem tela de erro de rede (app carrega server.url remoto); restrição da API key do google-services.
Decisões assumidas (declaradas, revisáveis): padrão ASVS L1/MASVS-L1; reembolso de assinatura fecha a vitrine futura sem retirar o entregue (D10) — abuso aceito no beta; SCHEDULE_EXACT_ALARM trocado por inexato se o uso permitir.
Preço assinatura: R$ 9,90/trimestre (dono). Recrutamento de testadores: squad prepara (dono).
Veredito: segue para Builder.
