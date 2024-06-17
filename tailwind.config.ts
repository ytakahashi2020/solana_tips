import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        'top-bg': "url('/images/top-bg.png')",
      },

      colors: {
        baseblack: '#001435',
        namiblue: '#006DDC',
        baseblue: '#002D84',
        kumogray: '#F3F3F6',

      },

    },
  },
  plugins: [],
};
export default config;
