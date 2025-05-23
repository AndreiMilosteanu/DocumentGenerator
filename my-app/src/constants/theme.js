// Erdbaron Theme Constants
export const erdbaronTheme = {
  // Primary Colors (Earth tones from Erdbaron branding)
  colors: {
    primary: {
      50: '#F9F7F4',   // Very light beige
      100: '#F4F1EA',  // Light beige  
      200: '#E8E1D5',  // Lighter brown
      300: '#D4C4A8',  // Light brown
      400: '#B8A082',  // Medium brown
      500: '#8B7355',  // Main brown (primary)
      600: '#6D5A43',  // Darker brown
      700: '#5A4937',  // Dark brown
      800: '#4A3E2E',  // Very dark brown
      900: '#3D3226',  // Darkest brown
    },
    
    // Orange accent colors
    secondary: {
      50: '#FFF8F1',
      100: '#FEECDC', 
      200: '#FCD9BD',
      300: '#FDBA8C',
      400: '#FF9C55',
      500: '#F39C12',  // Main orange
      600: '#E67E22',  // Darker orange
      700: '#D68910',
      800: '#B7701A',
      900: '#935A16',
    },
    
    // Neutral colors
    neutral: {
      50: '#FAFAF9',
      100: '#F5F5F4', 
      200: '#E7E5E4',
      300: '#D6D3D1',
      400: '#A8A29E',
      500: '#78716C',
      600: '#57534E',
      700: '#44403C',
      800: '#292524',
      900: '#1C1917',
    },
    
    // Status colors
    success: {
      50: '#F0FDF4',
      500: '#22C55E',
      600: '#16A34A',
      700: '#15803D',
    },
    
    warning: {
      50: '#FFFBEB',
      500: '#F59E0B',
      600: '#D97706',
    },
    
    error: {
      50: '#FEF2F2',
      500: '#EF4444',
      600: '#DC2626',
    },
    
    // Background colors
    background: {
      primary: '#FFFFFF',
      secondary: '#F9F7F4',
      accent: '#F4F1EA',
    }
  },
  
  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }], 
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    }
  },
  
  // Spacing
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem', 
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  
  // Border radius
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  
  // Component styles
  components: {
    button: {
      primary: {
        bg: '#8B7355',
        bgHover: '#6D5A43',
        text: '#FFFFFF',
        border: '#8B7355',
      },
      secondary: {
        bg: '#F39C12',
        bgHover: '#E67E22', 
        text: '#FFFFFF',
        border: '#F39C12',
      },
      outline: {
        bg: 'transparent',
        bgHover: '#F9F7F4',
        text: '#8B7355',
        border: '#8B7355',
      },
      ghost: {
        bg: 'transparent',
        bgHover: '#F9F7F4',
        text: '#8B7355',
        border: 'transparent',
      }
    },
    
    input: {
      bg: '#FFFFFF',
      border: '#D6D3D1',
      borderHover: '#8B7355',
      borderFocus: '#8B7355',
      text: '#1C1917',
      placeholder: '#78716C',
    },
    
    card: {
      bg: '#FFFFFF',
      border: '#E7E5E4',
      shadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    }
  }
}; 