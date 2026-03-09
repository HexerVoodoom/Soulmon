import imgImageDigiEgg from "figma:asset/50a3811e08593d7a5f52463335a0bdcb7a2e181f.png";
import imgContainer from "figma:asset/7ad0373538d7e96df49e437c4c65f56e56ae6f30.png";

function Container() {
  return <div className="absolute left-[686.14px] size-[274.717px] top-[195.73px]" data-name="Container" />;
}

function ImageDigiEgg() {
  return (
    <div className="absolute left-[-13.68px] size-[408.708px] top-[34.4px]" data-name="Image (DigiEgg)">
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-contain pointer-events-none size-full" src={imgImageDigiEgg} />
    </div>
  );
}

function Paragraph() {
  return <div className="absolute h-[61.847px] left-[450.95px] shadow-[0px_3.435px_13.738px_0px_rgba(0,0,0,0.15)] top-[391.52px] w-[158.622px]" data-name="Paragraph" />;
}

function Container1() {
  return (
    <div className="absolute h-[480.813px] left-[54.9px] top-[54.9px] w-[1060.58px]" data-name="Container">
      <Container />
      <ImageDigiEgg />
      <Paragraph />
    </div>
  );
}

function Text() {
  return <div className="absolute h-[37.697px] left-[27.45px] opacity-60 top-[510.91px] w-[283.257px]" data-name="Text" />;
}

function Container2() {
  return (
    <div className="absolute h-[590.738px] left-[-0.14px] overflow-clip rounded-[13.738px] top-[-0.29px] w-[487.702px]" data-name="Container">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[13.738px]">
        <img alt="" className="absolute max-w-none object-50%-50% object-cover rounded-[13.738px] size-full" src={imgContainer} />
        <div className="absolute bg-gradient-to-b from-[#cdded4] inset-0 rounded-[13.738px] to-[#cfcfcf]" />
      </div>
      <Container1 />
      <Text />
    </div>
  );
}

function Container3() {
  return (
    <div className="h-[590.738px] relative shrink-0 w-[487.702px]" data-name="Container">
      <Container2 />
    </div>
  );
}

export default function CompanionHud() {
  return (
    <div className="bg-[#6a7282] relative rounded-[48.083px] size-full" data-name="CompanionHUD">
      <div aria-hidden="true" className="absolute border-[#1f2a39] border-[3.77px] border-solid inset-0 pointer-events-none rounded-[48.083px] shadow-[0px_34.345px_51.518px_-10.304px_rgba(0,0,0,0.1),0px_13.738px_20.607px_-13.738px_rgba(0,0,0,0.1)]" />
      <div className="size-full">
        <div className="content-stretch flex flex-col items-start pb-[3.77px] pt-[44.942px] px-[44.942px] relative size-full">
          <Container3 />
        </div>
      </div>
    </div>
  );
}