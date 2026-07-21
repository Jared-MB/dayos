"use client";

import {
  DesktopApp,
  DesktopIcon,
  DesktopIconText,
  Window,
  WindowActions,
  WindowClose,
  WindowContent,
  WindowExpand,
  WindowHeader,
  WindowName,
} from "@dayos/core";
import {
  RoutedDesktop,
  useDynamicWindows,
  useWindowRoute,
  WindowRouteProvider,
} from "@dayos/next";
import { findDocument } from "./documents/documents";

/**
 * Each window's href is also its app id. Declaring them here is what lets the
 * server know which window the requested URL belongs to.
 *
 * `/documents/:file` is declared once and stands for a window per document.
 * Leaving it out wouldn't be a missing feature but the other reasonable
 * behavior: `/documents` would claim its subroutes, and a document would open
 * inside the list's window instead of beside it.
 */
const DOCUMENT_PATTERN = "/documents/:file";

const ROUTES = ["/", "/about", "/documents", DOCUMENT_PATTERN] as const;

/** The apps declared one by one; the pattern's are rendered per instance. */
const STATIC_ROUTES = ROUTES.filter((route) => route !== DOCUMENT_PATTERN);

const TITLES: Record<string, string> = {
  "/": "Welcome",
  "/about": "About",
  "/documents": "Documents",
};

function RoutedApp({ href }: { href: string }) {
  return (
    <DesktopApp id={href}>
      <AppShell href={href} />
    </DesktopApp>
  );
}

function AppShell({ href }: { href: string }) {
  const content = useWindowRoute();
  const title = TITLES[href] ?? href;

  return (
    <>
      <DesktopIcon className="icon">
        <span aria-hidden="true" className="icon-glyph">
          ▣
        </span>
        <DesktopIconText>{title}</DesktopIconText>
      </DesktopIcon>

      <Window className="window" keepMounted>
        <WindowHeader className="window-header">
          <WindowName className="window-title">{title}</WindowName>
          <WindowActions className="window-actions">
            <WindowExpand className="window-button">▢</WindowExpand>
            <WindowClose className="window-button">✕</WindowClose>
          </WindowActions>
        </WindowHeader>
        <WindowContent className="window-content">{content}</WindowContent>
      </Window>
    </>
  );
}

/**
 * One app per open document. The hrefs come from the desktop, so opening a
 * document is an ordinary `<Link>` and nothing here keeps a list of which ones
 * have been visited.
 */
function DocumentApps() {
  const windows = useDynamicWindows(DOCUMENT_PATTERN);

  // `params.file` rather than picking the href apart: the matching already
  // worked out which document this is.
  return windows.map(({ href, params }) => (
    <DesktopApp id={href} key={href}>
      <DocumentShell file={params.file} />
    </DesktopApp>
  ));
}

/**
 * No icon: a document has no standing place on the desktop. It's opened from
 * the list, and closing its window is the end of it.
 */
function DocumentShell({ file }: { file: string | undefined }) {
  const content = useWindowRoute();
  const title = findDocument(file)?.name ?? file;

  return (
    <Window
      className="window"
      defaultPosition={{ x: 220, y: 140 }}
      defaultSize={{ width: 520, height: 460 }}
      keepMounted
    >
      <WindowHeader className="window-header">
        <WindowName className="window-title">{title}</WindowName>
        <WindowActions className="window-actions">
          <WindowExpand className="window-button">▢</WindowExpand>
          <WindowClose className="window-button">✕</WindowClose>
        </WindowActions>
      </WindowHeader>
      <WindowContent className="window-content">{content}</WindowContent>
    </Window>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <WindowRouteProvider content={children} routes={ROUTES}>
      <RoutedDesktop className="desktop">
        {STATIC_ROUTES.map((href) => (
          <RoutedApp href={href} key={href} />
        ))}
        <DocumentApps />
      </RoutedDesktop>
    </WindowRouteProvider>
  );
}
