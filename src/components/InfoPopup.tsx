interface InfoPopupProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

export function InfoPopup({ isOpen, onClose, message }: InfoPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      
      {/* Popup */}
      <div className="relative w-full max-w-[320px]">
        <div className="bg-[#0d1420] relative rounded-xl w-full">
          <div className="px-6 py-8 min-h-[200px] flex items-center justify-center">
            <p 
              className="text-[#d0d0d0] text-center"
              style={{
                fontFamily: 'Consolas, monospace',
                fontSize: '0.875rem',
                lineHeight: '1.6',
                letterSpacing: '0.01em',
              }}
            >
              {message}
            </p>
          </div>
          <div 
            aria-hidden="true" 
            className="absolute border-[#00ff99] border-2 border-solid inset-0 pointer-events-none rounded-xl" 
          />
        </div>

        {/* Continue Button */}
        <div className="w-full flex justify-center mt-4">
          <button
            onClick={onClose}
            className="bg-[#00ff99] rounded-xl px-10 py-3 transition-all hover:brightness-110 active:scale-95"
            style={{
              fontFamily: 'Consolas, monospace',
              fontSize: '0.875rem',
              fontWeight: '700',
              color: '#000',
              letterSpacing: '0.05em',
            }}
          >
            entendi
          </button>
        </div>
      </div>
    </div>
  );
}
