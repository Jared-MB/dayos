import { ARCHIVED } from "../projects";

export default function ArchivePage() {
  return (
    <article className="prose">
      <h1>Archive</h1>
      <p>
        This URL matches <code>/projects/:project</code> too. The static segment
        wins at the same depth, so what opened is this window and not a project
        window with <code>project</code> set to “archive”.
      </p>
      <ul className="document-list">
        {ARCHIVED.map(({ name, retired }) => (
          <li key={name}>
            {name} — retired {retired}
          </li>
        ))}
      </ul>
    </article>
  );
}
