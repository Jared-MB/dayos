/**
 * The one place the docs site's own address is written down. Metadata, canonical
 * URLs and social cards all read from here, so moving the site to another domain
 * is editing this line — not hunting absolute URLs through the pages.
 */

import type { Locale } from "./i18n";

export const SITE_URL = "https://dayos.jared-mb.dev";

export const SITE_NAME = "DayOS";

/**
 * The tab title and the social card's heading, per language. The product name
 * stays where it is: it is a name, not a phrase, and translating it would give
 * the same library two.
 */
export const SITE_TITLE: Record<Locale, string> = {
  en: "DayOS — A windowed desktop for React",
  es: "DayOS — Un escritorio con ventanas para React",
};

export const SITE_DESCRIPTION: Record<Locale, string> = {
  en: "A desktop with draggable windows for React: icons, windows you can move, resize and maximize, and a focus stack. No styling of its own and no knowledge of routes.",
  es: "Un escritorio con ventanas arrastrables para React: iconos, ventanas que puedes mover, redimensionar y maximizar, y una pila de foco. Sin estilos propios y sin saber nada de rutas.",
};

/**
 * The line under the wordmark on the social card. Shorter than the description
 * above: it is set at 30px on a 1200×630 image, and the full sentence wraps to
 * four lines there.
 */
export const OG_TAGLINE: Record<Locale, string> = {
  en: "A desktop with draggable windows for React. No styling of its own, and no knowledge of routes.",
  es: "Un escritorio con ventanas arrastrables para React. Sin estilos propios y sin saber nada de rutas.",
};

export const REPOSITORY = "https://github.com/Jared-MB/dayos";

/** The example desktop that lives in the repo, linked from the docs. */
export const EXAMPLE_APP = `${REPOSITORY}/tree/main/apps/examples/nextjs`;
