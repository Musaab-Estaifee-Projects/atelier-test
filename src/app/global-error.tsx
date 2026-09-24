"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[app] root error", error.digest ?? error.message);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          background: "#00272d",
          color: "#f2e9d8",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <title>ATELIER · Something went wrong</title>
        <h1 style={{ fontWeight: 400, fontSize: 28, margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, margin: 0 }}>
          Please try again. Your saved selections are not lost.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          style={{
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 999,
            background: "transparent",
            color: "#fff",
            padding: "12px 32px",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
