export default function AboutPage() {
  return (
    <article className="prose">
      <h1>About</h1>
      <p>
        This window is a real route. The server renders its content and
        <code> @dayos/next </code> puts it inside the window it belongs to,
        instead of leaving it loose on the desktop.
      </p>
      <p>
        Focus the other window and watch the URL: it follows whichever window is
        in front. This one's content stays frozen rather than being lost.
      </p>
    </article>
  );
}
