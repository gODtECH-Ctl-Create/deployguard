import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeployGuard",
  description: "A clear view of your deployment health."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}