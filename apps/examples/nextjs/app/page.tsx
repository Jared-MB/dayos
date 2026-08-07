export default function HomePage() {
  return (
    <article className="prose">
      <h1>DayOS</h1>
      <p>
        A desktop with draggable windows for React. The core knows nothing about
        routes and imposes no styling: everything you see here is put there by
        this app.
      </p>
      <ul>
        <li>Double click an icon to open its window.</li>
        <li>Drag the title bar to move it, the edges to resize it.</li>
        <li>The URL follows the front window, so the link is shareable.</li>
      </ul>
    </article>
  );
}
