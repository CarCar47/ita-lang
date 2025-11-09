import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Parla Italiano - Learn Italian Through Games",
  description:
    "An engaging game-based application to learn Italian for English speakers. Master vocabulary, pronunciation, and conversation skills.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Parla Italiano",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icon-192x192.png",
    apple: "/icon-192x192.png",
  },
  openGraph: {
    type: "website",
    siteName: "Parla Italiano",
    title: "Parla Italiano - Learn Italian Through Games",
    description:
      "Master Italian with fun, interactive lessons and pronunciation practice.",
  },
  twitter: {
    card: "summary",
    title: "Parla Italiano - Learn Italian",
    description: "Learn Italian through engaging games and exercises.",
  },
};

export const viewport: Viewport = {
  themeColor: "#009246",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
