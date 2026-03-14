import type { Metadata } from "next";
import { Inter, Rajdhani } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-rajdhani",
  display: "swap",
});

export const metadata: Metadata = {
  title: "🃏 Poker — Texas Hold'em",
  description: "Jogue poker Texas Hold'em com seus amigos em tempo real",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${rajdhani.variable}`}>
      <body style={{ background: "#0a0d1a", color: "white", overflowX: "hidden" }}>
        {children}
      </body>
    </html>
  );
}
