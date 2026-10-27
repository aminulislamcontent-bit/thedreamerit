import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "The Dreamer IT Express — Premium Technology Retail in Bangladesh",
  description: "Shop laptops, desktop PCs, gaming rigs, components, monitors, networking & accessories at The Dreamer IT Express, Subastu Arcade, ICT Bhaban, Dhaka. Authorized tech retailer with warranty, EMI & nationwide delivery.",
  keywords: ["laptops Bangladesh", "gaming PC Dhaka", "computer shop Bangladesh", "tech retail", "Dreamer IT", "ICT Bhaban", "Subastu Arcade", "laptop price BD", "computer accessories"],
  authors: [{ name: "The Dreamer IT Express" }],
  metadataBase: new URL("https://thedreamerit.com"),
  alternates: {
    canonical: "https://thedreamerit.com",
    languages: { "bn-BD": "/bn", "en": "/en" },
  },
  openGraph: {
    title: "The Dreamer IT Express",
    description: "Premium technology retail in Bangladesh. Laptops, desktops, gaming PCs, components & accessories.",
    url: "https://thedreamerit.com",
    siteName: "The Dreamer IT Express",
    type: "website",
    locale: "bn_BD",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Dreamer IT Express",
    description: "Premium technology retail in Bangladesh",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body className={`${inter.variable} ${jakarta.variable} antialiased bg-background text-foreground`}>
        {children}
        <Toaster />
        <SonnerToaster position="top-right" richColors />
      </body>
    </html>
  );
}
