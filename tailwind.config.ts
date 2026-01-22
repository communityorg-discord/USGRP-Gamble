import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                casino: {
                    bg: '#0f0f1a',
                    card: '#1a1a2e',
                    'card-light': '#252542',
                    accent: '#e94560',
                    gold: '#ffd700',
                    green: '#00ff88',
                    purple: '#9d4edd',
                    silver: '#c0c0c0',
                },
            },
            fontFamily: {
                display: ['Outfit', 'sans-serif'],
                body: ['Inter', 'sans-serif'],
            },
            animation: {
                'spin-slow': 'spin 3s linear infinite',
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                'float': 'float 3s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
                'reel-spin': 'reel-spin 0.1s linear infinite',
            },
            keyframes: {
                'pulse-glow': {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(233, 69, 96, 0.5)' },
                    '50%': { boxShadow: '0 0 40px rgba(233, 69, 96, 0.8)' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                'shimmer': {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                'reel-spin': {
                    '0%': { transform: 'translateY(0)' },
                    '100%': { transform: 'translateY(-100%)' },
                },
            },
            boxShadow: {
                'neon-gold': '0 0 20px rgba(255, 215, 0, 0.5)',
                'neon-green': '0 0 20px rgba(0, 255, 136, 0.5)',
                'neon-pink': '0 0 20px rgba(233, 69, 96, 0.5)',
                'neon-purple': '0 0 20px rgba(157, 78, 221, 0.5)',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-casino': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f1a 100%)',
            },
        },
    },
    plugins: [],
};

export default config;
