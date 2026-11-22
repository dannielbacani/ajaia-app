import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Ajaia Docs — AI-Native Collaborative Editor",
  description:
    "A lightweight collaborative document editor inspired by Google Docs, built with TipTap, Next.js, and PostgreSQL.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#f8f9fa] text-gray-900">
        <UserProvider>
          <Navbar />
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
