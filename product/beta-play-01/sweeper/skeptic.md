# Skeptic — gate Sweeper (gravado pelo orquestrador; agente sem escrita)
FATAL A1: revisor da Play fora de BETA_EMAILS -> vê "beta fechado" -> rejeição. Fix: runbook põe revisor+dono na lista antes de submeter; verificação com login limpo.
FATAL A2: BETA_CLOSED/BETA_EMAILS/IP_HASH_SALT/SPRITE_DISABLED só na CONTINGÊNCIA, não no RUNBOOK; tudo falha aberto. Fix: fase no runbook + verificação 403 beta-closed.
FIX A3: BETA_EMAILS não vazio já tranca IA de quem não está (inclusive dono). Ordem: lista completa (dono+revisor) antes da flag.
FIX A4: teste rtdn sem tabela 0003 (fallback KV) ou exigir migração antes do merge do #315.
FIX B1: provar que 403 beta-closed não monta estado nem grava save local por cima.
FIX B2: backup de saves ANTES do merge.
FIX C1: e-mail de login ≠ convite (ponto/+tag/outra conta) -> tela fechada; onboarding pede e-mail exato, tela mostra o e-mail atual; considerar normalização de Gmail.
FIX C2: sprite feio sem retry -> rota admin invalida cache de uma forma.
FIX D1: runbook 0.1 contradiz fluxo real (release já existe, PR #315). D2: FIREBASE_SERVICE_ACCOUNT também na raiz (7.2). D3: migração "antes do merge do #315".
Contradição: teto vitalício sprite 15 (código/contingência) vs 26 (abuso-e-custo, anterior à decisão) — 15 vale.
