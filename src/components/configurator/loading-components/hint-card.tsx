type HintCardProps = {
  icon: string;
  iconClass: string;
  label: string;
};

export function HintCard({ icon, iconClass, label }: HintCardProps) {
  return (
    <div className="flex flex-col items-center gap-5 border border-white/10 p-5.25">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={icon} alt="" className={iconClass} />
      <p className="text-center text-[12px] leading-[1.2] text-white">
        {label}
      </p>
    </div>
  );
}
