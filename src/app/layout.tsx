import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { site } from "@/site.config";
import { getSite, t } from "@/lib/supabase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartProvider from "@/components/cart/CartProvider";

const font = Noto_Sans_Thai({ subsets: ["thai", "latin"], weight: ["400", "600", "700"], display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { settings: s } = await getSite();
  const name = t(s.store_name);
  return name ? { title: name } : {};
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { settings } = await getSite();
  return (
    <html lang="th" style={{ "--brand": site.colors.brand, "--dark": site.colors.dark } as React.CSSProperties}>
      <body className={font.className}>
        <CartProvider messenger={t(settings.messenger_url)}>
          <Header />
          {children}
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
