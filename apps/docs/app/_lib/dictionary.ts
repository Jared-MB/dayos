/**
 * Every word the site says that is not part of a page's content: the chrome.
 *
 * Page prose lives in the `.mdx` files beside the routes, one per language,
 * because it is writing rather than labelling. What is here is the other half —
 * the button that copies, the heading above the contents, the label a screen
 * reader hears on an icon — and it is kept in one object per language so that a
 * missing translation is a type error rather than a word in the wrong language
 * on a page nobody checked.
 *
 * `Dictionary` below is the contract: every language is annotated with it, so
 * adding a string to one and forgetting the other stops the build rather than
 * shipping.
 */

import type { Locale } from "./i18n";

const en: Dictionary = {
  skipToContent: "Skip to content",

  nav: {
    homeLabel: "DayOS home",
    mainLabel: "Main",
    docs: "Docs",
    api: "API",
    example: "Example",
    github: "DayOS on GitHub",
  },

  language: {
    /** The switcher's own name, for the button a screen reader reads out. */
    label: "Language",
    /** Announced after the switch, since the page's words are what changed. */
    changed: "Language changed",
  },

  theme: {
    toLight: "Switch to light theme",
    toDark: "Switch to dark theme",
  },

  search: {
    trigger: "Search docs…",
    placeholder: "Search documentation…",
    dialogLabel: "Search documentation",
    /** Interpolated with the query the reader typed, quotes included. */
    empty: (query: string) => `No results for “${query}”`,
    escape: "Esc",
  },

  sidebar: {
    /** The drawer's toggle on a narrow screen. */
    menu: "Menu",
    label: "Documentation",
  },

  toc: {
    title: "On this page",
  },

  pagination: {
    label: "Pagination",
    previous: "← Previous",
    next: "Next →",
  },

  copyPage: {
    copy: "Copy page",
    /** Said once, to whoever is listening, when the copy lands. */
    copied: "Page copied as Markdown",
    more: "More ways to read this page",
    markdown: "View as Markdown",
    markdownDescription: "Open this page in Markdown",
    claude: "Open in Claude",
    chatgpt: "Open in ChatGPT",
    askDescription: "Ask questions about this page",
    /**
     * The sentence handed to an assistant along with the URL. It asks for the
     * page to be read first so the answer is about the current documentation
     * rather than about whatever the model remembers.
     */
    ask: (url: string) => `Read ${url} so I can ask questions about it.`,
  },

  code: {
    copy: "Copy code",
    copied: "Copied",
  },

  prose: {
    /** Before the value in a props table, where the column has no header. */
    default: "default",
    /** The `#` beside a heading, named for a reader who cannot see it. */
    headingAnchor: (heading: string) => `Link to ${heading}`,
  },

  /** The four columns a props table becomes once it is Markdown. */
  table: {
    name: "Name",
    type: "Type",
    default: "Default",
    description: "Description",
  },

  llms: {
    /** The two lines under the summary at the top of `llms.txt`. */
    everyPage: (fullUrl: string) =>
      [
        "Every page below is also served as Markdown at its own URL, and the whole",
        `documentation is available as one file at ${fullUrl}.`,
      ].join("\n"),
    optional: "Optional",
    source: "Source and issues",
    sourceDescription: "the repository, including the example desktop.",
    /** Offered at the foot of one language's index, pointing at the others. */
    otherLanguages: "This documentation in other languages",
  },
};

/**
 * The shape every language has to fill. Written out rather than inferred from
 * the English entry: inference would carry English's literal strings into the
 * type, and every translation would then have to be checked against the words
 * rather than against the keys.
 */
export type Dictionary = {
  readonly skipToContent: string;
  readonly nav: Readonly<
    Record<
      "homeLabel" | "mainLabel" | "docs" | "api" | "example" | "github",
      string
    >
  >;
  readonly language: Readonly<Record<"label" | "changed", string>>;
  readonly theme: Readonly<Record<"toLight" | "toDark", string>>;
  readonly search: {
    readonly trigger: string;
    readonly placeholder: string;
    readonly dialogLabel: string;
    readonly empty: (query: string) => string;
    readonly escape: string;
  };
  readonly sidebar: Readonly<Record<"menu" | "label", string>>;
  readonly toc: Readonly<Record<"title", string>>;
  readonly pagination: Readonly<Record<"label" | "previous" | "next", string>>;
  readonly copyPage: {
    readonly copy: string;
    readonly copied: string;
    readonly more: string;
    readonly markdown: string;
    readonly markdownDescription: string;
    readonly claude: string;
    readonly chatgpt: string;
    readonly askDescription: string;
    readonly ask: (url: string) => string;
  };
  readonly code: Readonly<Record<"copy" | "copied", string>>;
  readonly prose: {
    readonly default: string;
    readonly headingAnchor: (heading: string) => string;
  };
  readonly table: Readonly<
    Record<"name" | "type" | "default" | "description", string>
  >;
  readonly llms: {
    readonly everyPage: (fullUrl: string) => string;
    readonly optional: string;
    readonly source: string;
    readonly sourceDescription: string;
    readonly otherLanguages: string;
  };
};

const es: Dictionary = {
  skipToContent: "Saltar al contenido",

  nav: {
    homeLabel: "Inicio de DayOS",
    mainLabel: "Principal",
    docs: "Documentación",
    api: "API",
    example: "Ejemplo",
    github: "DayOS en GitHub",
  },

  language: {
    label: "Idioma",
    changed: "Idioma cambiado",
  },

  theme: {
    toLight: "Cambiar al tema claro",
    toDark: "Cambiar al tema oscuro",
  },

  search: {
    trigger: "Buscar en la documentación…",
    placeholder: "Buscar en la documentación…",
    dialogLabel: "Buscar en la documentación",
    empty: (query: string) => `Sin resultados para «${query}»`,
    escape: "Esc",
  },

  sidebar: {
    menu: "Menú",
    label: "Documentación",
  },

  toc: {
    title: "En esta página",
  },

  pagination: {
    label: "Paginación",
    previous: "← Anterior",
    next: "Siguiente →",
  },

  copyPage: {
    copy: "Copiar página",
    copied: "Página copiada como Markdown",
    more: "Otras formas de leer esta página",
    markdown: "Ver como Markdown",
    markdownDescription: "Abre esta página en Markdown",
    claude: "Abrir en Claude",
    chatgpt: "Abrir en ChatGPT",
    askDescription: "Haz preguntas sobre esta página",
    ask: (url: string) =>
      `Lee ${url} para que pueda hacerte preguntas sobre él.`,
  },

  code: {
    copy: "Copiar código",
    copied: "Copiado",
  },

  prose: {
    default: "por defecto",
    headingAnchor: (heading: string) => `Enlace a ${heading}`,
  },

  table: {
    name: "Nombre",
    type: "Tipo",
    default: "Por defecto",
    description: "Descripción",
  },

  llms: {
    everyPage: (fullUrl: string) =>
      [
        "Cada página de abajo se sirve también como Markdown en su propia URL, y toda",
        `la documentación está disponible en un solo archivo en ${fullUrl}.`,
      ].join("\n"),
    optional: "Opcional",
    source: "Código y incidencias",
    sourceDescription: "el repositorio, incluido el escritorio de ejemplo.",
    otherLanguages: "Esta documentación en otros idiomas",
  },
};

const DICTIONARIES: Record<Locale, Dictionary> = { en, es };

export const dictionary = (locale: Locale): Dictionary => DICTIONARIES[locale];
