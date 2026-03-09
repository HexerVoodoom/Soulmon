import { useRef } from 'react';
import { Download, Upload, X } from 'lucide-react';

interface SaveLoadButtonProps {
  gameState: any;
  onLoad: (state: any) => void;
  isOpen: boolean;
  onClose: () => void;
  useAI: boolean;
  onToggleAI: (value: boolean) => void;
}

export function SaveLoadButton({ gameState, onLoad, isOpen, onClose, useAI, onToggleAI }: SaveLoadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const dataStr = JSON.stringify(gameState, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `digiapp-save-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    onClose();
  };

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loadedState = JSON.parse(e.target?.result as string);
        onLoad(loadedState);
        onClose();
        
        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        alert('Erro ao carregar arquivo. Verifique se é um save válido.');
        console.error('Error loading save:', error);
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Menu Popup - positioned below header */}
      <div className="fixed top-24 right-4 bg-gray-800 rounded-lg shadow-xl border-4 border-gray-700 p-4 z-50 min-w-[200px]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white" style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
            💾 Save/Load
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {/* AI Toggle */}
          <div className="bg-gray-700 rounded p-3 border-2 border-gray-600 mb-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span 
                  className="text-white text-xs"
                  style={{ fontFamily: 'monospace' }}
                >
                  {useAI ? '🤖 AI Chat' : '⌨️ Keywords'}
                </span>
              </div>
              <button
                onClick={() => onToggleAI(!useAI)}
                className={`w-12 h-6 rounded-full transition-colors flex items-center ${
                  useAI ? 'bg-neon-green' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    useAI ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded border-2 border-emerald-800 transition-colors"
            style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
          >
            <Download className="w-4 h-4" />
            Export Save
          </button>

          {/* Load Button */}
          <button
            onClick={handleLoadClick}
            className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded border-2 border-blue-800 transition-colors"
            style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
          >
            <Upload className="w-4 h-4" />
            Import Save
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
    </>
  );
}
