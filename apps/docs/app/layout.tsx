import type { Metadata } from "next";
import { THEME_SCRIPT } from "./_components/theme-toggle";
import { TopNav } from "./_components/top-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DayOS — A windowed desktop for React",
    template: "%s",
  },
  description:
    "A desktop with draggable windows for React: icons, windows you can move, resize and maximize, and a focus stack. No styling of its own and no knowledge of routes.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Before the first paint, so a reader who chose dark never sees the page
          in light first. `suppressHydrationWarning` on the <html> is the price:
          this script writes an attribute React did not render.
        */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: a constant string, and it has to run before paint */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <a className="skip-link" href="#doc-article">
          Skip to content
        </a>
        <TopNav />
        {children}
      </body>
    </html>
  );
}
