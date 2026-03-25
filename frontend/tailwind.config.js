/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        glass: '0 12px 28px rgba(32, 54, 94, 0.12)',
      },
    },
  },
  plugins: [],
};
