import { CodeBlock } from "../../../_components/code";
import { DocPage, docMetadata } from "../../../_components/doc-page";
import { Callout, Code, H2, H3, PropsTable } from "../../../_components/prose";

const HREF = "/docs/api/core";

export const metadata = docMetadata(HREF);

/** Shared by every component that takes one, rather than repeated eleven times. */
const renderRow = (element: string) => ({
  name: "render",
  type: `RenderProp<React.ComponentProps<"${element}">>`,
  description: `Replaces the <${element}> this component emits, keeping its behavior.`,
});

const passthroughRow = (element: string) => ({
  name: "...props",
  type: `React.ComponentProps<"${element}">`,
  description: `Everything else is forwarded to the <${element}>. className is merged, style is merged key by key, and handlers are composed.`,
});

export default function Page() {
  return (
    <DocPage href={HREF}>
      <p>
        Every export of <Code>@dayos/core</Code>. The package is client-side
        throughout — its entry carries <Code>&quot;use client&quot;</Code> — and
        has React 19 as a peer dependency.
      </p>

      <CodeBlock>{`import {
  Desktop,
  DesktopApp,
  DesktopIcon,
  DesktopIconText,
  Window,
  WindowAction,
  WindowActions,
  WindowClose,
  WindowContent,
  WindowExpand,
  WindowHeader,
  WindowName,
  useDesktop,
  useDesktopApp,
  useOptionalDesktopApp,
  windowRect,
  type RenderProp,
} from "@dayos/core";`}</CodeBlock>

      <H2>Desktop</H2>

      <p>
        The container, and the owner of which windows are open. Renders a{" "}
        <Code>div</Code>.
      </p>

      <PropsTable
        rows={[
          {
            name: "children",
            type: "React.ReactNode",
            description: "Apps, and anything else that belongs on the desktop.",
          },
          {
            name: "wallpaper",
            type: "string",
            description:
              "Shorthand for a background image: sets backgroundImage, size cover, position center, no repeat. For a gradient, use CSS instead.",
          },
          {
            name: "openWindows",
            type: "string[]",
            description:
              "Controlled open windows, in stacking order — the last is in front. Supplying this makes the desktop controlled.",
          },
          {
            name: "defaultOpenWindows",
            type: "string[]",
            default: "[]",
            description:
              "Uncontrolled initial state. The only way to have a window open in the server HTML.",
          },
          {
            name: "onOpenWindowsChange",
            type: "(openWindows: string[]) => void",
            description:
              "Fires on every open, close and focus change, whatever caused it.",
          },
          renderRow("div"),
          passthroughRow("div"),
        ]}
      />

      <H3>Inline styles it sets</H3>

      <CodeBlock language="css">{`position: relative;
overflow: hidden;`}</CodeBlock>

      {/*
        Qualified rather than a bare "Data attributes", which the Window
        section also wants: two headings with the same text are two identical
        slugs, and the anchors stop being able to tell them apart.
      */}
      <H3>Desktop data attributes</H3>

      <PropsTable
        rows={[
          {
            name: "data-interacting",
            type: "present | absent",
            description: "Present while a window is being dragged or resized.",
          },
        ]}
      />

      <H2>DesktopApp</H2>

      <p>
        One app: an icon and a window tied together by an id. Renders no element
        of its own.
      </p>

      <PropsTable
        rows={[
          {
            name: "children",
            type: "React.ReactNode",
            description: "Required. Typically a DesktopIcon and a Window.",
          },
          {
            name: "id",
            type: "string",
            default: "useId()",
            description:
              "The window's identity, and with @dayos/next its href too. Two apps sharing an id is an error, logged in development.",
          },
          {
            name: "defaultOpen",
            type: "boolean",
            default: "false",
            description:
              "Opens the window on mount and never touches it again. Runs in an effect, so it does not reach the server HTML.",
          },
          {
            name: "open",
            type: "boolean",
            description:
              "Controlled: keeps the window in sync with this value in both directions.",
          },
          {
            name: "onOpenChange",
            type: "(open: boolean) => void",
            description:
              "Fires wherever the change came from — a button, a route, a shortcut, another window.",
          },
        ]}
      />

      <H2>DesktopIcon</H2>

      <p>
        A <Code>button</Code> that opens its app&rsquo;s window on double click,
        or on <kbd>Enter</kbd> / <kbd>Space</kbd>. Your{" "}
        <Code>onDoubleClick</Code> and <Code>onKeyDown</Code> run first and can
        cancel the open with <Code>preventDefault()</Code>.
      </p>

      <PropsTable rows={[renderRow("button"), passthroughRow("button")]} />

      <H2>DesktopIconText</H2>

      <p>
        The icon&rsquo;s label, as a <Code>span</Code>. It exists so the label
        is a styleable element rather than a bare text node.
      </p>

      <PropsTable rows={[renderRow("span"), passthroughRow("span")]} />

      <H2>Window</H2>

      <p>
        The frame. Portals into the desktop once mounted; renders in place, and
        without dragging, when there is no desktop node yet — the server render
        and the hydration render.
      </p>

      <PropsTable
        rows={[
          {
            name: "children",
            type: "React.ReactNode",
            description: "Required. The header and the content.",
          },
          {
            name: "defaultSize",
            type: "{ width: number; height: number }",
            default: "70% of the desktop",
            description:
              "Initial size in pixels, clamped to the desktop. Read once, when the window first mounts.",
          },
          {
            name: "defaultPosition",
            type: "{ x: number; y: number }",
            default: "centered, cascading",
            description:
              "Initial position in pixels. Supplying it opts the window out of the cascade.",
          },
          {
            name: "minWidth",
            type: "number",
            default: "240",
            description: "Resize floor.",
          },
          {
            name: "minHeight",
            type: "number",
            default: "120",
            description: "Resize floor.",
          },
          {
            name: "cascadeOffset",
            type: "number",
            default: "32",
            description:
              "Pixels each successive window is offset by. The cascade wraps rather than running off screen.",
          },
          {
            name: "keepMounted",
            type: "boolean",
            default: "false",
            description:
              "Keeps the window in the tree while closed, so its state survives. It still only mounts the first time it opens.",
          },
          {
            name: "closeOnEscape",
            type: "boolean",
            default: "true",
            description:
              "Escape closes the focused window. A handler that calls preventDefault() also stops it.",
          },
          {
            name: "dragCancel",
            type: "string",
            default: '"button, a, input, select, textarea"',
            description:
              "Selector for elements that do not start a drag. Without it, clicking a header button would also begin dragging.",
          },
          {
            name: "className",
            type: "string",
            description: "Applied to the frame.",
          },
          {
            name: "style",
            type: "React.CSSProperties",
            description: "Merged into the frame's own positioning styles.",
          },
        ]}
      />

      <Callout>
        <p>
          <Code>Window</Code> does not take a <Code>render</Code> prop. The
          frame is the drag and resize implementation, and swapping the element
          out from under it is not something it can honour.
        </p>
      </Callout>

      <H3>Window data attributes</H3>

      <PropsTable
        rows={[
          {
            name: "data-window",
            type: "present | absent",
            description:
              "On the static frame only — the one that appears in the server HTML.",
          },
          {
            name: "data-maximized",
            type: "present | absent",
            description: "Present while the window fills the desktop.",
          },
        ]}
      />

      <H2>WindowHeader</H2>

      <p>
        The title bar and the drag handle, as a <Code>header</Code>. It always
        carries the <Code>window-drag-handle</Code> class, which is how the drag
        implementation recognises it — that is machinery, not styling, and it
        merges with whatever <Code>className</Code> you pass.
      </p>

      <p>
        Carries <Code>data-maximized</Code> while the window is maximized.
      </p>

      <PropsTable rows={[renderRow("header"), passthroughRow("header")]} />

      <H2>WindowName</H2>

      <p>
        The window&rsquo;s title, as an <Code>h2</Code>. It supplies the id the
        dialog is labelled by, so every window should have one.
      </p>

      <PropsTable rows={[renderRow("h2"), passthroughRow("h2")]} />

      <H2>WindowContent</H2>

      <p>
        The scrollable body, as a <Code>div</Code>.
      </p>

      <CodeBlock language="css">{`flex: 1 1 0%;
min-height: 0;
overflow: auto;`}</CodeBlock>

      <PropsTable rows={[renderRow("div"), passthroughRow("div")]} />

      <H2>WindowActions</H2>

      <p>
        The control group, as a <Code>div</Code>. Purely a container — it adds
        no behavior.
      </p>

      <PropsTable rows={[renderRow("div"), passthroughRow("div")]} />

      <H2>WindowAction</H2>

      <p>
        A generic control button, for anything that is not maximize or close.
      </p>

      <PropsTable rows={[renderRow("button"), passthroughRow("button")]} />

      <H2>WindowExpand</H2>

      <p>
        Maximizes and restores. It is <Code>aria-pressed</Code> when maximized,
        and its accessible name changes with its state — one label could only
        describe half of what it does.
      </p>

      <PropsTable
        rows={[
          {
            name: "maximizeLabel",
            type: "string",
            default: '"Maximize window"',
            description:
              "The accessible name while the window is not maximized.",
          },
          {
            name: "restoreLabel",
            type: "string",
            default: '"Restore window"',
            description: "The accessible name while it is.",
          },
          renderRow("button"),
          passthroughRow("button"),
        ]}
      />

      <H2>WindowClose</H2>

      <p>
        Closes the window, through the app&rsquo;s <Code>close</Code> so the
        change also reaches whoever controls it from outside. Labelled{" "}
        <Code>&quot;Close window&quot;</Code> unless you pass your own{" "}
        <Code>aria-label</Code>.
      </p>

      <PropsTable rows={[renderRow("button"), passthroughRow("button")]} />

      <H2>useDesktop</H2>

      <p>
        The desktop&rsquo;s state and controls. Throws outside{" "}
        <Code>Desktop</Code>.
      </p>

      <CodeBlock>{`const {
  desktopEl,        // HTMLDivElement | null — null until mount
  openWindows,      // string[] — stacking order, last is in front
  activeWindowId,   // string | undefined
  openWindow,       // (id: string) => void — opens, or brings to front
  closeWindow,      // (id: string) => void
  focusWindow,      // (id: string) => void — front without opening
  isInteracting,    // boolean — a drag or resize is in progress
  setInteracting,   // (interacting: boolean) => void
} = useDesktop();`}</CodeBlock>

      <H2>useDesktopApp</H2>

      <p>
        The containing app. Throws outside <Code>DesktopApp</Code>.
      </p>

      <CodeBlock>{`const {
  id,             // string
  isWindowOpen,   // boolean
  open,           // () => void
  close,          // () => void
  focus,          // () => void
} = useDesktopApp();`}</CodeBlock>

      <H2>useOptionalDesktopApp</H2>

      <p>
        The same, returning <Code>null</Code> outside a <Code>DesktopApp</Code>{" "}
        instead of throwing. For components that are shared between windowed and
        non-windowed contexts.
      </p>

      <H2>windowRect</H2>

      <p>
        Where a freshly opened window goes. Pure, and exported because it is the
        only initial-position maths there is — useful if you need to predict a
        position rather than read it back.
      </p>

      <CodeBlock>{`function windowRect(options: {
  desktopWidth: number;
  desktopHeight: number;
  defaultSize?: { width: number; height: number };
  defaultPosition?: { x: number; y: number };
  cascadeStep?: number;    // default 0
  cascadeOffset?: number;  // default 32
}): { x: number; y: number; width: number; height: number };`}</CodeBlock>

      <H2>RenderProp</H2>

      <p>
        The type of the <Code>render</Code> prop, exported for wrappers of your
        own that forward one.
      </p>

      <CodeBlock>{`type RenderProp<P> = React.ReactElement<P>;`}</CodeBlock>
    </DocPage>
  );
}
