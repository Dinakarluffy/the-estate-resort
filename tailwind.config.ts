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
        estate: {
          50: '#f6f7f4',
          100: '#eaede6',
          200: '#d5dcce',
          300: '#b4c2ab',
          400: '#8da282',
          500: '#6c8560',
          600: '#546a4a',
          700: '#43543b',
          800: '#384432',
          900: '#2f392b',
          950: '#181f16',
        },
        coffee: {
          50: '#fbf8f5',
          100: '#f5efe8',
          200: '#ebded2',
          300: '#dcbeaf',
          400: '#c79d86',
          500: '#b58269',
          600: '#9e6a53',
          700: '#7e5241',
          800: '#674438',
          900: '#553931',
          950: '#2e1c18',
        },
      },
    },
  },
  plugins: [],
};
export default config;
