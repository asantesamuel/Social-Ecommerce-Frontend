import type { Metadata } from "next";
import localFont from "next/font/local";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import AdminLayout from "../../components/AdminLayout";
import QueryProvider from "../../lib/QueryProvider";

const geist = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-jwso-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "JWSO | Admin",
  description: "Manage the JWSO marketplace.",
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
        <NextIntlClientProvider messages={messages} locale={locale}>
          <QueryProvider>
            <AdminLayout locale={locale}>{children}</AdminLayout>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
