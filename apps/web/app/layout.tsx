import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Poppins, Tiro_Devanagari_Sanskrit } from "next/font/google";

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

const tiroDevanagari = Tiro_Devanagari_Sanskrit({
  subsets: ['devanagari'],
  weight: ['400'],
  variable: '--font-tiro',
});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "SevaMitra - Volunteer Management",
  description: "Volunteer Management System for Mahakumbh",
  manifest: "/manifest.json",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: "#FF6B00",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SevaMitra",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} ${tiroDevanagari.variable} antialiased`}
        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
      >
        {children}
      </body>
    </html>
  );
}
