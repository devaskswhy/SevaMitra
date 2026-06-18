import type { Metadata, Viewport } from "next";
import { Inter, Tiro_Devanagari_Sanskrit } from "next/font/google";
import "./globals.css";
import PageTransition from "@/components/ui/PageTransition";

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
  themeColor: "#E8650A",
};

export const metadata: Metadata = {
  title: "SevaMitra — Mahakumbh 2025 Volunteer Management",
  description:
    "Sacred volunteer coordination system for Mahakumbh 2025. Manage zones, track incidents, and coordinate sevadars across the world's largest spiritual gathering.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
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
        <PageTransition>{children}</PageTransition>

        {/* ── OM Watermark ── */}
        <div className="om-watermark" aria-hidden="true">
          ॐ
        </div>
      </body>
    </html>
  );
}
