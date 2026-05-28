import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "NORC Budget",
  description: "Budget, kassaflöde och likviditet för NORC.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}
