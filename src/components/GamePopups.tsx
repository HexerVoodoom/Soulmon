import { FirstTaskCompletedPopup } from './FirstTaskCompletedPopup';
import { RookieUnlockPopup } from './RookieUnlockPopup';

interface GamePopupsProps {
  showFirstTaskPopup: boolean;
  onCloseFirstTaskPopup: () => void;
  showRookieUnlockPopup: boolean;
  onCloseRookieUnlockPopup: () => void;
  theme: 'default' | 'win98' | 'glitch';
}

export function GamePopups({
  showFirstTaskPopup,
  onCloseFirstTaskPopup,
  showRookieUnlockPopup,
  onCloseRookieUnlockPopup,
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

      {/* Rookie Feature Unlock Popup */}
      <RookieUnlockPopup
        isOpen={showRookieUnlockPopup}
        onClose={onCloseRookieUnlockPopup}
        theme={theme}
      />
    </>
  );
}
