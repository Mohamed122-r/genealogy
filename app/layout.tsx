import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "شجرة النسب العائلية الكريمة",
  description: "منصة رقمية احترافية لتوثيق وحفظ الأنساب العائلية عبر الأجيال",
  keywords: ["شجرة العائلة", "الأنساب", "تاريخ العائلة", "القبيلة", "Genealogy"],
  authors: [{ name: "Mohamed Abdalwhab" }],
  openGraph: {
    title: "شجرة النسب العائلية الكريمة",
    description: "منصة رقمية احترافية لتوثيق وحفظ الأنساب",
    type: "website",
    locale: "ar_SA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-heritage-bg text-dark-bg antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
