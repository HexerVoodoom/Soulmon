interface EnergyBarProps {
  totalSteps: number;
  completedSteps: number;
}

export function EnergyBar({ totalSteps, completedSteps }: EnergyBarProps) {
  const segments = [];
  
  // Create segments from bottom to top
  for (let i = 0; i < totalSteps; i++) {
    const isFilled = i < completedSteps;
    
    segments.push(
      <div key={i} className="relative w-[11.998px] flex-1 min-h-[4px]">
        {isFilled ? (
          <>
            {/* Blur/glow effect layer */}
            <div 
              className="absolute inset-0 bg-[#08e610] blur-[2px]"
              style={{ filter: 'blur(2px)' }}
            />
            {/* Solid layer on top */}
            <div className="absolute inset-0 bg-[#08e610]" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[#364153]" />
        )}
      </div>
    );
  }
  
  return (
    <div className="flex flex-col-reverse gap-[6px] h-full w-full items-center">
      {segments}
    </div>
  );
}
