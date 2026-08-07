/**
 * A small syntax highlighter, written here rather than pulled in.
 *
 * The alternative is Shiki or Prism, and both are a lot of weight for what the
 * docs actually show: TSX, a couple of shell lines and the odd JSON. This runs
 * on the server at build time — the code blocks are static — so what reaches
 * the browser is the spans and no highlighter at all.
 *
 * It is a tokenizer and not a parser. It gets the common shapes right and will
 * mis-colour something pathological; the tradeoff is deliberate, and a code
 * block that looks slightly off is a far smaller problem than a megabyte of
 * grammar.
 */

export type TokenKind =
  | "comment"
  | "string"
  | "keyword"
  | "number"
  | "tag"
  | "attr"
  | "type"
  | "function"
  | "punctuation"
  | "plain";

export type Token = { kind: TokenKind; value: string };

export type Language = "tsx" | "ts" | "bash" | "json" | "css" | "text";

const KEYWORDS = new Set([
  "as",
  "async",
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "default",
  "delete",
  "do",
  "else",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "from",
  "function",
  "if",
  "implements",
  "import",
  "in",
  "instanceof",
  "interface",
  "let",
  "new",
  "null",
  "of",
  "readonly",
  "return",
  "satisfies",
  "static",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "type",
  "typeof",
  "undefined",
  "var",
  "void",
  "while",
  "yield",
]);

/**
 * One pass, one regex. The order of the alternatives is the precedence: a `//`
 * inside a string has to lose to the string, so strings and comments come
 * first and everything else only sees what they left behind.
 */
const TSX_PATTERN = new RegExp(
  [
    // Comments, block before line so `/* // */` stays one comment.
    /\/\*[\s\S]*?\*\//.source,
    /\/\/[^\n]*/.source,
    // Strings, including templates. The escape alternative keeps `"\""` whole.
    /"(?:[^"\\\n]|\\.)*"/.source,
    /'(?:[^'\\\n]|\\.)*'/.source,
    /`(?:[^`\\]|\\.)*`/.source,
    // A JSX tag's opening or closing punctuation, with its name attached.
    /<\/?[A-Za-z][\w.]*/.source,
    /\/>/.source,
    // Numbers, including the `0.5` and `1e4` the geometry examples use.
    /\b\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?\b/.source,
    // Identifiers, sorted out below by shape and by what follows them.
    /[A-Za-z_$][\w$]*/.source,
    // Everything else, one character at a time.
    /[^\s]/.source,
  ].join("|"),
  "g",
);

const tokenizeTsx = (code: string): Token[] => {
  const tokens: Token[] = [];
  let lastIndex = 0;

  for (const match of code.matchAll(TSX_PATTERN)) {
    const value = match[0];
    const index = match.index;

    // Whitespace between matches, kept verbatim: it carries the indentation.
    if (index > lastIndex) {
      tokens.push({ kind: "plain", value: code.slice(lastIndex, index) });
    }
    lastIndex = index + value.length;

    tokens.push({ kind: classifyTsx(value, code, index), value });
  }

  if (lastIndex < code.length) {
    tokens.push({ kind: "plain", value: code.slice(lastIndex) });
  }

  return tokens;
};

const classifyTsx = (value: string, code: string, index: number): TokenKind => {
  const first = value[0] as string;

  if (value.startsWith("//") || value.startsWith("/*")) return "comment";
  if (first === '"' || first === "'" || first === "`") return "string";
  if (value.startsWith("<") || value === "/>") return "tag";
  if (/^\d/.test(value)) return "number";

  if (/^[A-Za-z_$]/.test(value)) {
    if (KEYWORDS.has(value)) return "keyword";

    const after = code.slice(index + value.length);

    // A call, and also the hooks and helpers named in prose-heavy examples.
    if (/^\s*\(/.test(after)) return "function";
    // A JSX attribute: an identifier followed by `=` inside a tag. Checking for
    // `==` keeps a comparison in ordinary code out of it.
    if (/^\s*=[^=]/.test(after) && isInsideTag(code, index)) return "attr";
    // Components and types both read as capitalised words, and both want the
    // same colour, so there is no reason to tell them apart.
    if (/^[A-Z]/.test(value)) return "type";

    return "plain";
  }

  return "punctuation";
};

