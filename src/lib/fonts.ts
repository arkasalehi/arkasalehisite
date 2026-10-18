import { Manrope, Source_Code_Pro, Vazirmatn } from "next/font/google";

/** Persian body. Latin glyphs fall through to Manrope when both are in the stack. */
export const vazir = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazir",
  display: "swap",
  weight: "variable",
});

/** Supabase-like grotesk for Latin headings and UI. Arabic falls back to Vazirmatn. */
export const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const sourceCode = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-source",
  display: "swap",
});
