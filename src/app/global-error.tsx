"use client";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <html lang="ja">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "1.5rem",
            fontFamily: '"Noto Sans JP", sans-serif',
            background: "#ffffff",
            color: "#000000",
          }}
        >
          <p style={{ margin: 0, fontSize: "14px" }}>問題が発生しました。</p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              border: "none",
              background: "#f3e4a8",
              color: "#000000",
              padding: "0.75rem 1.25rem",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            再試行
          </button>
        </div>
      </body>
    </html>
  );
}
