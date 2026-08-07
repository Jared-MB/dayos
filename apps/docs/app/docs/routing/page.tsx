import { CodeBlock } from "../../_components/code";
import { DocPage, docMetadata } from "../../_components/doc-page";
import {
  Callout,
  Card,
  Cards,
  Code,
  H2,
  H3,
  Step,
  Steps,
} from "../../_components/prose";

const HREF = "/docs/routing";

export const metadata = docMetadata(HREF);

export default function Page() {
  return (
    <DocPage href={HREF}>
      <p>
        <Code>@dayos/next</Code> gives every window a URL. It is the only piece
        of DayOS that talks to Next, and it is genuinely optional: a desktop
        without it works the same, on a single page.
      </p>

      <H2>What it buys you</H2>

      <ul>
        <li>
          Requesting <Code>/about</Code> returns HTML that{" "}
          <strong>already has</strong> the About window open with its content
          inside. No flash of an empty desktop, and indexable.
        </li>
        <li>
          Focusing a window updates the URL, so a window can be shared by link.
          It uses <Code>replace</Code>, so the back button walks through pages
          rather than through focus changes.
        </li>
        <li>
          A window that loses focus keeps its own content instead of switching
          to the current route&rsquo;s.
        </li>
      </ul>

      <H2>Setup</H2>

      <Steps>
        <Step title="Install">
          <CodeBlock language="bash">{`pnpm add @dayos/core @dayos/next`}</CodeBlock>
        </Step>

        <Step title="Hand the layout's children to the provider">
          <p>
            The current route&rsquo;s content goes in as a prop rather than as a
            child. That is the whole trick: the window it belongs to claims it
            from the inside, instead of it sitting loose on the desktop.
          </p>

          <CodeBlock filename="app/layout.tsx">{`import { Shell } from "./shell";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}`}</CodeBlock>
        </Step>

        <Step title="Declare every route up front">
          <p>
            The provider needs the full list during render — that is how the
            server knows which window the requested URL belongs to. A window
            that registered itself from an effect would always be too late.
          </p>

          <CodeBlock filename="app/shell.tsx">{`"use client";

import { DesktopApp, DesktopIcon, Window, WindowContent } from "@dayos/core";
import { RoutedDesktop, useWindowRoute, WindowRouteProvider } from "@dayos/next";

const ROUTES = ["/", "/about"] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <WindowRouteProvider content={children} routes={ROUTES}>
      <RoutedDesktop className="desktop">
        {ROUTES.map((href) => (
          <App href={href} key={href} />
        ))}
      </RoutedDesktop>
    </WindowRouteProvider>
  );
}`}</CodeBlock>
        </Step>

        <Step title="Make each window's id its href">
          <p>
            A window&rsquo;s href <em>is</em> its <Code>DesktopApp</Code> id —
            one identity, declared once, rather than the same string written in
            two places and kept in sync by hand.
          </p>

          <CodeBlock filename="app/shell.tsx">{`function App({ href }: { href: string }) {
  return (
    <DesktopApp id={href}>
      <AppShell href={href} />
    </DesktopApp>
  );
}

function AppShell({ href }: { href: string }) {
  // This window's content: live while it is the current route, frozen once
  // focus moves elsewhere.
  const content = useWindowRoute();

  return (
    <>
      <DesktopIcon>{href}</DesktopIcon>
      <Window keepMounted>
        <WindowContent>{content}</WindowContent>
      </Window>
    </>
  );
}`}</CodeBlock>

          <Callout>
            <p>
              <Code>useWindowRoute</Code> has to be called inside the{" "}
              <Code>DesktopApp</Code>, not in the component that renders it —
              that is where the id it reads lives. Hence the split into{" "}
              <Code>App</Code> and <Code>AppShell</Code> above.
            </p>
          </Callout>
        </Step>

        <Step title="Add the pages">
          <p>
            Ordinary Next pages. They stay server components, and nothing about
            them knows it is being rendered inside a window.
          </p>

          <CodeBlock filename="app/about/page.tsx">{`export default function AboutPage() {
  return (
    <article>
      <h1>About</h1>
      <p>This window is a real route.</p>
    </article>
  );
}`}</CodeBlock>
        </Step>
      </Steps>

      <H2>How the sync works</H2>

      <H3>URL to window</H3>

      <p>
        Landing on a route opens its window. Navigating to a URL that belongs to
        another window opens that one — and deliberately does not close the
        first, since focusing a window changes the URL and has no business
        closing anything.
      </p>

      <H3>Window to URL</H3>

      <p>
        The front window is the URL. <Code>RoutedDesktop</Code> owns this sync
        alone, and uses <Code>replace</Code> with <Code>scroll: false</Code>: a
        focus change is not a navigation, so it should not fill the history and
        it should not move the viewport.
      </p>

      <p>
        Each window&rsquo;s last real URL is remembered, query string and hash
        included. Coming back to a window returns you to the URL it had, not to
        its bare href.
      </p>

      <H3>When the last window closes</H3>

      <p>
        The URL goes to <Code>exitHref</Code>, which defaults to{" "}
        <Code>&quot;/&quot;</Code>:
      </p>

      <CodeBlock>{`<RoutedDesktop exitHref="/welcome" />`}</CodeBlock>

      <H2>Windows without routes</H2>

      <p>
        Not every app has to be routed. A <Code>DesktopApp</Code> with an id
        that no route claims — or with no id at all — is an ordinary window: it
        opens, it focuses, and it leaves the URL alone.
      </p>

      <CodeBlock>{`<RoutedDesktop className="desktop">
  {ROUTES.map((href) => (
    <App href={href} key={href} />
  ))}

  {/* Not a route. Opening it does not change the URL. */}
  <DesktopApp id="calculator">
    <DesktopIcon>Calculator</DesktopIcon>
    <Window>
      <WindowContent>
        <Calculator />
      </WindowContent>
    </Window>
  </DesktopApp>
</RoutedDesktop>`}</CodeBlock>

      <H2>Opening a window from a link</H2>

      <p>
        There is no imperative API for this and there does not need to be one. A
        window&rsquo;s href is a URL, so an ordinary <Code>Link</Code> opens it:
      </p>

      <CodeBlock>{`import Link from "next/link";

<Link href="/about">About</Link>`}</CodeBlock>

      <p>
        Which is also why an icon is often a link — it opens the window on
        double click, and gives the URL to anyone who wants to copy it.
      </p>

      <CodeBlock>{`<DesktopIcon render={<Link href={href} />}>
  <DesktopIconText>{title}</DesktopIconText>
</DesktopIcon>`}</CodeBlock>

      <Cards>
        <Card href="/docs/routing/dynamic-routes" title="Dynamic Routes">
          One declaration, a window per document.
        </Card>
        <Card href="/docs/routing/matching" title="Route Matching">
          Which window a URL belongs to when several could claim it.
        </Card>
      </Cards>
    </DocPage>
  );
}
