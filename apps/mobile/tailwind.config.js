/**
 * Mobile Tailwind — NativeWind v4.
 * Root `tailwind.config.js` is ESM + CSS variables (web-only); RN uses solid tokens here.
 * Keep semantic names aligned with the web app when you add shared theme JSON.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        vault: {
          navy: '#1a1f3c',
          canvas: '#f0f2f8',
        },
        brand: {
          600: '#2364c7',
          500: '#3b9cff',
        },
      },
      fontFamily: {
        sans: ['System'],
      },
      spacing: {
        'safe-bottom': '34px',
        'tab-bar': '83px',
      },
    },
  },
  plugins: [],
};
