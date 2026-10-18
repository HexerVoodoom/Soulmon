# Compliance Play — beta fechado (Fase 0, 2026-10-11)
Gravado pelo orquestrador a partir do relatório do alpha-compliance (agente sem ferramenta de escrita).

Ok: targetSdk 36 (exigido p/ app novo desde 31/08/2026); privacidade.html publicada; exclusão de conta in-app (testar no AAB) e web (#exclusao — unificar URL com .html); RECORD_AUDIO/ACTIVITY_RECOGNITION declarados; 18+, sem anúncios, não-Families; ficha/IARC/IA prontos p/ colar.
Falta-código/doc (squad): tabela de permissões da Data Safety vs manifesto mesclado (BILLING, WAKE_LOCK, ACCESS_NETWORK_STATE, FOREGROUND_SERVICE, c2dm.RECEIVE, READ_GSERVICES); IARC "compras" incluir assinatura; assinatura: botão Gerenciar/Cancelar (Central de assinaturas Play), divulgação pré-compra (preço localizado, "a cada 3 meses", renova automaticamente, cancele na Play); trechos de assinatura em termos.html/privacidade.html (rascunho → dono aprova); Data Safety §2.2 e PLAY-FICHA "o que é grátis" PT/EN.
Pergunta: SCHEDULE_EXACT_ALARM necessário? (trocar por inexato se possível).
Falta-dono: colar Data Safety/IARC/IA; SKU+preço; perfil de pagamentos; licença de teste; 12+ testadores.
Fontes: developer.android.com/google/play/requirements/target-sdk ; support.google.com/googleplay/android-developer/answer/9900533 (consult. 11/10/2026)
