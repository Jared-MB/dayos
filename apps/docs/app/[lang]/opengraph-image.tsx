import { ImageResponse } from "next/og";
import { LOCALES, toLocale } from "../_lib/i18n";
import { OG_TAGLINE, SITE_TITLE } from "../_lib/site";

/**
 * The card every link to the docs unfurls into. It draws the thing the library
 * makes — two stacked window frames, the same shape as the wordmark's mark —
 * rather than a logo on a gradient, so the picture says what DayOS is to
 * someone who has never heard of it.
 *
 * Written for Satori, not for a browser: every box is explicitly `flex`,
 * lengths are numbers, and the colours are the dark theme's hex values copied
 * out of `globals.css` because custom properties don't resolve here.
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Params = { params: Promise<{ lang: string }> };

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

/**
 * `alt` cannot be a plain export here the way it can on a card that never
 * changes: the sentence it holds is the page's, and the page has a language.
 * Declaring the image through `generateImageMetadata` is what lets it vary.
 */
export async function generateImageMetadata({ params }: Params) {
  const lang = toLocale((await params).lang);

  return [{ id: lang, alt: SITE_TITLE[lang], size, contentType }];
}

const BG = "#0a0a0a";
const RAISED = "#141414";
const BORDER = "#232323";
const BORDER_STRONG = "#383838";
const FG = "#ededed";
const MUTED = "#a1a1a1";
const ACCENT = "#818cf8";

/** One window frame: a title bar with its buttons, then bars standing in for content. */
function Frame({
  width,
  height,
  offsetX,
  offsetY,
  dim,
}: {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  dim?: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: offsetX,
        top: offsetY,
        display: "flex",
        flexDirection: "column",
        width,
        height,
        borderRadius: 14,
        border: `1px solid ${dim ? BORDER : BORDER_STRONG}`,
        background: RAISED,
        opacity: dim ? 0.72 : 1,
        boxShadow: dim
          ? "0 8px 24px rgba(0, 0, 0, 0.4)"
          : "0 24px 64px rgba(0, 0, 0, 0.66)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: 40,
          paddingLeft: 16,
          borderBottom: `1px solid ${dim ? BORDER : BORDER_STRONG}`,
        }}
      >
        {[BORDER_STRONG, BORDER_STRONG, dim ? BORDER_STRONG : ACCENT].map(
          (color, index) => (
            <div
              key={color + String(index)}
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                marginRight: 8,
                background: color,
              }}
            />
          ),
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: 20,
        }}
      >
        {[0.82, 0.64, 0.44].map((fraction) => (
          <div
            key={fraction}
            style={{
              width: (width - 40) * fraction,
              height: 10,
              borderRadius: 5,
              marginBottom: 12,
              background: BORDER_STRONG,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default async function OpengraphImage({ params }: Params) {
  const lang = toLocale((await params).lang);

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: BG,
        // The desktop the windows sit on, lit from behind the front one.
        backgroundImage: `radial-gradient(circle at 68% 52%, rgba(129, 140, 248, 0.22), rgba(10, 10, 10, 0) 62%)`,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: 620,
          padding: "0 0 0 76px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* Rasterised into the PNG, never in a DOM: `alt` above is what a
              reader actually gets. */}
          <svg
            aria-hidden="true"
            fill="none"
            height="52"
            viewBox="0 0 24 24"
            width="52"
          >
            <rect
              height="12"
              rx="2.5"
              stroke={FG}
              strokeWidth="1.6"
              width="14"
              x="2.5"
              y="3.5"
            />
            <path d="M2.5 7.5h14" stroke={FG} strokeWidth="1.6" />
            <rect
              fill={BG}
              height="12"
              rx="2.5"
              stroke={FG}
              strokeWidth="1.6"
              width="14"
              x="7.5"
              y="8.5"
            />
            <path d="M7.5 12.5h14" stroke={FG} strokeWidth="1.6" />
          </svg>
          <div
            style={{
              marginLeft: 18,
              fontSize: 68,
              fontWeight: 700,
              letterSpacing: -2,
              color: FG,
            }}
          >
            DayOS
          </div>
        </div>

        <div
          style={{
            marginTop: 26,
            fontSize: 30,
            lineHeight: 1.35,
            color: MUTED,
          }}
        >
          {OG_TAGLINE[lang]}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 38,
            fontSize: 22,
            color: ACCENT,
          }}
        >
          @dayos/core · @dayos/next
        </div>
      </div>

      <div style={{ position: "relative", display: "flex", flex: 1 }}>
        <Frame dim height={224} offsetX={64} offsetY={126} width={356} />
        <Frame height={244} offsetX={148} offsetY={244} width={392} />
      </div>
    </div>,
    size,
  );
}
