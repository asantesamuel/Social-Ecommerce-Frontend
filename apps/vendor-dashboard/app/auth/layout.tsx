import type { Metadata } from "next";
import localFont from "next/font/local";
import "../globals.css";

const geist = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-jwso-sans",
  weight: "100 900",
});
export const metadata: Metadata = { title: "JWSO | Vendor sign in" };

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={geist.variable}>{children}</body>
    </html>
  );
}
