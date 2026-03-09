import imgUiTBg01 from "figma:asset/7342065b1193c2befe599eb2d86ef8641f1a596c.png";
import imgImage69 from "figma:asset/7b96e3369daf15ffc8ed062b986db273c0416930.png";

function TextInput() {
  return (
    <div className="bg-[#101828] h-[159px] relative rounded-[22.988px] w-[645.935px]" data-name="Text Input">
      <div className="content-stretch flex items-center overflow-clip px-[55.172px] py-[45.977px] relative rounded-[inherit] size-full">
        <p className="font-['Consolas:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#6a7282] text-[41.379px] text-center text-nowrap tracking-[0.8276px]">insira seu nome</p>
      </div>
      <div aria-hidden="true" className="absolute border-[#0f9] border-[2.523px] border-solid inset-0 pointer-events-none rounded-[22.988px]" />
    </div>
  );
}

function Button() {
  return (
    <div className="bg-gradient-to-r from-[#00d5be] h-[142px] relative rounded-[29.603px] to-[#00ff99] w-[444.937px]" data-name="Button">
      <p className="absolute font-['Consolas:Bold',sans-serif] leading-[71.047px] left-[221.68px] not-italic text-[#101828] text-[47.365px] text-center text-nowrap top-[33.1px] tracking-[2.3682px] translate-x-[-50%]">continuar</p>
    </div>
  );
}

export default function InsiraSeuNome() {
  return (
    <div className="bg-[#12b429] relative size-full" data-name="insira seu nome">
      <div className="absolute flex items-center justify-center left-[-65px] size-[1985px] top-[-583px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "0" } as React.CSSProperties}>
        <div className="flex-none rotate-[270deg]">
          <div className="relative size-[1985px]" data-name="ui_t_bg_01.">
            <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgUiTBg01} />
          </div>
        </div>
      </div>
      <div className="absolute flex h-[645.935px] items-center justify-center left-[362px] top-[209.07px] w-[159px]" style={{ "--transform-inner-width": "304", "--transform-inner-height": "47" } as React.CSSProperties}>
        <div className="flex-none rotate-[270deg]">
          <TextInput />
        </div>
      </div>
      <div className="absolute flex h-[444.937px] items-center justify-center left-[571px] top-[320.06px] w-[142px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "0" } as React.CSSProperties}>
        <div className="flex-none rotate-[270deg]">
          <Button />
        </div>
      </div>
      <div className="absolute flex h-[464px] items-center justify-center left-[1134px] top-[320px] w-[446px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "0" } as React.CSSProperties}>
        <div className="flex-none rotate-[270deg]">
          <div className="h-[446px] relative w-[464px]" data-name="image 69">
            <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgImage69} />
          </div>
        </div>
      </div>
    </div>
  );
}