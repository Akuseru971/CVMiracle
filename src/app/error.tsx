"use client";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ reset }: ErrorProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-[14px] text-ink">問題が発生しました。</p>
      <button
        type="button"
        onClick={() => reset()}
        className="press bg-cta-gold px-5 py-3 text-[13px] text-ink"
      >
        再試行
      </button>
    </div>
  );
}
