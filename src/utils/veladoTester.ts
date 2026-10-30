import { setVeladoTester } from './bbStage';

/** Pergunta ao servidor se o usuário logado está no teste do Velado e aplica o resultado. Nunca lança; falha = desligado. */
export async function refreshVeladoTester(idToken: string | null | undefined): Promise<boolean> {
  let on = false;
  try {
    if (idToken) {
      const r = await fetch('/api/velado-teste', { headers: { Authorization: `Bearer ${idToken}` } });
      on = r.ok && (await r.json())?.tester === true;
    }
  } catch { on = false; }
  setVeladoTester(on);
  return on;
}
