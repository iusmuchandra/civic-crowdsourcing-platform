import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Bebas_Neue,
  DM_Sans,
} from "next/font/google";
import CustomCursor from "@/components/ui/CustomCursor";
import Nav from "@/components/layout/Nav";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
});

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: ["400"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Ric & Jerry's Waterskiing Club — Precision on the Water. Luxury on the Dock.",
  description:
    "Private waterskiing club. Est. 1987 · Lake Geneva.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${bebas.variable} ${dmSans.variable}`}
    >
      <body className="min-h-screen antialiased">
        <div className="grain-overlay" aria-hidden />
        <CustomCursor />
        <Nav />
        {children}
      </body>
    </html>
  );
}
