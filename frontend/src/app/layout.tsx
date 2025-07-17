import ConditionalLayout from "@/components/ConditionalLayout";
import GlobalProviders from "@/components/providers/GlobalProviders";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "react-image-gallery/styles/css/image-gallery.css";
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
  title: "Ticket Robot - WhatsApp Automation",
  description: "Sistema de automação WhatsApp com gestão de tickets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-gray-900 transition-colors`}
      >
        <GlobalProviders>
          <ConditionalLayout>{children}</ConditionalLayout>
        </GlobalProviders>
      </body>
    </html>
  );
}
