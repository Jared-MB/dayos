/**
 * The one place the docs' shape is written down. The sidebar, the previous/next
 * footer and the search index all read from here, so adding a page is adding a
 * line to this file plus the route it names — and the three of them can't drift
 * apart the way they would if each kept its own list.
 *
 * Every language keeps its own list, but they are lists of the same pages in
 * the same order: an `href` is language-free (`/docs/windows`, never
 * `/es/docs/windows`) and only becomes an address through `localePath`. That is
 * what lets the language switcher offer the reader the page they are on rather
 * than dropping them at the index, and what keeps `siblings` walking the same
 * route in both languages.
 */

import { type Locale, localePath } from "./i18n";
import { SITE_URL } from "./site";

export type DocPage = {
  /** Language-free, and the same string in every language's list. */
  href: string;
  title: string;
  /** Shown under the title in search results, and as the page's meta description. */
  description?: string;
  /** Extra words a reader might search for that don't appear in the title. */
  keywords?: readonly string[];
};

export type DocSection = {
  title: string;
  pages: readonly DocPage[];
};

const EN: readonly DocSection[] = [
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

/**
 * The Spanish list keeps the English keywords alongside the Spanish ones: the
 * words a reader searches for here are component names and prop names, and
 * those are English whichever language the prose is in. Someone typing
 * "keepMounted" or "ventanas" should land on the same page.
 */
const ES: readonly DocSection[] = [
  {
    title: "Primeros pasos",
    pages: [
      {
        href: "/docs",
        title: "Introducción",
        description: "Un escritorio con ventanas arrastrables para React",
        keywords: ["resumen", "qué es dayos", "headless", "sin estilos"],
      },
      {
        href: "/docs/installation",
        title: "Instalación",
        keywords: [
          "instalar",
          "npm",
          "pnpm",
          "yarn",
          "configuración",
          "requisitos",
        ],
      },
      {
        href: "/docs/quick-start",
        title: "Inicio rápido",
        description:
          "Construye un escritorio con dos ventanas, de un componente vacío a algo que puedes arrastrar.",
        keywords: [
          "tutorial",
          "primer escritorio",
          "ejemplo",
          "empezar",
          "getting started",
        ],
      },
    ],
  },
  {
    title: "Construye tu escritorio",
    pages: [
      {
        href: "/docs/desktop-and-apps",
        title: "Escritorio y apps",
        description:
          "El contenedor que gestiona las ventanas abiertas, y la app que une un icono con una ventana.",
        keywords: [
          "Desktop",
          "DesktopApp",
          "DesktopIcon",
          "id",
          "apilado",
          "escritorio",
        ],
      },
      {
        href: "/docs/windows",
        title: "Ventanas",
        description:
          "El marco de la ventana: geometría, arrastre, redimensionado, maximizado y las piezas que lo forman.",
        keywords: [
          "Window",
          "WindowHeader",
          "WindowContent",
          "redimensionar",
          "arrastrar",
          "maximizar",
          "keepMounted",
        ],
      },
      {
        href: "/docs/styling",
        title: "Estilos",
        description:
          "DayOS no incluye CSS propio. Lo que sí define, por qué, y cómo dar estilo al resto.",
        keywords: [
          "css",
          "tailwind",
          "classname",
          "atributos de datos",
          "tema",
        ],
      },
      {
        href: "/docs/composition",
        title: "Composición",
        description:
          "La render prop que cambia el elemento que emite un componente sin perder su comportamiento.",
        keywords: ["render", "asChild", "slot", "Link", "polimórfico"],
      },
      {
        href: "/docs/state",
        title: "Controlar el estado",
        description:
          "Abre ventanas sin control externo, o gobiérnalas desde fuera para persistencia, un dock o atajos.",
        keywords: [
          "controlado",
          "no controlado",
          "openWindows",
          "defaultOpen",
          "useDesktop",
        ],
      },
      {
        href: "/docs/server-rendering",
        title: "Renderizado en servidor",
        description:
          "Cómo llega al HTML una ventana abierta, y por qué no salta cuando React toma el control.",
        keywords: [
          "ssr",
          "hidratación",
          "server components",
          "parpadeo",
          "estático",
        ],
      },
    ],
  },
  {
    title: "Rutas",
    pages: [
      {
        href: "/docs/routing",
        title: "Ventanas con URL",
        description:
          "Dale a cada ventana una ruta propia con el adaptador del App Router de Next.",
        keywords: ["@dayos/next", "next", "app router", "url", "enlace"],
      },
      {
        href: "/docs/routing/dynamic-routes",
        title: "Rutas dinámicas",
        description:
          "Una sola declaración que vale por una ventana por documento, tarea o registro.",
        keywords: [
          "patrón",
          "params",
          "useDynamicWindows",
          "slug",
          ":file",
          "dinámicas",
        ],
      },
      {
        href: "/docs/routing/matching",
        title: "Coincidencia de rutas",
        description:
          "A qué ventana pertenece una URL cuando varias rutas podrían reclamarla.",
        keywords: [
          "especificidad",
          "subrutas",
          "anidadas",
          "precedencia",
          "404",
        ],
      },
    ],
  },
  {
    title: "Referencia de la API",
    pages: [
      {
        href: "/docs/api/core",
        title: "@dayos/core",
        description:
          "Todos los componentes, hooks y props que exporta el núcleo, con sus valores por defecto.",
        keywords: ["referencia", "props", "tipos", "hooks", "windowRect"],
      },
      {
        href: "/docs/api/next",
        title: "@dayos/next",
        description:
          "Las cuatro exportaciones del adaptador de Next, y de qué se ocupa cada una.",
        keywords: [
          "referencia",
          "WindowRouteProvider",
          "RoutedDesktop",
          "useWindowRoute",
        ],
      },
    ],
  },
];

const SECTIONS: Record<Locale, readonly DocSection[]> = { en: EN, es: ES };

export const sections = (locale: Locale) => SECTIONS[locale];

const flatten = (list: readonly DocSection[]) =>
  list.flatMap((section) => section.pages);

/** Every page in sidebar order, which is also the order the footer walks. */
const PAGES: Record<Locale, readonly DocPage[]> = {
  en: flatten(EN),
  es: flatten(ES),
};

export const pages = (locale: Locale) => PAGES[locale];

/**
 * The hrefs themselves, in reading order. The routes and the sitemap need the
 * list of pages without caring which language they are read in, and taking it
 * from one language rather than from a fourth list is what makes a page missing
 * from a translation a build error instead of a hole in the sitemap.
 */
export const HREFS: readonly string[] = flatten(EN).map((page) => page.href);

export const findPage = (locale: Locale, href: string) =>
  PAGES[locale].find((page) => page.href === href);

/**
 * The pages either side of this one. Reading the docs front to back is a real
 * way to use them, so every page ends with the way onward.
 */
export const siblings = (locale: Locale, href: string) => {
  const list = PAGES[locale];
  const index = list.findIndex((page) => page.href === href);

  if (index === -1) return { previous: undefined, next: undefined };

  return { previous: list[index - 1], next: list[index + 1] };
};

/** Where a page lives in a given language, ready to put in an `href`. */
export const pageHref = (locale: Locale, href: string) =>
  localePath(locale, href);

/**
 * Where a page's Markdown twin lives: the same path with `.md` on the end, so
 * `/docs` becomes `/docs.md` and every other page gains a sibling of its own.
 * It lives here rather than beside the routes that serve it because the button
 * offering it runs in the browser, and must not drag the pages in with it.
 */
export const markdownHref = (locale: Locale, href: string) =>
  `${localePath(locale, href)}.md`;

export const markdownUrl = (locale: Locale, href: string) =>
  new URL(markdownHref(locale, href), SITE_URL).toString();

/** The section a page belongs to, for the breadcrumb above its title. */
export const sectionOf = (locale: Locale, href: string) =>
  SECTIONS[locale].find((section) =>
    section.pages.some((page) => page.href === href),
  );
