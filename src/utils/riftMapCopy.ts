// Textos do MAPA DE ANDARES do Rift (REGISTRO §452). Inglês primeiro; tom calmo, nunca cobrança.
export interface RiftMapCopy {
  title: string;
  back: string;
  floors: (label: string) => string;
  nodeAria: (label: string, element: string, state: 'visited' | 'current' | 'locked') => string;
  hereNote: string;
  lockedNote: string;
  busyNote: string;
  askTitle: string;
  askBody: (label: string, element: string) => string;
  askYes: string;
  askNo: string;
  sureTitle: string;
  sureBody: string;
  sureYes: string;
  sureNo: string;
  doneNote: (floor: number) => string;
  you: string;
}

export function riftMapCopy(isPt: boolean): RiftMapCopy {
  return isPt ? {
    title: 'Mapa da Fenda',
    back: 'Voltar',
    floors: l => `Andares ${l}`,
    nodeAria: (l, el, st) => `Andares ${l}, ${el}, ${st === 'current' ? 'você está aqui' : st === 'visited' ? 'já visitado' : 'ainda não visitado'}`,
    hereNote: 'Você está aqui.',
    lockedNote: 'Você ainda não chegou aqui.',
    busyNote: 'Seu Soulmon está na Fenda agora. Retire-o de lá para escolher outro ponto.',
    askTitle: 'Voltar para estes andares?',
    askBody: (l, el) => `Andares ${l} · ${el}. A próxima descida começa aqui.`,
    askYes: 'Voltar para cá',
    askNo: 'Agora não',
    sureTitle: 'Sem volta',
    sureBody: 'Essa ação não tem volta: você terá que descer novamente.',
    sureYes: 'Sim, voltar',
    sureNo: 'Cancelar',
    doneNote: f => `Pronto. A próxima descida começa no andar ${f}.`,
    you: 'Seu Soulmon',
  } : {
    title: 'Rift map',
    back: 'Back',
    floors: l => `Floors ${l}`,
    nodeAria: (l, el, st) => `Floors ${l}, ${el}, ${st === 'current' ? 'you are here' : st === 'visited' ? 'visited' : 'not reached yet'}`,
    hereNote: 'You are here.',
    lockedNote: "You haven't reached this one yet.",
    busyNote: 'Your Soulmon is in the Rift right now. Take your Soulmon out of the Rift to pick another spot.',
    askTitle: 'Go back to these floors?',
    askBody: (l, el) => `Floors ${l} · ${el}. Your next descent starts here.`,
    askYes: 'Go back here',
    askNo: 'Not now',
    sureTitle: 'No way back',
    sureBody: "This can't be undone: you'll have to go down again.",
    sureYes: 'Yes, go back',
    sureNo: 'Cancel',
    doneNote: f => `Done. Your next descent starts at floor ${f}.`,
    you: 'Your Soulmon',
  };
}
