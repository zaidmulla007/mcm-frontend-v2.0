import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import ClientHeader from "./components/ClientHeader";
import ClientWrapper from "./components/ClientWrapper";

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
};


function Footer() {
  return (
    <footer className="w-full bg-[#19162b] border-t border-[#232042] mt-12 py-8 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
        {/* Links */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-300 mb-4 md:mb-0">
          <a href="/about" className="hover:text-purple-400 transition">
            About
          </a>
          <a href="/terms" className="hover:text-purple-400 transition">
            Terms
          </a>
          <a href="/privacy" className="hover:text-purple-400 transition">
            Privacy
          </a>
          <a href="/contact" className="hover:text-purple-400 transition">
            Contact
          </a>
          <a href="/blog" className="hover:text-purple-400 transition">
            Blog
          </a>
          <a href="/sitemap" className="hover:text-purple-400 transition">
            Sitemap
          </a>
        </div>
        {/* Social Icons */}
        <div className="flex gap-4 mb-4 md:mb-0">
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter"
            className="hover:text-purple-400 transition"
          >
            <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.46 5.92c-.8.36-1.67.6-2.58.71a4.48 4.48 0 0 0 1.97-2.48 8.93 8.93 0 0 1-2.83 1.08A4.48 4.48 0 0 0 16.11 4c-2.48 0-4.49 2.01-4.49 4.49 0 .35.04.7.11 1.03C7.69 9.36 4.07 7.6 1.64 4.94c-.38.65-.6 1.4-.6 2.2 0 1.52.77 2.86 1.95 3.65-.72-.02-1.4-.22-1.99-.55v.06c0 2.13 1.52 3.91 3.54 4.31-.37.1-.76.16-1.16.16-.28 0-.55-.03-.81-.08.55 1.7 2.16 2.94 4.07 2.97A9.01 9.01 0 0 1 2 19.54c-.29 0-.57-.02-.85-.05A12.77 12.77 0 0 0 8.29 21.5c7.55 0 11.68-6.26 11.68-11.68 0-.18-.01-.36-.02-.54.8-.58 1.5-1.3 2.05-2.12z" />
            </svg>
          </a>
          <a
            href="https://discord.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Discord"
            className="hover:text-purple-400 transition"
          >
            <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.369A19.791 19.791 0 0 0 16.885 3.2a.112.112 0 0 0-.119.056c-.516.909-1.095 2.096-1.5 3.037a17.978 17.978 0 0 0-5.332 0c-.405-.941-.984-2.128-1.5-3.037a.115.115 0 0 0-.119-.056A19.736 19.736 0 0 0 3.684 4.369a.104.104 0 0 0-.047.043C1.605 7.362.322 10.274.076 13.246a.115.115 0 0 0 .042.094c2.104 1.547 4.144 2.488 6.13 3.117a.112.112 0 0 0 .123-.041c.472-.65.892-1.34 1.255-2.062a.112.112 0 0 0-.061-.155c-.669-.252-1.304-.558-1.917-.892a.112.112 0 0 1-.011-.188c.129-.098.258-.197.382-.297a.112.112 0 0 1 .114-.013c4.016 1.837 8.366 1.837 12.36 0a.112.112 0 0 1 .115.012c.124.1.253.199.382.297a.112.112 0 0 1-.01.188c-.613.334-1.249.64-1.918.893a.112.112 0 0 0-.06.154c.363.723.783 1.413 1.256 2.063a.112.112 0 0 0 .123.04c1.987-.629 4.027-1.57 6.13-3.117a.115.115 0 0 0 .042-.094c-.3-3.03-1.583-5.942-3.561-8.834a.104.104 0 0 0-.047-.043zM8.02 15.331c-1.183 0-2.156-1.085-2.156-2.419 0-1.333.955-2.418 2.156-2.418 1.21 0 2.174 1.094 2.156 2.418 0 1.334-.955 2.419-2.156 2.419zm7.96 0c-1.183 0-2.156-1.085-2.156-2.419 0-1.333.955-2.418 2.156-2.418 1.21 0 2.174 1.094 2.156 2.418 0 1.334-.946 2.419-2.156 2.419z" />
            </svg>
          </a>
          <a
            href="https://t.me"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram"
            className="hover:text-purple-400 transition"
          >
            <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9.036 16.572c-.38 0-.313-.144-.443-.504l-1.1-3.63 8.68-5.15c.39-.22.6-.1.49.32l-1.48 6.36c-.1.41-.36.51-.73.32l-2.03-1.48-1.01.97c-.11.11-.2.2-.41.2zm-1.62-2.13l.42 1.38c.06.2.12.24.27.18l.98-.36 1.98 1.44c.18.13.32.06.37-.16l1.48-6.36c.05-.22-.08-.31-.27-.22l-7.44 4.41c-.19.11-.18.27.04.33l1.44.36c.2.05.28.17.32.36z" />
            </svg>
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="hover:text-purple-400 transition"
          >
            <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.157-1.11-1.465-1.11-1.465-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.339-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.847-2.337 4.695-4.566 4.944.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.744 0 .267.18.578.688.48C19.138 20.2 22 16.447 22 12.021 22 6.484 17.523 2 12 2z" />
            </svg>
          </a>
        </div>
        {/* Newsletter Signup */}
        <form className="flex flex-col sm:flex-row gap-2 items-center">
          <input
            type="email"
            required
            placeholder="Your email"
            className="bg-[#232042] text-sm text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400 w-56"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-purple-500 to-blue-500 px-5 py-2 rounded-full font-semibold text-sm shadow hover:scale-105 transition"
          >
            Subscribe
          </button>
        </form>
      </div>
      <div className="text-xs text-gray-500 text-center mt-6">
        &copy; {new Date().getFullYear()} MCM. All rights reserved.
      </div>
    </footer>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientWrapper>
          <ClientHeader />
          {children}
          <Footer />
        </ClientWrapper>
      </body>
    </html>
  );
}
