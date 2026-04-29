import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Mahalo Enterprise — Internet & TV providers near you",
    template: "%s · Mahalo Enterprise",
  },
  description:
    "Compare internet and TV providers available at your address and book installation in minutes.",
  applicationName: "Mahalo Enterprise",
  keywords: [
    "internet providers",
    "TV providers",
    "broadband",
    "fiber internet",
    "Mahalo Enterprise",
  ],
  openGraph: {
    type: "website",
    url: appUrl,
    siteName: "Mahalo Enterprise",
    title: "Mahalo Enterprise — Internet & TV providers near you",
    description:
      "Compare internet and TV providers available at your address and book installation in minutes.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Mahalo Enterprise",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mahalo Enterprise — Internet & TV providers near you",
    description:
      "Compare internet and TV providers available at your address and book installation in minutes.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.ico",
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
    <ClerkProvider>
      <html
        lang="en"
        className={`${inter.variable} h-full`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col bg-background text-foreground">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
