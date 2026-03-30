import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const syne = Syne({ subsets: ["latin"], variable: "--font-syne", weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Zolexora – Shop Premium",
  description: "India's cleanest shopping experience. Earn coins while you shop.",
  metadataBase: new URL("https://zolexora.com"),
  openGraph: { title: "Zolexora", description: "Shop Premium. Earn Coins.", url: "https://zolexora.com" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable}`}>
      <body className="bg-cream font-sans antialiased">
        <Providers>
          <Navbar />
          <main className="min-h-screen pt-16">{children}</main>
          <Toaster position="top-right" toastOptions={{ style: { fontFamily: "var(--font-inter)", fontSize: 14, borderRadius: 12, border: "1px solid #E8E5DF" } }} />
        </Providers>
      </body>
    </html>
  );
}
