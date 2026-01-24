import type { Metadata } from "next";
import { Amiri } from "next/font/google";
import "./globals.css";

const amiri = Amiri({
  weight: ['400', '700'],
  subsets: ['arabic', 'latin'],
  variable: '--font-amiri',
});

export const metadata: Metadata = {
  title: "Hadith Library",
  description: "Search and browse hadith collections in Arabic and English",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${amiri.variable} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
