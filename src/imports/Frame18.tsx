import imgUiTBg01 from "figma:asset/7342065b1193c2befe599eb2d86ef8641f1a596c.png";

export default function Frame() {
  return (
    <div className="bg-white relative size-full">
      <div className="absolute flex items-center justify-center left-[-65px] size-[1985px] top-[-583px]" style={{ "--transform-inner-width": "0", "--transform-inner-height": "0" } as React.CSSProperties}>
        <div className="flex-none rotate-[270deg]">
          <div className="relative size-[1985px]" data-name="ui_t_bg_01.">
            <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgUiTBg01} />
          </div>
        </div>
      </div>
    </div>
  );
}