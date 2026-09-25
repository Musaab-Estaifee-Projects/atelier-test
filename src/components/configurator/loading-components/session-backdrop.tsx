import Image from "next/image";

type SessionBackdropProps = {
  src: string;
};

export function SessionBackdrop({ src }: SessionBackdropProps) {
  return (
    <div className="pointer-events-none absolute inset-0 opacity-70">
      {/* <img
        src={src}
        alt=""
        className="h-full w-full object-cover object-left"
      /> */}
      <Image
        src={src}
        alt=""
        fill
        className="object-cover object-left"
        priority
        unoptimized
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-[linear-gradient(270deg,#00272D_28.5%,rgba(0,39,45,0)_64.92%)]" />
      {/* <div className="absolute inset-0 bg-gradient-to-l from-[#00272d] from-[28%] to-transparent to-[65%]" /> */}
    </div>
  );
}
