import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MarkovMate - AI-Powered Task Optimizer",
  description: "Optimize your daily tasks using Markov chains and AI",
  manifest: "/manifest.json",
  themeColor: "#000000",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
