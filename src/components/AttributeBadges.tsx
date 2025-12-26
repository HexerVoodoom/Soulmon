interface AttributeBadgesProps {
  virusPoints: number;
  dataPoints: number;
  vaccinePoints: number;
  onNewActivity: () => void;
}

export function AttributeBadges({ virusPoints, dataPoints, vaccinePoints, onNewActivity }: AttributeBadgesProps) {
  return (
    <div className="flex gap-3 items-center w-full px-4 py-3">
      {/* Badges Container */}
      <div className="flex-1 border border-[#e5e6e7] rounded-2xl shadow-[0px_0px_0px_1px_rgba(229,231,235,0.5),0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] px-5 py-1.5">
        <div className="flex items-center justify-between gap-4">
          {/* Virus Badge */}
          <div className="flex items-center gap-1">
            <span className="text-[#686868] text-xs" style={{ fontFamily: 'Consolas, monospace' }}>
              Virus
            </span>
            <span className="text-[#22A900] text-xs font-bold" style={{ fontFamily: 'Consolas, monospace' }}>
              {virusPoints}
            </span>
          </div>

          {/* Data Badge */}
          <div className="flex items-center gap-1">
            <span className="text-[#686868] text-xs" style={{ fontFamily: 'Consolas, monospace' }}>
              Data
            </span>
            <span className="text-[#009ED8] text-xs font-bold" style={{ fontFamily: 'Consolas, monospace' }}>
              {dataPoints}
            </span>
          </div>

          {/* Vaccine Badge */}
          <div className="flex items-center gap-1">
            <span className="text-[#686868] text-xs" style={{ fontFamily: 'Consolas, monospace' }}>
              Vaccine
            </span>
            <span className="text-[#E69600] text-xs font-bold" style={{ fontFamily: 'Consolas, monospace' }}>
              {vaccinePoints}
            </span>
          </div>
        </div>
      </div>

      {/* Nova Atividade Button */}
      <button
        onClick={onNewActivity}
        className="h-[30px] px-4 rounded-2xl border border-[#6a7282] shadow-[0px_0.662px_1.987px_0px_rgba(0,0,0,0.1),0px_0.662px_1.325px_-0.662px_rgba(0,0,0,0.1)] flex items-center justify-center transition-all hover:brightness-110 active:scale-95"
        style={{
          backgroundImage: 'linear-gradient(80.7988deg, rgb(62, 71, 83) 0.31929%, rgb(104, 121, 145) 99.681%)',
        }}
      >
        <span className="text-white text-sm whitespace-nowrap" style={{ fontFamily: 'Consolas, monospace' }}>
          + Nova Atividade
        </span>
      </button>
    </div>
  );
}