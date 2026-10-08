import type { Metadata } from "next";
import localFont from "next/font/local";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

const geist = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-jwso-sans",
  weight: "100 900",
});

import QueryProvider from "../../lib/QueryProvider";

export const metadata: Metadata = {
  title: "JWSO | Vendor",
  description: "Manage your JWSO vendor account and products.",
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
        className={`${geist.variable} antialiased`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>{children}</QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
