/**
 * The one place the docs' shape is written down. The sidebar, the previous/next
 * footer and the search index all read from here, so adding a page is adding a
 * line to this file plus the route it names — and the three of them can't drift
 * apart the way they would if each kept its own list.
 */

import { SITE_URL } from "./site";

export type DocPage = {
  href: string;
  title: string;
  /** Shown under the title in search results, and as the page's meta description. */
  description: string;
  /** Extra words a reader might search for that don't appear in the title. */
  keywords?: readonly string[];
};

export type DocSection = {
  title: string;
  pages: readonly DocPage[];
};

export const SECTIONS: readonly DocSection[] = [
  {
    title: "Getting Started",
    pages: [
      {
        href: "/docs",
        title: "Introduction",
        description:
          "A desktop with draggable windows for React, with no opinion on styling or routing.",
        keywords: ["overview", "what is dayos", "headless"],
      },
      {
        href: "/docs/installation",
        title: "Installation",
        description:
          "Add @dayos/core to a React app, and @dayos/next if you want windows with URLs.",
        keywords: ["install", "npm", "pnpm", "yarn", "setup", "requirements"],
      },
      {
        href: "/docs/quick-start",
        title: "Quick Start",
        description:
          "Build a desktop with two windows, from an empty component to something you can drag.",
        keywords: ["tutorial", "first desktop", "example", "getting started"],
      },
    ],
  },
  {
    title: "Building Your Desktop",
    pages: [
      {
        href: "/docs/desktop-and-apps",
        title: "Desktop and Apps",
        description:
          "The container that owns the open windows, and the app that ties an icon to a window.",
        keywords: ["Desktop", "DesktopApp", "DesktopIcon", "id", "stacking"],
      },
      {
        href: "/docs/windows",
        title: "Windows",
        description:
          "The window frame: geometry, dragging, resizing, maximizing and the parts it is built from.",
        keywords: [
          "Window",
          "WindowHeader",
          "WindowContent",
          "resize",
          "drag",
          "maximize",
          "keepMounted",
        ],
      },
      {
        href: "/docs/styling",
        title: "Styling",
        description:
          "DayOS ships no CSS of its own. What it does set, why, and how to style the rest.",
        keywords: ["css", "tailwind", "classname", "data attributes", "theme"],
      },
      {
        href: "/docs/composition",
        title: "Composition",
        description:
          "The render prop that swaps out the element a component emits while keeping its behavior.",
        keywords: ["render", "asChild", "slot", "Link", "polymorphic"],
      },
      {
        href: "/docs/state",
        title: "Controlling State",
        description:
          "Open windows uncontrolled, or drive them from outside for persistence, a dock or shortcuts.",
        keywords: [
          "controlled",
          "uncontrolled",
          "openWindows",
          "defaultOpen",
          "useDesktop",
        ],
      },
      {
        href: "/docs/server-rendering",
        title: "Server Rendering",
        description:
          "How an open window reaches the HTML, and why it does not jump when React takes over.",
        keywords: ["ssr", "hydration", "server components", "flash", "static"],
      },
    ],
  },
  {
    title: "Routing",
    pages: [
      {
        href: "/docs/routing",
        title: "Windows with URLs",
        description:
          "Give every window a route of its own with the Next App Router adapter.",
        keywords: ["@dayos/next", "next", "app router", "url", "link"],
      },
      {
        href: "/docs/routing/dynamic-routes",
        title: "Dynamic Routes",
        description:
          "One declaration that stands for a window per document, task or record.",
        keywords: ["pattern", "params", "useDynamicWindows", "slug", ":file"],
      },
      {
        href: "/docs/routing/matching",
        title: "Route Matching",
        description:
          "Which window a URL belongs to when several routes could claim it.",
        keywords: ["specificity", "subroutes", "nested", "precedence", "404"],
      },
    ],
  },
  {
    title: "API Reference",
    pages: [
      {
        href: "/docs/api/core",
        title: "@dayos/core",
        description:
          "Every component, hook and prop the core exports, with its defaults.",
        keywords: ["reference", "props", "types", "hooks", "windowRect"],
      },
      {
        href: "/docs/api/next",
        title: "@dayos/next",
        description:
          "The four exports of the Next adapter, and what each of them owns.",
        keywords: [
          "reference",
          "WindowRouteProvider",
          "RoutedDesktop",
          "useWindowRoute",
        ],
      },
    ],
  },
];

/** Every page in sidebar order, which is also the order the footer walks. */
export const PAGES: readonly DocPage[] = SECTIONS.flatMap(
  (section) => section.pages,
);

export const findPage = (href: string) =>
  PAGES.find((page) => page.href === href);

/**
 * The pages either side of this one. Reading the docs front to back is a real
 * way to use them, so every page ends with the way onward.
 */
export const siblings = (href: string) => {
  const index = PAGES.findIndex((page) => page.href === href);

  if (index === -1) return { previous: undefined, next: undefined };

  return { previous: PAGES[index - 1], next: PAGES[index + 1] };
};

/**
 * Where a page's Markdown twin lives: the same path with `.md` on the end, so
 * `/docs` becomes `/docs.md` and every other page gains a sibling of its own.
 * It lives here rather than beside the routes that serve it because the button
 * offering it runs in the browser, and must not drag the pages in with it.
 */
export const markdownHref = (href: string) => `${href}.md`;

export const markdownUrl = (href: string) =>
  new URL(markdownHref(href), SITE_URL).toString();

/** The section a page belongs to, for the breadcrumb above its title. */
export const sectionOf = (href: string) =>
  SECTIONS.find((section) => section.pages.some((page) => page.href === href));
