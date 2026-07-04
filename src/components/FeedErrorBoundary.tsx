"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** Catches feed render crashes so the shell does not white-screen */
export class FeedErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Feed render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="pf-page app-shell-height flex flex-col items-center justify-center px-6 text-center">
          <p className="text-lg font-semibold text-pocket-text">Feed failed to load</p>
          <p className="mt-2 text-sm text-pocket-muted">
            Restart the dev server, then hard-refresh the page.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="mt-6 rounded-xl border border-[var(--pocket-border)] px-5 py-2.5 text-sm font-medium text-pocket-text active:bg-[var(--pocket-surface-hover)]"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
