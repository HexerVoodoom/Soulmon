import svgPaths from "./svg-kznbi73v5i";
import imgImageDigiEgg from "figma:asset/50a3811e08593d7a5f52463335a0bdcb7a2e181f.png";
import imgImage from "figma:asset/7e77e9ec45ca6381843c93b205d4f8cdd7ddf568.png";
import imgContainer from "figma:asset/d8fd171f3beb1ac74ab1e4d20d1564ce766bb6a4.png";

function EnergyBar() {
  return <div className="bg-[#364153] h-[126.995px] shrink-0 w-[11.998px]" data-name="EnergyBar" />;
}

function Container() {
  return (
    <div className="absolute bg-[#1f2a39] content-stretch flex flex-col items-center left-[292.91px] px-0 py-[11.998px] rounded-[4px] top-[-0.05px] w-[26px]" data-name="Container">
      <EnergyBar />
    </div>
  );
}

function ImageDigiEgg() {
  return (
    <div className="h-[71.999px] relative shrink-0 w-full" data-name="Image (DigiEgg)">
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-contain pointer-events-none size-full" src={imgImageDigiEgg} />
    </div>
  );
}

function Container1() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[164.03px] pb-0 pt-[8px] px-0 size-[79.999px] top-[35.55px]" data-name="Container">
      <ImageDigiEgg />
    </div>
  );
}

function Container2() {
  return <div className="absolute h-[21.985px] left-[242.57px] top-[9.15px] w-[22.999px]" data-name="Container" />;
}

function Image() {
  return (
    <div className="absolute h-[21.985px] left-[13px] top-[9.15px] w-[22.999px]" data-name="Image">
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgImage} />
    </div>
  );
}

function Container3() {
  return (
    <div className="absolute h-[151px] left-[-0.09px] top-[-0.05px] w-[287px]" data-name="Container">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img alt="" className="absolute h-[181.83%] left-[0.03%] max-w-none top-[-40.88%] w-[100.62%]" src={imgContainer} />
      </div>
      <div className="overflow-clip relative rounded-[inherit] size-full">
        <Container1 />
        <Container2 />
        <Image />
      </div>
      <div aria-hidden="true" className="absolute border-[#596980] border-[1.1px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Container4() {
  return (
    <div className="h-[150.991px] relative shrink-0 w-full" data-name="Container">
      <Container />
      <Container3 />
    </div>
  );
}

function TextInput() {
  return (
    <div className="basis-0 bg-[#364153] grow h-[36.183px] min-h-px min-w-px relative rounded-[4px] shrink-0" data-name="Text Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center px-[12px] py-[8px] relative size-full">
          <p className="font-['Courier_New:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#99a1af] text-[12px] text-nowrap">Fale com DigiEgg...</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[#4a5565] border-[1.1px] border-solid inset-0 pointer-events-none rounded-[4px]" />
    </div>
  );
}

function Icon() {
  return (
    <div className="absolute left-0 size-[15.986px] top-0" data-name="Icon">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.986 15.986">
        <g clipPath="url(#clip0_165_655)" id="Icon">
          <path d="M7.99302 12.6556V14.6539" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33217" />
          <path d={svgPaths.p31a3080} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33217" />
          <path d={svgPaths.p269f9a80} id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33217" />
        </g>
        <defs>
          <clipPath id="clip0_165_655">
            <rect fill="white" height="15.986" width="15.986" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Container5() {
  return <div className="absolute border-[1.1px] border-solid border-white left-[-4px] opacity-60 rounded-[3.69137e+07px] size-[23.979px] top-[-4px]" data-name="Container" />;
}

function Container6() {
  return (
    <div className="absolute left-[17.09px] overflow-clip rounded-[13px] size-[15.986px] top-[10.09px]" data-name="Container">
      <Icon />
      <Container5 />
    </div>
  );
}

function Button() {
  return (
    <div className="h-[36.183px] relative rounded-[4px] shrink-0 w-[50.158px]" data-name="Button">
      <div aria-hidden="true" className="absolute border-[#4a5565] border-[1.1px] border-solid inset-0 pointer-events-none rounded-[4px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Container6 />
      </div>
    </div>
  );
}

function Container7() {
  return (
    <div className="h-[36.183px] relative shrink-0 w-full" data-name="Container">
      <div className="size-full">
        <div className="content-stretch flex gap-[7.993px] items-start relative size-full">
          <TextInput />
          <Button />
        </div>
      </div>
    </div>
  );
}

function ChatBox() {
  return (
    <div className="bg-[rgba(30,41,57,0.9)] h-[58.358px] relative rounded-[10px] shrink-0 w-full" data-name="ChatBox">
      <div aria-hidden="true" className="absolute border-[#364153] border-[1.1px] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="size-full">
        <div className="content-stretch flex flex-col items-start pb-[1.1px] pt-[11.087px] px-[13.098px] relative size-full">
          <Container7 />
        </div>
      </div>
    </div>
  );
}

export default function DigieggNoTaskCompleted() {
  return (
    <div className="bg-[#6a7282] relative size-full" data-name="digiegg-no-task-completed">
      <div aria-hidden="true" className="absolute border-[#1f2a39] border-[1.1px] border-solid inset-0 pointer-events-none shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)]" />
      <div className="size-full">
        <div className="content-stretch flex flex-col gap-[7.993px] items-start pb-[1.1px] pt-[13.098px] px-[13.098px] relative size-full">
          <Container4 />
          <ChatBox />
        </div>
      </div>
    </div>
  );
}