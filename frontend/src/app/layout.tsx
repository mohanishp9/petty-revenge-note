import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";
import Navbar from "@/components/Navbar";
import FloatingCompose from "@/components/FloatingCompose";
import { Crimson_Text, IM_Fell_English, Special_Elite } from "next/font/google";
import { Toaster } from "react-hot-toast";

const crimsonText = Crimson_Text({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-crimson",
});

const imFellEnglish = IM_Fell_English({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-im-fell",
});

const specialElite = Special_Elite({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-special-elite",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://petty-revenge-note.vercel.app"),
  title: {
    default: "Petty Revenge Notes",
    template: "%s | Petty Revenge Notes",
  },
  description: "The public ledger for every slight, duly recorded for posterity. Read, share, and track viral revenge notes.",
  verification: {
    google: "v1Cl1kqcZ2ILTRgAGFEW-ul0GdrW4FfNXyYhI-vYKv0", // Paste your code string from Google here
  },
  openGraph: {
    title: "Petty Revenge Notes",
    description: "The public ledger for every slight, duly recorded for posterity.",
    url: "/",
    siteName: "Petty Revenge Notes",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Petty Revenge Notes",
    description: "The public ledger for every slight, duly recorded for posterity.",
  },
  robots: {
    index: true,
    follow: true,
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
        className={`${geistSans.variable} ${geistMono.variable} ${crimsonText.variable} ${imFellEnglish.variable} ${specialElite.variable} bg-[#f2e4ba] antialiased`}
      >
        <Providers>
          <Navbar />
          <main>{children}</main>
          <FloatingCompose />
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
