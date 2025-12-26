interface EnergyBarProps {
  totalSteps: number;
  completedSteps: number;
}

export function EnergyBar({ totalSteps, completedSteps }: EnergyBarProps) {
  return (
    <div className="flex flex-col gap-[2px]">
      {Array.from({ length: totalSteps }, (_, i) => {
        const segmentIndex = totalSteps - 1 - i; // Reverse order (bottom to top)
        const isFilled = segmentIndex < completedSteps;
        
        return (
          <div
            key={i}
            className={`w-3 h-2 transition-colors duration-300 ${
              isFilled ? 'bg-emerald-400' : 'bg-gray-600'
            }`}
            style={{ 
              minHeight: '8px',
              boxShadow: isFilled ? '0 0 4px rgba(52, 211, 153, 0.6)' : 'none'
            }}
          />
        );
      })}
    </div>
  );
}
