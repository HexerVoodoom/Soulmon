import { FirstTaskCompletedPopup } from './FirstTaskCompletedPopup';

interface GamePopupsProps {
  showFirstTaskPopup: boolean;
  onCloseFirstTaskPopup: () => void;
  language?: 'pt-BR' | 'en-US';
  /** Sprite atual do pet — a criatura na peça da primeira tarefa (R8). */
  spriteUrl?: string | null;
}

export function GamePopups({
  showFirstTaskPopup,
  onCloseFirstTaskPopup,
  language = 'en-US',
  spriteUrl,
}: GamePopupsProps) {
  return (
    <>
      {/* First Task Completed Popup */}
      <FirstTaskCompletedPopup
        isOpen={showFirstTaskPopup}
        onClose={onCloseFirstTaskPopup}
        language={language}
        spriteUrl={spriteUrl}
      />
    </>
  );
}
