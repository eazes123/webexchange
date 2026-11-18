"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0b0e1a", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center", padding: "0 1rem" }}>
          <p style={{ color: "#f6465d", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem" }}>
            Critical Error
          </p>
          <h1 style={{ color: "#ffffff", fontSize: "5rem", fontWeight: 900, margin: "0 0 1rem" }}>500</h1>
          <p style={{ color: "#ffffff", fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Application Error
          </p>
          <p style={{ color: "#9ca3af", fontSize: "0.875rem", marginBottom: "2rem" }}>
            A critical error occurred. Please refresh the page.
          </p>
          <button
            onClick={reset}
            style={{ padding: "0.625rem 1.25rem", background: "#f0b90b", color: "#000", fontSize: "0.875rem", fontWeight: 700, borderRadius: "0.5rem", border: "none", cursor: "pointer" }}
          >
            Refresh Page
          </button>
        </div>
      </body>
    </html>
  );
}
