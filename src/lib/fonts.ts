import { Manrope, Rubik, Source_Code_Pro, Vazirmatn } from "next/font/google";

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

/**
 * Geometric sans for the public site. Rubik covers Persian and Latin in one family,
 * so headlines stay tight without a second Arabic face. Not preloaded, so /ws does
 * not download it unless a public page actually uses the family.
 */
export const rubik = Rubik({
  subsets: ["arabic", "latin"],
  variable: "--font-rubik",
  display: "swap",
  preload: false,
});

export const sourceCode = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-source",
  display: "swap",
});
