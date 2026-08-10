import { FirstTaskCompletedPopup } from './FirstTaskCompletedPopup';

interface GamePopupsProps {
  showFirstTaskPopup: boolean;
  onCloseFirstTaskPopup: () => void;
  language?: 'pt-BR' | 'en-US';
}

export function GamePopups({
  showFirstTaskPopup,
  onCloseFirstTaskPopup,
  language = 'en-US',
}: GamePopupsProps) {
  return (
    <>
      {/* First Task Completed Popup */}
      <FirstTaskCompletedPopup
        isOpen={showFirstTaskPopup}
        onClose={onCloseFirstTaskPopup}
        language={language}
      />
    </>
  );
}
