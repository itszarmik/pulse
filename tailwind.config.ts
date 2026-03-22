import type { Config } from 'tailwindcss'
const config: Config = {
  content: ['./pages/**/*.{js,ts,jsx,tsx,mdx}','./components/**/*.{js,ts,jsx,tsx,mdx}','./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT:'#0d0f14', 2:'#13161d', 3:'#1a1d26', 4:'#20242f' },
        teal: { DEFAULT:'#00d4a0', dim:'rgba(0,212,160,0.12)', dim2:'rgba(0,212,160,0.2)', dark:'#00b386' },
        border: { DEFAULT:'rgba(255,255,255,0.07)', 2:'rgba(255,255,255,0.12)' },
        text: { DEFAULT:'#e8eaf0', 2:'#8b90a0', 3:'#555a6a' },
      },
      fontFamily: { sans:['DM Sans','system-ui','sans-serif'], mono:['Space Mono','monospace'] },
    },
  },
  plugins: [],
}
export default config
