import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "./shell";

export const metadata: Metadata = {
  title: "DayOS",
  description: "A windowed desktop for React.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {/*
          The layout's `children` is the current route's content, and it goes in
          as a prop rather than as a child: the window it belongs to claims it
          from the inside instead of it sitting loose on the desktop.
        */}
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
