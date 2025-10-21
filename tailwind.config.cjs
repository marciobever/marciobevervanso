/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // usa a variável CSS do next/font como default sans
        sans: [
          'var(--font-sans)',
          'system-ui',
          'ui-sans-serif',
          'Segoe UI',
          'Roboto',
          'Arial',
          'Noto Sans',
          'sans-serif',
          ...defaultTheme.fontFamily.sans,
        ],
      },
      letterSpacing: {
        tightish: '-0.01em',
        tighter2: '-0.02em',
      },
      lineHeight: {
        snugish: '1.15',
      },

      // ---- Tipografia específica p/ artigos ----
      typography: ({ theme }) => ({
        article: {
          css: {
            '--tw-prose-body': theme('colors.slate.800'),
            '--tw-prose-headings': theme('colors.slate.900'),
            '--tw-prose-links': theme('colors.sky.700'),
            '--tw-prose-bold': theme('colors.slate.900'),
            '--tw-prose-counters': theme('colors.slate.600'),
            '--tw-prose-bullets': theme('colors.slate.400'),
            '--tw-prose-hr': theme('colors.slate.200'),
            '--tw-prose-quotes': theme('colors.slate.900'),
            '--tw-prose-quote-borders': theme('colors.slate.200'),
            '--tw-prose-captions': theme('colors.slate.500'),
            '--tw-prose-code': theme('colors.slate.900'),
            '--tw-prose-pre-code': theme('colors.slate.100'),
            '--tw-prose-pre-bg': theme('colors.slate.900'),
            '--tw-prose-th-borders': theme('colors.slate.300'),
            '--tw-prose-td-borders': theme('colors.slate.200'),

            maxWidth: 'none',
            lineHeight: '1.75',

            h2: { marginTop: '2.25em', marginBottom: '0.9em', scrollMarginTop: '96px' },
            h3: { marginTop: '1.75em', marginBottom: '0.75em', scrollMarginTop: '96px' },

            p: { marginTop: '1em', marginBottom: '1em' },
            ul: { marginTop: '0.75em', marginBottom: '1em' },
            ol: { marginTop: '0.75em', marginBottom: '1em' },
            li: { marginTop: '0.25em', marginBottom: '0.25em' },

            a: { textDecoration: 'none' },

            table: { marginTop: '1.25em', marginBottom: '1.5em' },
            'thead th': { fontWeight: '600', background: theme('colors.slate.50') },

            img: {
              marginTop: '1.25em',
              marginBottom: '1.25em',
              borderRadius: theme('borderRadius.xl'),
            },

            code: { fontWeight: '500' },
            pre: { borderRadius: theme('borderRadius.xl'), padding: '1rem' },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
}