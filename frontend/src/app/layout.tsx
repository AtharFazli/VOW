import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_URL } from "@/lib/site";
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
  // ponytail: og:image must be an absolute URL; SITE_URL resolves it (see lib/site.ts).
  metadataBase: new URL(SITE_URL),
  // ponytail: template brands child routes; landing keeps the descriptive default
  title: {
    default: "VOW: Collateralized Promises",
    template: "%s | VOW",
  },
  description:
    "Peer-to-peer commitment protocol. Put BOT behind promises you make to each other.",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "VOW",
    locale: "en_US",
    images: [
      {
        url: "/vow-app.png",
        width: 1200,
        height: 1090,
        alt: "VOW — put BOT behind promises you make to each other",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/vow-app.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-white">
        <Providers>{children}</Providers>
        <SiteFooter />
      </body>
    </html>
  );
}
