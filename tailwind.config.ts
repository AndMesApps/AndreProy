import type { Config } from 'tailwindcss';

// Sistema de diseño de AndMesApps: turquesa (marca) + índigo profundo
// (secundario) + ámbar (acento para logros y gamificación). Los neutros
// cálidos ("marmol") y los semáforos (alto/medio/bajo) son funcionales.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        marmol: {
          50: '#faf9f7',
          100: '#f2f0ec',
          200: '#e4e0d8',
          300: '#cfc8ba',
          400: '#aca194',
          500: '#8a7f70',
          600: '#6b6153',
          700: '#524a40',
          800: '#3a352e',
          900: '#25211c',
        },
        marca: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#0d9488',
          600: '#0f766e',
          700: '#115e59',
          800: '#134e4a',
          900: '#042f2e',
        },
        saber: '#0ea5a4',
        deber: '#2563eb',
        alto: '#15803d',
        medio: '#b45309',
        bajo: '#b91c1c',
        secundario: '#312E81', // índigo profundo — encabezados, textos importantes
        acento: '#FBBF24', // ámbar — logros, insignias, gamificación
      },
      backgroundImage: {
        degradado: 'linear-gradient(90deg, #0D9488, #312E81)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.6)' },
          '60%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
        entrar: {
          '0%': { opacity: '0', transform: 'translateY(12px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        pop: 'pop 0.45s ease-out',
        entrar: 'entrar 0.3s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
