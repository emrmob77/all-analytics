import type { Metadata } from "next";
import { ThemeProvider } from "@/contexts/ThemeContext";

import "./globals.css";

export const metadata: Metadata = {
  title: "Allanalytics",
  description: "Allanalytics UI dashboard"
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
