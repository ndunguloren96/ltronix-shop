module.exports = {
  content: [
    "../public/index.html",
    "../src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4CAF50",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
