import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { ModalSheet, sm2Button, sm2Text } from './form/FormKit';
import type { Language } from '../utils/i18n';
import { SoulmonReview } from '../plugins/SoulmonReviewPlugin';
import { decideUpdate, parseAppConfig, parseInstalledBuild, type UpdateDecision } from '../utils/appUpdate';

/**
 * Modal de atualização do app nativo. Só no Capacitor (web/desktop nunca mostram). Lê o versionCode instalado
 * (`App.getInfo().build`) e `/api/app-config`; qualquer falha = não aparece (fail-open).
 * 'block' = sem fechar, só "Atualizar". 'suggest' = "Depois" fecha, e não volta até a próxima abertura do app.
 */
export function AppUpdateGate({ language }: { language: Language }) {
  const [decision, setDecision] = useState<UpdateDecision>('none');
  const rodou = useRef(false);

  useEffect(() => {
    if (rodou.current || !Capacitor.isNativePlatform()) return;
    rodou.current = true;
    (async () => {
      try {
        const [info, resp] = await Promise.all([CapApp.getInfo(), fetch('/api/app-config')]);
        if (!resp.ok) return;
        setDecision(decideUpdate(parseInstalledBuild(info.build), parseAppConfig(await resp.json())));
      } catch { /* fail-open */ }
    })();
  }, []);

  if (decision === 'none') return null;
  const isPt = language === 'pt-BR';
  const block = decision === 'block';
  const atualizar = () => {
    SoulmonReview.openStore().catch(() => { try { window.open('https://play.google.com/store/apps/details?id=com.soulmon', '_blank', 'noopener'); } catch { /* sem loja */ } });
  };
  return (
    <ModalSheet
      open
      placement="center"
      onClose={block ? () => {} : () => setDecision('none')}
      closeSide={block ? 'none' : 'start'}
      dismissOnBackdrop={!block}
      language={language}
      title={isPt ? 'Nova versão disponível' : 'New version available'}
      maxWidth={340}
      footer={
        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          {!block && <button type="button" onClick={() => setDecision('none')} style={{ ...sm2Button('outline'), flex: 1 }} data-app-update-later>{isPt ? 'Depois' : 'Later'}</button>}
          <button type="button" onClick={atualizar} style={{ ...sm2Button('primary'), flex: 1 }} data-app-update-ok>{isPt ? 'Atualizar' : 'Update'}</button>
        </div>
      }
    >
      <p style={{ ...sm2Text, margin: 0 }} data-app-update>
        {block
          ? (isPt ? 'Há uma nova versão do Soulmon com melhorias. Atualize para continuar.' : 'A new version of Soulmon is out with improvements. Update to keep going.')
          : (isPt ? 'Há uma nova versão do Soulmon com melhorias.' : 'A new version of Soulmon is out with improvements.')}
      </p>
    </ModalSheet>
  );
}
