import { FirstTaskCompletedPopup } from './FirstTaskCompletedPopup';

interface GamePopupsProps {
  showFirstTaskPopup: boolean;
  onCloseFirstTaskPopup: () => void;
  theme: 'default' | 'win98' | 'glitch';
}

export function GamePopups({
  showFirstTaskPopup,
  onCloseFirstTaskPopup,
  theme,
}: GamePopupsProps) {
  return (
    <>
      {/* First Task Completed Popup */}
      <FirstTaskCompletedPopup
        isOpen={showFirstTaskPopup}
        onClose={onCloseFirstTaskPopup}
        theme={theme}
      />
    </>
  );
}
