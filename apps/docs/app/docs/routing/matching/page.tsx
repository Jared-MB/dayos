import { CodeBlock } from "../../../_components/code";
import { DocPage, docMetadata } from "../../../_components/doc-page";
import { Callout, Code, H2, H3 } from "../../../_components/prose";

const HREF = "/docs/routing/matching";

export const metadata = docMetadata(HREF);

export default function Page() {
  return (
    <DocPage href={HREF}>
      <p>
        A URL belongs to exactly one window. When several declared routes could
        claim it, the rules below decide which — and they are worth knowing,
        because the answer determines whether a document opens beside its list
        or inside it.
      </p>

      <H2>A window owns its subroutes</H2>

      <p>
        A route only has to cover the start of the pathname. Given{" "}
        <Code>/docs</Code>, the URL <Code>/docs/api</Code> is that window’s too,
        and its href stays <Code>/docs</Code>.
      </p>

      <p>
        This is what makes navigation <em>inside</em> a window work: following a
        link within the docs window keeps you in the docs window rather than
        opening a second one.
      </p>

      <Callout>
        <p>
          Matching is by segment, not by string prefix. <Code>/docs</Code> does
          not claim <Code>/docsy</Code>.
        </p>
      </Callout>

      <H3>The root is the exception</H3>

      <p>
        <Code>/</Code> consumes no segments, so if it owned what is beneath it,
        every URL on the site would be the home window’s and a URL belonging to
        no route — a 404 — would stop being one. It matches only itself.
      </p>

      <H2>Specificity</H2>

      <p>When more than one route matches, the winner is decided in order:</p>

      <ol>
        <li>
          <strong>More segments wins.</strong> <Code>/docs/api</Code> beats{" "}
          <Code>/docs</Code>, so the specific window opens rather than the one
          containing it.
        </li>
        <li>
          <strong>At equal depth, a literal beats a param.</strong>{" "}
          <Code>/documents/new</Code> wins over <Code>/documents/:file</Code>.
        </li>
      </ol>

      <p>
        The second rule applies segment by segment, so a literal wins at the
        depth it appears:
      </p>

      <CodeBlock>{`const ROUTES = [
  "/projects",
  "/projects/archive",        // wins over /projects/:project
  "/projects/:project",
  "/projects/:project/new",   // wins over /projects/:project/:task
  "/projects/:project/:task",
] as const;`}</CodeBlock>

      <H2>Worked examples</H2>

      <p>Given the routes above:</p>

      <CodeBlock>{`"/projects"                → /projects
"/projects/archive"        → /projects/archive
"/projects/dayos"          → /projects/:project     params { project: "dayos" }
"/projects/dayos/new"      → /projects/:project/new params { project: "dayos" }
"/projects/dayos/ship-it"  → /projects/:project/:task
                             params { project: "dayos", task: "ship-it" }
"/projects/dayos/ship-it/comments"
                           → /projects/:project/:task  (a subroute of that window)
"/settings"                → no window`}</CodeBlock>

      <H2>Declaring a pattern is a choice</H2>

      <p>
        Leaving <Code>/documents/:file</Code> out of the routes array is not a
        missing feature — it is the other reasonable behavior. Without it,{" "}
        <Code>/documents</Code> claims its subroutes, and a document opens{" "}
        <em>inside</em> the list’s window rather than beside it.
      </p>

      <ul>
        <li>
          <strong>Pattern declared:</strong> one window per document. The list
          stays on its own page.
        </li>
        <li>
          <strong>Pattern not declared:</strong> one window, which navigates
          from the list to the document and back.
        </li>
      </ul>

      <p>Both are useful. Pick per route.</p>

      <H2>URLs that match nothing</H2>

      <p>
        No window opens, and the desktop is empty. This is what makes a 404 a
        404. It also means the URL the page loaded with wins until something
        touches the window state — otherwise closing the last window would
        navigate away from a page the visitor did want to see.
      </p>

      <H2>Query strings and hashes</H2>

      <p>
        Matching only looks at the pathname, so{" "}
        <Code>/documents/report?page=2</Code> belongs to the same window as{" "}
        <Code>/documents/report</Code>. The full URL is remembered per window
        though: coming back to a window restores the query and hash it had, not
        just its bare href.
      </p>

      <H2>Encoded segments</H2>

      <p>
        Params come back decoded. A window at{" "}
        <Code>/documents/annual%20report</Code> gets{" "}
        <Code>params.file === &quot;annual report&quot;</Code>, while the href
        keeps its URL spelling — the href identifies the window and is what gets
        compared against the pathname.
      </p>

      <Callout type="warning" title="Debugging a window that will not open">
        <p>
          Almost always one of two things: the route is not in the{" "}
          <Code>routes</Code> array, or a broader route is claiming the URL
          first. Check what specificity says about the routes that both match.
        </p>
      </Callout>
    </DocPage>
  );
}
