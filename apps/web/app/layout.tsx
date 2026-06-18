import type { Metadata, Viewport } from "next";
import { Inter, Tiro_Devanagari_Sanskrit } from "next/font/google";
import "./globals.css";

/* ═══════════════════════════════════════════════════════════════
   GOOGLE FONTS — Sacred Typography System
   ═══════════════════════════════════════════════════════════════ */

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const tiroDevanagari = Tiro_Devanagari_Sanskrit({
  subsets: ["devanagari", "latin"],
  weight: ["400"],
  variable: "--font-tiro",
  display: "swap",
});

/* ═══════════════════════════════════════════════════════════════
   METADATA — SEO & PWA
   ═══════════════════════════════════════════════════════════════ */

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0D0500",
};

export const metadata: Metadata = {
  title: "SevaMitra — Mahakumbh 2025 Volunteer Intelligence Platform",
  description:
    "Sacred volunteer coordination system for Mahakumbh 2025. Manage zones, track incidents, and coordinate sevadars across the world's largest spiritual gathering.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SevaMitra",
  },
  keywords: [
    "SevaMitra",
    "Mahakumbh 2025",
    "volunteer management",
    "seva",
    "Prayagraj",
    "crowd management",
  ],
};

/* ═══════════════════════════════════════════════════════════════
   ROOT LAYOUT
   ═══════════════════════════════════════════════════════════════ */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${tiroDevanagari.variable}`}>
      <body
        className="antialiased"
        style={{
          fontFamily: "var(--font-inter), -apple-system, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
