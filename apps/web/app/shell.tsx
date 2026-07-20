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
  useWindowRoute,
  WindowRouteProvider,
} from "@dayos/next";

/**
 * Each window's href is also its app id. Declaring them here is what lets the
 * server know which window the requested URL belongs to.
 */
const ROUTES = ["/", "/about"] as const;

const TITLES: Record<string, string> = {
  "/": "Welcome",
  "/about": "About",
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

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <WindowRouteProvider content={children} routes={ROUTES}>
      <RoutedDesktop className="desktop">
        {ROUTES.map((href) => (
          <RoutedApp href={href} key={href} />
        ))}
      </RoutedDesktop>
    </WindowRouteProvider>
  );
}
