/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#0a0e12',
                surface: '#12171d',
                primary: '#00d9a3',
                secondary: '#1a1f26',
                text: '#e0e0e0',
                subtext: '#6b7280',
                accent: '#00f5b8',
            }
        },
    },
    plugins: [],
}
