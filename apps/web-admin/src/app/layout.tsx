import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import AdminShell from "@/components/layout/AdminShell";
const inter = Inter({ subsets:["latin"], variable:"--font-inter" });
const syne = Syne({ subsets:["latin"], variable:"--font-syne", weight:["600","700","800"] });
export const metadata: Metadata = { title:"Zolexora Admin", description:"Platform control center" };
export default function RootLayout({ children }:{ children:React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable}`}>
      <body className="bg-surface font-sans antialiased">
        <AdminShell>{children}</AdminShell>
        <Toaster position="top-right" toastOptions={{ style:{ fontFamily:"var(--font-inter)", fontSize:13, borderRadius:10 }}} />
      </body>
    </html>
  );
}
