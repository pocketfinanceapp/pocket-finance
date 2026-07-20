import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 100% of traces in dev, a small slice in production — this is
  // just for basic performance visibility, not a full APM setup.
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
});

// Instruments client-side route transitions (App Router navigations).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
