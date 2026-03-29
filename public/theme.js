tailwind.config = {
  theme: {
    extend: {
      colors: {
        theme: {
          bg: '#FEFCF7',
          bgCard: '#FFFFFF',
          bgCardAlt: '#F8F4ED',
          primary: '#1e3a8a',
          primaryLight: '#eff6ff',
          accent: '#B88A3E',
          accentLight: '#F5ECD8',
          text: '#1C2B22',
          textMuted: '#6B7F72',
          border: 'rgba(30,58,138,0.12)',
          borderAccent: 'rgba(184,138,62,0.25)',
        }
      },
      fontFamily: {
        display: ['"Lora"', 'serif'],
        body: ['"Nunito Sans"', 'sans-serif'],
      },
      borderRadius: {
        theme: '8px',
        themeSm: '4px',
      }
    }
  }
}
