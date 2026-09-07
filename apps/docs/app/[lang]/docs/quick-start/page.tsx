import { CodeBlock } from "../../_components/code";
import { DocPage, docMetadata } from "../../_components/doc-page";
import {
  Callout,
  Card,
  Cards,
  Code,
  H2,
  Step,
  Steps,
} from "../../_components/prose";
import { EXAMPLE_APP } from "../../_lib/site";

const HREF = "/docs/quick-start";

export const metadata = docMetadata(HREF);

export default function Page() {
  return (
    <DocPage href={HREF}>
      <p>
        This builds a desktop with two apps, from an empty component to
        something you can drag around. It uses <Code>@dayos/core</Code> alone —
        no routing, one page. Adding URLs comes later and does not change any of
        this.
      </p>

      <Steps>
        <Step title="Install the core">
          <CodeBlock language="bash">{`pnpm add @dayos/core`}</CodeBlock>
        </Step>

        <Step title="Create the desktop">
          <p>
            <Code>Desktop</Code> is the container. It owns which windows are
            open and their stacking order, and every other component has to be
            inside it.
          </p>

          <CodeBlock filename="app/desktop.tsx">{`"use client";

import { Desktop } from "@dayos/core";

export function MyDesktop() {
  return <Desktop className="desktop" />;
}`}</CodeBlock>

          <p>
            It has no size of its own, so give it one. Without a height it
            collapses to nothing and clips away every window inside it.
          </p>

          <CodeBlock language="css">{`.desktop {
  height: 100dvh;
  background: linear-gradient(140deg, #1e3a5f, #0f172a 60%, #312e81);
  display: grid;
  grid-template-columns: repeat(auto-fill, 6rem);
  align-content: start;
  gap: 0.5rem;
  padding: 1rem;
}`}</CodeBlock>
        </Step>

        <Step title="Add an app">
          <p>
            A <Code>DesktopApp</Code> is one icon plus one window, tied together
            by an <Code>id</Code>. The icon opens the window; the window is what
            opens.
          </p>

          <CodeBlock filename="app/desktop.tsx">{`"use client";

import {
  Desktop,
  DesktopApp,
  DesktopIcon,
  DesktopIconText,
  Window,
  WindowContent,
  WindowHeader,
  WindowName,
} from "@dayos/core";

export function MyDesktop() {
  return (
    <Desktop className="desktop">
      <DesktopApp id="notes">
        <DesktopIcon className="icon">
          <span aria-hidden="true" className="icon-glyph">
            ▣
          </span>
          <DesktopIconText>Notes</DesktopIconText>
        </DesktopIcon>

        <Window className="window">
          <WindowHeader className="window-header">
            <WindowName className="window-title">Notes</WindowName>
          </WindowHeader>
          <WindowContent className="window-content">
            Double click the icon to open me.
          </WindowContent>
        </Window>
      </DesktopApp>
    </Desktop>
  );
}`}</CodeBlock>

          <p>
            Double clicking the icon opens the window, and so do{" "}
            <kbd>Enter</kbd> and <kbd>Space</kbd> when it has focus. The window
            is draggable by its header and resizable from its edges already.
          </p>

          <Callout>
            <p>
              <Code>WindowHeader</Code> is the drag handle. A window without one
              can still be resized and closed, but it cannot be moved.
            </p>
          </Callout>
        </Step>

        <Step title="Give the window controls">
          <p>
            <Code>WindowActions</Code> is the control group;{" "}
            <Code>WindowExpand</Code> maximizes and restores,{" "}
            <Code>WindowClose</Code> closes. Both come with the right accessible
            names, and <Code>WindowExpand</Code> announces which of its two jobs
            it is currently doing.
          </p>

          <CodeBlock
            filename="app/desktop.tsx"
            added={[4, 5, 6, 7]}
          >{`<Window className="window">
  <WindowHeader className="window-header">
    <WindowName className="window-title">Notes</WindowName>
    <WindowActions className="window-actions">
      <WindowExpand className="window-button">▢</WindowExpand>
      <WindowClose className="window-button">✕</WindowClose>
    </WindowActions>
  </WindowHeader>
  <WindowContent className="window-content">
    Double click the icon to open me.
  </WindowContent>
</Window>`}</CodeBlock>
        </Step>

        <Step title="Add a second app">
          <p>
            The second app is the same shape with a different <Code>id</Code>.
            Two apps sharing an id is a bug DayOS warns about in development:
            they would share window state and render the same window twice,
            stacked exactly on top of each other.
          </p>

          <CodeBlock filename="app/desktop.tsx">{`<Desktop className="desktop">
  <App id="notes" title="Notes">
    Double click the icon to open me.
  </App>
  <App id="about" title="About">
    Drag my header. Drag my edges. Try the maximize button.
  </App>
</Desktop>`}</CodeBlock>

          <p>
            Where <Code>App</Code> is the markup from the previous step, pulled
            into a component of your own:
          </p>

          <CodeBlock filename="app/app.tsx">{`function App({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <DesktopApp id={id}>
      <DesktopIcon className="icon">
        <span aria-hidden="true" className="icon-glyph">
          ▣
        </span>
        <DesktopIconText>{title}</DesktopIconText>
      </DesktopIcon>

      <Window className="window">
        <WindowHeader className="window-header">
          <WindowName className="window-title">{title}</WindowName>
          <WindowActions className="window-actions">
            <WindowExpand className="window-button">▢</WindowExpand>
            <WindowClose className="window-button">✕</WindowClose>
          </WindowActions>
        </WindowHeader>
        <WindowContent className="window-content">{children}</WindowContent>
      </Window>
    </DesktopApp>
  );
}`}</CodeBlock>

          <p>
            Open both. The one you click last comes to the front, and closing it
            leaves the other where it was.
          </p>
        </Step>

        <Step title="Style it">
          <p>
            Nothing above has any appearance yet beyond what the browser gives
            it. This is the stylesheet the demo app uses, and it is a starting
            point rather than a requirement:
          </p>

          <CodeBlock language="css">{`.icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  background: none;
  color: #ffffff;
  font: inherit;
  font-size: 0.8125rem;
  text-shadow: 0 1px 2px rgb(0 0 0 / 0.6);
  cursor: pointer;
}

.icon:hover,
.icon:focus-visible {
  background: rgb(255 255 255 / 0.15);
  border-color: rgb(255 255 255 / 0.3);
  outline: none;
}

.window {
  border: 1px solid #d4d4d8;
  border-radius: 0.75rem;
  background: #f4f4f5;
  box-shadow: 0 20px 40px -12px rgb(0 0 0 / 0.45);
  overflow: hidden;
}

.window-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #d4d4d8;
  background: #ffffff;
  cursor: grab;
}

.window-actions {
  display: flex;
  gap: 0.25rem;
  margin-left: auto;
}

.window-content {
  padding: 1rem 1.25rem;
}`}</CodeBlock>
        </Step>
      </Steps>

      <H2>Where to go from here</H2>

      <Cards>
        <Card href="/docs/windows" title="Windows">
          Geometry, maximizing, and keeping a window mounted while it is closed.
        </Card>
        <Card href="/docs/routing" title="Windows with URLs">
          Give each of these windows a route of its own.
        </Card>
        <Card href={EXAMPLE_APP} title="The example app">
          A working desktop with static routes, dynamic ones and nesting.
        </Card>
      </Cards>
    </DocPage>
  );
}
