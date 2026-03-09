import svgPaths from "./svg-8khkxjowfk";
import imgPartnerArea from "figma:asset/7ad0373538d7e96df49e437c4c65f56e56ae6f30.png";
import imgUiTBg01 from "figma:asset/7342065b1193c2befe599eb2d86ef8641f1a596c.png";
import imgTriceramonDot from "figma:asset/91974d820051b34dd9e9db8f1b4f72ae1216ed98.png";

function Text() {
  return <div className="absolute h-[10.976px] left-[8.07px] opacity-60 top-[90.87px] w-[82.474px]" data-name="Text" />;
}

function PartnerArea() {
  return (
    <div className="absolute h-[114px] left-0 overflow-clip rounded-[4px] top-0 w-[243px]" data-name="partner-area">
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[4px]">
        <img alt="" className="absolute h-[213.03%] left-[0.03%] max-w-none top-[-72.68%] w-[99.94%]" src={imgPartnerArea} />
      </div>
      <div className="absolute left-0 size-[250px] top-[-97px]" data-name="ui_t_bg_01.">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgUiTBg01} />
      </div>
      <Text />
    </div>
  );
}

function EmptyBar() {
  return <div className="basis-0 bg-[#4a5565] grow min-h-px min-w-px shrink-0 w-[11.988px]" data-name="empty-bar" />;
}

function FilledBarCompletedtask() {
  return <div className="basis-0 bg-[#08e610] grow min-h-px min-w-px shadow-[0px_0px_4px_0px_rgba(8,230,16,0.6)] shrink-0 w-[11.988px]" data-name="filled-bar-completedtask" />;
}

function EnergyBarTotaltasks() {
  return (
    <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-[11.988px]" data-name="EnergyBar-totaltasks">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[3.996px] items-start justify-end pb-0 pt-[-0.017px] px-0 relative size-full">
        <EmptyBar />
        <FilledBarCompletedtask />
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="absolute bg-[#1f2a39] content-stretch flex flex-col h-[77px] items-center left-[250.92px] px-0 py-[11.988px] rounded-[4px] top-[-0.09px] w-[36px]" data-name="Container">
      <EnergyBarTotaltasks />
    </div>
  );
}

function Sprite() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[149px] size-[79.987px] top-[11px]" data-name="sprite">
      <div className="relative shrink-0 size-[75.415px]" data-name="Triceramon_dot">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgTriceramonDot} />
      </div>
    </div>
  );
}

function PixelarticonsHome() {
  return (
    <div className="absolute inset-[-4.55%_-7.67%_-4.55%_-1.42%]" data-name="pixelarticons:home">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="pixelarticons:home">
          <path d={svgPaths.p35334580} fill="var(--fill-0, white)" fillOpacity="0.9" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function IcomoonFreeEnter() {
  return (
    <div className="relative shrink-0 size-[22px]" data-name="icomoon-free:enter">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <PixelarticonsHome />
      </div>
    </div>
  );
}

function EnterApp() {
  return (
    <div className="absolute bg-[#1f2a39] content-stretch flex flex-col h-[33px] items-center justify-center left-[251px] px-0 py-[11.988px] rounded-[4px] top-[81px] w-[36px]" data-name="enter-app">
      <IcomoonFreeEnter />
    </div>
  );
}

function Container1() {
  return (
    <div className="h-[114px] relative shrink-0 w-full" data-name="Container">
      <PartnerArea />
      <Container />
      <Sprite />
      <EnterApp />
    </div>
  );
}

export default function CompanionHudWidget() {
  return (
    <div className="bg-[#6a7282] relative rounded-[14px] size-full" data-name="CompanionHUD-widget">
      <div aria-hidden="true" className="absolute border-[#1f2a39] border-[1.098px] border-solid inset-0 pointer-events-none rounded-[14px] shadow-[2px_6px_12.5px_-3px_rgba(0,0,0,0.2),0px_4px_6px_-4px_rgba(0,0,0,0.1)]" />
      <div className="size-full">
        <div className="content-stretch flex flex-col items-start pb-[1.098px] pt-[13.085px] px-[13.085px] relative size-full">
          <Container1 />
        </div>
      </div>
    </div>
  );
}