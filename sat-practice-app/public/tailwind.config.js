module.exports = {
    content: [
      './index.html',
      './pages/**/*.html',
      './assets/js/**/*.js',
    ],
    theme: {
      extend: {
        colors: {
          indigo: {
            50: '#f0f5ff',
            100: '#e5edff',
            200: '#cddbfe',
            300: '#b4c6fc',
            400: '#8da2fb',
            500: '#6875f5',
            600: '#5850ec',
            700: '#5145cd',
            800: '#42389d',
            900: '#362f78',
            950: '#1e1b43',
          },
          lime: {
            50: '#f7fee7',
            100: '#ecfccb',
            200: '#d9f99d',
            300: '#bef264',
            400: '#a3e635',
            500: '#84cc16',
            600: '#65a30d',
            700: '#4d7c0f',
            800: '#3f6212',
            900: '#365314',
          },
        },
        fontFamily: {
          sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        },
        spacing: {
          '72': '18rem',
          '84': '21rem',
          '96': '24rem',
        },
        borderRadius: {
          'xl': '1rem',
          '2xl': '1.5rem',
          '3xl': '2rem',
        },
        boxShadow: {
          'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          'strong': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    plugins: [],
    safelist: [
      'bg-green-500',
      'bg-red-500',
    ],
  };