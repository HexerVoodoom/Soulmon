// Textos do MAPA DE ANDARES do Rift (REGISTRO §462). Inglês primeiro; tom calmo, nunca cobrança.
export interface RiftMapCopy {
  title: string;
  back: string;
  floors: (label: string) => string;
  nodeAria: (label: string, element: string, state: 'visited' | 'current' | 'locked') => string;
  hereNote: string;
  lockedNote: string;
  busyNote: string;
  askTitle: string;
  askBody: (label: string, setName: string) => string;
  askYes: string;
  askNo: string;
  sureTitle: string;
  sureBody: string;
  sureYes: string;
  sureNo: string;
  doneNote: (floor: number) => string;
  you: string;
  /** O indicador da descida no mapa: "Camada 9 · Fogo 2". */
  hereLayer: (layer: number, floorName: string) => string;
  portalAria: (layer: number, state: 'locked' | 'unlocked' | 'here') => string;
  portalWord: string;
  portalLockedNote: string;
  portalUnlockedToast: string;
  /** O nó logo abaixo do portal onde o jogador está: seguir sem usar o portal. */
  downTitle: string;
  downYes: string;
  teleportNote: (layer: number) => string;
}

export function riftMapCopy(isPt: boolean): RiftMapCopy {
  return isPt ? {
    title: 'Mapa da Fenda',
    back: 'Voltar',
    floors: l => `Andares ${l}`,
    nodeAria: (l, el, st) => `${el}, andares ${l}, ${st === 'current' ? 'você está aqui' : st === 'visited' ? 'já visitado' : 'ainda não visitado'}`,
    hereNote: 'Você está aqui.',
    lockedNote: 'Você ainda não chegou aqui.',
    busyNote: 'Seu Soulmon está na Fenda agora. Retire-o de lá para escolher outro ponto.',
    askTitle: 'Voltar para estes andares?',
    askBody: (l, nome) => `${nome} (andares ${l}). A próxima descida começa aqui.`,
    askYes: 'Voltar para cá',
    askNo: 'Agora não',
    sureTitle: 'Sem volta',
    sureBody: 'Essa ação não tem volta: você terá que descer novamente.',
    sureYes: 'Sim, voltar',
    sureNo: 'Cancelar',
    doneNote: f => `Pronto. A próxima descida começa no andar ${f}.`,
    you: 'Seu Soulmon',
    hereLayer: (l, f) => `Camada ${l} · ${f}`,
    portalAria: (l, st) => `Portal da camada ${l}, ${st === 'here' ? 'você está aqui' : st === 'unlocked' ? 'desbloqueado, toque para teletransportar' : 'bloqueado'}`,
    portalWord: 'Portal',
    portalLockedNote: 'Esse portal ainda não foi desbloqueado.',
    portalUnlockedToast: 'Portal desbloqueado',
    downTitle: 'Descer para estes andares?',
    downYes: 'Descer',
    teleportNote: l => `Teletransportado. A próxima descida começa no andar ${l}.`,
  } : {
    title: 'Rift map',
    back: 'Back',
    floors: l => `Floors ${l}`,
    nodeAria: (l, el, st) => `${el}, floors ${l}, ${st === 'current' ? 'you are here' : st === 'visited' ? 'visited' : 'not reached yet'}`,
    hereNote: 'You are here.',
    lockedNote: "You haven't reached this one yet.",
    busyNote: 'Your Soulmon is in the Rift right now. Take your Soulmon out of the Rift to pick another spot.',
    askTitle: 'Go back to these floors?',
    askBody: (l, nome) => `${nome} (floors ${l}). Your next descent starts here.`,
    askYes: 'Go back here',
    askNo: 'Not now',
    sureTitle: 'No way back',
    sureBody: "This can't be undone: you'll have to go down again.",
    sureYes: 'Yes, go back',
    sureNo: 'Cancel',
    doneNote: f => `Done. Your next descent starts at floor ${f}.`,
    you: 'Your Soulmon',
    hereLayer: (l, f) => `Layer ${l} · ${f}`,
    portalAria: (l, st) => `Layer ${l} portal, ${st === 'here' ? 'you are here' : st === 'unlocked' ? 'unlocked, tap to teleport' : 'locked'}`,
    portalWord: 'Portal',
    portalLockedNote: "This portal isn't unlocked yet.",
    portalUnlockedToast: 'Portal unlocked',
    downTitle: 'Go down to these floors?',
    downYes: 'Go down',
    teleportNote: l => `Teleported. Your next descent starts at floor ${l}.`,
  };
}
