import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { site } from "@/site.config";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const font = Noto_Sans_Thai({ subsets: ["thai", "latin"], weight: ["400", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: `${site.name} | ${site.tagline}`,
  description: site.tagline,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" style={{ "--brand": site.colors.brand, "--dark": site.colors.dark } as React.CSSProperties}>
      <body className={font.className}>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
