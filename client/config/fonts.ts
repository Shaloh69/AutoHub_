// Temporarily using system fonts due to network restrictions in build environment
// To re-enable Google Fonts, uncomment the imports below and update the font configs

// import { Fira_Code as FontMono, Inter as FontSans } from "next/font/google";

// export const fontSans = FontSans({
//   subsets: ["latin"],
//   variable: "--font-sans",
//   display: "swap",
//   fallback: ["system-ui", "arial"],
// });

// export const fontMono = FontMono({
//   subsets: ["latin"],
//   variable: "--font-mono",
//   display: "swap",
//   fallback: ["monospace"],
// });

// Temporary: Using system fonts
export const fontSans = {
  variable: "--font-sans",
  className: "",
};

export const fontMono = {
  variable: "--font-mono",
  className: "",
};
