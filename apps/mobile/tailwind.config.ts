import type { Config } from 'tailwindcss';
import nativewind from 'nativewind/preset';
export default {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [nativewind],
  theme: {
    extend: {
      colors: {
        background: '#fffafc',
        surface: '#ffffff',
        foreground: '#261923',
        muted: '#756772',
        line: '#ebdfe5',
        primary: '#bd2859',
        secondary: '#f9e9ef',
      },
    },
  },
  plugins: [],
} satisfies Config;
