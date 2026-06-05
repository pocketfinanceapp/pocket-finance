import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pocket: {
          bg: "#0a0a0a",
          surface: "#141414",
          border: "#262626",
          teal: "#00C6C6",
          blue: "#3B6EF5",
          green: "#22c55e",
          red: "#ef4444",
        },
      },
      backgroundImage: {
        "pocket-gradient":
          "linear-gradient(135deg, #3B6EF5 0%, #00C6C6 100%)",
        "pocket-text-gradient":
          "linear-gradient(90deg, #3B6EF5 0%, #00C6C6 100%)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        mobile: "430px",
      },
    },
  },
  plugins: [],
};

export default config;
