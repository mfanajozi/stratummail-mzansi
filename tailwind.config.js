/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#F8F9FC',
        surface: '#FFFFFF',
        primary: '#1E293B',
        secondary: '#64748B',
        accent: '#3B82F6',
        unread: '#3B82F6',
        gold: '#FFB81C',
        green: '#007A4D',
        red: '#DE3831',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};