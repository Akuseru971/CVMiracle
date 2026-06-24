import Image from "next/image";

type Props = {
  variant?: "black" | "white";
  className?: string;
  height?: number;
};

export function WmfLogo({ variant = "black", className = "", height = 22 }: Props) {
  const src = variant === "white" ? "/brand/wmf-logo-white.svg" : "/brand/wmf-logo-black.svg";
  const width = Math.round(height * 3);

  return (
    <Image
      src={src}
      alt="WMF"
      width={width}
      height={height}
      className={`h-auto w-auto ${className}`}
      style={{ height, width: "auto", maxWidth: width }}
      priority={variant === "black"}
    />
  );
}
