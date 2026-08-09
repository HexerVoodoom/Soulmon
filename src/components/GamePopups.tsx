import { FirstTaskCompletedPopup } from './FirstTaskCompletedPopup';

interface GamePopupsProps {
  showFirstTaskPopup: boolean;
  onCloseFirstTaskPopup: () => void;
  theme: 'default' | 'win98' | 'glitch';
  language?: 'pt-BR' | 'en-US';
}

export function GamePopups({
  showFirstTaskPopup,
  onCloseFirstTaskPopup,
  theme,
  language = 'en-US',
}: GamePopupsProps) {
  return (
    <>
      {/* First Task Completed Popup */}
      <FirstTaskCompletedPopup
        isOpen={showFirstTaskPopup}
        onClose={onCloseFirstTaskPopup}
        theme={theme}
        language={language}
      />
    </>
  );
}
