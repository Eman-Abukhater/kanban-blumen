/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // allows switching between light and dark themes
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/react-tailwindcss-datepicker/dist/index.esm.js",
  ],
  theme: {
    extend: {
      /* 🎨 1) Colors — from  Figma palette */
      colors: {
        // neutral + text
        ink: "#1C252E",
        slate600: "#637381",
        slate500: "#919EAB",
        slate500_80: "#919EABCC",
        slate500_48: "#919EAB7A",
        slate500_20: "#919EAB33",
        slate500_12: "#919EAB1F",

        // brand yellow
        brand: "#FFAB00",
        brandDark: "#B76E00",
        brandGrad_from: "#FFD666",
        brandGrad_to: "#FFAB00",

        // secondary purple
        secondary: "#8E33FF",
        secondaryTint: "#C684FF",

        // info/support
        info: "#00B8D9",
        successBg: "#CAFDF5",
        purpleBg: "#EFD6FF",
        orangeBg: "#FFE9D5",
        warningBg: "#FFF5CC",
        danger: "#FF5630",

        // surfaces
        surface: "#FFFFFF",
        whitesmoke: "whitesmoke",
      },

      /* 🧱 2) Border radius and shadows */
      borderRadius: {
        md: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        card: "0 10px 40px -4px rgba(145,158,171,0.14), 0 2px 8px rgba(145,158,171,0.12)",
        soft: "0 2px 10px rgba(0,0,0,0.04)",
      },

      /* ✍️ 3) Custom font */
      fontFamily: {
        cool: ["YourCoolFont", "sans"], // optional if you have a specific font
      },

      /* 🚀 4) Extra utilities (like you had before) */
      margin: {
        "-52": "-13rem", // keep your negative margin
      },
      animation: {
        bounce: "bounce 1s infinite", // keep your animation
      },
    },
  },

  /* ⚙️ 5) Plugins you already had */
  plugins: [
    require("@tailwindcss/forms"),
    require("tailwind-scrollbar")({ nocompatible: true }),
  ],
};
