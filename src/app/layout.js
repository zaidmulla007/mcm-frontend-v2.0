import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import ClientHeader from "./components/ClientHeader";
import ClientWrapper from "./components/ClientWrapper";
import Providers from "./components/Providers";
import ClientFooter from "./components/ClientFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "MCM",
  description: "MCM",
  colorScheme: "light",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ colorScheme: "light" }}>
      <head>
        <meta name="color-scheme" content="light" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <ClientWrapper>
            <ClientHeader />
            {children}
            <ClientFooter />
          </ClientWrapper>
        </Providers>
      </body>
    </html>
  );
}
