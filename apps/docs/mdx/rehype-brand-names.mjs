/**
 * `translate="no"` on the names that must survive machine translation.
 *
 * A reader on the Spanish page who asks the browser for French gets the whole
 * document put through a translator, brand names and identifiers included:
 * "React" comes back as "Reaccionar" and `DesktopApp` as something no import
 * will ever resolve. The attribute is the standard way to fence a subtree off
 * from that.
 *
 * Doing it here rather than in the pages keeps the prose plain — a page writes
 * "DayOS" and not `<span translate="no">DayOS</span>`, which matters most for
 * the translations, where the file next door should differ only in its words.
 * Code is fenced off at the component instead, in `_components/code.tsx`, since
 * every fence and every `code` is already one element there.
 */
const BRANDS = ["DayOS", "Next.js", "React", "Tailwind", "Vite"];

/**
 * The names, longest first, so "Next.js" is matched before a shorter name that
 * prefixes it. `\b` would not hold either end of "Next.js" — the `.` is a word
 * boundary itself — so the edges are spelled out: not preceded by a word
 * character, and not followed by one or by a `.` that starts another segment.
 */
const PATTERN = new RegExp(
  `(?<![\\w.])(${BRANDS.sort((a, b) => b.length - a.length)
    .map((name) => name.replace(/\./g, "\\."))
    .join("|")})(?![\\w.])`,
  "g",
);

/**
 * Text inside these is literal, so a name in one is not a mention of the brand
 * and must not be wrapped. `kbd` is also marked on the way past — it is raw
 * JSX in a page, so it reaches the DOM as written. `code` and `pre` are not:
 * they map to components that render their own element, and mark it there.
 */
const VERBATIM = new Set(["code", "pre", "kbd"]);
const MARK_IN_PLACE = new Set(["kbd"]);

export default function rehypeBrandNames() {
  return (tree) => visit(tree, tree);
}

function visit(node, _parent) {
  if (!node || typeof node !== "object") return;

  const name = elementName(node);
  if (VERBATIM.has(name)) {
    if (MARK_IN_PLACE.has(name)) mark(node);
    return;
  }

  // A page that marks a name itself, and anything a `Callout` or a link wraps
  // around one that is already marked.
  if (isMarked(node)) return;

  const children = node.children;
  if (!Array.isArray(children)) return;

  let index = 0;
  while (index < children.length) {
    const child = children[index];

    if (child.type === "text") {
      const replacement = split(child.value);
      children.splice(index, 1, ...replacement);
      index += replacement.length;
      continue;
    }

    visit(child, node);
    index += 1;
  }
}

/**
 * One text node becomes the runs between the names and a marked element for
 * each name. Returns the node untouched when it holds none, which is the
 * common case and the one worth not allocating for.
 */
function split(value) {
  PATTERN.lastIndex = 0;
  if (!PATTERN.test(value)) return [{ type: "text", value }];

  PATTERN.lastIndex = 0;
  const nodes = [];
  let cursor = 0;

  for (const match of value.matchAll(PATTERN)) {
    if (match.index > cursor) {
      nodes.push({ type: "text", value: value.slice(cursor, match.index) });
    }

    nodes.push(marked(match[0]));
    cursor = match.index + match[0].length;
  }

  if (cursor < value.length) {
    nodes.push({ type: "text", value: value.slice(cursor) });
  }

  return nodes;
}

/**
 * Written as JSX rather than as a hast element so the attribute reaches the
 * page spelled exactly this way: `translate` is an enumerated attribute, and
 * how a plain `properties` entry serializes is up to `property-information`.
 */
function marked(value) {
  return {
    type: "mdxJsxTextElement",
    name: "span",
    attributes: [{ type: "mdxJsxAttribute", name: "translate", value: "no" }],
    children: [{ type: "text", value }],
  };
}

/** Marked in place, for an element with nothing inside it worth wrapping. */
function mark(node) {
  if (isMarked(node)) return;

  if (node.type === "element") {
    node.properties = { ...node.properties, translate: "no" };
    return;
  }

  node.attributes = [
    ...(node.attributes ?? []),
    { type: "mdxJsxAttribute", name: "translate", value: "no" },
  ];
}

function isMarked(node) {
  if (node.properties?.translate === "no") return true;

  return Boolean(
    node.attributes?.some(
      (attribute) => attribute.name === "translate" && attribute.value === "no",
    ),
  );
}

/** `<kbd>` in a page is JSX, while a Markdown fence is a plain element. */
function elementName(node) {
  if (node.type === "element") return node.tagName;
  if (node.type === "mdxJsxTextElement" || node.type === "mdxJsxFlowElement") {
    return node.name;
  }

  return null;
}
