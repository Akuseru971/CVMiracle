type Props = {
  variant?: "black" | "white";
  className?: string;
  height?: number;
};

/** Official WMF stacked wordmark — W above MF. */
export function WmfLogo({ variant = "black", className = "", height = 24 }: Props) {
  const fill = variant === "white" ? "#FFFFFF" : "#000000";
  const width = Math.round(height * 0.88);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 88 96"
      width={width}
      height={height}
      className={className}
      aria-label="WMF"
      role="img"
    >
      <path
        fill={fill}
        d="M0 4 L11 4 L19.5 44 L28 4 L39 4 L47.5 44 L56 4 L67 4 L52 68 L41 68 L33.5 32 L26 68 L15 68 Z"
      />
      <path
        fill={fill}
        d="M0 72 L0 92 L10 92 L10 82 L15.5 92 L25.5 92 L31 82 L31 92 L41 92 L41 72 L31 72 L20.5 88 L10 72 Z"
      />
      <path fill={fill} d="M47 72 L47 92 L84 92 L84 84 L57 84 L57 80 L81 80 L81 72 Z" />
    </svg>
  );
}