/**
 * Whether this position sits between a `<tag` and the `>` that closes it, which
 * is what separates a JSX attribute from an assignment. It scans backwards for
 * the nearer of the two rather than tracking state, because the tokenizer hands
 * out positions and not a tree.
 */
const isInsideTag = (code: string, index: number) => {
  const before = code.slice(0, index);
  const open = before.lastIndexOf("<");

  if (open === -1) return false;

  return !before.slice(open).includes(">");
};

const BASH_PATTERN = /#[^\n]*|"(?:[^"\\]|\\.)*"|'[^']*'|\S+|\s+/g;

/**
 * Shell lines are short and shaped alike: a command, some flags, some words.
 * The first word of a line is the command; `-f` and `--flag` are attributes.
 */
const tokenizeBash = (code: string): Token[] =>
  [...code.matchAll(BASH_PATTERN)].map((match) => {
    const value = match[0];

    if (value.startsWith("#")) return { kind: "comment" as const, value };
    if (value.startsWith('"') || value.startsWith("'"))
      return { kind: "string" as const, value };
    if (value.trim() === "") return { kind: "plain" as const, value };
    if (value.startsWith("-")) return { kind: "attr" as const, value };

    // Nothing but whitespace since the last newline: this is the command.
    const before = code.slice(0, match.index);
    const isCommand = /(^|\n)[ \t]*$/.test(before);

    return {
      kind: isCommand ? ("function" as const) : ("plain" as const),
      value,
    };
  });

const JSON_PATTERN =
  /"(?:[^"\\]|\\.)*"\s*:|"(?:[^"\\]|\\.)*"|\b\d+(?:\.\d+)?\b|\b(?:true|false|null)\b|[{}[\],:]|\s+|\S/g;

const tokenizeJson = (code: string): Token[] =>
  [...code.matchAll(JSON_PATTERN)].map((match) => {
    const value = match[0];

    // A key is a string with a colon after it, and it gets its own colour so
    // the shape of a `package.json` is readable at a glance.
    if (value.startsWith('"') && value.trimEnd().endsWith(":"))
      return { kind: "attr" as const, value };
    if (value.startsWith('"')) return { kind: "string" as const, value };
    if (/^\d/.test(value)) return { kind: "number" as const, value };
    if (/^(?:true|false|null)$/.test(value))
      return { kind: "keyword" as const, value };
    if (/^\s+$/.test(value)) return { kind: "plain" as const, value };

    return { kind: "punctuation" as const, value };
  });

const CSS_PATTERN =
  /\/\*[\s\S]*?\*\/|"(?:[^"\\]|\\.)*"|'[^']*'|--[\w-]+|[.#]?[\w-]+|\s+|\S/g;

const tokenizeCss = (code: string): Token[] =>
  [...code.matchAll(CSS_PATTERN)].map((match) => {
    const value = match[0];
    const after = code.slice(match.index + value.length);

    if (value.startsWith("/*")) return { kind: "comment" as const, value };
    if (value.startsWith('"') || value.startsWith("'"))
      return { kind: "string" as const, value };
    if (/^\s+$/.test(value)) return { kind: "plain" as const, value };
    // A custom property, whether it is being declared or read.
    if (value.startsWith("--")) return { kind: "attr" as const, value };
    // A property name is an identifier with a colon after it.
    if (/^\s*:/.test(after) && /^[a-z-]+$/.test(value))
      return { kind: "attr" as const, value };
    if (value.startsWith(".") || value.startsWith("#"))
      return { kind: "type" as const, value };
    if (/^\d/.test(value)) return { kind: "number" as const, value };
    if (/^[\w-]+$/.test(value)) return { kind: "plain" as const, value };

    return { kind: "punctuation" as const, value };
  });

export const tokenize = (code: string, language: Language): Token[] => {
  switch (language) {
    case "tsx":
    case "ts":
      return tokenizeTsx(code);
    case "bash":
      return tokenizeBash(code);
    case "json":
      return tokenizeJson(code);
    case "css":
      return tokenizeCss(code);
    default:
      return [{ kind: "plain", value: code }];
  }
};
