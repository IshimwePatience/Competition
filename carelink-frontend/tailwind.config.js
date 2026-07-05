/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FF6B2C',
          orangeDark: '#E85A1F',
          peach: '#FFD8C4',
          peachHover: '#F5C4A8',
          cream: '#FFF8F3',
          sidebar: '#F5F5F5',
          page: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 16px rgba(0,0,0,0.06)',
        soft: '0 4px 24px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
