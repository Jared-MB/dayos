import { CodeBlock } from "../../_components/code";
import { DocPage, docMetadata } from "../../_components/doc-page";
import { Callout, Code, H2, H3 } from "../../_components/prose";

const HREF = "/docs/composition";

export const metadata = docMetadata(HREF);

export default function Page() {
  return (
    <DocPage href={HREF}>
      <p>
        Every DayOS component emits a sensible element: an icon is a{" "}
        <Code>button</Code>, a header is a <Code>header</Code>, a title is an{" "}
        <Code>h2</Code>. When that is the wrong element, the <Code>render</Code>{" "}
        prop swaps it out and keeps the behavior.
      </p>

      <H2>The render prop</H2>

      <p>
        It takes an element, not a component or a function. DayOS clones it with
        its own props merged in:
      </p>

      <CodeBlock>{`import Link from "next/link";

<DesktopIcon render={<Link href="/notes" />}>Notes</DesktopIcon>`}</CodeBlock>

      <p>
        The result is an anchor that navigates when clicked and opens the window
        when double clicked, with the icon&rsquo;s keyboard handling intact. It
        is one element, not a link wrapped around a button.
      </p>

      <Callout>
        <p>
          Do not put children on the rendered element. They go on the DayOS
          component, as above — the ones you pass to <Code>render</Code> would
          be overwritten by the merge.
        </p>
      </Callout>

      <H3>How props are merged</H3>

      <p>
        Between what DayOS contributes and what is on your element, the rules
        are:
      </p>

      <ul>
        <li>
          <Code>className</Code> — joined, with Tailwind conflicts resolved in
          your favour.
        </li>
        <li>
          <Code>style</Code> — merged key by key, yours winning.
        </li>
        <li>Event handlers — composed, DayOS running first, then yours.</li>
        <li>Anything else — yours wins outright.</li>
      </ul>

      <p>
        This is why <Code>aria-label</Code> on a <Code>WindowClose</Code>{" "}
        overrides the built-in one instead of being ignored.
      </p>

      <H2>Cancelling the built-in behavior</H2>

      <p>
        Where you pass a handler directly to a DayOS component rather than
        through <Code>render</Code>, yours runs <em>first</em> and can stop what
        would have followed:
      </p>

      <CodeBlock>{`<WindowClose
  onClick={(event) => {
    if (hasUnsavedChanges) {
      event.preventDefault();
      setConfirming(true);
    }
  }}
>
  ✕
</WindowClose>`}</CodeBlock>

      <p>
        The same applies to <Code>DesktopIcon</Code>&rsquo;s{" "}
        <Code>onDoubleClick</Code> and <Code>onKeyDown</Code>, and to{" "}
        <Code>WindowExpand</Code>&rsquo;s <Code>onClick</Code>.
      </p>

      <H2>Wrapping a DayOS component</H2>

      <p>
        A wrapper of your own that still accepts <Code>render</Code> needs the{" "}
        <Code>RenderProp</Code> type, which is exported for exactly this:
      </p>

      <CodeBlock>{`import { DesktopIcon, type RenderProp } from "@dayos/core";

export function AppIcon({
  glyph,
  label,
  render,
}: {
  glyph: string;
  label: string;
  render?: RenderProp<React.ComponentProps<"button">>;
}) {
  return (
    <DesktopIcon className="icon" render={render}>
      <span aria-hidden="true" className="icon-glyph">
        {glyph}
      </span>
      <DesktopIconText>{label}</DesktopIconText>
    </DesktopIcon>
  );
}`}</CodeBlock>

      <H2>Common swaps</H2>

      <H3>An icon that is a link</H3>

      <p>
        With <Code>@dayos/next</Code> this is how an icon both opens a window
        and gives the URL to the person who wants to copy it:
      </p>

      <CodeBlock>{`<DesktopIcon render={<Link href={href} />}>
  <DesktopIconText>{title}</DesktopIconText>
</DesktopIcon>`}</CodeBlock>

      <H3>A title that is not an h2</H3>

      <p>
        <Code>WindowName</Code> is an <Code>h2</Code>, which is right when a
        window is a section of the page and wrong when it is not. Swap the
        element without losing the id that labels the dialog:
      </p>

      <CodeBlock>{`<WindowName render={<span />}>Notes</WindowName>`}</CodeBlock>

      <H3>A control that is a menu trigger</H3>

      <CodeBlock>{`<WindowActions>
  <WindowAction render={<DropdownMenu.Trigger />}>⋯</WindowAction>
  <WindowExpand>▢</WindowExpand>
  <WindowClose>✕</WindowClose>
</WindowActions>`}</CodeBlock>

      <Callout type="warning" title="One level at a time">
        <p>
          <Code>render</Code> replaces the element a component emits, so
          chaining two libraries that both use the technique means each one
          clones the next. It works, but the merge order is worth checking when
          a handler does not fire.
        </p>
      </Callout>
    </DocPage>
  );
}
