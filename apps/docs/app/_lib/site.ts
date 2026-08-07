/**
 * The one place the docs site's own address is written down. Metadata, canonical
 * URLs and social cards all read from here, so moving the site to another domain
 * is editing this line — not hunting absolute URLs through the pages.
 */

export const SITE_URL = "https://dayos.jared-mb.dev";

export const SITE_NAME = "DayOS";

export const SITE_TITLE = "DayOS — A windowed desktop for React";

export const SITE_DESCRIPTION =
  "A desktop with draggable windows for React: icons, windows you can move, resize and maximize, and a focus stack. No styling of its own and no knowledge of routes.";

export const REPOSITORY = "https://github.com/Jared-MB/dayos";

/** The example desktop that lives in the repo, linked from the docs. */
export const EXAMPLE_APP = `${REPOSITORY}/tree/main/apps/examples/nextjs`;
