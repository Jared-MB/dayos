import {
  DesktopApp,
  DesktopIcon,
  Window,
  WindowClose,
  WindowContent,
  WindowHeader,
  WindowName,
} from "@dayos/core";
import { useWindowRoute } from "../src/index";

/**
 * Includes `/` and `/docs` + `/docs/api` on purpose: those are the two cases
 * where route matching can break without anything else noticing.
 */
export const TEST_ROUTES = ["/", "/docs", "/docs/api", "/github"];

/** Per-window marker, so we can assert which one opened and not just that one did. */
export const windowMarker = (href: string) => `WINDOW(${href})`;

export function RoutedApp({
  href,
  ...props
}: { href: string } & Pick<
  React.ComponentProps<typeof Window>,
  "defaultSize" | "defaultPosition"
>) {
  return (
    <DesktopApp id={href}>
      <RoutedAppShell href={href} {...props} />
    </DesktopApp>
  );
}

function RoutedAppShell({
  href,
  ...props
}: { href: string } & Pick<
  React.ComponentProps<typeof Window>,
  "defaultSize" | "defaultPosition"
>) {
  const content = useWindowRoute();

  return (
    <>
      <DesktopIcon>ICON({href})</DesktopIcon>
      <Window {...props}>
        <WindowHeader>
          <WindowName>{windowMarker(href)}</WindowName>
          <WindowClose aria-label={`close ${href}`}>x</WindowClose>
        </WindowHeader>
        <WindowContent>{content}</WindowContent>
      </Window>
    </>
  );
}
