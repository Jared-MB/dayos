import { notFound } from "next/navigation";
import { findProject, PROJECTS } from "../../projects";

export function generateStaticParams() {
  return PROJECTS.map(({ slug }) => ({ project: slug }));
}

export default async function NewTaskPage({
  params,
}: {
  params: Promise<{ project: string }>;
}) {
  const { project } = await params;
  const found = findProject(project);

  if (!found) notFound();

  return (
    <article className="prose">
      <h1>New task</h1>
      <p>
        In {found.name}. This route is <code>/projects/:project/new</code>: a
        param at the second segment and a literal at the third, so it beats{" "}
        <code>/projects/:project/:task</code> here while still opening one
        window per project.
      </p>
      <p>
        Open the same page under the other project and you get a second window,
        not this one reused.
      </p>
    </article>
  );
}
