import { Geist_Mono, Inter, Newsreader } from "next/font/google";

/* -----------------------------------------------------------------------------------------------
 * Google Fonts: Inter (Sans-serif) & Newsreader (Editorial Serif)
 * -----------------------------------------------------------------------------------------------*/

export const fontSans = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const fontSerif = Newsreader({
  subsets: ["latin", "vietnamese"],
  variable: "--font-newsreader",
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

export const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
