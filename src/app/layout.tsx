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
  description: "Shop laptops, desktop PCs, gaming rigs, components, monitors, networking & accessories at The Dreamer IT Express, Suvastu Arcade, ICT Bhaban (Level 1), New Elephant Road, Dhaka 1205. Premium used & refurbished laptops (HP EliteBook, Dell Latitude, Lenovo ThinkPad), Apple MacBook, custom PC builds. 11 AM - 8 PM. Phone: 01610111688, 01753943788.",
  keywords: [
    "laptops Bangladesh", "gaming PC Dhaka", "computer shop Bangladesh", "tech retail",
    "Dreamer IT", "ICT Bhaban", "Suvastu Arcade", "New Elephant Road", "laptop price BD",
    "HP EliteBook Bangladesh", "refurbished laptop Dhaka", "used laptop Bangladesh",
    "MacBook Bangladesh", "custom PC build BD", "computer accessories Dhaka",
    "freelancing laptop Bangladesh", "business laptop BD",
  ],
  authors: [{ name: "The Dreamer IT Express" }],
  metadataBase: new URL("https://thedreamerit.com"),
  alternates: {
    canonical: "https://thedreamerit.com",
    languages: { "bn-BD": "/bn", "en": "/en" },
  },
  openGraph: {
    title: "The Dreamer IT Express — Premium Technology Retail",
    description: "Premium used & new laptops, gaming PCs, custom builds. Suvastu Arcade, ICT Bhaban, New Elephant Road, Dhaka. WhatsApp: 01610111688",
    url: "https://thedreamerit.com",
    siteName: "The Dreamer IT Express",
    type: "website",
    locale: "bn_BD",
    images: [{
      url: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/c2a29d8f7e07.jpg",
      width: 894,
      height: 894,
      alt: "The Dreamer IT Express - Premium Gaming PC",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Dreamer IT Express",
    description: "Premium technology retail in Bangladesh",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/logo.svg" },
  other: {
    "fb:page_id": "61565139640111",
    "fb:admins": "61565139640111",
    "business:contact_data:street_address": "Suvastu Arcade, ICT Bhaban, Level 1, Shop 104 & 105, New Elephant Road",
    "business:contact_data:locality": "Dhaka",
    "business:contact_data:postal_code": "1205",
    "business:contact_data:country_name": "Bangladesh",
    "business:contact_data:phone_number": "+8801610111688",
    "business:contact_data:email": "thedreameritexpress@gmail.com",
    "business:hours": "Sa-Th 11:00-20:00",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ComputerStore",
    "name": "The Dreamer IT Express",
    "image": "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/c2a29d8f7e07.jpg",
    "description": "Premium technology retail in Bangladesh. Specializing in used & refurbished laptops (HP EliteBook, Dell Latitude, Lenovo ThinkPad), Apple MacBook, custom PC builds, and computer components.",
    "@id": "https://thedreamerit.com",
    "url": "https://thedreamerit.com",
    "telephone": "+8801610111688",
    "email": "thedreameritexpress@gmail.com",
    "priceRange": "৳৳",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Suvastu Arcade, ICT Bhaban, Level 1, Shop 104 & 105, New Elephant Road",
      "addressLocality": "Dhaka",
      "postalCode": "1205",
      "addressCountry": "BD"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 23.7337,
      "longitude": 90.3929
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
        "opens": "11:00",
        "closes": "20:00"
      }
    ],
    "sameAs": [
      "https://www.facebook.com/profile.php?id=61565139640111"
    ],
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "telephone": "+8801610111688",
        "contactType": "customer service",
        "areaServed": "BD",
        "availableLanguage": ["Bengali", "English"]
      },
      {
        "@type": "ContactPoint",
        "telephone": "+8801753943788",
        "contactType": "sales",
        "areaServed": "BD"
      }
    ]
  };

  return (
    <html lang="bn" suppressHydrationWarning>
      <body className={`${inter.variable} ${jakarta.variable} antialiased bg-background text-foreground`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Toaster />
        <SonnerToaster position="top-right" richColors />
      </body>
    </html>
  );
}
