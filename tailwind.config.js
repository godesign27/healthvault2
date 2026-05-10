/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['attribute', '[data-theme="dark"]'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        /* ── Brand primitives ── */
        brand: {
          50:  'var(--hv-color-brand-50)',
          100: 'var(--hv-color-brand-100)',
          200: 'var(--hv-color-brand-200)',
          300: 'var(--hv-color-brand-300)',
          400: 'var(--hv-color-brand-400)',
          500: 'var(--hv-color-brand-500)',
          600: 'var(--hv-color-brand-600)',
          700: 'var(--hv-color-brand-700)',
          800: 'var(--hv-color-brand-800)',
          900: 'var(--hv-color-brand-900)',
          950: 'var(--hv-color-brand-950)',
        },
        /* ── Teal primitives ── */
        'hv-teal': {
          50:  'var(--hv-color-teal-50)',
          100: 'var(--hv-color-teal-100)',
          200: 'var(--hv-color-teal-200)',
          300: 'var(--hv-color-teal-300)',
          400: 'var(--hv-color-teal-400)',
          500: 'var(--hv-color-teal-500)',
          600: 'var(--hv-color-teal-600)',
          700: 'var(--hv-color-teal-700)',
          800: 'var(--hv-color-teal-800)',
          900: 'var(--hv-color-teal-900)',
        },
        /* ── Neutral primitives ── */
        'hv-neutral': {
          0:   'var(--hv-color-neutral-0)',
          50:  'var(--hv-color-neutral-50)',
          100: 'var(--hv-color-neutral-100)',
          200: 'var(--hv-color-neutral-200)',
          300: 'var(--hv-color-neutral-300)',
          400: 'var(--hv-color-neutral-400)',
          500: 'var(--hv-color-neutral-500)',
          600: 'var(--hv-color-neutral-600)',
          700: 'var(--hv-color-neutral-700)',
          800: 'var(--hv-color-neutral-800)',
          900: 'var(--hv-color-neutral-900)',
          950: 'var(--hv-color-neutral-950)',
        },

        /* ── Semantic: Surface (bg-surface-*) ── */
        surface: {
          page:    'var(--hv-color-surface-page)',
          raised:  'var(--hv-color-surface-raised)',
          sunken:  'var(--hv-color-surface-sunken)',
          overlay: 'var(--hv-color-surface-overlay)',
          'feedback-error':   'var(--hv-color-surface-feedback-error)',
          'feedback-success': 'var(--hv-color-surface-feedback-success)',
          'feedback-warning': 'var(--hv-color-surface-feedback-warning)',
          'feedback-info':    'var(--hv-color-surface-feedback-info)',
        },

        /* ── Semantic: Content/Text (text-content-*) ── */
        content: {
          primary:     'var(--hv-color-text-primary)',
          secondary:   'var(--hv-color-text-secondary)',
          tertiary:    'var(--hv-color-text-tertiary)',
          placeholder: 'var(--hv-color-text-placeholder)',
          disabled:    'var(--hv-color-text-disabled)',
          inverse:     'var(--hv-color-text-inverse)',
          'on-action': 'var(--hv-color-text-on-action)',
          link:        'var(--hv-color-text-link)',
          'link-hover':'var(--hv-color-text-link-hover)',
          'feedback-error':   'var(--hv-color-text-feedback-error)',
          'feedback-success': 'var(--hv-color-text-feedback-success)',
          'feedback-warning': 'var(--hv-color-text-feedback-warning)',
          'feedback-info':    'var(--hv-color-text-feedback-info)',
        },

        /* ── Semantic: Stroke/Border (border-stroke-*) ── */
        stroke: {
          subtle:  'var(--hv-color-border-subtle)',
          default: 'var(--hv-color-border-default)',
          strong:  'var(--hv-color-border-strong)',
          focus:   'var(--hv-color-border-focus)',
          'feedback-error':   'var(--hv-color-border-feedback-error)',
          'feedback-success': 'var(--hv-color-border-feedback-success)',
          'feedback-warning': 'var(--hv-color-border-feedback-warning)',
          'feedback-info':    'var(--hv-color-border-feedback-info)',
        },

        /* ── Orange primitives ── */
        'hv-orange': {
          50:  'var(--hv-color-orange-50)',
          100: 'var(--hv-color-orange-100)',
          200: 'var(--hv-color-orange-200)',
          300: 'var(--hv-color-orange-300)',
          400: 'var(--hv-color-orange-400)',
          500: 'var(--hv-color-orange-500)',
          600: 'var(--hv-color-orange-600)',
          700: 'var(--hv-color-orange-700)',
          800: 'var(--hv-color-orange-800)',
          900: 'var(--hv-color-orange-900)',
        },

        /* ── Semantic: Action (bg-action-*, text-action-*) ── */
        action: {
          'link':               'var(--hv-color-text-link)',
          'link-hover':         'var(--hv-color-text-link-hover)',
          'primary':            'var(--hv-color-action-primary-default)',
          'primary-hover':      'var(--hv-color-action-primary-hover)',
          'primary-active':     'var(--hv-color-action-primary-active)',
          'primary-disabled':   'var(--hv-color-action-primary-disabled)',
          'primary-subtle':     'var(--hv-color-action-primary-subtle)',
          'secondary':          'var(--hv-color-action-secondary-default)',
          'secondary-hover':    'var(--hv-color-action-secondary-hover)',
          'secondary-active':   'var(--hv-color-action-secondary-active)',
          'destructive':        'var(--hv-color-action-destructive-default)',
          'destructive-hover':  'var(--hv-color-action-destructive-hover)',
          'destructive-subtle': 'var(--hv-color-action-destructive-subtle)',
          'ghost-hover':        'var(--hv-color-action-ghost-hover)',
          'ghost-active':       'var(--hv-color-action-ghost-active)',
        },
      },
    },
  },
  plugins: [],
};
