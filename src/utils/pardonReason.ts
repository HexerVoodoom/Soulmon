/**
 * Qual perdão agiu na virada do dia. Só NOMEIA o que a conta de `computeDailyReset`
 * já decidiu — não decide nada. Relatório de save antigo não traz o campo; o
 * fallback lê os três booleanos que já existiam.
 */
export type PardonReason =
  | 'restDay' | 'absence' | 'returnGrace' | 'newSave' | 'stubborn'
  | 'rootFloor' | 'partialGoal' | 'mondayRelief' | 'noneRegistered' | 'none';

const VALID: readonly string[] = [
  'restDay', 'absence', 'returnGrace', 'newSave', 'stubborn',
  'rootFloor', 'partialGoal', 'mondayRelief', 'noneRegistered', 'none',
];

export function pardonReasonOf(report: any): PardonReason {
  const r = report?.pardonReason;
  if (typeof r === 'string' && VALID.includes(r)) return r as PardonReason;
  if (report?.welcomeBack) return 'absence';
  if (report?.restDayUsed) return 'restDay';
  if (report?.forgiven) return 'newSave';
  return 'none';
}

/** Uma linha calma por motivo. `null` onde o modal já tem linha própria. */
export function pardonLine(reason: PardonReason, isPt: boolean): string | null {
  switch (reason) {
    case 'returnGrace':
      return isPt ? 'A Malha está te esperando de volta. Ontem não pesou.' : 'The Mesh is easing you back in. Yesterday did not weigh.';
    case 'newSave':
      return isPt ? 'Os primeiros dias da Malha são de reconhecimento. Ontem não pesou.' : 'The first days of the Mesh are for finding your feet. Yesterday did not weigh.';
    case 'stubborn':
      return isPt ? 'Ele é teimoso: o dia ruim pesou menos.' : 'It is stubborn: a rough day weighed less.';
    case 'rootFloor':
      return isPt ? 'Na forma de raiz, a maré segura o coração.' : 'In its root form, the tide holds the heart steady.';
    case 'partialGoal':
      return isPt ? 'O que foi feito bastou para a maré. Nada foi cobrado.' : 'What was done was enough for the tide. Nothing was charged.';
    case 'noneRegistered':
      return isPt ? 'Não havia nada marcado para ontem. Nada foi cobrado.' : 'Nothing was set for yesterday. Nothing was charged.';
    default:
      return null;
  }
}
