import type { Metadata } from "next";
import { Cormorant_Garamond, Source_Sans_3 } from "next/font/google";
import { PageTransition } from "@/components/motion/PageTransition";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const ui = Source_Sans_3({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ui",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Театр теней Мии",
    template: "%s · Театр теней Мии",
  },
  description: "Маленькие истории в мире теней. Домашний детский театр теней.",
  openGraph: {
    title: "Театр теней Мии",
    description: "Маленькие истории в мире теней",
    locale: "ru_RU",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${display.variable} ${ui.variable} h-full antialiased`}>
      <body className="min-h-full font-sans text-foreground">
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
