/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0F1B22',
        panel: '#16262E',
        panelBorder: '#233640',
        paper: '#F3EFE6',
        paperBorder: '#DCD5C4',
        risklow: '#3FA796',
        riskmoderate: '#F2A93B',
        riskhigh: '#E5484D',
        protective: '#4A6572',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
