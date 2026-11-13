/**
 * MODO DEMO DE EVOLUÇÃO — SÓ PARA GRAVAR VÍDEO DE DIVULGAÇÃO (13/11/2026, dono).
 *
 * No app real a barra de evolução só enche na virada do dia. Para o vídeo
 * "streamer" a evolução tem que aparecer assim que a última tarefa do dia é
 * marcada. Este modo faz exatamente isso e mais nada.
 *
 * NUNCA chega ao usuário: exige a variável de build `VITE_DEMO_EVOLUCAO=1` E
 * um build que NÃO seja de produção (`import.meta.env.PROD` é constante em
 * tempo de build, então no release o corpo vira `false` e o resto é removido).
 * Como ligar: `VITE_DEMO_EVOLUCAO=1 npx vite --mode development` (ou build com
 * `--mode development`). Nenhum .env versionado, script ou workflow o define
 * (teste: demoEvolucao.test.ts).
 */
export function demoEvolucaoAtiva(): boolean {
  return !import.meta.env.PROD && import.meta.env.VITE_DEMO_EVOLUCAO === '1';
}
