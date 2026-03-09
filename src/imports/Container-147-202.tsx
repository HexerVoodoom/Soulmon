function Text() {
  return (
    <div className="h-[15px] relative shrink-0 w-[65.984px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Consolas:Bold',sans-serif] leading-[15px] left-0 not-italic text-[10px] text-nowrap text-white top-[-1px]">DIGIVOLUTION</p>
      </div>
    </div>
  );
}

function Text1() {
  return (
    <div className="h-[15px] relative shrink-0 w-[44px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Consolas:Regular',sans-serif] leading-[15px] left-0 not-italic text-[10px] text-white top-[-1px] w-[44px]">0/1 DAYS</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex h-[15px] items-center justify-between relative shrink-0 w-full" data-name="Container">
      <Text />
      <Text1 />
    </div>
  );
}

function Container1() {
  return <div className="bg-[#4a5565] h-[12px] shrink-0 w-full" data-name="Container" />;
}

export default function Container2() {
  return (
    <div className="bg-[#1f2a39] relative size-full" data-name="Container">
      <div className="size-full">
        <div className="content-stretch flex flex-col gap-[4px] items-start pb-0 pt-[12px] px-[12px] relative size-full">
          <Container />
          <Container1 />
        </div>
      </div>
    </div>
  );
}