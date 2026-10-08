import type { Metadata } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import QueryProvider from "../../lib/QueryProvider";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import "../globals.css";

const geist = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-jwso-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "JWSO | Discover the marketplace",
  description: "Shop products from the JWSO marketplace.",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geist.variable} antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <Navbar />
            {children}
            <Footer />
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
