/**
 * Plain text and not `text/markdown`: "View as Markdown" is something a reader
 * clicks, and a browser handed `text/markdown` offers to download the file
 * instead of showing it. The URL still ends in `.md`, which is what the tools
 * fetching it key off.
 */
export const markdownResponse = (markdown: string) =>
  new Response(markdown, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
