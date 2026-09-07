import type { Metadata } from "next";
import { THEME_SCRIPT } from "./_components/theme-toggle";
import { TopNav } from "./_components/top-nav";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from "./_lib/site";
import "./globals.css";

export const metadata: Metadata = {
  // Without this the relative URLs below stay relative, and a link shared
  // anywhere off the site loses its card.
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s",
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "./",
  },
  // No title or description here on purpose: naming them would freeze the
  // root's pair onto every page's card. Left out, each page's own title and
  // description fill them in.
  openGraph: {
    type: "website",
    siteName: "DayOS",
    url: "./",
  },
  twitter: {
    card: "summary_large_image",
  },
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
