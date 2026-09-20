import type { Metadata } from "next";
import localFont from "next/font/local";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import AdminLayout from "../../components/AdminLayout";
import QueryProvider from "../../lib/QueryProvider";

const spaceGrotesk = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-space-grotesk",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Admin Command Center",
  description: "Manage ecommerce platform globally.",
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
        className={`${spaceGrotesk.variable} antialiased`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          <QueryProvider>
            <AdminLayout locale={locale}>{children}</AdminLayout>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
