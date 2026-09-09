// Arte pixel das 24 cenas da aventura da noite (ver `docs/BACKLOG-ARTE-GERAR.md`,
// item A20). Fronteira de troca, no mesmo molde de `utils/dreamArt.ts` e
// `utils/decorArt.ts`: quem desenha o relatorio e o diario importa daqui e nao
// conhece PNG nenhum.
//
// Por que existe em vez de o PNG entrar direto no `ADVENTURE_CATALOG`
// (`utils/adventure.ts`): aquele modulo e de funcoes PURAS, sem React e sem
// bundler — e o teste dele roda em Node. Um `import ... from '*.png'` ali
// amarraria a regra da aventura ao pipeline do Vite.
//
// O `emoji` FICA no catalogo mesmo com a arte pronta, pelo mesmo motivo
// pratico do dex de sonhos: e o unico glifo que cabe num push, num titulo de
// notificacao ou num log, onde nao existe `<img>`. Quem desenha continua com o
// `? :` de fallback — a arte pode faltar num save/bundle antigo.
//
// ESTILO: arcano-tech (decisao do dono, 08/09/2026) — verde-petroleo, cobre,
// energia ciano, sombreamento em degraus. Ver `docs/PROMPT-ARTE-ARCANO-TECH.md`.
// As 12 COMUNS foram geradas no Gemini; as 12 raras/lendarias foram DESENHADAS
// (`scripts/aventura-desenhar.mjs`) porque a folha do gerador nao pudo ser
// enviada — o cabecalho daquele script tem o registro do bloqueio. Se a folha
// for gerada depois, ela substitui os arquivos e este mapa nao muda.
import advCaminhoCurto from '../assets/soulmon/adventures/adv-caminho-curto.png';
import advChuvaCurta from '../assets/soulmon/adventures/adv-chuva-curta.png';
import advConcha from '../assets/soulmon/adventures/adv-concha.png';
import advEco from '../assets/soulmon/adventures/adv-eco.png';
import advNuvem from '../assets/soulmon/adventures/adv-nuvem.png';
import advOrvalho from '../assets/soulmon/adventures/adv-orvalho.png';
import advPassaro from '../assets/soulmon/adventures/adv-passaro.png';
import advPedraLisa from '../assets/soulmon/adventures/adv-pedra-lisa.png';
import advPegadas from '../assets/soulmon/adventures/adv-pegadas.png';
import advSemente from '../assets/soulmon/adventures/adv-semente.png';
import advSombraBoa from '../assets/soulmon/adventures/adv-sombra-boa.png';
import advVentoMorno from '../assets/soulmon/adventures/adv-vento-morno.png';
import advCarta from '../assets/soulmon/adventures/adv-carta.png';
import advEscada from '../assets/soulmon/adventures/adv-escada.png';
import advFlorFora from '../assets/soulmon/adventures/adv-flor-fora.png';
import advLagoEspelho from '../assets/soulmon/adventures/adv-lago-espelho.png';
import advMapaRasgado from '../assets/soulmon/adventures/adv-mapa-rasgado.png';
import advPortaArvore from '../assets/soulmon/adventures/adv-porta-arvore.png';
import advSino from '../assets/soulmon/adventures/adv-sino.png';
import advTrilhaAntiga from '../assets/soulmon/adventures/adv-trilha-antiga.png';
import advAurora from '../assets/soulmon/adventures/adv-aurora.png';
import advCometa from '../assets/soulmon/adventures/adv-cometa.png';
import advGuardiao from '../assets/soulmon/adventures/adv-guardiao.png';
import advPonte from '../assets/soulmon/adventures/adv-ponte.png';

/** Id do achado em `ADVENTURE_CATALOG` → URL do PNG. */
export const ADVENTURE_ART: Record<string, string> = {
  // comuns
  'adv-orvalho': advOrvalho,
  'adv-pegadas': advPegadas,
  'adv-pedra-lisa': advPedraLisa,
  'adv-vento-morno': advVentoMorno,
  'adv-semente': advSemente,
  'adv-eco': advEco,
  'adv-caminho-curto': advCaminhoCurto,
  'adv-chuva-curta': advChuvaCurta,
  'adv-sombra-boa': advSombraBoa,
  'adv-passaro': advPassaro,
  'adv-concha': advConcha,
  'adv-nuvem': advNuvem,
  // raras
  'adv-porta-arvore': advPortaArvore,
  'adv-lago-espelho': advLagoEspelho,
  'adv-mapa-rasgado': advMapaRasgado,
  'adv-sino': advSino,
  'adv-escada': advEscada,
  'adv-carta': advCarta,
  'adv-flor-fora': advFlorFora,
  'adv-trilha-antiga': advTrilhaAntiga,
  // lendárias
  'adv-cometa': advCometa,
  'adv-guardiao': advGuardiao,
  'adv-ponte': advPonte,
  'adv-aurora': advAurora,
};
