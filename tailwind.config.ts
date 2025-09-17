import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        foreground: '#000000',
        primary: '#B4CAC1',
        secondary: '#606060',
        muted: '#F3F4F6',
      },
      fontFamily: {
        sans: ['var(--font-sqindra)', ...defaultTheme.fontFamily.sans],
      },
      backgroundImage: {
        texture: "url('/textures/concrete.jpg')",
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};

export default config;
