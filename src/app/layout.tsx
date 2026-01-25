import type { Metadata } from "next";
import { Amiri, Scheherazade_New, Noto_Naskh_Arabic, Noto_Nastaliq_Urdu, Lateef } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const amiri = Amiri({
  weight: ['400', '700'],
  subsets: ['arabic', 'latin'],
  variable: '--font-amiri',
});

const scheherazade = Scheherazade_New({
  weight: ['400', '700'],
  subsets: ['arabic', 'latin'],
  variable: '--font-scheherazade',
});

const notoNaskh = Noto_Naskh_Arabic({
  weight: ['400', '700'],
  subsets: ['arabic', 'latin'],
  variable: '--font-noto-naskh',
});

const notoNastaliq = Noto_Nastaliq_Urdu({
  weight: ['400', '700'],
  subsets: ['arabic', 'latin'],
  variable: '--font-noto-nastaliq',
});

const lateef = Lateef({
  weight: ['400', '700'],
  subsets: ['arabic', 'latin'],
  variable: '--font-lateef',
});

export const metadata: Metadata = {
  title: "Hadith Hub Online",
  description: "Search and browse hadith collections in Arabic and English",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${amiri.variable} ${scheherazade.variable} ${notoNaskh.variable} ${notoNastaliq.variable} ${lateef.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
