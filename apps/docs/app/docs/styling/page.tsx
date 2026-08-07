import { CodeBlock } from "../../_components/code";
import { DocPage, docMetadata } from "../../_components/doc-page";
import { Callout, Code, H2, H3, PropsTable } from "../../_components/prose";

const HREF = "/docs/styling";

export const metadata = docMetadata(HREF);

export default function Page() {
  return (
    <DocPage href={HREF}>
      <p>
        DayOS ships no stylesheet. There is nothing to import, nothing to
        override and no theme to fight with. What it does set is structural — a
        handful of declarations without which windows would not position, clip
        or scroll correctly — and everything else is yours.
      </p>

      <H2>What DayOS sets</H2>

      <H3>Desktop</H3>

      <CodeBlock language="css">{`position: relative;  /* windows are absolutely positioned against it */
overflow: hidden;    /* and clipped by it */`}</CodeBlock>

      <H3>Window</H3>

      <p>
        The frame is absolutely positioned with a <Code>z-index</Code> from its
        place in the stack. Inside it, the dialog is a flex column:
      </p>

      <CodeBlock language="css">{`display: flex;
flex-direction: column;
height: 100%;`}</CodeBlock>

      <H3>WindowContent</H3>

      <CodeBlock language="css">{`flex: 1 1 0%;
min-height: 0;
overflow: auto;`}</CodeBlock>

      <p>
        This is <Code>flex: 1</Code> with <Code>min-height: 0</Code> and
        deliberately not <Code>height: 100%</Code>. Inside a flex column, 100%
        measures against the full height and ignores the header, so the content
        overflows the window instead of scrolling within it.
      </p>

      <H3>WindowHeader</H3>

      <p>
        The header carries a <Code>window-drag-handle</Code> class. It is not
        styling: it is the selector the drag implementation uses to recognise
        where the window is dragged from. Leave it in place — it merges with
        whatever <Code>className</Code> you pass, so you never have to think
        about it.
      </p>

      <H2>Passing your own styles</H2>

      <p>
        Every component takes <Code>className</Code> and <Code>style</Code>. The
        merge is not a replacement:
      </p>

      <ul>
        <li>
          <Code>className</Code> goes through <Code>clsx</Code> and{" "}
          <Code>tailwind-merge</Code>, so a Tailwind utility of yours beats the
          one DayOS contributed rather than both landing in the class list.
        </li>
        <li>
          <Code>style</Code> is merged key by key, and yours wins on a
          collision.
        </li>
        <li>Event handlers are composed, with yours running first.</li>
      </ul>

      <Callout>
        <p>
          You do not need Tailwind. <Code>tailwind-merge</Code> only knows how
          to deduplicate Tailwind utilities; on any other class name it is a
          pass-through.
        </p>
      </Callout>

      <H2>State attributes</H2>

      <p>
        The things worth styling by state are exposed as data attributes, so
        they can be targeted from CSS without a single line of JavaScript in
        your styles.
      </p>

      <PropsTable
        rows={[
          {
            name: "data-interacting",
            type: "Desktop",
            description:
              "Present while any window is being dragged or resized. Its main use is neutralising iframes for the duration.",
          },
          {
            name: "data-window",
            type: "Window (server render only)",
            description:
              "Marks the static frame that appears in the server HTML, before there is a desktop to portal into.",
          },
          {
            name: "data-maximized",
            type: "Window, WindowHeader",
            description:
              "Present while the window fills the desktop. Useful for squaring off rounded corners.",
          },
        ]}
      />

      <CodeBlock language="css">{`.desktop[data-interacting] iframe {
  pointer-events: none;
}

.window-header[data-maximized] {
  border-radius: 0;
}`}</CodeBlock>

      <H2>With Tailwind</H2>

      <CodeBlock>{`<Desktop className="h-dvh bg-slate-900 [&[data-interacting]_iframe]:pointer-events-none">
  <DesktopApp id="notes">
    <DesktopIcon className="flex flex-col items-center gap-1 rounded-lg p-2 text-white hover:bg-white/15">
      <DesktopIconText className="text-xs">Notes</DesktopIconText>
    </DesktopIcon>

    <Window className="overflow-hidden rounded-xl border border-zinc-300 bg-zinc-100 shadow-2xl">
      <WindowHeader className="flex cursor-grab items-center gap-2 border-b border-zinc-300 bg-white px-3 py-2 data-maximized:rounded-none">
        <WindowName className="text-sm font-semibold">Notes</WindowName>
        <WindowActions className="ml-auto flex gap-1">
          <WindowClose className="size-6 rounded-md border border-zinc-300">✕</WindowClose>
        </WindowActions>
      </WindowHeader>
      <WindowContent className="p-4">Hello</WindowContent>
    </Window>
  </DesktopApp>
</Desktop>`}</CodeBlock>

      <H2>Focus styles</H2>

      <p>
        Icons are real buttons and windows are focusable, so both get the
        browser’s focus ring by default. If you replace it, replace it — the
        desktop is a keyboard-navigable surface, and an icon whose focus is
        invisible cannot be found.
      </p>

      <CodeBlock language="css">{`.icon:focus-visible {
  background: rgb(255 255 255 / 0.15);
  border-color: rgb(255 255 255 / 0.3);
  outline: none;
}`}</CodeBlock>

      <H2>Cursors</H2>

      <p>
        Nothing sets a cursor for you. The two worth adding are a{" "}
        <Code>grab</Code> cursor on the header, so the window looks draggable,
        and a pointer on the icons.
      </p>

      <CodeBlock language="css">{`.window-header {
  cursor: grab;
}`}</CodeBlock>

      <p>
        Resize cursors on the edges come from the resize handles themselves and
        need nothing from you.
      </p>
    </DocPage>
  );
}
