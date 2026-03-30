import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import SellerShell from "@/components/layout/SellerShell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const syne = Syne({ subsets: ["latin"], variable: "--font-syne", weight: ["600", "700", "800"] });

export const metadata: Metadata = {
  title: "Zolexora Seller — Dashboard",
  description: "Manage your products, reels, orders and analytics",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable}`}>
      <body className="bg-surface font-sans antialiased">
        <SellerShell>{children}</SellerShell>
        <Toaster position="top-right" toastOptions={{ style: { fontFamily: "var(--font-inter)", fontSize: 13, borderRadius: 10 } }} />
      </body>
    </html>
  );
}
