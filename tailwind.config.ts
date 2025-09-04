import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
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
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				// New consistent color variables
				surface: {
					primary: 'hsl(var(--surface-primary))',
					secondary: 'hsl(var(--surface-secondary))',
					elevated: 'hsl(var(--surface-elevated))',
				},
				text: {
					primary: 'hsl(var(--text-primary))',
					secondary: 'hsl(var(--text-secondary))',
					tertiary: 'hsl(var(--text-tertiary))',
					muted: 'hsl(var(--text-muted))',
				},
				borderColors: {
					subtle: 'hsl(var(--border-subtle))',
					medium: 'hsl(var(--border-medium))',
					strong: 'hsl(var(--border-strong))',
				},
				accentColors: {
					blue: 'hsl(var(--accent-blue))',
					green: 'hsl(var(--accent-green))',
					orange: 'hsl(var(--accent-orange))',
					purple: 'hsl(var(--accent-purple))',
					pink: 'hsl(var(--accent-pink))',
				}
			},
			boxShadow: {
				glow: 'var(--shadow-glow)',
				warm: 'var(--shadow-warm)',
				elegant: 'var(--shadow-elegant)',
				'magic-glow': 'var(--magic-glow)',
				'magic-shadow': 'var(--magic-shadow)',
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-warm': 'var(--gradient-warm)',
				'gradient-subtle': 'var(--gradient-subtle)',
				'gradient-dark': 'var(--gradient-dark)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				// New animation keyframes
				'fadeIn': {
					from: { opacity: '0' },
					to: { opacity: '1' }
				},
				'slideUp': {
					from: { 
						opacity: '0',
						transform: 'translateY(20px)'
					},
					to: { 
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'scaleIn': {
					from: { 
						opacity: '0',
						transform: 'scale(0.9)'
					},
					to: { 
						opacity: '1',
						transform: 'scale(1)'
					}
				},
				'float': {
					'0%, 100%': { 
						transform: 'translateY(0px) rotate(0deg) scale(1)',
						opacity: '0.6'
					},
					'50%': { 
						transform: 'translateY(-15px) rotate(180deg) scale(1.05)',
						opacity: '0.8'
					}
				},
				'liquidMorph': {
					'0%, 100%': { 
						borderRadius: '50%',
						transform: 'rotate(0deg)'
					},
					'25%': { 
						borderRadius: '0%',
						transform: 'rotate(90deg)'
					},
					'50%': { 
						borderRadius: '50% 0% 0% 50%',
						transform: 'rotate(180deg)'
					},
					'75%': { 
						borderRadius: '0% 0% 50% 50%',
						transform: 'rotate(270deg)'
					}
				},
				'staggerFadeIn': {
					to: {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'beatPulse': {
					'0%, 100%': { transform: 'scale(1)' },
					'50%': { transform: 'scale(1.05)' }
				},
				'frequencyWave': {
					'0%': { transform: 'scaleY(0.4)' },
					'50%': { transform: 'scaleY(1)' },
					'100%': { transform: 'scaleY(0.6)' }
				},
				'gradientShift': {
					'0%': { backgroundPosition: '0% 50%' },
					'50%': { backgroundPosition: '100% 50%' },
					'100%': { backgroundPosition: '0% 50%' }
				},
				'particleFloat': {
					'0%': {
						transform: 'translateY(100vh) rotate(0deg)',
						opacity: '0'
					},
					'10%': {
						opacity: '0.4'
					},
					'90%': {
						opacity: '0.4'
					},
					'100%': {
						transform: 'translateY(-100px) rotate(360deg)',
						opacity: '0'
					}
				},
				'shimmer': {
					'0%': { left: '-100%' },
					'100%': { left: '100%' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				// New animations
				'fadeIn': 'fadeIn 0.5s ease-out',
				'slideUp': 'slideUp 0.5s ease-out',
				'scaleIn': 'scaleIn 0.3s ease-out',
				'float': 'float 8s ease-in-out infinite',
				'liquidMorph': 'liquidMorph 3s ease-in-out infinite',
				'staggerFadeIn': 'staggerFadeIn var(--animation-normal) ease forwards',
				'beatPulse': 'beatPulse 0.8s ease-in-out',
				'frequencyWave': 'frequencyWave 0.15s ease-in-out',
				'gradientShift': 'gradientShift 20s ease infinite',
				'particleFloat': 'particleFloat 25s linear infinite',
				'shimmer': 'shimmer 3s infinite'
			},
			// New spacing and sizing utilities
			spacing: {
				'18': '4.5rem',
				'88': '22rem',
				'128': '32rem',
			},
			// New transition utilities
			transitionDuration: {
				'400': '400ms',
				'600': '600ms',
				'800': '800ms',
			},
			// New backdrop blur utilities
			backdropBlur: {
				xs: '2px',
			},
			// New z-index utilities
			zIndex: {
				'60': '60',
				'70': '70',
				'80': '80',
				'90': '90',
				'100': '100',
			}
		},
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
