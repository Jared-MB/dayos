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
  type RouteParams,
  useDynamicWindows,
  useWindowRoute,
  WindowRouteProvider,
} from "@dayos/next";
import { findDocument } from "./documents/documents";
import { findProject, findTask } from "./projects/projects";

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

/**
 * Projects nest three deep, with a static route beside the dynamic one at each
 * level below the first: `/projects/archive` competes with `/projects/:project`
 * and `/projects/:project/new` with `/projects/:project/:task`. The desktop
 * takes the more specific route, so the literal wins at the depth it appears.
 */
const PROJECT_PATTERN = "/projects/:project";
const NEW_TASK_PATTERN = "/projects/:project/new";
const TASK_PATTERN = "/projects/:project/:task";

/**
 * A pattern stands for as many windows as URLs visited, so it can't be rendered
 * from the list the way a plain route can. `/projects/:project/new` belongs
 * here despite ending in a literal: it still has a param, so it's one window
 * per project rather than one window.
 */
const PATTERNS: readonly string[] = [
  DOCUMENT_PATTERN,
  PROJECT_PATTERN,
  NEW_TASK_PATTERN,
  TASK_PATTERN,
];

const ROUTES = [
  "/",
  "/about",
  "/documents",
  DOCUMENT_PATTERN,
  "/projects",
  "/projects/archive",
  PROJECT_PATTERN,
  NEW_TASK_PATTERN,
  TASK_PATTERN,
] as const;

/** The apps declared one by one; the patterns' are rendered per instance. */
const STATIC_ROUTES = ROUTES.filter((route) => !PATTERNS.includes(route));

const TITLES: Record<string, string> = {
  "/": "Welcome",
  "/about": "About",
  "/documents": "Documents",
  "/projects": "Projects",
  "/projects/archive": "Archive",
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
 * One app per open instance of a pattern. The hrefs come from the desktop, so
 * opening one is an ordinary `<Link>` and nothing here keeps a list of which
 * URLs have been visited.
 */
function PatternApps({
  pattern,
  title,
  ...geometry
}: {
  pattern: string;
  /**
   * The window's name, from the params the pattern filled in rather than from
   * the href taken apart again — the matching already worked out which thing
   * this is.
   */
  title: (params: RouteParams) => string | undefined;
} & Pick<
  React.ComponentProps<typeof Window>,
  "defaultPosition" | "defaultSize"
>) {
  const windows = useDynamicWindows(pattern);

  return windows.map(({ href, params }) => (
    <DesktopApp id={href} key={href}>
      <PatternShell title={title(params)} {...geometry} />
    </DesktopApp>
  ));
}

/**
 * No icon: a document or a task has no standing place on the desktop. It's
 * opened from the list above it, and closing its window is the end of it.
 */
function PatternShell({
  title,
  ...geometry
}: { title: string | undefined } & Pick<
  React.ComponentProps<typeof Window>,
  "defaultPosition" | "defaultSize"
>) {
  const content = useWindowRoute();

  return (
    <Window className="window" keepMounted {...geometry}>
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
        <PatternApps
          defaultPosition={{ x: 220, y: 140 }}
          defaultSize={{ width: 520, height: 460 }}
          pattern={DOCUMENT_PATTERN}
          title={(params) => findDocument(params.file)?.name ?? params.file}
        />
        {/*
          The three levels are staggered so opening one after another leaves all
          of them visible at once, which is the thing worth looking at.
        */}
        <PatternApps
          defaultPosition={{ x: 180, y: 120 }}
          defaultSize={{ width: 520, height: 400 }}
          pattern={PROJECT_PATTERN}
          title={(params) =>
            findProject(params.project)?.name ?? params.project
          }
        />
        <PatternApps
          defaultPosition={{ x: 260, y: 200 }}
          defaultSize={{ width: 480, height: 340 }}
          pattern={NEW_TASK_PATTERN}
          title={(params) =>
            `New task — ${findProject(params.project)?.name ?? params.project}`
          }
        />
        <PatternApps
          defaultPosition={{ x: 300, y: 240 }}
          defaultSize={{ width: 480, height: 340 }}
          pattern={TASK_PATTERN}
          title={(params) =>
            findTask(params.project, params.task)?.name ?? params.task
          }
        />
      </RoutedDesktop>
    </WindowRouteProvider>
  );
}
