/**
 * §383 (dono, 14/11/2026: "Se ignorar 2x ou 5s dispensa") — o lado App do balão dourado que some sozinho.
 *
 *  · O HUD conta os `BALAO_DOURADO_VISIVEL_MS` com o balão NA TELA e chama `ignorar(tipo, dia)` quando ele some sem toque.
 *  · `ignorar` soma 1 na contagem do aparelho (`STORAGE_KEYS.BALAO_DOURADO_IGNORADOS`, regra em `registrarIgnorado`) e esconde o
 *    balão até a PRÓXIMA ABERTURA (voltar para a Home vindo de outra tela, ou o app voltar ao primeiro plano) — nunca em laço.
 *  · No 2º ignorado do dia, `onDispensar(tipo)` grava o MESMO `dispensar` do toque (save da conta): só volta no dia seguinte.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { readJson, writeJson } from '../utils/safeStorage';
import { registrarIgnorado, sanitizeBalaoIgnorados, type BalaoTipo } from '../utils/balaoDourado';

export function useBalaoDouradoIgnorado({ naHome, onDispensar }: { naHome: boolean; onDispensar: (tipo: BalaoTipo) => void }): {
  oculto: (tipo: BalaoTipo) => boolean;
  ignorar: (tipo: BalaoTipo, dia: string) => void;
} {
  const [abertura, setAbertura] = useState(0);
  const aberturaRef = useRef(0);
  aberturaRef.current = abertura;
  const [escondido, setEscondido] = useState<{ tipo: BalaoTipo; abertura: number } | null>(null);
  const dispensarRef = useRef(onDispensar);
  dispensarRef.current = onDispensar;

  const naHomeAntes = useRef(naHome);
  useEffect(() => {
    if (naHome && !naHomeAntes.current) setAbertura(a => a + 1);
    naHomeAntes.current = naHome;
  }, [naHome]);
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const voltou = () => { if (document.visibilityState === 'visible') setAbertura(a => a + 1); };
    document.addEventListener('visibilitychange', voltou);
    return () => document.removeEventListener('visibilitychange', voltou);
  }, []);

  const ignorar = useCallback((tipo: BalaoTipo, dia: string) => {
    const { reg, dispensa } = registrarIgnorado(sanitizeBalaoIgnorados(readJson<unknown>(STORAGE_KEYS.BALAO_DOURADO_IGNORADOS, {})), tipo, dia);
    writeJson(STORAGE_KEYS.BALAO_DOURADO_IGNORADOS, reg, { silent: true });
    setEscondido({ tipo, abertura: aberturaRef.current });
    if (dispensa) dispensarRef.current(tipo);
  }, []);
  const oculto = useCallback((tipo: BalaoTipo) => escondido?.tipo === tipo && escondido.abertura === abertura, [escondido, abertura]);
  return { oculto, ignorar };
}
