"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Catches errors that escape the root layout itself (rare — most errors are
 * caught by the closer, friendlier src/app/error.tsx boundary instead). This
 * has to render its own <html>/<body> since it replaces the root layout.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body
        style={{
          backgroundColor: "#0a0a0a",
          color: "#fff",
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 1.5rem",
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <p style={{ fontSize: "1.125rem", fontWeight: 600 }}>
          Something went wrong
        </p>
        <p style={{ marginTop: "0.5rem", maxWidth: "24rem", fontSize: "0.875rem", color: "#a1a1aa" }}>
          Please reload the page. If this keeps happening, let us know.
        </p>
      </body>
    </html>
  );
}
