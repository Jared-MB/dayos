import { isValidElement, type ReactNode } from "react";
import { parseFenceMeta } from "../_lib/fence-meta";
import { type Language, tokenize } from "../_lib/highlight";
import { CopyButton } from "./copy-button";

export type CodeBlockProps = {
  children: string;
  language?: Language;
  /** Shown as a tab above the block, the way a file would be named in an editor. */
  filename?: string;
  /**
   * Lines to mark as added or removed, 1-based. A diff is often the clearest
   * way to say "and now change this", and writing it as prose is not.
   */
  added?: readonly number[];
  removed?: readonly number[];
};

/**
 * Highlighted on the server. The blocks are static, so the tokenizer runs at
 * build time and the browser is handed plain spans — the only JavaScript any of
 * this ships is the copy button.
 */
export function CodeBlock({
  children,
  language = "tsx",
  filename,
  added,
  removed,
}: CodeBlockProps) {
  const code = children.replace(/\n$/, "");
  const isDiff = Boolean(added?.length || removed?.length);

  return (
    <figure
      className="code-block"
      data-has-filename={filename ? "" : undefined}
    >
      {filename ? (
        <figcaption className="code-filename">
          <span className="code-filename-text">{filename}</span>
          <CopyButton text={code} />
        </figcaption>
      ) : (
        <CopyButton className="code-copy-floating" text={code} />
      )}

      <pre className="code-pre">
        {/*
          A diff lays its lines out as grid rows, which is what the stylesheet
          keys off. The line break between rows is the grid's doing, so the
          lines carry no newline of their own — one inside a row would render as
          a second, blank line.
        */}
        <code data-diff={isDiff ? "" : undefined}>
          {isDiff ? (
            code.split("\n").map((line, index) => (
              <span
                className="code-line"
                data-added={added?.includes(index + 1) ? "" : undefined}
                data-removed={removed?.includes(index + 1) ? "" : undefined}
                // Lines have no identity beyond their position, and the
                // block never reorders: the index is the honest key.
                // biome-ignore lint/suspicious/noArrayIndexKey: static list
                key={index}
              >
                <Tokens code={line} language={language} />
              </span>
            ))
          ) : (
            <Tokens code={code} language={language} />
          )}
        </code>
      </pre>
    </figure>
  );
}

function Tokens({ code, language }: { code: string; language: Language }) {
  return tokenize(code, language).map((token, index) =>
    token.kind === "plain" ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: tokens are positional
      <span key={index}>{token.value}</span>
    ) : (
      // biome-ignore lint/suspicious/noArrayIndexKey: tokens are positional
      <span className={`t-${token.kind}`} key={index}>
        {token.value}
      </span>
    ),
  );
}

/**
 * A fenced block, as MDX hands it over: a `<pre>` wrapping a `<code>`, with the
 * language and the words after it on the fence carried across by the rehype
 * plugin in `mdx/rehype-code-meta.mjs`.
 *
 * This is what `pre` maps to, so a page writes a code block the way any
 * Markdown file does and still gets the filename tab, the diff markers and the
 * copy button.
 */
export function CodeFence({
  children,
  "data-language": language,
  "data-meta": meta,
}: {
  children?: ReactNode;
  "data-language"?: string;
  "data-meta"?: string;
}) {
  return (
    <CodeBlock
      language={(language ?? "tsx") as Language}
      {...parseFenceMeta(meta)}
    >
      {fenceText(children)}
    </CodeBlock>
  );
}

/** The source inside the `<code>` element, which is a string and nothing else. */
function fenceText(children: ReactNode): string {
  if (typeof children === "string") return children;

  if (isValidElement(children)) {
    return fenceText((children.props as { children?: ReactNode }).children);
  }

  return "";
}

/** Inline code with a language, for the odd `<Window keepMounted />` in prose. */
export function InlineCode({ children }: { children: string }) {
  return <code className="inline-code">{children}</code>;
}
