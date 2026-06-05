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
        <div
          className="flex h-[100dvh] flex-col items-center justify-center bg-[#0a0a0a] px-6 text-center text-white"
          style={{ backgroundColor: "#0a0a0a" }}
        >
          <p className="text-lg font-semibold">Feed failed to load</p>
          <p className="mt-2 text-sm text-zinc-400">
            Restart the dev server, then hard-refresh the page.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="mt-6 rounded-xl border border-white/20 px-5 py-2.5 text-sm font-medium"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
