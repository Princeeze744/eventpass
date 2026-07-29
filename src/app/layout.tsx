import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-serif",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Story Box — Event Experience Platform",
  description: "Verified digital passes, self-service registration and gate control for weddings, conferences and celebrations.",
  metadataBase: new URL("https://storyboxnigeria.com"),
  openGraph: {
    title: "Story Box | Events, Reimagined.",
    description: "One platform for RSVP, digital invitations, verified digital passes, check-in and seamless event experiences.",
    url: "https://storyboxnigeria.com",
    siteName: "Story Box",
    images: [{ url: "/brand/logo-white.jpg", width: 1280, height: 1280, alt: "Story Box" }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Story Box | Events, Reimagined.",
    description: "One platform for RSVP, digital invitations, verified digital passes, check-in and seamless event experiences.",
    images: ["/brand/logo-white.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080807",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${cormorant.variable} ${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
