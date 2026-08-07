import { CodeBlock } from "../../_components/code";
import { DocPage, docMetadata } from "../../_components/doc-page";
import { Callout, Card, Cards, Code, H2, H3 } from "../../_components/prose";

const HREF = "/docs/installation";

export const metadata = docMetadata(HREF);

export default function Page() {
  return (
    <DocPage href={HREF}>
      <H2>The core</H2>

      <p>
        Everything except URLs lives in <Code>@dayos/core</Code>. It is a React
        library and nothing more: it does not know about Next, and it does not
        know about any router.
      </p>

      <CodeBlock language="bash">{`pnpm add @dayos/core`}</CodeBlock>

      <p>Or with npm and yarn:</p>

      <CodeBlock language="bash">{`npm install @dayos/core`}</CodeBlock>

      <CodeBlock language="bash">{`yarn add @dayos/core`}</CodeBlock>

      <H2>The Next adapter</H2>

      <p>
        If you want each window to have a URL of its own, add{" "}
        <Code>@dayos/next</Code> alongside the core. The adapter lists the core
        as a peer dependency, so both go in.
      </p>

      <CodeBlock language="bash">{`pnpm add @dayos/core @dayos/next`}</CodeBlock>

      <Callout>
        <p>
          The adapter is optional in the real sense: leaving it out costs no
          features other than URLs. A desktop built on the core alone works the
          same, on a single page.
        </p>
      </Callout>

      <H2>Requirements</H2>

      <H3>Peer dependencies</H3>

      <p>
        The core needs React 19, which it declares as a peer dependency rather
        than bundling:
      </p>

      <CodeBlock filename="package.json" language="json">{`{
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}`}</CodeBlock>

      <p>The adapter adds Next on top of that:</p>

      <CodeBlock filename="package.json" language="json">{`{
  "peerDependencies": {
    "@dayos/core": "^0.2.0",
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}`}</CodeBlock>

      <H3>Bundled dependencies</H3>

      <p>
        The core brings three of its own: <Code>react-rnd</Code> for dragging
        and resizing, and <Code>clsx</Code> with <Code>tailwind-merge</Code> for
        joining the classes you pass with the ones a component contributes. You
        do not have to use Tailwind — the merge is a no-op on class names that
        are not Tailwind utilities.
      </p>

      <H2>Client components</H2>

      <p>
        The core is client-side from end to end: it uses context, effects and
        portals. Its entry point carries <Code>&quot;use client&quot;</Code>, so
        importing it from a server component is fine — but the component that
        renders your desktop is a client component, and the file it lives in
        needs the directive.
      </p>

      <CodeBlock filename="app/shell.tsx">{`"use client";

import { Desktop } from "@dayos/core";

export function Shell({ children }: { children: React.ReactNode }) {
  return <Desktop className="desktop">{children}</Desktop>;
}`}</CodeBlock>

      <Callout
        type="warning"
        title="This does not make your pages client components"
      >
        <p>
          The shell is a client component; the content that goes inside a window
          need not be. In a Next app the pages stay server components and their
          rendered output is passed in as children — the desktop never renders
          them, it only positions them.
        </p>
      </Callout>

      <H2>Structural CSS</H2>

      <p>
        DayOS gives a window a size only if you give the desktop one. The
        desktop is <Code>position: relative</Code> and nothing else, so with no
        height it collapses and every window inside it is clipped away.
      </p>

      <CodeBlock language="css">{`.desktop {
  height: 100dvh;
  background: linear-gradient(140deg, #1e3a5f, #0f172a 60%, #312e81);
}`}</CodeBlock>

      <p>
        One more rule is worth adding up front if your windows can ever contain
        an iframe:
      </p>

      <CodeBlock language="css">{`/*
 * While a window is being dragged, an iframe under the cursor would swallow the
 * mouseup the drag listens for, and the window would stay stuck to the pointer.
 */
.desktop[data-interacting] iframe {
  pointer-events: none;
}`}</CodeBlock>

      <p>
        <Code>data-interacting</Code> is set on the desktop whenever a window is
        being dragged or resized. DayOS cannot write that rule itself: it is a
        rule about descendants, and an inline style cannot express one.
      </p>

      <H2>Next steps</H2>

      <Cards>
        <Card href="/docs/quick-start" title="Quick Start">
          Put a desktop with two windows on the screen.
        </Card>
        <Card href="/docs/styling" title="Styling">
          What DayOS sets, and how to style everything else.
        </Card>
      </Cards>
    </DocPage>
  );
}
