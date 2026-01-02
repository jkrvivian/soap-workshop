/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", "./*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        'soap-beige': '#F5F5F4', // 淺米色背景
        'soap-wood': '#78716C',  // 木質暖褐
        'soap-stone': '#44403C', // 深石墨灰（文字用）
        'soap-accent': '#A8A29E', // 輔助灰
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}