import imgImage3 from "figma:asset/7e77e9ec45ca6381843c93b205d4f8cdd7ddf568.png";

export default function Group() {
  return (
    <div className="relative size-full">
      <div className="absolute h-[275px] left-0 top-0 w-[287px]" data-name="image 3">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none size-full" src={imgImage3} />
      </div>
      <div className="absolute h-[275px] left-[146px] top-0 w-[141px]" data-name="image 4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-full left-[-103.55%] max-w-none top-0 w-[203.55%]" src={imgImage3} />
        </div>
      </div>
    </div>
  );
}