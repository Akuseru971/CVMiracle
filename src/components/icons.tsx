type IconProps = {
  className?: string;
  strokeWidth?: number;
};

const base = (className?: string) => className ?? "h-5 w-5";

export function SearchIcon({ className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg className={base(className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function AccountIcon({ className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg className={base(className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth={strokeWidth} />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function CartIcon({ className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg className={base(className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 7h13l-1.2 8.4a2 2 0 0 1-2 1.7H9.2a2 2 0 0 1-2-1.7L6 4H3.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="20" r="1.1" fill="currentColor" />
      <circle cx="16" cy="20" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function MenuIcon({ className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg className={base(className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function CloseIcon({ className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg className={base(className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}

export function ChevronLeft({ className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg className={base(className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRight({ className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg className={base(className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HomeIcon({ className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg className={base(className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 11l8-6 8 6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10v9h12v-9" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GridIcon({ className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg className={base(className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1" stroke="currentColor" strokeWidth={strokeWidth} />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1" stroke="currentColor" strokeWidth={strokeWidth} />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1" stroke="currentColor" strokeWidth={strokeWidth} />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  );
}

export function HeartIcon({ className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg className={base(className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20s-7-4.3-7-9.3A3.7 3.7 0 0 1 12 7.7 3.7 3.7 0 0 1 19 10.7c0 5-7 9.3-7 9.3Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowRight({ className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg className={base(className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PlusIcon({ className, strokeWidth = 1.6 }: IconProps) {
  return (
    <svg className={base(className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  );
}
