import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import { Analytics } from "@/components/Analytics";
import { StructuredData } from "@/components/StructuredData";
import { Monetag } from "@/components/Monetag";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://viralard.vercel.app"),
  title: {
    default: "Viralard - Live Feed Hijack & Short-Form Script Simulator | Ask Ninja Tech",
    template: "%s | Viralard",
  },
  description:
    "Stop guessing your first 3 seconds. Hijack the scrolling feed before you film. Score your short-form video hook, rewrite it into three proven structures, and simulate it inside a live TikTok, Reels or Shorts feed.",
  keywords: [
    "hook strength score",
    "short form script simulator",
    "tiktok hook generator",
    "reels hook analyzer",
    "youtube shorts hook",
    "live feed hijack",
    "viral hook templates",
    "retention hook",
    "creator tools",
    "pattern interrupt hook",
    "negative frame hook",
    "curiosity loop hook",
  ],
  applicationName: "Viralard",
  authors: [{ name: "Ask Ninja Tech" }],
  creator: "Ask Ninja Tech",
  publisher: "Ask Ninja Tech",
  category: "technology",
  openGraph: {
    type: "website",
    siteName: "Viralard",
    title: "Viralard - Live Feed Hijack & Short-Form Script Simulator",
    description:
      "Score your hook, rewrite it three ways, and see it in a live scrolling feed before you film.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Viralard - Stop guessing your first 3 seconds",
    description:
      "Live feed hijack and short-form script simulator for TikTok, Reels and Shorts creators.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <div className="aurora" aria-hidden="true">
          <span
            className="left-[-10%] top-[-15%] h-[38rem] w-[38rem]"
            style={{ background: "var(--color-accent)" }}
          />
          <span
            className="right-[-12%] top-[10%] h-[30rem] w-[30rem]"
            style={{ background: "var(--color-accent-3)", animationDelay: "-7s" }}
          />
          <span
            className="bottom-[-18%] left-[25%] h-[34rem] w-[34rem]"
            style={{ background: "var(--color-accent)", animationDelay: "-14s" }}
          />
        </div>
        <Monetag />
        <StructuredData />
        <Analytics />
        {children}
      </body>
    </html>
  );
}
