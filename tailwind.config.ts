import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
        "./pages/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}",
        "./app/**/*.{ts,tsx}",
        "./src/**/*.{ts,tsx,astro,html,js,jsx,md,mdx,svelte,vue}",
    ],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: '2rem',
            screens: {
                '2xl': '1400px'
            }
        },
        extend: {
            colors: {
                border: 'hsl(var(--border))',
                'border-subtle': 'hsl(var(--border-subtle))',
                'border-accent': 'hsl(var(--border-accent))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                
                background: 'hsl(var(--background))',
                'background-subtle': 'hsl(var(--background-subtle))',
                surface: 'hsl(var(--surface))',
                'surface-elevated': 'hsl(var(--surface-elevated))',
                
                foreground: 'hsl(var(--foreground))',
                'foreground-secondary': 'hsl(var(--foreground-secondary))',
                
                // KU Brand Colors
                ku: {
                    primary: 'hsl(var(--ku-primary))',
                    accent: 'hsl(var(--ku-accent))',
                    secondary: 'hsl(var(--ku-secondary))'
                },
                
                // Core semantic colors
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                
                // Status colors
                status: {
                    open: 'hsl(var(--status-open))',
                    holiday: 'hsl(var(--status-holiday))',
                    break: 'hsl(var(--status-break))',
                    exams: 'hsl(var(--status-exams))',
                    cancelled: 'hsl(var(--status-cancelled))'
                },
                
                // Timeline
                timeline: {
                    line: 'hsl(var(--timeline-line))',
                    dot: 'hsl(var(--timeline-dot))'
                }
            },
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
                academic: ['Source Sans Pro', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace']
            },
            fontSize: {
                'xs': ['0.75rem', { lineHeight: '1.5' }],
                'sm': ['0.875rem', { lineHeight: '1.6' }],
                'base': ['1rem', { lineHeight: '1.6' }],
                'lg': ['1.125rem', { lineHeight: '1.6' }],
                'xl': ['1.25rem', { lineHeight: '1.5' }],
                '2xl': ['1.5rem', { lineHeight: '1.4' }],
                '3xl': ['1.875rem', { lineHeight: '1.3' }],
                '4xl': ['2.25rem', { lineHeight: '1.25' }],
            },
            spacing: {
                '18': '4.5rem',
                '88': '22rem'
            },
            boxShadow: {
                'subtle': 'var(--shadow-subtle)',
                'medium': 'var(--shadow-medium)',
                'large': 'var(--shadow-large)',
            },
            animation: {
                'fade-in': 'fadeIn 0.4s ease-out',
                'fade-in-up': 'fadeInUp 0.5s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
                'scale-in': 'scaleIn 0.2s ease-out',
                'bounce-subtle': 'bounceSubtle 0.6s ease-out',
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out'
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(-8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' }
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(24px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' }
                },
                slideDown: {
                    '0%': { height: '0', opacity: '0' },
                    '100%': { height: 'var(--radix-accordion-content-height)', opacity: '1' }
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' }
                },
                bounceSubtle: {
                    '0%, 20%, 53%, 80%, 100%': { transform: 'translate3d(0,0,0)' },
                    '40%, 43%': { transform: 'translate3d(0,-8px,0)' },
                    '70%': { transform: 'translate3d(0,-4px,0)' },
                    '90%': { transform: 'translate3d(0,-2px,0)' }
                },
                'accordion-down': {
                    from: { height: '0' },
                    to: { height: 'var(--radix-accordion-content-height)' }
                },
                'accordion-up': {
                    from: { height: 'var(--radix-accordion-content-height)' },
                    to: { height: '0' }
                }
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            }
        }
    },
    plugins: [require("@tailwindcss/typography"), require("tailwindcss-animate")],
} satisfies Config;